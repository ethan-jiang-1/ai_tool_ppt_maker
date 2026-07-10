#!/usr/bin/env python3
"""
Smoke test for the run-bundle constitution (bundle_layout.py).

This closes the loop the framework was missing: it was bitten by drift once
(the outline.md incident), added --self-check as a drift ALARM, but nothing ever
pressed the alarm. This test presses it — plus proves the two claims the SSOT
makes but never verified:

  * `--init` produces a bundle whose structure is WHITELIST-CLEAN (no "unexpected"
    entry) — i.e. the scaffolder and the enforcer agree by construction;
  * a bundle, once the one artifact init legitimately can't make (style_master.jpg)
    exists, fully passes `--check`;
  * `--init --deck-type/--style` seeds the preset files into their canonical spots
    (the L2 hand-`cp` replacement), and the result is still --check-clean;
  * unknown preset names are rejected (whitelist philosophy at the content layer);
  * self_check() is clean against the real repo (CI drift alarm).

Dependencies: standard library only (tempfile + assert). Run either way:

    uv run python 06_reference_scripts/test_bundle_layout.py     # standalone
    uv run pytest 06_reference_scripts/test_bundle_layout.py     # if pytest present

Every `test_*` function is a plain-assert unit, so pytest collects them too.
"""

from __future__ import annotations

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle_layout as layout


def _init_bundle(tmp: Path, name: str = "deck_smoke", **kw) -> Path:
    """--init a bundle under tmp and return its v1 version dir (the --run-dir)."""
    deck_dir = tmp / name
    layout.init_bundle(deck_dir, **kw)
    return deck_dir / layout.VERSIONS_DIR / "v1"


def _unexpected(violations: list[str]) -> list[str]:
    """Only the whitelist ('unexpected …') violations — the ones --init controls.
    Missing-required-file violations (e.g. style_master.jpg) are legitimate pre-
    pipeline gaps, not scaffolder bugs."""
    return [v for v in violations if "unexpected" in v]


def _approve_gates(run_dir: Path) -> None:
    metadata = layout.deck_root(run_dir) / layout.METADATA_FILE
    text = metadata.read_text(encoding="utf-8")
    metadata.write_text(
        text.replace("content_gate: pending", "content_gate: approved")
            .replace("visual_gate: pending", "visual_gate: approved"),
        encoding="utf-8")


def test_init_is_whitelist_clean():
    """A freshly-init'd bundle has zero WHITELIST violations (scaffolder ⊆ enforcer)."""
    with tempfile.TemporaryDirectory() as td:
        run_dir = _init_bundle(Path(td))
        unexpected = _unexpected(layout.check_bundle(run_dir))
        assert unexpected == [], f"init produced non-canonical entries: {unexpected}"


def test_init_then_style_master_passes_check_fully():
    """Once style_master.jpg exists (the one thing init can't generate), --check is clean."""
    with tempfile.TemporaryDirectory() as td:
        run_dir = _init_bundle(Path(td))
        # init seeds slide-specifications.md already; the only remaining required
        # artifact is the style master image (made in Phase 2). Stub it.
        (layout.style_dir(run_dir) / layout.STYLE_MASTER_IMAGE).write_bytes(b"stub")
        _approve_gates(run_dir)
        violations = layout.check_bundle(run_dir)
        assert violations == [], f"completed bundle still fails --check: {violations}"


def test_fresh_init_passes_structure_only_check():
    """A just-scaffolded bundle passes the STRUCTURE-only check with NO style_master
    workaround — this is the Phase-0 gate fix (the full check used to always fail
    right after init because style_master.jpg is a Phase-2 output)."""
    with tempfile.TemporaryDirectory() as td:
        run_dir = _init_bundle(Path(td))
        # full check must still complain about the missing Phase-2 artifact...
        assert any(layout.STYLE_MASTER_IMAGE in v for v in layout.check_bundle(run_dir))
        # ...but structure-only must be clean, with no style_master mention.
        structural = layout.check_bundle(run_dir, require_pipeline_ready=False)
        assert structural == [], f"fresh init fails structure-only check: {structural}"


