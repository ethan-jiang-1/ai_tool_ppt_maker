# workflow-inspection Specification

## Purpose
Define the read-only workflow-observation projection that gives MD Controllers and CLI observers one ordered, owner-issued next action for an exact run without reconstructing mode, gate, recovery, or completion policy.
## Requirements
### Requirement: Inspection remains separate from collaboration projection refresh

`inspectWorkflow({ runDir })` SHALL remain a zero-authority-write evaluator: it
shall not create, refresh, inspect as input, or rely on a collaboration task
projection. It SHALL return the direct owner facts and one nearest legal action
for an exact run independently of whether a caller later renders a
non-authoritative projection.

Eligibility to rebuild `_state/page-production-task-projection.md` belongs to
the Controller/CLI presentation boundary after that inspection, not to
inspection itself. A card's presence, content, or absence SHALL not affect the
inspection checkpoint, action, gate posture, evidence evaluation,
authorization, or recovery route.

#### Scenario: Inspection ignores a missing or stale card

- **WHEN** an exact progressive run is inspected while its task projection is
  absent, manually edited, or stale
- **THEN** inspection returns the same direct owner action it would return
  without that card
- **AND** it creates, changes, and reads no task projection as lifecycle input

#### Scenario: Projection cannot influence a hard-stop

- **WHEN** inspection encounters an identity, evidence, authorization, or
  recoverability hard-stop
- **THEN** it returns the owning protected invariant and nearest recovery
  action from direct facts
- **AND** no card content can turn that result into resume, confirmation, or
  authorization

### Requirement: Inspection observes current Page Image Workflow marker-first

Workflow Inspection SHALL remain read-only and resolve a current Page Image
Workflow from its exact schema-declared `page-image-workflow` source,
`image2-page-workflow` state, selected version-level policy, and direct current
lineage records. It SHALL report the selected `framed` or `pure` workflow and
one owner-issued nearest action without inferring policy from prose, artifact
names, or conversation context. It SHALL not initialize a receipt, mutate
state, submit a provider request, or construct a compatibility projection.

#### Scenario: Current Framed status is projected from direct markers

- **WHEN** inspection reads a valid current Framed source/state pair
- **THEN** it reports Framed and the direct prerequisite from its owning
  lifecycle
- **AND** it does not select Pure or construct a per-slide authority view

### Requirement: Inspection projects the direct compiled-input lifecycle

For an exact current run, Inspection SHALL obtain the selected adapter's direct
facts for Style Master readiness, compiled provider-input digest, protected
geometry and local profile where applicable, plan/authorization/attempt
status, Pilot scope, Complete Page Review, and delivery. Its primary action
SHALL name the earliest protected invariant or legal current step. A Framed
provider-free overlay refresh is actionable only after direct proof that
compiled provider input, protected geometry, raw contract, and local profile
are unchanged; a header literal change therefore projects raw rebuild.

The review projection SHALL be one Complete Page Review action: Framed shows
the raw provider page beside its production-equivalent header composite, while
Pure shows its complete provider page. Inspection SHALL not project a second
composite approval, synthesize a Pilot, or infer acceptance from an artifact.

#### Scenario: Framed header input drift is raw work

- **WHEN** a Framed title changes and the adapter's compiled-input digest
  changes
- **THEN** inspection returns raw rebuild as the nearest action
- **AND** it does not select provider-free overlay refresh

#### Scenario: Complete Framed page review has one action

- **WHEN** all current Framed provider-page and composite evidence is ready
- **THEN** inspection returns the one Complete Page Review `proceed` or
  `repair` action
- **AND** it does not expose an additional local-composite approval
