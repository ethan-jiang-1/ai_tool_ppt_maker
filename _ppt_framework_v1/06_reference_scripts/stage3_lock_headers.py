#!/usr/bin/env python3
"""
Stage 3: Lock headers — overlay kicker/title/subtitle text onto AI-generated images.

Reads raw images from Stage 2 and slide_plan.json from Stage 1.
- body+header-lock slides: render kicker + title + subtitle at fixed pixel positions (Pillow)
- full-page slides: pass through unchanged (AI already rendered the full page including text)

This is the Header-Lock mechanism: AI handles creative body visuals, Python handles
deterministic text placement.

Usage:
    python stage3_lock_headers.py \\
        --images 3_versions/v1/_generated/page_images_full/ \\
        --slide-plan 3_versions/v1/_generated/slide_plan.json \\
        --out 3_versions/v1/_generated/header_locked/ \\
        --style-dir 2_backbone/visual-style/

Customization:
    Canvas, header positions, line heights, colors, font family/weight, and sizes
    all come from color_palette.json through visual_config.py. Fonts resolve
    cross-platform automatically (see _load_font): a bundled `fonts/` dir next to
    this script wins, then $PPT_FONT_DIR, then the common OS font dirs.
    If it's absent, rendering degrades to a readable, correctly-sized fallback
    sans (loud warning) and only hard-aborts if no usable font exists at all — it
    never silently emits mis-sized headers. For CJK text, add Noto Sans CJK and
    point FONT_BOLD/SEMIBOLD/REGULAR at it.
"""

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path
from typing import Any

from PIL import Image, ImageDraw, ImageFont

# Canonical render-mode vocabulary lives in stage1 — import, don't restate.
import stage1_build_inputs as stage1
import visual_config

# ---------------------------------------------------------------------------
# Shared executable visual configuration
# ---------------------------------------------------------------------------

def _apply_visual_config(config: visual_config.VisualConfig) -> None:
    """Expose the shared config through module globals used by rendering helpers."""
    global CANVAS_SIZE, KICKER_SIZE, TITLE_SIZE, SUBTITLE_SIZE
    global KICKER_POS, TITLE_POS, SUBTITLE_Y_OFFSET
    global TITLE_LINE_HEIGHT, SUBTITLE_LINE_HEIGHT, MAX_TITLE_WIDTH
    global KICKER_COLOR, TITLE_COLOR, SUBTITLE_COLOR, TEXT_SHADOW
    global KICKER_FONT_FAMILY, KICKER_FONT_WEIGHT
    global TITLE_FONT_FAMILY, TITLE_FONT_WEIGHT
    global SUBTITLE_FONT_FAMILY, SUBTITLE_FONT_WEIGHT
    global FONT_BOLD, FONT_SEMIBOLD, FONT_REGULAR

    header = config.header_lock
    position = header.position
    CANVAS_SIZE = (config.canvas.width_px, config.canvas.height_px)
    KICKER_SIZE = header.kicker.size_px
    TITLE_SIZE = header.title.size_px
    SUBTITLE_SIZE = header.subtitle.size_px
    KICKER_POS = (position.left_px, position.kicker_y_px)
    TITLE_POS = (position.left_px, position.title_y_px)
    SUBTITLE_Y_OFFSET = position.subtitle_gap_px
    TITLE_LINE_HEIGHT = position.title_line_height_px
    SUBTITLE_LINE_HEIGHT = position.subtitle_line_height_px
    MAX_TITLE_WIDTH = config.canvas.width_px - position.left_px - position.right_margin_px
    KICKER_COLOR = visual_config.hex_to_rgba(header.kicker.color)
    TITLE_COLOR = visual_config.hex_to_rgba(header.title.color)
    SUBTITLE_COLOR = visual_config.hex_to_rgba(header.subtitle.color)

    background_red = int(config.background[1:3], 16)
    TEXT_SHADOW = ((180, 180, 180, 80) if background_red > 128
                   else (0, 6, 16, 180))

    KICKER_FONT_FAMILY, KICKER_FONT_WEIGHT = header.kicker.family, header.kicker.weight
    TITLE_FONT_FAMILY, TITLE_FONT_WEIGHT = header.title.family, header.title.weight
    SUBTITLE_FONT_FAMILY, SUBTITLE_FONT_WEIGHT = header.subtitle.family, header.subtitle.weight

    # Backward-compatible names for callers that used _load_font(FONT_REGULAR, size).
    FONT_BOLD = TITLE_FONT_FAMILY
    FONT_SEMIBOLD = KICKER_FONT_FAMILY
    FONT_REGULAR = SUBTITLE_FONT_FAMILY


