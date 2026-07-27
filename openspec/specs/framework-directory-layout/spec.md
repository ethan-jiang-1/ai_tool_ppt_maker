# Framework Directory Layout Specification

## Purpose

Define the current framework directory map. It exposes Page Authority ownership,
its retained private runtime seams, and bounded historical observation/adoption
without publishing a second production owner.

## Requirements

### Requirement: Framework layout has no retired production owner

The framework directory map and executable inventory SHALL expose the Page
Authority adapter and retained runtime seams, but SHALL NOT expose retired
production owners.

#### Scenario: Script inventory is audited

- **WHEN** framework executable ownership is validated
- **THEN** every registered production executable belongs to Page Authority or a retained private runtime seam

### Requirement: Framework source and production data stay separate

Framework source SHALL remain under `PPTMAKER_FRAMEWORK/`, `openspec/`, `tests/`,
and `tests_e2e/`. Deck and research directories are user-owned production data and
shall not become framework implementation roots.

#### Scenario: A deck is initialized

- **WHEN** a run bundle is created
- **THEN** generated and source data are created under the deck, not framework source directories
