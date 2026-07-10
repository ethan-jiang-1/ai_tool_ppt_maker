#!/usr/bin/env python3
"""Zero-dependency environment checker for _ppt_framework.

Run this FIRST, before anything else — it is the hard startup gate. Python 3.11+
and UV are the FOUNDATION: if either is missing you may not proceed; fix them and
re-run. It also checks the rest (API key, deps, fonts) and prints a clear
READY / NOT READY report.

Cross-platform: runs on macOS, Linux, and Windows, and imports on Python 3.7+ (so
it can even tell an old Python "you're too old"). No imports beyond stdlib. Because
it is the thing that CHECKS FOR uv, it must run WITHOUT uv — invoke it with a bare
interpreter, not `uv run`:

    python3 00-auto-env-check.py          # macOS / Linux
    python  00-auto-env-check.py          # Windows (or: py 00-auto-env-check.py)
    python3 00-auto-env-check.py --json   # machine-readable output
"""

from __future__ import annotations

import json
import os
import shlex
import shutil
import subprocess
import sys
from pathlib import Path

IS_WINDOWS = os.name == "nt"


def _run(cmd: list[str], timeout: int = 15) -> tuple[int, str, str]:
    """Run a command, return (returncode, stdout, stderr)."""
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return p.returncode, p.stdout.strip(), p.stderr.strip()
    except FileNotFoundError:
        return -1, "", "command not found"
    except subprocess.TimeoutExpired:
        return -2, "", "timed out"


def check_python() -> dict:
    """Check Python 3.11+. FOUNDATION — blocks startup if missing/too old."""
    major, minor = sys.version_info[:2]
    ok = (major, minor) >= (3, 11)
    win_fix = "Windows: install from https://python.org (tick 'Add python.exe to PATH'), or `winget install Python.Python.3.12`"
    unix_fix = "macOS: `brew install python@3.12`. Linux: use your package manager or https://python.org"
    return {
        "check": "python",
        "foundation": True,
        "status": "ok" if ok else "fail",
        "detail": f"Python {major}.{minor}.{sys.version_info.micro}",
        "fix": None if ok else f"Need Python 3.11+. {win_fix if IS_WINDOWS else unix_fix}",
    }


def check_uv() -> dict:
    """Check UV package manager. FOUNDATION — blocks startup if missing."""
    rc, out, err = _run(["uv", "--version"])
    ok = rc == 0
    win_fix = 'Windows (PowerShell): `powershell -c "irm https://astral.sh/uv/install.ps1 | iex"`, then reopen the terminal'
    unix_fix = "macOS / Linux: `curl -LsSf https://astral.sh/uv/install.sh | sh`, then reopen the terminal"
    return {
        "check": "uv",
        "foundation": True,
        "status": "ok" if ok else "fail",
        "detail": out if ok else "not found",
        "fix": None if ok else f"Install UV. {win_fix if IS_WINDOWS else unix_fix}",
    }


def _load_dotenv(*search_dirs: Path) -> Path | None:
    """Load KEY=VALUE from the first .env found into os.environ (does NOT override
    already-set vars). Standalone stdlib copy — this checker imports no framework
    code so it can run before anything is installed. Mirrors bundle_layout.load_dotenv."""
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
            key, val = key.strip(), val.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = val
        return env_file
    return None


def check_api_key() -> dict:
    """Check for the image-generation API key (Stage 2 can't run without one).

    Framework-facing config uses OPENAI_API_KEY. APIMART_API_KEY (the current
    skill's native name) is also accepted; wrappers bridge OPENAI_API_KEY to it.
    Endpoint contract compatibility remains the responsibility of the skill adapter."""
    openai_key = os.environ.get("OPENAI_API_KEY")
    apimart = os.environ.get("APIMART_API_KEY")
    source = "OPENAI_API_KEY" if openai_key else ("APIMART_API_KEY" if apimart else None)
    return {
        "check": "api_key",
        "status": "ok" if source else "fail",
        "detail": f"found ({source})" if source else "not set",
        "fix": None if source else (
            "Stage 2 (image generation) needs a key. Put it in the deck's .env (loaded "
            "automatically every run — set it ONCE):\n"
            "  OPENAI_API_KEY=sk-...        # OpenAI-compatible: OpenAI / APIMart / ZenMux / …\n"
            "  (a .env.example is scaffolded into the deck by `bundle_layout.py --init`.)"
        ),
    }


def check_base_url() -> dict:
    """Check the image API base URL. OPTIONAL (defaults apply). Informational only —
    surfaced so a first-time user sees which endpoint will be hit. Canonical name is
    the OpenAI-compatible OPENAI_BASE_URL; APIMART_BASE_URL also accepted."""
    url = (os.environ.get("OPENAI_BASE_URL") or os.environ.get("APIMART_BASE_URL")
           or os.environ.get("APIMART_BASE_URLS"))
    return {
        "check": "image_base_url",
        "status": "ok",
        "detail": f"set ({url})" if url else "unset — the Stage-2 backend uses its default endpoint",
        "fix": None if url else (
            "Optional. To pin a specific endpoint/relay, set OPENAI_BASE_URL in the deck's .env, e.g.\n"
            "  OPENAI_BASE_URL=https://your-relay-endpoint/v1"),
    }


