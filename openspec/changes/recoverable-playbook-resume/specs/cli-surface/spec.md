## ADDED Requirements

### Requirement: state prints a resume card

`ppt_flow.mjs state` human output and successful `--json` output SHALL present a resume card: active `playbook`, `current_node`, current node status, optional `waiting_for` / `note`, `_state` gates, `playbook_stack` summary, and `suggested_next`. The CLI command count remains **12** (no `resume` / `continue` subcommand).

#### Scenario: Human state output names playbook and node

- **WHEN** Agent runs `ppt_flow.mjs state <runDir>` on an in-progress deck
- **THEN** stdout identifies the active playbook and current_node
- **AND** includes a suggested next action line or field

#### Scenario: JSON state dump carries suggested_next

- **WHEN** Agent runs `ppt_flow.mjs state <runDir> --json`
- **THEN** the JSON object includes `suggested_next` as a string

### Requirement: status surfaces playbook position

`ppt_flow.mjs status` SHALL include a compact Playbook section (text) or JSON fields with at least `playbook` and `current_node` from `_state` (via `readState` with default heal), so artifact-oriented status does not hide the breakpoint. If `_state` is missing and heal seeds a default, status SHALL still report the seeded position rather than omitting playbook fields silently.

#### Scenario: status shows playbook breakpoint

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with `_state/state.yaml`
- **THEN** output mentions the active playbook and current_node

### Requirement: approve dual-writes metadata and _state gates

`ppt_flow.mjs approve <runDir> <gate>` SHALL set the corresponding `content_gate` or `visual_gate` in `project-metadata.yaml` **and** set `_state.gates.<gate>` to the same value (`approved` or `waived`) via `writeState` on the deck root. Pipeline readiness MAY continue to read metadata; playbook resume and `state --check-gates` SHALL see matching `_state` gates after approve. Command count remains 12.

#### Scenario: approve visual syncs _state gates

- **WHEN** Agent runs `ppt_flow.mjs approve <runDir> visual`
- **THEN** `project-metadata.yaml` has `visual_gate: approved`
- **AND** `_state/state.yaml` has `gates.visual: approved`

#### Scenario: approve --waive syncs both stores

- **WHEN** Agent runs `ppt_flow.mjs approve <runDir> content --waive`
- **THEN** metadata `content_gate` is `waived`
- **AND** `_state.gates.content` is `waived`
