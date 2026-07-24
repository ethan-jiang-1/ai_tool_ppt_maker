---
title: Structured Content
stage: workflow/01-content
position: entry
type: overview
feeds_into:
  - workflow/01-content/00-the-problem-why-slide-count-fails.md
---

# Phase 1: Structured Content

Turn the brief into an ordered, reviewable slide document before rendering. Start with the core metaphor/formula and Block Map, then give every slide a stable mnemonic ID, exact header/concept, one closed layout family, typed `SLIDE BODY` YAML, optional renderer-neutral fallback, and speaker note.

The canonical source is `3_versions/vN/slide-specifications.md`. For HTML-first it declares `production.pipeline: html-first-v1` and `identity.scheme: mnemonic-v1`. Position is snapshot order; `slide_id` is cross-version identity.

Read in order:

1. `00-the-problem-why-slide-count-fails.md`
2. `01-find-the-core-metaphor-and-formula.md`
3. `02-build-narrative-arc-blocks.md`
4. `03-specify-structured-slides.md`
5. `04-choose-layout-families.md`
6. `05-create-content-assets.md`
7. `06-iterate-with-version-discipline.md`

Use the templates and `presets/` as authoring aids. Exact schema/capacity diagnostics come from `ppt_flow validate`; repair source, never `_generated/`. Whole-page Image2 prompt authoring is first-class `image2-only` work and lives in `playbook/create-deck.md`.
