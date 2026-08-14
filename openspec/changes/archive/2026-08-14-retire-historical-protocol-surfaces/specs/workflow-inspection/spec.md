## ADDED Requirements

### Requirement: Undeclared production protocol has one owner-issued hard-stop

After distinguishing a declared fresh authoring draft from a present production
record, and before resolving a selected production workflow or inspecting
derived lifecycle facts, Workflow Inspection SHALL reject a foreign,
unreadable, incomplete, or cross-lineage source/state/evidence record that
cannot establish exact current protocol identity through one owner-issued
result: `posture: hard-stop`, owner `production-protocol`, root cause
`current-protocol-invalid`, action ID `repair-current-protocol-identity`, action
kind `repair`, and `requires_human: false`. It SHALL preserve direct
source/state/evidence bytes and SHALL not initialize state, refresh a task
projection, inspect generated artifacts as authority, submit provider work, or
construct an alternate route. No export, migration, conversion, adoption,
compatibility reader, or protocol-specific recovery action is current.

A declared fresh authoring draft SHALL retain its existing
narrative/workflow-selection action. A state-owned defect after current protocol
identity is established SHALL retain its state owner; only a one-to-one,
fence-clear repair is write-eligible. An exact requested/active Work Version
mismatch SHALL retain its execution-version owner. Inspection SHALL not replace
those current outcomes with protocol repair.

#### Scenario: An invalid current-shaped marker is observed

- **WHEN** inspection reads a source/state/evidence pair that cannot establish
  the exact declared current protocol
- **THEN** it returns the one `production-protocol` hard-stop and its repair
  action before selected-workflow routing
- **AND** a repeated inspection leaves the pair byte-identical and returns the
  same bounded action without provider work

#### Scenario: Fresh draft is not an invalid production record

- **WHEN** inspection observes a declared fresh authoring draft without current
  production identity
- **THEN** it returns the existing narrative/workflow-selection owner action
- **AND** it does not synthesize an invalid protocol pair or repair action

#### Scenario: Exact Work Version mismatch remains execution-owned

- **WHEN** an otherwise declared-current run is requested under a Work Version
  different from its exact active execution version
- **THEN** inspection returns the existing execution-version owner action
- **AND** it does not recategorize the mismatch as invalid protocol identity