_apply_visual_config(visual_config.DEFAULT_CONFIG)

# A framework-bundled fonts dir wins (drop OTFs here for a reproducible deck that
# doesn't depend on OS-installed fonts); then $PPT_FONT_DIR; then common OS dirs.
_BUNDLED_FONTS_DIR = Path(__file__).resolve().parent / "fonts"

# Size-respecting fallbacks tried (in order) when the configured face is absent — a
# different typeface, but readable and correctly sized. NEVER load_default().
_FALLBACK_FONTS = [
    "DejaVuSans-Bold.ttf", "DejaVuSans.ttf",           # Linux / Pillow-common
    "Arial Bold.ttf", "Arial.ttf", "ArialBd.ttf",      # Windows / macOS supplemental
    "LiberationSans-Bold.ttf", "LiberationSans-Regular.ttf",
    "Helvetica.ttc",
]


def _os_font_dirs() -> list[Path]:
    dirs = [_BUNDLED_FONTS_DIR]
    env = os.environ.get("PPT_FONT_DIR")
    if env:
        dirs.append(Path(env))
    dirs += [
        Path("/Library/Fonts"), Path.home() / "Library" / "Fonts",           # macOS
        Path("/System/Library/Fonts"), Path("/System/Library/Fonts/Supplemental"),
        Path("/usr/share/fonts"), Path("/usr/local/share/fonts"),            # Linux
        Path.home() / ".fonts", Path.home() / ".local" / "share" / "fonts",
        Path("C:/Windows/Fonts"),                                            # Windows
    ]
    return [d for d in dirs if d.is_dir()]


def _find_font_file(name: str) -> Path | None:
    """Locate a font FILE by name across the search dirs (recursive — Linux nests
    fonts deeply). Returns the first match or None."""
    for d in _os_font_dirs():
        exact = d / name
        if exact.is_file():
            return exact
        hits = sorted(d.rglob(name))
        if hits:
            return hits[0]
    return None


def _load_colors_from_palette(palette_path: Path) -> None:
    """Load the same full layout/font configuration consumed by Stage 1."""
    try:
        config = visual_config.load_visual_config(palette_path)
    except visual_config.VisualConfigError as exc:
        raise SystemExit(f"Invalid visual config {palette_path}: {exc}") from exc
    _apply_visual_config(config)
    if palette_path.exists():
        print(
            f"  Loaded canvas, header geometry, colors, and fonts from {palette_path}")


# ---------------------------------------------------------------------------
# ADVANCED: Opener variant (larger title for session openers)
# ---------------------------------------------------------------------------
# Session opener slides often want larger fonts and a deeper header safe zone
# (e.g. 390px vs 260px) for visual impact. Uncomment and customize if your deck
# has distinct opener slides:
#
# OPENER_LEFT = 58
# OPENER_KICKER_Y = 40
# OPENER_TITLE_Y = 92
# OPENER_TITLE_SIZE = 82
# OPENER_SUBTITLE_SIZE = 34
# OPENER_SAFE_ZONE = 390
# OPENER_MAX_TITLE_WIDTH = CANVAS_SIZE[0] - OPENER_LEFT - 300
#
# OPENER_IDS = {"slide_01_title", "slide_07_bridge"}   # slide IDs that use opener layout
#
# To activate: in _draw_header(), check if slide['id'] in OPENER_IDS and
# route to a separate draw_opener_header() function with the above constants.

