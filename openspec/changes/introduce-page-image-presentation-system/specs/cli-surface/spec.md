## MODIFIED Requirements

### Requirement: Run-scoped CLI accepts only current Page Image Workflow identity

Before a run-scoped Page Image command reads lifecycle, generated artifacts, or
provider configuration, CLI routing SHALL use the shared marker-first evaluator
to require exact `page-authority-image2-v2` source and
`image2-page-authority-v2` State identity with one selected workflow. A
non-V2, partial, hybrid, or mismatched pair SHALL return the owner-issued
`unsupported-protocol/export` or identity hard-stop before dispatch or writes.

#### Scenario: Non-V2 input has no CLI lifecycle route

- **WHEN** a run-scoped command receives non-V2 source/state identity
- **THEN** it returns one bounded hard-stop before receipt, State, generated
  artifact, or provider work
- **AND** it does not expose a compatibility command or recovery mutation

#### Scenario: An inactive production request is fenced before work

- **WHEN** a V2 mutation targets a run version other than State's active
  execution version
- **THEN** CLI emits the registered `execution_run_version_mismatch` failure
  envelope and its non-writing active-run `inspect` action before derived reads,
  provider initialization, generated-artifact or State/history writes
- **AND** it does not retarget the request automatically

#### Scenario: A v2 production request is fenced before work

- **WHEN** a V2 mutation has valid identity but an inactive execution version
- **THEN** it is fenced by the same active-execution diagnostic before work
- **AND** it is not confused with the non-V2 protocol hard-stop

## ADDED Requirements

### Requirement: V2 Image2 plan reports its Pre-Production Data View locator

Successful V2 `image2 plan <run-dir>` SHALL retain its machine-oriented plan
result and add the canonical run-relative Pre-Production Data View locator. The
locator names only the generated root; it shall not serialize raw prompt prose,
credentials, provider responses, package contents, a selector, or lifecycle
authority.

Command grammar, accepted hash arguments, Task Mandate behavior, and
provider-free planning remain unchanged. Identity, source, presentation, or
plan failures retain the existing producer-owned bounded diagnostic and one
nearest legal action.

#### Scenario: Successful V2 plan exposes a safe control-view locator

- **WHEN** V2 Pure or Framed planning publishes a valid plan and Data View
- **THEN** success JSON contains the run-relative locator
- **AND** it adds no option, provider initialization, or raw prompt prose

#### Scenario: Invalid presentation source prints no stale success locator

- **WHEN** V2 planning cannot resolve its presentation package
- **THEN** CLI emits the bounded source/configuration diagnostic before raw
  planning or provider initialization
- **AND** it prints no stale locator or fallback
