#!/usr/bin/env python3
"""Generate the canonical style_master.jpg from its source prompt.

This wrapper is the official Phase-2 entry point. It resolves per-version
overrides file-by-file, loads the deck .env, bridges OPENAI_* credentials to the
image skill's native APIMART_* names, and calls image2-imagegen with supported
arguments. The prompt remains a source file; no shell substitution is required.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import bundle_layout as layout
from unified_pipeline import find_skill_script


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", required=True,
                        help="Version dir, e.g. deck_x/3_versions/v1")
    parser.add_argument("--base-url", action="append",
                        help="Optional image API base URL; may be repeated")
    parser.add_argument("--resolution", choices=["1k", "2k", "4k"], default="2k")
    parser.add_argument("--model", default="gpt-image-2")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    run_dir = Path(args.run_dir).resolve()
    violations = layout.check_bundle(run_dir, require_pipeline_ready=False)
    if violations:
        print("✗ Bundle structure is not valid:")
        for violation in violations:
            print(f"  - {violation}")
        return 1

    prompt_path = layout.style_asset(run_dir, layout.STYLE_MASTER_PROMPT)
    if not prompt_path.is_file():
        print(f"✗ Missing style master prompt: {prompt_path}")
        return 1

    generator = find_skill_script([
        "image2-imagegen/scripts/generate_image.py",
        "image2-imagegen/scripts/generate_image_apimart.py",
    ])
    if generator is None:
        print("✗ image2-imagegen skill not found in .claude/skills or .agents/skills")
        return 1

    layout.load_dotenv(layout.deck_root(run_dir), Path.cwd(), *Path.cwd().parents)
    if "APIMART_API_KEY" not in os.environ and os.environ.get("OPENAI_API_KEY"):
        os.environ["APIMART_API_KEY"] = os.environ["OPENAI_API_KEY"]

    base_urls = (args.base_url or [])
    if not base_urls:
        configured = os.environ.get("OPENAI_BASE_URL") or os.environ.get("APIMART_BASE_URL")
        if configured:
            base_urls = [configured]

    out_path = prompt_path.parent / layout.STYLE_MASTER_IMAGE
    trace_path = prompt_path.parent / ("style_master" + layout.IMAGE_TRACE_SUFFIX)
    command = [
        sys.executable,
        str(generator),
        "--prompt", prompt_path.read_text(encoding="utf-8"),
        "--out", str(out_path),
        "--meta-out", str(trace_path),
        "--size", "16:9",
        "--resolution", args.resolution,
        "--model", args.model,
    ]
    for base_url in base_urls:
        command.extend(["--base-url", base_url])
    if args.force:
        command.append("--force")
    if args.dry_run:
        command.append("--dry-run")

    print(f"Prompt: {prompt_path}")
    print(f"Output: {out_path}")
    result = subprocess.run(command)
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
