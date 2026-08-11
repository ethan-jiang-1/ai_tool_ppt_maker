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
selectors, C1 conceptual stage names, permitted `artifact_role` values, named
shared contracts, field ownership, and stable code anchors.

A Page Image artifact's `schema` SHALL identify exactly one C1 stage definition.
When more than one physical record or projection realizes that stage, the
artifact SHALL use the declared unversioned `artifact_role` discriminator.
Existing `kind` fields SHALL retain their established business/action meaning
and SHALL NOT become a serialization-role substitute. A shared Harness object
outside the C1 Page Image vocabulary SHALL use its named contract declaration
at its explicitly declared field.

`frozen-identifiers.yaml` and any replacement exception list for historical,
legacy, or version-suffixed current contracts SHALL NOT exist. The inventory is
descriptive source authority only: it SHALL NOT become a runtime lifecycle
controller, CLI command, state schema, provider gate, or second source of
record.

#### Scenario: A current Page Image record is inspected

- **WHEN** a maintainer inspects a current Page Image receipt, plan, record, or
  delivery artifact
- **THEN** its `schema` resolves to one C1 stage definition and any
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

### Requirement: Published page-derived data conforms to declared stage ownership

The active serialization inventory and stage definitions SHALL declare the C5
published forms of `page-source-receipt`, `page-layout`, `page-render-model`,
`page-generation-spec`, `image2-request`, `framed-header-html`, and
`page-artifact-index`, including their exact producer, derived scope,
provenance, and current materialization status. `page-render-model` and
`page-artifact-index` SHALL no longer retain a planned-only producer status
after this change is applied.

The opt-in conformance sweep SHALL verify that a C5 publisher emits only the
declared current stage/role values and that each page artifact supplies the
required identity, producer, provenance, invalidation bindings, and
workflow-specific absence/presence rules. The static evaluator remains
non-runtime; runtime planning continues to use its existing owning validators
rather than the conformance sweep.

#### Scenario: A published Framed chain matches its declared stages

- **WHEN** conformance inspects a synthetic valid Framed C5 publication
- **THEN** it finds one declared artifact for every required stage, one HTML
  header artifact, and no duplicate header-controller JSON
- **AND** every artifact binds the same stable page identity and current plan lineage

#### Scenario: A materialized artifact drifts from its schema declaration

- **WHEN** a C5 writer emits an undeclared role, omits required provenance, or
  gives a Pure page a Framed-only artifact
- **THEN** the opt-in conformance test reports the direct schema mismatch
- **AND** it does not become a runtime gate, provider call, or compatibility path
