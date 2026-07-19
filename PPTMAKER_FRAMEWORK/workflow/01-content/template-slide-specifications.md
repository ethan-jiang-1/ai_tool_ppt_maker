---
production:
  pipeline: html-first-v1
identity:
  scheme: mnemonic-v1
---

# Structured Slide Source Template

This is the canonical HTML-first source for `3_versions/vN/slide-specifications.md`.
Use a 5–8 letter mnemonic-v1 slide ID with exactly two BlockCase chunks. Position is
only the current snapshot; the ID remains the slide identity across versions.

## Block Map

Define the narrative blocks before authoring individual slides. Each slide must use a
closed family and typed YAML body. Do not add `IMAGE PROMPT`, `VISUAL ASSETS`, arbitrary
HTML, CSS, coordinates, renderer options, or Image2 controls.

The narrative sentence for each block is `SUBJECT + MOVE`: name the thing that changes,
then the movement the audience should understand.

## Slide 01: `DeckGo`

**VISUAL TYPE**: Hero statement
**TITLE**: [One reviewable governing claim]
**CONCEPT**:
- **MUST communicate**: [What the audience should understand now]
- **MUST NOT**: [What would distract from the claim]

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
```

> **SPEAKER NOTE**: [What the presenter says for this stable slide ID.]

## Authoring Rules

- `SLIDE BODY` is the complete structured visual contract. Select a documented family
  and its typed fields; use `primary_visual.fallback` only for registered local assets.
- Keep headers, concept, body, fallback semantics, and notes in source. The renderer
  owns HTML, fonts, chart SVG, geometry, PNG, contact sheets, PPTX, and receipts.
- Validate first, then run local Stage 1-3 preview. Approve exact reset-bound content
  and visual review plans before Stage 4/5, then record delivery review after checking
  the contact sheet, PPTX, and notes.
- Structural changes create a clean vNext. Publish source first; then perform local
  target materialization and re-review. Never copy `_generated/` between versions.
