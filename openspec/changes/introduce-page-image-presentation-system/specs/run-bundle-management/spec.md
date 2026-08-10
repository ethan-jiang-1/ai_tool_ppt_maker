## MODIFIED Requirements

### Requirement: Init and validation seed only the current Page Image Workflow topology

Fresh initialization and normal validation SHALL create and validate only V2
Page Image source, State, receipt, and presentation-package topology. A new
source records `page-authority-image2-v2` and waits for one explicit
`framed|pure` workflow choice before provider work; after receipt materializes,
State binds `image2-page-authority-v2` and the same workflow.

Non-V2 source/state identity remains byte-preserving under read-only
classification. Init and validation SHALL not mutate it, initialize V2 State,
seed presentation source, or adopt generated artifacts as evidence.

#### Scenario: Fresh V2 authoring waits for workflow choice

- **WHEN** init creates a Run Bundle before a workflow is selected
- **THEN** it seeds V2 source topology and reports workflow-selection
  prerequisite before provider work
- **AND** it does not infer a workflow or State mode

#### Scenario: Fresh authoring waits for an explicit workflow choice

- **WHEN** a newly initialized V2 version has not selected `framed` or `pure`
- **THEN** validation reports workflow-selection prerequisite
- **AND** it does not infer State mode, slide-level policy, or provider route

#### Scenario: A selected current source becomes a valid workflow pair

- **WHEN** a version selects `pure` with V2 pipeline and matching V2 State mode
- **THEN** validation recognizes one Pure V2 Page Image route
- **AND** it does not create Framed policy or `hybrid` route

#### Scenario: Non-V2 bundle is not reinitialized

- **WHEN** validation reads non-V2 source/state identity
- **THEN** it preserves bytes and reports its bounded hard-stop
- **AND** it creates no V2 evidence, package, or alternate route

### Requirement: New versions begin with fresh replacement workflow evidence

A confirmed structural V2 transaction SHALL bind its selected workflow and
presentation-package source bindings into the exact preview and apply plan.
The successor starts at source epoch one with fresh unreviewed V2 provenance or
`needs_raw_generation` debt. It SHALL not inherit authorization, raw review,
final projection, PPTX, notes, delivery decision, or active execution from its
source version.

#### Scenario: A V2 workflow switch creates clean successor State

- **WHEN** a confirmed structural V2 transaction changes Framed to Pure
- **THEN** successor State binds Pure and starts with fresh V2 evidence
- **AND** apply makes no provider call or acceptance reuse

#### Scenario: A current Framed version is copied cleanly

- **WHEN** `ppt_flow new-version` copies a selected V2 Framed version
- **THEN** target is a Framed V2 authoring draft with fresh evidence
- **AND** it inherits no source raw page, header composite, review decision, or
  final manifest
