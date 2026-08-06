# PPT Maker Harness Agent Guide

New authoring uses `page-authority-image2-v2` with
`image2-page-authority-v2`. Before provider work, a human records exactly one
version workflow: `framed` or `pure`. Every target slide inherits that workflow;
there is no slide-level authority choice. Any other source/state pair is an
unsupported-protocol hard-stop and remains byte-preserving.

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

## Boundaries

- Markdown controllers own workflow decisions; JavaScript owns source/state
  validation and producer diagnostics.
- A current final manifest, PPTX receipt, and notes receipt must all derive
  from Page Authority evidence.
- `ppt_flow init` creates a v2 authoring draft, never a Framed, Pure, or mixed
  default. `doctor` is scoped to the requested Page Authority operation.
- PPT Maker Harness maintenance changes follow OpenSpec. Run-bundle work does not edit
  Harness source.
