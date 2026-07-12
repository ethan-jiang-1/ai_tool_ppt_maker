## MODIFIED Requirements

### Requirement: Chain playbooks cover iteration workflows

`edit-text.md`, `edit-visual.md`, `edit-notes.md`, and `restructure-slides.md` SHALL each define a shortened workflow for iterative changes. Each SHALL begin with change classification and end with an intent-specific, globally unique verification node. The text-edit controller SHALL use the public `ppt_flow refresh --kind title` path so the affected slide's resolved render mode selects the chain centrally: `body+header-lock` uses Chain A without Stage 2, while `full-page` uses Chain B with selected forced image regeneration, pilot/header review evidence, and reviewed-image reuse for build.

#### Scenario: User requests a title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `body+header-lock`
- **THEN** COMMANDS.md routes through change classification to the text-edit controller
- **AND** the controller invokes `ppt_flow refresh --kind title` for the selected slide
- **AND** Agent runs stages 1,3,4,5 and verifies the output

#### Scenario: User requests a full-page title change

- **WHEN** user says "第5页标题改一下"
- **AND** Stage 1 resolves slide 5 as `full-page`
- **THEN** `ppt_flow refresh --kind title` reports the current full-page review requirement instead of silently running Chain A
- **AND** Agent regenerates the selected image with `--force-images`, reviews/approves current header evidence, then completes refresh/build without a second image generation

#### Scenario: User requests a visual redesign

- **WHEN** user says "换个配色"
- **THEN** COMMANDS.md routes to playbook `edit-visual`
- **AND** Agent runs the existing three-slide representative pilot before full regeneration

## ADDED Requirements

### Requirement: Registered playbooks pass machine validation

Every registered MD Controller and shared node SHALL pass the canonical node-specification validator before the framework test suite succeeds. The normalized registry SHALL contain nine ordered controllers, one shared node, and forty globally unique nodes, including a new terminal `verify-restructure-output` node. Validation SHALL cover node parsing, global uniqueness, ordered requirements, includes, condition catalog coverage, declared decision values, and impossible self-entry gates.

#### Scenario: Current controller set validates

- **WHEN** the framework playbook validation test indexes `PPTMAKER_FRAMEWORK/playbook/`
- **THEN** all registered controllers and the shared node parse successfully
- **AND** no duplicate node IDs, missing requirements, unknown conditions, or impossible gates are reported
- **AND** their node order, metadata, dependencies, decisions, and conditions match the normative design manifest

#### Scenario: Restructure workflow ends in verification

- **WHEN** `restructure-slides` completes affected regeneration
- **THEN** it proceeds to globally unique node `verify-restructure-output`
- **AND** requires current user evidence that the structure change is correct before the playbook completes

### Requirement: Playbook lifecycle and methodology metadata are explicit

Every playbook node SHALL declare both its end-to-end lifecycle position and its methodology module using the canonical fields from `node-specification`. Controllers SHALL NOT use a single numeric `phase` field to mean a workflow directory.

#### Scenario: Production node is unambiguous

- **WHEN** Agent inspects the create-deck production node
- **THEN** it declares `lifecycle_phase: 3` and `method_module: 04-production`
- **AND** no reader must infer the meaning of `phase: 04`

### Requirement: Legacy duplicate node state remains resumable

When a known duplicate node ID is renamed to a unique intent-specific ID, the state read/heal path SHALL migrate an in-progress legacy `current_node` using the active playbook as context and SHALL preserve the node's existing status and extra fields in the active execution working set. If both legacy and canonical keys exist, the canonical record wins and only missing fields are merged from the legacy record.

#### Scenario: Legacy edit-text verify-output resumes

- **WHEN** an existing state has `playbook: edit-text` and `current_node: verify-output`
- **THEN** read/heal maps it to the new text-specific verification node
- **AND** preserves its node record, active execution identity, and playbook stack

### Requirement: Resume cards use the active playbook model

Human and JSON output from `ppt_flow state` SHALL use the canonical active playbook index to calculate complete pending-node lists and eligible next nodes. A unique eligible next node SHALL produce a specific suggestion. Multiple eligible branch nodes SHALL be reported as candidates without automatic selection. Existing `waiting_for` remains the highest-priority next action.

#### Scenario: Unique next node is suggested

- **WHEN** the current node is completed and exactly one downstream node has all requirements satisfied
- **THEN** `suggested_next` names that node
- **AND** Pending includes later nodes that do not yet have state records

#### Scenario: Branch requires a decision

- **WHEN** two downstream branch nodes are eligible after a review node
- **THEN** the resume card lists both candidates
- **AND** does not silently choose one

#### Scenario: Waiting state remains authoritative

- **WHEN** the current node has `waiting_for`
- **THEN** `suggested_next` remains the waiting action even if another node appears structurally eligible
