## ADDED Requirements

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

When a playbook begins execution, `_state/state.yaml` SHALL be created (if it does not exist) or validated (if it already exists). The `playbook` and `current_node` fields SHALL be set.

#### Scenario: First node of create-deck writes initial state

- **WHEN** Agent executes node `instantiation` for the first time
- **THEN** `deck_<name>/_state/state.yaml` is created with `playbook: create-deck`, `current_node: instantiation`

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

`_state/state.yaml` SHALL coexist with the existing `project-metadata.yaml` in the run bundle root. The state file SHALL track execution progress (playbook, current_node, per-node status). The metadata file SHALL continue to track static configuration (deck_name, topic, audience, gate decisions).

#### Scenario: Both files exist in run bundle root

- **WHEN** a run bundle is initialized and playbook execution begins
- **THEN** `deck_<name>/` contains both `project-metadata.yaml` (static config) and `_state/state.yaml` (execution state)
