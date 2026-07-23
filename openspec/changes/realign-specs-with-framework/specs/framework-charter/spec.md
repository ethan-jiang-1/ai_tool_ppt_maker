## MODIFIED Requirements

### Requirement: Agent resume protocol consumes workflow inspection
`AGENT_CONTRACT.md` and `NODE-SPEC.md` SHALL direct an Agent that has resolved an exact run to consume `state --json.workflow_inspection.primary_action` and its owner-issued `continuation` for resume and gate guidance. They SHALL preserve `_state/state.yaml` as the execution-pointer SSOT and the direct-owner public CLI as the sole mutation route. `workflow_summary`, `suggested_next`, and `eligible_candidates` are non-authoritative display projections and SHALL NOT be the Agent's control input.

#### Scenario: Agent resumes an exact run
- **WHEN** an Agent has resolved an exact existing run and requests resume or gate guidance
- **THEN** the Charter directs it to consume `workflow_inspection.primary_action` and its owner-issued continuation
- **AND** it does not use display projections to select or invoke a mutation
