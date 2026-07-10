## MODIFIED Requirements

### Requirement: State file is YAML at run bundle root

Every run bundle SHALL contain a `_state/` directory with two files: `state.yaml` (single truth source, atomically written) and `history.jsonl` (append-only reference log). `state.yaml` SHALL track: active playbook, current node, per-node status, gate decisions, playbook_stack, and deck metadata. `history.jsonl` SHALL NOT participate in any automatic recovery logic——it is for LLM reference only. `readState(deckDir)` reads `_state/state.yaml`. `appendHistory(deckDir, event)` appends to `_state/history.jsonl`. `readHistory(deckDir)` returns all events.

#### Scenario: Agent reads state to resume

- **WHEN** Agent opens a run bundle that was previously in progress
- **THEN** reading `_state/state.yaml` reveals which playbook is active, which node is current, and which nodes are completed
- **AND** Agent can resume from the current_node

#### Scenario: CLI reads state before Stage 2

- **WHEN** `unified_pipeline.mjs` is about to run Stage 2
- **THEN** it reads `_state/state.yaml` to verify `visual_gate` is `approved` or `waived`
- **AND** if the gate is `pending`, the script refuses to run

### Requirement: checkEntry validates entry conditions

`checkEntry(nodeName, playbookDir, state, ctx)` SHALL parse the playbook MD file, extract entry conditions from the node's frontmatter, resolve each against the CONDITIONS registry, and return `{ pass: boolean, missing: string[], unknown: string[] }`. Conditions not found in the Gate Conditions Catalog SHALL appear in the `unknown` array.

#### Scenario: Entry gate fails with missing and unknown

- **WHEN** `checkEntry('wave0', playbookDir, state)` is called with `seed-topics` pending and a custom condition `wave0_sources_collected` not in the catalog
- **THEN** it returns `{ pass: false, missing: ['node_completed:seed-topics'], unknown: ['custom:wave0_sources_collected'] }`

### Requirement: checkExit validates exit conditions

`checkExit(nodeName, playbookDir, state, ctx)` SHALL work identically to `checkEntry` but parse the `exit` field from the node's frontmatter, returning `{ pass: boolean, missing: string[], unknown: string[] }`.

## ADDED Requirements

### Requirement: History log is append-only

`appendHistory(deckDir, event)` SHALL atomically append one JSON line to `_state/history.jsonl`. `readHistory(deckDir)` SHALL return all valid JSON events, skipping lines that fail to parse. The history log SHALL NOT participate in automatic recovery——it is for LLM reference only.

#### Scenario: History survives crash

- **WHEN** process crashes mid-write to `history.jsonl`
- **THEN** the last line may be truncated but preceding lines are intact
- **AND** `readHistory` skips the damaged line

## REMOVED Requirements

### Requirement: State API handles corruption and absence gracefully

**Reason**: Superseded by simple design. `readState` returns `{ corrupted: true }` for bad YAML; LLM reads `history.jsonl` and manually repairs `state.yaml`. No automatic recovery.

**Migration**: Already implemented in `scripts/lib/state.mjs`.
