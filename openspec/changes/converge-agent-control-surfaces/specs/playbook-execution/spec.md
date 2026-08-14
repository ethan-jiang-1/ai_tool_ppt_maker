## MODIFIED Requirements

### Requirement: Direct intent entry reaches existing Controller boundaries only

The MD Controller SHALL receive new-work, resume, and change intent directly
from current command guidance after applicable foundation work. New work SHALL
reach the existing direct initialization and `create-deck` Controller boundary.
Resume SHALL require an exact run and consume workflow inspection. A change
SHALL require an exact run and enter `classify-change` before the existing text,
visual, notes, or structural playbook. Guidance SHALL not select a node, mutate
execution state, or replace a current Controller route before that handoff.

#### Scenario: New-deck discovery does not preselect a lifecycle node

- **WHEN** a user begins a new-deck request
- **THEN** the Agent performs applicable foundation and initialization work
  before handing off to the existing create-deck Controller
- **AND** it does not write a route selection, workflow choice, authorization,
  or raw plan during discovery

#### Scenario: Change discovery preserves classifier ownership

- **WHEN** a user with an exact run asks for a work change
- **THEN** the Agent enters `classify-change` and the existing selected leaf
  playbook
- **AND** it does not use a route registry or resume card to infer a direct
  owner mutation

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification
validator. The validator SHALL bind the expected controller/shared-node
inventory, globally unique IDs, exact order, pipeline ownership, valid
`method_module` values, includes/requires, conditions, decisions,
selected-workflow `draft_route_nodes`, and existing target-module ownership
rules. Its checked-in normative manifest SHALL bind the controller/shared-node
inventory, exact controller-node order, supported-pipeline declarations, and
selected-workflow `draft_route_nodes`. A node MAY declare `draft_route: true`
only when the manifest places it in the exact create-deck workflow's unbound
source-to-first-raw route. Validation SHALL reject missing, extra, duplicated,
sibling-workflow, post-raw, or non-create-deck draft-route entries and SHALL
not rely on a stale hard-coded count alone. The optional key SHALL be either
absent or the literal Boolean `true`; explicit `false`, strings, numbers, null,
and duplicate YAML keys SHALL be rejected rather than normalized into a second
representation of non-routability.

`method_module` SHALL be the only bound lifecycle-location declaration. Every
Controller and node frontmatter shape SHALL be closed to its declared current
keys. The validator SHALL reject `production_modes`,
`supported_production_modes`, numeric `lifecycle_phase`, legacy `phase`, and
all otherwise unconsumed node-frontmatter keys before Controller indexing,
draft routing, or diagnostic projection.

#### Scenario: Draft-route projection matches playbooks

- **WHEN** the Harness indexes the updated create-deck playbook and controller
  manifest
- **THEN** each workflow's ordered `draft_route_nodes` begins with the shared
  workflow-selection node and exactly matches its applicable content,
  visual-system, selected Style Master, and first-raw nodes declared
  `draft_route: true`
- **AND** unknown, sibling, post-raw, and non-create-deck nodes cannot become
  draft-routable through manifest drift

#### Scenario: Draft-route declaration has one canonical form

- **WHEN** a node declares `draft_route` as false, a string, number, null, or
  duplicate key
- **THEN** canonical node parsing fails before Controller indexing or draft
  routing
- **AND** absence remains the only representation of a node that is not
  draft-routable

#### Scenario: Undeclared metadata cannot become a silent Controller dialect

- **WHEN** a Controller or node declaration adds an unknown, duplicate, stale,
  or misspelled metadata key
- **THEN** canonical node parsing fails before Controller indexing or draft
  routing
- **AND** it does not normalize, retain, or derive routing from that key

#### Scenario: Method module is the only lifecycle binding

- **WHEN** a registered node declares a valid `method_module` and omits
  `lifecycle_phase`, `phase`, and production-mode metadata
- **THEN** the canonical validator accepts its lifecycle location subject to the
  existing module, adapter, and workflow ownership checks
- **AND** it produces no lifecycle-derived field or mode-specific diagnostic
