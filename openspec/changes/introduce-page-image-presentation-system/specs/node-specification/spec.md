## MODIFIED Requirements

### Requirement: Controller state binds one current Page Image Workflow lineage

State for a current Page Image run SHALL bind only
`page-authority-image2-v2`, `image2-page-authority-v2`, its one selected
`framed|pure` workflow, source receipt, selected-presentation/raw-plan
bindings, Task Mandate, and evidence lineage. State readers and writers SHALL
use the shared V2 evaluator before any lifecycle interpretation or mutation.

A non-V2, partial, hybrid, or mismatched pair is outside Controller state
authority: it returns the producer-issued hard-stop without State creation,
repair, receipt initialization, or lifecycle mutation. MD consumes the
diagnostic without inferring a workflow or alternate route.

#### Scenario: A V2 State writer binds selected workflow lineage

- **WHEN** a valid V2 run first materializes current State
- **THEN** State records exactly its selected workflow and V2 evidence lineage
- **AND** no alternate protocol or workflow is initialized

#### Scenario: Non-V2 observation cannot initialize State

- **WHEN** Controller state observation receives non-V2 identity
- **THEN** it returns the bounded hard-stop before any State mutation
- **AND** MD presents only the producer-issued next action

#### Scenario: State does not invent a per-slide policy

- **WHEN** V2 State records Framed while a slide-level workflow override is
  supplied
- **THEN** validation returns source/structural repair before Controller route
  selection
- **AND** it does not record mixed workflow State
