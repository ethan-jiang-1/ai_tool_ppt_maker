#!/usr/bin/env python3
"""
LEGACY — Stage 2 standalone reference (NOT the official path).

Official Stage 2 path (always prefer this):
    unified_pipeline.py → image2-ppt/scripts/generate_full_page_images.py

This file remains only for environments without the image2-ppt skill, or for
studying a minimal OpenAI-compatible submit→poll→download client. Flags differ
from the skill script — do not mix them. Default agent behavior: ignore this file.

Usage (legacy only):
    python stage2_generate_images.LEGACY.py \\
        --prompts 3_versions/v1/_generated/page_prompts/_prompts.json \\
        --style-master 2_backbone/visual-style/style_master.jpg \\
        --out 3_versions/v1/_generated/page_images_full/ \\
        --resolution 2k

API Configuration:
    Set OPENAI_API_KEY and OPENAI_BASE_URL environment variables.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path

import requests

# ---------------------------------------------------------------------------
# Customization — change these for your project
# ---------------------------------------------------------------------------

# How long to wait for a single image (seconds)
MAX_WAIT_SECONDS = 600
POLL_INTERVAL_SECONDS = 5

# Model to request from the API
IMAGE_MODEL = "gpt-image-2"

# Anchoring clause appended to every prompt
ANCHORING_CLAUSE = (
    "Use the reference image(s) as your EXACT visual style guide. "
    "Match the color palette, typography scale, layout grid, component patterns, "
    "and overall visual language precisely. The reference defines the deck's "
    "design system — do not deviate from it. Only change the slide content, "
    "not the style."
)


# ---------------------------------------------------------------------------
# API client
# ---------------------------------------------------------------------------

def _api_key() -> str:
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set")
    return key


def _base_url() -> str:
    return os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_api_key()}",
        "Content-Type": "application/json",
    }


def submit_task(prompt: str, style_master_path: str | None, resolution: str) -> str:
    """Submit an image generation task. Returns task_id."""
    url = f"{_base_url()}/images/generations"
    body = {
        "model": IMAGE_MODEL,
        "prompt": prompt,
        "size": "16:9",
        "resolution": resolution,
    }
    if style_master_path:
        body["image_urls"] = [style_master_path]

    resp = requests.post(url, json=body, headers=_headers(), timeout=30)
    resp.raise_for_status()
    data = resp.json()
    task_id = data.get("task_id") or data.get("id")
    if not task_id:
        raise RuntimeError(f"No task_id in response: {data}")
    return task_id


def poll_task(task_id: str) -> dict:
    """Poll until task completes or fails. Returns the result dict."""
    url = f"{_base_url()}/tasks/{task_id}"
    deadline = time.time() + MAX_WAIT_SECONDS

    while time.time() < deadline:
        resp = requests.get(url, headers=_headers(), timeout=15)
        resp.raise_for_status()
        data = resp.json()
        status = data.get("status", "unknown")

        if status == "completed":
            return data
        if status == "failed":
            error = data.get("error", {}).get("message", "unknown error")
            raise RuntimeError(f"Task {task_id} failed: {error}")

        time.sleep(POLL_INTERVAL_SECONDS)

    raise TimeoutError(f"Task {task_id} did not complete within {MAX_WAIT_SECONDS}s")


def download_result(task_id: str, output_path: Path) -> None:
    """Download the generated image from a completed task."""
    url = f"{_base_url()}/tasks/{task_id}/result"
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    data = resp.json()

    image_url = (
        data.get("image_url")
        or data.get("data", [{}])[0].get("url")
    )
    if not image_url:
        raise RuntimeError(f"No image URL in result for {task_id}: {data}")

    img_resp = requests.get(image_url, timeout=60)
    img_resp.raise_for_status()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(img_resp.content)


def generate_image(
    prompt: str,
    output_path: Path,
    style_master_path: str | None,
    resolution: str = "2k",
) -> dict | None:
    """Generate one slide image. Skips if output already exists."""
    if output_path.exists():
        print(f"  Skip (exists): {output_path.name}")
        return None

    t0 = time.time()
    task_id = submit_task(prompt, style_master_path, resolution)
    print(f"  Submitted: {output_path.name}  task_id={task_id}")

    try:
        poll_task(task_id)
    except Exception:
        print(f"  FAILED: {output_path.name}  task_id={task_id}")
        raise

    download_result(task_id, output_path)
    elapsed = time.time() - t0

    trace = {
        "task_id": task_id,
        "model": IMAGE_MODEL,
        "resolution": resolution,
        "prompt_chars": len(prompt),
        "elapsed_seconds": round(elapsed, 1),
        "base_url": _base_url(),
    }
    trace_path = output_path.with_suffix(".apimart-task.json")
    trace_path.write_text(json.dumps(trace, indent=2, ensure_ascii=False) + "\n")
    print(f"  Done: {output_path.name}  ({elapsed:.0f}s)")
    return trace


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Stage 2: Generate slide images")
    parser.add_argument("--prompts", required=True, help="per-slide prompts JSON from Stage 1 (page_prompts/_prompts.json)")
    parser.add_argument("--style-master", required=True, help="Path to style_master.jpg")
    parser.add_argument("--out", required=True, help="Output directory for generated images")
    parser.add_argument("--resolution", default="2k", choices=["1k", "2k", "4k"])
    parser.add_argument("--only", help="Comma-separated slide IDs to generate (skip others)")
    args = parser.parse_args()

    prompts_data = json.loads(Path(args.prompts).read_text(encoding="utf-8"))
    slides = prompts_data.get("slides", prompts_data.get("prompts", []))

    only_ids = set(args.only.split(",")) if args.only else None

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    style_master = str(Path(args.style_master).resolve())

    generated = 0
    skipped = 0
    errors: list[str] = []

    for slide in slides:
        slide_id = slide["id"]
        if only_ids and slide_id not in only_ids:
            continue

        # Append anchoring clause
        prompt = slide["prompt"].strip()
        if ANCHORING_CLAUSE not in prompt:
            prompt = f"{prompt}\n\n{ANCHORING_CLAUSE}"

        out_name = slide.get("out", f"{slide_id}.png")
        out_path = out_dir / out_name

        try:
            result = generate_image(prompt, out_path, style_master, args.resolution)
            if result:
                generated += 1
            else:
                skipped += 1
        except Exception as exc:
            errors.append(f"{slide_id}: {exc}")
            print(f"  ERROR: {slide_id}: {exc}")

    print(f"\n--- Stage 2 complete ---")
    print(f"Generated: {generated}  Skipped: {skipped}  Errors: {len(errors)}")
    if errors:
        print("Errors:")
        for e in errors:
            print(f"  {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
