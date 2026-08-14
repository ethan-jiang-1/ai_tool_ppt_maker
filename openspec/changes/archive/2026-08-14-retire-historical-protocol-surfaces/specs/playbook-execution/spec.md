## MODIFIED Requirements

### Requirement: Active Controller guidance rejects undeclared workflow contracts

Registered active playbooks, Controller manifests, resume cards, and task
projection sources SHALL describe only declared current Page Image Workflow
facts. When they encounter a present foreign, unreadable, incomplete, or
cross-lineage source/state/evidence record that cannot establish exact current
protocol identity, they SHALL present the owner-issued `production-protocol`
`current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair`, with no human decision
required. They SHALL preserve bytes and SHALL not register, select, rewrite,
resume, adopt, migrate, export, convert, or route the undeclared workflow.

They SHALL preserve the existing Harness-binding, narrative/workflow-selection,
state, execution-version, and delivery owner when direct facts establish one of
those current outcomes. Controller guidance SHALL not replace a declared fresh
draft, state-owned defect after current protocol identity is established, exact
Work Version mismatch, or attributable current delivery rebuild with protocol
repair. Only a one-to-one, fence-clear current state repair may write.

#### Scenario: An undeclared run cannot enter an active controller

- **WHEN** a controller attempts to resolve an undeclared source/state pair
- **THEN** it presents the owner-issued repair action before selecting nodes
- **AND** it does not create a compatibility controller or task projection

#### Scenario: Current owner action is not recategorized

- **WHEN** a Controller handoff carries a binding, fresh-draft, current-state,
  execution-version, or attributable-current-delivery owner action
- **THEN** active guidance presents that owner-issued action unchanged
- **AND** it does not replace the action with invalid-protocol recovery