def check_fonts() -> dict:
    """Check for the Header-Lock style-anchor font (Source Sans Pro).

    Purely advisory: Stage 3 now resolves fonts cross-platform and, if the anchor
    face is absent, degrades to a readable, correctly-sized fallback sans (never the
    old mis-sized bitmap). A miss NEVER blocks — headers just use a different sans."""
    bundled = Path(__file__).resolve().parent.parent / "06_reference_scripts" / "fonts"
    search_dirs = [
        bundled,
        Path("/Library/Fonts"), Path.home() / "Library" / "Fonts",
        Path("/usr/share/fonts"), Path.home() / ".fonts",
        Path.home() / ".local" / "share" / "fonts",
        Path("C:/Windows/Fonts"),
    ]
    env = os.environ.get("PPT_FONT_DIR")
    if env:
        search_dirs.insert(0, Path(env))

    found = any(d.is_dir() and any(d.rglob("SourceSansPro-*.otf")) for d in search_dirs)

    return {
        "check": "fonts",
        "status": "ok" if found else "warn",
        "detail": ("Source Sans Pro available" if found else
                   "Source Sans Pro not found — Stage 3 will use a readable fallback sans"),
        "fix": None if found else (
            "Optional. For the exact style-anchor typeface, drop SourceSansPro-*.otf into "
            "06_reference_scripts/fonts/ (or set $PPT_FONT_DIR). Otherwise headers still "
            "render correctly, just in a fallback sans."
        ),
    }


def check_python_packages() -> list[dict]:
    """Check pipeline Python deps IN THE UV ENVIRONMENT (where the pipeline runs via
    `uv run python`), not in whatever interpreter launched this preflight — otherwise
    a bare-python preflight would falsely report the uv-managed deps as missing.
    The real Stage-2 image path imports httpx (generate_image_apimart.py), NOT
    requests, so httpx is a HARD requirement; python-pptx (Stage 4/5) and Pillow
    (Stage 3) too."""
    specs = [("pptx", "python-pptx", True), ("PIL", "Pillow", True), ("httpx", "httpx", True)]

    probe = (
        "import importlib\n"
        "for m in ['pptx','PIL','httpx']:\n"
        "    try:\n"
        "        importlib.import_module(m); print(m+':ok')\n"
        "    except Exception:\n"
        "        print(m+':no')\n"
    )
    rc, out, err = _run(["uv", "run", "python", "-c", probe], timeout=120)

    status_map: dict[str, bool] = {}
    if rc == -1:
        # uv unavailable — fall back to THIS interpreter (best-effort). The
        # foundation check already flags the missing uv as the real blocker.
        env_label = "current interpreter"
        for import_name, _, _ in specs:
            try:
                __import__(import_name)
                status_map[import_name] = True
            except ImportError:
                status_map[import_name] = False
    else:
        env_label = "uv env"
        for line in out.splitlines():
            if ":" in line:
                m, st = line.rsplit(":", 1)
                status_map[m.strip()] = (st.strip() == "ok")

    results = []
    for import_name, pip_name, required in specs:
        importable = status_map.get(import_name, False)
        results.append({
            "check": pip_name,
            "status": "ok" if importable else ("fail" if required else "warn"),
            "detail": f"importable ({env_label})" if importable else f"not importable ({env_label})",
            "fix": None if importable else f"Install into the project: `uv add {pip_name}`",
        })
    return results


def check_stage2_generator() -> dict:
    """Check for the Stage-2 image generator the pipeline ACTUALLY calls.

    unified_pipeline.py delegates Stage 2 to an external skill
    (image2-ppt/scripts/generate_full_page_images.py) found under .claude/skills or
    .agents/skills. Env-check used to ignore this, so a run got a green light and
    then died deep in Stage 2 — after content and style were already locked. We
    surface it up front. It's a WARN (not fail): Phases 0-2 and Stages 1,3,4,5 work
    without it; only image generation needs it."""
    rel = "image2-ppt/scripts/generate_full_page_images.py"
    roots: list[Path] = []
    cwd = Path.cwd()
    for parent in [cwd, *cwd.parents]:
        for skills in (".claude/skills", ".agents/skills"):
            d = parent / skills
            if d.is_dir():
                roots.append(d)
    home = Path.home()
    for skills in (".claude/skills", ".agents/skills"):
        d = home / skills
        if d.is_dir():
            roots.append(d)

    hit = next((r / rel for r in roots if (r / rel).is_file()), None)
    return {
        "check": "stage2_generator",
        "status": "ok" if hit else "warn",
        "detail": f"found ({hit})" if hit else f"'{rel}' not found in any skills dir",
        "fix": None if hit else (
            "Stage 2 (image generation) needs the image2-ppt skill. Install it into "
            ".claude/skills/ (or .agents/skills/). You can still do Phases 0-2 and "
            "Stages 1,3,4,5 without it — but the pipeline will stop at Stage 2."
        ),
    }


