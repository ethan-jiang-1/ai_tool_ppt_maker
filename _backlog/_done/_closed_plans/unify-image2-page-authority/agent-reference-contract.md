# Agent Reference Contract

## Observed Source

The inspected v1 model sheet is approved visual doctrine:

```text
source: deck_ai_sdlc_bpm_keynote/3_versions/v1/_scratch/agent_reference_sheet.png
size:   1672 x 941 PNG
sha256: f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756
```

It establishes amber glass, internal topology, warm glow, neutral light-form, book, and gentle-guide
character. It also contains labels, borders, notes, and five poses, so it is never an Image2 payload.

## Backbone Asset Set

The future promotion creates a closed Image2 reference set:

```text
2_backbone/visual-style/assets/reference/amber-agent/
  model-sheet.png                     # human-reviewed doctrine; never provider payload
  guide.png                           # reviewed clean single-subject derivative
  collaborating.png
  working.png
  orchestrating.png
  reviewing.png
  image2-reference-material.yaml      # Image2 registry, not asset-manifest.yaml
```

Each role image is a reviewed, checksum-bound clean derivative with no label, border, quote,
multi-pose layout, or typography. The existing HTML `asset-manifest.yaml` never resolves these provider
references.

## Closed Registry And Profile

`image2-reference-material.yaml` uses `pptmaker-image2-reference-registry-v1`. Its top-level keys are
exactly `schema` and `profiles`; a profile has exactly `subject_class`,
`maximum_identity_subjects`, `compatible_restrictions`, `incompatible_restrictions`, and `roles`; a
role has exactly `reference_path`, `reference_sha256`, and `role_clause`. Duplicate keys, aliases,
tags, absolute/escaping paths, model-sheet payload paths, unknown fields, and unknown roles fail with
source spans. Each role path is confined to its profile directory and must hash to registered bytes.
Every `role_clause` must also pass the exact `page-authority-text-guard-v1` grammar from the
visual-language registry contract; it is source-owned provider material, not an exception to Framed
text ownership.

`amber-agent` is:

```yaml
subject_class: amber-light-form
maximum_identity_subjects: 1
compatible_restrictions: [none, no-generic-metal-robot]
incompatible_restrictions: [no-identity-subject]
```

| Role | Fixed provider-neutral role clause |
|---|---|
| `guide` | one warm amber light-form gently leads, open palm, book held close, attentive head tilt |
| `collaborating` | one warm amber light-form shares attention through an open reciprocal posture |
| `working` | one warm amber light-form works calmly with a document or knowledge artifact |
| `orchestrating` | one warm amber light-form gathers or connects a visible system of work without command posture |
| `reviewing` | one warm amber light-form attentively examines a work artifact with quiet, nonjudgmental focus |

`SUBJECT RESTRICTIONS` from the slide source is the only compatibility input. A raw projection hashes
profile ID, role ID, clean-reference SHA, role-clause SHA, subject class, subject count, and normalized
restriction result through canonical JSON. It excludes source spans, filesystem paths, and model-sheet
bytes. The model must not copy labels, borders, quote text, five-pose layout, facial features, clothing,
cold-blue holography, or a metal-robot body.
