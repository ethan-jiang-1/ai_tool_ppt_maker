## MODIFIED Requirements

### Requirement: Chain playbooks cover iteration workflows

`edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md` SHALL each define a shortened workflow for iterative changes. Each SHALL begin with change classification and end with an intent-specific, globally unique verification node. Header text changes SHALL be routed by the affected slide's resolved render mode: `body+header-lock` uses Chain A without Stage 2, while `full-page` uses Chain B with forced image regeneration, pilot/header review evidence, and reviewed-image reuse for build.

#### Scenario: User requests a body-lock title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `body+header-lock`
- **THEN** COMMANDS.md routes through change classification to the text-edit path
- **AND** Agent runs stages 1,3,4,5 and verifies the output

#### Scenario: User requests a full-page title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `full-page`
- **THEN** Agent routes the change through Chain B
- **AND** regenerates the selected image with `--force-images`, reviews/approves the current header evidence, and builds with reviewed-image reuse

#### Scenario: User requests a visual redesign

- **WHEN** user says "换个配色"
- **THEN** COMMANDS.md routes to playbook `edit-visual`
- **AND** Agent runs a representative pilot before full regeneration

## ADDED Requirements

### Requirement: Registered playbooks pass machine validation

Every registered MD Controller and shared node SHALL pass the canonical node-specification validator before the framework test suite succeeds. Validation SHALL cover node parsing, global uniqueness, ordered requirements, includes, condition catalog coverage, and impossible self-entry gates.

#### Scenario: Current controller set validates

- **WHEN** the framework playbook validation test indexes `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** all registered controllers and the shared node parse successfully
- **AND** no duplicate node IDs, missing requirements, unknown conditions, or impossible gates are reported

### Requirement: Legacy duplicate node state remains resumable

When a known duplicate node ID is renamed to a unique intent-specific ID, the state read/heal path SHALL migrate an in-progress legacy `current_node` using the active playbook as context and SHALL preserve the node's existing status and extra fields.

#### Scenario: Legacy edit-text verify-output resumes

- **WHEN** an existing state has `playbook: edit-text` and `current_node: verify-output`
- **THEN** read/heal maps it to the new text-specific verification node
- **AND** preserves its node record and playbook stack
