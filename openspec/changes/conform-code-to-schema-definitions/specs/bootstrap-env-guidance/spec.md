## MODIFIED Requirements

### Requirement: Bootstrap exposes current Page Image Workflow readiness without false local-refresh claims

Active BOOTSTRAP and top-level onboarding SHALL describe operation-scoped
readiness only for the current `page-image-workflow` contract declared by the
schema serialization inventory. They SHALL state that ordinary foundation
checks are offline, credentials are needed only when the selected operation
submits to Image2, and a live probe requires disclosed separate authorization.
They SHALL NOT name a version-suffixed, retired, compatibility, or alternative
production contract.

#### Scenario: An Agent starts current raw-generation readiness

- **WHEN** BOOTSTRAP directs an Agent to prepare current Page Image raw work
- **THEN** it names the one schema-declared current workflow and the applicable
  operation-scoped credential check
- **AND** it does not present a historical or parallel workflow as usable input

#### Scenario: Framed local readiness is scoped correctly

- **WHEN** a user prepares only local Framed work
- **THEN** guidance distinguishes local readiness from Image2 submission readiness
- **AND** it does not imply an obsolete workflow contract

#### Scenario: Fresh onboarding selects a current policy later

- **WHEN** onboarding completes before a workflow is selected
- **THEN** it defers that choice to the current source-authoring step
- **AND** it does not preselect a historical marker
