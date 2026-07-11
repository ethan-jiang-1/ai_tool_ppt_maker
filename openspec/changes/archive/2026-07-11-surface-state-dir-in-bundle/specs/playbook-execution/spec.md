## MODIFIED Requirements

### Requirement: State file is created on playbook start

When a playbook begins execution, `_state/state.yaml` SHALL be created (if it does not exist) or validated/updated (if it already exists). The `playbook` and `current_node` fields SHALL be set as required by the playbook. Run-bundle init (`initBundle` via `bundle_layout --init` or `ppt_flow init`) SHALL seed `_state/` when absent, so the common path already has a state file before the first playbook node; playbook start MUST tolerate a pre-seeded file and MUST still create one if a legacy deck is missing it.

#### Scenario: Playbook start creates state when missing

- **WHEN** Agent executes node `instantiation` for the first time
- **AND** `_state/state.yaml` does not yet exist
- **THEN** `deck_<name>/_state/state.yaml` is created with `playbook: create-deck` and `current_node` reflecting instantiation

#### Scenario: Init-seeded state is accepted at playbook start

- **WHEN** a deck was initialized and `_state/state.yaml` already exists
- **AND** Agent begins playbook execution
- **THEN** Agent validates or updates the existing state
- **AND** does not fail merely because the file pre-exists

### Requirement: State file coexists with project-metadata.yaml

`_state/state.yaml` SHALL coexist with the existing `project-metadata.yaml` in the run bundle root. The state file SHALL track execution progress (playbook, current_node, per-node status, playbook gates). The metadata file SHALL continue to track static configuration (deck_name, topic, audience, and pipeline gate fields). Scaffolded `_state/README.md` and the metadata template comment SHALL briefly document this coexistence so agents do not treat the two files as duplicates or merge them casually.

#### Scenario: Both files exist after init

- **WHEN** a run bundle is initialized
- **THEN** `deck_<name>/` contains both `project-metadata.yaml` (static config) and `_state/state.yaml` (execution state)
