---
title: Page Authority Content
stage: workflow/01-content
position: entry
type: overview
feeds_into:
  - workflow/01-content/00-the-problem-why-slide-count-fails.md
---

# Phase 1: Page Authority Content

Turn the brief into an ordered, reviewable Page Authority source before any raw
generation. Start with the core metaphor, formula, and Block Map, then give every
slide a stable mnemonic ID, one reviewable claim, a closed `VISUAL BRIEF`, and a
resolved `pure-image2` or `framed-image2` authority.

The canonical source is `3_versions/vN/slide-specifications.md`. It declares
`production.pipeline: page-authority-image2-v1` and `identity.scheme: mnemonic-v1`.
`position` is snapshot order; `slide_id` is cross-version identity.

Read in order:

1. `00-the-problem-why-slide-count-fails.md`
2. `01-find-the-core-metaphor-and-formula.md`
3. `02-build-narrative-arc-blocks.md`
4. `03-specify-structured-slides.md`
5. `04-choose-layout-families.md`
6. `05-create-content-assets.md`
7. `06-iterate-with-version-discipline.md`

Use the templates and presets as authoring aids. `ppt_flow validate` owns exact
diagnostics; repair source, never `_generated/`. Structural changes publish a
clean target version only after preview and exact-plan confirmation.
