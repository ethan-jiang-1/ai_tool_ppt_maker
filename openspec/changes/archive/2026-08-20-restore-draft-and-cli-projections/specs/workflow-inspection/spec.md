## MODIFIED Requirements

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
narrative/workflow-selection action. That draft includes a current
`page-image-workflow` source whose `production.workflow` is exactly `framed` or
`pure` when that version has no `production_identity.by_version` entry. The
predicate is empty identity, not empty workflow. Inspection SHALL NOT add a
new provider-evidence scanner for this draft route. When identity is absent
and the existing declared-draft resolver returns null, the pair remains an
invalid production record and keeps this hard-stop.

A state-owned defect after current protocol identity is established SHALL
retain its state owner; only a one-to-one, fence-clear repair is
write-eligible. An exact requested/active Work Version mismatch SHALL retain
its execution-version owner. Inspection SHALL not replace those current
outcomes with protocol repair.

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

#### Scenario: Selected workflow without identity remains a fresh draft

- **WHEN** the current source declares `production.workflow` `framed` or `pure`
  and that version has no `production_identity.by_version` entry and the
  existing declared-draft resolver accepts the pair
- **THEN** inspection returns the existing narrative or paginate-apply owner
  action for that draft
- **AND** it does not emit `current-protocol-invalid` or
  `repair-current-protocol-identity`

#### Scenario: A pair the draft resolver rejects stays protocol-invalid

- **WHEN** that version has no identity record and the existing declared-draft
  resolver does not accept the pair
- **THEN** inspection keeps the `production-protocol` hard-stop
- **AND** it does not invent a second draft predicate

#### Scenario: Exact Work Version mismatch remains execution-owned

- **WHEN** an otherwise declared-current run is requested under a Work Version
  different from its exact active execution version
- **THEN** inspection returns the existing execution-version owner action
- **AND** it does not recategorize the mismatch as invalid protocol identity
