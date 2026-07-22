## ADDED Requirements

### Requirement: Workflow inspection provides a versioned read-only projection
The framework SHALL provide `inspectWorkflow({ runDir, requestedIntent? })` as the sole shared observation composition interface for workflow readiness. It SHALL return `schema: "pptmaker-workflow-inspection-v1"`, an exact run/version `checkpoint`, `posture`, nullable `root_cause`, exactly one `primary_action`, ordered `observations`, nullable `continuation`, nullable `protected_invariant`, and attributable `evidence_summary`. `requestedIntent` SHALL scope only which legal path is inspected; it SHALL NOT authorize an operation, mutate a record, or change production mode/pipeline selection.

#### Scenario: Inspection returns a stable ready projection
- **WHEN** all direct-owner prerequisites for a requested canonical path are current
- **THEN** inspection returns `posture: "ready"` with exactly one ordered primary action for that path
- **AND** its checkpoint identifies the exact observed run/version facts

#### Scenario: Intent cannot grant authority
- **WHEN** a caller supplies a requested intent requiring unavailable authorization
- **THEN** inspection returns the authorization owner's bounded prerequisite action
- **AND** it does not submit a provider operation or infer an authorization

### Requirement: Inspection reuses direct owners and short-circuits prerequisites
Inspection SHALL obtain mode/source, state/recovery, artifact/review, authorization, transaction, and provenance facts from their existing direct owners. It SHALL evaluate failed prerequisites before dependent implications and expose the earliest bounded blocking owner/fact as `root_cause`. It SHALL provide exactly one nearest legal `primary_action`; independent non-primary facts SHALL remain ordered observations and SHALL NOT be emitted as competing recovery actions.

#### Scenario: Invalid state precedes stale downstream review
- **WHEN** authoritative state is invalid and a downstream review is also stale
- **THEN** inspection reports the state owner's repair action as the primary action
- **AND** it retains the stale review only as a non-primary observation

#### Scenario: Human choice remains owned by the gate
- **WHEN** a current gate owner exposes an allowed reasoned continuation
- **THEN** inspection reports its normal primary action and the bounded continuation
- **AND** it does not create a continuation for a hard-stop or infer a waiver

### Requirement: Inspection is observation-only and not an authority
Inspection SHALL perform zero state, history, metadata, generated-artifact, receipt, authorization, or source writes; it SHALL make zero network or provider calls; it SHALL not cache a verdict, heal state, migrate schema, or recover a journal. A repairable direct fact SHALL be reported with the owning repair action. Mutation owners SHALL revalidate their direct source/CAS/authorization/receipt facts immediately before a write or submit and SHALL NOT trust an earlier inspection as authorization or proof of freshness.

#### Scenario: Inspection observes a repairable legacy state without healing
- **WHEN** inspection encounters a state shape that the state owner could heal
- **THEN** it reports the owner-provided repair action
- **AND** no state, history, or metadata file changes

#### Scenario: A changed fact invalidates prior inspection for mutation
- **WHEN** a source, receipt, authorization, or CAS value changes after inspection returns
- **THEN** the mutation owner rechecks the changed direct fact before mutation
- **AND** the earlier projection cannot make the mutation proceed

### Requirement: Inspection preserves protected gate boundaries
Inspection SHALL use the owning gate's `guide`, `confirm`, or `hard-stop` classification. A confirmable result SHALL expose only the owner-provided continuation that requires a human reason. A hard-stop SHALL include the protected invariant and the safe owner recovery action; it SHALL NOT expose force, waive, metadata fallback, state bypass, or implicit retry as a continuation.

#### Scenario: Unknown remote submit fails closed
- **WHEN** inspection observes an unknown or uncertain provider submit/recovery state
- **THEN** it returns a hard-stop with the recovery owner's action and protected invariant
- **AND** it does not recommend a new submit or force path

### Requirement: Workflow evidence is ledgered before control retirement
The framework SHALL maintain a Change-1 durable-field ledger and canonical journey baseline for HTML, Image2-only, HTML-then-Image2, resume, small refresh, structural versioning, visual-slot refinement, migration/recovery, and crash/restart. Each durable field entry SHALL name its direct owner, writer, readers, freshness/invalidation rule, reconstructibility, and removal path. The BUG-033 single-page probe SHALL record actual earliest direct diagnostics and same-check rerun evidence using supported owner interfaces only.

#### Scenario: A claimed BUG-033 blocker is not reproduced
- **WHEN** the supported minimal fixture does not reproduce a claimed blocker
- **THEN** the baseline records that result and the observed direct facts
- **AND** it does not introduce a bypass, hand-written state, receipt, authorization, or assembled PPTX
