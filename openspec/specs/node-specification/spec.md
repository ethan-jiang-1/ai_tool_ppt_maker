## Purpose

Define the Node — the atomic unit of playbook execution — and its governing constitution at `charter/NODE-SPEC.md`: node frontmatter (entry/exit gates), the run-bundle state model (`_state/state.yaml` as the single truth source plus the append-only `_state/history.jsonl`), the five node statuses, shared nodes, the gate-conditions catalog, and the `scripts/lib/state.mjs` API (the CONDITIONS registry, `checkEntry`/`checkExit`, atomic writes, and the query/manipulation functions). This capability guarantees that any agent can deterministically decide whether a node may start or complete, resume an in-progress run from persisted state, and switch between playbooks without losing its position.

## Requirements

### Requirement: NODE-SPEC.md exists in charter directory

`PPTMAKER_FRAMEWORK/charter/NODE-SPEC.md` SHALL exist as the constitutional specification for Nodes, defining their anatomy, state schema, and execution rules.

#### Scenario: Developer reads node specification

- **WHEN** a developer opens `charter/NODE-SPEC.md`
- **THEN** they understand the Node frontmatter structure, state schema, and how playbooks are organized

### Requirement: Node frontmatter defines entry and exit gates

Every node SHALL have YAML frontmatter with at minimum: `node` (kebab-case name), `entry` (list of conditions that must be true before starting), and `exit` (list of conditions that must be true before marking completed).

#### Scenario: Agent checks entry gate before executing a node

- **WHEN** Agent begins executing node `wave0` in playbook `create-deck`
- **THEN** it verifies all `entry` conditions are met
- **AND** if any condition fails (e.g., `node_completed:seed-topics` is false), Agent reports the missing condition and does NOT proceed

#### Scenario: Agent checks exit gate before marking node complete

- **WHEN** Agent finishes the steps in node `wave0`
- **THEN** it verifies all `exit` conditions are met
- **AND** if any condition fails, Agent stays in the node until conditions are satisfied

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

A node's status SHALL be one of: `pending` (not yet started), `in_progress` (currently executing), `completed` (all exit conditions met), `skipped` (explicitly bypassed by user decision), or `failed` (blocked, requires intervention).

#### Scenario: Node transitions through statuses

- **WHEN** Agent starts a node → status changes from `pending` to `in_progress`
- **WHEN** Agent completes all steps and exit conditions → status changes to `completed`
- **WHEN** user explicitly says "skip this" → status changes to `skipped`

### Requirement: Shared nodes can be referenced by multiple playbooks

A node with `shared: true` in frontmatter SHALL be referenceable by multiple playbooks. Playbooks SHALL reference shared nodes via `includes: [<node-name>, ...]` rather than duplicating the node content.

#### Scenario: Two playbooks use the same classification node

- **WHEN** playbook `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** they both reference `includes: [classify-change]` rather than each containing a copy

### Requirement: Node body distinguishes MD steps from CLI steps

Each node body SHALL use `## Step N — MD` for Agent-executed instructions and `## Step N — CLI` for script invocations. MD steps SHALL reference methodology files in `workflow/` without duplicating their content. CLI steps SHALL include the exact command with parameter placeholders.

#### Scenario: Agent reads a node with mixed step types

- **WHEN** Agent reads node `wave0`
- **THEN** MD steps point to `workflow/02-content/` files for methodology
- **AND** CLI steps specify `node scripts/unified_pipeline.mjs --stage 1`

### Requirement: Gate Conditions Catalog is defined in NODE-SPEC.md

`charter/NODE-SPEC.md` SHALL contain a Gate Conditions Catalog section listing every valid gate condition name, its type (FILESYSTEM/STATE/USER), its data source (exact file path within run bundle, or state field path, or user decision field), and its check logic. All playbook frontmatter entry/exit conditions SHALL use names from this catalog.

#### Scenario: Developer looks up a gate condition in the catalog

- **WHEN** a developer opens the Gate Conditions Catalog in `charter/NODE-SPEC.md`
- **THEN** each condition lists its name, type (FILESYSTEM / STATE / USER), data source, and check logic
- **AND** every entry/exit condition used in playbook frontmatter appears by name in the catalog

### Requirement: ctx parameter provides run bundle paths to conditions

`checkEntry` and `checkExit` SHALL accept a `ctx` parameter providing: `deckDir` (deck root), `runDir` (current version dir), and `frameworkDir` (PPTMAKER_FRAMEWORK root). FILESYSTEM conditions SHALL resolve paths relative to these directories.

#### Scenario: Condition resolves file path via ctx

