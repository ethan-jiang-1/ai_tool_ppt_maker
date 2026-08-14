## MODIFIED Requirements

### Requirement: Undeclared finalization input cannot publish current evidence

An adapter, compositor, Pilot publisher, or shared finalization reader SHALL
reject a present foreign, unreadable, incomplete, or cross-lineage
source/state/receipt/raw/review record when that record cannot establish exact
current production identity. Before artifact publication the direct owner SHALL
emit the typed `current_protocol_invalid` cause; the existing diagnostic
producer SHALL project the owner-issued `production-protocol`
`current-protocol-invalid` hard-stop with the
`repair-current-protocol-identity` repair action. A finalization consumer SHALL
not define a second action schema or use an undeclared compositor, evidence
translator, export, fallback, migration, or compatibility reader as a route.

#### Scenario: Invalid receipt cannot publish a current final manifest

- **WHEN** a foreign or cross-lineage receipt cannot establish exact current
  production identity during finalization
- **THEN** finalization returns the owner-issued hard-stop before reading
  provider media or local-renderer inputs
- **AND** it does not write a final PNG, manifest, PPTX, notes, or delivery
  evidence
