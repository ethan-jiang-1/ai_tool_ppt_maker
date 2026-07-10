#!/usr/bin/env python3
"""
bundle_layout.py — THE SINGLE SOURCE OF TRUTH for the run-bundle directory structure.

Everything that needs to know "where does X live in a run bundle" imports from here:
- the pipeline scripts (unified_pipeline.py) build every path from these constants;
- the docs are generated/validated against `render_tree()` so they can never drift.

If you want to change the run-bundle layout, change it HERE and nowhere else. Do not
hardcode bundle paths in any other script or restate the tree by hand in any doc —
that is exactly the fragmentation this file exists to prevent.

--------------------------------------------------------------------------------
The layout — a three-tier change-frequency gradient
--------------------------------------------------------------------------------

    deck_<name>/                       the deck (one evolving entity)
    ├── deck-guide.md                  read-first control-flow doc (human + agent)
    ├── CLAUDE.md                      1-line pointer to deck-guide.md (auto-load)
    ├── project-metadata.yaml          topic / audience / language / north-star
    │
    ├── 1_upstream_raw_material/       UPSTREAM  · raw research/material · shared · append-mostly
    │
    ├── 2_backbone/                    MIDSTREAM · 主干 / default source-of-truth · shared · stable
    │   ├── core-metaphor.md
    │   ├── core-formula.md
    │   ├── design-constraints.md
    │   ├── outline.md
    │   ├── manuscript/
    │   └── visual-style/
    │       ├── style-master-prompt.md   the prompt that GENERATES style_master
    │       ├── style_master.jpg
    │       ├── deck_system.txt
    │       └── color_palette.json
    │
    └── 3_versions/
        └── v1/                        DOWNSTREAM delta · one design iteration · --run-dir
            ├── slide-specifications.md  per-slide 4-layer specs (pipeline input)
            ├── overrides/               only what THIS version changes vs backbone
            │   └── visual-style/ · manuscript/
            └── _generated/              GENERATED · never hand-edit · rm -rf & rerun
                ├── slide_plan.json
                ├── page_prompts/{NN_id.prompt.md, _prompts.json}
                ├── page_images_full/{NN_id.png, NN_id.apimart-task.json}
                ├── header_locked/NN_id.png
                ├── ppt/<name>.pptx (+ .backup.pptx)
                ├── qa/
                └── preview/contact_sheet.jpg

Rules encoded here:
- A "version" (deck_<name>/3_versions/vN) is the DOWNSTREAM delta only. Create one
  with `--new-version`; it copies slide-specifications.md + overrides/ but never
  `_generated/`. Backbone & upstream are referenced, never copied.
- Override precedence: for any backbone asset, a version's overrides/<relpath> wins
  if present, else the backbone default is used (see resolve_backbone_asset).
- Deck name (for the .pptx) derives from the deck root dir, two levels above a version.
"""

from __future__ import annotations

import os
import re
from pathlib import Path

# --- Top-level bundle dirs (relative to deck_<name>/) ------------------------
UPSTREAM_DIR = "1_upstream_raw_material"   # shared upstream: raw material / research
BACKBONE_DIR = "2_backbone"                # shared midstream: default source-of-truth
VERSIONS_DIR = "3_versions"                # downstream: one subdir per version (v1, v2, …)

# Root bundle files
GUIDE_FILE = "deck-guide.md"               # human+agent control-flow doc (read first)
POINTER_FILE = "CLAUDE.md"                 # 1-line pointer to GUIDE_FILE (Claude Code auto-load)
METADATA_FILE = "project-metadata.yaml"

# --- Inside 2_backbone/ ------------------------------------------------------
BACKBONE_METAPHOR = "core-metaphor.md"
BACKBONE_FORMULA = "core-formula.md"
BACKBONE_CONSTRAINTS = "design-constraints.md"
BACKBONE_OUTLINE = "outline.md"
BACKBONE_MANUSCRIPT_SUBDIR = "manuscript"
BACKBONE_STYLE_SUBDIR = "visual-style"     # also the relpath used for override lookup

# --- Inside 2_backbone/visual-style/ (or a version override of it) -----------
STYLE_MASTER_PROMPT = "style-master-prompt.md"   # source: the prompt that makes style_master
STYLE_MASTER_IMAGE = "style_master.jpg"          # image-2 output; required by Stage 2
DECK_SYSTEM_FILE = "deck_system.txt"             # textual constraints; read by Stage 1
COLOR_PALETTE_FILE = "color_palette.json"        # colors + header-lock sizes; read by Stage 3

# --- Inside a version dir (deck_<name>/3_versions/vN) ------------------------
SLIDE_SPECS_NAME = "slide-specifications.md"      # canonical per-slide spec filename
SLIDE_SPECS_GLOB = "slide-specifications*.md"     # pipeline input (per-slide 4-layer specs)
OVERRIDES_SUBDIR = "overrides"                    # this version's deviations from backbone
GENERATED_SUBDIR = "_generated"                   # all pipeline artifacts (never hand-edit)

# --- Inside a version's _generated/ ------------------------------------------
GEN_SLIDE_PLAN = "slide_plan.json"               # Stage 1 → read by Stage 3, 4
GEN_PROMPTS_SUBDIR = "page_prompts"              # Stage 1 → read by Stage 2
GEN_PROMPTS_JSON = "_prompts.json"               #   machine format (inside page_prompts/)
GEN_IMAGES_SUBDIR = "page_images_full"           # Stage 2 → read by Stage 3
GEN_HEADER_LOCKED_SUBDIR = "header_locked"       # Stage 3 → read by Stage 4
GEN_PPT_SUBDIR = "ppt"                           # Stage 4-5 → final deliverable
GEN_QA_SUBDIR = "qa"                             # optional
GEN_PREVIEW_SUBDIR = "preview"                   # optional (contact sheets; Python-made, no prompt)

# Trace sidecar written next to each generated image (the as-sent prompt + meta).
# This MUST match the suffix the Stage-2 image skill actually writes — the current
# image2-ppt skill (APIMart backend) writes "<image>.apimart-task.json", and the
# whitelist below allows exactly that. If you swap the image backend to one that
# writes a different trace suffix, change it here (single source) and the whitelist
# + tree docs follow.
IMAGE_TRACE_SUFFIX = ".apimart-task.json"


# --- CANONICAL STRUCTURE (the ONE data source) -------------------------------
# render_tree(), check_bundle() (whitelist), and init_bundle() ALL derive from
# the tables below. This is what makes the SSOT self-consistent: to add/rename a
# canonical entry you edit ONE place here, and the tree + enforcement + scaffolder
# stay in lockstep. (The earlier outline.md drift happened because these three
# kept separate hand-written lists — never again.)

