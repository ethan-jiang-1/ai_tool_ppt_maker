---
title: Run bundle concept
summary: Define the current Page Authority run-bundle boundary and rebuildable ownership.
---

# Run Bundle Concept

A run bundle is one deck root plus versioned source snapshots. Start with
`RUN_BUNDLE.md`, then `deck-guide.md`, then the selected `vN` source/state
pair. The current source marker is `page-authority-image2-v1`.

`slide_id` is stable across versions; `position` belongs only to the selected
snapshot. Source, receipts, and state establish authority. `_generated/` is
rebuildable output and is never hand-edited.

Every current slide is `pure-image2` or `framed-image2`. Pure changes that
alter the raw contract require explicit raw authorization. Framed text/frame
changes recompose locally from accepted raw evidence. Structural edits are
previewed and applied through a clean target version.

An explicitly named historical run is observer input only. It can produce a
provider-free adoption plan or repair/export guidance; it cannot become current
evidence in place.
