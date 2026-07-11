## ADDED Requirements

### Requirement: state prints a where-am-I resume card

`ppt_flow.mjs state` human output and successful `--json` output SHALL present a **where-am-I** resume card for whole-session recovery (not playbook name alone). The card SHALL include: active `playbook`, `current_node`, current node status, optional `waiting_for` / `note` (when set on the current node), `_state` gates, `playbook_stack` (possibly empty), a non-empty `workflow_summary` (short human-readable whole-workflow position; default Chinese), and a non-empty `suggested_next`. Card construction SHALL live in `state.mjs` as `buildResumeCard(state, statusSnapshot?)` (or equivalent exported helper) so `status` can reuse it. Heuristics for `workflow_summary` / `suggested_next` SHALL follow the change design (waiting-first; optional status snapshot for artifacts) and SHALL NOT mutate state. The CLI SHALL resolve the deck root via `deckRoot(resolve(runDir))`. Successful `--json` SHALL expose `workflow_summary` and `suggested_next` as **top-level** string fields on the printed object (in addition to normal state fields). The CLI command count remains **12**.

#### Scenario: Human state output names playbook and node

- **WHEN** Agent runs `ppt_flow.mjs state <runDir>` on an in-progress deck
- **THEN** stdout identifies the active playbook and current_node
- **AND** includes a workflow summary and suggested next action

#### Scenario: JSON state dump carries suggested_next and workflow_summary

- **WHEN** Agent runs `ppt_flow.mjs state <runDir> --json`
- **THEN** the JSON object includes non-empty top-level `suggested_next` and `workflow_summary` strings

#### Scenario: waiting_for shapes suggested_next

- **WHEN** the current node has `waiting_for: user:review-style-master`
- **AND** Agent runs `ppt_flow.mjs state <runDir> --json`
- **THEN** `suggested_next` includes that waiting_for token (e.g. prefixed with `waiting:`)
- **AND** `workflow_summary` indicates a human-wait / review blockage

#### Scenario: state resolves deck via deckRoot

- **WHEN** Agent runs `ppt_flow.mjs state` with a version runDir under `3_versions/v1`
- **THEN** state is read via `deckRoot(resolve(runDir))` (same resolver path family as `status` / `approve`, not an unresolved one-off `join(runDir, '..', '..')`)

### Requirement: status surfaces playbook position

`ppt_flow.mjs status` human output SHALL include a compact Playbook section with at least active `playbook` and `current_node` from `_state` (via `readState` with default heal). Successful `status --json` SHALL include `playbook` and `current_node` fields on the JSON object. If `_state` is missing and heal seeds a default, status SHALL still report the seeded position rather than omitting those fields silently. Status MAY also print or JSON-include `workflow_summary` by calling the same resume-card helper with a status snapshot.

#### Scenario: status shows playbook breakpoint

- **WHEN** Agent runs `ppt_flow.mjs status <runDir>` on a deck with `_state/state.yaml`
- **THEN** human output mentions the active playbook and current_node

#### Scenario: status JSON includes playbook fields

- **WHEN** Agent runs `ppt_flow.mjs status <runDir> --json` on a deck with `_state/state.yaml`
- **THEN** the JSON includes `playbook` and `current_node`

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