# 2_backbone/ canonical FILES → seed template (framework-relative) or None (stub).
# init_bundle seeds each; check_bundle allows exactly these (+ subdirs + optional).
BACKBONE_FILE_SEEDS: dict[str, str | None] = {
    BACKBONE_METAPHOR:    "02_content_design/template-core-metaphor.md",
    BACKBONE_FORMULA:     "02_content_design/template-core-formula.md",
    BACKBONE_CONSTRAINTS: "02_content_design/template-design-constraints.md",
    BACKBONE_OUTLINE:     None,   # no template yet → init writes a short stub
}
# 2_backbone/ canonical SUBDIRS.
BACKBONE_SUBDIRS = [BACKBONE_MANUSCRIPT_SUBDIR, BACKBONE_STYLE_SUBDIR]
# Allowed-but-not-seeded in 2_backbone/ (hand-authored, optional).
BACKBONE_OPTIONAL = {"visual-style.md"}

# 2_backbone/visual-style/ canonical files (authored/generated during Phase 2,
# so init does NOT seed them; check_bundle allows exactly these + optional).
VISUAL_STYLE_FILES = [STYLE_MASTER_PROMPT, STYLE_MASTER_IMAGE, DECK_SYSTEM_FILE, COLOR_PALETTE_FILE]
VISUAL_STYLE_OPTIONAL = {"visual-style.md", "style_master" + IMAGE_TRACE_SUFFIX}

# A version dir's canonical SUBDIRS (both created by init; overrides may stay empty).
VERSION_SUBDIRS = [OVERRIDES_SUBDIR, GENERATED_SUBDIR]

# Whitelist sets — DERIVED from the tables above (do not hand-edit these).
_ALLOWED_IN_BACKBONE = set(BACKBONE_FILE_SEEDS) | set(BACKBONE_SUBDIRS) | BACKBONE_OPTIONAL | {"README.md"}
_ALLOWED_IN_VISUAL_STYLE = set(VISUAL_STYLE_FILES) | VISUAL_STYLE_OPTIONAL | {"README.md"}


# --- PRESET CATALOGS (the ONE data source for --init preset seeding) ---------
# `--init --deck-type X --style Y` seeds preset files into their canonical spots
# so a novice/agent never hand-copies them (that hand-`cp` was the L2 freelancing
# hole: wrong filename, wrong dir, forgotten color_palette.json). These catalogs
# are the SSOT for the preset names; self_check() verifies each declared name
# still exists on disk, so the catalog can't drift from the preset dirs the same
# way the whitelist can't drift from the tree.

# Visual-style presets: name → dir under 01_visual_style_master/presets/. Each
# preset dir ships the files listed in STYLE_PRESET_FILES.
STYLE_PRESETS_DIR = "01_visual_style_master/presets"
STYLE_PRESETS = ["clean-clinical", "corporate-safe", "dark-executive",
                 "tech-startup", "warm-editorial"]
# Which files a style preset contributes to 2_backbone/visual-style/. MUST all be
# canonical visual-style files, else a --style seed would fail its own --check
# (self_check enforces this subset relationship).
STYLE_PRESET_FILES = [DECK_SYSTEM_FILE, COLOR_PALETTE_FILE]

# Deck-type presets: name → template file under DECK_TYPE_DIR. A --deck-type seeds
# 3_versions/v1/slide-specifications.md from this template (instead of the blank one).
DECK_TYPE_DIR = "02_content_design/presets/deck-type-templates"
DECK_TYPE_TEMPLATES = {
    "keynote":  "keynote-template.md",
    "pitch":    "pitch-deck-template.md",
    "report":   "report-template.md",
    "training": "training-template.md",
}


# --- Path resolvers (import these; do not re-derive paths by hand) -----------

def deck_root(run_dir: Path) -> Path:
    """The deck bundle root — two levels up from a version dir (deck_x/3_versions/v1)."""
    return run_dir.parent.parent


def backbone_dir(run_dir: Path) -> Path:
    """The shared 2_backbone/ dir for this deck."""
    return deck_root(run_dir) / BACKBONE_DIR


def resolve_backbone_asset(run_dir: Path, relpath: str) -> Path:
    """Resolve a backbone asset with version-override precedence.

    Returns <run_dir>/overrides/<relpath> if it exists (this version overrides the
    backbone default), otherwise <deck_root>/2_backbone/<relpath>. The returned path
    may not exist in either location (the caller decides how to handle a miss).
    """
    override = run_dir / OVERRIDES_SUBDIR / relpath
    if override.exists():
        return override
    return backbone_dir(run_dir) / relpath


def style_asset(run_dir: Path, filename: str) -> Path:
    """Resolve one visual-style file with file-level override fallback.

    A version may override only color_palette.json while inheriting deck_system.txt
    and style_master.jpg from the shared backbone. Resolving the whole directory
    cannot express that merge, so pipeline code must resolve each file separately.
    """
    return resolve_backbone_asset(run_dir, f"{BACKBONE_STYLE_SUBDIR}/{filename}")


def style_dir(run_dir: Path) -> Path:
    """Backward-compatible whole-directory resolver.

    New pipeline code should use style_asset() so partial overrides inherit missing
    files from backbone instead of shadowing the entire visual-style directory.
    """
    return resolve_backbone_asset(run_dir, BACKBONE_STYLE_SUBDIR)


def generated_dir(run_dir: Path) -> Path:
    """The _generated/ dir for this version."""
    return run_dir / GENERATED_SUBDIR


def find_slide_specs(run_dir: Path) -> Path | None:
    """The per-slide spec markdown for this version (in the version dir)."""
    matches = sorted(run_dir.glob(SLIDE_SPECS_GLOB))
    return matches[0] if matches else None


def deck_name(run_dir: Path) -> str:
    """Deck name for the .pptx — from the deck root dir (deck_<name> → <name>)."""
    return deck_root(run_dir).name.replace("deck_", "")


def is_version_dir(run_dir: Path) -> bool:
    """True if run_dir looks like a version dir: deck_<name>/3_versions/vN."""
    return (
        run_dir.parent.name == VERSIONS_DIR
        and bool(re.fullmatch(r"v\d+", run_dir.name))
        and deck_root(run_dir).name.startswith("deck_")
    )


# --- Credentials: load .env so key + base URL reach the pipeline -------------
# The scripts + Stage-2 skill read os.environ directly. Nothing loaded a .env, so
# "put your key in .env" was dead guidance — the key never arrived and Stage 2
# failed with "API key not set". This tiny stdlib loader fixes that: fill the deck's
# .env ONCE and every run picks it up (child subprocesses inherit os.environ).

