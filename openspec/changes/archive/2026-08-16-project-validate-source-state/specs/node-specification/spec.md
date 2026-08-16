# Node Specification Specification (delta)

## MODIFIED Requirements

### Requirement: CLI exposes state via ppt_flow state command

`ppt_flow state <runDir>`, `--json`, and `--validate-state` SHALL remain
observation-first operations. They SHALL resolve the canonical deck/run
version, classify the direct source marker and durable state, and call
`readState` with purpose observe and heal false plus read-only validation. A
repairable current record returns the owner-issued action without writes.
Missing, retired, malformed, or mismatched state/source identity returns a
bounded non-writing protocol diagnostic; it does not seed state, infer a
selected workflow, select a Controller, or use generated artifacts as a
resume substitute. The retired `--check-gates` form is not a current state
entry and SHALL NOT be documented or referenced as one.

Closed current mutation forms, including gate-journal recovery and Page Image
Workflow delivery decisions, retain their owning preconditions and exact
arguments. They are mutually exclusive with observation modes and must
validate current source/state identity before write. No unsupported
controller identity or receipt is accepted by this command surface.

#### Scenario: Plain state observes a repairable current record

- **WHEN** `ppt_flow state <runDir> --json` sees a one-to-one repairable
  declared-current defect
- **THEN** it reports the owner action without changing state, history,
  metadata, or generated output

#### Scenario: Plain state sees an unsupported protocol

- **WHEN** the run has a pre-current state or absent/retired marker
- **THEN** it returns a bounded diagnostic without creating a state file or
  active execution

#### Scenario: Observation never references the retired flag

- **WHEN** current guidance or implementation documents the state observation
  forms
- **THEN** they name `--validate-state` and the owner-owned operations only
- **AND** they do not reference the retired `--check-gates` entry

## ADDED Requirements

### Requirement: Consumers treat additive validate observations as non-authoritative

MD Controllers and runtime Agent guidance SHALL consume a
`source_valid` observation in a validate failure envelope as a bounded,
non-authoritative fact: it states only that the source-only parse succeeded
and SHALL NOT be read as overall validate success, raw-planning readiness,
provider authorization, state rebind permission, or a bypass of the stale
identity hard-stop. Control authority SHALL remain
`diagnostic.category`/`reason`/`next`, per `cli-surface`; consumers SHALL
tolerate the additive field and SHALL NOT copy its schema.

#### Scenario: An Agent reads source_valid without treating it as success

- **WHEN** a validate failure envelope contains `source_valid: true` beside a
  state-binding hard-stop
- **THEN** the Agent follows the state owner's exact next and treats the
  observation as explanatory evidence only
- **AND** it does not run raw planning, provider work, or a state rebind
  based on the observation
