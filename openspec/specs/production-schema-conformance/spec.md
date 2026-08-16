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
lowercase-hyphenated identifier grammar, current pipeline, workflow, and
production-identity selectors, conceptual stage names, permitted
`artifact_role` values, named shared contracts, field ownership, and stable code
anchors.

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

### Requirement: Active control declarations have one current inventory

The serialization inventory and bounded static conformance checks SHALL declare
only active control contracts with a live owner and consumer. They SHALL not
declare an Intent Route Catalog, Agent prompt cookbook, duplicate
workflow-inspection prose projection, `production_mode`, or
`supported_production_modes`. The current state identity declaration SHALL
name only `production_identity.by_version` with exact `workflow` and
`source_epoch` fields.

The current state shape declaration SHALL mirror the active top-level state
keys exactly: every key the state owner reads or writes
(`pipeline`, `production_identity`, `page_image_raw_provider_authorization`,
`page_image_target_evidence`, `page_image_progressive_handoff`,
`page_image_task_mandate`, `page_image_style_master`, `playbook`,
`current_node`, `execution_id`, `execution_started_at`, `run_version`,
`continuation_target_version`, `started_at`, `updated_at`, `nodes`, `gates`,
`deck`, `playbook_stack`, `diagnostics`) SHALL be declared in
`current_state_shape`, with the state-owner required fields distinguished from
the active-execution added fields. A schema value with no live code consumer
SHALL NOT remain declared: `page-image-provider-input`,
`page-image-raw-contract`, and the retired hybrid
`pptmaker-page-image-raw-manifest` SHALL be removed from the wire-schema
inventory, and the raw-manifest declaration SHALL keep only the current
`page-image-raw-manifest` value (the current accepted-raw-evidence schema is
`page-image-progressive-accepted-raw-evidence`).

The provider-free active-surface evaluator SHALL inspect only the declared
`ppt_maker_harness/` source, `tests/`, `tests_e2e/`, root `AGENTS.md` and
`CONTEXT.md`, accepted main specs, and OpenSpec configuration for those retired
control names and report an exact path/category. It SHALL not inspect active
change artifacts, archived changes, Backlog history, Run Bundles, research
data, or generated outputs. The evaluator remains test-only and SHALL not
become runtime routing, state mutation, provider work, or a second control
owner.

#### Scenario: A stale control declaration is planted

- **WHEN** a focused synthetic or temporary active-surface input contains a
  retired route, prompt, metadata, or production-mode declaration
- **THEN** the static evaluator reports its exact path and residue category
- **AND** restoring the input passes without repository mutation or provider
  work

#### Scenario: The current identity declaration is complete

- **WHEN** conformance inspects a current state contract declaration
- **THEN** it finds only the declared production-identity fields and their
  current owner anchors
- **AND** no alternate mode, catalog, or compatibility contract is accepted

#### Scenario: State keys mirror the state owner exactly

- **WHEN** conformance compares `current_state_shape` against the state owner's
  active top-level key set
- **THEN** every state-owner read/write key is declared with its required or
  active-execution role
- **AND** no state key is readable only through code without a schema
  declaration

#### Scenario: A wire schema with no consumer is rejected

- **WHEN** conformance inspects the wire-schema inventory for a value with no
  live code consumer
- **THEN** it rejects the orphan value and names the declared current value
  instead
- **AND** no two-generation hybrid name remains a declared alternative

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

### Requirement: Page Design System bindings remain schema-declared and workflow-symmetric

The active serialization inventory and current Page Image stage declarations
SHALL declare the Page Design System's exact ownership boundary. The inventory
SHALL register the resolver's local `page-image-design-system-binding` under a
dedicated `layout-config` wire-schema group with role
`version-design-system-binding`, separate from the existing
`version-presentation-source` group; that in-memory source/configuration
binding is neither a `shared_contracts` entry nor a stage artifact envelope.
Adapter raw contracts retain nullable
`page_design_system` text/digest facts; Page Image Core and
ordinary/progressive raw-plan bindings retain nullable
`page_design_system_sha256`; and each declared `image2-request` contains one
top-level `design_system` text-or-null field. The declarations SHALL identify
the source/configuration producer, adapter compiler, plan and derived-request
consumers, invalidation input, and Pure/Framed applicability without becoming a
runtime resolver, lifecycle controller, or alternate provider authority.
These declarations and the conformance evaluator describe only current
production shapes. A bounded progressive cutover validator may recognize one
exact former immutable plan for reconciliation/head-lineage purposes, but it
does not make that former plan conforming, current, or eligible for a declared
provider-work contract.

The provider-facing declaration SHALL exclude source paths, source origin,
SHA-256 values, plan identifiers, authorization facts, and lifecycle facts from
`design_system`. It SHALL retain the existing workflow-specific exclusions:
Pure receives no Framed composition or local-header facts, and Framed retains
its protected-composition and local-header/request boundary. The inventory and
stage declarations SHALL NOT classify the Pure-only deck visual-system object
as the shared Page Design System.

