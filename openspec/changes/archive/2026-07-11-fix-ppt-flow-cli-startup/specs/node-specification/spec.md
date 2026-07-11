## MODIFIED Requirements

### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL support a `state` subcommand registered inside `main()` on the same `Command` instance used by `parseAsync`, before parsing: `state <runDir>` (human-readable summary), `state <runDir> --json` (JSON state dump on success), `state <runDir> --check-gates` (gate validation). On success, `--check-gates` exits `0`. On pending gates (any required gate not in `approved`/`waived` per `isGateApproved`), exit `1` **and** emit the CLI failure JSON envelope (`code` `GATE_BLOCKED`) as the last non-empty line of stderr per `cli-surface`. On corrupted state, exit `2` **and** emit envelope `code` `STATE_CORRUPTED`.

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

#### Scenario: Corrupted state file

- **WHEN** `readState` reports corrupted state during `state` command
- **THEN** exit is `2`
- **AND** the last non-empty line of stderr is JSON with `code` `STATE_CORRUPTED`

## ADDED Requirements

### Requirement: CLI ⇔ MD failure protocol uses JSON envelopes

Playbook CLI steps that invoke `ppt_flow.mjs` SHALL treat a non-zero exit as actionable only when paired with the JSON failure envelope on stderr (last non-empty line), as defined by `cli-surface` and `charter/CONSTITUTION.md`. MD Controllers SHALL branch on `code` and surface `message`/`hint` to the user or attempt repair — they SHALL NOT depend solely on matching prose such as `Fatal error:`.

#### Scenario: MD Controller reads a ppt_flow failure

- **WHEN** a playbook CLI step runs `ppt_flow.mjs` and it exits non-zero
- **THEN** the controller parses the last non-empty stderr line as JSON
- **AND** uses `code` + `hint` to decide the next repair action
