## ADDED Requirements

### Requirement: Source pipeline marker is explicit and closed
The content parser SHALL accept only a direct `production.pipeline` marker of `html-first-v1` or `whole-page-image2-v1`. It SHALL reject a missing, malformed, unknown, or retired marker without inferring a pipeline.

#### Scenario: Whole-page source is marked
- **WHEN** a whole-page source declares `production.pipeline: whole-page-image2-v1`
- **THEN** parsing selects the whole-page pipeline
- **AND** it does not rewrite the source marker

#### Scenario: Source marker is absent
- **WHEN** a source has no direct production pipeline marker
- **THEN** parsing fails with a bounded marker diagnostic
- **AND** it does not select a compatibility pipeline
