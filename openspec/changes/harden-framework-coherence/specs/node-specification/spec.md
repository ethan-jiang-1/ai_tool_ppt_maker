## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates

Every registered node SHALL have one canonical YAML declaration with at minimum: `node` (globally unique kebab-case name), `lifecycle_phase` (`0`, `1`, `2`, `2.7`, `3`, or `4`), `method_module` (`00-setup`, `01-visual`, `02-content`, `03-prompts`, `04-production`, or `05-iteration`), `requires` (ordered node dependencies), `entry` (additional deterministic conditions that must be true before starting), and `exit` (conditions that must be true before marking completed). A routing GATE node SHALL additionally declare `decisions` as a non-empty list of unique allowed string values. An ordered playbook MAY declare nodes in fenced YAML blocks within its Markdown controller; a standalone shared node MAY declare the same schema in document frontmatter. The runtime parser and validator SHALL support exactly these forms and SHALL NOT discover nodes by substring search.

#### Scenario: Agent checks entry gate before executing a node

- **WHEN** Agent begins executing node `wave0` in playbook `create-deck`
- **THEN** the parser resolves the exact `wave0` declaration from the playbook index
- **AND** verifies all `requires` dependencies and explicit `entry` conditions
- **AND** if any check fails, Agent reports the missing condition and does NOT proceed

#### Scenario: Agent checks exit gate before marking node complete

- **WHEN** Agent finishes the steps in node `wave0`
- **THEN** it verifies all `exit` conditions are met
- **AND** if any condition fails, Agent stays in the node until conditions are satisfied

#### Scenario: Duplicate node identifier is rejected

- **WHEN** two registered playbooks declare the same node identifier
- **THEN** playbook validation fails and reports both source files and lines
- **AND** node lookup does not silently select the first textual match

#### Scenario: Ambiguous phase field is rejected

- **WHEN** a node declares legacy `phase: 04` without `lifecycle_phase` and `method_module`
- **THEN** playbook validation fails with a migration hint
- **AND** does not guess whether `04` means lifecycle or methodology module

### Requirement: Node body distinguishes MD steps from CLI steps

Each node body SHALL contain one or more compact step declarations using exactly `**Step N — MD**`, `**Step N — CLI**`, or `**Step N — GATE**`. Step numbers SHALL start at 1 and increase monotonically within the node. MD steps SHALL reference methodology without duplicating it; CLI steps SHALL include an exact command or API operation with placeholders; GATE steps SHALL describe the user decision and persisted evidence/gate update. Mixed labels such as `CLI/State` SHALL be split into separate canonical steps.

#### Scenario: Agent reads a node with mixed step types

- **WHEN** Agent reads a node containing creative work, a script invocation, and a user review
- **THEN** the body uses distinct MD, CLI, and GATE steps in order
- **AND** the validator can associate those steps with the preceding YAML declaration

#### Scenario: Node body has no executable steps

- **WHEN** a node declaration is followed by no canonical step before the next node
- **THEN** playbook validation fails and names the node

### Requirement: Node status has exactly five valid states

A node's status SHALL be one of: `pending` (not started), `in_progress` (currently executing), `completed` (all exit conditions met), `skipped` (explicitly bypassed by user decision), or `failed` (blocked and requiring intervention). `setNodeStatus` SHALL reject any other value. State heal SHALL normalize an invalid persisted value to `pending`, preserve a diagnostic note, and write the cleaned state. Transitioning a previously completed node to `in_progress` or `pending` SHALL remove its stale `completed` timestamp; completing a node SHALL remove fields that claim it remains failed.

#### Scenario: Invalid status write is rejected

- **WHEN** a caller invokes `setNodeStatus(state, 'wave0', 'done')`
- **THEN** the API throws a validation error
- **AND** does not mutate the node record

#### Scenario: Node transitions through valid statuses

- **WHEN** an agent starts a pending node and later satisfies every exit condition
- **THEN** the persisted status transitions `pending` → `in_progress` → `completed`
- **AND** an explicit user-authorized bypass uses `skipped`, not an invented synonym