- **WHEN** `checkEntry('wave0', playbookDir, state, { deckDir, runDir })` is called
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

`checkEntry(nodeName, playbookDir, state, ctx)` SHALL parse the playbook MD file, extract the entry conditions from the node's frontmatter, resolve each against the CONDITIONS registry, and return `{ pass: boolean, missing: string[], unknown: string[] }`. Conditions not found in the catalog SHALL appear in the `unknown` array.

#### Scenario: Entry gate fails with missing conditions

- **WHEN** `checkEntry('wave0', playbookDir, state)` is called and `seed-topics` is pending
- **THEN** it returns `{ pass: false, missing: ['node_completed:seed-topics'], unknown: [] }`

#### Scenario: Unknown condition returned for manual judgment

- **WHEN** a condition name is not in the catalog (e.g., `wave0_evidence_indexed`)
- **THEN** it appears in the `unknown` array
- **AND** the Agent or test can decide whether to pass or fail based on context

### Requirement: checkExit validates exit conditions

`checkExit(nodeName, playbookDir, state, ctx)` SHALL work identically to `checkEntry` but parse the `exit` field from the node's frontmatter.

#### Scenario: Exit gate passes when conditions met

- **WHEN** wave0 exit conditions are satisfied
- **THEN** `checkExit('wave0', playbookDir, state)` returns `{ pass: true }`

### Requirement: node_done condition accepts completed or skipped

The catalog SHALL include a `node_done:<name>` condition that returns true when the node status is `completed` OR `skipped`. This condition SHALL be used in `requires` chains so skipped nodes do NOT block downstream nodes.

#### Scenario: Skipped node does not block downstream

- **WHEN** node `hitl1` is `skipped` and `checkEntry` for `setup` includes `node_done:hitl1`
- **THEN** the condition passes
- **AND** setup can proceed

### Requirement: Playbook stack preserves position during switching

`_state/state.yaml` SHALL include a `playbook_stack` field that is a **YAML array** of `{playbook, current_node}` objects. `writeState` / `readState` SHALL round-trip this field without changing its type: an empty stack SHALL remain an empty array (not an object), and a non-empty stack SHALL preserve each entry's `playbook` and `current_node` strings. `switchPlaybook()` SHALL push the current position onto the stack. `resumePlaybook()` SHALL pop and restore position. If a legacy file has a non-array `playbook_stack` (for example `{}`), the read/heal path and/or the switch/resume helpers SHALL normalize it to an empty array before use so `.push` / `.pop` do not throw.

#### Scenario: Agent switches playbooks and returns

- **WHEN** Agent is at `hitl2` in `create-deck`, switches to `edit-text`, finishes, and resumes
- **THEN** `resumePlaybook()` restores `playbook: create-deck`, `current_node: hitl2`
- **AND** `playbook_stack` is empty after resume

#### Scenario: Empty playbook_stack survives write/read

- **WHEN** a state with `playbook_stack: []` is written with `writeState` and read back with `readState`
- **THEN** `playbook_stack` is an array of length 0
- **AND** `switchPlaybook` can push without throwing

#### Scenario: Non-empty playbook_stack survives write/read

- **WHEN** a state whose stack contains `{playbook: "create-deck", current_node: "setup"}` is written and read back
- **THEN** `playbook_stack` is an array of length 1
- **AND** the entry's `playbook` and `current_node` match what was written

#### Scenario: Legacy non-array stack is normalized

- **WHEN** `state.yaml` has a non-array `playbook_stack` (for example an empty mapping)
- **THEN** after `readState` (default heal) the in-memory `playbook_stack` is an array
- **AND** `switchPlaybook` does not throw `push is not a function`

### Requirement: State writes are atomic

`writeState` SHALL write to a temporary file first, then rename to the target path. This SHALL prevent partial-write corruption on crash.

#### Scenario: Crash during write does not corrupt state

- **WHEN** the process crashes during `writeState`
- **THEN** the target YAML file is either the complete old version or the complete new version
- **AND** never a partial file

### Requirement: State API provides complete query interface

`state.mjs` SHALL export query functions: `getNodeStatus(state, name)`, `getCurrentNode(state)`, `getCompletedNodes(state)`, `getPendingNodes(state)`, `isNodeCompleted(state, name)`, `isPlaybookComplete(state)`, `getGateStatus(state, name)`, `isGateApproved(state, name)`, `getMissingConditions(nodeName, playbookDir, state, ctx)`.

#### Scenario: Agent queries current position

- **WHEN** Agent calls `getCurrentNode(state)` on a state with `current_node: wave0`
- **THEN** it returns `'wave0'`

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
