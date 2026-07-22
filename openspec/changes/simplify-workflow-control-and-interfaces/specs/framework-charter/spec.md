## ADDED Requirements

### Requirement: Agent resume protocol consumes workflow inspection

`AGENT_CONTRACT.md` and `NODE-SPEC.md` SHALL direct an Agent that has resolved an exact run to
consume `state --json.workflow_inspection.primary_action` and its owner-issued `continuation` for
resume and gate guidance. They SHALL preserve `_state/state.yaml` as the execution-pointer SSOT and
the direct-owner public CLI as the sole mutation route. `html_resume_guidance`, `workflow_summary`,
`suggested_next`, and `eligible_candidates`, if retained for compatibility, SHALL be labeled
non-authoritative display projections and SHALL NOT be the Agent's control input.

#### Scenario: Agent resumes an HTML run
- **WHEN** an Agent resumes a known exact HTML run
- **THEN** the contract directs it to consume the inspection primary action and owner continuation
- **AND** it does not execute a command solely because a legacy display field named it

#### Scenario: Compatibility projection remains present
- **WHEN** a legacy display projection remains in a status/state response during the retirement window
- **THEN** the contract identifies it as non-authoritative compatibility output
- **AND** the Agent still uses the inspection projection for control decisions
