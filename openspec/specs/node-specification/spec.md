## Purpose

Define the Node — the atomic unit of playbook execution — and its governing constitution at `charter/NODE-SPEC.md`: node frontmatter (entry/exit gates), the run-bundle state model (`_state/state.yaml` as the single truth source plus the append-only `_state/history.jsonl`), the five node statuses, shared nodes, the gate-conditions catalog, and the `scripts/lib/state.mjs` API (the CONDITIONS registry, `checkEntry`/`checkExit`, atomic writes, and the query/manipulation functions). This capability guarantees that any agent can deterministically decide whether a node may start or complete, resume an in-progress run from persisted state, and switch between playbooks without losing its position.
## Requirements
### Requirement: NODE-SPEC.md exists in charter directory

`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` SHALL exist as the constitutional specification for Nodes, defining their anatomy, state schema, and execution rules.

#### Scenario: Developer reads node specification

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they understand the Node frontmatter structure, state schema, and how playbooks are organized

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

### Requirement: State file is YAML at run bundle root

Every run bundle SHALL contain a `_state/` directory with two files: `state.yaml` (single truth source for **execution pointer**, atomically written) and `history.jsonl` (append-only reference log). `state.yaml` SHALL track: active playbook, current node, per-node status, gate decisions, playbook_stack, and deck metadata. Per-node records MAY include optional string fields `waiting_for` (short machine-oriented wait reason, e.g. `user:approve-visual` or `user:review-style-master`) and `note` (human-readable). Whole-workflow **where-am-I** answers MAY compose `_state` with artifact status from `ppt_flow status`; that composition SHALL NOT invent a second persisted phase file. `history.jsonl` SHALL NOT participate in any automatic recovery logic——it is for LLM reference only. `readState(deckDir)` reads `_state/state.yaml`. `appendHistory(deckDir, event)` appends to `_state/history.jsonl`. `readHistory(deckDir)` returns all events.

#### Scenario: Agent reads state to resume

- **WHEN** Agent opens a run bundle that was previously in progress
- **THEN** reading `_state/state.yaml` reveals which playbook is active, which node is current, and which nodes are completed
- **AND** Agent can resume from the current_node

#### Scenario: CLI reads state before Stage 2

- **WHEN** `ppt_flow.mjs` gates Stage 2 (image generation) via `state <runDir> --check-gates`
- **THEN** it reads `_state/state.yaml` to verify `gates.visual` is `approved` or `waived`
- **AND** if the gate is `pending`, the check exits non-zero and the pipeline refuses to run

#### Scenario: waiting_for records human block

- **WHEN** the agent is blocked waiting for the user to approve the visual gate
- **AND** it writes state for the current node
- **THEN** `nodes.<current_node>.waiting_for` is a non-empty string identifying the wait
- **AND** conversation-only memory of the wait is not treated as sufficient persistence

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

### Requirement: Shared nodes can be referenced by multiple playbooks

A node with `shared: true` in frontmatter SHALL be referenceable by multiple playbooks. Playbooks SHALL reference shared nodes via `includes: [<node-name>, ...]` rather than duplicating the node content.

#### Scenario: Two playbooks use the same classification node

