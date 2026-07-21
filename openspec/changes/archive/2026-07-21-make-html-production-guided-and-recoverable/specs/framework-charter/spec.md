## MODIFIED Requirements

### Requirement: Gate posture is guide-first and explicitly bounded

The framework charter SHALL define gates as user-guidance surfaces. A gate result SHALL distinguish
an automatically repairable guide, a reversible risk requiring explicit human confirmation, and a
hard stop protecting identity, integrity, security, authorization, or recoverability. Quality and
workflow evidence SHALL be waivable only through a named, reasoned, version-scoped decision; a waiver
SHALL never be represented as approval and SHALL NOT imply that evidence is complete. Evidence
completeness SHALL be computed and reported independently. The charter SHALL point maintainers to
`openspec/policies/human-centered-gates.md`, and `openspec/config.yaml` SHALL require gate-sensitive
changes to record the same classification without copying runtime schemas.

#### Scenario: A quality gate is incomplete

- **WHEN** current HTML evidence is missing but the source, target version, and local artifacts are identifiable
- **THEN** the Agent receives a recommended repair path and an explicit continuation path
- **AND** the continuation records a human reason and remains visibly waived rather than approved

#### Scenario: A transaction identity is unsafe

- **WHEN** a plan hash, reset epoch, target version, active journal, or state owner is ambiguous or conflicting
- **THEN** the framework returns a hard-stop recovery diagnostic
- **AND** no waiver or force flag bypasses the identity/integrity check

#### Scenario: A maintainer proposes a gate-sensitive change

- **WHEN** an OpenSpec proposal, spec, design, or task changes readiness, validation, diagnostics, or override behavior
- **THEN** the artifact names guide/confirm/hard-stop outcomes and the invariant protected by every hard stop
- **AND** runtime CLI/state field definitions remain owned by their existing capabilities

### Requirement: Durable governance separates gate posture from control-path guidance

The framework SHALL keep long-lived governance rules under `openspec/policies/`,
not solely inside an active change. `human-centered-gates.md` SHALL own outcome
classification, continuation semantics, and protected invariants.
`agent-assistance-and-control.md` SHALL own the shape of direct control paths,
including responsibility handoff, source/evaluator selection, diagnostics, and
recovery. For a change involving both, maintainers SHALL classify the outcome
first, then shape the control path. Capability specifications and executable
contracts SHALL remain the only owners of concrete command, state-schema, and
permission behavior.

#### Scenario: A change is archived

- **WHEN** an active OpenSpec change is archived
- **THEN** any research note inside that change remains historical rationale only
- **AND** durable governance continues to be read from `openspec/policies/`

#### Scenario: A controller recovery change also affects a gate

- **WHEN** a proposed change modifies both a gate and its recovery path
- **THEN** it uses the gate policy to classify the outcome and invariant before applying the control policy to source ownership and recovery
- **AND** it does not use either policy as a substitute for the owning runtime contract