The opt-in static conformance sweep SHALL verify synthetic valid Pure and
Framed request chains with matching nullable bindings, exact text/digest
pairing, and provider-facing text/null only. It SHALL report a direct static
schema mismatch for a missing, extra, asymmetric, or digest-mismatched binding;
a missing provider field; a path, origin, digest, authorization, or lifecycle
field in provider-facing `design_system`; cross-workflow fact leakage; or a
request whose declared full canonical size bound is violated. It SHALL also
report a direct mismatch when active source emits the local binding schema
without its `layout-config` wire-schema declaration. This static check remains
provider-free and non-runtime; the source resolver and selected adapter remain
the owning runtime validators.

#### Scenario: A declared Pure and Framed chain carries one shared binding

- **WHEN** conformance inspects synthetic valid current Pure and Framed
  page-derived request chains with the same non-null Page Design System text
- **THEN** it finds the declared raw-contract text/digest pair, matching nullable
  core and plan digest, and the exact provider-facing text field in both chains
- **AND** it finds no provider-facing lineage facts or cross-workflow leakage

#### Scenario: Provider-facing lineage leakage fails static conformance

- **WHEN** a synthetic `image2-request` adds a Page Design System path,
  source-origin field, SHA-256, authorization fact, or lifecycle fact to its
  `design_system` representation
- **THEN** the conformance sweep reports the direct declared-schema mismatch
- **AND** it does not call a provider, mutate a Bundle, or become a runtime
  gate

#### Scenario: Nullable binding shape drift fails static conformance

- **WHEN** a synthetic raw contract, Core binding, ordinary plan, progressive
  plan, or derived request omits its required nullable Page Design System field
  or contains an asymmetric text/digest pair
- **THEN** the conformance sweep reports the direct shape mismatch
- **AND** it does not infer a value, patch a record, or accept a former plan as
  a current conforming plan

#### Scenario: Local binding declaration cannot disappear

- **WHEN** active Visual Config source emits
  `page-image-design-system-binding` but the serialization inventory omits its
  dedicated `layout-config` `version-design-system-binding` wire-schema
  declaration
- **THEN** the conformance sweep reports the direct undeclared-contract
  mismatch
- **AND** it does not treat local-only scope as an inventory exception, create
  a runtime gate, or mutate a Bundle

### Requirement: Image2 capability profile bindings remain schema-declared

The active serialization inventory and applicable `layout-config`, Style
Master generation-profile, Page Image generation-profile, plan,
`image2-request`, and provider-request declarations SHALL describe the current
Image2 capability boundary. They SHALL declare the unversioned local resolved
profile binding, its exact two operations, the closed prompt-budget units,
positive data-driven limits, full profile digest, operation capability
projection, and existing generation-profile digest closure through plans,
authorizations, requests, attempts, provenance, and invalidation.

The declaration SHALL identify the canonical Run Bundle source/configuration
producer and runtime consumers without making the inventory a source parser,
route catalog, provider probe, lifecycle controller, or second capability
authority. It SHALL distinguish `IMAGE2_PROVIDER_PROFILE_ID` as non-secret
runtime environment identity from the source profile; API keys and base URLs
SHALL remain outside persisted profile bindings and schema examples.
Inspection SHALL be declared only as a non-authoritative projection of bound
profile identity, operation, budget, measurement, and digests.

The opt-in provider-free conformance sweep SHALL accept ordinary synthetic
profiles whose limits include 4,000, 16,000, and a third arbitrary positive
safe integer under each closed unit. It SHALL reject an unknown operation/unit,
non-positive or special-kind limit, missing profile digest, generation-profile
projection not closed into its plan/request binding, capability stored in
State/inspection as authority, or credentials/base URL stored in the profile.
Runtime source and lifecycle validators remain the owning checks.

#### Scenario: Declared operations close into existing lifecycle digests

- **WHEN** conformance inspects valid synthetic Style Master and Page Image
  profile-bound chains
- **THEN** it finds each operation capability inside its generation profile and
  the existing downstream plan/request/attempt digest closure
- **AND** it finds no duplicate capability authorization, State ledger,
  credential, base URL, or inspection-owned route selection

#### Scenario: Arbitrary limits do not become schema branches

- **WHEN** synthetic valid profiles use limits 4,000, 16,000, and 12,347 with
  a declared closed unit
- **THEN** the static contract accepts all three as ordinary positive data
- **AND** it reports a mismatch if any number is represented as a special
  profile kind, schema variant, or fallback branch

#### Scenario: Provider secret leakage fails conformance

- **WHEN** a synthetic source/binding or persisted generation profile contains
  an API key, credential value, base URL, or provider response as capability
  evidence
- **THEN** the conformance sweep reports the direct schema/ownership mismatch
- **AND** it does not decode the secret, contact a provider, or mutate a Bundle

