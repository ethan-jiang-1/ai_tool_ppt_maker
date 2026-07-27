## ADDED Requirements

### Requirement: PPTX assembly consumes the Page Authority final manifest
PPTX Assembly SHALL consume only the current verified Page Authority final-slide manifest and preserve
its resolved stable-slide ordering. It SHALL reject raw underlays, legacy whole-page/header-lock bytes,
partial manifests, and stale raw-review coverage.

#### Scenario: Underlay cannot become PPTX art
- **WHEN** assembly receives a Framed raw underlay instead of the verified final-slide entry
- **THEN** it hard-stops before creating a PPTX
- **AND** it identifies the final-manifest prerequisite

