---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
---

# Page Authority Slide Source

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
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**: [What the presenter says for this stable slide ID.]

## Authoring Rules

- `framed-image2` gives visible text to the local Text Frame. `pure-image2` is
  for visual content that must be owned by the raw Image2 result.
- Every slide selects a closed `VISUAL BRIEF` from the Page Authority visual-language
  registry. Framed underlays remain text-free.
- Do not add arbitrary markup, CSS, coordinates, retired source fields, provider
  controls, or hand-edited generated artifacts.
- Use `**VISUAL IDENTITY**: [SUBJECT + MOVE]` only when the selected registry
  identity requires it.
- Structural edits publish a clean vNext after preview and the exact plan hash. Do not
  copy `_generated/` between versions.
