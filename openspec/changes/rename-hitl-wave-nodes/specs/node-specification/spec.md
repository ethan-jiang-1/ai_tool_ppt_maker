## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates

Every registered node SHALL have one canonical YAML declaration with at minimum: `node` (globally unique kebab-case name), `lifecycle_phase` (`0`, `1`, `2`, `2.7`, `3`, or `4`), `method_module` (`00-setup`, `01-visual`, `02-content`, `03-prompts`, `04-production`, or `05-iteration`), `requires` (ordered node dependencies), `entry` (additional deterministic conditions that must be true before starting), and `exit` (conditions that must be true before marking completed). A routing GATE node SHALL additionally declare `decisions` as a non-empty list of unique allowed string values. An ordered playbook MAY declare nodes in fenced YAML blocks within its Markdown controller; a standalone shared node MAY declare the same schema in document frontmatter. The runtime parser and validator SHALL support exactly these forms and SHALL NOT discover nodes by substring search.

#### Scenario: Agent checks entry gate before executing a node

- **WHEN** Agent begins executing node `authoring-slides` in playbook `create-deck`
- **THEN** the parser resolves the exact `authoring-slides` declaration from the playbook index
- **AND** verifies all `requires` dependencies and explicit `entry` conditions
- **AND** if any check fails, Agent reports the missing condition and does NOT proceed

#### Scenario: Agent checks exit gate before marking node complete

- **WHEN** Agent finishes the steps in node `authoring-slides`
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

### Requirement: Node status has exactly five valid states

A node's status SHALL be one of: `pending` (not started), `in_progress` (currently executing), `completed` (all exit conditions met), `skipped` (explicitly bypassed by user decision), or `failed` (blocked and requiring intervention). `setNodeStatus` SHALL reject any other value. State heal SHALL normalize an invalid persisted value to `pending`, preserve a diagnostic note, and write the cleaned state. Transitioning a previously completed node to `in_progress` or `pending` SHALL remove its stale `completed` timestamp; completing a node SHALL remove fields that claim it remains failed.

#### Scenario: Invalid status write is rejected

- **WHEN** a caller invokes `setNodeStatus(state, 'authoring-slides', 'done')`
- **THEN** the API throws a validation error
- **AND** does not mutate the node record

#### Scenario: Node transitions through statuses

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

### Requirement: ctx parameter provides run bundle paths to conditions

`checkEntry` and `checkExit` SHALL accept a `ctx` parameter providing: `deckDir` (deck root), `runDir` (current version dir), and `frameworkDir` (PPTMAKER_FRAMEWORK root). FILESYSTEM conditions SHALL resolve paths relative to these directories.

#### Scenario: Condition resolves file path via ctx

- **WHEN** `checkEntry('authoring-slides', playbookDir, state, { deckDir, runDir })` is called
- **THEN** the `slide_specs_exists` condition checks `join(runDir, 'slide-specifications.md')`
- **AND** `visual_preset_seeded` checks `join(deckDir, '2_backbone/visual-style/color_palette.json')`

#### Scenario: Developer looks up a condition

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they see the complete conditions catalog with standard names

### Requirement: checkEntry validates entry conditions

`checkEntry(nodeName, playbookDir, state, ctx)` SHALL resolve the exact node declaration from the canonical playbook index, evaluate each `requires` dependency as `node_done:<id>` within the active `execution_id`, then evaluate explicit deterministic `entry` conditions. It SHALL return `{ pass: boolean, missing: string[], unknown: string[] }`. An absent, duplicated, invalid, or unknown-condition node SHALL NOT return `pass: true`. Current-node `evidence:`, `user_evidence:`, `decision_recorded`, and `user_decision_recorded` conditions SHALL be forbidden in entry lists; branch selection MAY use `node_evidence:<required-node>:<key>` or `node_decision:<required-node>:<value>`. Cross-node evidence and decisions SHALL additionally require the upstream node to be `completed`, not merely `skipped`.

#### Scenario: Entry gate fails with missing conditions

- **WHEN** `authoring-slides` declares `requires: [seed-topics]`
- **AND** `seed-topics` is neither completed nor skipped
- **THEN** `checkEntry('authoring-slides', ...)` returns `pass: false`
- **AND** `missing` includes `node_done:seed-topics`

#### Scenario: Unknown condition returned for manual judgment

- **WHEN** a node declaration contains a condition outside the canonical catalog
- **THEN** `checkEntry` returns that token in `unknown`
- **AND** returns `pass: false` so the declaration must be corrected rather than implicitly approved

#### Scenario: Embedded declaration is actually parsed

- **WHEN** a node is declared in a fenced YAML block inside a playbook controller
- **THEN** `checkEntry` evaluates that declaration's dependencies and entry conditions
- **AND** it does not return a vacuous pass because document frontmatter lacks `entry`

#### Scenario: Current-node evidence entry condition is rejected

- **WHEN** a node declares `entry: [user_evidence:user-approved]`
- **THEN** validation fails because current-node evidence cannot exist before the node starts

#### Scenario: Upstream decision selects a branch

- **WHEN** a readiness branch declares `entry: [node_decision:checkpoint-final-review:proceed]`
- **AND** required upstream node `checkpoint-final-review` completed after recording a typed user decision with value `proceed` in the current execution
- **THEN** the branch entry condition passes

