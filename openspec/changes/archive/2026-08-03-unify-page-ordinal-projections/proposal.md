## Why

Page Authority already treats `slide_id` as stable cross-version identity and
the final v2 manifest already names files `NN_slideID.png`.  That rule stops
at final publication, however: generated raw and Pilot images still use a bare
`slide_id`, while both target-v2 and bounded CURRENT PPTX assembly paths place
only the full-page image.  A human browsing generated images or a delivered
deck therefore loses the current page ordinal (BUG-040 and BUG-045), and the
two naming conventions leave BUG-043 vulnerable to regression.

This change makes the current `position` a single, explicitly derived human
projection.  It keeps the durable Page Authority identity, authorization, and
evidence graph addressed by stable `slide_id` and digests.

## What Changes

- Define one shared `position + slide_id -> NN_slideID.png` filename
  projection, with at least two zero-padded digits and natural expansion after
  page 99.
- Apply that projection to all generated per-page images intended for human
  browsing: v2 raw materializations, Pure Pilot images, and Framed Pilot
  underlay/composite images.  Final manifest naming continues to use the same
  projection and gains regression coverage rather than a second schema.
- Keep raw contracts, provider requests, progressive CAS/attempt/provenance
  records, accepted evidence, and receipt identities keyed by stable
  `slide_id` and digest.  No `NN_` prefix becomes a logical identity or
  provider input.
- Add a small right-bottom page-number footer to every Page Authority PPTX
  slide, for both target-v2 delivery and bounded CURRENT assembly.  It displays
  the corresponding current ordinal and has no configuration or opt-out
  switch.
- Add focused coverage for one-, two-, and three-digit ordinals, final manifest
  compatibility, PPTX footer XML, and reordering-derived output without a new
  provider submission.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `image-generation`: project the current ordered Page Authority raw and Pilot
  images with one human-browsing ordinal filename rule while preserving stable
  raw evidence addressing.
- `pptx-assembly`: place the current ordinal as a small right-bottom footer on
  every Page Authority PPTX slide while retaining full-page final image
  assembly.
- `slide-identity-and-ordering`: make the stable-identity versus
  ordinal-projection invariant explicit for human-facing artifacts.

## Impact

- **Framework source:** the shared Page Authority artifact/runtime helpers,
  Pure and Framed Pilot publishers, target-v2 delivery assembly, and bounded
  CURRENT PPTX assembly.
- **Framework specs and tests:** delta specs modify only the three capabilities
  above; focused tests cover generated paths, final-manifest regression, and
  PPTX XML.  No live provider call is required.
- **Control ownership:** JS derives the display projection from the existing
  ordered plan/manifest and writes derived artifacts.  The Agent can rebuild
  the affected generated/delivery outputs through their existing owner.  Human
  content and visual-quality decisions remain unchanged.
- **Run-bundle contract:** `compatible`.  A normal rebuild emits the newly
  named derived images and PPTX; existing `deck_*`, `dpt_*`, or `_generated/`
  trees are neither fixtures nor automatic migration targets.

This change adds no gate, authorization, durable control state, retry, or
override.  Under `openspec/policies/human-centered-gates.md`, existing
identity/provenance failures remain their current non-bypassable hard-stops;
the new filenames and footer are rebuildable presentation projections.  It
follows `openspec/policies/agent-assistance-and-control.md` and
`openspec/policies/simple-reliable-control.md` by reusing the existing ordered
plan/manifest as the direct fact, avoiding a second page-order store, a config
switch, or another recovery branch.
