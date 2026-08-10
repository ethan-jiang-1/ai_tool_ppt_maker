## MODIFIED Requirements

### Requirement: Structural plans bind one replacement Page Image Workflow without acceptance inheritance

Every structural preview and confirmed apply for current Page Image work SHALL
bind the exact V2 source identity, selected `framed|pure` workflow, stable slide
IDs, positions, source digest, presentation-package bindings, and selected
presentation digests into its exact plan hash. Apply creates only a clean V2
successor; it SHALL not inherit acceptance, grants, raw evidence, final output,
or delivery records.

#### Scenario: Structural V2 preview records presentation scope

- **WHEN** a structural preview introduces, removes, or reorders V2 slides
- **THEN** its plan identifies stable IDs and V2 presentation source bindings
- **AND** apply revalidates that exact plan before source/state materialization

#### Scenario: Non-V2 input cannot create a structural plan

- **WHEN** structural routing receives non-V2 source/state identity
- **THEN** it returns the shared hard-stop before preview or mutation
- **AND** it does not infer a workflow from prior artifacts

#### Scenario: A workflow switch creates a clean target

- **WHEN** an exact structural V2 plan changes Framed to Pure
- **THEN** target binds `pure` with fresh V2 workflow evidence
- **AND** it does not reuse source raw page or review decision

#### Scenario: Per-slide workflow policy is rejected before apply

- **WHEN** a V2 structural plan contains slide-specific workflow override
- **THEN** preview reports source/structural repair
- **AND** apply creates no target version or provider submission