- **WHEN** playbook `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** they both reference `includes: [classify-change]` rather than each containing a copy

### Requirement: Node body distinguishes MD steps from CLI steps

Each node body SHALL contain one or more compact step declarations using exactly `**Step N — MD**`, `**Step N — CLI**`, or `**Step N — GATE**`. Step numbers SHALL start at 1 and increase monotonically within the node. MD steps SHALL reference methodology without duplicating it; CLI steps SHALL include an exact command or API operation with placeholders; GATE steps SHALL describe the user decision and persisted evidence/gate update. Mixed labels such as `CLI/State` SHALL be split into separate canonical steps.

#### Scenario: Agent reads a node with mixed step types

- **WHEN** Agent reads a node containing creative work, a script invocation, and a user review
- **THEN** the body uses distinct MD, CLI, and GATE steps in order
- **AND** the validator can associate those steps with the preceding YAML declaration

#### Scenario: Node body has no executable steps

- **WHEN** a node declaration is followed by no canonical step before the next node
- **THEN** playbook validation fails and names the node

### Requirement: Gate Conditions Catalog is defined in NODE-SPEC.md

`charter/NODE-SPEC.md` SHALL contain a Gate Conditions Catalog listing every valid deterministic condition and parameterized condition family, its type, data source, and check logic. Every `entry`/`exit` condition in canonical node declarations SHALL use the catalog, including `evidence:<key>`, `user_evidence:<key>`, `decision_recorded`, `user_decision_recorded`, `node_evidence:<node>:<key>`, and `node_decision:<node>:<value>`. Free-form unknown tokens SHALL be invalid. The catalog SHALL state that `requires` is enforced separately as `node_done:<id>`, that current-node evidence/decision families are exit-only, and that cross-node evidence/decision conditions may reference only a declared required and completed upstream node in the same execution.

#### Scenario: Developer looks up a gate condition in the catalog

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

### Requirement: ctx parameter provides run bundle paths to conditions

`checkEntry` and `checkExit` SHALL accept a `ctx` parameter providing: `deckDir` (deck root), `runDir` (current version dir), and `frameworkDir` (PPTMAKER_FRAMEWORK root). FILESYSTEM conditions SHALL resolve paths relative to these directories.

#### Scenario: Condition resolves file path via ctx

- **WHEN** `checkEntry('authoring-slides', playbookDir, state, { deckDir, runDir })` is called
- **THEN** the `slide_specs_exists` condition checks `join(runDir, 'slide-specifications.md')`
- **AND** `visual_preset_seeded` checks `join(deckDir, '2_backbone/visual-style/color_palette.json')`

#### Scenario: Developer looks up a condition

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they see the complete conditions catalog with standard names

### Requirement: CONDITIONS registry is implemented in state.mjs

`scripts/lib/state.mjs` SHALL export a `CONDITIONS` object mapping each standard condition name to an executable check function. Parameterized conditions (e.g., `node_completed:<name>`) SHALL be supported via function factories.

#### Scenario: Condition is checked

- **WHEN** `CONDITIONS['run_bundle_exists'](state, ctx)` is called
- **THEN** it returns `true` if the deck directory exists on disk
- **AND** `false` otherwise

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

### Requirement: Playbook stack preserves position during switching

`_state/state.yaml` SHALL include a `playbook_stack` YAML array of `{playbook, current_node, execution_id, execution_started_at, controller_nodes}` objects, where `controller_nodes` is a deep snapshot of the parent execution's non-reserved node records. `writeState`/`readState` SHALL round-trip this field without changing its type. `switchPlaybook()` SHALL push the five-field snapshot, preserve top-level reserved system records, clear active controller records, and create a new execution context for the nested playbook. `resumePlaybook()` SHALL discard nested controller records, restore all five parent fields, and retain the latest reserved system records. Legacy stack entries without execution fields or snapshots SHALL be normalized during v1→v2 migration to a safe blocking snapshot rather than guessed from ambiguous flat records.

#### Scenario: Agent switches playbooks and returns

- **WHEN** Agent is in a create-deck execution, switches to iterate-style, finishes, and resumes
- **THEN** `resumePlaybook()` restores the original playbook, current node, execution ID, execution start time, and controller-node snapshot
- **AND** nested execution evidence does not replace parent execution evidence
- **AND** the popped stack entry is removed

#### Scenario: Empty playbook_stack survives write/read

- **WHEN** a state with `playbook_stack: []` is written and read
- **THEN** it remains an empty array
- **AND** switch can push a five-field entry with an object snapshot

#### Scenario: Non-empty playbook_stack survives write/read

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

#### Scenario: Crash during write does not corrupt state

- **WHEN** the process stops after writing the temp file but before rename
- **THEN** the previous `state.yaml` remains complete
- **AND** the temp sibling is ignored during the next read

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

### Requirement: State API provides complete manipulation interface

`state.mjs` SHALL export manipulation functions: `setNodeStatus(state, name, status, extra)`, `resetNode(state, name)`, `skipNode(state, name, reason)`, `setGate(state, name, status)`, `switchPlaybook(state, newPlaybook)`, `startPlaybook(state, playbook)`, `createInitialState(deckName, deckType, style)`.

#### Scenario: Rerun resets a node

- **WHEN** Agent calls `resetNode(state, 'seed-topics')` during a rerun cycle
- **THEN** `seed-topics` status returns to `pending`
- **AND** previously stored extra fields (topic_count) are cleared

### Requirement: History log is append-only

`appendHistory(deckDir, event)` SHALL atomically append one JSON line to `_state/history.jsonl`. `readHistory(deckDir)` SHALL return all valid JSON events, skipping lines that fail to parse. The history log SHALL NOT participate in automatic recovery——it is for LLM reference only.

#### Scenario: History survives crash

- **WHEN** process crashes mid-write to `history.jsonl`
- **THEN** the last line may be truncated but preceding lines are intact
- **AND** `readHistory` skips the damaged line

### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL support a `state` subcommand registered inside `main()` on the same `Command` instance used by `parseAsync`, before parsing: `state <runDir>` (human-readable summary), `state <runDir> --json` (JSON state dump on success), `state <runDir> --check-gates` (gate validation). On success, `--check-gates` exits `0`. On pending gates (any required gate not in `approved`/`waived` per `isGateApproved`), exit `1` **and** emit the CLI failure JSON envelope (`code` `GATE_BLOCKED`) as the last non-empty line of stderr per `cli-surface`. The `state` command SHALL call `readState` with **default heal** so recoverable format/schema defects do not surface as corruption. Exit `2` with envelope `code` `STATE_CORRUPTED` SHALL occur only when state remains unusable after the configured read path (for example explicit `heal: false` diagnostic reads that return `{corrupted:true}`, or an implementation failure to seed a usable state) — not when heal successfully rewrote or normalized the file.

Human-readable and `--json` success output SHALL include a **resume card**: `playbook`, `current_node`, current node `status`, optional `waiting_for` / `note`, `_state` gates, `playbook_stack` (or empty), a non-empty `workflow_summary`, and a non-empty `suggested_next` string derived from position (and optional status snapshot). The card SHALL NOT invent a new top-level CLI command. Deck path resolution SHALL use `deckRoot`.

#### Scenario: Agent checks state before Stage 2 — gates OK

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir> --check-gates`
- **AND** content and visual gates are approved or waived
- **THEN** it exits `0`

