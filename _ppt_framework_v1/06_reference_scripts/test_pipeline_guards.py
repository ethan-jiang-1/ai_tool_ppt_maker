#!/usr/bin/env python3
"""
Tests for Front A — the pipeline fail-loud guards (stage3/stage4/stage5).

These lock in fixes for the SILENT failures a review surfaced: a partial Stage-2
run used to shrink the deck and shift every speaker note; an unanchored `*id*`
glob cross-matched 's1' onto '10_s10.png'; and a missing font fell back to
ImageFont.load_default() — a fixed-size bitmap that ignores size_px, so every
normal slide shipped a garbled, mis-sized header. The rule now: fail loud (or, for
fonts, degrade to a readable *correctly-sized* fallback), never silently wrong.

Stdlib + Pillow (already a pipeline dep). Run either way:
    uv run python 06_reference_scripts/test_pipeline_guards.py
    uv run pytest 06_reference_scripts/test_pipeline_guards.py
"""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import stage3_lock_headers as s3
import stage4_build_pptx as s4
import unified_pipeline as pipeline

HERE = Path(__file__).resolve().parent


def _touch_pngs(d: Path, names: list[str]) -> None:
    for n in names:
        (d / n).write_bytes(b"\x89PNG\r\n")  # content irrelevant for matching tests


# --- anchored image matching (no substring cross-hits) -----------------------

def test_match_is_anchored_not_substring():
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        _touch_pngs(d, ["01_s1.png", "10_s10.png", "11_s11.png"])
        assert [p.name for p in s3.match_slide_image(d, "s1")] == ["01_s1.png"]
        assert [p.name for p in s3.match_slide_image(d, "s10")] == ["10_s10.png"]
        # stage4 uses the same rule
        assert [p.name for p in s4.match_slide_image(d, "s1")] == ["01_s1.png"]


def test_match_bare_id_and_multiword():
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        _touch_pngs(d, ["intro.png", "03_k03_case_study.png"])
        assert [p.name for p in s3.match_slide_image(d, "intro")] == ["intro.png"]
        assert [p.name for p in s3.match_slide_image(d, "k03_case_study")] == ["03_k03_case_study.png"]


def test_resolve_images_aborts_on_missing():
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        _touch_pngs(d, ["01_a.png"])  # 'b' missing
        try:
            s3.resolve_images(d, [{"id": "a"}, {"id": "b"}])
            assert False, "expected SystemExit on a missing image"
        except SystemExit as e:
            assert "b" in str(e)


def test_resolve_images_aborts_on_ambiguous():
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        _touch_pngs(d, ["01_a.png", "02_a.png"])  # two match id 'a'
        try:
            s3.resolve_images(d, [{"id": "a"}])
            assert False, "expected SystemExit on ambiguous images"
        except SystemExit as e:
            assert "ambiguous" in str(e)


# --- font resolution never silently mis-sizes --------------------------------

def test_font_respects_size():
    small = s3._load_font(s3.FONT_REGULAR, 20)
    big = s3._load_font(s3.FONT_REGULAR, 80)
    # A size-respecting font renders taller glyphs at 80 than at 20. load_default()
    # (the old fallback) would return identical metrics — this would fail then.
    assert big.getbbox("Ag")[3] > small.getbbox("Ag")[3]


def test_missing_font_never_returns_fixed_default():
    try:
        f = s3._load_font("No_Such_Font_ZZZ.otf", 44)
    except SystemExit:
        return  # acceptable: loud abort when no fallback exists at all
    # if it resolved a fallback, that fallback must honor the requested size.
    assert getattr(f, "size", None) == 44


# --- integration: stage3 end-to-end, happy path + fail-loud ------------------

def _make_plan(d: Path, ids_variants: list[tuple[str, str]]) -> Path:
    """ids_variants: (slide_id, render_mode) — accept canonical or legacy aliases."""
    slides = []
    for sid, variant in ids_variants:
        # Normalize legacy test inputs to canonical render_mode
        if variant in ("image_direct", "full-page"):
            mode = "full-page"
            safe = 0
        else:
            mode = "body+header-lock"
            safe = 260
        slides.append({
            "id": sid, "visual_type": "Data / Chart", "kicker": "CTX",
            "headline": "A readable title", "layout_contract": {
                "canvas": [1672, 941], "render_mode": mode,
                "header_safe_zone": safe,
                "content_y_min": 290, "content_y_max": 890, "has_bottom_callout": False}})
    plan = d / "slide_plan.json"
    plan.write_text(json.dumps({"slides": slides}), encoding="utf-8")
    return plan


def _run_stage3(images: Path, plan: Path, out: Path) -> subprocess.CompletedProcess:
    return subprocess.run(
        [sys.executable, str(HERE / "stage3_lock_headers.py"),
         "--images", str(images), "--slide-plan", str(plan), "--out", str(out)],
        capture_output=True, text=True)


def test_stage3_happy_path_renders():
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        imgs = d / "page_images_full"; imgs.mkdir()
        Image.new("RGB", (1672, 941), (10, 20, 40)).save(imgs / "01_intro.png")
        plan = _make_plan(d, [("intro", "body+header-lock")])
        out = d / "header_locked"
        r = _run_stage3(imgs, plan, out)
        assert r.returncode == 0, f"stage3 failed unexpectedly:\n{r.stdout}\n{r.stderr}"
        assert (out / "01_intro.png").exists(), "stage3 did not produce the locked image"


def test_stage3_aborts_on_missing_image():
    from PIL import Image
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        imgs = d / "page_images_full"; imgs.mkdir()
        Image.new("RGB", (1672, 941), (10, 20, 40)).save(imgs / "01_intro.png")
        # plan wants two slides, only one image present → must abort, write nothing
        plan = _make_plan(d, [("intro", "body+header-lock"), ("missing", "body+header-lock")])
        out = d / "header_locked"
        r = _run_stage3(imgs, plan, out)
        assert r.returncode != 0, "stage3 should abort on a partial image set"
        assert not (out / "01_intro.png").exists(), "stage3 wrote a partial deck before aborting"


def test_stage2_only_forces_selected_image_without_duplicate_system():
    """Chain B refreshes an existing selected page and does not re-prepend deck_system."""
    captured: list[str] = []
    original_find = pipeline.find_stage2_script
    original_contact = pipeline.find_contact_sheet_script
    original_run = pipeline.run_stage
    try:
        pipeline.find_stage2_script = lambda: HERE / "fake_stage2.py"
        pipeline.find_contact_sheet_script = lambda: HERE / "fake_contact.py"
        pipeline.run_stage = lambda script, args, stage_name, dry_run=False: captured.extend(args) or True
        with tempfile.TemporaryDirectory() as td:
            run_dir = Path(td) / "deck_x" / "3_versions" / "v1"
            assert pipeline.stage2(run_dir, only="slide_07", dry_run=True)
        assert "--force" in captured, "--only must refresh, not skip an existing image"
        assert "--system" not in captured, "deck_system is already assembled by Stage 1"
        assert "--prompt-is-final" in captured, "Stage 2 must not mutate Stage-1 audited prompts"
        assert any("contact_sheet.jpg" in value for value in captured), \
            "Stage 2 must leave a fixed QA contact sheet artifact"
    finally:
        pipeline.find_stage2_script = original_find
        pipeline.find_contact_sheet_script = original_contact
        pipeline.run_stage = original_run


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
