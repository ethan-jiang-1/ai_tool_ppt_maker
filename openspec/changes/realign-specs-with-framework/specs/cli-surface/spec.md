## MODIFIED Requirements

### Requirement: Resume-card action displays derive from one inspection projection
`state` and `status` SHALL retain non-empty public `workflow_summary` and `suggested_next` fields, but each SHALL be a display adaptation of the same `workflow_inspection.primary_action` in that response. `eligible_candidates` MAY remain as a bounded diagnostic field, but SHALL not select a route, override the primary action, or expose an alternate mutation command. The shared state card retains raw cursor context but SHALL not independently evaluate a resume/next action.

#### Scenario: State and status display the same primary action
- **WHEN** `state` and `status` render a response for the same workflow-inspection projection
- **THEN** each derives its public resume-card action from that response's `primary_action`
- **AND** neither display field or eligible candidate selects an alternate route
