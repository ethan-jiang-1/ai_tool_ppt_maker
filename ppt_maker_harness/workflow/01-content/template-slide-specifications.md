---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-image-workflow-v1
  workflow: <framed|pure>
---

# Page Image Slide Source

Use a 5-8 character mnemonic-v1 `slide_id` with exactly two BlockCase chunks.
`position` is snapshot order only; `slide_id` remains the cross-version identity.

## Slide 01: `DeckGo`

**KICKER**: [Optional context]
**TITLE**: [One reviewable governing claim]
**SUBTITLE**: [Optional supporting sentence]
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-logo
```

**SLIDE BODY**:
```yaml
items:
  - role: supporting_copy
    literal: "[Source-owned supporting copy]"
```

> **SPEAKER NOTE**: [What the presenter says for this stable slide ID.]

## Authoring Rules

- Replace `<framed|pure>` with one explicit workflow before validation or
  provider work. It applies to the whole version; do not add a per-slide
  source ownership field.
- Framed gives Provider-visible body content to the common Page Image Core and
  overlays only kicker, title, and subtitle locally. Pure has the Provider render
  headers as well. Both policies require the same closed `SLIDE BODY.items` schema.
- Every slide supplies a closed `VISUAL BRIEF` from the Page Image visual-language
  registry; it cannot suppress or replace source-owned content literals.
- Do not add arbitrary markup, CSS, coordinates, retired source fields, provider
  controls, or hand-edited generated artifacts.
- Use `**VISUAL IDENTITY**: [SUBJECT + MOVE]` only when the selected registry
  identity requires it.
- Structural edits publish a clean vNext after preview and the exact plan hash. Do not
  copy `_generated/` between versions.
