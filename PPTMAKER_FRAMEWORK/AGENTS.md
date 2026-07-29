# PPTMAKER Framework Agent Guide

New authoring uses `page-authority-image2-v2` with
`image2-page-authority-v2`. Before provider work, a human records exactly one
version workflow: `framed` or `pure`. Every target slide inherits that workflow;
there is no slide-level authority choice. An exact
`page-authority-image2-v1` / `image2-page-authority` pair remains only a
bounded existing-run compatibility route.

## Current workflow

1. Read `RUN_BUNDLE.md`, `deck-guide.md`, and the exact current source/state pair.
2. Classify work as Header Text & Style Refresh, Generated Image Rebuild,
   Notes-Only Refresh, or Structural Versioning Path.
3. Keep `slide_id` stable across versions. `position` belongs only to the
   current snapshot. Structural work requires preview plus its exact plan hash.
4. Treat `_generated/` as rebuildable output. It is never hand-edited and is
   never source evidence for a new operation.
5. Obtain explicit user authorization before remote raw generation. Local
   Framed composition and notes work do not require provider credentials.
6. Follow `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`:
   the selected workflow publishes the final-slide manifest and shared delivery
   owns final projection, PPTX, notes, and delivery review.

## Historical runs

When the user explicitly names an existing historical run, inspect it through
`ppt_flow state <run-dir> --inspect-legacy-protocol`. A recognized pair has
only one next step: provider-free adoption into a clean Page Authority target.
Malformed or unsupported pairs stop at repair/export guidance. Do not resume
historical production, read historical generated files as current evidence, or
mutate a historical state file during inspection.

## Boundaries

- Markdown controllers own workflow decisions; JavaScript owns source/state
  validation and producer diagnostics.
- A current final manifest, PPTX receipt, and notes receipt must all derive
  from Page Authority evidence.
- `ppt_flow init` creates a v2 authoring draft, never a Framed, Pure, or mixed
  default. `doctor` is scoped to the requested Page Authority operation.
- Framework maintenance changes follow OpenSpec. Run-bundle work does not edit
  framework source.
