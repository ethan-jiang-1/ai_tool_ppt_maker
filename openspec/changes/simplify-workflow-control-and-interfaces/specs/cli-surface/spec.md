## ADDED Requirements

### Requirement: CLI routing does not duplicate workflow evaluation

`ppt_flow` SHALL parse arguments, dispatch every mutating command through its closed grammar to the
selected direct owner, and emit the existing CLI envelope. `status` and non-mutating `state`
observation SHALL obtain caller-facing workflow guidance from inspection. A mutating command MAY
return its direct owner's gate/recovery result, but SHALL NOT replace the requested operation with
an inspection resume action or add a second mode/gate/recovery evaluator or result schema. Any
retained compatibility alias SHALL be an inventoried pure forwarder with a retirement owner,
removal trigger, and exact `retire_by: change:<name>|release:<version>`.

#### Scenario: Compatibility alias is invoked
- **WHEN** a supported temporary alias is used
- **THEN** it forwards to the canonical owner invocation and preserves its envelope
- **AND** it does not calculate independent readiness or recovery guidance

#### Scenario: Pending resume does not redirect a direct operation
- **WHEN** inspection reports a primary action that differs from a requested mutating CLI operation
- **THEN** `ppt_flow` dispatches the requested operation only to its direct owner
- **AND** it does not execute, synthesize, or advertise the inspection action as an alternate command

### Requirement: Resume-card action displays derive from one inspection projection

`state` and `status` SHALL retain non-empty public `workflow_summary` and `suggested_next` fields,
but each SHALL be a display adaptation of the same `workflow_inspection.primary_action` in that
response. `html_resume_guidance`, if retained during compatibility, SHALL be a lossy display
adaptation of that same action and SHALL not be a control input. `eligible_candidates` MAY remain as
a bounded diagnostic field, but SHALL not select a route, override the primary action, or expose an
alternate mutation command. The shared state card retains raw cursor context but SHALL not
independently evaluate a resume/next action.

#### Scenario: Resume-card adapters have one source
- **WHEN** state and status observe an unchanged exact run
- **THEN** their primary action, summary, suggested-next, and any compatibility guidance all describe
  the same owner/action
- **AND** no card-local artifact, candidate, or HTML-only evaluator changes that action
