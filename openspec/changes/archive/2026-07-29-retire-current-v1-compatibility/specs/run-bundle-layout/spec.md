## REMOVED Requirements

### Requirement: Legacy adoption candidates remain source-local and non-derived
**Reason**: Adoption scratch topology is a retired migration workflow and must not remain in the current run-bundle contract.
**Migration**: An explicitly authorized one-off migration delivery owns any temporary conversion workspace outside active run-bundle layout; remove the adoption candidate root and its validators.

## MODIFIED Requirements

### Requirement: Current generated ownership is Page Authority-only
Canonical run-bundle layout SHALL assign current raw, review, final, projection, PPTX, and notes artifacts to v2 Page Authority owners. Foreign generated trees SHALL not be selected as current artifacts or execution authority.

#### Scenario: A current path is resolved
- **WHEN** a Page Authority operation resolves generated paths
- **THEN** it receives v2 Page Authority owner paths and no foreign owner path
