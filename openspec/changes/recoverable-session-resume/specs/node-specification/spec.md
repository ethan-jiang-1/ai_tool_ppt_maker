## MODIFIED Requirements

### Requirement: State file is YAML at run bundle root

Every run bundle SHALL contain a `_state/` directory with two files: `state.yaml` (single truth source, atomically written) and `history.jsonl` (append-only reference log). `state.yaml` SHALL track: active playbook, current node, per-node status, gate decisions, playbook_stack, and deck metadata. Per-node records MAY include optional string fields `waiting_for` (short machine-oriented wait reason, e.g. `user:approve-visual`) and `note` (human-readable). `history.jsonl` SHALL NOT participate in any automatic recovery logic——it is for LLM reference only. `readState(deckDir)` reads `_state/state.yaml`. `appendHistory(deckDir, event)` appends to `_state/history.jsonl`. `readHistory(deckDir)` returns all events.

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

### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL support a `state` subcommand registered inside `main()` on the same `Command` instance used by `parseAsync`, before parsing: `state <runDir>` (human-readable summary), `state <runDir> --json` (JSON state dump on success), `state <runDir> --check-gates` (gate validation). On success, `--check-gates` exits `0`. On pending gates (any required gate not in `approved`/`waived` per `isGateApproved`), exit `1` **and** emit the CLI failure JSON envelope (`code` `GATE_BLOCKED`) as the last non-empty line of stderr per `cli-surface`. The `state` command SHALL call `readState` with **default heal** so recoverable format/schema defects do not surface as corruption. Exit `2` with envelope `code` `STATE_CORRUPTED` SHALL occur only when state remains unusable after the configured read path (for example explicit `heal: false` diagnostic reads that return `{corrupted:true}`, or an implementation failure to seed a usable state) — not when heal successfully rewrote or normalized the file.

Human-readable and `--json` success output SHALL include a **resume card**: `playbook`, `current_node`, current node `status`, optional `waiting_for` / `note`, `_state` gates, `playbook_stack` (or empty), and a short `suggested_next` string derived from position. The card SHALL NOT invent a new top-level CLI command.

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
- **THEN** the JSON includes `playbook`, `current_node`, and `suggested_next`
- **AND** gates and playbook_stack are present

## ADDED Requirements

### Requirement: Node transitions persist via writeState

Whenever a node status transitions to `in_progress`, `completed`, `failed`, or `skipped`, the agent SHALL persist via `setNodeStatus` (or equivalent API) and `writeState` before relying on chat memory. Leaving a human-wait SHALL clear or update `waiting_for` accordingly. Agents SHALL NOT treat an unpersisted node transition as durable across sessions. Schema heal / round-trip SHALL preserve optional `waiting_for` and `note` fields when present.

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