# ---------------------------------------------------------------------------
# ADVANCED: Body shift (when AI content drifts into header zone)
# ---------------------------------------------------------------------------
# Sometimes GPT Image 2 places visual elements too close to the header,
# especially on complex slides with diagrams near the top. Shifting the raw
# image body DOWN by ~24px (filling the gap with background color) avoids
# collisions without regenerating.
#
# BODY_SHIFT_BY_ID = {
#     "slide_04_diagram": 24,
#     "slide_13_habits": 24,
# }
#
# To activate: before drawing header, crop top N px of the image, paste
# the image shifted down, and fill the gap with background color sampled
# from the top edge of the original image.

# ---------------------------------------------------------------------------
# Font loading
# ---------------------------------------------------------------------------

_FONT_WARNED: set[str] = set()   # warn once per missing intended face, not per slide


def _font_name_candidates(family: str, weight: str) -> list[str]:
    """Generate common font filenames from configured family + weight."""
    if Path(family).suffix.lower() in {".otf", ".ttf", ".ttc"}:
        return [family]
    family_forms = [family, family.replace(" ", ""), family.replace(" ", "-")]
    weight_forms = [weight, weight.replace(" ", ""), weight.replace(" ", "-")]
    names: list[str] = []
    for family_form in family_forms:
        for weight_form in weight_forms:
            for separator in ("-", "", " "):
                stem = f"{family_form}{separator}{weight_form}" if weight_form else family_form
                for extension in (".otf", ".ttf", ".ttc"):
                    candidate = stem + extension
                    if candidate not in names:
                        names.append(candidate)
    return names


def _find_configured_font(family: str, weight: str) -> tuple[Path | None, list[str]]:
    candidates = _font_name_candidates(family, weight)
    for candidate in candidates:
        hit = _find_font_file(candidate)
        if hit:
            return hit, candidates

    # Last resort for installed files whose vendor naming differs slightly:
    # compare alphanumeric tokens in the stem instead of requiring one filename.
    family_key = re.sub(r"[^a-z0-9]", "", family.lower())
    weight_key = re.sub(r"[^a-z0-9]", "", weight.lower())
    for directory in _os_font_dirs():
        for path in directory.rglob("*"):
            if path.suffix.lower() not in {".otf", ".ttf", ".ttc"}:
                continue
            stem_key = re.sub(r"[^a-z0-9]", "", path.stem.lower())
            if family_key in stem_key and (not weight_key or weight_key in stem_key):
                return path, candidates
    return None, candidates


def _load_font(
    family: str,
    weight_or_size: str | int,
    size: int | None = None,
) -> ImageFont.FreeTypeFont:
    """Resolve a size-respecting TrueType/OpenType font. Never returns
    load_default() (a fixed-size bitmap that would silently ignore `size`).

    The preferred form is _load_font(family, weight, size). The historical
    _load_font(filename_or_family, size) form remains supported for callers/tests.

    Order: configured face (bundled/env/OS dirs, then by-name) → size-respecting
    fallback sans (loud one-time warning) → hard abort with install guidance.
    """
    if size is None:
        if not isinstance(weight_or_size, int):
            raise TypeError("_load_font(family, size) requires an integer size")
        weight = ""
        size = weight_or_size
    else:
        weight = str(weight_or_size)

    face_label = f"{family} {weight}".strip()
    hit, candidates = _find_configured_font(family, weight)
    if hit:
        return ImageFont.truetype(str(hit), size)
    for candidate in [family, *candidates]:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue

    # 2. a readable, correctly-sized fallback — different typeface, loud warning.
    for fb in _FALLBACK_FONTS:
        fb_path = _find_font_file(fb)
        try:
            font = ImageFont.truetype(str(fb_path) if fb_path else fb, size)
        except OSError:
            continue
        if face_label not in _FONT_WARNED:
            _FONT_WARNED.add(face_label)
            print(f"  ⚠  font '{face_label}' not found — falling back to '{fb}' (readable & "
                  f"correctly sized, but NOT the style-anchor typeface). Drop the OTF into "
                  f"{_BUNDLED_FONTS_DIR}/ or set $PPT_FONT_DIR for an exact match.")
        return font

    # 3. nothing usable — abort loudly rather than emit garbage headers.
    raise SystemExit(
        f"✗ No usable font for header-lock. Wanted '{face_label}', and no fallback "
        f"({', '.join(_FALLBACK_FONTS)}) was found either.\n"
        f"  Fix: put a .otf/.ttf into {_BUNDLED_FONTS_DIR}/ (create it), or set "
        f"$PPT_FONT_DIR to a dir containing sans-serif fonts, then rerun Stage 3.")