def check_disk_space() -> dict:
    """Check writable disk space (need ~200MB for image generation)."""
    try:
        usage = shutil.disk_usage(os.getcwd())
        free_mb = usage.free // (1024 * 1024)
        ok = free_mb > 200
        return {
            "check": "disk_space",
            "status": "ok" if ok else "warn",
            "detail": f"{free_mb} MB free",
            "fix": None if ok else f"Only {free_mb} MB free. Image generation needs ~200 MB. Free up space.",
        }
    except Exception:
        return {
            "check": "disk_space",
            "status": "ok",
            "detail": "could not check (skipping)",
            "fix": None,
        }


def run_all_checks() -> tuple[list[dict], bool]:
    """Run all checks. Return (results, ready). `ready` gates on HARD failures only —
    warnings (fonts, optional deps, the Stage-2 skill, disk) are advisory and must
    NOT flip an otherwise-working env to NOT READY."""
    # Load .env from cwd/parents FIRST so key + base URL checks reflect what the
    # pipeline will actually see (the pipeline loads the deck's .env the same way).
    for d in [Path.cwd(), *Path.cwd().parents]:
        if (d / ".env").is_file():
            _load_dotenv(d)
            break

    results = []

    results.append(check_python())
    results.append(check_uv())
    results.append(check_api_key())
    results.append(check_base_url())
    results.extend(check_python_packages())
    results.append(check_stage2_generator())
    results.append(check_fonts())
    results.append(check_disk_space())

    ready = not any(r["status"] == "fail" for r in results)
    return results, ready


def format_text(results: list[dict], all_pass: bool) -> str:
    """Human-readable output."""
    lines = []
    lines.append("=" * 56)
    lines.append("  _ppt_framework Environment Check")
    lines.append(f"  Platform: {'Windows' if IS_WINDOWS else os.uname().sysname if hasattr(os, 'uname') else sys.platform}")
    lines.append("=" * 56)
    lines.append("")

    # FOUNDATION first — Python + UV. If either is missing, nothing else matters.
    foundation = [r for r in results if r.get("foundation")]
    foundation_ok = all(r["status"] == "ok" for r in foundation)

    for r in results:
        icon = {"ok": "✓", "warn": "△", "fail": "✗"}[r["status"]]
        tag = "  [FOUNDATION]" if r.get("foundation") else ""
        lines.append(f"  {icon} {r['check']}{tag}: {r['detail']}")
        if r["fix"]:
            lines.append(f"    → {r['fix']}")
            lines.append("")

    lines.append("")
    warns = sum(1 for r in results if r["status"] == "warn")
    # The Stage-2 image skill is load-bearing: if it's missing, Stages 1/3/4/5 work
    # but image generation (the point of the deck) HARD-fails. Call it out in the
    # READY line so a missing skill isn't a silent green light.
    stage2_missing = any(r["check"] == "stage2_generator" and r["status"] != "ok" for r in results)
    if not foundation_ok:
        lines.append("  ⛔ FOUNDATION NOT READY — Python 3.11+ and UV must be set up FIRST.")
        lines.append("     Fix the [FOUNDATION] items above, then re-run. Do NOT proceed until this passes.")
    elif all_pass:
        if stage2_missing:
            lines.append(f"  ◑  READY for Phases 0–2, but NOT for image generation — the Stage-2 image "
                         f"skill (image2-ppt) was not found.")
            lines.append("     You can design content + visuals now, but Stage 2 (生图) will fail until the "
                         "skill is installed under .claude/skills/ (or .agents/skills/). See the △ above.")
        elif warns:
            lines.append(f"  ✓  READY — foundation OK, no blockers. {warns} advisory warning(s) above (△).")
        else:
            lines.append("  ✓  READY — all checks passed.")
            lines.append("  You can now start building decks.")
    else:
        lines.append("  ✗  NOT READY — foundation is fine, but a hard requirement (✗) failed. Fix those and re-run.")
        lines.append("  (△ warnings are advisory and do not block.)")

    return "\n".join(lines)


def main() -> None:
    results, all_pass = run_all_checks()
    foundation_ok = all(r["status"] == "ok" for r in results if r.get("foundation"))

    if "--json" in sys.argv:
        print(json.dumps(
            {"all_pass": all_pass, "foundation_ok": foundation_ok, "checks": results},
            indent=2, ensure_ascii=False))
    else:
        print(format_text(results, all_pass))

    # Exit non-zero on ANY hard failure (foundation or otherwise) so a caller/agent
    # can gate on it. Foundation failures are the ones that must block startup.
    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
