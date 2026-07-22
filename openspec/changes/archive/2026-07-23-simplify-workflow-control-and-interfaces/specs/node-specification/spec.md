## ADDED Requirements

### Requirement: Generic workflow control retires only with ledger proof

The state owner SHALL stop new writes of a generic node/control fact only after the canonical
`tests/contracts/workflow-control-ledger-v2.json` identifies its direct owner, writer, readers,
invalidation/freshness rule, reconstructibility, removal/retention decision, and replacement test.
The file SHALL declare schema `pptmaker-workflow-control-ledger-v2`; every entry SHALL have a stable
ID, `surface: durable|derived`, and a recognized decision. A compatibility entry SHALL additionally
name retirement owner, removal trigger, and `retire_by: change:<name>|release:<version>`.
`PPTMAKER_FRAMEWORK/reference/workflow-inspection-ledger.md` SHALL explain the same decisions but
shall not supersede the JSON ledger. The ledger SHALL list candidate derived control
readers/projections so their duplicate evaluator behavior is either removed or explicitly retained.

The execution cursor (`playbook`, `current_node`, execution/version binding, and current-node
`waiting_for`) SHALL remain a direct state-owned durable record, not a retirement candidate. Existing
supported records SHALL remain read-compatible only when each retained compatibility reader has the
required bounded retirement data; otherwise the writer and reader remain unchanged in this change.
Minimal cross-invocation human intent MAY remain only when it is not reconstructible and its direct
owner writes it through the existing CAS or journal boundary.

#### Scenario: Reconstructible record reaches writer retirement
- **WHEN** the ledger proves a generic record can be rebuilt from direct owners
- **THEN** new execution does not write that record
- **AND** restart derives the same inspection primary action without it

#### Scenario: Historical reader still has a caller
- **WHEN** a supported caller requires a historical generic record
- **THEN** it remains a read-only compatibility reader with a named retirement owner
- **AND** its ledger row records a removal trigger and exact `retire_by`
- **AND** no new generic writer is restored

#### Scenario: Execution cursor is retained
- **WHEN** an exact run has a valid playbook/current node, execution/version binding, or `waiting_for`
- **THEN** the state owner retains that fact as direct durable execution context
- **AND** a control-retirement change does not erase or reconstruct it from presentation fields
