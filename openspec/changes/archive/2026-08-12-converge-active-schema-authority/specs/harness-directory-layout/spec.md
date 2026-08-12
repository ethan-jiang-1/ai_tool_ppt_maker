## REMOVED Requirements

### Requirement: Harness exposes one authoritative production schema definition home

**Reason**: It makes the recovery route and C-label delivery progress part of
the permanent schema home.

**Migration**: Replace it with the permanent production-definition requirement
below. The stage vocabulary, descriptive schema authority, static validation,
and normal README orientation remain.

## MODIFIED Requirements

### Requirement: Harness exposes one permanent production schema definition home

The Harness SHALL expose `ppt_maker_harness/schema/` as the single authoritative
definition home for current production semantics and serialization. It SHALL be
separate from Run Bundles and contain a README, `META.yaml`, `flow.yaml`,
`stages/` with exactly the nineteen declared conceptual stage definitions, and
`serialization-contracts.yaml`. It SHALL NOT contain `recovery-route.yaml`,
route references, `frozen-identifiers.yaml`, or another historical/
compatibility exception list.

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
not a runtime controller, a Run Bundle migration tool, or a route-progress
tracker. The parent source map, static directory assertion, and schema-contract
test SHALL recognize this exact home and verify it without putting test
implementation in the README.

#### Scenario: A maintainer inspects current production schemas

- **WHEN** a maintainer opens the Harness schema definition home
- **THEN** they can locate all nineteen stages, the transformation flow, and
  one current serialization inventory
- **AND** they do not encounter route-planning labels or a frozen historical
  identifier policy

#### Scenario: A maintainer inspects production schemas

- **WHEN** a maintainer opens the schema definition home
- **THEN** the stage flow and current serialization inventory are discoverable
- **AND** no historical exception or route plan defines current behavior

#### Scenario: A current producer is inspected

- **WHEN** a maintainer inspects a current schema definition
- **THEN** it names a materialized current producer or a stable owning
  capability without route labels
- **AND** it does not imply a nonexistent implementation exists

#### Scenario: The schema home is regression-tested

- **WHEN** the schema-contract test runs
- **THEN** it rejects a missing/extra stage, invalid serialization declaration,
  or stale historical inventory
- **AND** it does not require a recovery route or make the README a test host

#### Scenario: Schema definitions are regression-tested

- **WHEN** the schema-contract sweep runs
- **THEN** it rejects invalid stage or serialization declarations
- **AND** it does not make the README a test host or validate route history

#### Scenario: A historical identifier is inspected

- **WHEN** a maintainer looks for a current durable identifier
- **THEN** the serialization inventory provides one unversioned declaration and
  owner anchor
- **AND** it provides no frozen preservation policy

#### Scenario: The Harness root gains the schema definition home

- **WHEN** the static Harness-root directory assertion runs
- **THEN** it accepts the exact schema definition directory
- **AND** it retains existing font and third-party-toolchain checks

## ADDED Requirements

### Requirement: Schema definitions name current owners and author repair context

Each `flow.yaml` transformation SHALL identify its declared input stage or
shared contract, output stage or shared contract, materialized current owner or
stable owning capability, and invalidation cause. Every declared stage has such
an owner; a route reference, planned status, planned change, or speculative
implementation path SHALL NOT substitute for one. Each derived stage definition
SHALL state the provenance needed to identify its upstream source or
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
separate. The `story-outline`, `design-constraints`, `page-source`,
`layout-config`, and `page-layout` definitions SHALL name their existing
current producers and consumers, direct inputs and outputs, workflow-isolation
boundary, provenance, and invalidation causes.

#### Scenario: A constrained page field needs author guidance

- **WHEN** a maintainer inspects a constrained field in a stage definition
- **THEN** the definition states the deterministic rule and a complete
  `means`/`ask`/`never` Repair Guidance block
- **AND** the guidance describes the next content decision without naming the
  source field or schema filename to a Deck Author

#### Scenario: A maintainer traces a derived page artifact

- **WHEN** a maintainer needs to determine what changes after a source or
  configuration edit
- **THEN** they can follow `flow.yaml` and the derived artifact's provenance to
  identify the owning transformation and invalidated downstream artifact
- **AND** they do not treat collaboration guidance as execution authority

#### Scenario: A maintainer inspects a declared stage owner

- **WHEN** a maintainer inspects a schema stage or flow transformation
- **THEN** it identifies a current materialized owner or stable owning
  capability and its direct contract relation
- **AND** it does not expose implementation-route progress as schema meaning

#### Scenario: A maintainer traces Page Class ownership

- **WHEN** a maintainer opens the Page Source, layout-config, and page-layout
  definitions
- **THEN** the current producer/consumer flow identifies source ownership,
  workflow-isolated resolution, provenance, and selected-profile invalidation
- **AND** it does not group Pure presentation under visual language or describe
  an alternate selector path
