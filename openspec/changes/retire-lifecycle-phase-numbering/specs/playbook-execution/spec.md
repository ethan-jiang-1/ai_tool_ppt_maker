## MODIFIED Requirements

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in
normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order,
pipeline ownership, `method_module` values, includes/requires, conditions, decisions, selected-workflow
`draft_route_nodes`, and existing target-module ownership rules. A node MAY declare `draft_route: true` only when the
manifest places it in the exact create-deck workflow's unbound source-to-first-raw route. Validation SHALL reject
missing, extra, duplicated, sibling-workflow, post-raw, or non-create-deck draft-route entries and SHALL not rely
on a stale hard-coded count alone. The optional key SHALL be either absent or the literal Boolean `true`;
explicit `false`, strings, numbers, null, and duplicate YAML keys SHALL be rejected rather than normalized into
a second representation of non-routability.

#### Scenario: Draft-route projection matches playbooks

- **WHEN** the Harness indexes the updated create-deck playbook and controller manifest
- **THEN** each workflow's ordered `draft_route_nodes` begins with the shared workflow-selection node and exactly matches its applicable content, visual-system, selected Style Master, and first-raw nodes declared `draft_route: true`
- **AND** unknown, sibling, post-raw, and non-create-deck nodes cannot become draft-routable through manifest drift

#### Scenario: Draft-route declaration has one canonical form

- **WHEN** a node declares `draft_route` as false, a string, number, null, or duplicate key
- **THEN** canonical node parsing fails before Controller indexing or draft routing
- **AND** absence remains the only representation of a node that is not draft-routable
