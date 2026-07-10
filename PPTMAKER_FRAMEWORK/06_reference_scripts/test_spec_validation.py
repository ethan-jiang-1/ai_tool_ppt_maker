#!/usr/bin/env python3
"""
Tests for the L3 slide-spec content gate (stage1_build_inputs.validate_specs).

The structure gate (bundle_layout --check) proves files are in the right place;
this proves the SLIDE CONTENT is actually generatable before the expensive image
step runs. Each case pins one failure the parser would otherwise hit late (or
silently): missing IMAGE PROMPT, a body+header-lock slide with no TITLE (blank
header band), a slide with no render signal (silent default), a typo'd RENDER
MODE, an unfilled template. It also proves the gate lists ALL problems in one
pass instead of dying on the first — the whole point of a pre-flight gate.

Stdlib only. Run either way:
    uv run python 06_reference_scripts/test_spec_validation.py
    uv run pytest 06_reference_scripts/test_spec_validation.py
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import stage1_build_inputs as s1
import bundle_layout as layout

FENCE = "```"

# A valid body+header-lock slide: VISUAL TYPE (not full-page) + TITLE + IMAGE PROMPT.
GOOD_NORMAL = f"""\
## Slide 1: intro

**VISUAL TYPE**: Data / Chart
**KICKER**: The setup
**TITLE**: Growth is accelerating
**IMAGE PROMPT**:
{FENCE}
A clean bar chart on a dark navy background, three rising bars.
{FENCE}
"""

# A valid full-page slide: RENDER MODE full-page — no TITLE overlay needed.
GOOD_FULLPAGE = f"""\
## Slide 1: opener