#### Scenario: Agent checks state before Stage 2 — gates blocked

- **WHEN** Agent runs `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state <runDir> --check-gates`
- **AND** any required gate is still pending
- **THEN** it exits `1`
- **AND** the last non-empty line of stderr is JSON with `ok: false` and `code` `GATE_BLOCKED`
- **AND** `hint` names which gate(s) are pending

#### Scenario: Healable dirty state is not STATE_CORRUPTED

- **WHEN** `state.yaml` has a healable defect (for example `playbook_stack` as `{}`)
- **AND** Agent runs `ppt_flow state <runDir>` (default heal)
- **THEN** the command does not exit `2` with `STATE_CORRUPTED`
- **AND** a usable state summary or JSON is produced

#### Scenario: Corrupted state file only when unusable

- **WHEN** the state read path returns `{corrupted:true}` (strict/diagnostic or unrecovered failure)
- **AND** that result is used by the `state` command
- **THEN** exit is `2`
- **AND** the last non-empty line of stderr is JSON with `code` `STATE_CORRUPTED`

#### Scenario: state --json includes resume card fields

- **WHEN** Agent runs `ppt_flow state <runDir> --json` on a usable in-progress deck
- **THEN** the JSON includes `playbook`, `current_node`, `workflow_summary`, and `suggested_next`
- **AND** gates and playbook_stack are present

### Requirement: Node transitions persist via writeState

Whenever a node status transitions to `in_progress`, `completed`, `failed`, or `skipped`, the agent SHALL persist via `setNodeStatus` (or equivalent API) and `writeState` before relying on chat memory. Leaving a human-wait SHALL clear or update `waiting_for` accordingly. Agents SHALL NOT treat an unpersisted node transition as durable across sessions. Schema heal / round-trip SHALL preserve optional `waiting_for` and `note` fields when present on node records.

