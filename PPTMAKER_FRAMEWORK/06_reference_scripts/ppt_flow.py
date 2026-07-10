#!/usr/bin/env python3
"""Friendly command surface for the PPT framework.

This is the default human/agent entry point. It delegates to the structural SSOT
and production orchestrator instead of duplicating their logic.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle_layout as layout
import stage1_build_inputs as stage1
import unified_pipeline as pipeline


HERE = Path(__file__).resolve().parent
FRAMEWORK_DIR = HERE.parent


def _resolved_run_dir(value: str) -> Path:
    return Path(value).expanduser().resolve()


def _run_script(script: Path, args: list[str]) -> int:
    command = [sys.executable, str(script), *args]
    print("→ " + " ".join(str(part) for part in command), flush=True)
    return subprocess.run(command).returncode


def _metadata_fields(path: Path) -> dict[str, str]:
    fields: dict[str, str] = {}
    if not path.is_file():
        return fields
    for line in path.read_text(encoding="utf-8").splitlines():
        if ":" not in line or line.lstrip().startswith("#"):
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip()
    return fields


def update_gate(metadata_path: Path, gate: str, value: str = "approved") -> None:
    """Update one metadata gate without rewriting unrelated fields/comments."""
    key = f"{gate}_gate"
    lines = metadata_path.read_text(encoding="utf-8").splitlines() if metadata_path.exists() else []
    replacement = f"{key}: {value}"
    found = False
    for index, line in enumerate(lines):
        if line.split(":", 1)[0].strip() == key:
            lines[index] = replacement
            found = True
            break
    if not found:
        lines.append(replacement)
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def collect_status(run_dir: Path) -> dict[str, Any]:
    root = layout.deck_root(run_dir)
    generated = layout.generated_dir(run_dir)
    plan_path = generated / layout.GEN_SLIDE_PLAN
    expected = 0
    if plan_path.is_file():
        try:
            expected = len(json.loads(plan_path.read_text(encoding="utf-8")).get("slides", []))
        except (OSError, json.JSONDecodeError):
            expected = 0
    images_dir = generated / layout.GEN_IMAGES_SUBDIR
    locked_dir = generated / layout.GEN_HEADER_LOCKED_SUBDIR
    ppt_dir = generated / layout.GEN_PPT_SUBDIR
    metadata = _metadata_fields(root / layout.METADATA_FILE)
    return {
        "run_dir": str(run_dir),
        "structure_issues": layout.check_bundle(run_dir, require_pipeline_ready=False),
        "content_gate": metadata.get("content_gate", "missing"),
        "visual_gate": metadata.get("visual_gate", "missing"),
        "style_master": layout.style_asset(run_dir, layout.STYLE_MASTER_IMAGE).is_file(),
        "slide_plan": plan_path.is_file(),
        "expected_slides": expected,
        "raw_images": len(list(images_dir.glob("*.png"))) if images_dir.is_dir() else 0,
        "locked_images": len(list(locked_dir.glob("*.png"))) if locked_dir.is_dir() else 0,
        "pptx": [path.name for path in sorted(ppt_dir.glob("*.pptx"))
                 if not path.name.endswith(".backup.pptx")] if ppt_dir.is_dir() else [],
        "pilot_preview": (generated / layout.GEN_PREVIEW_SUBDIR /
                          "pilot_final_contact_sheet.jpg").is_file(),
    }


def print_status(status: dict[str, Any]) -> None:
    structure = "OK" if not status["structure_issues"] else f"{len(status['structure_issues'])} issue(s)"
    expected = status["expected_slides"] or "?"
    print(f"PPT Flow status — {status['run_dir']}")
    print(f"  Structure:     {structure}")
    print(f"  Content gate:  {status['content_gate']}")
    print(f"  Visual gate:   {status['visual_gate']}")
    print(f"  Style master:  {'ready' if status['style_master'] else 'missing'}")
    print(f"  Slide plan:    {'ready' if status['slide_plan'] else 'not built'}")
    print(f"  Raw images:    {status['raw_images']}/{expected}")
    print(f"  Locked images: {status['locked_images']}/{expected}")
    print(f"  PPTX:          {', '.join(status['pptx']) if status['pptx'] else 'not built'}")
    print(f"  Pilot preview: {'ready' if status['pilot_preview'] else 'not built'}")

    if status["structure_issues"]:
        print("\nFix first:")
        for issue in status["structure_issues"]:
            print(f"  - {issue}")
        return

    next_steps: list[str] = []
    run_dir = status["run_dir"]
    if status["content_gate"] not in {"approved", "waived"}:
        next_steps.append(f"After content review: ppt_flow.py approve {run_dir} content")
    if not status["style_master"]:
        next_steps.append(f"Generate style master: ppt_flow.py style-master {run_dir}")
    if status["visual_gate"] not in {"approved", "waived"}:
        next_steps.append(f"After visual review: ppt_flow.py approve {run_dir} visual")
    if (status["content_gate"] in {"approved", "waived"}
            and status["visual_gate"] in {"approved", "waived"}
            and status["style_master"]):
        if not status["pilot_preview"] and not status["pptx"]:
            next_steps.append(f"Create representative pilot: ppt_flow.py pilot {run_dir}")
        elif not status["pptx"]:
            next_steps.append(f"Build full deck: ppt_flow.py build {run_dir}")
    if status["pptx"]:
        next_steps.append(f"Future edits: ppt_flow.py refresh {run_dir} --kind <title|visual|notes>")
    if next_steps:
        print("\nNext:")
        for step in next_steps:
            print(f"  - {step}")


def select_pilot_slide_ids(slides: list[dict[str, Any]], count: int = 3) -> list[str]:
    """Choose opener/body/closer representatives without requiring hand-picked IDs."""
    ids = [str(slide.get("id", "")).strip() for slide in slides]
    ids = [slide_id for slide_id in ids if slide_id]
    if count < 1 or len(ids) <= count:
        return ids

    full_page = [
        index for index, slide in enumerate(slides)
        if stage1._contract_render_mode(slide.get("layout_contract", {}))
        == stage1.RENDER_MODE_FULL_PAGE
    ]
    body = [index for index in range(len(slides)) if index not in full_page]

    chosen: list[int] = []

    def add(index: int | None) -> None:
        if index is not None and index not in chosen:
            chosen.append(index)

    add(full_page[0] if full_page else 0)
    if body:
        midpoint = (len(slides) - 1) / 2
        add(min(body, key=lambda index: abs(index - midpoint)))
    add(full_page[-1] if full_page else len(slides) - 1)

    fallback = [0, len(slides) // 2, len(slides) - 1, *range(len(slides))]
    for index in fallback:
        if len(chosen) >= count:
            break
        add(index)
    return [str(slides[index]["id"]) for index in chosen[:count]]


def _render_pilot_headers(run_dir: Path, selected_ids: list[str], dry_run: bool) -> bool:
    generated = layout.generated_dir(run_dir)
    plan_path = generated / layout.GEN_SLIDE_PLAN
    plan_data = json.loads(plan_path.read_text(encoding="utf-8"))
    selected = set(selected_ids)
    slides = [slide for slide in plan_data.get("slides", []) if slide.get("id") in selected]
    slides.sort(key=lambda slide: selected_ids.index(slide["id"]))

    qa_dir = generated / layout.GEN_QA_SUBDIR
    pilot_plan = qa_dir / "pilot_slide_plan.json"
    pilot_images = qa_dir / "pilot_header_locked"
    preview = generated / layout.GEN_PREVIEW_SUBDIR / "pilot_final_contact_sheet.jpg"
    if not dry_run:
        qa_dir.mkdir(parents=True, exist_ok=True)
        if pilot_images.exists():
            shutil.rmtree(pilot_images)
        pilot_images.mkdir(parents=True)
        pilot_plan.write_text(
            json.dumps({"slides": slides}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    stage3_args = [
        "--images", str(generated / layout.GEN_IMAGES_SUBDIR),
        "--slide-plan", str(pilot_plan),
        "--out", str(pilot_images),
        "--color-palette", str(layout.style_asset(run_dir, layout.COLOR_PALETTE_FILE)),
    ]
    if not pipeline.run_stage(
            pipeline.STAGE3_SCRIPT, stage3_args, "Pilot QA: Final Header-Locked Pages", dry_run):
        return False

    contact_script = pipeline.find_contact_sheet_script()
    if contact_script is None:
        print("✗ Contact-sheet script not found in image2-ppt skill.")
        return False
    contact_args = [
        "--image-dir", str(pilot_images),
        "--out", str(preview),
        "--columns", str(min(3, len(selected_ids))),
    ]
    return pipeline.run_stage(
        contact_script, contact_args, "Pilot QA: Final Contact Sheet", dry_run)


def command_init(args: argparse.Namespace) -> int:
    deck_dir = Path(args.deck_dir).expanduser().resolve()
    if not deck_dir.name.startswith("deck_"):
        print("✗ Deck directory must start with 'deck_'.")
        return 1
    if FRAMEWORK_DIR == deck_dir or FRAMEWORK_DIR in deck_dir.parents:
        print("✗ A run bundle must live outside _ppt_framework_v1/.")
        return 1
    try:
        log = layout.init_bundle(
            deck_dir, framework_dir=FRAMEWORK_DIR,
            deck_type=args.deck_type, style=args.style)
    except ValueError as exc:
        print(f"✗ {exc}")
        return 1
    print(f"✓ Initialized {deck_dir}")
    for line in log:
        print(f"  - {line}")
    print(f"\nNext: {Path(__file__).name} status {deck_dir / layout.VERSIONS_DIR / 'v1'}")
    return 0


def command_status(args: argparse.Namespace) -> int:
    run_dir = _resolved_run_dir(args.run_dir)
    status = collect_status(run_dir)
    if args.json:
        print(json.dumps(status, ensure_ascii=False, indent=2))
    else:
        print_status(status)
    return 1 if status["structure_issues"] else 0


def command_approve(args: argparse.Namespace) -> int:
    run_dir = _resolved_run_dir(args.run_dir)
    issues = layout.check_bundle(run_dir, require_pipeline_ready=False)
    if issues:
        print_status(collect_status(run_dir))
        return 1
    value = "waived" if args.waive else "approved"
    metadata = layout.deck_root(run_dir) / layout.METADATA_FILE
    update_gate(metadata, args.gate, value)
    print(f"✓ {args.gate}_gate: {value} ({metadata})")
    return 0


def command_style_master(args: argparse.Namespace) -> int:
    script_args = ["--run-dir", str(_resolved_run_dir(args.run_dir)),
                   "--resolution", args.resolution]
    if args.model:
        script_args.extend(["--model", args.model])
    if args.base_url:
        for base_url in args.base_url:
            script_args.extend(["--base-url", base_url])
    if args.force:
        script_args.append("--force")
    if args.dry_run:
        script_args.append("--dry-run")
    return _run_script(HERE / "generate_style_master.py", script_args)


def command_validate(args: argparse.Namespace) -> int:
    run_dir = _resolved_run_dir(args.run_dir)
    issues = layout.check_bundle(run_dir, require_pipeline_ready=False)
    if issues:
        print_status(collect_status(run_dir))
        return 1
    specs = layout.find_slide_specs(run_dir)
    if specs is None:
        print(f"✗ No {layout.SLIDE_SPECS_GLOB} found in {run_dir}")
        return 1
    return _run_script(HERE / "stage1_build_inputs.py", ["--validate", "--input", str(specs)])


def command_pilot(args: argparse.Namespace) -> int:
    run_dir = _resolved_run_dir(args.run_dir)
    if args.count < 1:
        print("✗ --count must be at least 1.")
        return 1
    if not pipeline.validate_run_dir(run_dir, require_ready=False):
        return 1
    layout.load_dotenv(layout.deck_root(run_dir), Path.cwd(), *Path.cwd().parents)
    if not pipeline.stage1(run_dir, args.dry_run):
        return 1

    plan_path = layout.generated_dir(run_dir) / layout.GEN_SLIDE_PLAN
    if args.dry_run and not plan_path.exists():
        print("  [DRY RUN] Pilot IDs will be auto-selected after Stage 1 creates slide_plan.json.")
        return 0
    plan = json.loads(plan_path.read_text(encoding="utf-8")).get("slides", [])
    selected_ids = ([item.strip() for item in args.only.split(",") if item.strip()]
                    if args.only else select_pilot_slide_ids(plan, args.count))
    known = {slide.get("id") for slide in plan}
    unknown = [slide_id for slide_id in selected_ids if slide_id not in known]
    if unknown:
        print(f"✗ Unknown pilot slide IDs: {', '.join(unknown)}")
        return 1
    print(f"Pilot slides: {', '.join(selected_ids)}")

    if not pipeline.validate_run_dir(run_dir, require_ready=True):
        return 1
    if not pipeline.stage2(
            run_dir, base_url=args.base_url, only=",".join(selected_ids),
            force_images=True, resolution=args.resolution, dry_run=args.dry_run):
        return 1
    if not _render_pilot_headers(run_dir, selected_ids, args.dry_run):
        return 1
    if not args.dry_run:
        preview = (layout.generated_dir(run_dir) / layout.GEN_PREVIEW_SUBDIR /
                   "pilot_final_contact_sheet.jpg")
        print(f"\n✓ Pilot ready: {preview}")
    return 0


def command_build(args: argparse.Namespace) -> int:
    script_args = [
        "--run-dir", str(_resolved_run_dir(args.run_dir)),
        "--stage", "all",
        "--resolution", args.resolution,
    ]
    if not args.reuse_images:
        script_args.append("--force-images")
    if args.base_url:
        script_args.extend(["--base-url", args.base_url])
    if args.dry_run:
        script_args.append("--dry-run")
    return _run_script(HERE / "unified_pipeline.py", script_args)


def command_refresh(args: argparse.Namespace) -> int:
    run_dir = str(_resolved_run_dir(args.run_dir))
    if args.kind == "title":
        if args.only or args.all:
            print("✗ --only/--all apply only to --kind visual.")
            return 1
        stages = "1,3,4,5"
    elif args.kind == "notes":
        if args.only or args.all:
            print("✗ --only/--all apply only to --kind visual.")
            return 1
        stages = "5"
    else:
        if not args.only and not args.all:
            print("✗ Visual refresh needs --only slide_id[,slide_id] or explicit --all.")
            return 1
        stages = "1,2,3,4,5"

    script_args = ["--run-dir", run_dir, "--stage", stages, "--resolution", args.resolution]
    if args.only:
        script_args.extend(["--only", args.only])
    if args.all:
        script_args.append("--force-images")
    if args.base_url:
        script_args.extend(["--base-url", args.base_url])
    if args.dry_run:
        script_args.append("--dry-run")
    return _run_script(HERE / "unified_pipeline.py", script_args)


def command_new_version(args: argparse.Namespace) -> int:
    try:
        target = layout.create_version(_resolved_run_dir(args.run_dir), args.name)
    except ValueError as exc:
        print(f"✗ {exc}")
        return 1
    print(f"✓ Created clean version: {target}")
    print(f"  Generated artifacts were not copied.")
    return 0


def command_test(args: argparse.Namespace) -> int:
    return _run_script(HERE / "run_tests.py", [])


def command_doctor(args: argparse.Namespace) -> int:
    return _run_script(FRAMEWORK_DIR / "00_project_setup" / "00-auto-env-check.py", [])


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="One friendly entry point for the complete PPT workflow.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    doctor = subparsers.add_parser("doctor", help="Check Python, uv, dependencies, and credentials")
    doctor.set_defaults(func=command_doctor)

    init = subparsers.add_parser("init", help="Create a conformant run bundle")
    init.add_argument("deck_dir", help="Target deck directory (must start with deck_)")
    init.add_argument("--deck-type", choices=sorted(layout.DECK_TYPE_TEMPLATES), required=True)
    init.add_argument("--style", choices=sorted(layout.STYLE_PRESETS), required=True)
    init.set_defaults(func=command_init)

    status = subparsers.add_parser("status", help="Show gates, artifacts, and next action")
    status.add_argument("run_dir")
    status.add_argument("--json", action="store_true")
    status.set_defaults(func=command_status)

    approve = subparsers.add_parser("approve", help="Record a reviewed content/visual gate")
    approve.add_argument("run_dir")
    approve.add_argument("gate", choices=["content", "visual"])
    approve.add_argument("--waive", action="store_true",
                         help="Record an explicit user decision to skip this gate")
    approve.set_defaults(func=command_approve)

    style = subparsers.add_parser("style-master", help="Generate the visual style anchor")
    style.add_argument("run_dir")
    style.add_argument("--resolution", choices=["1k", "2k", "4k"], default="2k")
    style.add_argument("--model", default="gpt-image-2")
    style.add_argument("--base-url", action="append")
    style.add_argument("--force", action="store_true")
    style.add_argument("--dry-run", action="store_true")
    style.set_defaults(func=command_style_master)

    validate = subparsers.add_parser("validate", help="Validate slide specs before image generation")
    validate.add_argument("run_dir")
    validate.set_defaults(func=command_validate)

    pilot = subparsers.add_parser("pilot", help="Auto-select and build representative pages")
    pilot.add_argument("run_dir")
    pilot.add_argument("--only", help="Optional comma-separated slide IDs")
    pilot.add_argument("--count", type=int, default=3)
    pilot.add_argument("--resolution", choices=["1k", "2k", "4k"], default="1k")
    pilot.add_argument("--base-url")
    pilot.add_argument("--dry-run", action="store_true")
    pilot.set_defaults(func=command_pilot)

    build = subparsers.add_parser("build", help="Build the complete final deck")
    build.add_argument("run_dir")
    build.add_argument("--resolution", choices=["1k", "2k", "4k"], default="2k")
    build.add_argument("--base-url")
    build.add_argument("--reuse-images", action="store_true",
                       help="Reuse existing Stage-2 images instead of refreshing at final resolution")
    build.add_argument("--dry-run", action="store_true")
    build.set_defaults(func=command_build)

    refresh = subparsers.add_parser("refresh", help="Run the smallest safe edit chain")
    refresh.add_argument("run_dir")
    refresh.add_argument("--kind", choices=["title", "visual", "notes"], default="visual")
    refresh.add_argument("--only", help="For visual: comma-separated slide IDs")
    refresh.add_argument("--all", action="store_true", help="For visual: explicitly refresh all pages")
    refresh.add_argument("--resolution", choices=["1k", "2k", "4k"], default="2k")
    refresh.add_argument("--base-url")
    refresh.add_argument("--dry-run", action="store_true")
    refresh.set_defaults(func=command_refresh)

    version = subparsers.add_parser("new-version", help="Create a clean downstream version")
    version.add_argument("run_dir")
    version.add_argument("--name", help="Explicit version name, e.g. v3")
    version.set_defaults(func=command_new_version)

    test = subparsers.add_parser("test", help="Run all framework checks")
    test.set_defaults(func=command_test)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())
