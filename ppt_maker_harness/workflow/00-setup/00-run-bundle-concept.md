---
title: Run bundle concept
summary: Define the current Page Image run-bundle boundary and rebuildable ownership.
---

# Run Bundle Concept

A run bundle is one deck root plus versioned source snapshots. Start with
`RUN_BUNDLE.md`, then `deck-guide.md`, then the selected `vN` source/state
pair. New authoring starts with `page-image-workflow-v1`; it becomes a valid
provider-work route only after `production.workflow` is explicitly set to
`framed` or `pure` for the whole version.

`slide_id` is stable across versions; `position` belongs only to the selected
snapshot. Source, receipts, and state establish authority. `_generated/` is
rebuildable output and is never hand-edited.

Every target slide inherits the bound Framed or Pure workflow. Provider-visible
content or visual changes require explicit raw authorization. Framed may refresh
its local header overlay only with exact compiled provider input, protected
geometry, raw contract, and local-header profile. Structural edits, including a
workflow switch, are previewed and applied through a clean target version.

Any v2 source/state pair is an `unsupported-protocol/export` hard-stop. It
cannot become current evidence, initialize state, or select a workflow.
