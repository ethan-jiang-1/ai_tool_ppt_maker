## MODIFIED Requirements

### Requirement: Style Master planning is scoped to the current Page Image Workflow

The Style Master owner SHALL resolve exactly one current
`page-image-workflow` authoring draft and matching state-owned
`production_identity` record for one version-level workflow, `framed` or
`pure`. Its candidate plan, authorization, attempt, review, effective
selection, and acceptance facts retain their existing exact workflow,
visual-language, source-context, immutability, and cost-control rules under
declared stage/role values. It SHALL not create raw-page authority or accept an
undeclared historical lineage.

#### Scenario: A fresh Framed draft reaches Style Master

- **WHEN** a valid fresh authoring draft selects `framed` under
  `page-image-workflow`
- **THEN** Style Master may create and inspect its selected-workflow candidate
  lifecycle before first raw-page planning
- **AND** it does not materialize a receipt, provider request, raw plan, or
  final-page evidence

#### Scenario: A fresh Framed draft reaches Style Master without raw lineage

- **WHEN** a valid fresh current Framed draft enters Style Master
- **THEN** the owner may inspect candidate lifecycle before raw planning
- **AND** it does not create raw lineage or use an alternate contract

#### Scenario: A Style Master selection binds one replacement workflow

- **WHEN** a current candidate selection is promoted for one workflow
- **THEN** acceptance remains scoped to that workflow and source/visual context
- **AND** it cannot satisfy another workflow

#### Scenario: Visual-language drift starts one replacement Style Master scope

- **WHEN** current visual/source binding drift invalidates a selected candidate
- **THEN** the existing owner exposes a provider-free replacement scope
- **AND** it does not reuse prior current authority
