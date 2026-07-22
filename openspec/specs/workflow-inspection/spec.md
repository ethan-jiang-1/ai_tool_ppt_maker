# workflow-inspection Specification

## Purpose
TBD - created by archiving change unify-workflow-inspection. Update Purpose after archive.
## Requirements

### Requirement: Inspection provides the sole run-scoped observation workflow entry

After Change-1 ledger evidence identifies an exact run, Controller resume/iteration routing and CLI observation (`status` and non-mutating `state`) SHALL obtain their ordered workflow entry from `workflow_inspection.primary_action`. They SHALL not rederive mode, gate, recovery, completion, hash, authorization, or next-action policy from generic node state. Greenfield `init` and every mutating CLI command remain direct-owner entries and SHALL not use this projection to select or replace the requested operation.

### Requirement: Inspection composes one action from the retained execution cursor

After protected layout, state-integrity, mode, journal, authorization, and recovery prerequisites have selected no earlier action, inspection SHALL read the direct state-owned execution cursor. A current `waiting_for` SHALL produce exactly state-owned `wait-for-human` with `kind: continue`, `requires_human: true`, and no mutation invocation. An in-progress node SHALL produce exactly playbook-controller-owned `resume-current-node` with `kind: continue`; an otherwise eligible controller state SHALL produce exactly playbook-controller-owned `select-controller-route` with `kind: continue`. The latter two actions SHALL carry bounded route data so callers do not reconstruct it from cursor fields, and neither SHALL create an action menu.
### Requirement: Workflow inspection provides a versioned read-only projection
The framework SHALL provide `inspectWorkflow({ runDir, requestedIntent? })` as the sole shared observation composition interface for workflow readiness. It SHALL return `schema: "pptmaker-workflow-inspection-v1"`, a `checkpoint` containing the exact run/version and every direct-fact identity used for the verdict, `posture`, nullable `root_cause`, exactly one typed `primary_action`, ordered `observations`, nullable `continuation`, nullable `protected_invariant`, and attributable `evidence_summary`. `checkpoint` SHALL contain only stable direct-fact identities and SHALL NOT contain wall-clock time, process identity, random values, command names, or presentation data. `primary_action` SHALL contain `owner`, `action_id`, `kind: continue|repair|review|recover|complete`, and `requires_human`; it MAY contain only owner-issued structured invocation data or a bounded display label. `kind: complete` SHALL represent a terminal ready checkpoint and SHALL not contain a mutation invocation.

`requestedIntent` SHALL be nullable or an owner-issued normalized observation descriptor for the exact current controller/adapter. It SHALL NOT be a public free-form command, mode override, authorization request, or second playbook. An absent descriptor SHALL inspect the exact current run's resume path. An absent, malformed, or inapplicable descriptor SHALL return the owning selection/repair action without guessing a route. It SHALL NOT authorize an operation, mutate a record, or change production mode/pipeline selection.

#### Scenario: Inspection returns a stable ready projection
- **WHEN** all direct-owner prerequisites for a requested canonical path are current
- **THEN** inspection returns `posture: "ready"` with exactly one ordered primary action for that path
- **AND** its checkpoint identifies the exact observed run/version facts

#### Scenario: Intent cannot grant authority
- **WHEN** a caller supplies a requested intent requiring unavailable authorization
- **THEN** inspection returns the authorization owner's bounded prerequisite action
- **AND** it does not submit a provider operation or infer an authorization

#### Scenario: Complete path has an explicit terminal action
- **WHEN** all direct-owner prerequisites are current and the selected path has no following mutation
- **THEN** inspection returns exactly one `primary_action` with `kind: complete`
- **AND** it does not manufacture a command or a continuation

#### Scenario: Stable checkpoint has no presentation entropy
- **WHEN** two consumers read unchanged direct facts through different command presentations
- **THEN** their checkpoints contain no timestamp, process, random, command, or display-only field
- **AND** their canonical projection bytes remain equal

### Requirement: Inspection reuses direct owners and short-circuits prerequisites
Inspection SHALL obtain run-bundle layout/canonical-path, mode/source, state/recovery, artifact/review, applicable authorization, transaction, and provenance facts from their existing direct owners. State observation SHALL combine `readState` with `purpose: observe, heal: false` and `validateStateReadOnly`; it SHALL map a bounded validator issue to the existing state-owner repair/replacement action without healing or rewriting the state. Inspection SHALL evaluate layout/canonical-path, then identity/schema/recovery, then selected-path prerequisites before dependent implications and expose the earliest bounded blocking owner/fact as `root_cause`. It SHALL inspect authorization only when the selected direct owner declares it applicable; it SHALL not probe unrelated provider operations. It SHALL provide exactly one nearest legal `primary_action`; independent non-primary facts SHALL remain ordered observations and SHALL NOT be emitted as competing recovery actions.

#### Scenario: Invalid state precedes stale downstream review
- **WHEN** authoritative state is invalid and a downstream review is also stale
- **THEN** inspection reports the state owner's repair action as the primary action
- **AND** it retains the stale review only as a non-primary observation

#### Scenario: Layout failure precedes workflow implications
- **WHEN** the run-bundle layout owner rejects a canonical-path or required-layout fact and later workflow facts are also stale
- **THEN** inspection returns the layout owner's repair action as the primary action
- **AND** it does not attempt state, authorization, or provider recovery

#### Scenario: Repairable state is reported without a heal
- **WHEN** persisted state has a bounded defect detected by `validateStateReadOnly` that an execute path could heal
- **THEN** inspection returns the state owner's repair action as the primary action
- **AND** it leaves the state, history, metadata, and generated artifacts unchanged

#### Scenario: Human choice remains owned by the gate
- **WHEN** a current gate owner exposes an allowed reasoned continuation
- **THEN** inspection reports its normal primary action and the bounded continuation
- **AND** it does not create a continuation for a hard-stop or infer a waiver

#### Scenario: Multiple controller candidates do not become an action menu
- **WHEN** more than one controller branch is technically eligible but no gate owner requires a human semantic choice
- **THEN** inspection returns one controller-owned routing primary action
- **AND** it does not expose competing branch actions as continuations

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

#### Scenario: Same checkpoint has canonical projection bytes
- **WHEN** status and state observe identical direct-fact identities without a write or remote call between them
- **THEN** inspection produces identical canonical serialized projection bytes for both consumers
- **AND** a changed checkpoint causes a new projection rather than cached reuse

#### Scenario: Direct facts change while inspection is composing
- **WHEN** a participating direct-fact identity changes during inspection
- **THEN** inspection discards the mixed verdict and returns `posture: "guide"` with one read-only `workflow-inspection` / `refresh-workflow-inspection` / `continue` primary action
- **AND** its root cause names the changed direct owner and its action requires no human decision
- **AND** it does not retry in a loop, acquire a lock, write a cache, or mutate an owner record

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
