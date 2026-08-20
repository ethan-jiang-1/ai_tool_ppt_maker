# Image2 Lab

This playbook discovers an unconfirmed Image2 Call Shape. It is not a
create-deck node, not `probe-image-channels`, and not `image2 generate`.

Lab may live-submit an explicit candidate when the exact run has no confirmed
page-image Call Shape. A sealed trial proves only that that candidate, with the
supplied prompt and reference bytes, retrieved an inspector-valid PNG. It does
not confirm the provider profile, authorize generate, write State, or write
`_lessons/`.

## When to use this playbook

Use Image2 Lab when the question is which candidate Call Shape can retrieve a
PNG. If the Call Shape is already confirmed and the question is whether drawing
still works, use [probe-image-channels](probe-image-channels.md) instead.

An empty `_lab/` does not block drawing when a confirmed or named-default Call
Shape already exists.

## Bounded plan, then execute

Form a bounded plan before any fetch:

```bash
node ppt_maker_harness/scripts/shared/image2/lab_cli.mjs plan --run-dir <run-dir> \
  --candidate <call-shape.yaml> --prompt-file <prompt.txt> [--reference-file <ref.png>]
```

Then execute that exact plan hash:

```bash
node ppt_maker_harness/scripts/shared/image2/lab_cli.mjs execute --run-dir <run-dir> --plan-hash <hash>
```

Edits candidates require `--reference-file`. Import Style Master bytes by hash
only; do not invent a blank canvas.

Show `trial_id` and `trial_sha256` to the Deck Author. Profile writeback is a
separate human confirmation. Optional `lessons.mjs add` is a recommendation
after a useful lesson exists; Lab CLI writes no lesson.

## Result boundary

A successful trial is not generate authorization and does not replace
`image2 authorize`. Continue official page-image production on the existing
generate path, which does not read `_lab/`.
