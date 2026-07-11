## ADDED Requirements

### Requirement: state prints a where-am-I resume card

`ppt_flow.mjs state` human output and successful `--json` output SHALL present a **where-am-I** resume card for whole-session recovery (not playbook name alone): active `playbook`, `current_node`, current node status, optional `waiting_for` / `note`, `_state` gates, `playbook_stack` summary, a non-empty `workflow_summary` (short human-readable whole-workflow position), and `suggested_next`. The CLI SHALL resolve the deck root via `deckRoot(runDir)`. `workflow_summary` and `suggested_next` SHALL be derived heuristics and SHALL NOT mutate state. Prefer implementing card construction in `state.mjs` (e.g. `buildResumeCard`) so status can reuse it. The CLI command count remains **12**.

#### Scenario: Human state output names playbook and node

- **WHEN** Agent runs `ppt_flow.mjs state <runDir>` on an in-progress deck
- **THEN** stdout identifies the active playbook and current_node
- **AND** includes a workflow summary and suggested next action

#### Scenario: JSON state dump carries suggested_next and workflow_summary

- **WHEN** Agent runs `ppt_flow.mjs state <runDir> --json`
- **THEN** the JSON object includes non-empty `suggested_next` and `workflow_summary` strings

#### Scenario: waiting_for shapes suggested_next

- **WHEN** the current node has `waiting_for: user:review-style-master`
- **AND** Agent runs `ppt_flow.mjs state <runDir> --json`
- **THEN** `suggested_next` includes that waiting_for token (e.g. prefixed with `waiting:`)
- **AND** `workflow_summary` indicates a human-wait / review blockage

### Requirement: status surfaces playbook position

`ppt_flow.mjs status` SHALL include a compact Playbook section (text) or JSON fields with at least `playbook` and `current_node` from `_state` (via `readState` with default heal), so artifact-oriented status does not hide the breakpoint. If `_state` is missing and heal seeds a default, status SHALL still report the seeded position rather than omitting playbook fields silently.

#### Scenario: status shows playbook breakpoint

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with `_state/state.yaml`
- **THEN** output mentions the active playbook and current_node

### Requirement: approve dual-writes metadata and _state gates

`ppt_flow.mjs approve <runDir> <gate>` SHALL set the corresponding `content_gate` or `visual_gate` in `project-metadata.yaml` **and** set `_state.gates.<gate>` to the same value (`approved` or `waived`) via `writeState` on the deck root. Pipeline readiness MAY continue to read metadata; session resume and `state --check-gates` SHALL see matching `_state` gates after approve. Command count remains 12.

#### Scenario: approve visual syncs _state gates

- **WHEN** Agent runs `ppt_flow.mjs approve <runDir> visual`
- **THEN** `project-metadata.yaml` has `visual_gate: approved`
- **AND** `_state/state.yaml` has `gates.visual: approved`

#### Scenario: approve --waive syncs both stores

- **WHEN** Agent runs `ppt_flow.mjs approve <runDir> content --waive`
- **THEN** metadata `content_gate` is `waived`
- **AND** `_state.gates.content` is `waived`
