## MODIFIED Requirements

### Requirement: Style Master planning is scoped to the current Page Image Workflow

Style Master planning, authorization, review, selection, invalidation, and
successor projection SHALL bind only an exact V2 Page Image source/state pair,
its selected workflow, source receipt, and selected-presentation/raw-plan
lineage. The selected Style Master is not a substitute for the presentation
package and may not select workflow, class, or Header Profile.

Non-V2 input SHALL hard-stop through the shared evaluator before Style Master
plan, State, artifact, authorization, or provider work. No historical
compatibility projection or decoder is retained.

#### Scenario: V2 Style Master planning preserves presentation ownership

- **WHEN** a valid V2 run plans Style Master work
- **THEN** its plan binds selected workflow and V2 lineage without duplicating
  Page Class/Profile selection
- **AND** it does not expose an alternate protocol route

#### Scenario: A fresh Framed draft reaches Style Master without raw lineage

- **WHEN** a valid fresh V2 Framed draft reaches Style Master planning
- **THEN** it binds V2 source and workflow facts without requiring raw-page
  lineage
- **AND** it does not create a raw receipt or provider request prematurely

#### Scenario: A Style Master selection binds one replacement workflow

- **WHEN** a Style Master selection is accepted for a V2 Pure or Framed run
- **THEN** its binding records exactly that selected V2 workflow
- **AND** it cannot become a selection for its sibling workflow

#### Scenario: Visual-language drift starts one replacement Style Master scope

- **WHEN** a V2 visual-language change invalidates a selected Style Master
- **THEN** planning creates one replacement V2 Style Master scope
- **AND** it does not reuse stale selection or create another protocol route

## REMOVED Requirements

### Requirement: Style Master rejects retired Page Authority lineage

**Reason**: V2 Page Authority lineage is current.

**Migration**: The evaluator rejects non-V2 identity before Style Master work.
