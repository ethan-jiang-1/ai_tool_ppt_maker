## ADDED Requirements

### Requirement: Active control declarations have one current inventory

The serialization inventory and bounded static conformance checks SHALL declare
only active control contracts with a live owner and consumer. They SHALL not
declare an Intent Route Catalog, Agent prompt cookbook, duplicate
workflow-inspection prose projection, `production_mode`, or
`supported_production_modes`. The current state identity declaration SHALL
name only `production_identity.by_version` with exact `workflow` and
`source_epoch` fields.

The provider-free active-surface evaluator SHALL inspect the declared Harness
source, tests, test E2E, main specs, and OpenSpec configuration for those
retired control names and report an exact path/category. It SHALL not inspect
active change artifacts, archived changes, Backlog history, Run Bundles,
research data, or generated outputs. The evaluator remains test-only and SHALL
not become runtime routing, state mutation, provider work, or a second control
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
