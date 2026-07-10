#!/usr/bin/env python3
"""
Stage 1: Parse human-authored markdown slide specs into machine-readable JSON.

Reads one or more markdown files in the four-layer slide spec format (02_content_design),
produces the artifacts consumed by downstream stages:

    slide_plan.json               — per-slide metadata: id, kicker, headline, layout contract
    page_prompts/_prompts.json    — per-slide assembled prompts (machine format Stage 2 reads)
    page_prompts/NN_id.prompt.md  — one human-readable prompt per slide (readable twin)

Usage:
    python stage1_build_inputs.py \\
        --input slide-specifications.md \\
        --out-dir 3_versions/v1/_generated/ \\
        --style-dir 2_backbone/visual-style/

Render mode per slide (ONE vocabulary everywhere):
    full-page          — AI paints the whole slide including title
    body+header-lock   — AI paints body only; Python overlays kicker/title

If a slide declares explicit `RENDER MODE` it wins; otherwise derived from
VISUAL TYPE → FULL_PAGE_TYPES. The resolved mode + its source are recorded in
slide_plan.json as layout_contract.render_mode (canonical). Legacy aliases
image_direct/normal are accepted on INPUT only and normalized away.

Outputs are written under --out-dir (the generated _generated/ dir): slide_plan.json
at its root, prompts under page_prompts/. Style inputs are accepted as explicitly
resolved files so partial version overrides can inherit missing backbone assets.
If --style-dir is omitted, it falls back to probing near --out-dir for standalone use.

Customization:
    Canvas, body-layout, safe-zone, and header geometry come from the resolved
    color_palette.json through visual_config.py. Only the VISUAL TYPE mapping is
    defined locally because it is a content/rendering policy rather than styling.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import visual_config

# ---------------------------------------------------------------------------
# Shared executable visual configuration
# ---------------------------------------------------------------------------

def _apply_visual_config(config: visual_config.VisualConfig) -> None:
    """Expose config values through legacy module globals used by helpers/tests."""
    global CANVAS_WIDTH, CANVAS_HEIGHT, NORMAL_HEADER_SAFE_ZONE
    global CONTENT_TOP_GAP, CONTENT_BOTTOM, CALLOUT_TOP, CALLOUT_BOTTOM
    global NO_CALLOUT_BOTTOM
    CANVAS_WIDTH = config.canvas.width_px
    CANVAS_HEIGHT = config.canvas.height_px
    NORMAL_HEADER_SAFE_ZONE = config.header_lock.body_header_safe_zone
    CONTENT_TOP_GAP = config.body_layout.content_top_gap_px
    CONTENT_BOTTOM = config.body_layout.content_bottom_px
    CALLOUT_TOP = config.body_layout.callout_top_px
    CALLOUT_BOTTOM = config.body_layout.callout_bottom_px
    NO_CALLOUT_BOTTOM = config.body_layout.no_callout_bottom_px


_apply_visual_config(visual_config.DEFAULT_CONFIG)

# VISUAL TYPEs that get full-page AI rendering (no Python header overlay)
FULL_PAGE_TYPES = {
    "Title / Opener",
    "Section Divider / Bridge",
    "Closer",
}
# Back-compat alias — do not use in new code
IMAGE_DIRECT_TYPES = FULL_PAGE_TYPES

# IDs for specific slides that need extra header space (optional, can be empty)
EXTRA_SAFE_IDS: dict[str, int] = {}
# Example: {"s2_13_habits": 360}

# ---------------------------------------------------------------------------
# System contracts — injected into every prompt
# ---------------------------------------------------------------------------

def _system_header_contract(safe_zone: int) -> str:
    return (
        f"HEADER CONTRACT - ABSOLUTE:\n"
        f"Do not render the slide kicker, title, or subtitle. "
        f"The top y=0 to y={safe_zone} is a reserved header band. "
        f"Keep this area clean and empty — no text, icons, cards, or diagrams.\n"
    )


SYSTEM_BODY_TEXT_CONTRACT = (
    "BODY TEXT CONTRACT:\n"
    "Keep body text large and readable. No more than 3-5 text zones per slide. "
    "KPI numbers must appear at least 72px visual. "
    "No dashboard microtext, checkbox labels, table rows, or footnotes.\n"
)

SYSTEM_STYLE_ANCHORING = (
    "Use the reference image(s) as your EXACT visual style guide. "
    "Match the color palette, typography scale, layout grid, component patterns, "
    "and overall visual language precisely. The reference defines the deck's design system — "
    "do not deviate from it. Only change the slide content, not the style.\n"
)

SYSTEM_FINAL_RULES = (
    "English only. No logos. No watermarks. No page numbers. "
    "No source notes. No clip art or stock photos.\n"
    "Follow the deck_system.txt constraints for colors and tone.\n"
)


def _load_deck_system(path: Path) -> str | None:
    """Load deck-wide textual rules from an explicitly resolved source file."""
    if path.exists():
        return path.read_text(encoding="utf-8").strip() + "\n"
    return None


def _load_visual_config_from_palette(palette: Path) -> None:
    """Load the one shared executable layout used by prompt and header stages."""
    try:
        config = visual_config.load_visual_config(palette)
    except visual_config.VisualConfigError as exc:
        raise SystemExit(f"Invalid visual config {palette}: {exc}") from exc
    _apply_visual_config(config)
    if palette.exists():
        print(
            f"  Visual config: {CANVAS_WIDTH}x{CANVAS_HEIGHT}, "
            f"header={NORMAL_HEADER_SAFE_ZONE}px ({palette})")


def _load_safe_zone_from_palette(palette: Path) -> None:
    """Backward-compatible alias for older tests and standalone callers."""
    _load_visual_config_from_palette(palette)


# ---------------------------------------------------------------------------
# Markdown parser
# ---------------------------------------------------------------------------

def _extract_field(body: str, field: str) -> str:
    m = re.search(rf"^\*\*{re.escape(field)}\*\*:\s*(.*?)\s*$", body, re.M)
    return m.group(1).strip() if m else ""


def _extract_prompt(body: str, slide_id: str) -> str:
    # Format A (code block): **IMAGE PROMPT**:\n```\ncontent\n```
    m = re.search(r"^\*\*IMAGE PROMPT\*\*:\s*```\s*([\s\S]*?)```", body, re.M)
    if m:
        return m.group(1).strip()

    # Format B (inline): **IMAGE PROMPT**: [one-line description]
    m = re.search(r"^\*\*IMAGE PROMPT\*\*:\s*(.+)$", body, re.M)
    if m:
        inline = m.group(1).strip()
        # Return the inline text as-is; agent is expected to expand [PLACEHOLDER] descriptions
        # into full image prompts before running the pipeline
        return inline

    raise SystemExit(f"Missing IMAGE PROMPT block for slide {slide_id}")


def _has_bottom_callout(body: str) -> bool:
    return bool(re.search(
        r"\b(BOTTOM CALLOUT|Bottom callout|Bottom statement|callout bar)\b",
        body, re.IGNORECASE,
    ))


# ---------------------------------------------------------------------------
# Header variant detection
# ---------------------------------------------------------------------------

# Canonical render modes — ONE vocabulary for specs, docs, and slide_plan.json.
RENDER_MODE_FULL_PAGE = "full-page"
RENDER_MODE_BODY_HEADER_LOCK = "body+header-lock"
CANONICAL_RENDER_MODES = {RENDER_MODE_FULL_PAGE, RENDER_MODE_BODY_HEADER_LOCK}

# Authored RENDER MODE synonyms → canonical. Legacy image_direct/normal accepted
# on INPUT only so old specs don't break; they never appear in new outputs.
# Parser + validate_specs share this table — they can't drift on typos.
_RENDER_MODE_ALIASES = {
    "full-page": RENDER_MODE_FULL_PAGE,
    "fullpage": RENDER_MODE_FULL_PAGE,
    "image_direct": RENDER_MODE_FULL_PAGE,       # legacy input alias
    "imagedirect": RENDER_MODE_FULL_PAGE,
    "body+header-lock": RENDER_MODE_BODY_HEADER_LOCK,
    "bodyheaderlock": RENDER_MODE_BODY_HEADER_LOCK,
    "body+headerlock": RENDER_MODE_BODY_HEADER_LOCK,
    "normal": RENDER_MODE_BODY_HEADER_LOCK,      # legacy input alias
}


def _normalize_render_mode(raw: str, slide_id: str = "") -> str | None:
    """Map an authored RENDER MODE string to a canonical mode.

    Returns None if the field is unset/empty (→ caller falls back to VISUAL TYPE).
    If the field is PRESENT but unrecognized (a typo), raises SystemExit — a
    silent fallback would let the author think they controlled the mode when they
    didn't (an improvisation trap). Empty = fine; wrong = loud.
    """
    if not raw or not raw.strip():
        return None
    key = raw.strip().lower().replace(" ", "")
    canonical = _RENDER_MODE_ALIASES.get(key)
    if canonical is None:
        raise SystemExit(
            f"Slide {slide_id!r}: unrecognized RENDER MODE {raw!r}. "
            f"Use 'full-page' or 'body+header-lock' (or omit the field to derive from VISUAL TYPE)."
        )
    return canonical


def _determine_render_mode(
    slide_id: str, visual_type: str, render_mode: str = "",
) -> tuple[str, int, str]:
    """Return (render_mode, safe_zone_px, source).

    Precedence: explicit RENDER MODE field (author override) > EXTRA_SAFE_IDS >
    VISUAL TYPE → FULL_PAGE_TYPES mapping. `source` records which rule decided,
    so slide_plan.json is traceable (explicit vs derived). A typo'd RENDER MODE
    raises (see _normalize_render_mode) rather than silently falling back.
    """
    explicit = _normalize_render_mode(render_mode, slide_id)
    if explicit == RENDER_MODE_FULL_PAGE:
        return RENDER_MODE_FULL_PAGE, 0, "explicit"
    if explicit == RENDER_MODE_BODY_HEADER_LOCK:
        return RENDER_MODE_BODY_HEADER_LOCK, NORMAL_HEADER_SAFE_ZONE, "explicit"

    if slide_id in EXTRA_SAFE_IDS:
        return RENDER_MODE_BODY_HEADER_LOCK, EXTRA_SAFE_IDS[slide_id], "derived:extra_safe_id"
    if visual_type in FULL_PAGE_TYPES:
        return RENDER_MODE_FULL_PAGE, 0, "derived:visual_type"
    return RENDER_MODE_BODY_HEADER_LOCK, NORMAL_HEADER_SAFE_ZONE, "derived:visual_type"


# Back-compat name used by older call sites / docs
_determine_header_variant = _determine_render_mode


def _contract_render_mode(layout: dict[str, Any]) -> str:
    """Read canonical render_mode from a layout_contract.

    Prefers `render_mode` (v1.3+). Falls back to legacy `header_variant`
    (image_direct→full-page, normal*→body+header-lock) so Stage 3 can still
    consume older slide_plan.json files without a Stage-1 rerun.
    """
    mode = layout.get("render_mode")
    if mode in CANONICAL_RENDER_MODES:
        return mode
    legacy = layout.get("header_variant", "")
    if legacy == "image_direct":
        return RENDER_MODE_FULL_PAGE
    if legacy in ("normal", "normal_extra_safe", ""):
        return RENDER_MODE_BODY_HEADER_LOCK
    # Unknown legacy value — treat as body+header-lock (safe default: overlay)
    return RENDER_MODE_BODY_HEADER_LOCK


# ---------------------------------------------------------------------------
# Layout contract builder
# ---------------------------------------------------------------------------

def _build_layout_contract(
    slide_id: str,
    visual_type: str,
    body: str,
    render_mode: str = "",
) -> dict[str, Any]:
    mode, safe_zone, source = _determine_render_mode(slide_id, visual_type, render_mode)

    if mode == RENDER_MODE_FULL_PAGE:
        return {
            "render_mode": RENDER_MODE_FULL_PAGE,
            "render_mode_source": source,
            "header_safe_zone": 0,
            "canvas": [CANVAS_WIDTH, CANVAS_HEIGHT],
        }

    has_callout = _has_bottom_callout(body)
    content_y_min = safe_zone + CONTENT_TOP_GAP
    content_y_max = CONTENT_BOTTOM if has_callout else NO_CALLOUT_BOTTOM

    contract: dict[str, Any] = {
        "canvas": [CANVAS_WIDTH, CANVAS_HEIGHT],
        "render_mode": mode,
        "render_mode_source": source,
        "header_safe_zone": safe_zone,
        "content_y_min": content_y_min,
        "content_y_max": content_y_max,
        "has_bottom_callout": has_callout,
    }
    if has_callout:
        contract["callout_y_min"] = CALLOUT_TOP
        contract["callout_y_max"] = CALLOUT_BOTTOM
    return contract


# ---------------------------------------------------------------------------
# Prompt assembler
# ---------------------------------------------------------------------------

def _assemble_prompt(
    source_prompt: str,
    slide: dict[str, Any],
    final_rules: str = SYSTEM_FINAL_RULES,
) -> str:
    """Wrap source IMAGE PROMPT with system contracts.

    Args:
        source_prompt: The human-authored IMAGE PROMPT from markdown.
        slide: Slide record with layout_contract, kicker, headline, etc.
        final_rules: System final rules — either from deck_system.txt or hardcoded default.
    """
    layout = slide["layout_contract"]
    safe_zone = int(layout["header_safe_zone"])
    mode = _contract_render_mode(layout)

    if mode == RENDER_MODE_FULL_PAGE:
        # Full-page AI render: no header contract needed
        return (
            f"FULL-PAGE: Render the complete slide including all text.\n"
            f"Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}.\n\n"
            f"{source_prompt}\n\n"
            f"{SYSTEM_STYLE_ANCHORING}{final_rules}"
        )

    overlay_info = f"kicker={slide['kicker']}, title={slide['headline']}"
    if slide.get("subtitle"):
        overlay_info += f", subtitle={slide['subtitle']}"

    has_callout = layout.get("has_bottom_callout", False)
    callout_contract = (
        f"Reserve the bottom callout lane from y={layout['callout_y_min']} "
        f"to y={layout['callout_y_max']}. Place the management takeaway bar there "
        f"with large readable text."
        if has_callout
        else "This slide does not need a bottom callout bar."
    )

    return (
        f"{_system_header_contract(safe_zone)}"
        f"Local Python overlay will draw header: {overlay_info}.\n\n"
        f"LAYOUT CONTRACT:\n"
        f"Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}. "
        f"Content zone: y={layout['content_y_min']} to y={layout['content_y_max']}. "
        f"{callout_contract}\n\n"
        f"{SYSTEM_BODY_TEXT_CONTRACT}\n"
        f"SOURCE IMAGE PROMPT:\n{source_prompt}\n\n"
        f"{SYSTEM_STYLE_ANCHORING}{final_rules}"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

# Slide-block heading regex — the ONE pattern the parser and the validator share.
_SLIDE_BLOCK_RE = r"^## Slide \d+\s*[：:\-–—]\s*`?([^`\n]+)`?([\s\S]*?)(?=^## Slide \d+|\Z)"

# Markers left behind by the unfilled --init template (an unfilled spec must not
# reach image generation).
_PLACEHOLDER_MARKERS = ("[PLACEHOLDER", "[slide_id]", "## Slide 01: `slide_id`")


def _get_image_prompt(body: str) -> str | None:
    """Return the IMAGE PROMPT text (code-fence OR inline form), or None if absent.
    Non-raising twin of _extract_prompt, for the validator."""
    m = re.search(r"^\*\*IMAGE PROMPT\*\*:\s*```\s*([\s\S]*?)```", body, re.M)
    if m:
        return m.group(1).strip()
    m = re.search(r"^\*\*IMAGE PROMPT\*\*:\s*(\S.*)$", body, re.M)
    if m:
        return m.group(1).strip()
    return None


# The deck-type templates ship UNFILLED, using two placeholder conventions the
# gate must catch (or a skeleton sails through to image generation):
#   (1) a whole field value that is one bracket:  **TITLE**: [CASE_HEADLINE — ...]
#   (2) SHOUTY [IDENTIFIER] tokens anywhere:      [CASE_KICKER], [COMPONENT_3_TITLE]
# Two complementary detectors — (1) catches instruction-in-brackets like
# "[Case study visual — logo, metrics]", (2) catches the SHOUTY identifiers.
def _is_bracket_placeholder(value: str) -> bool:
    """True if the whole field value is a single [...] placeholder."""
    v = value.strip()
    return len(v) > 2 and v.startswith("[") and v.endswith("]")

# ≥3 chars, leading upper, only UPPER/digit/underscore — matches [CASE_KICKER],
# [OUTCOME]; deliberately skips short inline refs like [C1]/[C2] used in prose.
_ALLCAPS_PLACEHOLDER_RE = re.compile(r"\[[A-Z][A-Z0-9_]{2,}\b")


def validate_specs(md_paths: list[str]) -> list[str]:
    """Validate slide-specs against the pipeline's CONTENT contract before any
    (expensive) image generation. Structure has bundle_layout.py --check; this is
    its content-side analog — the L3 gate.

    Reuses the SAME block regex + field extractors as parse_slides(), so the gate
    can't drift from what the parser actually consumes. Unlike the parser (which
    dies on the first missing IMAGE PROMPT), this surfaces EVERY problem in one
    pass so the author fixes the spec once, not N times.

    Returns a flat list, each item prefixed 'ERROR:' (generation would fail or
    silently emit a broken slide) or 'WARN:' (a gap that won't break generation).
    Empty = clean. Callers abort on any ERROR and print WARNs.
    """
    problems: list[str] = []
    seen_ids: dict[str, int] = {}

    for md_path in md_paths:
        p = Path(md_path)
        label = p.name
        if not p.is_file():
            problems.append(f"ERROR: spec file not found: {md_path}")
            continue
        text = p.read_text(encoding="utf-8")

        marker = next((m for m in _PLACEHOLDER_MARKERS if m in text), None)
        if marker:
            problems.append(
                f"ERROR: {label} still contains the unfilled-template marker {marker!r} — "
                f"fill real content and delete every [PLACEHOLDER]/[INSTRUCTION] note.")

        shouty = _ALLCAPS_PLACEHOLDER_RE.findall(text)
        if shouty:
            examples = ", ".join(m + "]" for m in sorted(set(shouty))[:3])
            problems.append(
                f"ERROR: {label} still has unfilled template placeholders (e.g. {examples}) — "
                f"replace every [SHOUTY_TOKEN] with real content before generating.")

        blocks = re.findall(_SLIDE_BLOCK_RE, text, re.M)
        if not blocks:
            problems.append(
                f"ERROR: {label} has no slide blocks (need '## Slide N: slide_id' headings).")
            continue

        for slide_id, body in blocks:
            slide_id = slide_id.strip()
            sid = slide_id or "<unnamed>"
            seen_ids[slide_id] = seen_ids.get(slide_id, 0) + 1

            visual_type = _extract_field(body, "VISUAL TYPE")
            render_mode_raw = _extract_field(body, "RENDER MODE")
            title = _extract_field(body, "TITLE")
            kicker = _extract_field(body, "KICKER")

            # Resolve the render mode WITHOUT raising (collect, don't abort).
            explicit_mode = None
            if render_mode_raw.strip():
                canonical = _RENDER_MODE_ALIASES.get(render_mode_raw.strip().lower().replace(" ", ""))
                if canonical is None:
                    problems.append(
                        f"ERROR: slide {sid!r}: RENDER MODE {render_mode_raw!r} is not "
                        f"'full-page' or 'body+header-lock' (a typo aborts the pipeline).")
                else:
                    explicit_mode = canonical

            if explicit_mode is not None:
                mode = explicit_mode
            elif visual_type in FULL_PAGE_TYPES:
                mode = RENDER_MODE_FULL_PAGE
            elif visual_type:
                mode = RENDER_MODE_BODY_HEADER_LOCK
            else:
                mode = None  # neither signal present

            # a) render mode must be resolvable — else it silently defaults to body+header-lock.
            if mode is None:
                problems.append(
                    f"ERROR: slide {sid!r}: no VISUAL TYPE and no RENDER MODE — it would silently "
                    f"default to body+header-lock. Declare RENDER MODE (full-page | body+header-lock).")

            # b) IMAGE PROMPT is mandatory and must be real (not an [instruction] stub).
            prompt = _get_image_prompt(body)
            if prompt is None:
                problems.append(f"ERROR: slide {sid!r}: missing IMAGE PROMPT block.")
            elif _is_bracket_placeholder(prompt):
                problems.append(
                    f"ERROR: slide {sid!r}: IMAGE PROMPT is still a placeholder ({prompt[:40]}…) — "
                    f"write the actual visual description.")

            # c) body+header-lock slides get their TITLE overlaid by Python — an empty
            #    OR placeholder TITLE draws a blank/garbage header band onto the image.
            title_filled = bool(title) and not _is_bracket_placeholder(title)
            if mode == RENDER_MODE_BODY_HEADER_LOCK and not title_filled:
                problems.append(
                    f"ERROR: slide {sid!r}: body+header-lock slide has no real TITLE — Python would "
                    f"overlay an empty/placeholder header. Add a TITLE, or make it full-page.")

            # d) quality-layer warnings (do not block generation).
            if mode == RENDER_MODE_BODY_HEADER_LOCK and (not kicker or _is_bracket_placeholder(kicker)):
                problems.append(f"WARN: slide {sid!r}: no real KICKER (header overlay will show the title alone).")

    for sid, n in seen_ids.items():
        if n > 1:
            problems.append(f"WARN: slide id {sid!r} appears {n} times (duplicate ids are confusing to trace).")

    return problems


def parse_slides(md_paths: list[str], final_rules: str = "") -> tuple[list[dict], list[dict]]:
    """Parse one or more markdown files into slide plan and prompts.

    Args:
        md_paths: Paths to markdown slide spec files.
        final_rules: Custom final rules from deck_system.txt (if available).
                     Falls back to hardcoded SYSTEM_FINAL_RULES if empty.
    """
    if not final_rules:
        final_rules = SYSTEM_FINAL_RULES

    plan: list[dict[str, Any]] = []
    prompts: list[dict[str, Any]] = []
    seq = 1

    for md_path in md_paths:
        text = Path(md_path).read_text(encoding="utf-8")

        # Novice guard: the file may still be the unfilled template (--init copies
        # it in with [PLACEHOLDER] markers and placeholder slide ids). Running the
        # pipeline on it would fail cryptically — say it in plain language instead.
        if "[PLACEHOLDER" in text or "## Slide 01: `slide_id`" in text or "[slide_id]" in text:
            raise SystemExit(
                f"{md_path} 看起来还是空模板(含 [PLACEHOLDER] 占位符)。\n"
                f"  请先填内容:打开它,把每张 slide 的 VISUAL TYPE / KICKER / TITLE / "
                f"IMAGE PROMPT 换成你的真实内容(删掉所有 [PLACEHOLDER] 和 [INSTRUCTION] 注释),再跑管线。\n"
                f"  例子见 02_content_design/example-deck-brief-mini.md。"
            )

        # Accept colon (:), full-width colon (：), hyphen (-), or em-dash (—) after slide number (with optional space)
        blocks = re.findall(_SLIDE_BLOCK_RE, text, re.M)
        if not blocks:
            raise SystemExit(
                f"{md_path} 里没找到 slide 块(需要 '## Slide N: slide_id' 这样的标题)。\n"
                f"  如果这是新建的空文件,请按模板格式填入至少一张 slide。"
            )

        for slide_id, body in blocks:
            slide_id = slide_id.strip()
            visual_type = _extract_field(body, "VISUAL TYPE")
            render_mode = _extract_field(body, "RENDER MODE")   # explicit author override (optional)
            kicker = _extract_field(body, "KICKER")
            headline = _extract_field(body, "TITLE")
            subtitle = _extract_field(body, "SUBTITLE")
            source_prompt = _extract_prompt(body, slide_id)

            slide_record: dict[str, Any] = {
                "id": slide_id,
                "visual_type": visual_type,
                "kicker": kicker,
                "headline": headline,
            }
            if subtitle:
                slide_record["subtitle"] = subtitle

            slide_record["layout_contract"] = _build_layout_contract(
                slide_id, visual_type, body, render_mode,
            )
            plan.append(slide_record)

            out_name = f"{seq:02d}_{slide_id}.png"
            full_prompt = _assemble_prompt(source_prompt, slide_record, final_rules)
            prompts.append({"id": slide_id, "out": out_name, "prompt": full_prompt})
            seq += 1

    return plan, prompts


def main() -> None:
    parser = argparse.ArgumentParser(description="Stage 1: Parse markdown into JSON")
    parser.add_argument("--input", nargs="+", required=True,
                        help="One or more markdown slide spec files")
    parser.add_argument("--out-dir", required=False,
                        help="Output directory for generated artifacts (e.g. 3_versions/v1/_generated/); "
                             "not needed with --validate")
    parser.add_argument("--style-dir", default=None,
                        help="Source style directory for deck_system.txt "
                             "(default: <out-dir>/../style for backward compat)")
    parser.add_argument("--deck-system", default=None,
                        help="Explicit deck_system.txt path; overrides --style-dir resolution")
    parser.add_argument("--color-palette", default=None,
                        help="Explicit color_palette.json path; overrides --style-dir resolution")
    parser.add_argument("--validate", action="store_true",
                        help="Validate the spec content contract and exit (no generation)")
    args = parser.parse_args()

    # L3 content gate — validate the spec contract BEFORE anything expensive.
    # Runs on every invocation (so unified_pipeline gets it for free), lists every
    # problem at once, and aborts on any ERROR. Structure gate: bundle_layout --check.
    problems = validate_specs(args.input)
    for w in [p for p in problems if p.startswith("WARN:")]:
        print(f"  ⚠  {w[len('WARN:'):].strip()}")
    errors = [p for p in problems if p.startswith("ERROR:")]
    if errors:
        print(f"✗ slide-specs failed the content contract — {len(errors)} problem(s):")
        for e in errors:
            print(f"  - {e[len('ERROR:'):].strip()}")
        print("  Fix these in slide-specifications.md, then rerun.")
        raise SystemExit(1)
    if args.validate:
        print(f"✓ slide-specs pass the content contract ({len(args.input)} file(s)).")
        return

    if not args.out_dir:
        raise SystemExit("--out-dir is required for generation (omit it only with --validate).")
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Style dir resolution:
    #   - explicit --style-dir wins (the orchestrator always passes the
    #     override-aware backbone visual-style dir)
    #   - otherwise probe near --out-dir for standalone use (best-effort):
    #       look for a sibling "style"/"visual-style" dir next to out-dir or its parent
    if args.style_dir:
        style_dir = Path(args.style_dir)
    elif (out_dir / "visual-style").is_dir():
        style_dir = out_dir / "visual-style"
    elif (out_dir.parent / "visual-style").is_dir():
        style_dir = out_dir.parent / "visual-style"
    elif (out_dir / "style").is_dir():
        style_dir = out_dir / "style"
    else:
        style_dir = out_dir.parent / "style"

    # Load custom deck system rules if available (from preset or manual config)
    deck_system_path = Path(args.deck_system) if args.deck_system else style_dir / "deck_system.txt"
    palette_path = Path(args.color_palette) if args.color_palette else style_dir / "color_palette.json"

    deck_system = _load_deck_system(deck_system_path)
    final_rules = deck_system if deck_system else SYSTEM_FINAL_RULES
    if deck_system:
        print(f"  Using {deck_system_path} for final rules ({len(deck_system)} chars)")
    else:
        print(f"  No deck_system.txt found at {deck_system_path}, using hardcoded defaults")

    # Header safe zone is a live per-preset knob (color_palette.json), not hardcoded.
    _load_safe_zone_from_palette(palette_path)

    plan, prompts = parse_slides(args.input, final_rules)

    # slide_plan.json stays at the _generated/ root; per-slide prompts go into a
    # page_prompts/ subdir — one readable .prompt.md per slide plus a machine
    # _prompts.json (the schema Stage 2 consumes). One-file-per-slide makes
    # "what did page 7 get sent?" a single-file open instead of scanning a blob.
    plan_path = out_dir / "slide_plan.json"
    prompts_dir = out_dir / "page_prompts"
    prompts_dir.mkdir(parents=True, exist_ok=True)
    prompts_path = prompts_dir / "_prompts.json"

    plan_path.write_text(
        json.dumps({"slides": plan}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    prompts_path.write_text(
        json.dumps({"slides": prompts}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    # One human-readable prompt file per slide: NN_id.prompt.md (derived from `out`,
    # which is NN_id.png). This is the readable twin of the machine _prompts.json.
    for entry in prompts:
        stem = Path(entry["out"]).stem  # e.g. "01_s1_title"
        md_path = prompts_dir / f"{stem}.prompt.md"
        md_path.write_text(
            f"# Prompt — {entry['id']}\n\n"
            f"> Generated by Stage 1. Do not hand-edit — edit the source "
            f"slide-specifications.md and rerun. Machine copy: `_prompts.json`.\n\n"
            f"```\n{entry['prompt']}\n```\n",
            encoding="utf-8",
        )

    print(f"Parsed {len(plan)} slides from {len(args.input)} file(s)")
    print(f"  slide_plan:  {plan_path}")
    print(f"  prompts:     {prompts_path}")
    print(f"  per-slide:   {prompts_dir}/NN_id.prompt.md  ({len(prompts)} files)")

    # Quick validation
    full_page = [
        s["id"] for s in plan
        if _contract_render_mode(s["layout_contract"]) == RENDER_MODE_FULL_PAGE
    ]
    body_lock = [s["id"] for s in plan if s["id"] not in full_page]
    print(f"  body+header-lock slides: {len(body_lock)}")
    print(f"  full-page slides:        {len(full_page)}  {full_page}")


if __name__ == "__main__":
    main()
