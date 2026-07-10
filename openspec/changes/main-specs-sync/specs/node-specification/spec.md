## MODIFIED Requirements

### Requirement: State files are in _state/ directory

Every run bundle SHALL contain a `_state/` directory with `state.yaml` (single truth source) and `history.jsonl` (append-only reference log). `state.yaml` SHALL be readable and writable by both MD-side (Agent) and CLI-side (.mjs scripts). It SHALL track: active playbook, current node, per-node status, gate decisions, playbook_stack, and deck metadata. `history.jsonl` SHALL NOT participate in any automatic recovery logic——it is for LLM reference only.

#### Scenario: Agent reads state to resume after interruption

- **WHEN** Agent opens a run bundle that was previously in progress
- **THEN** reading `_state/state.yaml` reveals which playbook is active, which node is current, and which nodes are completed
- **AND** Agent can resume from the current_node

#### Scenario: CLI script reads state before executing

- **WHEN** `unified_pipeline.mjs` is about to run Stage 2
- **THEN** it reads `_state/state.yaml` to verify `visual_gate` is `approved` or `waived`
- **AND** if the gate is `pending`, the script refuses to run

### Requirement: checkEntry and checkExit return structured results

`checkEntry(nodeName, playbookDir, state, ctx)` and `checkExit(nodeName, playbookDir, state, ctx)` SHALL return `{ pass: boolean, missing: string[], unknown: string[] }`. Conditions not found in the Gate Conditions Catalog SHALL appear in the `unknown` array.

#### Scenario: Entry gate fails with missing and unknown

- **WHEN** `checkEntry('wave0', playbookDir, state)` is called with `seed-topics` still pending and a custom condition not in the catalog
- **THEN** it returns `{ pass: false, missing: ['node_completed:seed-topics'], unknown: ['custom:wave0_sources_collected'] }`

### Requirement: History log is append-only

`appendHistory(deckDir, event)` SHALL atomically append one JSON line to `_state/history.jsonl`. `readHistory(deckDir)` SHALL return all valid events, skipping damaged lines.

### Requirement: node_done condition accepts completed or skipped

The Gate Conditions Catalog SHALL include `node_done:<name>` (true for `completed` OR `skipped`), used in `requires` chains so skipped nodes do NOT block downstream.