# ---------------------------------------------------------------------------
# Text rendering helpers
# ---------------------------------------------------------------------------

def _word_wrap(text: str, font: ImageFont.ImageFont, max_width: int) -> list[str]:
    """Wrap text to fit within max_width pixels."""
    words = text.split()
    if not words:
        return []
    lines = []
    current = words[0]
    for w in words[1:]:
        test = f"{current} {w}"
        if font.getbbox(test)[2] <= max_width:
            current = test
        else:
            lines.append(current)
            current = w
    lines.append(current)
    return lines


def _draw_text_with_shadow(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.ImageFont,
    fill: tuple,
    shadow: tuple,
    stroke_width: int = 1,
) -> None:
    """Draw text with a soft shadow for readability on varied backgrounds."""
    draw.text(xy, text, font=font, fill=fill,
              stroke_width=stroke_width, stroke_fill=shadow)


def _draw_header(
    image: Image.Image,
    slide: dict[str, Any],
) -> Image.Image:
    """Overlay kicker + title + subtitle onto a slide image."""
    img = image.convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    kicker = slide.get("kicker", "").upper().strip()
    title = slide.get("headline", "").strip()
    subtitle = slide.get("subtitle", "").strip()

    label_font = _load_font(KICKER_FONT_FAMILY, KICKER_FONT_WEIGHT, KICKER_SIZE)
    title_font = _load_font(TITLE_FONT_FAMILY, TITLE_FONT_WEIGHT, TITLE_SIZE)
    subtitle_font = _load_font(SUBTITLE_FONT_FAMILY, SUBTITLE_FONT_WEIGHT, SUBTITLE_SIZE)

    # Kicker
    if kicker and kicker not in ("(NONE)", "(无)"):
        _draw_text_with_shadow(
            draw, KICKER_POS, kicker, label_font,
            KICKER_COLOR, TEXT_SHADOW, stroke_width=1,
        )

    # Title (word-wrapped)
    title_lines = _word_wrap(title, title_font, MAX_TITLE_WIDTH)
    for i, line in enumerate(title_lines):
        y = TITLE_POS[1] + i * TITLE_LINE_HEIGHT
        _draw_text_with_shadow(
            draw, (TITLE_POS[0], y), line, title_font,
            TITLE_COLOR, TEXT_SHADOW, stroke_width=2,
        )

    # Subtitle (optional)
    if subtitle:
        sub_y = TITLE_POS[1] + len(title_lines) * TITLE_LINE_HEIGHT + SUBTITLE_Y_OFFSET
        sub_lines = _word_wrap(subtitle, subtitle_font, MAX_TITLE_WIDTH)
        for i, line in enumerate(sub_lines):
            _draw_text_with_shadow(
                draw, (TITLE_POS[0], sub_y + i * SUBTITLE_LINE_HEIGHT), line, subtitle_font,
                SUBTITLE_COLOR, TEXT_SHADOW, stroke_width=1,
            )

    return Image.alpha_composite(img, overlay).convert("RGB")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

_IMG_EXTS = {".png", ".jpg", ".jpeg"}


def match_slide_image(img_dir: Path, slide_id: str) -> list[Path]:
    """All images matching a slide id under the canonical NN_<id> (or bare <id>)
    naming — ANCHORED and sorted. An unanchored substring match (the old
    `*<id>*.png`) cross-hits ids like 's1' onto '10_s10.png'; this anchors the id
    to the end of the stem. Returns [] (missing) or possibly >1 (ambiguous); the
    caller turns either into a loud error instead of silently taking candidates[0]."""
    pat = re.compile(rf"^(\d+_)?{re.escape(slide_id)}$")
    return sorted(p for p in img_dir.iterdir()
                  if p.is_file() and p.suffix.lower() in _IMG_EXTS and pat.match(p.stem))


