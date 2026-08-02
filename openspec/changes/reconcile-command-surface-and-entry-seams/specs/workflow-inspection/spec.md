## ADDED Requirements

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
