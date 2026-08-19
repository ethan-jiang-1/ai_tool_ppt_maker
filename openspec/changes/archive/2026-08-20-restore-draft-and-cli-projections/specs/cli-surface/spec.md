## ADDED Requirements

### Requirement: Init next is one public sentence

`ppt_flow init` SHALL emit `Next: ppt_flow.mjs status <v1Path>` after a
successful scaffold, where `<v1Path>` is the created `3_versions/v1` path. That
sentence is the single public Next for initialization. It SHALL NOT tell the
Agent to skip upstream material, fill backbone and slide specifications as the
first act, or invent a second startup route. The matching
`bundle_layout --init` sentence is owned by `run-bundle-management`.

#### Scenario: Public init names status

- **WHEN** `ppt_flow init` successfully creates a current unbound draft
- **THEN** the human Next line is `Next: ppt_flow.mjs status <v1Path>`
- **AND** it does not contradict the layout `--init` Next

### Requirement: Style Master inspect accepts JSON mode

`style-master inspect` SHALL register `--json`. Default output and `--json`
SHALL be two renderers of the same owner inspect result. `--json` SHALL emit
exactly one registered report document. Omitting `--json` SHALL NOT be the only
way to obtain that document, and passing `--json` SHALL NOT be a usage error.
This requirement does not add a novice prose default. The CLI remains an
Agent machine surface under `harness-charter`.

#### Scenario: Inspect --json is accepted

- **WHEN** `ppt_flow style-master inspect <run-dir> --json` runs on a current
  valid scope
- **THEN** it exits 0 with one registered JSON report on stdout
- **AND** it does not emit USAGE for the `--json` flag

## MODIFIED Requirements

### Requirement: CLI routing does not duplicate workflow evaluation

Shared command routing SHALL consume the state/workflow owner result rather than
reconstructing mode, gate, authorization, recovery, or completion rules from CLI
arguments, rendered output, or metadata.

Human `ppt_flow status` Next SHALL render
`workflow_inspection.primary_action` the same way ordinary `state` already
projects Next (`command`, else `display_label`, else `owner:action_id`),
including Style Master and Image2 progressive checkpoints when that field
names those owners. `status --json` SHALL include the existing
`workflow_inspection` object additively on the registered command report.
Status SHALL NOT synthesize a parallel list that only mentions `build` and
`refresh`, and SHALL NOT invent a second next vocabulary. This requirement
does not change `build` or `refresh` success copy. `harness-charter` still
requires the Agent to project Purpose / Outcome / Next for humans.

#### Scenario: CLI consumes one inspection action

- **WHEN** a current command needs its next action
- **THEN** it uses the owner-issued inspection result
- **AND** it does not synthesize a parallel route

#### Scenario: Status names Image2 work when inspection does

- **WHEN** inspection's `primary_action` is an Image2 or Style Master owner
  operation and the human runs `ppt_flow status` without `--json`
- **THEN** Next names that owner action
- **AND** it does not omit Next solely because PPTX is unbuilt

#### Scenario: Status JSON carries the same inspection object

- **WHEN** `ppt_flow status --json` observes a current run whose inspection
  `primary_action` is set
- **THEN** the JSON report includes `workflow_inspection` with that
  `primary_action`
- **AND** it does not invent a second next vocabulary
