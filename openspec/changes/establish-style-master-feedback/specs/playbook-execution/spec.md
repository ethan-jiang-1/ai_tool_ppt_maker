## MODIFIED Requirements

### Requirement: New decks enter the Page Authority production controller

For a fresh TARGET version, the registered create-deck controller SHALL obtain one human semantic choice,
`framed` or `pure`, before it enters provider-facing work. It SHALL author the canonical v2 selected-workflow
source, configure the selected visual system, and then enter the Style Master owner, which validates the source
through the selected workflow's read-only candidate-source interface. The Controller SHALL not invoke the
materializing source-validation action before this Style Master handoff. Only after current Style Master
promotion may the selected-workflow raw-plan owner materialize the first source receipt/state pair and expose
that workflow's page-raw prerequisites, gate, and nearest action. The controller SHALL NOT ask for a per-slide
authority choice or infer a workflow from deck type, content, or a generated artifact.

The existing draft router SHALL consume the node-declared, registered-controller-manifest-validated ordered
`draft_route: true` projection for the active selected workflow, so the exact unbound draft remains routable
at the workflow-selection node and after it advances through content, visual-system, Style Master, and first
raw-plan handoff. The playbook and router SHALL NOT infer this from node names, lifecycle phase, array position, or
independent node lists; another controller, sibling-workflow node, unknown node, post-raw node, or bound
production mode SHALL fail closed rather than regain draft status.

The human owns workflow/content/visual decisions. JS owns parsing, readiness, state, evidence, and recovery. A
missing or invalid workflow/source is an owner hard-stop; Style Master cost authorization, Style Master visual
review, page provider authorization, and raw visual review remain distinct bounded human confirms recorded by
their owning runtime interfaces.

#### Scenario: Framed selection creates a straight controller route

- **WHEN** a human selects `framed` for a fresh target version and its canonical source candidate is valid
- **THEN** the controller enters the Framed Style Master path before source receipt/raw planning and later shared delivery without presenting Pure as a slide-level option
- **AND** Style Master and page provider work each wait for their own owner-issued scoped authorization

#### Scenario: Non-v2 source is not a controller route

- **WHEN** an existing source/state pair is non-v2
- **THEN** the Controller presents the owner-issued unsupported-protocol hard-stop
- **AND** it does not register, select, rewrite, or resume a compatibility controller

### Requirement: Registered playbooks pass machine validation

Every active controller/shared node SHALL pass the canonical node-specification validator. A checked-in
normative manifest SHALL bind the expected controller/shared-node inventory, globally unique IDs, exact order,
pipeline ownership, lifecycle/module values, includes/requires, conditions, decisions, selected-workflow
`draft_route_nodes`, and existing Phase-4 ownership rules. A node MAY declare `draft_route: true` only when the
manifest places it in the exact create-deck workflow's unbound source-to-first-raw route. Validation SHALL reject
missing, extra, duplicated, sibling-workflow, post-raw, or non-create-deck draft-route entries and SHALL not rely
on a stale hard-coded count alone. The optional key SHALL be either absent or the literal Boolean `true`;
explicit `false`, strings, numbers, null, and duplicate YAML keys SHALL be rejected rather than normalized into
a second representation of non-routability.

#### Scenario: Draft-route projection matches playbooks

- **WHEN** the framework indexes the updated create-deck playbook and controller manifest
- **THEN** each workflow's ordered `draft_route_nodes` begins with the shared workflow-selection node and exactly matches its applicable content, visual-system, selected Style Master, and first-raw nodes declared `draft_route: true`
- **AND** unknown, sibling, post-raw, and non-create-deck nodes cannot become draft-routable through manifest drift

#### Scenario: Draft-route declaration has one canonical form

- **WHEN** a node declares `draft_route` as false, a string, number, null, or duplicate key
- **THEN** canonical node parsing fails before Controller indexing or draft routing
- **AND** absence remains the only representation of a node that is not draft-routable

## ADDED Requirements

### Requirement: Style Master Controller handoff stays selected-workflow specific

The Page Authority Controller SHALL insert Style Master plan, cost-authorization, candidate-progress,
real-byte review, and promotion handoffs after visual-system configuration and before page raw planning.
Framed and Pure SHALL expose separate selected-workflow entries and present only their own visual questions;
shared Controller wording or mechanics SHALL not make a user compare the sibling workflow.

For fresh creation, the handoff SHALL consume the active fresh-v2 authoring draft and validate its
selected-workflow source through the existing read-only candidate-source interface without requiring or creating
page source receipt/state/raw-plan lineage or invoking the materializing source-validation action. For an
existing run it SHALL require the exact current source/state pair. The Controller SHALL consume the Style
Master owner's inspection result for current plan identity, progress, and nearest action; it SHALL NOT select
candidate history by filesystem order or reconstruct attempt/grant state.

The Style Master cost authorization and visual-direction decision are distinct typed human gates. A
cost-authorization gate SHALL appear only when the exact plan contains generated slots; a zero-generated
local-existing plan SHALL proceed directly to exact-hash real-byte review without credentials or a grant. A
`proceed` decision may advance only to owner promotion after current evidence checks; it SHALL NOT satisfy
page raw authorization, Pilot/Expansion approval, raw acceptance, or a structural workflow switch. A
`repair` or `redirect` decision returns the owner-issued Style Master checkpoint. Task checklists are
read-only collaboration projections and SHALL not become Controller evidence or a resume authority.

#### Scenario: Framed path does not expose Pure questions

- **WHEN** the selected current workflow is `framed` and Style Master review is ready
- **THEN** the Controller presents the Framed Style Master entry and current candidate evidence only
- **AND** it does not expose Pure display semantics or a sibling-workflow route

#### Scenario: Pure path does not expose Framed questions

- **WHEN** the selected current workflow is `pure` and Style Master review is ready
- **THEN** the Controller presents the Pure Style Master entry and current candidate evidence only
- **AND** it does not expose Framed Text Frame or safe-zone semantics

#### Scenario: Promotion is required before raw planning

- **WHEN** a human has reviewed a candidate but promotion has not produced a current effective selection
- **THEN** the next Controller action remains Style Master promotion/recovery
- **AND** the page raw authorization node cannot start

#### Scenario: Local-existing review has no cost authorization node

- **WHEN** the exact selected-workflow plan contains one local-existing candidate and zero generated slots
- **THEN** the Controller presents the current real-byte review action directly
- **AND** it does not ask for provider authorization, resolve credentials, or mark a cost gate skipped as approval

#### Scenario: Unknown candidate returns to exact owner recovery

- **WHEN** Style Master inspection reports an unknown submitted attempt for the current plan
- **THEN** the Controller presents the owner-issued exact-plan abandonment decision and required human reason
- **AND** it does not offer retry, edit state, infer failure, or start a successor authorization
