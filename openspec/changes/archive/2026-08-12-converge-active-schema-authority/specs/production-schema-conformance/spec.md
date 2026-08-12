## MODIFIED Requirements

### Requirement: Active durable contracts have one unversioned schema authority

The Harness SHALL maintain `ppt_maker_harness/schema/serialization-contracts.yaml`
as the authoritative inventory for every active Page Image and directly affected
shared-Harness durable contract. The inventory SHALL declare an unversioned
lowercase-hyphenated identifier grammar, current pipeline/mode/identity
selectors, declared conceptual stage names, permitted `artifact_role` values, named
shared contracts, field ownership, and stable code anchors.

A Page Image artifact's `schema` SHALL identify exactly one declared conceptual
stage definition.
When more than one physical record or projection realizes that stage, the
artifact SHALL use the declared unversioned `artifact_role` discriminator.
Existing `kind` fields SHALL retain their established business/action meaning
and SHALL NOT become a serialization-role substitute. A shared Harness object
outside the Page Image stage vocabulary SHALL use its named contract declaration at
its explicitly declared field.

`frozen-identifiers.yaml` and any exception list for undeclared, version-suffixed
contracts SHALL NOT exist. The inventory is
descriptive source authority only: it SHALL NOT become a runtime lifecycle
controller, CLI command, state schema, provider gate, or second source of
record.

#### Scenario: A current Page Image record is inspected

- **WHEN** a maintainer inspects a current Page Image receipt, plan, record, or
  delivery artifact
- **THEN** its `schema` resolves to one declared conceptual stage definition and any
  `artifact_role` resolves to that stage's declared role
- **AND** no version suffix or hidden code-only contract is needed to interpret it

#### Scenario: A shared durable contract is inspected

- **WHEN** a maintainer inspects an active shared-Harness locator, state, or
  report
- **THEN** its declared contract value and owning field resolve in
  `serialization-contracts.yaml`
- **AND** it does not impersonate a Page Image stage or rely on an undeclared
  code-only literal

### Requirement: The active Harness performs a clean serialization cutover

All active source, state, receipt, record, protocol, mode, identity,
idempotency, locator, catalog, template, test, and operational-document
consumers SHALL use only values declared by the current serialization inventory.
An active reader and writer SHALL cut over together; the Harness SHALL NOT
retain an alternate reader, byte scanner, converter, dual writer, fixture, or
frozen-name exemption for an undeclared contract.

An input whose contract value is not exactly the declared current value SHALL
fail through the existing owning validator before mutation, derived-artifact
read, provider initialization, or lifecycle transition. The owner SHALL NOT
classify, parse, translate, export, adopt, or resume it.

The clean cutover SHALL NOT read, write, migrate, inspect as a fixture, or
delete any Run Bundle or research input. Archived OpenSpec artifacts and
Backlog decision records are historical documentation only and are not active
contract consumers.

#### Scenario: An undeclared contract reaches a current owner

- **WHEN** source, state, receipt, record, or locator input carries a value that
  is absent from the current inventory
- **THEN** the owner rejects it before dependent mutation or provider work
- **AND** it does not scan its bytes for another format or offer conversion

#### Scenario: A maintainer searches the active implementation surface

- **WHEN** the conformance sweep scans active Harness source, tests, test E2E
  files, templates, operational documents, and accepted specifications
- **THEN** it finds no Harness-owned schema/protocol/compiler/manifest/
  diagnostic/report numeric marker, frozen inventory, alternate reader, or
  undeclared contract-bearing value
- **AND** archived change artifacts, Backlog history, Run Bundles, research
  data, package dependency metadata, and external tool facts are outside that
  scan

### Requirement: Static conformance remains dependency-safe and non-runtime

The Harness SHALL expose a pure production-schema conformance evaluator from
`scripts/contracts/harness_architecture.mjs`. It SHALL accept a plain snapshot
of parsed declarations, literal and constant-backed occurrences,
contract-field assignments, exact stage/role/envelope observations, and anchors;
it SHALL neither read files nor import `yaml`.

The protected core architecture test SHALL use synthetic snapshots only. A
separate opt-in contracts test MAY parse the YAML and build the real snapshot
before invoking the same evaluator. Both tests SHALL reject a missing
declaration, invalid stage/role relationship, missing or mismatched anchor,
undeclared field value, prohibited Harness-owned generation marker, or a
shadow copy that disagrees with schema authority. The real sweep SHALL cover
`ppt_maker_harness/`, `tests/`, `tests_e2e/`, maintained operational
Markdown/templates, and `openspec/specs/` using semantic exclusions rather than
an identifier-prefix whitelist. A retained scope-bound lifecycle ordinal, such
as Style Master `plan_generation`, SHALL be declared as an ordering fact within
one exact Work Version/workflow scope; it SHALL NOT be treated as a selectable
Harness schema, reader, compiler, protocol, report, or manifest generation.

The conformance evaluator and test SHALL NOT be invoked by production startup
or introduce a runtime gate, state mutation, diagnostic envelope, or recovery
path. Existing owning validators remain the runtime authority.

#### Scenario: The protected core evaluates synthetic data

- **WHEN** the architecture-core test evaluates a synthetic contract snapshot
- **THEN** it uses the pure evaluator without importing or parsing YAML
- **AND** an invalid declaration, stage/role/envelope relation, or shadow copy
  fails deterministically

#### Scenario: The opt-in sweep detects code-to-schema drift

- **WHEN** a current literal, constant-backed marker, field assignment, or
  stage/role envelope is changed, removed, or introduced without a matching
  schema declaration and exact anchor
- **THEN** the opt-in conformance test fails with the direct mismatch
- **AND** it does not invoke a runtime owner, write source/state, or begin
  provider work

#### Scenario: A numeric Harness marker cannot bypass the sweep

- **WHEN** active source, test, operational document, or accepted spec adds a
  numeric schema/revision/compiler/manifest/report marker
- **THEN** the sweep fails unless the occurrence is a declared Run Bundle Work
  Version, declared scope-bound lifecycle ordinal, or external environment fact
- **AND** it does not rely on a version-suffix or identifier-prefix allowlist
