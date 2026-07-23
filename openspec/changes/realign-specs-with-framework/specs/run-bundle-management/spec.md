## ADDED Requirements

### Requirement: Whole-page initialization writes the current marker
`image2-only` initialization SHALL create a canonical source containing `production.pipeline: whole-page-image2-v1` and a matching durable production-mode record.

#### Scenario: Image2-only run is initialized
- **WHEN** an Agent initializes a run with `image2-only`
- **THEN** its source and state identify the same whole-page pipeline
- **AND** no alternate markerless scaffold is created
