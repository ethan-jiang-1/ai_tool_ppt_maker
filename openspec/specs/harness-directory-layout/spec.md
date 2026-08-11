# Harness Directory Layout Specification

## Purpose

Define the current PPT Maker Harness directory map. It exposes Page Image Workflow ownership,
its retained private runtime seams, and one current production owner graph.
## Requirements
### Requirement: Harness layout has no retired production owner
The Harness directory map and executable inventory SHALL give every registered production executable one declared current Page Image Workflow/shared owner. It SHALL NOT expose a compatibility home, v1 implementation, v1 guidance, v1-focused proof, generic branch, README-only test owner, or uncalled iteration interface.

#### Scenario: Script inventory is audited
- **WHEN** Harness executable ownership is validated
- **THEN** every registered production executable has one declared current Page Image Workflow/shared owner
- **AND** no current implementation belongs to a retired protocol owner

#### Scenario: Retired paths are audited
- **WHEN** Harness directory layout is inspected after retirement
- **THEN** scripts, workflow, and tests have no active retired production path
- **AND** a deleted v1 path cannot claim active ownership

### Requirement: Harness source and production data stay separate

Harness source SHALL remain under `ppt_maker_harness/`, `openspec/`, `tests/`,
and `tests_e2e/`. Deck and research directories are user-owned production data and
shall not become Harness implementation roots.

#### Scenario: A deck is initialized

- **WHEN** a run bundle is created
- **THEN** generated and source data are created under the deck, not Harness source directories

### Requirement: Harness layout exposes target sibling workflow ownership
The Harness directory map SHALL expose `03-framed-image`, `04-pure-image`, `05-delivery`, and `06-iteration` as target method-module owners. It SHALL show `03` and `04` as mutually exclusive siblings, `05` as their single shared delivery owner, and `06` as the version-workflow-aware iteration owner. It SHALL keep shared source/visual and raw mechanics distinct from workflow business owners and SHALL not expose a second target finalization, PPTX, notes, or delivery owner.

The map SHALL not identify another-protocol resolver, conversion runtime, or second workflow home.

#### Scenario: Target directory ownership is audited
- **WHEN** Harness directory layout is inspected after retirement
- **THEN** Framed, Pure, Delivery, and Iteration each have one declared owner and `03`/`04` are shown as XOR siblings
- **AND** no active directory path claims a second target delivery or retired owner

### Requirement: Harness exposes one authoritative production schema definition home

The Harness SHALL expose `ppt_maker_harness/schema/` as the single authoritative
definition home for current production semantics and serialization. It SHALL be
separate from Run Bundles and contain a README, `META.yaml`, `flow.yaml`,
`stages/` with exactly the nineteen C1 conceptual stage definitions,
`recovery-route.yaml`, and `serialization-contracts.yaml`. It SHALL NOT contain
`frozen-identifiers.yaml` or another historical/compatibility exception list.

