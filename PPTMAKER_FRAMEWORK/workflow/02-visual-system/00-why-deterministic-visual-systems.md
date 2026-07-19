---
stage: workflow/02-visual-system
feeds_into:
  - workflow/02-visual-system/01-gather-product-context-dna.md
---

# Why Deterministic Visual Systems

HTML-first separates authored semantics from deterministic presentation tokens. Palette, typography, spacing, components, geometry, chart recipes, and fallback assets are explicit inputs, so ordinary copy changes can recompose locally without asking an image model to recreate a page.

The visual contract is reviewed through the same local compositor used for delivery. A style-master image is neither source truth nor a prerequisite. This makes page identity auditable, scoped rebuilds predictable, and accurate English/Hans text measurable.
