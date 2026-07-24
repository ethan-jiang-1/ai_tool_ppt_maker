## MODIFIED Requirements

### Requirement: Agent resume protocol consumes workflow inspection
`AGENT_CONTRACT.md` and `NODE-SPEC.md` SHALL direct an Agent that has resolved an exact run to consume `state --json.workflow_inspection.primary_action` and its owner-issued `continuation` for resume and gate guidance. They SHALL preserve `_state/state.yaml` as the execution-pointer SSOT and the direct-owner public CLI as the sole mutation route. `workflow_summary`, `suggested_next`, and `eligible_candidates` are non-authoritative display projections and SHALL NOT be the Agent's control input.

#### Scenario: Agent resumes an exact run
- **WHEN** an Agent has resolved an exact existing run and requests resume or gate guidance
- **THEN** the Charter directs it to consume `workflow_inspection.primary_action` and its owner-issued continuation
- **AND** it does not use display projections to select or invoke a mutation

## ADDED Requirements

### Requirement: Active whole-page terminology names only the current route
Active root, Charter, workflow, playbook, reference, script, and command guidance SHALL identify current whole-page work as production mode `image2-only`, pipeline `whole-page-image2-v1`, and normal Controller `create-deck`. It SHALL identify cross-pipeline work only as the state-owned production-mode transition. It SHALL not describe current whole-page work as markerless, legacy, compatibility-only, maintenance-only, or migration, and SHALL not advertise a removed Controller, node, command, scratch owner, or receipt reader.

Unrelated compatibility wording MAY remain only when its owning current requirement names the exact preserved contract. Archived history and explicit negative-test literals are not active guidance. The active-surface verifier SHALL reject exact retired whole-page identities and malformed mechanical replacements without treating a generic word ban as the behavioral proof.

#### Scenario: Agent reads the current whole-page route
- **WHEN** an Agent starts or resumes a supported `image2-only` run
- **THEN** active guidance directs it through `create-deck` and `whole-page-image2-v1`
- **AND** it does not expose a compatibility maintenance route

#### Scenario: Agent changes page authority
- **WHEN** an Agent needs to move between HTML and whole-page pipelines
- **THEN** active guidance names only the closed `state --*-production-mode-transition` operations
- **AND** no removed migration command or Controller is offered