#### Scenario: Entering a node writes in_progress

- **WHEN** Agent starts executing a node whose prior status was `pending`
- **THEN** `_state/state.yaml` records that node as `in_progress` and updates `current_node` before long work proceeds

#### Scenario: Completing a node writes completed

- **WHEN** Agent finishes a node and exit conditions are met
- **THEN** `writeState` records `completed` (and clears `waiting_for` when present) before the next node starts

#### Scenario: waiting_for survives heal round-trip

- **WHEN** a state file has `nodes.review-gate.waiting_for` set
- **AND** `readState` with default heal runs
- **THEN** the returned state still includes that `waiting_for` value

### Requirement: CLI ⇔ MD failure protocol uses JSON envelopes

Playbook CLI steps that invoke `ppt_flow.mjs` SHALL treat a non-zero exit as actionable only when paired with the JSON failure envelope on stderr (last non-empty line), as defined by `cli-surface` and `charter/CONSTITUTION.md`. MD Controllers SHALL branch on `code` and surface `message`/`hint` to the user or attempt repair — they SHALL NOT depend solely on matching prose such as `Fatal error:`.

#### Scenario: MD Controller reads a ppt_flow failure

- **WHEN** a playbook CLI step runs `ppt_flow.mjs` and it exits non-zero
- **THEN** the controller parses the last non-empty stderr line as JSON
- **AND** uses `code` + `hint` to decide the next repair action

### Requirement: state.yaml carries a discoverability header on every write

`writeState(deckDir, state)` SHALL write `state.yaml` as a UTF-8 file whose leading lines are `#` comments that identify the file as playbook execution state and point readers to `charter/NODE-SPEC.md` and `scripts/lib/state.mjs` (and MAY mention `ppt_flow state`). The header text SHALL be defined once in `state.mjs` and SHALL be re-emitted on every successful write so it is not lost when the YAML body is regenerated from the in-memory object. The YAML parse path used by `readState` SHALL ignore `#` comment lines (library parse and/or strip-before-parse).

#### Scenario: Header survives rewrite

- **WHEN** `writeState` is called twice on the same deck with updated state
- **THEN** the resulting `state.yaml` still begins with a `#` comment header
- **AND** `readState` still returns the expected playbook fields

### Requirement: state.mjs SAFETY — heal before blaming the user

Production state I/O SHALL treat MD/Agent as the fuzzy producer and `state.mjs` as the precise repair layer. `readState(deckDir)` SHALL default to `heal: true` and return a **usable** state object. After tolerant YAML parse, the implementation SHALL run schema healing (at minimum: ensure `nodes` and `gates` are objects, ensure `playbook_stack` is an array of plain objects with string `playbook` / `current_node`). When healing changes semantics, or when parse recovered despite document errors, `readState` SHALL atomically rewrite canonical `state.yaml` via library stringify (and MAY append a `history.jsonl` event such as `state_healed`). Pure whitespace/key-order drift against stringify without semantic change SHOULD NOT force a rewrite on every read. When YAML cannot yield a usable object, `readState` SHALL rename the broken file aside (`state.yaml.broken.<timestamp>`), seed a default usable state (preserving `deck.name` when recoverable), write it, and return that state. Returning `{corrupted:true}` SHALL NOT be the default novice-facing path; `heal: false` MAY expose corruption for diagnostics. MD Controllers SHALL treat state format problems as **agent-owned repairs**: heal/rewrite first, optionally one short sentence to the user, and SHALL NOT present raw YAML parse errors as the user's next action.

#### Scenario: Malformed YAML is backed up and replaced

- **WHEN** `_state/state.yaml` contains unparseable YAML
- **AND** `readState` is called with default heal behavior
- **THEN** a broken-file backup exists beside the state path
- **AND** a usable state object is returned (not `{corrupted:true}` as the primary result)
- **AND** a fresh `state.yaml` has been written

