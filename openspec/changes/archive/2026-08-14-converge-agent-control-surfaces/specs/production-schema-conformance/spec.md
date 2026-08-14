## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Active control declarations have one current inventory

The serialization inventory and bounded static conformance checks SHALL declare
only active control contracts with a live owner and consumer. They SHALL not
declare an Intent Route Catalog, Agent prompt cookbook, duplicate
workflow-inspection prose projection, `production_mode`, or
`supported_production_modes`. The current state identity declaration SHALL
name only `production_identity.by_version` with exact `workflow` and
`source_epoch` fields.

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
