## ADDED Requirements

### Requirement: Whole-page assembly uses the current receipt lineage
Whole-page PPTX assembly SHALL publish and validate `whole-page-image2-v1` receipt lineage. It SHALL reject retired whole-page pipeline values and SHALL not accept an older whole-page receipt schema as completion or rerun authority.

#### Scenario: Whole-page assembly is validated
- **WHEN** an assembly receipt identifies the current whole-page pipeline
- **THEN** assembly accepts its non-HTML lineage fields
- **AND** it rejects a retired pipeline value
