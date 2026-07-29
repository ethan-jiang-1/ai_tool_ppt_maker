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

### Requirement: Framework layout exposes target sibling workflow ownership

The framework directory map SHALL expose `03-framed-image`, `04-pure-image`,
`05-delivery`, and `06-iteration` as target method-module owners. It SHALL
show `03` and `04` as mutually exclusive siblings, `05` as their single shared
delivery owner, and `06` as the version-workflow-aware iteration owner. It
SHALL keep shared source/visual and raw mechanics distinct from workflow
business owners and SHALL not expose a second target finalization, PPTX, notes,
or delivery owner.

The map may identify the bounded CURRENT v1 compatibility resolver, but it
SHALL NOT make that resolver a new-authoring workflow or retain undocumented
generic branches after target activation.

#### Scenario: Target directory ownership is audited

- **WHEN** framework directory layout is inspected after target activation
- **THEN** Framed, Pure, Delivery, and Iteration each have one declared owner and `03`/`04` are shown as XOR siblings
- **AND** no active directory path claims a second target delivery or generic authority owner
