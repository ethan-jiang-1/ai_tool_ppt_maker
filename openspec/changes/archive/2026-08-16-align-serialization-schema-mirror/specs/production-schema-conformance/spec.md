# Production Schema Conformance Specification (delta)

## MODIFIED Requirements

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