### Requirement: checkExit validates exit conditions

`checkExit(nodeName, playbookDir, state, ctx)` SHALL resolve the same canonical node declaration as `checkEntry`, parse the `exit` field, and evaluate deterministic and typed persisted evidence conditions. It SHALL NOT mark an absent, duplicated, unparsed, or unknown-condition node as passed.

#### Scenario: Exit gate passes when conditions met

- **WHEN** authoring-slides deterministic exit conditions and required typed evidence are current in state
- **THEN** `checkExit('authoring-slides', ...)` returns `{ pass: true, missing: [], unknown: [] }`

#### Scenario: Missing artifact blocks exit

- **WHEN** a production node declares `pptx_generated` and no PPTX exists
- **THEN** `checkExit` returns `pass: false`
- **AND** `missing` includes `pptx_generated`

### Requirement: node_done condition accepts completed or skipped

The catalog SHALL include a `node_done:<name>` condition that returns true when the node status is `completed` OR `skipped`. This condition SHALL be used in `requires` chains so skipped nodes do NOT block downstream nodes.

#### Scenario: Skipped node does not block downstream

- **WHEN** node `checkpoint-intake` is `skipped` and `checkEntry` for `setup` includes `node_done:checkpoint-intake`
- **THEN** the condition passes
- **AND** setup can proceed

### Requirement: State API provides complete query interface

`state.mjs` SHALL export query functions: `getNodeStatus(state, name)`, `getCurrentNode(state)`, `getCompletedNodes(state, nodeIds?)`, `getPendingNodes(state, nodeIds?)`, `isNodeCompleted(state, name)`, `isPlaybookComplete(state, nodeIds?)`, `getGateStatus(state, name)`, `isGateApproved(state, name)`, and `getMissingConditions(nodeName, playbookDir, state, ctx)`. Node-status queries SHALL treat a missing or execution-mismatched controller record as `pending` for active execution checks. Completed, pending, and playbook-complete queries SHALL accept an optional canonical node-ID list from the active playbook index. When provided, absent/current-execution-mismatched records SHALL be treated as `pending`; reserved system records and nodes outside the supplied controller set SHALL not affect the result. Existing callers that omit the list SHALL retain backward-compatible record-only behavior over the active working set where explicitly documented.

#### Scenario: Agent queries current position

- **WHEN** Agent calls `getCurrentNode(state)` on a state with `current_node: authoring-slides`
- **THEN** it returns `authoring-slides`

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

- **WHEN** a node uses `node_decision:checkpoint-final-review:proceeed` but `checkpoint-final-review.decisions` contains only `proceed`, `repair`, and `redirect`
- **THEN** validation fails at the downstream condition
- **AND** names the upstream declaration and allowed values

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

#### Scenario: Playbook-scoped alias covers the full create-deck rename

- **WHEN** legacy state has `playbook: create-deck` and `current_node: hitl2`
- **AND** `nodes` contains keys `hitl1`, `hitl2`, `wave0`, `wave1`, `wave2`
- **THEN** `readState(deckDir)` returns a healed state where `current_node` is `checkpoint-final-review`
- **AND** all five node keys in `nodes` are mapped to their canonical names
- **AND** `state.diagnostics` contains at least one migration entry referencing the create-deck rename
- **AND** the migration is idempotent on repeated reads

#### Scenario: Pointer-only migration preserves current_node without a node record

- **WHEN** legacy state has `playbook: create-deck` and `current_node: hitl2`
- **AND** `nodes` does NOT contain a `hitl2` key
- **THEN** `readState(deckDir)` returns a healed state where `current_node` is `checkpoint-final-review`
- **AND** `current_node` is not cleared during active-working-set restriction
- **AND** the migration is idempotent on repeated reads

#### Scenario: Legacy and canonical keys coexist with canonical priority

- **WHEN** legacy state has `playbook: create-deck`
- **AND** `nodes` contains BOTH legacy key `wave0` (with `status: completed`, `extra_field: old-value`) AND canonical key `authoring-slides` (with `status: in_progress`)
- **THEN** `readState(deckDir)` returns a healed state where the canonical `authoring-slides` record has `status: in_progress` (canonical wins)
- **AND** `extra_field: old-value` is preserved from the legacy record (missing fields filled)
- **AND** the legacy `wave0` key is removed
- **AND** the canonical record's business fields (status, decision, evidence content) are preserved; execution ID is normalized to the owning active/stack execution per `validateState` rules; timestamps are cleaned per existing healer rules (incompatible fields removed, compatible timestamps preserved)
- **AND** a second heal produces identical state

#### Scenario: Playbook stack entries receive alias migration

- **WHEN** legacy state has `playbook_stack` containing an entry with `playbook: create-deck`
- **AND** that entry's `current_node` or `controller_nodes` keys reference old `hitl2` or `wave0` IDs
- **THEN** `readState(deckDir)` returns a healed state where those stack entry fields are migrated to canonical names
- **AND** `controller_nodes` keys are migrated alongside `current_node`
- **AND** entries whose playbook has no declared aliases are left unchanged
- **AND** the same collision and idempotency rules as top-level migration apply to stack entries

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