def load_dotenv(*search_dirs: Path) -> Path | None:
    """Load KEY=VALUE pairs from the first `.env` found in search_dirs into
    os.environ, WITHOUT overriding vars already set in the real environment
    (explicit env wins). Supports `#` comments, optional `export ` prefix, and
    single/double quotes. Returns the loaded file, or None. Stdlib only."""
    for d in search_dirs:
        env_file = Path(d) / ".env"
        if not env_file.is_file():
            continue
        for raw in env_file.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            if line.startswith("export "):
                line = line[len("export "):]
            key, val = line.split("=", 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val
        return env_file
    return None


# --- Constitution enforcer ---------------------------------------------------
# The structure is the framework's constitution. Enforcement is WHITELIST, not
# blacklist: the version root and backbone may contain ONLY the known-canonical
# entries (derived from the CANONICAL STRUCTURE tables above); anything unexpected
# is a violation. No freelancing, period.


def _ignorable(name: str) -> bool:
    """Housekeeping entries that never count as violations."""
    return name.startswith(".") or name in {"__pycache__"}


def check_bundle(run_dir: Path, require_pipeline_ready: bool = True) -> list[str]:
    """Validate a version (run) dir against the canonical constitution (WHITELIST).

    Returns a list of human-readable violation strings — empty means the bundle
    conforms. Single enforcement point; the file that DEFINES the structure also
    ENFORCES it. Whitelist means: only known-canonical entries are allowed, so any
    improvised/misspelled/stray dir or file is rejected, not just known-bad names.

    Two kinds of check, deliberately separated:
      * STRUCTURAL (always) — dir shape + whitelist. A freshly `--init`'d bundle
        passes ALL of these; they never depend on later-phase artifacts.
      * PIPELINE-READY (require_pipeline_ready=True, the default) — additionally
        requires style_master.jpg plus recorded content/visual gate decisions.
        Passing False lets a just-scaffolded bundle verify its structure cleanly.
    """
    problems: list[str] = []

    if not run_dir.is_dir():
        return [f"run dir not found: {run_dir}"]

    # 1. Must be a version dir: deck_<name>/3_versions/vN
    if not is_version_dir(run_dir):
        problems.append(
            f"--run-dir must be a version dir inside {VERSIONS_DIR}/ "
            f"(e.g. deck_x/{VERSIONS_DIR}/v1); got: {run_dir}")
        # Can't meaningfully check the rest if the shape is wrong.
        return problems

    root = deck_root(run_dir)

    # 2a. Root control files and the upstream tier are part of the constitution.
    for required_file in (GUIDE_FILE, POINTER_FILE, METADATA_FILE):
        if not (root / required_file).is_file():
            problems.append(f"missing deck root control file: {required_file}")
    if not (root / UPSTREAM_DIR).is_dir():
        problems.append(f"missing shared upstream dir: {UPSTREAM_DIR}/")

    # 2. Deck root must carry the shared midstream tier + canonical visual-style dir
    if not (root / BACKBONE_DIR).is_dir():
        problems.append(f"missing shared midstream dir: {BACKBONE_DIR}/ (at deck root {root})")
    if not (root / BACKBONE_DIR / BACKBONE_STYLE_SUBDIR).is_dir():
        problems.append(
            f"missing canonical {BACKBONE_DIR}/{BACKBONE_STYLE_SUBDIR}/ dir "
            f"(check spelling — it must be exactly '{BACKBONE_STYLE_SUBDIR}')")
    # style_master.jpg is a Phase-2 artifact — only required for a pipeline run.
    if require_pipeline_ready and not style_asset(run_dir, STYLE_MASTER_IMAGE).exists():
        problems.append(
            f"missing {BACKBONE_DIR}/{BACKBONE_STYLE_SUBDIR}/{STYLE_MASTER_IMAGE} "
            f"(Phase-2 output; generate it before running the pipeline, or add a version override)")
    if require_pipeline_ready:
        metadata = root / METADATA_FILE
        if metadata.is_file():
            fields = {}
            for line in metadata.read_text(encoding="utf-8").splitlines():
                if ":" in line and not line.lstrip().startswith("#"):
                    key, value = line.split(":", 1)
                    fields[key.strip()] = value.strip().lower()
            for gate in ("content_gate", "visual_gate"):
                if fields.get(gate) not in {"approved", "waived"}:
                    problems.append(
                        f"{gate} is not approved/waived in {METADATA_FILE} "
                        f"(record approved after confirmation, or waived if the user explicitly skips)")

    # 3. The version dir must hold the slide-specs source
    if not find_slide_specs(run_dir):
        problems.append(f"missing {SLIDE_SPECS_GLOB} in the version dir {run_dir}")

    # 4. WHITELIST: the version root may contain ONLY canonical entries.
    for entry in run_dir.iterdir():
        name = entry.name
        if _ignorable(name):
            continue
        is_slide_spec = entry.is_file() and name.startswith("slide-specifications") and name.endswith(".md")
        if is_slide_spec or name in (OVERRIDES_SUBDIR, GENERATED_SUBDIR, "README.md"):
            continue
        problems.append(
            f"unexpected '{name}' at version root — not part of the canonical structure. "
            f"A version holds only: slide-specifications.md, {OVERRIDES_SUBDIR}/, "
            f"{GENERATED_SUBDIR}/, README.md. Sources live in {BACKBONE_DIR}/ (deck root); "
            f"generated artifacts live under {GENERATED_SUBDIR}/. Do not improvise.")

    # 5. WHITELIST: 2_backbone/ may contain only canonical entries.
    bb = root / BACKBONE_DIR
    if bb.is_dir():
        for entry in bb.iterdir():
            if _ignorable(entry.name):
                continue
            if entry.name not in _ALLOWED_IN_BACKBONE:
                problems.append(
                    f"unexpected '{entry.name}' in {BACKBONE_DIR}/ — not canonical. "
                    f"Allowed: {sorted(_ALLOWED_IN_BACKBONE)}")

    # 6. WHITELIST: 2_backbone/visual-style/ may contain only canonical entries.
    vs = bb / BACKBONE_STYLE_SUBDIR
    if vs.is_dir():
        for entry in vs.iterdir():
            if _ignorable(entry.name):
                continue
            if entry.name not in _ALLOWED_IN_VISUAL_STYLE:
                problems.append(
                    f"unexpected '{entry.name}' in {BACKBONE_DIR}/{BACKBONE_STYLE_SUBDIR}/ — "
                    f"not canonical. Allowed: {sorted(_ALLOWED_IN_VISUAL_STYLE)}")

    # 7. Version overrides are sparse, but their top-level categories are fixed.
    overrides = run_dir / OVERRIDES_SUBDIR
    if overrides.is_dir():
        allowed_override_roots = {BACKBONE_STYLE_SUBDIR, BACKBONE_MANUSCRIPT_SUBDIR, "README.md"}
        for entry in overrides.iterdir():
            if _ignorable(entry.name):
                continue
            if entry.name not in allowed_override_roots:
                problems.append(
                    f"unexpected '{entry.name}' in {OVERRIDES_SUBDIR}/ — allowed categories: "
                    f"{sorted(allowed_override_roots)}")
        override_style = overrides / BACKBONE_STYLE_SUBDIR
        if override_style.is_dir():
            for entry in override_style.iterdir():
                if _ignorable(entry.name):
                    continue
                if entry.name not in _ALLOWED_IN_VISUAL_STYLE:
                    problems.append(
                        f"unexpected '{entry.name}' in {OVERRIDES_SUBDIR}/{BACKBONE_STYLE_SUBDIR}/ — "
                        f"not a canonical visual-style asset")

    return problems


def create_version(source_run_dir: Path, version_name: str | None = None) -> Path:
    """Create a clean downstream version without copying generated artifacts."""
    import shutil

    source_run_dir = source_run_dir.resolve()
    if not is_version_dir(source_run_dir):
        raise ValueError(
            f"source must be a version dir inside {VERSIONS_DIR}/ (got {source_run_dir})")

    if version_name is None:
        numbers = []
        for child in source_run_dir.parent.iterdir():
            match = re.fullmatch(r"v(\d+)", child.name) if child.is_dir() else None
            if match:
                numbers.append(int(match.group(1)))
        version_name = f"v{max(numbers, default=0) + 1}"
    if not re.fullmatch(r"v\d+", version_name):
        raise ValueError(f"version name must look like v2, v3, ... (got {version_name!r})")

    target = source_run_dir.parent / version_name
    if target.exists():
        raise ValueError(f"target version already exists: {target}")

    specs = find_slide_specs(source_run_dir)
    if specs is None:
        raise ValueError(f"missing {SLIDE_SPECS_NAME} in {source_run_dir}")
    target.mkdir(parents=True)
    shutil.copy2(specs, target / SLIDE_SPECS_NAME)

    source_overrides = source_run_dir / OVERRIDES_SUBDIR
    target_overrides = target / OVERRIDES_SUBDIR
    if source_overrides.is_dir():
        shutil.copytree(source_overrides, target_overrides)
    else:
        target_overrides.mkdir()

    generated = target / GENERATED_SUBDIR
    generated.mkdir()
    _write_if_absent(
        generated / "README.md",
        "# 派生品(_generated)——别手改\n\n"
        "这是一个干净的新版本。管线产物会在首次运行时写到这里。\n")
    _write_if_absent(
        target / "README.md",
        f"# 这一版({version_name})\n\n"
        f"源自 `{source_run_dir.name}`，只复制了 `{SLIDE_SPECS_NAME}` + `{OVERRIDES_SUBDIR}/`。\n"
        f"`{GENERATED_SUBDIR}/` 是干净的，旧版本图片/PPTX 没有复制过来。\n")
    return target


# --- Scaffolder --------------------------------------------------------------
# `--init` grows a complete, conformant bundle from the SSOT and drops a short
# plain-language README into EVERY directory. Agents never hand-mkdir (that was
# the source of improvisation); a novice opening any folder sees "what goes here
# / what you do". One command = no freelancing, nobody lost.

# Per-directory README bodies (novice-facing, plain language). Keyed by the
# relative dir path inside the deck bundle. {NAME} is filled at init time.
_DIR_READMES = {
    ".": (
        "# {NAME} — 这个 PPT 项目\n\n"
        "先读 **deck-guide.md**（进来先看那个）。\n\n"
        "这个文件夹分三层:\n"
        "- `1_upstream_raw_material/` — 原始素材、调研(你往里堆资料)\n"
        "- `2_backbone/` — 主干:隐喻/公式/约束/大纲/讲稿/视觉(整个 deck 共享)\n"
        "- `3_versions/` — 每个版本(你实际改 slide、生成 PPT 的地方)\n\n"
        "**只改带 README 说'你改这里'的文件。** 结构由 "
        "`PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.py` 定义,别自己新建目录。\n"
    ),
    UPSTREAM_DIR: (
        "# 上游:原始素材\n\n"
        "**这里放什么:** 你的调研、参考资料、事实来源——任何「喂养」这个 deck 的原料。\n"
        "写着写着发现缺了什么,就往这里补。全版本共享,只增不减。\n\n"
        "**你做什么:** 往里堆资料(markdown、笔记都行)。怎么分子目录随你。\n"
    ),
    BACKBONE_DIR: (
        "# 中游:主干(backbone)\n\n"
        "**这里放什么:** 整个 deck 的骨架,全版本共享的「默认事实源」:\n"
        "- `core-metaphor.md` — 核心隐喻\n"
        "- `core-formula.md` — 核心公式\n"
        "- `design-constraints.md` — 设计约束(语言/禁忌/文字密度)\n"
        "- `outline.md` — 大纲主干\n"
        "- `manuscript/` — 讲稿主干\n"
        "- `visual-style/` — 视觉主干(见里面的 README)\n\n"
        "**你做什么:** 改这里 = 影响所有版本。想只改某一版,去那一版的 `overrides/`。\n"
    ),
    f"{BACKBONE_DIR}/{BACKBONE_STYLE_SUBDIR}": (
        "# 视觉主干\n\n"
        "**这里放什么:**\n"
        "- `style-master-prompt.md` — 生成风格母版图的 prompt(源文件,别丢)\n"
        "- `style_master.jpg` — 风格母版图(每页生图时的视觉锚,必须 .jpg)\n"
        "- `deck_system.txt` — 文字约束(语言/禁用元素,管线读它)\n"
        "- `color_palette.json` — 配色 + 标题字号(管线读它)\n\n"
        "**你做什么:** 改配色/风格改这里。锁定后尽量别动——它是「全 deck 长一样」的根源。\n"
    ),
    f"{BACKBONE_DIR}/{BACKBONE_MANUSCRIPT_SUBDIR}": (
        "# 讲稿主干\n\n"
        "**这里放什么:** 演讲讲稿(可按 part0/part1… 分文件)。全版本共享。\n"
        "**你做什么:** 写/改讲稿。某一版要单独改讲稿,放那版的 `overrides/manuscript/`。\n"
    ),
    VERSIONS_DIR: (
        "# 下游:版本\n\n"
        "**这里放什么:** 每个版本一个子目录(`v1/`、`v2/`…)。版本就是在这一层切的。\n"
        "**你做什么:** 在 `v1/` 里改 slide、生成 PPT。要留档就用 "
        "`bundle_layout.py --new-version 3_versions/v1`，它不会复制旧的 `_generated/`。\n"
    ),
    f"{VERSIONS_DIR}/v1": (
        "# 这一版(v1)\n\n"
        "**你改这两处:**\n"
        "- `slide-specifications.md` — 每一页讲什么(标题、要点、画面描述、render mode)\n"
        "- `overrides/` — 只放这一版偏离 backbone 的东西(比如这版单独换配色);空 = 全继承 backbone\n\n"
        "**别碰:** `_generated/` — 那是机器生成的成品,改源文件后会被覆盖重建。\n\n"
        "**生成/更新:** 跟你的 AI agent 说人话(「第 5 页换个例子」),或自己跑:\n"
        "`uv run python PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.py "
        "--run-dir <这个版本目录> --stage all`\n"
    ),
    f"{VERSIONS_DIR}/v1/{OVERRIDES_SUBDIR}": (
        "# 这一版的覆盖(overrides)\n\n"
        "**这里放什么:** 只放这一版**偏离 backbone** 的东西。空着 = 完全继承 backbone。\n"
        "- 要这版单独改视觉 → `overrides/visual-style/`(放改动的那几个文件)\n"
        "- 要这版单独改讲稿 → `overrides/manuscript/`\n\n"
        "管线取件规则:这里有 → 用这里的;没有 → 回退 backbone。\n"
    ),
    f"{VERSIONS_DIR}/v1/{GENERATED_SUBDIR}": (
        "# 派生品(_generated)——别手改\n\n"
        "**这里全是机器生成的**:slide_plan.json、page_prompts/、图片、PPTX。\n"
        "**不要手改任何东西**——改源文件(slide-specifications.md / backbone)后重跑管线,这里会被覆盖重建。\n"
        "整个目录可以 `rm -rf` 掉,需要时从源文件重新生成。\n"
    ),
}


def _write_if_absent(path: Path, content: str) -> None:
    if not path.exists():
        path.write_text(content, encoding="utf-8")


def init_bundle(deck_dir: Path, framework_dir: Path | None = None,
                deck_type: str | None = None, style: str | None = None) -> list[str]:
    """Scaffold a complete, conformant bundle at deck_dir (idempotent).

    Creates the full 3-tier skeleton, drops a plain-language README in every dir,
    copies content templates to their canonical spots, and writes the metadata +
    guide stubs. Returns a list of log lines describing what was created. Existing
    files are never overwritten (safe to re-run). This is how a bundle is born —
    agents call this instead of hand-mkdir, so the structure can't be improvised.

    deck_type (optional): seed slide-specifications.md from a deck-type preset
      (one of DECK_TYPE_TEMPLATES) instead of the blank template.
    style (optional): seed 2_backbone/visual-style/ from a style preset (one of
      STYLE_PRESETS) — its deck_system.txt + color_palette.json. This is how the
      preset lands in its canonical spot deterministically, replacing the old
      hand-`cp` steps (which were the L2 freelancing hole).
    Both are validated against the SSOT catalogs; an unknown name raises ValueError.
    """
    if framework_dir is None:
        framework_dir = Path(__file__).resolve().parent.parent
    if deck_type is not None and deck_type not in DECK_TYPE_TEMPLATES:
        raise ValueError(
            f"unknown deck-type {deck_type!r}. Allowed: {sorted(DECK_TYPE_TEMPLATES)}")
    if style is not None and style not in STYLE_PRESETS:
        raise ValueError(
            f"unknown style preset {style!r}. Allowed: {sorted(STYLE_PRESETS)}")
    name = deck_dir.name.replace("deck_", "")
    log: list[str] = []

    # 1. Directories — derived from the canonical structure tables (one source).
    #    overrides/ starts EMPTY (empty = inherit all from backbone); its
    #    visual-style/ manuscript/ subdirs are created by the author only when a
    #    version actually needs to deviate — pre-creating empty ones would confuse
    #    the override resolver (an empty overrides/visual-style with no files).
    dirs = ["."] + [UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, f"{VERSIONS_DIR}/v1"]
    dirs += [f"{BACKBONE_DIR}/{sd}" for sd in BACKBONE_SUBDIRS]
    dirs += [f"{VERSIONS_DIR}/v1/{sd}" for sd in VERSION_SUBDIRS]
    for rel in dirs:
        d = deck_dir if rel == "." else deck_dir / rel
        d.mkdir(parents=True, exist_ok=True)

    # 2. Per-directory README (novice guidance in EVERY folder).
    for rel, body in _DIR_READMES.items():
        d = deck_dir if rel == "." else deck_dir / rel
        target = d / "README.md"
        _write_if_absent(target, body.replace("{NAME}", name))
        log.append(f"README: {rel}/README.md")

    # 3. Backbone files — seed from the canonical BACKBONE_FILE_SEEDS table.
    #    Template present → copy it; template None → write a one-line stub. This is
    #    why outline.md can never drift: it's in the SAME table the whitelist reads.
    import shutil as _shutil
    for fname, tmpl_rel in BACKBONE_FILE_SEEDS.items():
        dest = deck_dir / BACKBONE_DIR / fname
        if dest.exists():
            continue
        tmpl = (framework_dir / tmpl_rel) if tmpl_rel else None
        if tmpl and tmpl.is_file():
            _shutil.copy2(tmpl, dest)
            log.append(f"template: {BACKBONE_DIR}/{fname}")
        else:
            _write_if_absent(dest, f"# {fname[:-3]}\n\n> 待填。\n")
            log.append(f"stub: {BACKBONE_DIR}/{fname}")

    # 4. Slide-specs source → the version dir. A --deck-type picks a preset
    #    template (keynote/pitch/report/training); otherwise the blank template.
    if deck_type:
        specs_tmpl = framework_dir / DECK_TYPE_DIR / DECK_TYPE_TEMPLATES[deck_type]
        specs_label = f"deck-type:{deck_type}"
    else:
        specs_tmpl = framework_dir / "02_content_design/template-slide-specifications.md"
        specs_label = "template"
    specs_dest = deck_dir / VERSIONS_DIR / "v1" / SLIDE_SPECS_NAME
    if specs_tmpl.is_file() and not specs_dest.exists():
        _shutil.copy2(specs_tmpl, specs_dest)
        log.append(f"{specs_label}: {VERSIONS_DIR}/v1/{SLIDE_SPECS_NAME}")

    # 4b. Visual-style preset → 2_backbone/visual-style/. A --style seeds the
    #     preset's deck_system.txt + color_palette.json (both canonical files, so
    #     the seeded bundle still passes --check). style_master.jpg is NOT seeded —
    #     no preset ships one; it's generated in Phase 2 from style-master-prompt.md.
    if style:
        preset_dir = framework_dir / STYLE_PRESETS_DIR / style
        vs_dest = deck_dir / BACKBONE_DIR / BACKBONE_STYLE_SUBDIR
        for fname in STYLE_PRESET_FILES:
            src = preset_dir / fname
            dest = vs_dest / fname
            if src.is_file() and not dest.exists():
                _shutil.copy2(src, dest)
                log.append(f"style:{style}: {BACKBONE_DIR}/{BACKBONE_STYLE_SUBDIR}/{fname}")

    # 5. Metadata + guide + pointer stubs.
    _write_if_absent(deck_dir / METADATA_FILE,
                     f"# {name} — project metadata\n"
                     f"deck_name: {name}\n"
                     f"topic: \naudience: \nlanguage: \none_thing_to_remember: \n"
                     f"content_gate: pending\nvisual_gate: pending\n")
    _write_if_absent(deck_dir / POINTER_FILE,
                     f"# {name}\n\n进入这个 run bundle 先读 [deck-guide.md](deck-guide.md)。"
                     f"目录结构的权威源:`PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.py`。\n")
    pipeline_script = framework_dir / "06_reference_scripts/unified_pipeline.py"
    version_script = framework_dir / "06_reference_scripts/bundle_layout.py"
    _write_if_absent(
        deck_dir / GUIDE_FILE,
        f"# {deck_dir.name} — 这个 PPT 项目怎么用\n\n"
        f"> 当前版本：`v1`。先改源文件，再让管线重建；不要直接改 `_generated/`。\n\n"
        f"## 你改哪里\n\n"
        f"- 每页内容：`{VERSIONS_DIR}/v1/{SLIDE_SPECS_NAME}`\n"
        f"- 整体主线：`{BACKBONE_DIR}/{BACKBONE_METAPHOR}` + `{BACKBONE_DIR}/{BACKBONE_FORMULA}`\n"
        f"- 视觉主干：`{BACKBONE_DIR}/{BACKBONE_STYLE_SUBDIR}/`\n"
        f"- 原始材料：`{UPSTREAM_DIR}/`\n\n"
        f"用户确认内容/视觉闸门后，把 `{METADATA_FILE}` 中对应的 "
        f"`content_gate` / `visual_gate` 改为 `approved`；若用户明确跳过则写 `waived`。"
        f"Stage 2 会自动检查。\n\n"
        f"## 当前进度\n\n"
        f"查看 `{VERSIONS_DIR}/v1/{GENERATED_SUBDIR}/`：有 `slide_plan.json` 表示 Stage 1 完成；"
        f"有 `ppt/{name}.pptx` 表示交付物已生成。\n\n"
        f"## 从项目根目录运行\n\n"
        f"```bash\n"
        f"# 首次先解析；再让 Agent 选 3 张代表页做 pilot\n"
        f"uv run python \"{pipeline_script}\" --run-dir \"{deck_dir}/{VERSIONS_DIR}/v1\" --stage 1\n"
        f"uv run python \"{pipeline_script}\" --run-dir \"{deck_dir}/{VERSIONS_DIR}/v1\" --stage 2 "
        f"--only opener_id,content_id,closer_id --resolution 1k\n"
        f"\n# Pilot 通过后全量生产\n"
        f"uv run python \"{pipeline_script}\" --run-dir \"{deck_dir}/{VERSIONS_DIR}/v1\" --stage 2 "
        f"--resolution 2k --force-images\n"
        f"uv run python \"{pipeline_script}\" --run-dir \"{deck_dir}/{VERSIONS_DIR}/v1\" --stage 3,4,5\n"
        f"\n# 新建干净版本（不复制旧图片/PPTX）\n"
        f"uv run python \"{version_script}\" --new-version \"{deck_dir}/{VERSIONS_DIR}/v1\"\n"
        f"```\n\n"
        f"用户只需告诉 Agent 想改什么；Agent 负责选择最小重跑链。\n")
    log.append(f"project files: {METADATA_FILE}, {POINTER_FILE}, {GUIDE_FILE}")

    # 6. Credentials + deps homes (so a first-time user knows WHERE things go).
    #    .env.example documents the image-gen key + base URL; copy it to `.env` and
    #    fill it ONCE — every run loads `.env` automatically (see load_dotenv). Var
    #    names are the framework-facing OPENAI_API_KEY / OPENAI_BASE_URL convention.
    #    The wrappers bridge these to the installed skill's native variable names;
    #    supplier API-contract differences still belong in the skill adapter.
    _write_if_absent(deck_dir / ".env.example",
                     "# 图像生成凭据（Stage 2 需要——没有 key 就生不了图，PPT 做不出来）。\n"
                     "# 复制本文件为 .env 并填好；每次跑管线会自动加载 .env（填一次即可）。\n\n"
                     "# 框架统一入口变量；wrapper 会桥接到当前 image skill 的原生变量：\n"
                     "OPENAI_API_KEY=            # 必填：你的图像 API key\n"
                     "OPENAI_BASE_URL=           # 可选：API 端点，如 https://<relay>/v1（留空用默认）\n\n"
                     "# （若你的中转原生用别的变量名，直接填 APIMART_API_KEY / APIMART_BASE_URL 也认。）\n")
    _write_if_absent(deck_dir / "pyproject.toml",
                     f'[project]\nname = "deck-{name}"\nversion = "0.0.0"\n'
                     f'requires-python = ">=3.11"\n'
                     f'dependencies = [\n'
                     f'    "python-pptx>=1.0",   # Stage 4/5 (pulls Pillow)\n'
                     f'    "Pillow>=10.0",       # Stage 3 header overlay\n'
                     f'    "httpx>=0.27",        # Stage 2 image skill HTTP client\n'
                     f']\n\n[tool.uv]\npackage = false\n')
    _write_if_absent(deck_dir / ".gitignore",
                     "# secrets — never commit your API key\n.env\n"
                     "# environments / caches\n.venv/\n__pycache__/\n"
                     "# generated artifacts (regenerable from source)\n"
                     f"{VERSIONS_DIR}/*/{GENERATED_SUBDIR}/\n")
    log.append("credentials/deps: .env.example, pyproject.toml, .gitignore")

    return log


# --- Canonical tree renderer (docs generate/validate against this) -----------

def render_tree() -> str:
    """Return the canonical run-bundle tree as text. The docs must match this
    exactly — generate or validate `01-directory-template.md` against it so the
    human-facing tree can never drift from the code."""
    return f"""\
deck_{{NAME}}/
├── {GUIDE_FILE}                     ← read first: structure + workflow + edit chains
├── {POINTER_FILE}                         ← 1-line pointer to {GUIDE_FILE} (auto-load)
├── {METADATA_FILE}
│
├── {UPSTREAM_DIR}/          ← 上游 UPSTREAM · raw material · shared · append-mostly · no versions
│
├── {BACKBONE_DIR}/                       ← 中游 BACKBONE · 主干/default source-of-truth · shared · stable
│   ├── {BACKBONE_METAPHOR}
│   ├── {BACKBONE_FORMULA}
│   ├── {BACKBONE_CONSTRAINTS}
│   ├── {BACKBONE_OUTLINE}
│   ├── {BACKBONE_MANUSCRIPT_SUBDIR}/
│   └── {BACKBONE_STYLE_SUBDIR}/
│       ├── {STYLE_MASTER_PROMPT}
│       ├── {STYLE_MASTER_IMAGE}
│       ├── {DECK_SYSTEM_FILE}
│       └── {COLOR_PALETTE_FILE}
│
└── {VERSIONS_DIR}/                       ← 下游 DOWNSTREAM · 微调+生产 · versions live here
    ├── v1/                               ← --run-dir (one design iteration = downstream delta)
    │   ├── {SLIDE_SPECS_NAME}       ← per-slide 4-layer specs; each slide declares render mode
    │   ├── {OVERRIDES_SUBDIR}/                    ← only what THIS version changes vs backbone; empty = inherit
    │   │   ├── {BACKBONE_STYLE_SUBDIR}/           ←   (optional) this version's visual tweaks
    │   │   └── {BACKBONE_MANUSCRIPT_SUBDIR}/               ←   (optional) this version's script tweaks
    │   └── {GENERATED_SUBDIR}/                    ← GENERATED · rm -rf & rerun · never hand-edit
    │       ├── {GEN_SLIDE_PLAN}
    │       ├── {GEN_PROMPTS_SUBDIR}/{{NN_id.prompt.md, {GEN_PROMPTS_JSON}}}   ← one readable prompt per slide
    │       ├── {GEN_IMAGES_SUBDIR}/{{NN_id.png, NN_id{IMAGE_TRACE_SUFFIX}}}
    │       ├── {GEN_HEADER_LOCKED_SUBDIR}/NN_id.png
    │       ├── {GEN_PPT_SUBDIR}/{{NAME}}.pptx (+ .backup.pptx)
    │       ├── {GEN_QA_SUBDIR}/
    │       └── {GEN_PREVIEW_SUBDIR}/contact_sheet.jpg
    └── v2/  (--new-version v1 → copies source delta only; clean {GENERATED_SUBDIR}/; backbone referenced)
"""


def self_check() -> list[str]:
    """Assert the SSOT is internally self-consistent.

    render_tree() interpolates the constants directly (`{GEN_...}` etc.), so a
    displayed name literally IS its constant — that pair cannot drift. The real
    risks are (a) two SEPARATE tables disagreeing, and (b) a name hardcoded as a
    literal somewhere instead of interpolated. This checks exactly those:
      1. every backbone-seed / subdir is in the whitelist (init ⊆ check);
      2. the slide-specs glob derives from the canonical name;
      3. render_tree() contains no stale hardcoded canonical filename (it must
         interpolate, so the literal spelling must still equal the constant);
      4. every file a --style seed contributes is a canonical visual-style file;
      5. the preset catalogs (STYLE_PRESETS / DECK_TYPE_TEMPLATES) agree with disk
         — no declared preset missing, no undeclared preset dir present.
    Returns drift problems (empty = consistent). Run in CI / before release."""
    problems: list[str] = []

    # 1. Cross-table: everything init seeds/creates must pass its own --check.
    for fname in BACKBONE_FILE_SEEDS:
        if fname not in _ALLOWED_IN_BACKBONE:
            problems.append(f"init seeds {fname} but whitelist forbids it in {BACKBONE_DIR}/")
    for sd in BACKBONE_SUBDIRS:
        if sd not in _ALLOWED_IN_BACKBONE:
            problems.append(f"init creates {sd}/ but whitelist forbids it in {BACKBONE_DIR}/")
    for f in VISUAL_STYLE_FILES:
        if f not in _ALLOWED_IN_VISUAL_STYLE:
            problems.append(f"canonical visual-style file {f} not in its whitelist")

    # 2. The glob must match the canonical slide-specs name.
    import fnmatch
    if not fnmatch.fnmatch(SLIDE_SPECS_NAME, SLIDE_SPECS_GLOB):
        problems.append(f"SLIDE_SPECS_GLOB {SLIDE_SPECS_GLOB!r} does not match SLIDE_SPECS_NAME {SLIDE_SPECS_NAME!r}")

    # 3. render_tree() must render (no missing constant / KeyError) and must show
    #    each top-tier dir + the slide-specs name (guards against someone replacing
    #    an {interpolation} with a stale literal).
    tree = render_tree()
    for n in [UPSTREAM_DIR, BACKBONE_DIR, VERSIONS_DIR, GENERATED_SUBDIR, SLIDE_SPECS_NAME]:
        if n not in tree:
            problems.append(f"render_tree() is missing canonical entry {n!r} (stale hardcoded literal?)")

    # 4. Every file a --style seed contributes MUST be a canonical visual-style
    #    file, else the seed would fail its own --check.
    for fname in STYLE_PRESET_FILES:
        if fname not in _ALLOWED_IN_VISUAL_STYLE:
            problems.append(
                f"STYLE_PRESET_FILES has {fname!r} but it is not a canonical visual-style file "
                f"— a --style seed would then fail --check")

    # 5. Preset catalogs must agree with disk (the catalog is the SSOT for preset
    #    names; a preset dir added/removed/renamed without updating the table — or
    #    vice versa — is exactly the kind of drift this alarm exists to catch).
    framework_dir = Path(__file__).resolve().parent.parent
    for name in STYLE_PRESETS:
        pdir = framework_dir / STYLE_PRESETS_DIR / name
        if not pdir.is_dir():
            problems.append(f"STYLE_PRESETS lists {name!r} but {STYLE_PRESETS_DIR}/{name}/ is missing")
            continue
        for fname in STYLE_PRESET_FILES:
            if not (pdir / fname).is_file():
                problems.append(f"style preset {name!r} is missing {fname} ({STYLE_PRESETS_DIR}/{name}/)")
    presets_root = framework_dir / STYLE_PRESETS_DIR
    if presets_root.is_dir():
        on_disk = {p.name for p in presets_root.iterdir() if p.is_dir()}
        for extra in sorted(on_disk - set(STYLE_PRESETS)):
            problems.append(
                f"{STYLE_PRESETS_DIR}/{extra}/ exists on disk but is not declared in STYLE_PRESETS")
    for name, tmpl in DECK_TYPE_TEMPLATES.items():
        if not (framework_dir / DECK_TYPE_DIR / tmpl).is_file():
            problems.append(f"DECK_TYPE_TEMPLATES lists {name!r} → {tmpl} but {DECK_TYPE_DIR}/{tmpl} is missing")

    return problems


if __name__ == "__main__":
    # Modes:
    #   python bundle_layout.py                 → print the canonical tree
    #   python bundle_layout.py --init <dir>    → scaffold a full bundle (skeleton + per-dir README + templates)
    #        [--deck-type keynote|pitch|report|training]  seed slide-specifications.md from a deck-type preset
    #        [--style <preset>]                           seed visual-style/ from a style preset
    #   python bundle_layout.py --new-version <vN> → copy source delta only; never _generated/
    #   python bundle_layout.py --check <dir>   → enforce the constitution on a version dir
    #   python bundle_layout.py --self-check    → assert tree/whitelist/init/presets agree (drift alarm)
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description="Run-bundle structure — the SSOT. Print the canonical tree, "
                    "--init a new bundle from it, or --check a version dir against it.")
    parser.add_argument("--init", metavar="DECK_DIR",
                        help="Scaffold a full conformant bundle (dirs + per-dir README + templates) at DECK_DIR (e.g. deck_mypitch)")
    parser.add_argument("--deck-type", choices=sorted(DECK_TYPE_TEMPLATES),
                        help="With --init: seed slide-specifications.md from this deck-type preset")
    parser.add_argument("--style", choices=sorted(STYLE_PRESETS),
                        help="With --init: seed 2_backbone/visual-style/ from this style preset")
    parser.add_argument("--check", metavar="RUN_DIR",
                        help="Validate a version dir (deck_x/3_versions/v1) against the canonical structure")
    parser.add_argument("--new-version", metavar="SOURCE_RUN_DIR",
                        help="Create the next clean version from SOURCE_RUN_DIR without copying _generated/")
    parser.add_argument("--version-name", metavar="vN",
                        help="With --new-version: explicit target name (default: next available vN)")
    parser.add_argument("--structure-only", action="store_true",
                        help="With --check: verify STRUCTURE only (skip style_master + Phase gate "
                             "readiness). Use at the Phase-0 gate.")
    parser.add_argument("--self-check", action="store_true",
                        help="Assert the tree/whitelist/init/presets all agree with the canonical tables (drift alarm)")
    args = parser.parse_args()

    if (args.deck_type or args.style) and not args.init:
        print("✗ --deck-type / --style only apply together with --init.")
        sys.exit(1)
    if args.version_name and not args.new_version:
        print("✗ --version-name only applies together with --new-version.")
        sys.exit(1)
    primary_modes = sum(bool(v) for v in (args.init, args.check, args.new_version, args.self_check))
    if primary_modes > 1:
        print("✗ choose only one of --init, --check, --new-version, or --self-check.")
        sys.exit(1)
    if args.structure_only and not args.check:
        print("✗ --structure-only only applies together with --check.")
        sys.exit(1)

    if args.self_check:
        drift = self_check()
        if drift:
            print(f"✗ SSOT self-inconsistency — {len(drift)} drift problem(s):")
            for d in drift:
                print(f"  - {d}")
            sys.exit(1)
        print("✓ SSOT self-consistent: render_tree / whitelist / init all agree.")
        sys.exit(0)

    if args.init:
        deck_dir = Path(args.init).resolve()
        if not deck_dir.name.startswith("deck_"):
            print(f"✗ deck dir name must start with 'deck_' (Stage 4 derives the .pptx name from it); "
                  f"got: {deck_dir.name}")
            sys.exit(1)
        # A run bundle must NOT live inside the framework (soft bundle). A bare
        # relative name resolves into the framework dir — reject that.
        framework_dir = Path(__file__).resolve().parent.parent
        if framework_dir == deck_dir or framework_dir in deck_dir.parents:
            print(f"✗ refusing to scaffold inside the framework ({framework_dir.name}/). "
                  f"A run bundle is a separate project — give an absolute path or a path outside "
                  f"the framework, e.g.  --init ~/decks/{deck_dir.name}")
            sys.exit(1)
        created = init_bundle(deck_dir, deck_type=args.deck_type, style=args.style)
        seeded = []
        if args.deck_type:
            seeded.append(f"deck-type={args.deck_type}")
        if args.style:
            seeded.append(f"style={args.style}")
        suffix = f" [{', '.join(seeded)}]" if seeded else ""
        print(f"✓ Scaffolded bundle at {deck_dir} ({len(created)} items){suffix}:")
        for line in created:
            print(f"  + {line}")
        print(f"\nNext: fill 2_backbone/ + 3_versions/v1/slide-specifications.md, then run the pipeline.")
        print(f"Verify anytime:  uv run python {Path(__file__).resolve()} --check {deck_dir}/{VERSIONS_DIR}/v1")
        sys.exit(0)

    if args.new_version:
        try:
            target = create_version(Path(args.new_version), args.version_name)
        except ValueError as exc:
            print(f"✗ {exc}")
            sys.exit(1)
        print(f"✓ Created clean version: {target}")
        print(f"  Copied: {SLIDE_SPECS_NAME} + {OVERRIDES_SUBDIR}/")
        print(f"  Reset:  {GENERATED_SUBDIR}/ (no stale images, JSON, or PPTX)")
        sys.exit(0)

    if args.check:
        run_dir = Path(args.check).resolve()
        ready = not args.structure_only
        violations = check_bundle(run_dir, require_pipeline_ready=ready)
        scope = "structure" if args.structure_only else "structure + pipeline-readiness"
        if violations:
            print(f"✗ Bundle does NOT conform ({scope}) — {len(violations)} violation(s):")
            for v in violations:
                print(f"  - {v}")
            print("\nThe structure is the constitution. Fix these, or see the canonical tree:")
            print("  python bundle_layout.py")
            sys.exit(1)
        note = "" if ready else "  (pipeline assets and Phase approvals are not required at this gate.)"
        print(f"✓ {run_dir} conforms ({scope}).{note}")
        sys.exit(0)

    # Default: print the canonical tree (handy for humans and for regenerating docs).
    print(render_tree())