#### Scenario: Agent does not dump YAML errors on a novice

- **WHEN** an MD Controller discovers invalid or healed state during playbook execution
- **THEN** it continues after heal/rewrite (or invokes the heal path)
- **AND** it does not instruct the user to manually edit YAML syntax as the primary next step

### Requirement: State YAML parse/stringify uses a maintained YAML library

`scripts/lib/state.mjs` SHALL use the npm `yaml` package for production `_state/state.yaml` I/O. **Read** SHALL use tolerant `parseDocument` options (at minimum `strict: false`, and duplicate keys not fatal) then schema healing — analogous in intent to JSON `jsonrepair`. **Write** SHALL emit only `stringify` output plus the existing `#` header. Hand-written mini-YAML SHALL NOT remain the authority for production state I/O.

#### Scenario: Round-trip encoding matches stack semantics

- **WHEN** `writeState` serializes a non-empty `playbook_stack` and `readState` parses the file
- **THEN** the parsed value is an array of objects with `playbook` and `current_node`
- **AND** no entry is the string `"[object Object]"`

#### Scenario: Dirty read is written back clean

- **WHEN** `state.yaml` parses but needs schema healing (for example `playbook_stack` as `{}`)
- **AND** `readState` runs with default heal
- **THEN** the returned state is usable
- **AND** the on-disk `state.yaml` body is rewritten as canonical YAML from library stringify

### Requirement: writeState ensures _state README exists

`state.mjs` SHALL export the canonical `_state/README.md` body used by bundle scaffolding. Before or as part of writing `state.yaml`, `writeState` SHALL ensure `_state/README.md` exists (create if absent) using that same body. `state.mjs` SHALL NOT import `bundle_layout.mjs`.

#### Scenario: Legacy deck gains README on next write

- **WHEN** a deck has `_state/state.yaml` but no `_state/README.md`
- **AND** `writeState` runs
- **THEN** `_state/README.md` is created with the canonical discoverability content

#### Scenario: State module does not import bundle_layout

- **WHEN** a developer inspects `scripts/lib/state.mjs` imports
- **THEN** it does not import `bundle_layout.mjs`

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

- **WHEN** legacy state has `playbook:` set to a playbook whose `NODE_ALIASES` entry maps legacy ID `⟨legacy-id⟩` to canonical ID `⟨canonical-id⟩`
- **AND** `current_node` equals `⟨legacy-id⟩`
- **THEN** migration maps `current_node` to `⟨canonical-id⟩`
- **AND** the same legacy ID under a different playbook maps to that playbook's own canonical ID
- **AND** the migration is idempotent on repeated reads

#### Scenario: Playbook-scoped alias migration is comprehensive and idempotent

- **WHEN** legacy state has `playbook:` set to a playbook whose `NODE_ALIASES` entry maps one or more legacy IDs to canonical IDs
- **THEN** `readState(deckDir)` returns a healed state where:
  - **Pointer migration**: `current_node` matching a legacy ID is migrated to the canonical ID, regardless of whether a corresponding `nodes` record exists (pointer-only case); the migrated pointer survives subsequent active-working-set restriction because the canonical ID is a declared controller node
  - **Record key migration**: every `nodes` key matching a legacy ID is migrated to its canonical name using `mergeMissing` (canonical fields win; fields present only in legacy are preserved; execution ID is normalized to the owning execution; timestamps follow existing healer rules)
  - **Stack migration**: every `playbook_stack` entry whose playbook has declared aliases has its `current_node` migrated (pointer-only) and its `controller_nodes` keys migrated (record key, same `mergeMissing` rules)
  - **Diagnostics**: `state.diagnostics` contains at least one migration message referencing the playbook whose aliases were applied
- **AND** entries whose playbook has no declared aliases are left unchanged
- **AND** the migration is idempotent on repeated reads

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

### Requirement: MD consumes CLI diagnostics without guessing or shell interpretation

The CLI-to-MD consumer protocol SHALL reference producer fields and emission rules owned by capability `cli-surface`; it SHALL NOT redefine them. MD SHALL treat every non-zero CLI return as process status plus the final stderr envelope, use required top-level fields as legacy summary, and use diagnostic data for structured action only when its version is supported and the complete nested object validates against that version.

