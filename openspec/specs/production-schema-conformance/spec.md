# production-schema-conformance Specification

## Purpose

Define the one current, schema-owned production serialization contract for the
Harness and prove that active implementation consumers conform to it without
introducing a runtime controller or historical compatibility path.

## Requirements

### Requirement: Active durable contracts have one unversioned schema authority

The Harness SHALL maintain `ppt_maker_harness/schema/serialization-contracts.yaml`
as the authoritative inventory for every active Page Image and directly affected
shared-Harness durable contract. The inventory SHALL declare an unversioned
lowercase-hyphenated identifier grammar, current pipeline/mode/identity
selectors, conceptual stage names, permitted `artifact_role` values, named
shared contracts, field ownership, and stable code anchors.

A Page Image artifact's `schema` SHALL identify exactly one declared stage definition.
When more than one physical record or projection realizes that stage, the
artifact SHALL use the declared unversioned `artifact_role` discriminator.
Existing `kind` fields SHALL retain their established business/action meaning
and SHALL NOT become a serialization-role substitute. A shared Harness object
outside the Page Image stage vocabulary SHALL use its named contract declaration
at its explicitly declared field.

`frozen-identifiers.yaml` and any replacement exception list for historical,
legacy, or version-suffixed current contracts SHALL NOT exist. The inventory is
descriptive source authority only: it SHALL NOT become a runtime lifecycle
controller, CLI command, state schema, provider gate, or second source of
record.

#### Scenario: A current Page Image record is inspected

- **WHEN** a maintainer inspects a current Page Image receipt, plan, record, or
  delivery artifact
- **THEN** its `schema` resolves to one declared stage definition and any
  `artifact_role` resolves to that stage's declared role
- **AND** no version suffix or hidden code-only contract is needed to interpret it

#### Scenario: A shared durable contract is inspected

- **WHEN** a maintainer inspects an active shared-Harness locator or catalog
- **THEN** its declared contract value and owning field resolve in
  `serialization-contracts.yaml`
- **AND** it does not impersonate a Page Image stage or rely on a code-only
  historical literal

### Requirement: The active Harness performs a clean serialization cutover

All active source, state, receipt, record, protocol, mode, identity,
idempotency, locator, catalog, template, test, and operational-document
consumers SHALL use only values declared by the current serialization inventory.
An active reader and writer SHALL cut over together; the Harness SHALL NOT
retain a legacy reader, compatibility branch, byte scanner, converter,
migration path, dual writer, historical fixture, or frozen-name exemption.

An input whose contract value is not exactly the declared current value SHALL
fail through the existing owning validator before mutation, derived-artifact
read, provider initialization, or lifecycle transition. The owner SHALL NOT
classify, parse, translate, export, adopt, or resume it as a known historical
format.

The clean cutover SHALL NOT read, write, migrate, inspect as a fixture, or
delete any Run Bundle or research input. Archived OpenSpec artifacts and Backlog
decision records are historical documentation only and are not active contract
consumers.

#### Scenario: An undeclared contract reaches a current owner

- **WHEN** source, state, receipt, record, or locator input carries a value that
  is absent from the current inventory
- **THEN** the owner rejects it before dependent mutation or provider work
- **AND** it does not scan its bytes for a historical format or offer conversion

#### Scenario: A maintainer searches the active implementation surface

- **WHEN** the conformance sweep scans active Harness source, tests, test E2E
  files, templates, operational documents, and accepted specifications
- **THEN** it finds no version-suffixed production identifier, frozen inventory,
  compatibility reader, migration path, or undeclared contract-bearing value
- **AND** archived change artifacts, Backlog history, Run Bundles, and research
  data are outside that scan

### Requirement: Static conformance remains dependency-safe and non-runtime

The Harness SHALL expose a pure production-schema conformance evaluator from
`scripts/contracts/harness_architecture.mjs`. It SHALL accept a plain snapshot
of parsed declarations, literal occurrences, contract-field assignments, and
anchors; it SHALL neither read files nor import `yaml`.

