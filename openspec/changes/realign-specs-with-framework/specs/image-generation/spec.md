## ADDED Requirements

### Requirement: Whole-page generation identifies the current lineage
Whole-page Image2 generation receipts and produced artifact records SHALL identify `whole-page-image2-v1` and current whole-page producers. They SHALL not emit or accept a retired lineage value or require a compatibility reader.

#### Scenario: Whole-page artifacts are published
- **WHEN** authorized whole-page generation publishes an artifact record
- **THEN** its pipeline lineage is `whole-page-image2-v1`
- **AND** later consumers can validate it without a legacy reader
