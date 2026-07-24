## MODIFIED Requirements

### Requirement: Inspection provides the sole run-scoped observation workflow entry
After Change-1 ledger evidence identifies an exact run, Controller resume/iteration routing and CLI observation (`status` and non-mutating `state`) SHALL obtain their ordered workflow entry from `workflow_inspection.primary_action`. They SHALL not rederive mode, gate, recovery, completion, hash, authorization, or next-action policy from generic node state. Greenfield `init` and every mutating CLI command remain direct-owner entries and SHALL not use this projection to select or replace the requested operation.

#### Scenario: Controller resumes an existing run
- **WHEN** a Controller has resolved an exact existing run for resume or iteration
- **THEN** it consumes `workflow_inspection.primary_action` as its ordered observation input
- **AND** it does not rebuild mode or recovery policy from generic state fields

### Requirement: Inspection composes one action from the retained execution cursor
After protected layout, state-integrity, mode, journal, authorization, and recovery prerequisites have selected no earlier action, inspection SHALL read the direct state-owned execution cursor. A current `waiting_for` SHALL produce exactly state-owned `wait-for-human` with `kind: continue`, `requires_human: true`, and no mutation invocation. An in-progress node SHALL produce exactly playbook-controller-owned `resume-current-node` with `kind: continue`; an otherwise eligible controller state SHALL produce exactly playbook-controller-owned `select-controller-route` with `kind: continue`. The latter two actions SHALL carry bounded route data so callers do not reconstruct it from cursor fields, and neither SHALL create an action menu.

#### Scenario: Inspection observes an in-progress node
- **WHEN** no earlier protected prerequisite blocks an exact run and its current node is in progress
- **THEN** inspection returns the single playbook-controller-owned `resume-current-node` action
- **AND** it does not create a competing action menu

### Requirement: Inspection is observation-only and not an authority
Inspection SHALL perform zero state, history, metadata, generated-artifact, receipt, authorization, or source writes; it makes zero network/provider calls and shall not cache a verdict, heal state, migrate schema, or recover a journal. A repairable current direct fact is reported with its owning repair action. Mutation owners revalidate their direct source/CAS/authorization/receipt facts immediately before a write or submit and never treat an earlier inspection as authorization or freshness proof. An unsupported historical protocol remains byte-preserving and produces one bounded owner-issued typed next action, not a compatibility projection.

#### Scenario: Inspection observes a repairable current state without healing
- **WHEN** inspection encounters a schema-5 state shape the owner could safely repair
- **THEN** it reports the owner-provided action
- **AND** no state, history, or metadata file changes

#### Scenario: Inspection observes unsupported history
- **WHEN** identity is pre-current, absent, retired, or ambiguous
- **THEN** it returns the bounded owner action without a route, mode, or execution inference

### Requirement: Workflow evidence is ledgered before control retirement
The framework SHALL maintain a Change-1 durable-field ledger and canonical journey baseline for HTML, image2-only, html-then-image2, resume, small refresh, structural versioning, visual-slot refinement, current production-mode-transition/recovery, and crash/restart. Each durable field entry names its direct owner, writer, readers, freshness/invalidation rule, reconstructibility, and removal path. The BUG-033 single-page probe records actual earliest direct diagnostics and same-check rerun evidence using supported owner interfaces only. Historical migration is not a baseline journey or a route-under-test.

#### Scenario: A claimed BUG-033 blocker is not reproduced
- **WHEN** the supported minimal fixture does not reproduce a claimed blocker
- **THEN** the baseline records that result and observed direct facts
- **AND** it does not introduce a bypass, hand-written state, receipt, authorization, or assembled PPTX