The protected core architecture test SHALL use synthetic snapshots only. A
separate opt-in contracts test MAY parse the YAML and build the real snapshot
before invoking the same evaluator. Both tests SHALL reject a missing
declaration, invalid stage/role relationship, missing anchor, undeclared field
value, or prohibited version-suffixed production literal.

The conformance evaluator and test SHALL NOT be invoked by production startup
or introduce a runtime gate, state mutation, diagnostic envelope, or recovery
path. Existing owning validators remain the runtime authority.

#### Scenario: The protected core evaluates synthetic data

- **WHEN** the architecture-core test evaluates a synthetic contract snapshot
- **THEN** it uses the pure evaluator without importing or parsing YAML
- **AND** an invalid declaration or stage/role relation fails deterministically

#### Scenario: The opt-in sweep detects code-to-schema drift

- **WHEN** a current contract literal is changed, removed, or introduced without
  a matching schema declaration and anchor
- **THEN** the opt-in conformance test fails with the direct mismatch
- **AND** it does not invoke a runtime owner, write source/state, or begin
  provider work

#### Scenario: A numeric Harness marker cannot bypass the sweep

- **WHEN** active source, test, operational document, or accepted spec adds a
  numeric schema/revision/compiler/manifest/report marker
- **THEN** the sweep fails unless the occurrence is a declared Run Bundle Work
  Version, declared scope-bound lifecycle ordinal, or external environment fact
- **AND** it does not rely on a version-suffix or identifier-prefix allowlist

### Requirement: Framed protected-composition fields remain schema-declared and static

The schema README and active `page-source-receipt`, `layout-config`,
`page-layout`, and `image2-request` stage definitions SHALL collectively
declare the current Framed composition boundary: the source-owned closed subject-restriction fact
on both workflows' receipts; one CSS-pixel Framed `header_region`; one
profile-derived `protected_composition` with `coordinate_space:
normalized-canvas`, reserved-header and full-width body-safe regions plus
provenance; and the absence of a local-header field or header-derived context
from the Framed provider-request shape. Independently source-owned provider
content may retain a matching literal. The declarations SHALL identify their
existing producer, input, downstream consumer, invalidation, and Framed/Pure
scope without becoming a runtime planner, provider gate, review decision, or
alternate authority.

The opt-in production-schema conformance sweep SHALL validate a synthetic
Framed publication/request for those declared bindings and a Pure publication
that retains its source restriction only at the receipt/ordinary
identity-resolution boundary while omitting all Framed composition and
Framed request bindings. It SHALL report a direct schema mismatch for a missing
source restriction, `header_region`, or Framed composition provenance; an
undeclared request field; a serialized local-header field or header-derived
context in a Framed request; a former `protected_geometry` field; or a
Framed-only binding on Pure. Runtime source/configuration and adapter validators
remain the owning checks.

#### Scenario: A Framed composition publication matches declared ownership

- **WHEN** the opt-in sweep inspects a synthetic valid Framed composition publication
- **THEN** it finds declared source restriction, `header_region`, normalized
  composition formula/provenance, and local-only-header/request boundaries
- **AND** the check remains provider-free and does not create a lifecycle or
  review decision

#### Scenario: Schema drift cannot become a runtime control path

- **WHEN** a synthetic Framed composition request contains a local-header field or
  header-derived context, or a Pure publication contains a Framed
  protected-composition or Framed request binding, or an active Framed
  declaration retains `protected_geometry`
- **THEN** the opt-in sweep reports the direct static mismatch
- **AND** it does not call a provider, mutate source/state, or add an
  authorization or recovery path

### Requirement: Published page-derived data conforms to declared stage ownership