#### Scenario: Completed node is restarted cleanly

- **WHEN** a completed node is set to `in_progress`
- **THEN** its prior `completed` timestamp is removed
- **AND** a new `started` timestamp is recorded

#### Scenario: Invalid persisted status heals safely

- **WHEN** `state.yaml` contains an unsupported node status
- **THEN** default-heal rewrites it as `pending` with a diagnostic note
- **AND** downstream execution remains blocked until the node is deliberately resumed

#### Scenario: User explicitly skips a node

- **WHEN** the user authorizes bypassing a skippable node
- **THEN** the node is recorded as `skipped` rather than `completed`
- **AND** downstream `node_done` prerequisites may proceed without falsifying completion evidence

### Requirement: checkEntry validates entry conditions

`checkEntry(nodeName, playbookDir, state, ctx)` SHALL resolve the exact node declaration from the canonical playbook index, evaluate each `requires` dependency as `node_done:<id>` within the active `execution_id`, then evaluate explicit deterministic `entry` conditions. It SHALL return `{ pass: boolean, missing: string[], unknown: string[] }`. An absent, duplicated, invalid, or unknown-condition node SHALL NOT return `pass: true`. Current-node `evidence:`, `user_evidence:`, `decision_recorded`, and `user_decision_recorded` conditions SHALL be forbidden in entry lists; branch selection MAY use `node_evidence:<required-node>:<key>` or `node_decision:<required-node>:<value>`. Cross-node evidence and decisions SHALL additionally require the upstream node to be `completed`, not merely `skipped`.

#### Scenario: Required predecessor blocks entry

- **WHEN** `wave0` declares `requires: [seed-topics]`
- **AND** `seed-topics` is neither completed nor skipped
- **THEN** `checkEntry('wave0', ...)` returns `pass: false`
- **AND** `missing` includes `node_done:seed-topics`

#### Scenario: Embedded declaration is actually parsed

- **WHEN** a node is declared in a fenced YAML block inside a playbook controller
- **THEN** `checkEntry` evaluates that declaration's dependencies and entry conditions
- **AND** it does not return a vacuous pass because document frontmatter lacks `entry`

#### Scenario: Current-node evidence entry condition is rejected

- **WHEN** a node declares `entry: [user_evidence:user-approved]`
- **THEN** validation fails because current-node evidence cannot exist before the node starts

#### Scenario: Upstream decision selects a branch

- **WHEN** a readiness branch declares `entry: [node_decision:hitl2:proceed]`
- **AND** required upstream node `hitl2` completed after recording a typed user decision with value `proceed` in the current execution
- **THEN** the branch entry condition passes

### Requirement: checkExit validates exit conditions

`checkExit(nodeName, playbookDir, state, ctx)` SHALL resolve the same canonical node declaration as `checkEntry`, parse the `exit` field, and evaluate deterministic and typed persisted evidence conditions. It SHALL NOT mark an absent, duplicated, unparsed, or unknown-condition node as passed.

#### Scenario: Exit gate passes when conditions met

- **WHEN** wave0 deterministic exit conditions and required typed evidence are current in state
- **THEN** `checkExit('wave0', ...)` returns `{ pass: true, missing: [], unknown: [] }`

#### Scenario: Missing artifact blocks exit

- **WHEN** a production node declares `pptx_generated` and no PPTX exists
- **THEN** `checkExit` returns `pass: false`
- **AND** `missing` includes `pptx_generated`

### Requirement: Gate Conditions Catalog is defined in NODE-SPEC.md

`charter/NODE-SPEC.md` SHALL contain a Gate Conditions Catalog listing every valid deterministic condition and parameterized condition family, its type, data source, and check logic. Every `entry`/`exit` condition in canonical node declarations SHALL use the catalog, including `evidence:<key>`, `user_evidence:<key>`, `decision_recorded`, `user_decision_recorded`, `node_evidence:<node>:<key>`, and `node_decision:<node>:<value>`. Free-form unknown tokens SHALL be invalid. The catalog SHALL state that `requires` is enforced separately as `node_done:<id>`, that current-node evidence/decision families are exit-only, and that cross-node evidence/decision conditions may reference only a declared required and completed upstream node in the same execution.

