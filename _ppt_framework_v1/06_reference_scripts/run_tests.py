#!/usr/bin/env python3
"""Run every framework test file with one stable command."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    framework_dir = Path(__file__).resolve().parent.parent
    tests = sorted(framework_dir.rglob("test_*.py"))
    failed: list[Path] = []
    for test_file in tests:
        print(f"\n===== {test_file.relative_to(framework_dir)} =====", flush=True)
        result = subprocess.run([sys.executable, str(test_file)])
        if result.returncode != 0:
            failed.append(test_file)
    if failed:
        print("\nFailed test files:")
        for test_file in failed:
            print(f"  - {test_file.relative_to(framework_dir)}")
        return 1
    print(f"\n✓ all {len(tests)} framework test files passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
