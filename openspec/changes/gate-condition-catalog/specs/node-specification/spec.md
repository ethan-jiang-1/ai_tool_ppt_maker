## ADDED Requirements

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

`_state/ 目录` SHALL include a `playbook_stack` field (array of `{playbook, current_node}`). `switchPlaybook()` SHALL push the current position onto the stack. `resumePlaybook()` SHALL pop and restore position.

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


### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL support a `state` subcommand: `state <runDir>` (human-readable summary), `state <runDir> --json` (JSON output), `state <runDir> --check-gates` (gate validation with exit 0/1).

#### Scenario: Agent checks state before Stage 2

- **WHEN** Agent runs `node scripts/ppt_flow.mjs state <runDir> --check-gates`
- **THEN** it exits 0 if content and visual gates are not pending
- **AND** exits 1 with message if any gate is still pending

### Requirement: History log is append-only and optional

`appendHistory(deckDir, event)` SHALL atomically append one JSON line to `_state/history.jsonl`. `readHistory(deckDir)` SHALL return all valid events, skipping damaged lines. The history log SHALL NOT participate in any automatic recovery logic——it is for LLM reference only.

#### Scenario: history survives crash

- **WHEN** process crashes mid-write to `history.jsonl`
- **THEN** the last line may be truncated but preceding lines are intact
- **AND** `readHistory` skips the damaged line

### Requirement: JS is simple, LLM handles recovery

`readState(deckDir)` SHALL return `{ corrupted: true }` when `state.yaml` is unreadable. It SHALL NOT attempt automatic recovery. The LLM SHALL read `history.jsonl` to understand what happened and manually repair `state.yaml`. No JS function SHALL throw——errors SHALL be surfaced as structured return values.