### Requirement: Compact provider requests have one declared bytes authority

The active `image2-request` and workflow-specific adapter declarations SHALL
describe one exact canonical prompt authority: the selected adapter's compact
UTF-8 serialization and matching `compiled_provider_input` digest. Pure SHALL
declare only its semantic instruction, Page Design System, provider-rendered
content, visual projection, and selected presentation profile. Framed SHALL
declare only its exact reservation instruction, Page Design System,
provider-rendered content, subject restrictions, normalized protected
composition, and visual projection. Both SHALL retain the semantic identity
role clause and their existing content/literal policies.

Provider-facing declarations SHALL exclude generation profiles, raw contracts,
profile identifiers/digests, presentation provenance, source paths/origins,
authorization/lifecycle facts, and structured lineage fields from prompt
shape. Local request wrappers and lifecycle declarations MAY retain those facts
outside `canonical_utf8` to establish attribution. The submitter SHALL be
declared as an opaque consumer of the exact compiled prompt and selected model,
not a prompt projector, compiler, or inspection reader.

The request declaration SHALL retain the 32,768 UTF-8-byte compiler safety
ceiling and add the selected operation's exact `{ limit, unit, measured }`
admission projection over the final canonical prompt. The static sweep SHALL
validate synthetic valid Pure and Framed requests, byte equality between
authorized compiled input and transport prompt, exact Framed instruction and
composition facts, and absence of a second derived prompt authority. It SHALL
reject lineage leakage, cross-workflow fields, transport-side prompt
derivation, an ambiguous count unit, or a request admitted above either bound.

#### Scenario: Valid Pure and Framed compact shapes remain distinct

- **WHEN** conformance inspects synthetic valid Pure and Framed request chains
- **THEN** each request contains its declared semantic-only workflow shape and
  the exact compiled bytes/digest submitted by transport
- **AND** Pure contains no Framed restriction/composition while Framed contains
  no Pure presentation profile or local-header literal

#### Scenario: Metadata leakage fails static conformance

- **WHEN** a synthetic provider prompt contains a generation profile, raw
  contract, profile digest, provenance, path/origin, authorization fact, or
  other declared lineage-only field
- **THEN** the conformance sweep reports the direct compact-request mismatch
- **AND** it does not sanitize, truncate, or transform the prompt into a
  conforming replacement

#### Scenario: Transport cannot create a second prompt

- **WHEN** a synthetic transport implementation submits bytes derived from a
  raw contract, inspection, or generation profile rather than the exact
  compiled input
- **THEN** the architecture guard detects the competing prompt authority
- **AND** the guard remains provider-free and creates no runtime gate or
  lifecycle mutation

#### Scenario: Exact budget declaration measures final prompt

- **WHEN** conformance inspects exact-boundary and one-over synthetic compact
  prompts containing ASCII, CJK, and emoji under each supported unit
- **THEN** it accepts only final prompt measurements at or below both declared
  bounds
- **AND** it rejects a source-length estimate, ambiguous `chars`, token count,
  or outer HTTP-body measurement as the request contract

### Requirement: Capability compiler cutover has no active legacy authority

Active Harness source, tests, operational guidance, and accepted specifications
SHALL use only the compact provider-input and confirmed capability-profile
contracts for current planning, authorization, and submission. They SHALL NOT
contain an old prompt/profile reader, dual writer, transport-side compact
projection, record patcher, automatic migration, fallback profile, or former-
plan submission fixture.

Immutable historical records MAY continue to validate their own direct digest
lineage for audit, exact unresolved-attempt reconciliation, and successor-head
predecessor binding. That validation SHALL NOT parse or normalize the former
prompt/profile shape, expose it as a current typed plan, or permit new batch,
grant, attempt, provider work, review, finalization, or delivery. The existing
bounded progressive historical bridge retains only its already declared
omission/reconciliation scope and SHALL NOT grow to own this compiler/profile
cutover.

The provider-free active-surface conformance sweep SHALL plant and detect a
transport compact-projection branch, hardcoded 4K/16K selection, inferred
default profile, and former-plan submission path while accepting normative text
that explicitly forbids those categories. Archived changes, Backlog records,
Run Bundles, research data, and generated outputs remain outside that sweep.

#### Scenario: Former prompt reader is rejected from active source

- **WHEN** a focused negative control plants a current-path reader or
  transport projection for the metadata-heavy provider prompt
- **THEN** the conformance sweep reports the exact active path and authority
  category
- **AND** restoring the input passes without reading a production Bundle or
  contacting a provider

#### Scenario: Historical digest evidence remains non-current

- **WHEN** a direct immutable historical record retains its internally bound
  former generation-profile or compiled-input digest
- **THEN** audit/reconciliation may preserve that exact digest lineage under
  its existing owner
- **AND** no active admission path parses the former shape, grants new work, or
  treats it as selected capability evidence
