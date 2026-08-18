# Playbook Execution Specification (delta)

## ADDED Requirements

### Requirement: Progressive checkpoints advance the Controller cursor on success

Each successful `image2` mutation operation (plan, pilot, expansion, authorize,
generate, pilot-review, pilot-accept, review, accept, reconcile) SHALL advance
the durable `create-deck` cursor to the Controller node that matches the raw
owner's post-operation checkpoint action, before the collaboration task
projection is refreshed. The advance SHALL be bound to that successful
owner/CLI transition and SHALL NOT be produced by observation, inspection, or
any read-only command.

The owner checkpoint action SHALL map to exactly one Controller node through
the shared progressive checkpoint mapping (for example `accept_progressive_pilot`
→ `review-target-<workflow>-pilot`, `plan_progressive_expansion` →
`plan-target-<workflow>-expansion`). Authorize SHALL first advance the cursor to
the authorize node and then complete that node through the existing authorize
CLI handoff so its grant evidence contract is unchanged.

#### Scenario: Resume after a complete pilot review lands on the visual gate

- **WHEN** a session resumes an exact run whose pilot evidence is current and
  the owner action is `accept_progressive_pilot`
- **THEN** the whole-workflow position shows the cursor at
  `review-target-<workflow>-pilot` with the human visual decision as its
  waiting/confirmation condition
- **AND** the shared workflow inspection, the durable cursor, and the task
  projection agree on that position

#### Scenario: A proceed decision resumes at expansion planning

- **WHEN** a session resumes an exact run whose partial Pilot decision is
  `proceed` and the owner action is `plan_progressive_expansion`
- **THEN** the resume position is `plan-target-<workflow>-expansion`
- **AND** no upstream narrative or page-content authoring node is presented as
  an eligible next step
