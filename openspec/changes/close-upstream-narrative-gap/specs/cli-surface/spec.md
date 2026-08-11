## ADDED Requirements

### Requirement: Slides CLI previews narrative page plans through the structural interface
The existing `ppt_flow slides` command family SHALL expose a narrative page-plan
preview for one exact current run. The preview SHALL accept one Agent-authored
page-grouping candidate confined to that run's `_scratch/`, read the current
canonical narrative sources, selected Visual Language, and canonical page
source, and return the provenance-carrying structural plan identity and a
confined non-authoritative plan location. It SHALL not alter canonical page
source, State, lifecycle evidence, review, delivery, or provider state, and it
SHALL make zero provider calls.

The returned plan SHALL be applied only through the existing `slides apply-plan`
exact-plan form with explicit `--apply` and the matching plan hash. The CLI
shall not expose a force, legacy-outline, migration, direct-source-write, or
provider flag for narrative planning or publication.

#### Scenario: Agent previews a page plan
- **WHEN** the Agent invokes the narrative page-plan preview for a current run
  with valid current inputs
- **THEN** the CLI returns the ordered pages, their bounded provenance, exact
  plan hash, and confined plan location
- **AND** it does not create a target version, mutate source/state, or invoke a
  provider

#### Scenario: Narrative input is invalid or stale
- **WHEN** the preview or exact-plan apply cannot establish current narrative
  inputs, source bytes, plan identity, or target binding
- **THEN** the CLI emits the registered bounded diagnostic with one nearest
  action to repair or regenerate the plan
- **AND** it does not publish a target source, infer a legacy outline, or offer
  force or migration behavior
