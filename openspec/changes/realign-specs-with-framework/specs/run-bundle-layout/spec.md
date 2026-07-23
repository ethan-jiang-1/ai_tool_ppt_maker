## ADDED Requirements

### Requirement: Whole-page run identity is explicit
A whole-page run SHALL declare `production.pipeline: whole-page-image2-v1` in its canonical source. Layout validation SHALL not treat absent source metadata as a whole-page identity.

#### Scenario: Whole-page run has an explicit marker
- **WHEN** layout validates a canonical whole-page source with the current marker
- **THEN** it applies whole-page ownership rules

#### Scenario: Whole-page marker is absent
- **WHEN** layout validates a source without a production marker
- **THEN** it reports the marker as invalid
- **AND** it does not apply a whole-page compatibility layout
