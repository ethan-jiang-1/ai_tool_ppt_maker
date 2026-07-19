---
stage: workflow/01-content
depends_on:
  - workflow/01-content/03-specify-structured-slides.md
feeds_into:
  - workflow/01-content/05-create-content-assets.md
---

# Choose Closed Layout Families

Each HTML-first slide declares one closed family in its exact `SLIDE BODY` YAML: `hero`, `split`, `cards`, `kpi`, `comparison`, `flow`, `timeline`, `data`, `quote`, or `visual-focus`.

Choose the family from the information relationship, then author only that family's typed blocks. Geometry comes from the framework registry; source must not contain HTML, CSS, coordinates, or overlays. Keep every field within the contract capacities and provide a renderer-neutral `primary_visual.fallback` when the family uses a visual. Registered assets are referenced by stable catalog ID and SHA-bound by the pipeline.

Run `ppt_flow validate <run-dir>` after authoring. A family or capacity failure is repaired in source, never in `_generated/`.