The nineteen stage definitions retain the established unversioned vocabulary:
`story-outline`, `visual-language`, `design-constraints`, `layout-config`,
`page-source`, `page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, `framed-header-html`,
`page-artifact-index`, `image-generation-plan`, `image-generation-record`,
`page-review-decision`, `final-page-list`, `delivery-package`,
`visual-style-candidates`, and `production-progress-state`.

`serialization-contracts.yaml` SHALL declare the one current unversioned
serialization grammar, Page Image selectors, stage/role relations, shared
contracts, and code anchors. The definition home remains descriptive authority,
not a runtime controller or a Run Bundle migration tool. The parent source map,
static directory assertion, and schema-contract test SHALL recognize this exact
home and verify it without putting test implementation in the README.

#### Scenario: A maintainer inspects current production schemas

- **WHEN** a maintainer opens the Harness schema definition home
- **THEN** they can locate all nineteen stages, the transformation flow,
recovery-route labels, and one current serialization inventory
- **AND** they do not encounter a frozen historical identifier policy

#### Scenario: A maintainer inspects production schemas

- **WHEN** a maintainer opens the schema definition home
- **THEN** the stage flow, recovery route, and current serialization inventory are discoverable
- **AND** no historical exception defines current behavior

#### Scenario: A planned producer is inspected

- **WHEN** a definition declares a planned C3-C5 producer
- **THEN** its route reference resolves in the recovery route
- **AND** it does not imply an implementation exists

#### Scenario: The schema home is regression-tested

- **WHEN** the schema-contract test runs
- **THEN** it rejects a missing/extra stage, unresolved planned producer,
invalid serialization declaration, or stale historical inventory
- **AND** the README remains explanatory rather than a test host

#### Scenario: Schema definitions are regression-tested

- **WHEN** the schema-contract sweep runs
- **THEN** it rejects invalid stage, route, or serialization declarations
- **AND** it does not make the README a test host

#### Scenario: A historical identifier is inspected

- **WHEN** a maintainer looks for a current durable identifier
- **THEN** the serialization inventory provides one unversioned declaration and owner anchor
- **AND** it provides no frozen preservation policy

#### Scenario: The Harness root gains the schema definition home

- **WHEN** the static Harness-root directory assertion runs
- **THEN** it accepts the exact schema definition directory
- **AND** it retains existing font and third-party-toolchain checks

### Requirement: Schema definitions expose provenance and author-term repair context

Each `flow.yaml` transformation SHALL identify its input schema or schemas,
output schema, owner, current producer status, and invalidation cause. A
materialized transformation SHALL name its owning module; an unmaterialized
C3-C5 transformation SHALL instead name its planned owning change or
capability and SHALL NOT invent an implementation module. Each derived stage
definition SHALL state the provenance needed to identify its upstream source or
configuration layer.

`META.yaml` SHALL require every constrained stage field to state its rule and
an `on_violation` object with `means`, `ask`, and `never` text in Deck Author
terms. An omitted field that is intended to normalize SHALL declare its
`default` in the definition rather than being represented as an author error.
Repair Guidance is a collaboration projection only; it SHALL NOT constitute a
gate outcome, authorization, persistent record, state mutation, or CLI
diagnostic.

The `page-render-model` and `page-generation-spec` definitions SHALL each state
what they do not contain, explicitly excluding the other artifact so that a
human-reviewable page representation and a provider instruction remain
separate.

#### Scenario: A constrained page field needs author guidance

- **WHEN** a maintainer inspects a constrained field in a stage definition
- **THEN** the definition states the deterministic rule and a complete
  `means`/`ask`/`never` Repair Guidance block
- **AND** the guidance describes the next content decision without naming the
  source field or schema filename to a Deck Author

#### Scenario: An Agent traces a derived page artifact

- **WHEN** an Agent needs to determine what changes after a source or
  configuration edit
- **THEN** it can follow `flow.yaml` and the derived artifact's provenance to
  identify the owning transformation and invalidated downstream artifact
- **AND** it does not treat the collaboration guidance as a separate source of
  record or execution authority

#### Scenario: A future transformation is inspected before its producer exists

- **WHEN** a maintainer inspects a C3-C5 schema whose producer is not yet
  materialized
- **THEN** `flow.yaml` identifies its planned owning change or capability and
  marks its producer status as planned
- **AND** it does not claim that a nonexistent module already writes the
  artifact

### Requirement: Schema definitions name C3's materialized upstream producers
After C3 lands, the schema definition home SHALL name `story-outline` and
`design-constraints` as human-authored current source stages and SHALL name the
story-to-page-source transformation as a materialized current owner. Their
stage definitions, `flow.yaml`, recovery route, serialization inventory where a
durable value is introduced, and code anchors SHALL agree on that one ownership.

The definition home remains descriptive authority. It SHALL NOT become a
runtime controller, a Run Bundle reader, a page-plan state store, or a
historical-source migration facility.

#### Scenario: A maintainer traces the upstream flow
- **WHEN** a maintainer opens the Story Outline, Design Constraints, and
  page-source definitions
- **THEN** the flow identifies their current owner, direct inputs, output, and
  invalidation causes
- **AND** it does not describe C3's producer as merely planned or imply a
  compatibility path for an old source layout
