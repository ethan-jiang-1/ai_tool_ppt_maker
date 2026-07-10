## ADDED Requirements

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

Every run bundle SHALL contain a `_state/` directory with two files: `state.yaml` (single truth source, atomically written) and `history.jsonl` (append-only reference log). `state.yaml` SHALL track: active playbook, current node, per-node status, gate decisions, playbook_stack, and deck metadata. `history.jsonl` SHALL NOT participate in any automatic recovery logic——it is for LLM reference only. `readState(deckDir)` reads `_state/state.yaml`. `appendHistory(deckDir, event)` appends to `_state/history.jsonl`. `readHistory(deckDir)` returns all events.

#### Scenario: Agent reads state to resume

- **WHEN** Agent opens a run bundle that was previously in progress
- **THEN** reading `_state/state.yaml` reveals which playbook is active, which node is current, and which nodes are completed
- **AND** Agent can resume from the current_node

#### Scenario: CLI reads state before Stage 2

- **WHEN** `ppt_flow.mjs` gates Stage 2 (image generation) via `state <runDir> --check-gates`
- **THEN** it reads `_state/state.yaml` to verify `gates.visual` is `approved` or `waived`
- **AND** if the gate is `pending`, the check exits non-zero and the pipeline refuses to run

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

`_state/state.yaml` SHALL include a `playbook_stack` field (array of `{playbook, current_node}`). `switchPlaybook()` SHALL push the current position onto the stack. `resumePlaybook()` SHALL pop and restore position.

#### Scenario: Agent switches playbooks and returns

- **WHEN** Agent is at `hitl2` in `create-deck`, switches to `edit-text`, finishes, and resumes
- **THEN** `resumePlaybook()` restores `playbook: create-deck`, `current_node: hitl2`
- **AND** `playbook_stack` is empty after resume

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

`scripts/ppt_flow.mjs` SHALL support a `state` subcommand: `state <runDir>` (human-readable summary), `state <runDir> --json` (JSON output), `state <runDir> --check-gates` (gate validation with exit 0/1).

#### Scenario: Agent checks state before Stage 2

- **WHEN** Agent runs `node scripts/ppt_flow.mjs state <runDir> --check-gates`
- **THEN** it exits 0 if content and visual gates are not pending
- **AND** exits 1 with message if any gate is still pending
