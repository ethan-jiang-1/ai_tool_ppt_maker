---
stage: workflow/03-html-production
depends_on:
  - workflow/03-html-production/00-the-pipeline-philosophy.md
feeds_into:
  - workflow/03-html-production/02-stage-2-render-html-pages.md
---

# Stage 1: Resolve Slide Plan

Probe the canonical marker, validate the exact source filename, mnemonic IDs, structured bodies, visual config, catalog, fonts, capacities, fallback/selection state, and family geometry. Publish only the current structured `slide_plan.json` after receipt rechecks.

Stage 1 does not launch a browser, contact a provider, or publish prompts for HTML-first. Failure diagnostics point back to source/control fields; `_generated/` is never repaired by hand.
