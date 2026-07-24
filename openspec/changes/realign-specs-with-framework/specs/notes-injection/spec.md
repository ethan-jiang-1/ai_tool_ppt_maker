## ADDED Requirements

### Requirement: Whole-page notes retain current assembly lineage
Notes injection SHALL accept a whole-page root assembly only when it declares `whole-page-image2-v1` through the current assembly schema, and SHALL publish the same pipeline in its notes receipt. It SHALL not accept an older whole-page assembly or notes receipt as completion or rerun authority.

#### Scenario: Whole-page notes are injected
- **WHEN** notes are injected from a current whole-page assembly receipt
- **THEN** the notes receipt carries `whole-page-image2-v1`
- **AND** retired lineage values are rejected
