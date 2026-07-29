---
stage: workflow/01-content
depends_on:
  - workflow/01-content/02-build-narrative-arc-blocks.md
feeds_into:
  - workflow/01-content/04-choose-layout-families.md
---

# Specify Page Authority Slides

Each slide heading carries a 5–8 character mnemonic ID with exactly two BlockCase
chunks. Author the claim, optional Framed Text Frame fields, one closed fenced
`VISUAL BRIEF`, and speaker notes for that stable ID.

Set `production.workflow: framed|pure` once in the version frontmatter; every
slide inherits it. Framed underlays stay text-free and the local frame owns
final text pixels. Pure uses Image2 for all final pixels, including any
semantic display text. Do not add a slide-specific workflow field; a
Framed/Pure switch is a Structural Versioning Path decision.

Do not author arbitrary markup, coordinates, local rendering controls, free-form
provider prompts, or hand-edited derived artifacts. Validate after each meaningful
edit; source order controls the snapshot while IDs preserve slide-local identity.
