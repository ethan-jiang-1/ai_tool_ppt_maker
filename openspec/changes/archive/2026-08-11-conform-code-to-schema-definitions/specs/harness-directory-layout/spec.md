## MODIFIED Requirements

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
