# Agent Reference Contract

## Observed Source

The inspected v1 sheet is the approved visual doctrine:

```text
source: deck_ai_sdlc_keynote/3_versions/v1/_scratch/agent_reference_sheet.png
size:   1672 x 941 PNG
sha256: f71a7ed8ec8f69e10ffbe2997e81f123d46515b5608de61afc155d6b3ed6c756
```

It successfully establishes the amber glass, internal topology, soft warm glow, neutral light-form,
book, and gentle-guide character. It also contains labels, borders, notes, and five-pose layout, so it
must not be sent unchanged as a provider reference.

## Backbone Asset Set

The future promotion creates a closed, separately owned Image2 reference set under:

```text
2_backbone/visual-style/assets/reference/amber-agent/
  model-sheet.png                     # human-reviewed doctrine; never provider payload
  guide.png                           # approved clean single-subject reference
  collaborating.png                   # approved clean single-subject reference
  working.png                         # approved clean single-subject reference
  orchestrating.png                   # approved clean single-subject reference
  reviewing.png                       # approved clean single-subject reference
  image2-reference-material.yaml      # Image2 registry, not asset-manifest.yaml
```

Each clean role reference is a reviewed, checksum-bound derivative of the model sheet with no label,
border, quote, multi-pose layout, or typography. The future implementation may make an approved
deterministic crop/cleanup pipeline, but it cannot silently treat the model sheet or an arbitrary crop
as provider material. Until a role reference is registered and verified, that role is unavailable.

The existing HTML `asset-manifest.yaml` never selects or resolves these provider references.

## Profile Schema And Meaning

`image2-reference-material.yaml` uses one `pptmaker-image2-reference-registry-v1` schema. Its
`amber-agent` profile has:

```yaml
subject_class: amber-light-form
maximum_identity_subjects: 1
compatible_restrictions: [none, no-generic-metal-robot]
incompatible_restrictions: [no-identity-subject]
```

Its fixed roles are deliberately semantic, not a request to copy a labeled pose:

| Role | Provider-neutral role clause |
|---|---|
| `guide` | One warm amber light-form gently leads, open palm, book held close, attentive head tilt. |
| `collaborating` | One warm amber light-form shares attention with the scene through an open, reciprocal posture. |
| `working` | One warm amber light-form works calmly with a document or knowledge artifact. |
| `orchestrating` | One warm amber light-form gathers or connects a visible system of work without command posture. |
| `reviewing` | One warm amber light-form attentively examines a work artifact with quiet, nonjudgmental focus. |

Every projection hashes profile ID, role ID, clean-reference SHA, role-clause SHA, subject class,
subject count, and normalized restriction result. The model must not copy labels, borders, quote text,
five-pose layout, facial features, clothing, cold blue holography, or a metal-robot body.

`no-generic-metal-robot` remains compatible with the amber light form. `no-identity-subject` conflicts
with a selected profile. An unstructured phrase such as `no robot imagery` is not a compatibility
input; source must use the normalized restriction field.