def test_init_with_presets_seeds_canonical_spots():
    """--deck-type + --style land the preset files in their canonical locations."""
    with tempfile.TemporaryDirectory() as td:
        run_dir = _init_bundle(Path(td), name="deck_preset",
                               deck_type="keynote", style="dark-executive")
        vs = layout.style_dir(run_dir)
        # style preset → visual-style/ (deck_system.txt + color_palette.json)
        for fname in layout.STYLE_PRESET_FILES:
            assert (vs / fname).is_file(), f"style preset did not seed {fname}"
        # deck-type preset → slide-specifications.md, byte-identical to the template
        specs = layout.find_slide_specs(run_dir)
        assert specs is not None, "no slide-specifications.md after --deck-type init"
        tmpl = (Path(__file__).resolve().parent.parent
                / layout.DECK_TYPE_DIR / layout.DECK_TYPE_TEMPLATES["keynote"])
        assert specs.read_bytes() == tmpl.read_bytes(), \
            "slide-specifications.md was not seeded from the keynote template"
        # …and the seeded bundle is still whitelist-clean.
        assert _unexpected(layout.check_bundle(run_dir)) == [], \
            "preset seeding introduced a non-canonical entry"


def test_unknown_preset_rejected():
    """Unknown deck-type / style names raise (content-layer whitelist)."""
    with tempfile.TemporaryDirectory() as td:
        for kw in ({"deck_type": "no-such-type"}, {"style": "no-such-style"}):
            raised = False
            try:
                layout.init_bundle(Path(td) / "deck_x", **kw)
            except ValueError:
                raised = True
            assert raised, f"init_bundle accepted an unknown preset: {kw}"


def test_version_dir_shape_is_strict():
    with tempfile.TemporaryDirectory() as td:
        root = Path(td) / "not_a_deck" / layout.VERSIONS_DIR / "draft"
        root.mkdir(parents=True)
        assert not layout.is_version_dir(root)


def test_init_is_idempotent():
    """Re-running --init doesn't crash or corrupt; result stays whitelist-clean."""
    with tempfile.TemporaryDirectory() as td:
        deck_dir = Path(td) / "deck_again"
        layout.init_bundle(deck_dir)
        layout.init_bundle(deck_dir)  # second run must be a no-op-ish, not an error
        run_dir = deck_dir / layout.VERSIONS_DIR / "v1"
        assert _unexpected(layout.check_bundle(run_dir)) == []


def test_self_check_clean():
    """The SSOT drift alarm is silent against the real repo (CI guard)."""
    drift = layout.self_check()
    assert drift == [], "SSOT self-inconsistency:\n  - " + "\n  - ".join(drift)


def test_load_dotenv_populates_without_override():
    """.env is loaded into os.environ (quotes/export/comments handled) but never
    overrides a var already set in the real environment."""
    import os
    with tempfile.TemporaryDirectory() as td:
        d = Path(td)
        (d / ".env").write_text(
            "# a comment\nexport FOO_KEY=abc\nBAR_URL='https://x/v1'\nPRESET=fromfile\n",
            encoding="utf-8")
        os.environ.pop("FOO_KEY", None)
        os.environ.pop("BAR_URL", None)
        os.environ["PRESET"] = "fromenv"  # already set → must win over the .env
        try:
            loaded = layout.load_dotenv(d)
            assert loaded is not None
            assert os.environ.get("FOO_KEY") == "abc"
            assert os.environ.get("BAR_URL") == "https://x/v1"   # quotes stripped
            assert os.environ.get("PRESET") == "fromenv"          # not overridden
        finally:
            for k in ("FOO_KEY", "BAR_URL", "PRESET"):
                os.environ.pop(k, None)


def test_init_scaffolds_credentials_and_deps():
    """--init drops the credential + dependency homes with the var names the ACTUAL
    generator reads (APIMART_*), the real Stage-2 dep (httpx), and a .gitignore so
    the secret .env isn't committed."""
    with tempfile.TemporaryDirectory() as td:
        deck = Path(td) / "deck_creds"
        layout.init_bundle(deck)
        env_example = (deck / ".env.example").read_text(encoding="utf-8")
        assert "OPENAI_API_KEY" in env_example and "OPENAI_BASE_URL" in env_example
        pyproject = (deck / "pyproject.toml").read_text(encoding="utf-8")
        assert all(p in pyproject for p in ("python-pptx", "Pillow", "httpx"))
        gitignore = (deck / ".gitignore").read_text(encoding="utf-8")
        assert ".env" in gitignore  # the secret must be ignored