#### Scenario: Developer looks up a deterministic condition

- **WHEN** a developer opens the Gate Conditions Catalog
- **THEN** each filesystem/state/gate condition lists its name, data source, and check logic

#### Scenario: Developer looks up typed evidence and decisions

- **WHEN** a developer looks up the six typed evidence/decision conditions and families
- **THEN** the catalog identifies their node path, execution scope, record shape, provenance, and allowed entry/exit placement

#### Scenario: Every controller condition is cataloged

- **WHEN** the validator indexes all registered node declarations
- **THEN** every entry/exit token resolves to a catalog condition or valid parameterized family
- **AND** unknown prose tokens cause validation failure

#### Scenario: Header review uses current execution scope

- **WHEN** an iteration classification selects slides whose resolved modes include content `full-page`
- **THEN** `header_review_current` checks reviewed hashes for exactly those relevant full-page IDs at the current version/profile
- **AND** it passes vacuously only when the relevant scope contains no full-page slide

#### Scenario: Slide validation reuses Stage-1 contract

- **WHEN** `slide_specs_valid` is evaluated
- **THEN** it calls the same side-effect-free validation logic used by Stage 1
- **AND** does not maintain a second, drifting definition of valid slide specifications

### Requirement: State API provides complete query interface

`state.mjs` SHALL export query functions: `getNodeStatus(state, name)`, `getCurrentNode(state)`, `getCompletedNodes(state, nodeIds?)`, `getPendingNodes(state, nodeIds?)`, `isNodeCompleted(state, name)`, `isPlaybookComplete(state, nodeIds?)`, `getGateStatus(state, name)`, `isGateApproved(state, name)`, and `getMissingConditions(nodeName, playbookDir, state, ctx)`. Node-status queries SHALL treat a missing or execution-mismatched controller record as `pending` for active execution checks. Completed, pending, and playbook-complete queries SHALL accept an optional canonical node-ID list from the active playbook index. When provided, absent/current-execution-mismatched records SHALL be treated as `pending`; reserved system records and nodes outside the supplied controller set SHALL not affect the result. Existing callers that omit the list SHALL retain backward-compatible record-only behavior over the active working set where explicitly documented.

#### Scenario: Agent queries current position

- **WHEN** Agent calls `getCurrentNode(state)` on a state with `current_node: wave0`
- **THEN** it returns `wave0`

#### Scenario: Pending query sees nodes not yet written

- **WHEN** the active playbook index contains eleven nodes but state has records for only three
- **THEN** `getPendingNodes(state, activeNodeIds)` includes the other eight unless completed/skipped

#### Scenario: Unrelated playbook record does not block completion

- **WHEN** state retains an unfinished node record from a previously switched playbook
- **AND** all nodes in the active playbook's node-ID list are completed or skipped
- **THEN** `isPlaybookComplete(state, activeNodeIds)` returns true

#### Scenario: Backward-compatible query remains available

- **WHEN** a legacy caller invokes `getCompletedNodes(state)` without node IDs
- **THEN** it returns completed records using the existing record-only semantics

### Requirement: Playbook stack preserves position during switching

`_state/state.yaml` SHALL include a `playbook_stack` YAML array of `{playbook, current_node, execution_id, execution_started_at, controller_nodes}` objects, where `controller_nodes` is a deep snapshot of the parent execution's non-reserved node records. `writeState`/`readState` SHALL round-trip this field without changing its type. `switchPlaybook()` SHALL push the five-field snapshot, preserve top-level reserved system records, clear active controller records, and create a new execution context for the nested playbook. `resumePlaybook()` SHALL discard nested controller records, restore all five parent fields, and retain the latest reserved system records. Legacy stack entries without execution fields or snapshots SHALL be normalized during v1→v2 migration to a safe blocking snapshot rather than guessed from ambiguous flat records.

#### Scenario: Agent switches playbooks and returns

