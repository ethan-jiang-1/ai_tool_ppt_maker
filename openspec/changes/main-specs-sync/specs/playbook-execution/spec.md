## MODIFIED Requirements

### Requirement: State file is created on playbook start

When a playbook begins execution, `_state/state.yaml` SHALL be created (if it does not exist) or validated (if it already exists). The `playbook` and `current_node` fields SHALL be set.

#### Scenario: First node of create-deck writes initial state

- **WHEN** Agent executes node `instantiation` for the first time
- **THEN** `deck_<name>/_state/state.yaml` is created with `playbook: create-deck`, `current_node: instantiation`

### Requirement: Gates are enforced at node boundaries

No node SHALL transition to `completed` until its exit gate conditions are met. Gates that require human judgment (content_gate, visual_gate) SHALL remain `pending` until the human explicitly approves or waives them. CLI scripts SHALL read `_state/state.yaml` to verify gate status before executing.

#### Scenario: Production node blocked by pending visual gate

- **WHEN** Stage 2 (image generation) is about to start
- **THEN** the CLI script reads `_state/state.yaml` and finds `visual_gate: pending`
- **AND** the script refuses to run and reports "visual_gate must be approved or waived"

## REMOVED Requirements

### Requirement: State file coexists with project-metadata.yaml

**Reason**: Replaced by `_state/` directory design. `state.yaml` lives in `_state/`, `project-metadata.yaml` at deck root.

**Migration**: `_state/state.yaml` is execution state. `project-metadata.yaml` is static config. Separate locations, no coexistence concern.