def resolve_images(img_dir: Path, slides: list[dict]) -> dict[str, Path]:
    """Map every slide id → its one image, or ABORT listing all problems.

    Fail-loud replaces the old "warn and skip": a skipped slide used to silently
    shrink the deck and shift every downstream speaker note by one. If Stage 2
    only produced some images, this stops here and tells you to finish Stage 2 —
    the deck is never built half-complete."""
    resolved: dict[str, Path] = {}
    problems: list[str] = []
    for slide in slides:
        sid = slide["id"]
        hits = match_slide_image(img_dir, sid)
        if not hits:
            problems.append(f"no image for slide {sid!r} (expected NN_{sid}.png in {img_dir.name}/)")
        elif len(hits) > 1:
            problems.append(f"ambiguous images for slide {sid!r}: {[h.name for h in hits]}")
        else:
            resolved[sid] = hits[0]
    if problems:
        raise SystemExit(
            f"✗ Stage 3 cannot start — {len(problems)} image problem(s):\n" +
            "\n".join(f"  - {p}" for p in problems) +
            f"\n  Stage 2 likely didn't finish. Re-run Stage 2 (e.g. --stage 2) to "
            f"generate the missing images, then Stage 3. (Building a partial deck would "
            f"misalign every downstream speaker note.)")
    return resolved


def main() -> None:
    parser = argparse.ArgumentParser(description="Stage 3: Lock headers onto images")
    parser.add_argument("--images", required=True,
                        help="Directory containing Stage 2 raw images")
    parser.add_argument("--slide-plan", required=True,
                        help="slide_plan.json from Stage 1")
    parser.add_argument("--out", required=True,
                        help="Output directory for header-locked images")
    parser.add_argument("--style-dir", default=None,
                        help="Source style directory for color_palette.json "
                             "(default: probe near --slide-plan for backward compat)")
    parser.add_argument("--color-palette", default=None,
                        help="Explicit color_palette.json path; overrides --style-dir")
    args = parser.parse_args()

    # Load preset-specific header colors from <style-dir>/color_palette.json.
    # The orchestrator passes --color-palette explicitly after file-level override
    # resolution. Standalone callers may still pass --style-dir or rely on probing.
    if args.color_palette:
        palette_path = Path(args.color_palette)
    elif args.style_dir:
        palette_path = Path(args.style_dir) / "color_palette.json"
    else:
        plan_parent = Path(args.slide_plan).resolve().parent
        candidates = [
            plan_parent / "visual-style", plan_parent.parent / "visual-style",
            plan_parent / "style", plan_parent.parent / "style",
        ]
        style_dir = next((c for c in candidates if c.is_dir()), candidates[0])
        palette_path = style_dir / "color_palette.json"
    _load_colors_from_palette(palette_path)

    plan_data = json.loads(Path(args.slide_plan).read_text(encoding="utf-8"))
    slides = plan_data.get("slides", [])

    img_dir = Path(args.images)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    # Fail loud on a partial/ambiguous image set BEFORE writing anything.
    images = resolve_images(img_dir, slides)

    body_lock_count = 0
    full_page_count = 0

    for i, slide in enumerate(slides):
        slide_id = slide["id"]
        img_path = images[slide_id]

        layout = slide.get("layout_contract", {})
        mode = stage1._contract_render_mode(layout)
        img = Image.open(img_path).resize(CANVAS_SIZE, Image.LANCZOS)

        if mode == stage1.RENDER_MODE_FULL_PAGE:
            # Pass-through: AI rendered the complete slide
            final = img
            full_page_count += 1
        else:
            final = _draw_header(img, slide)
            body_lock_count += 1

        seq = f"{i + 1:02d}"
        out_name = f"{seq}_{slide_id}.png"
        final.save(out_dir / out_name, "PNG", quality=94)
        print(f"  {out_name}  ({mode})")

    print(f"\n--- Stage 3 complete ---")
    print(f"body+header-lock (text overlay): {body_lock_count}")
    print(f"full-page (passthrough):         {full_page_count}")


if __name__ == "__main__":
    main()
