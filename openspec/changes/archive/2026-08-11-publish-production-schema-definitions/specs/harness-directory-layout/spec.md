## ADDED Requirements

### Requirement: Harness exposes one authoritative production schema definition home

The Harness SHALL expose `ppt_maker_harness/schema/` as the single authoritative
definition home for the conceptual Page Image production schemas. It SHALL be
separate from Run Bundles and contain a `README.md` that states the authority
boundary, `META.yaml` that defines the required definition shape, `flow.yaml`
that describes transformations, `stages/` with exactly the nineteen conceptual
stage definitions, `recovery-route.yaml`, and `frozen-identifiers.yaml`.

The nineteen stage definitions SHALL use the established unversioned vocabulary:
`story-outline`, `visual-language`, `design-constraints`, `layout-config`,
`page-source`, `page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, `framed-header-html`,
`page-artifact-index`, `image-generation-plan`, `image-generation-record`,
`page-review-decision`, `final-page-list`, `delivery-package`,
`visual-style-candidates`, and `production-progress-state`.

The definition home SHALL state that its YAML definitions own the conceptual
vocabulary; code constants are not a competing vocabulary authority. This
requirement SHALL NOT move, migrate, or rewrite any Run Bundle source, derived,
state, or record data.

`recovery-route.yaml` SHALL be the structured authority for the C1-C7 Page
Image recovery-route labels used by planned-owner citations. Every entry SHALL
state its change or work, execution kind, responsibility, boundary, and exit
evidence; the README SHALL make that authority discoverable. The route SHALL
distinguish its labels from workflow phases, schema names, runtime owners, and
authorizations. Every stage or flow entry with `producer_status: planned` SHALL
use a `route_ref` that resolves to one entry in this route.

The parent Harness source-directory map and the existing static Harness-root
directory assertion SHALL include `schema/`. The assertion update SHALL only
recognize this additional directory and SHALL retain its font-authority and
third-party-font-toolchain coverage.

`tests/contracts/test_page_image_schema_definitions.mjs` SHALL validate the
definition home's exact stage-name set, each stage's declared schema name,
Repair Guidance for every field with a `rule`, the complete C1-C7 route, and
every planned producer's resolvable `route_ref`. It SHALL be registered in the
contracts test-owner ledger and use the existing `yaml` dependency. The schema
README SHALL identify this test as the verification owner but SHALL NOT embed
an executable validation implementation.

#### Scenario: A maintainer inspects production schemas

- **WHEN** a maintainer opens the Harness schema definition home
- **THEN** they can locate the authority boundary, all nineteen stage definitions,
  the complete transformation flow, frozen identifier inventory, and C1-C7
  route-label authority without inspecting a Run Bundle, Backlog plan, or following
  implementation imports

#### Scenario: A planned producer is inspected

- **WHEN** a maintainer encounters a planned producer in a stage definition or
  `flow.yaml`
- **THEN** its `route_ref` resolves in `recovery-route.yaml` to the named change
  or production work, responsibility, boundary, and exit evidence
- **AND** the reference does not imply that the later work is authorized or
  materialized

#### Scenario: Schema definitions are regression-tested

- **WHEN** the schema-contract test is run as a targeted sweep
- **THEN** it rejects a missing or extra stage, incomplete Repair Guidance,
  incomplete C1-C7 route entry, or unresolved planned-producer reference
- **AND** the schema README remains an explanatory entry document rather than
  a host for test implementation

#### Scenario: A historical identifier is inspected

- **WHEN** a maintainer considers renaming a persisted Page Image identifier
- **THEN** `frozen-identifiers.yaml` distinguishes historical record-schema
  identifiers from still-written protocol, mode, and identity literals
- **AND** it names the specific unreadable or invalid evidence each frozen
  identifier protects

#### Scenario: The Harness root gains the schema definition home

- **WHEN** the static Harness-root directory assertion runs after `schema/` is
  added
- **THEN** it accepts the required `schema/` directory
- **AND** it continues to verify the sole canonical font authority and absence
  of a third-party font toolchain

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