**VISUAL TYPE**: Title / Opener
**RENDER MODE**: full-page
**IMAGE PROMPT**:
{FENCE}
A bold full-bleed title slide, deck name centered.
{FENCE}
"""


def _validate(text: str) -> list[str]:
    with tempfile.TemporaryDirectory() as td:
        p = Path(td) / "slide-specifications.md"
        p.write_text(text, encoding="utf-8")
        return s1.validate_specs([str(p)])


def _errors(problems: list[str]) -> list[str]:
    return [p for p in problems if p.startswith("ERROR:")]


def _warns(problems: list[str]) -> list[str]:
    return [p for p in problems if p.startswith("WARN:")]


def test_valid_normal_slide_is_clean():
    assert _errors(_validate(GOOD_NORMAL)) == []


def test_valid_fullpage_slide_is_clean():
    # full-page slide legitimately has no TITLE — must NOT be flagged.
    assert _errors(_validate(GOOD_FULLPAGE)) == []


def test_missing_image_prompt_is_error():
    spec = "## Slide 1: intro\n\n**VISUAL TYPE**: Data / Chart\n**TITLE**: A title\n"
    errs = _errors(_validate(spec))
    assert any("IMAGE PROMPT" in e for e in errs), errs


def test_normal_slide_without_title_is_error():
    spec = f"## Slide 1: intro\n\n**VISUAL TYPE**: Data / Chart\n**KICKER**: x\n**IMAGE PROMPT**:\n{FENCE}\nchart\n{FENCE}\n"
    errs = _errors(_validate(spec))
    assert any("TITLE" in e for e in errs), errs


def test_no_render_signal_is_error():
    # neither VISUAL TYPE nor RENDER MODE → would silently default to normal.
    spec = f"## Slide 1: intro\n\n**TITLE**: A title\n**IMAGE PROMPT**:\n{FENCE}\nchart\n{FENCE}\n"
    errs = _errors(_validate(spec))
    assert any("no VISUAL TYPE and no RENDER MODE" in e for e in errs), errs


def test_typo_render_mode_is_error():
    spec = f"## Slide 1: intro\n\n**RENDER MODE**: fullpge\n**TITLE**: t\n**IMAGE PROMPT**:\n{FENCE}\nx\n{FENCE}\n"
    errs = _errors(_validate(spec))
    assert any("RENDER MODE" in e for e in errs), errs


def test_unfilled_template_is_error():
    spec = f"## Slide 1: intro\n\n**VISUAL TYPE**: [PLACEHOLDER type]\n**TITLE**: t\n**IMAGE PROMPT**:\n{FENCE}\nx\n{FENCE}\n"
    errs = _errors(_validate(spec))
    assert any("unfilled-template" in e for e in errs), errs


def test_no_slide_blocks_is_error():
    errs = _errors(_validate("# just a heading\n\nsome prose, no slide blocks.\n"))
    assert any("no slide blocks" in e for e in errs), errs


def test_missing_kicker_is_warn_not_error():
    spec = f"## Slide 1: intro\n\n**VISUAL TYPE**: Data / Chart\n**TITLE**: t\n**IMAGE PROMPT**:\n{FENCE}\nx\n{FENCE}\n"
    problems = _validate(spec)
    assert _errors(problems) == [], _errors(problems)
    assert any("KICKER" in w for w in _warns(problems))


def test_duplicate_id_is_warn_not_error():
    spec = GOOD_NORMAL + GOOD_NORMAL.replace("## Slide 1:", "## Slide 2:")
    problems = _validate(spec)
    assert _errors(problems) == [], _errors(problems)
    assert any("appears 2 times" in w for w in _warns(problems)), _warns(problems)


def test_lists_all_problems_in_one_pass():
    # two broken slides: the parser would die on the first; the gate reports both.
    bad = ("## Slide 1: a\n\n**VISUAL TYPE**: Data / Chart\n\n"       # no TITLE, no IMAGE PROMPT
           "## Slide 2: b\n\n**VISUAL TYPE**: Data / Chart\n\n")      # same
    errs = _errors(_validate(bad))
    assert len(errs) >= 3, f"expected multiple errors in one pass, got: {errs}"


def test_deck_type_templates_are_flagged_unfilled():
    """The shipped deck-type templates are skeletons ([CASE_KICKER], [Case study
    visual — …]). The gate MUST flag every one — else an agent could generate
    straight from an unfilled template. This locks in the false-negative fix."""
    fw = Path(__file__).resolve().parent.parent
    for name, tmpl in layout.DECK_TYPE_TEMPLATES.items():
        path = fw / layout.DECK_TYPE_DIR / tmpl
        errs = _errors(s1.validate_specs([str(path)]))
        assert errs, f"deck-type template {name!r} passed validation but is an unfilled skeleton"


def test_safe_zone_is_read_from_palette():
    """stage1 reads header_lock.body_header_safe_zone from color_palette.json (a formerly
    dead field). A custom value takes effect; absence keeps the default."""
    import json as _json
    orig = s1.NORMAL_HEADER_SAFE_ZONE
    try:
        with tempfile.TemporaryDirectory() as td:
            sd = Path(td)
            # no palette → default unchanged
            s1._load_safe_zone_from_palette(sd / "color_palette.json")
            assert s1.NORMAL_HEADER_SAFE_ZONE == orig
            # palette with a deeper band → value takes effect
            (sd / "color_palette.json").write_text(
                _json.dumps({"header_lock": {"body_header_safe_zone": 390}}), encoding="utf-8")
            s1._load_safe_zone_from_palette(sd / "color_palette.json")
            assert s1.NORMAL_HEADER_SAFE_ZONE == 390, "stage1 ignored palette body_header_safe_zone"
    finally:
        s1._apply_visual_config(s1.visual_config.DEFAULT_CONFIG)


# --- standalone runner -------------------------------------------------------

def _main() -> int:
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    failed = 0
    for t in tests:
        try:
            t()
            print(f"  ✓ {t.__name__}")
        except AssertionError as e:
            failed += 1
            print(f"  ✗ {t.__name__}\n      {e}")
        except Exception as e:
            failed += 1
            print(f"  ✗ {t.__name__} (ERROR: {type(e).__name__}: {e})")
    total = len(tests)
    print(f"\n{'✓ all' if not failed else f'✗ {failed}/{total}'} "
          f"{'passed' if not failed else 'FAILED'} ({total} tests)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(_main())
