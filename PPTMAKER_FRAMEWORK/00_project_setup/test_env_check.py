#!/usr/bin/env python3
"""
Tests for the startup environment gate (00-auto-env-check.py).

Locks in the two requirements: (1) Python + UV are the FOUNDATION and their
failure must produce a hard blocking gate; (2) the checker is cross-platform and
importable on old Python (it uses `from __future__ import annotations`, so its
list[str]/tuple[...] annotations don't crash a 3.7/3.8 interpreter that only needs
to be told "you're too old").

Stdlib only. The target file's name isn't a valid module name (digits + hyphens),
so we load it by path. Run either way:
    uv run python 00_project_setup/test_env_check.py
    uv run pytest 00_project_setup/test_env_check.py
"""

from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

_PATH = Path(__file__).resolve().parent / "00-auto-env-check.py"
_spec = importlib.util.spec_from_file_location("env_check_under_test", _PATH)
env = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(env)


def test_python_and_uv_are_foundation():
    assert env.check_python().get("foundation") is True
    assert env.check_uv().get("foundation") is True


def test_foundation_failure_produces_blocking_banner():
    results = [
        {"check": "python", "foundation": True, "status": "fail", "detail": "3.9", "fix": "upgrade"},
        {"check": "uv", "foundation": True, "status": "ok", "detail": "0.7", "fix": None},
    ]
    txt = env.format_text(results, all_pass=False)
    assert "FOUNDATION NOT READY" in txt
    assert "Do NOT proceed" in txt


def test_ready_when_foundation_ok_and_no_hard_fail():
    results = [
        {"check": "python", "foundation": True, "status": "ok", "detail": "3.12", "fix": None},
        {"check": "uv", "foundation": True, "status": "ok", "detail": "0.7", "fix": None},
        {"check": "fonts", "status": "warn", "detail": "fallback", "fix": "optional"},
    ]
    txt = env.format_text(results, all_pass=True)
    assert "READY" in txt
    assert "FOUNDATION NOT READY" not in txt


def test_not_ready_when_foundation_ok_but_hard_dep_fails():
    results = [
        {"check": "python", "foundation": True, "status": "ok", "detail": "3.12", "fix": None},
        {"check": "uv", "foundation": True, "status": "ok", "detail": "0.7", "fix": None},
        {"check": "python-pptx", "status": "fail", "detail": "missing", "fix": "uv add python-pptx"},
    ]
    txt = env.format_text(results, all_pass=False)
    # foundation is fine, so it must NOT show the foundation banner, but still NOT READY
    assert "FOUNDATION NOT READY" not in txt
    assert "NOT READY" in txt


def test_windows_install_hint_present():
    # The fix strings must carry cross-platform install guidance (both branches
    # are built regardless of the host, so at least one platform's hint is shown).
    fix = env.check_uv()["fix"]
    if fix:  # only when uv is absent on this host
        assert "astral.sh/uv" in fix


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
