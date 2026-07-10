#!/usr/bin/env python3
"""Static drift guards for framework docs and preset contracts."""

from __future__ import annotations

import json
import re
from pathlib import Path

FRAMEWORK = Path(__file__).resolve().parent.parent


def test_markdown_links_resolve():
    broken: list[str] = []
    pattern = re.compile(r"\[[^\]]*\]\(([^)]+)\)")
    for doc in FRAMEWORK.rglob("*.md"):
        text = doc.read_text(encoding="utf-8")
        for match in pattern.finditer(text):
            raw = match.group(1).strip()
            if raw.startswith(("http://", "https://", "mailto:", "#")):
                continue
            target = raw.split("#", 1)[0].strip()
            if not target:
                continue
            if doc.name == "template-deck-guide.md" and target == "deck-guide.md":
                continue  # link becomes valid after the template is instantiated
            if not (doc.parent / target).resolve().exists():
                line = text.count("\n", 0, match.start()) + 1
                broken.append(f"{doc.relative_to(FRAMEWORK)}:{line}: {raw}")
    assert not broken, "broken markdown links:\n" + "\n".join(broken)


def test_active_docs_do_not_use_retired_contracts():
    forbidden = {
        r"v\{n\}/style": "retired visual-style path",
        r"deck_brief\.md": "retired monolithic brief",
        r"style_master_v\d": "version duplicated in canonical filename",
        r'"prompts"\s*:': "retired _prompts.json root key",
        r"--prompt-json deck_\{NAME\}/style-master": "unsupported style-master command",
    }
    offenders: list[str] = []
    for path in FRAMEWORK.rglob("*"):
        if path.suffix not in {".md", ".py", ".txt", ".json"}:
            continue
        if path.name == "VERSION_LOG.md" or path.name == "stage2_generate_images.LEGACY.py":
            continue
        text = path.read_text(encoding="utf-8")
        for pattern, label in forbidden.items():
            if re.search(pattern, text):
                offenders.append(f"{path.relative_to(FRAMEWORK)}: {label}")
    assert not offenders, "retired contracts found:\n" + "\n".join(offenders)


def test_bootstrap_locks_medium_before_preset():
    text = (FRAMEWORK / "BOOTSTRAP.md").read_text(encoding="utf-8")
    headings = re.findall(r"^### (3\.[1-5]) (.+)$", text, flags=re.M)
    assert [number for number, _ in headings] == ["3.1", "3.2", "3.3", "3.4", "3.5"]
    titles = dict(headings)
    assert "Medium" in titles["3.4"]
    assert "视觉预设" in titles["3.5"]


def test_visual_presets_share_executable_schema():
    presets = FRAMEWORK / "01_visual_style_master" / "presets"
    problems: list[str] = []
    for preset in sorted(path for path in presets.iterdir() if path.is_dir()):
        palette = json.loads((preset / "color_palette.json").read_text(encoding="utf-8"))
        canvas = palette.get("canvas", {})
        for key in ("width_px", "height_px"):
            if not isinstance(canvas.get(key), int):
                problems.append(f"{preset.name}: missing canvas.{key}")
        body = palette.get("body_layout", {})
        for key in ("content_top_gap_px", "content_bottom_px", "callout_top_px",
                    "callout_bottom_px", "no_callout_bottom_px"):
            if not isinstance(body.get(key), int):
                problems.append(f"{preset.name}: missing body_layout.{key}")
        header = palette.get("header_lock", {})
        if not isinstance(header.get("body_header_safe_zone"), int):
            problems.append(f"{preset.name}: missing header_lock.body_header_safe_zone")
        position = header.get("position", {})
        for key in ("left_px", "right_margin_px", "kicker_y_px", "title_y_px",
                    "subtitle_gap_px", "title_line_height_px", "subtitle_line_height_px"):
            if not isinstance(position.get(key), int):
                problems.append(f"{preset.name}: missing header_lock.position.{key}")
        fonts = header.get("fonts", {})
        for role in ("kicker", "title", "subtitle"):
            if not all(key in fonts.get(role, {})
                       for key in ("family", "weight", "color", "size_px")):
                problems.append(f"{preset.name}: incomplete header font role {role}")
        system = (preset / "deck_system.txt").read_text(encoding="utf-8")
        for section in ("LANGUAGE", "FORBIDDEN"):
            if section not in system:
                problems.append(f"{preset.name}: deck_system missing {section}")
    assert not problems, "preset contract drift:\n" + "\n".join(problems)


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
