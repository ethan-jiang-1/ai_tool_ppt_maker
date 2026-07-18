---
identity:
  scheme: mnemonic-v1
production:
  pipeline: html-first-v1
---

## Slide 01: `SysMap`

**VISUAL TYPE**: Framework
**KICKER**: SYSTEM
**TITLE**: One local structured contract
**SUBTITLE**: Validation only until the renderer change lands
**CONCEPT**:
- **MUST communicate**: Meaning, geometry, and fallback are explicit before rendering
- **MUST NOT**: Suggest that browser delivery is available in Change 2

**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-visual
text:
  heading: Local validation
  bullets:
    - Closed source fields
    - Deterministic geometry
primary_visual:
  placement: right
  brief: A text-free three-layer system icon arrangement
  fit: cover
  focal_point:
    - 0.5
    - 0.5
  fallback:
    kind: icon-composition
    asset_ids:
      - system-layers
  selection: null
```

> **SPEAKER NOTE**: This fixture demonstrates validation, not browser production.