If a process ends non-zero without a valid final envelope, MD SHALL treat the producer as externally interrupted or crashed and SHALL NOT infer category, lineage, or recovery from partial stdout/stderr. A supported `interrupted` diagnostic means execution stopped, not that source or framework code is defective.

MD SHALL NOT invent omitted paths, ids, lines, causes, invocations, approvals, or issue results. It SHALL interpret `diagnostic.next`: automatic actions may proceed only within MD authority, while `requires_human:true` SHALL stop for a genuine human decision. If `next.invocation` is followed programmatically, MD SHALL pass `program` and `args` directly without a shell; it SHALL NOT concatenate them into executable shell text.

#### Scenario: MD follows an automatic invocation safely

- **WHEN** v1 evidence has `next.requires_human:false` and a structured invocation
- **THEN** MD uses supplied causal evidence without expanding affected scope
- **AND** executes program/args with argument boundaries preserved and shell disabled

#### Scenario: MD receives a human decision gate

- **WHEN** v1 evidence has `next.requires_human:true`
- **THEN** MD presents the named decision/evidence to the human
- **AND** does not treat default or invocation as fabricated approval

#### Scenario: Process returns no valid envelope

- **WHEN** process status is non-zero but no valid final envelope exists
- **THEN** MD reports an external interruption/crash boundary
- **AND** does not promote partial output into causal evidence

### Requirement: MD follows source ownership, aggregation, and delegation semantics

MD SHALL interpret lineage as ordered evidence from editable origin toward the observed artifact. A derived artifact is not thereby an edit target; MD SHALL prefer diagnostic source and `next.inspect`, treat inspect locators as read targets rather than edit permission, and SHALL NOT hand-edit run-bundle `_generated/`. Each retained issue is a separate fact; `omitted_count` or `truncated` means evidence is incomplete. For parent-wrapped failures, parent code/where/next are control authority while preserved child subject/source/reason/lineage/issues are causal evidence; MD SHALL NOT search for a second child envelope or follow a discarded child recovery action.

#### Scenario: Failure is observed in a generated artifact

- **WHEN** lineage names a missing, stale, ambiguous, or invalid `_generated/` artifact
- **THEN** MD follows the supplied source, prerequisite Stage, or rerun action
- **AND** does not patch the generated file

#### Scenario: Aggregate evidence is truncated

- **WHEN** a diagnostic has retained issues plus omitted/truncated metadata
- **THEN** MD handles listed issues
- **AND** does not assume unlisted issues passed

#### Scenario: Parent action and child evidence differ

- **WHEN** child evidence identifies a Stage 2 slide but parent next action requires pilot review
- **THEN** MD uses child evidence to understand cause
- **AND** follows parent control action rather than rerunning the child directly

### Requirement: Runtime Agents discover the consumer contract from generated run-bundle controls

An Agent entering a newly initialized run bundle SHALL encounter a generated root `AGENTS.md`/`CLAUDE.md` route to `deck-guide.md`. The guide SHALL explain the consumer essentials without referencing repo-only OpenSpec paths: parse the final failure envelope, use supported structured `diagnostic.next`, preserve invocation argument boundaries, stop when `requires_human` is true, do not guess omitted lineage, and never hand-edit `_generated/`.

Repository-maintenance discovery for MD implementation SHALL also be present in root `AGENTS.md` and short headers of `scripts/lib/md_controller_reader.mjs` and `state.mjs`, pointing to `node-specification` and active deltas without duplicating field schema.

#### Scenario: New run bundle receives a CLI failure

- **WHEN** its runtime Agent follows generated entry guidance
- **THEN** it can act on a supported diagnostic without reading repository OpenSpec files
- **AND** it stops for human-owned decisions and preserves source/generated ownership

#### Scenario: Coding Agent changes MD consumption

- **WHEN** a repository-maintenance Agent edits MD-controller/state consumption behavior
- **THEN** root and code-adjacent instructions route it to `node-specification` plus active deltas
