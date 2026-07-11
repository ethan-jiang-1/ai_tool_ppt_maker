## Purpose

Define how MD Controller playbooks under `PPTMAKER_FRAMEWORK/playbook/` drive an agent through a deck's lifecycle: the six playbook files (five MD Controllers plus the shared `classify-change.md` node), the 11-node `create-deck` creation flow and the shortened edit chains, intent routing via `COMMANDS.md`, state initialization on playbook start, gate enforcement at node boundaries, and shared-node reuse via `includes:`. This capability guarantees that user intent maps to exactly one playbook, that human-judgment gates (content and visual) block progression until explicitly approved or waived, and that execution state lives in `_state/state.yaml` alongside the static `project-metadata.yaml`.

## Requirements

### Requirement: playbook/ directory contains five MD controllers

`PPTMAKER_FRAMEWORK/playbook/` SHALL contain exactly six files: five MD Controllers (`create-deck.md`, `edit-text.md`, `edit-visual.md`, `edit-notes.md`, `restructure-slides.md`) plus one shared node file `classify-change.md`. Each MD Controller SHALL be self-contained and define an ordered sequence of nodes; `classify-change.md` is a shared node (`shared: true`) referenced by the chain playbooks via `includes:`.

#### Scenario: Agent lists available playbooks

- **WHEN** Agent lists `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** it sees five MD Controllers plus the shared node `classify-change.md`

### Requirement: create-deck playbook covers complete deck creation

`create-deck.md` SHALL define the complete workflow for creating a new PPT from scratch. It SHALL use 11 nodes: instantiation, hitl1, setup, seed-topics, wave0, wave1, wave2, hitl2, readiness, rerun, final. Node order SHALL be: instantiation → hitl1 → setup → seed-topics → wave0 → wave1 → wave2 → hitl2 → (rerun → seed-topics | readiness → final).

#### Scenario: User says "帮我做一个PPT"

- **WHEN** user requests a new PPT
- **THEN** COMMANDS.md routes to playbook `create-deck`
- **AND** Agent starts executing from node `instantiation`

### Requirement: Chain playbooks cover iteration workflows

`edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md` SHALL each define a shortened workflow for iterative changes. Each SHALL begin with change classification and end with exit verification.

#### Scenario: User requests a title change

- **WHEN** user says "第5页标题改一下"
- **THEN** COMMANDS.md routes to playbook `edit-text`
- **AND** Agent classifies the change, runs stages 1,3,4,5 targeting slide 5, and verifies the output

#### Scenario: User requests a visual redesign

- **WHEN** user says "换个配色"
- **THEN** COMMANDS.md routes to playbook `edit-visual`
- **AND** Agent runs a 3-slide pilot before full regeneration

### Requirement: COMMANDS.md is a routing table

`PPTMAKER_FRAMEWORK/COMMANDS.md` SHALL map natural-language user intents to playbook names. Each row SHALL include: example user input, target playbook, and any entry parameters. Agent SHALL read COMMANDS.md to classify user intent, then read the target playbook to execute.

#### Scenario: Agent routes user request to correct playbook

- **WHEN** user says "第8页的图重新生成"
- **THEN** Agent reads COMMANDS.md, classifies as `edit-visual`, and loads `playbook/edit-visual.md`

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

### Requirement: Gates are enforced at node boundaries

No node SHALL transition to `completed` until its exit gate conditions are met. Gates that require human judgment (the `content` and `visual` gates, tracked under `gates` in `_state/state.yaml`) SHALL remain `pending` until the human explicitly approves or waives them (via Agent conversation or `scripts/ppt_flow.mjs approve`). CLI scripts SHALL read `_state/state.yaml` to verify gate status before executing.

#### Scenario: Production node blocked by pending visual gate

- **WHEN** Stage 2 (image generation) is about to start
- **THEN** the CLI script reads `_state/state.yaml` and finds `gates.visual` is `pending`
- **AND** the script refuses to run and reports that the visual gate must be approved or waived

### Requirement: Shared nodes are referenced via includes

A playbook SHALL be able to reference a shared node via `includes: [<node-name>]` in its frontmatter. The referenced node SHALL be defined in a standalone `.md` file with `shared: true` in its frontmatter. Multiple playbooks SHALL be able to include the same shared node.

#### Scenario: classify-change shared by edit-text and edit-visual

- **WHEN** `edit-text.md` and `edit-visual.md` both need change classification
- **THEN** both declare `includes: [classify-change]` in their frontmatter
- **AND** `classify-change.md` exists as a standalone shared node with `shared: true`

### Requirement: State file coexists with project-metadata.yaml

`_state/state.yaml` SHALL coexist with the existing `project-metadata.yaml` in the run bundle root. The state file SHALL track execution progress (playbook, current_node, per-node status, playbook gates). The metadata file SHALL continue to track static configuration (deck_name, topic, audience, and pipeline gate fields). Scaffolded `_state/README.md` and the metadata template comment SHALL briefly document this coexistence so agents do not treat the two files as duplicates or merge them casually.

#### Scenario: Both files exist after init

- **WHEN** a run bundle is initialized
- **THEN** `deck_<name>/` contains both `project-metadata.yaml` (static config) and `_state/state.yaml` (execution state)
