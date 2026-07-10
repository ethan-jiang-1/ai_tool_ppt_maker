## MODIFIED Requirements

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

### Requirement: Shared nodes can be referenced by multiple playbooks

A node with `shared: true` in frontmatter SHALL be referenceable by multiple playbooks. Playbooks SHALL reference shared nodes via `includes: [<node-name>, ...]` rather than duplicating the node content.

#### Scenario: Two playbooks use the same classification node

- **WHEN** playbook `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** they both reference `includes: [classify-change]` rather than each containing a copy

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