- **WHEN** Agent is in a create-deck execution, switches to iterate-style, finishes, and resumes
- **THEN** `resumePlaybook()` restores the original playbook, current node, execution ID, execution start time, and controller-node snapshot
- **AND** nested execution evidence does not replace parent execution evidence
- **AND** the popped stack entry is removed

#### Scenario: Empty stack survives write/read

- **WHEN** a state with `playbook_stack: []` is written and read
- **THEN** it remains an empty array
- **AND** switch can push a five-field entry with an object snapshot

#### Scenario: Non-empty stack survives write/read

- **WHEN** a stack contains `{playbook: "create-deck", current_node: "setup", execution_id: "exec-parent", execution_started_at: "2026-07-12T00:00:00Z", controller_nodes: {...}}`
- **THEN** write/read preserves all four strings, the deep controller snapshot, and array order
- **AND** resume restores that exact execution context

#### Scenario: Legacy stack entry is migrated

- **WHEN** a v1 stack entry contains only `playbook` and `current_node`
- **THEN** v2 migration assigns persisted execution ID/start time and an empty safe controller snapshot with a diagnostic
- **AND** resume does not fail or attribute one legacy shared-node record to multiple executions

#### Scenario: Legacy non-array stack is normalized

- **WHEN** a v1 state has `playbook_stack: {}`
- **THEN** migration normalizes it to an empty array
- **AND** switch/resume helpers do not throw

#### Scenario: Nested shared node does not overwrite parent

- **WHEN** a parent execution has completed shared node `classify-change`
- **AND** it switches to a child playbook that executes the same shared node ID
- **THEN** the child record exists only in the child working set
- **AND** resume restores the parent's original status, evidence, decision, and execution ID

### Requirement: State writes are atomic

`writeState` SHALL write the complete YAML to a uniquely named temporary sibling in the target `_state/` directory and then atomically rename it to `state.yaml`. It SHALL NOT place the temporary file in a different filesystem such as `os.tmpdir()`. A crash SHALL leave either the complete old target or complete new target; stale temp siblings SHALL never be read as state truth and MAY be cleaned after successful operations.

#### Scenario: Deck resides on another filesystem

- **WHEN** the run bundle is on a volume different from the operating-system temp directory
- **THEN** `writeState` still completes through same-directory rename
- **AND** does not fail with cross-device `EXDEV`

#### Scenario: Crash leaves a temp sibling

- **WHEN** the process stops after writing the temp file but before rename
- **THEN** the previous `state.yaml` remains complete
- **AND** the temp sibling is ignored during the next read

## ADDED Requirements

### Requirement: Playbook index validates references and impossible gates

The implementation SHALL expose a reusable playbook index and validator that checks every registered playbook/shared node for parse errors, globally unique IDs, reserved system-ID collisions, valid includes/requires references, dependency cycles/order, canonical lifecycle/module values, canonical step syntax, condition catalog coverage, decision declarations/references, and impossible self-entry gates. Runtime checks and tests SHALL consume the same parsed representation. The initial reserved state ID SHALL include `header-review`.

#### Scenario: Self-completed entry is rejected

- **WHEN** node `instantiation` declares `entry: [node_status:instantiation:completed]`
- **THEN** validation fails with an impossible-entry diagnostic

#### Scenario: Missing required node is rejected

- **WHEN** a node declares `requires: [missing-node]`
- **THEN** validation fails and names the requiring node and missing ID

#### Scenario: Reserved system node cannot be declared

- **WHEN** a playbook declares `node: header-review`
- **THEN** validation fails because that ID is owned by version-scoped system evidence

#### Scenario: Dependency cycle is rejected

- **WHEN** node A requires B and node B directly or transitively requires A
- **THEN** validation fails with the cycle path

#### Scenario: Downstream branch value is not declared upstream

- **WHEN** a node uses `node_decision:hitl2:proceeed` but `hitl2.decisions` contains only `proceed`, `repair`, and `redirect`
- **THEN** validation fails at the downstream condition
- **AND** names the upstream declaration and allowed values

