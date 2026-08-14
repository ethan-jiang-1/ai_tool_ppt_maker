## MODIFIED Requirements

### Requirement: Undeclared production input is excluded from current lifecycle routing

Before route selection, orchestration SHALL require exact declared-current
source/state identity and current evidence lineage whenever a production record
is present. A foreign, unreadable, incomplete, or cross-lineage record that
cannot establish that identity SHALL return the owner-issued
`production-protocol` `current-protocol-invalid` hard-stop with the
`repair-current-protocol-identity` action of kind `repair`. It SHALL not acquire
a current lifecycle, refresh route, plan, authorization, generated-artifact
reader, recovery branch, export, conversion, adoption, fallback, or
compatibility reader.

This boundary SHALL not recategorize an exact Harness locator/binding failure, a
declared fresh authoring draft, a state-owned defect after current protocol
identity is established, an exact requested/active Work Version mismatch, or
attributable current delivery drift. Those facts SHALL continue to route to
their existing Harness-binding, narrative/workflow-selection, state,
execution-version, or delivery owner respectively. Only a one-to-one,
fence-clear current state repair may write.

#### Scenario: Invalid evidence cannot select a local route

- **WHEN** a refresh request names source, state, or evidence that cannot
  establish the exact current protocol
- **THEN** orchestration stops at the protocol boundary before change
  classification with the owner-issued repair action
- **AND** it does not attempt a local rebind, raw rebuild, or data conversion

#### Scenario: Declared fresh draft remains authoring work

- **WHEN** a target is a declared fresh authoring draft and has not yet acquired
  production identity
- **THEN** orchestration returns the existing narrative/workflow-selection owner
- **AND** it does not invent an invalid-protocol record or repair action

#### Scenario: Exact execution version mismatch retains its owner

- **WHEN** the requested Work Version differs from the exact active execution
  version of an otherwise declared-current run
- **THEN** orchestration returns the existing execution-version owner action
- **AND** it does not replace that action with protocol repair
