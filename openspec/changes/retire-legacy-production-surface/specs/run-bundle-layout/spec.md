## ADDED Requirements

### Requirement: Current generated ownership is Page Authority-only
Canonical run-bundle layout SHALL assign current raw, review, final, projection, PPTX, and notes
artifacts to Page Authority owners. Historical generated trees are diagnostic-only observer input and
shall not be selected as current artifacts.

#### Scenario: A current path is resolved
- **WHEN** a Page Authority operation resolves generated paths
- **THEN** it receives Page Authority owner paths and no HTML/refinement/Header-Lock owner path

