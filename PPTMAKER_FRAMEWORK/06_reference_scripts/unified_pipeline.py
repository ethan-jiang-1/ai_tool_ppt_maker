#!/usr/bin/env python3
"""
Unified pipeline orchestrator for _ppt_framework.

Single entry point that delegates to the appropriate scripts for each stage.
Reads configuration from the run bundle and handles stage-to-stage handoffs.

The run-bundle directory structure is defined ONLY in `bundle_layout.py` (the
single source of truth) — this orchestrator imports it and never restates paths.
Run `python bundle_layout.py` to print the canonical tree. In short: a deck is a
three-tier gradient (1_upstream_raw_material / 2_backbone / 3_versions); --run-dir
is a version dir `deck_<name>/3_versions/v1`; downstream draws from the shared
backbone but a version's overrides/ win over it; all artifacts go under _generated/.

Usage:
    # Run all 5 stages
    uv run python unified_pipeline.py --run-dir deck_myproject/3_versions/v1 --stage all

    # Run a single stage (for editing chain reruns)
    uv run python unified_pipeline.py --run-dir deck_myproject/3_versions/v1 --stage 3

    # Run with custom API base URL
    uv run python unified_pipeline.py --run-dir deck_myproject/3_versions/v1 --stage all --base-url https://api.example.com/v1

    # Dry run (print what would be executed)
    uv run python unified_pipeline.py --run-dir deck_myproject/3_versions/v1 --stage all --dry-run

Editing chains (after initial production):
    Chain A (title text only):  --stage 1,3,4,5
    Chain B (image/visual):     --stage 1,2,3,4,5
    Chain C (speaker notes):    --stage 5
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

# The run-bundle directory structure is defined in ONE place: bundle_layout.py.
# Import it; never restate paths here. (See bundle_layout.py's module docstring.)
sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle_layout as layout


# --- Configuration ---

FRAMEWORK_DIR = Path(__file__).resolve().parent.parent
REFERENCE_SCRIPTS_DIR = FRAMEWORK_DIR / "06_reference_scripts"

# Stage 1: Parse markdown to JSON (uses reference script)
STAGE1_SCRIPT = REFERENCE_SCRIPTS_DIR / "stage1_build_inputs.py"

# Stage 3: Header-Lock (uses reference script)
STAGE3_SCRIPT = REFERENCE_SCRIPTS_DIR / "stage3_lock_headers.py"

# Stage 4: Build PPTX (uses reference script)
STAGE4_SCRIPT = REFERENCE_SCRIPTS_DIR / "stage4_build_pptx.py"

# Stage 5: Inject notes (uses reference script)
STAGE5_SCRIPT = REFERENCE_SCRIPTS_DIR / "stage5_inject_notes.py"


def find_skill_script(relative_paths: list[str]) -> Path | None:
    """Find a skill script by searching common skill directory locations."""
    search_roots = []

    # Project-level skills. Include the framework's parent even when the command is
    # launched from an external deck directory.
    project_bases = [FRAMEWORK_DIR.parent]
    cwd = Path.cwd()
    project_bases.extend([cwd] + list(cwd.parents))
    for parent in project_bases:
        for skills_dir in [".claude/skills", ".agents/skills"]:
            candidate = parent / skills_dir
            if candidate.is_dir() and candidate not in search_roots:
                search_roots.append(candidate)

    # Global skills
    home = Path.home()
    for skills_dir in [".claude/skills", ".agents/skills"]:
        candidate = home / skills_dir
        if candidate.is_dir():
            search_roots.append(candidate)

    for root in search_roots:
        for rel in relative_paths:
            candidate = root / rel
            if candidate.is_file():
                return candidate

    return None


def find_stage2_script() -> Path | None:
    """Find the stage 2 image generation script (from skill layer)."""
    return find_skill_script([
        "image2-ppt/scripts/generate_full_page_images.py",
    ])


def find_contact_sheet_script() -> Path | None:
    return find_skill_script([
        "image2-ppt/scripts/make_contact_sheet.py",
    ])


def load_json(path: Path) -> dict:
    """Load a JSON file."""
    with open(path) as f:
        return json.load(f)


def write_prompt_subset(source: Path, target: Path, selected_ids: list[str]) -> Path:
    """Write a canonical prompt manifest containing only selected slide IDs."""
    prompt_data = load_json(source)
    selected = set(selected_ids)
    filtered = [slide for slide in prompt_data.get("slides", [])
                if slide.get("id") in selected]
    found = {slide.get("id") for slide in filtered}
    missing = [slide_id for slide_id in selected_ids if slide_id not in found]
    if missing:
        raise ValueError(f"unknown slide IDs: {', '.join(missing)}")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(
        json.dumps({"slides": filtered}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return target


def run_stage(script: Path, args: list[str], stage_name: str, dry_run: bool = False) -> bool:
    """Run a pipeline stage script. Returns True on success."""
    cmd = [sys.executable, str(script)] + args
    cmd_str = " ".join(str(c) for c in cmd)

    print(f"\n{'=' * 60}")
    print(f"  Stage: {stage_name}")
    print(f"  Command: {cmd_str}")
    print(f"{'=' * 60}\n")

    if dry_run:
        print("  [DRY RUN] Would execute the above command.\n")
        return True

    result = subprocess.run(cmd)
    if result.returncode != 0:
        print(f"\n  ✗ Stage {stage_name} FAILED (exit code {result.returncode})")
        return False

    print(f"\n  ✓ Stage {stage_name} completed successfully.")
    return True


def stage1(run_dir: Path, dry_run: bool = False) -> bool:
    """Stage 1: Parse the slide-specifications markdown to JSON specs."""
    input_file = layout.find_slide_specs(run_dir)
    if not input_file:
        print(f"  ✗ No {layout.SLIDE_SPECS_GLOB} found in {run_dir}")
        return False

    print(f"  Input: {input_file}")

    build_dir = layout.generated_dir(run_dir)
    if not dry_run:
        build_dir.mkdir(parents=True, exist_ok=True)

    # Outputs go to _generated/; visual-style (deck_system.txt) is read from the
    # override-aware backbone dir, so --out-dir and --style-dir are decoupled.
    args = [
        "--input", str(input_file),
        "--out-dir", str(build_dir),
        "--deck-system", str(layout.style_asset(run_dir, layout.DECK_SYSTEM_FILE)),
        "--color-palette", str(layout.style_asset(run_dir, layout.COLOR_PALETTE_FILE)),
    ]
    return run_stage(STAGE1_SCRIPT, args, "Stage 1: Build Inputs", dry_run)


def stage2(run_dir: Path, base_url: str | None = None, only: str | None = None,
           force_images: bool = False, resolution: str = "2k",
           dry_run: bool = False) -> bool:
    """Stage 2: Generate images with style anchoring."""
    script = find_stage2_script()
    if script is None:
        print("  ✗ Stage 2 script not found. Looking for:")
        print("    image2-ppt/scripts/generate_full_page_images.py")
        print("    in .claude/skills/ or .agents/skills/ (project or global).")
        return False

    build_dir = layout.generated_dir(run_dir)
    prompts_file = build_dir / layout.GEN_PROMPTS_SUBDIR / layout.GEN_PROMPTS_JSON
    if not prompts_file.exists() and not dry_run:
        print(f"  ✗ {prompts_file} not found. Run Stage 1 first.")
        return False

    style_master = layout.style_asset(run_dir, layout.STYLE_MASTER_IMAGE)
    if not style_master.exists() and not dry_run:
        print(f"  ✗ {style_master} not found. Generate {layout.STYLE_MASTER_IMAGE} first.")
        return False

    out_dir = build_dir / layout.GEN_IMAGES_SUBDIR
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    # Bridge the generic OpenAI-compatible credentials the framework documents
    # (OPENAI_API_KEY / OPENAI_BASE_URL) to whatever the underlying Stage-2 skill
    # natively reads. The current image2-ppt skill keys off APIMART_API_KEY and
    # takes the endpoint via --base-url, so: alias the key if only the generic one
    # is set, and resolve the base URL from the CLI flag or either env var. This is
    # why a published user only needs the two OPENAI_* vars in .env, regardless of
    # which OpenAI-compatible relay they use.
    if "APIMART_API_KEY" not in os.environ and os.environ.get("OPENAI_API_KEY"):
        os.environ["APIMART_API_KEY"] = os.environ["OPENAI_API_KEY"]
    resolved_base = (base_url or os.environ.get("OPENAI_BASE_URL")
                     or os.environ.get("APIMART_BASE_URL"))

    args = [
        "--prompt-json", str(prompts_file),
        "--out-dir", str(out_dir),
        "--resolution", resolution,
        "--style-reference", str(style_master),
        "--prompt-is-final",
    ]

    if resolved_base:
        args.extend(["--base-url", resolved_base])

    selected_ids: list[str] = []
    if only:
        # The user passes --only as a comma-separated list, but the Stage-2 skill
        # declares --only as action="append" (one id per flag) and rejects any token
        # it doesn't recognize. Forwarding the raw "p05,p06" string made it treat
        # "p05,p06" as a single unknown id and hard-fail. Split and repeat the flag.
        for slide_id in only.split(","):
            slide_id = slide_id.strip()
            if slide_id:
                selected_ids.append(slide_id)
                args.extend(["--only", slide_id])

    # An explicit --only means "refresh these pages", not "select them and then
    # silently skip because old files exist". Full-deck refresh remains opt-in.
    if force_images or only:
        args.append("--force")

    if not run_stage(script, args, "Stage 2: Generate Images", dry_run):
        return False

    contact_script = find_contact_sheet_script()
    if contact_script is None:
        print("  ✗ Contact-sheet script not found in image2-ppt skill.")
        return False
    preview_dir = build_dir / layout.GEN_PREVIEW_SUBDIR
    if not dry_run:
        preview_dir.mkdir(parents=True, exist_ok=True)
    contact_prompts = prompts_file
    contact_name = "contact_sheet.jpg"
    if selected_ids and not dry_run:
        contact_prompts = preview_dir / "_pilot_prompts.json"
        try:
            write_prompt_subset(prompts_file, contact_prompts, selected_ids)
        except ValueError as exc:
            print(f"  ✗ Cannot build pilot contact sheet; {exc}")
            return False
        contact_name = "pilot_contact_sheet.jpg"

    contact_args = [
        "--image-dir", str(out_dir),
        "--prompt-json", str(contact_prompts),
        "--out", str(preview_dir / contact_name),
        "--columns", "4",
    ]
    return run_stage(contact_script, contact_args, "Stage 2 QA: Contact Sheet", dry_run)


def stage3(run_dir: Path, dry_run: bool = False) -> bool:
    """Stage 3: Lock headers (Python/Pillow text overlay)."""
    build_dir = layout.generated_dir(run_dir)
    images_dir = build_dir / layout.GEN_IMAGES_SUBDIR
    slide_plan = build_dir / layout.GEN_SLIDE_PLAN

    if not dry_run:
        if not images_dir.is_dir() or not list(images_dir.glob("*.png")):
            print(f"  ✗ No images found in {images_dir}. Run Stage 2 first.")
            return False
        if not slide_plan.exists():
            print(f"  ✗ {slide_plan} not found. Run Stage 1 first.")
            return False

        # Validate image count matches expected slide count. NOTE: this is only an
        # early heads-up — stage3_lock_headers.resolve_images fail-loud ABORTS if any
        # slide lacks its image (it does not build a partial deck). So warn, but don't
        # claim we'll proceed.
        plan_data = load_json(slide_plan)
        expected = len(plan_data.get("slides", []))
        actual = len(list(images_dir.glob("*.png")))
        if actual < expected:
            print(f"  ⚠  Image count mismatch: {actual} images found, {expected} slides expected.")
            print(f"  Stage 2 likely failed partway — re-run --stage 2 to generate the missing images.")
            print(f"  Stage 3 will abort (not build a partial deck) until every slide has an image.")

    out_dir = build_dir / layout.GEN_HEADER_LOCKED_SUBDIR
    if not dry_run:
        out_dir.mkdir(parents=True, exist_ok=True)

    # slide_plan lives in _generated/, so stage3 can't derive style/ from its parent.
    # Pass the override-aware backbone visual-style dir explicitly (color_palette.json lives there).
    args = [
        "--images", str(images_dir),
        "--slide-plan", str(slide_plan),
        "--out", str(out_dir),
        "--color-palette", str(layout.style_asset(run_dir, layout.COLOR_PALETTE_FILE)),
    ]
    return run_stage(STAGE3_SCRIPT, args, "Stage 3: Lock Headers", dry_run)


def stage4(run_dir: Path, dry_run: bool = False) -> bool:
    """Stage 4: Build PPTX container."""
    build_dir = layout.generated_dir(run_dir)
    images_dir = build_dir / layout.GEN_HEADER_LOCKED_SUBDIR
    slide_plan = build_dir / layout.GEN_SLIDE_PLAN

    if not dry_run:
        if not images_dir.is_dir() or not list(images_dir.glob("*.png")):
            print(f"  ✗ No images found in {images_dir}. Run Stage 3 first.")
            return False
        if not slide_plan.exists():
            print(f"  ✗ {slide_plan} not found. Run Stage 1 first.")
            return False

    ppt_dir = build_dir / layout.GEN_PPT_SUBDIR
    if not dry_run:
        ppt_dir.mkdir(parents=True, exist_ok=True)

    # Deck name derives from the DECK ROOT (deck_mypitch/3_versions/v1 -> "mypitch"),
    # NOT run_dir.parent (which is "3_versions"). See bundle_layout.deck_name.
    name = layout.deck_name(run_dir)

    args = [
        "--images", str(images_dir),
        "--slide-plan", str(slide_plan),
        "--out", str(ppt_dir / f"{name}.pptx"),
        "--title", name.replace("_", " ").title(),
    ]
    return run_stage(STAGE4_SCRIPT, args, "Stage 4: Build PPTX", dry_run)


def stage5(run_dir: Path, dry_run: bool = False) -> bool:
    """Stage 5: Inject speaker notes into PPTX."""
    ppt_dir = layout.generated_dir(run_dir) / layout.GEN_PPT_SUBDIR

    # Speaker notes come from the per-slide spec markdown (in the version dir).
    input_file = layout.find_slide_specs(run_dir)
    if not input_file:
        print(f"  ✗ No {layout.SLIDE_SPECS_GLOB} found in {run_dir}")
        return False

    if dry_run:
        # Nothing generated yet during a dry run; show the intended target.
        pptx_file = ppt_dir / "<deck_name>.pptx"
        args = ["--pptx", str(pptx_file), "--input", str(input_file)]
        return run_stage(STAGE5_SCRIPT, args, "Stage 5: Inject Notes", dry_run)

    pptx_files = sorted(ppt_dir.glob("*.pptx"))
    pptx_files = [p for p in pptx_files if not p.name.endswith(".backup.pptx")]
    if not pptx_files:
        print(f"  ✗ No .pptx found in {ppt_dir}. Run Stage 4 first.")
        return False

    if len(pptx_files) > 1:
        print(f"  ⚠  {len(pptx_files)} .pptx files in {ppt_dir}; using {pptx_files[0].name}. "
              f"Remove strays so the target is unambiguous.")
    pptx_file = pptx_files[0]

    # Back up the pre-notes deck — but never CLOBBER an existing backup, or a second
    # Stage-5 run would overwrite the clean images-only backup with the already-
    # notes-injected deck, destroying the recoverable pre-notes state.
    backup = pptx_file.with_suffix(".backup.pptx")
    if backup.exists():
        print(f"  Keeping existing backup {backup.name} (not overwriting).")
    else:
        print(f"  Backing up PPTX to {backup}")
        shutil.copy2(pptx_file, backup)

    args = [
        "--pptx", str(pptx_file),
        "--input", str(input_file),
    ]
    return run_stage(STAGE5_SCRIPT, args, "Stage 5: Inject Notes", dry_run)


def validate_run_dir(run_dir: Path, require_ready: bool = True) -> bool:
    """Enforce the run-bundle constitution before doing anything.

    Delegates to bundle_layout.check_bundle (the single enforcement point). Any
    deviation from the canonical structure aborts the run. `require_ready` toggles
    Stage-2 readiness: style_master.jpg plus recorded content/visual gate decisions.
    Cheap authoring reruns (e.g. Stage 1 or 5) do not demand them.
    """
    violations = layout.check_bundle(run_dir, require_pipeline_ready=require_ready)
    if violations:
        print(f"  ✗ Bundle does NOT conform to the structure (宪法) — {len(violations)} violation(s):")
        for v in violations:
            print(f"      - {v}")
        print("  The directory structure is the constitution. Fix the above, then rerun.")
        print("  Canonical structure:  python _ppt_framework_v1/06_reference_scripts/bundle_layout.py")
        return False
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Unified PPT production pipeline for _ppt_framework",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --run-dir deck_mypitch/3_versions/v1 --stage all
  %(prog)s --run-dir deck_mypitch/3_versions/v1 --stage 2 --only slide_05
  %(prog)s --run-dir deck_mypitch/3_versions/v1 --stage all --dry-run
  %(prog)s --run-dir deck_mypitch/3_versions/v1 --stage 5
        """,
    )
    parser.add_argument("--run-dir", required=True,
                        help="Path to a version dir (e.g., deck_xxx/3_versions/v1)")
    parser.add_argument("--stage", required=True,
                        help="Stage to run: all, 1, 2, 3, 4, 5, or comma-separated (e.g., 1,3,4)")
    parser.add_argument("--base-url", help="Override API base URL for Stage 2")
    parser.add_argument("--only", help="Only process specific slide IDs (Stage 2, comma-separated)")
    parser.add_argument("--force-images", action="store_true",
                        help="Regenerate all selected Stage-2 images even if files exist")
    parser.add_argument("--resolution", choices=["1k", "2k", "4k"], default="2k",
                        help="Stage-2 image resolution (default: 2k; use 1k for pilots)")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be executed without running")

    args = parser.parse_args()
    run_dir = Path(args.run_dir).resolve()

    # Load credentials from .env into os.environ so the API key + base URL reach
    # Stage 2's subprocess. Search deck root first (the documented home), then cwd
    # and its parents — a SUPERSET of env-check's search so the two never disagree
    # (env-check greenlighting a key the pipeline then can't find). Explicit env wins.
    env_loaded = layout.load_dotenv(layout.deck_root(run_dir), Path.cwd(), *Path.cwd().parents)
    if env_loaded:
        print(f"Loaded credentials from {env_loaded}")

    # Parse stages first — the structure gate only needs to require the Phase-2
    # Stage-2 assets and human gate decisions only when Stage 2 is in the run.
    if args.stage == "all":
        stages = [1, 2, 3, 4, 5]
    else:
        stages = [int(s.strip()) for s in args.stage.split(",")]
    for s in stages:
        if s not in (1, 2, 3, 4, 5):
            print(f"  ✗ Invalid stage: {s}. Must be 1-5.")
            sys.exit(1)

    if not validate_run_dir(run_dir, require_ready=(2 in stages)):
        sys.exit(1)

    print(f"Pipeline: {run_dir}")
    print(f"Stages: {stages}")
    if args.dry_run:
        print("Mode: DRY RUN (no execution)")
    print()

    stage_funcs = {
        1: lambda: stage1(run_dir, args.dry_run),
        2: lambda: stage2(run_dir, args.base_url, args.only, args.force_images,
                          args.resolution, args.dry_run),
        3: lambda: stage3(run_dir, args.dry_run),
        4: lambda: stage4(run_dir, args.dry_run),
        5: lambda: stage5(run_dir, args.dry_run),
    }

    for stage_num in stages:
        success = stage_funcs[stage_num]()
        if not success:
            print(f"\n  Pipeline stopped at Stage {stage_num}.")
            print(f"  Fix the issue above and re-run with: --stage {stage_num}")
            sys.exit(1)

    print(f"\n{'=' * 60}")
    print(f"  Pipeline complete. Output: {layout.generated_dir(run_dir) / layout.GEN_PPT_SUBDIR}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
