# workflow-inspection Specification

## Purpose
Define the read-only workflow-observation projection that gives MD Controllers and CLI observers one ordered, owner-issued next action for an exact run without reconstructing mode, gate, recovery, or completion policy.
## Requirements
### Requirement: Inspection remains separate from collaboration projection refresh

`inspectWorkflow({ runDir })` SHALL remain a zero-authority-write evaluator: it
shall not create, refresh, inspect as input, or rely on a collaboration task
projection. It SHALL return the direct owner facts and one nearest legal action
for an exact run independently of whether a caller later renders a
non-authoritative projection.

Eligibility to rebuild `_state/page-production-task-projection.md` belongs to
the Controller/CLI presentation boundary after that inspection, not to
inspection itself. A card's presence, content, or absence SHALL not affect the
inspection checkpoint, action, gate posture, evidence evaluation,
authorization, or recovery route.

#### Scenario: Inspection ignores a missing or stale card

- **WHEN** an exact progressive run is inspected while its task projection is
  absent, manually edited, or stale
- **THEN** inspection returns the same direct owner action it would return
  without that card
- **AND** it creates, changes, and reads no task projection as lifecycle input

#### Scenario: Projection cannot influence a hard-stop

- **WHEN** inspection encounters an identity, evidence, authorization, or
  recoverability hard-stop
- **THEN** it returns the owning protected invariant and nearest recovery
  action from direct facts
- **AND** no card content can turn that result into resume, confirmation, or
  authorization

### Requirement: Inspection observes current Page Image Workflow marker-first

Workflow Inspection SHALL remain read-only and resolve a current Page Image
Workflow from its exact schema-declared `page-image-workflow` source,
`image2-page-workflow` state, selected version-level policy, and direct current
lineage records. It SHALL report the selected `framed` or `pure` workflow and
one owner-issued nearest action without inferring policy from prose, artifact
names, or conversation context. It SHALL not initialize a receipt, mutate
state, submit a provider request, or construct an alternate projection.

#### Scenario: Current Framed status is projected from direct markers

- **WHEN** inspection reads a valid current Framed source/state pair
- **THEN** it reports Framed and the direct prerequisite from its owning
  lifecycle
- **AND** it does not select Pure or construct a per-slide authority view

### Requirement: Inspection projects the direct compiled-input lifecycle

For an exact current run, Inspection SHALL obtain the selected adapter's direct
facts for Style Master readiness, compiled provider-input digest, protected
geometry and local profile where applicable, plan/authorization/attempt
status, Pilot scope, Complete Page Review, and delivery. Its primary action
SHALL name the earliest protected invariant or legal current step. A Framed
provider-free overlay refresh is actionable only after direct proof that
compiled provider input, protected geometry, raw contract, and local profile
are unchanged; a header literal change therefore projects raw rebuild.

The review projection SHALL be one Complete Page Review action: Framed shows
the raw provider page beside its production-equivalent header composite, while
Pure shows its complete provider page. Inspection SHALL not project a second
composite approval, synthesize a Pilot, or infer acceptance from an artifact.

#### Scenario: Framed header input drift is raw work

- **WHEN** a Framed title changes and the adapter's compiled-input digest
  changes
- **THEN** inspection returns raw rebuild as the nearest action
- **AND** it does not select provider-free overlay refresh

#### Scenario: Complete Framed page review has one action

- **WHEN** all current Framed provider-page and composite evidence is ready
- **THEN** inspection returns the one Complete Page Review `proceed` or
  `repair` action
- **AND** it does not expose an additional local-composite approval

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