### Requirement: Node completion and branch decisions use typed records

Evidence-backed conditions SHALL use records shaped as `{met:true, kind:"user"|"agent"|"cli", at:<ISO-8601>, note?:<string>}` under the controller node's current execution. Decisions SHALL use `{value:<non-empty string>, kind:"user"|"agent"|"cli", at:<ISO-8601>, note?:<string>}`. `evidence:<key>` SHALL accept any valid kind on the current node exit. `user_evidence:<key>` SHALL require `kind: user`. `decision_recorded` and `user_decision_recorded` SHALL validate the corresponding current-node decision. `node_evidence:<node>:<key>` and `node_decision:<node>:<value>` SHALL read only a declared required upstream node that is completed in the same execution; a skipped predecessor SHALL not supply branch evidence. The state API SHALL expose validating `setNodeEvidence` and `setNodeDecision` helpers; `setNodeDecision` SHALL resolve the exact declaration from the supplied canonical playbook index and reject values outside that node's `decisions` enum. Durable persistence remains governed by `writeState`. Free-form prose conditions SHALL NOT silently pass.

#### Scenario: Unrecorded user review blocks exit

- **WHEN** a visual review node declares `user_evidence:user-reviewed-artifact`
- **AND** no matching evidence is persisted under that node
- **THEN** `checkExit` returns that condition in `missing`

#### Scenario: Persisted user review satisfies exit

- **WHEN** the agent opens the artifact, receives the user decision, and records evidence with `met: true`, `kind: user`, and `at`
- **THEN** the matching user-evidence condition passes on a fresh state read

#### Scenario: CLI completion evidence satisfies exit

- **WHEN** a probe node records `probe-finished` with `kind: cli` after exit zero
- **THEN** `evidence:probe-finished` passes
- **AND** `user_evidence:probe-finished` would not pass

#### Scenario: Typed user decision selects a branch

- **WHEN** a review node records `{value: "proceed", kind: "user", at: <ISO-8601>}` and completes in the active execution
- **THEN** its `user_decision_recorded` exit condition passes
- **AND** a required downstream `node_decision:<review-node>:proceed` entry condition passes

#### Scenario: Runtime decision value is misspelled

- **WHEN** `setNodeDecision` receives `proceeed` for a node declaring `decisions: [proceed, repair]`
- **THEN** it throws without mutating the node record
- **AND** the node cannot complete through `decision_recorded`

#### Scenario: Skipped or legacy decision cannot authorize branch

- **WHEN** the upstream review node is skipped or its scalar legacy decision healed with `kind: agent`
- **THEN** it does not satisfy a user-authorized downstream branch
- **AND** the state remains safely blocked pending a current decision

### Requirement: State schema is explicitly versioned and migrated

`state.yaml` SHALL contain integer `schema_version: 2`, exposed by `STATE_SCHEMA_VERSION`, stable whole-workflow `started_at`, and—whenever `playbook` is non-empty—a non-empty `execution_id` and `execution_started_at`. A default state with no active playbook MAY keep the playbook and execution fields empty but SHALL contain no controller-node records. Top-level `nodes` SHALL contain the active execution's controller working set plus reserved system records. Every controller-node record written for the active playbook SHALL carry the same execution ID. Starting a new top-level execution SHALL clear prior controller records while preserving reserved records, but SHALL reject a non-empty stack and SHALL require explicit replacement authorization when the active execution is incomplete. Reserved system evidence such as `header-review` SHALL retain capability-specific version/fingerprint semantics and SHALL NOT be treated as controller execution records. A missing version SHALL be treated as legacy v1. Default read/heal SHALL apply ordered, idempotent migrations to v2 before validation and rewrite the normalized file. Migrations SHALL cover known renamed node IDs, evidence and decision normalization, controller execution tagging, enum normalization, time-field normalization, incompatible timestamp cleanup, and safe legacy stack snapshots.

#### Scenario: Legacy state gains current schema version

- **WHEN** a valid legacy state has no `schema_version`
- **THEN** default read/heal returns a usable current state
- **AND** rewrites the file with the current schema version