The active serialization inventory and stage definitions SHALL declare the
published forms of `page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, `framed-header-html`, and
`page-artifact-index`, including their exact producer, derived scope,
provenance, and current materialization status. `page-render-model` and
`page-artifact-index` SHALL no longer retain a planned-only producer status
after this change is applied.

The opt-in conformance sweep SHALL verify that a derived-data publisher emits only the
declared current stage/role values and that each page artifact supplies the
required identity, producer, provenance, invalidation bindings, and
workflow-specific absence/presence rules. The static evaluator remains
non-runtime; runtime planning continues to use its existing owning validators
rather than the conformance sweep.

#### Scenario: A published Framed chain matches its declared stages

- **WHEN** conformance inspects a synthetic valid Framed derived publication
- **THEN** it finds one declared artifact for every required stage, one HTML
  header artifact, and no duplicate header-controller JSON
- **AND** every artifact binds the same stable page identity and current plan lineage

#### Scenario: A materialized artifact drifts from its schema declaration

- **WHEN** a derived-data writer emits an undeclared role, omits required provenance, or
  gives a Pure page a Framed-only artifact
- **THEN** the opt-in conformance test reports the direct schema mismatch
- **AND** it does not become a runtime gate, provider call, or compatibility path

### Requirement: Active production surfaces have no retired protocol residue

The provider-free production-schema conformance sweep SHALL inspect only
`ppt_maker_harness/`, `tests/`, `tests_e2e/`, `openspec/specs/`, and
`openspec/config.yaml` for three semantic residue categories: a numeric `vN`
identity coupled to a production source, state, receipt, plan, evidence, route,
adapter, candidate, or acceptance role; the retired compound invalid-protocol
action; and an affirmative claim that invalid protocol identity is read,
migrated, converted, adopted, exported, or handled through fallback. It SHALL
reject such an occurrence with its exact active path and bounded category. It
SHALL not read any `openspec/changes/` content, Backlog history, Run Bundle
production data, research data, or `_generated/` outputs.

The repository adapter SHALL enumerate every regular file under the declared
roots. It SHALL scan `.mjs`, `.md`, `.json`, `.yaml`, `.css`, `.html`, and `.txt`
as active text; it SHALL enumerate checked-in `.woff2` font assets as known
binary inputs without decoding them. Any other extension SHALL be an
unclassified coverage failure until explicitly admitted as text or binary.

The sweep SHALL distinguish ordinary structural snapshot notation such as a Run
Bundle `vN` directory or an exact requested/active execution-version mismatch
from production protocol identity. Structural notation remains valid only where
the owning run-bundle/version contract uses it; it SHALL not become an exception
for a production-role-coupled numeric identity. JavaScript `export` syntax,
unrelated-domain compatibility language, and normative specification text that
defines or forbids a residue category SHALL remain valid. The sweep is
repository verification only and SHALL not be called by production startup,
mutate a bundle, or contact a provider.

#### Scenario: A retired protocol category is planted in an active snapshot

- **WHEN** a focused test constructs a retired literal from neutral fragments
  and plants a production-role-coupled numeric identity, competing action, or
  affirmative invalid-input recovery claim in supplied active-surface text
- **THEN** the conformance sweep reports the exact active path and category and
  fails without a scanner exception for its own test
- **AND** restoring the exact synthetic or temporary input passes without a
  write or provider call

#### Scenario: A structural version literal is not misclassified

- **WHEN** a valid active run-bundle test or guidance document names a normal
  `vN` structural snapshot directory or an exact execution-version mismatch
- **THEN** the sweep accepts that structural usage
- **AND** it does not treat the literal as an alternate production protocol

#### Scenario: Generic language is not a residue category

- **WHEN** active source contains JavaScript `export` syntax, unrelated-domain
  compatibility wording, or normative specification text that defines or
  forbids a residue category
- **THEN** the sweep accepts that occurrence
- **AND** it does not use a zero-token policy as a substitute for claim
  classification

#### Scenario: A new text surface cannot silently escape the scan

- **WHEN** a focused coverage control supplies a regular file with an
  unclassified text-like extension under a declared active root
- **THEN** the repository adapter reports its exact path as an unclassified
  coverage failure
- **AND** restoring the declared text/binary classification makes the same
  coverage checkpoint pass