def test_partial_style_override_falls_back_per_file():
    """A one-file visual override must not shadow the other backbone assets."""
    with tempfile.TemporaryDirectory() as td:
        run_dir = _init_bundle(Path(td), style="dark-executive")
        backbone_style = layout.backbone_dir(run_dir) / layout.BACKBONE_STYLE_SUBDIR
        (backbone_style / layout.STYLE_MASTER_IMAGE).write_bytes(b"backbone-style")
        override_style = run_dir / layout.OVERRIDES_SUBDIR / layout.BACKBONE_STYLE_SUBDIR
        override_style.mkdir()
        override_palette = override_style / layout.COLOR_PALETTE_FILE
        override_palette.write_text("{}", encoding="utf-8")

        assert layout.style_asset(run_dir, layout.COLOR_PALETTE_FILE) == override_palette
        assert layout.style_asset(run_dir, layout.DECK_SYSTEM_FILE) == \
            backbone_style / layout.DECK_SYSTEM_FILE
        assert layout.style_asset(run_dir, layout.STYLE_MASTER_IMAGE) == \
            backbone_style / layout.STYLE_MASTER_IMAGE


def test_new_version_excludes_generated_artifacts():
    """Version creation copies source delta only, never stale images/JSON/PPTX."""
    with tempfile.TemporaryDirectory() as td:
        run_dir = _init_bundle(Path(td))
        generated = run_dir / layout.GENERATED_SUBDIR
        (generated / "stale.png").write_bytes(b"old")
        manuscript = run_dir / layout.OVERRIDES_SUBDIR / layout.BACKBONE_MANUSCRIPT_SUBDIR
        manuscript.mkdir()
        (manuscript / "keep.txt").write_text("delta", encoding="utf-8")

        target = layout.create_version(run_dir)
        assert target.name == "v2"
        assert (target / layout.SLIDE_SPECS_NAME).is_file()
        assert (target / layout.OVERRIDES_SUBDIR / layout.BACKBONE_MANUSCRIPT_SUBDIR
                / "keep.txt").read_text() == "delta"
        assert not (target / layout.GENERATED_SUBDIR / "stale.png").exists()
        assert (target / layout.GENERATED_SUBDIR / "README.md").is_file()


def test_init_deck_guide_is_actionable():
    """A new bundle ships a real guide, not a placeholder telling the agent to fill it."""
    with tempfile.TemporaryDirectory() as td:
        deck = Path(td) / "deck_guide"
        layout.init_bundle(deck)
        guide = (deck / layout.GUIDE_FILE).read_text(encoding="utf-8")
        assert "从 `_ppt_framework" not in guide
        assert "uv run python" in guide
        assert "--resolution 1k" in guide
        assert "--force-images" in guide
        assert "--new-version" in guide
        assert "content_gate" in guide and "visual_gate" in guide
        assert "{{" not in guide


def test_pipeline_readiness_enforces_human_phase_gates():
    with tempfile.TemporaryDirectory() as td:
        run_dir = _init_bundle(Path(td))
        (layout.style_dir(run_dir) / layout.STYLE_MASTER_IMAGE).write_bytes(b"stub")
        violations = layout.check_bundle(run_dir)
        assert any("content_gate" in v for v in violations)
        assert any("visual_gate" in v for v in violations)
        _approve_gates(run_dir)
        assert layout.check_bundle(run_dir) == []


# --- standalone runner (no pytest needed) ------------------------------------

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
        except Exception as e:  # unexpected error → also a failure, show the type
            failed += 1
            print(f"  ✗ {t.__name__} (ERROR: {type(e).__name__}: {e})")
    total = len(tests)
    print(f"\n{'✓ all' if not failed else f'✗ {failed}/{total}'} "
          f"{'passed' if not failed else 'FAILED'} ({total} tests)")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(_main())