#### Scenario: Inactive default state has no phantom execution

- **WHEN** no playbook has been started and no controller records exist
- **THEN** `schema_version` is current while `playbook`, `execution_id`, and `execution_started_at` may remain empty
- **AND** starting a playbook populates all active execution fields together

#### Scenario: Known node rename is playbook-scoped

- **WHEN** legacy state has `playbook: edit-text` and `current_node: verify-output`
- **THEN** migration maps it to the text-specific node ID
- **AND** the same legacy ID under `edit-visual` maps to the visual-specific node ID

#### Scenario: Migration is idempotent

- **WHEN** an already migrated state is read and healed again
- **THEN** node IDs, evidence, and timestamps do not change again

#### Scenario: Legacy execution ID is stable

- **WHEN** a legacy state without execution IDs is healed twice
- **THEN** the first heal persists one execution ID on the active state and migrated node records
- **AND** the second heal preserves that same ID

#### Scenario: Scalar legacy decision is not upgraded to human approval

- **WHEN** a v1 node contains `decision: proceed` without provenance
- **THEN** migration converts it to a typed decision with `kind: agent` and a migration timestamp
- **AND** it cannot satisfy `user_decision_recorded` until a user decision is recorded

#### Scenario: Workflow start is not overwritten by a new playbook

- **WHEN** a state with an existing `started_at` begins a new playbook execution
- **THEN** `started_at` remains unchanged
- **AND** a new `execution_started_at` is recorded

#### Scenario: Incomplete execution is not silently replaced

- **WHEN** the active execution has an in-progress or failed controller node
- **AND** `startPlaybook` is called without explicit replacement authorization
- **THEN** it throws without clearing the active working set
- **AND** a nested workflow must use `switchPlaybook`

### Requirement: Playbook executions do not reuse prior node completion

`startPlaybook` SHALL create a new execution ID and a clean controller-node working set only under the replacement preconditions in the state-schema requirement. `setNodeStatus`, `setNodeEvidence`, and decision writes SHALL tag controller records with the active execution ID. Conditions such as `node_done`, `node_completed`, `node_status`, `evidence:`, `user_evidence:`, `decision_recorded`, `user_decision_recorded`, `node_evidence:`, and `node_decision:` SHALL fail closed on execution-mismatched controller records. Starting the same playbook again SHALL therefore begin with its nodes pending. Nested `switchPlaybook`/`resumePlaybook` SHALL isolate child records by snapshotting and restoring the parent working set. Reserved system evidence is excluded and continues to use its own freshness contract.

#### Scenario: Repeated edit-text run reclassifies

- **WHEN** one `edit-text` execution completed `classify-change`
- **AND** a new `edit-text` execution starts
- **THEN** the old classification record does not satisfy the new execution's `requires`
- **AND** classification runs again

#### Scenario: Evidence from prior execution does not satisfy exit

- **WHEN** a previous visual-review execution recorded `user_evidence:user-reviewed-artifact`
- **AND** a new execution reaches the same node ID
- **THEN** the prior evidence does not satisfy the new node exit

#### Scenario: Starting a new execution preserves system evidence only

- **WHEN** a completed controller execution and current `header-review` record exist
- **AND** `startPlaybook` begins another execution
- **THEN** prior controller records are removed from the active working set
- **AND** `header-review` remains available under its independent freshness contract

### Requirement: Gate status writes and heals enforce the catalog

Content and visual gate status SHALL be one of `pending`, `approved`, or `waived`. `setGate` SHALL reject any other value. State heal SHALL normalize invalid persisted gate values to `pending` and preserve a diagnostic note rather than treating an unknown value as approval.

#### Scenario: Invalid gate write is rejected

- **WHEN** a caller invokes `setGate(state, 'visual', 'done')`
- **THEN** the API throws and leaves the gate unchanged

#### Scenario: Invalid persisted gate blocks production

- **WHEN** a legacy state contains `visual: yes`
- **THEN** heal normalizes it to `pending`
- **AND** production remains blocked until explicit approval or waiver
