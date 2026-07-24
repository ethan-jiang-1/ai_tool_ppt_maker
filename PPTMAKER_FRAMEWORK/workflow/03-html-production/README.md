---
title: HTML Production
stage: workflow/03-html-production
position: entry
type: overview
feeds_into:
  - workflow/03-html-production/00-the-pipeline-philosophy.md
---

# Phase 3: Local HTML Production

This phase produces a complete deliverable without Image2 credentials or a style master. `production.pipeline` selects a complete branch before readiness or writes.

For `html-first-v1`:

1. `01-stage-1-resolve-slide-plan.md` validates structured source and publishes the plan.
2. `02-stage-2-render-html-pages.md` builds self-contained HTML pages with bundled fonts/assets and zero network.
3. `03-stage-3-compose-final-slides.md` measures in pinned Chromium and publishes verified PNG final slides plus review evidence.
4. `04-stage-4-build-the-pptx-container.md` consumes provider-neutral final-slide evidence in plan order.
5. `05-stage-5-inject-speaker-notes.md` binds notes by stable ID and current order.

Preview may run while content/visual reviews are pending. Stage 4 requires current authoritative review evidence. All outputs are rebuildable under `_generated/html_production/`; do not edit them. First-class whole-page Image2 decks route to `playbook/create-deck.md` and keep their isolated whole-page stages.
