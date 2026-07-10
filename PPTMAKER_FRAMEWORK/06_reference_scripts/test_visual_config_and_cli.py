#!/usr/bin/env python3
"""Tests for shared visual configuration and the friendly workflow CLI."""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ppt_flow
import stage1_build_inputs as stage1
import stage3_lock_headers as stage3
import unified_pipeline as pipeline
import visual_config


def test_shared_config_drives_stage1_and_stage3():
    custom = visual_config.parse_visual_config({
        "background": "#ffffff",
        "canvas": {"width_px": 1600, "height_px": 900},
        "body_layout": {
            "content_top_gap_px": 24,
            "content_bottom_px": 730,
            "callout_top_px": 750,
            "callout_bottom_px": 860,
            "no_callout_bottom_px": 850,
        },
        "header_lock": {
            "body_header_safe_zone": 240,
            "opener_safe_zone": 360,
            "position": {
                "left_px": 50,
                "right_margin_px": 70,
                "kicker_y_px": 20,
                "title_y_px": 54,
                "subtitle_gap_px": 10,
                "title_line_height_px": 50,
                "subtitle_line_height_px": 30,
            },
            "fonts": {
                "kicker": {"family": "Noto Sans", "weight": "Medium",
                           "size_px": 20, "color": "#333333"},
                "title": {"family": "Noto Sans", "weight": "Black",
                          "size_px": 44, "color": "#111111"},
                "subtitle": {"family": "Noto Sans", "weight": "Regular",
                             "size_px": 26, "color": "#555555"},
            },
        },
    })
    try:
        stage1._apply_visual_config(custom)
        stage3._apply_visual_config(custom)
        contract = stage1._build_layout_contract("s1", "Data / Chart", "")
        assert contract["canvas"] == [1600, 900]
        assert contract["header_safe_zone"] == 240
        assert contract["content_y_min"] == 264
        assert stage3.CANVAS_SIZE == (1600, 900)
        assert stage3.TITLE_POS == (50, 54)
        assert stage3.MAX_TITLE_WIDTH == 1480
        assert stage3.TITLE_FONT_FAMILY == "Noto Sans"
        assert stage3.TITLE_FONT_WEIGHT == "Black"
    finally:
        stage1._apply_visual_config(visual_config.DEFAULT_CONFIG)
        stage3._apply_visual_config(visual_config.DEFAULT_CONFIG)


def test_invalid_layout_fails_loud():
    try:
        visual_config.parse_visual_config({
            "canvas": {"width_px": 100, "height_px": 100},
            "body_layout": {"content_bottom_px": 120},
        })
    except visual_config.VisualConfigError as exc:
        assert "inside the canvas" in str(exc)
    else:
        raise AssertionError("invalid visual config should not silently fall back")


def test_font_candidates_use_configured_family_and_weight():
    candidates = stage3._font_name_candidates("Noto Sans CJK SC", "Bold")
    assert "NotoSansCJKSC-Bold.otf" in candidates
    assert not any("SourceSansPro" in candidate for candidate in candidates)


def test_pilot_selection_covers_opener_body_closer():
    slides = [
        {"id": "open", "layout_contract": {"render_mode": "full-page"}},
        {"id": "body1", "layout_contract": {"render_mode": "body+header-lock"}},
        {"id": "body2", "layout_contract": {"render_mode": "body+header-lock"}},
        {"id": "close", "layout_contract": {"render_mode": "full-page"}},
    ]
    assert ppt_flow.select_pilot_slide_ids(slides) == ["open", "body1", "close"]


def test_gate_update_preserves_metadata():
    with tempfile.TemporaryDirectory() as td:
        metadata = Path(td) / "project-metadata.yaml"
        metadata.write_text("# keep\ntopic: test\ncontent_gate: pending\n", encoding="utf-8")
        ppt_flow.update_gate(metadata, "content")
        text = metadata.read_text(encoding="utf-8")
        assert "# keep" in text and "topic: test" in text
        assert "content_gate: approved" in text


def test_visual_refresh_requires_explicit_scope():
    args = argparse.Namespace(
        run_dir="deck_x/3_versions/v1", kind="visual", only=None, all=False,
        resolution="2k", base_url=None, dry_run=True)
    assert ppt_flow.command_refresh(args) == 1


def test_prompt_subset_keeps_only_pilot_pages():
    with tempfile.TemporaryDirectory() as td:
        root = Path(td)
        source = root / "all.json"
        target = root / "pilot.json"
        source.write_text(json.dumps({"slides": [
            {"id": "a", "out": "01_a.png"},
            {"id": "b", "out": "02_b.png"},
            {"id": "c", "out": "03_c.png"},
        ]}), encoding="utf-8")
        pipeline.write_prompt_subset(source, target, ["a", "c"])
        slides = json.loads(target.read_text(encoding="utf-8"))["slides"]
        assert [slide["id"] for slide in slides] == ["a", "c"]


def _main() -> int:
    tests = [value for name, value in sorted(globals().items())
             if name.startswith("test_") and callable(value)]
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  ✓ {test.__name__}")
        except Exception as exc:
            failed += 1
            print(f"  ✗ {test.__name__} ({type(exc).__name__}: {exc})")
    print(f"\n{'✓ all' if not failed else f'✗ {failed}/{len(tests)}'} "
          f"{'passed' if not failed else 'FAILED'} ({len(tests)} tests)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(_main())
