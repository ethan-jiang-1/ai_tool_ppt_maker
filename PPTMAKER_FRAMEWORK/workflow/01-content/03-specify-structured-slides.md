---
stage: workflow/01-content
depends_on:
  - workflow/01-content/02-build-narrative-arc-blocks.md
feeds_into:
  - workflow/01-content/04-choose-layout-families.md
---

# Specify Structured Slides

Each slide heading carries a stable mnemonic ID. Author exact `VISUAL TYPE`, header fields, one `MUST communicate`, optional `MUST NOT`, one exact fenced `SLIDE BODY` YAML document, and optional speaker note.

The structured body starts with `schema_version: 1` and one closed `family`. Use only the family's typed fields. Do not author HTML, CSS, coordinates, overlays, `RENDER MODE`, `IMAGE PROMPT`, or legacy `VISUAL ASSETS` in an HTML-first source.

Keep visible copy within validator capacities. Use `primary_visual` only where the family supports it; its fallback is a registered asset, icon composition, or abstract pattern. Selection evidence is explicit and stale selection falls back locally.

Validate after every meaningful edit. Source order controls the current snapshot, while IDs preserve notes and slide-local composition identity across versions.
