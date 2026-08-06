## REMOVED Requirements

### Requirement: Framework guidance names one current production protocol

**Reason**: The capability identity uses the retired Framework term.
**Migration**: Use `harness-charter` for the unchanged current-protocol policy.

#### Scenario: Charter ownership is renamed

- **WHEN** active specifications are reconciled after this change
- **THEN** this requirement is owned by `harness-charter`

### Requirement: Framework guidance routes changes by ownership and invalidation

**Reason**: The capability identity uses the retired Framework term.
**Migration**: Use `harness-charter` for ownership-aware refresh and structural routing.

#### Scenario: Refresh guidance is located after the rename

- **WHEN** an Agent needs the canonical refresh route
- **THEN** it reads the Harness Charter capability rather than this retired one

### Requirement: Framework guidance presents sibling workflows and shared delivery

**Reason**: The capability identity uses the retired Framework term.
**Migration**: Use `harness-charter` for target workflow and shared-delivery guidance.

#### Scenario: Workflow ownership is located after the rename

- **WHEN** a maintainer audits target workflow ownership
- **THEN** the active Harness Charter capability supplies the contract

### Requirement: Agent Contract defines one non-persistent diagnostic-recovery handoff

**Reason**: The capability identity uses the retired Framework term.
**Migration**: Use `harness-charter` for the Agent Contract recovery handoff.

#### Scenario: Diagnostic guidance is located after the rename

- **WHEN** an Agent receives a bounded CLI diagnostic
- **THEN** it follows `harness-charter` rather than this retired capability

### Requirement: Agent Contract selects recovery authority in fixed precedence

**Reason**: The capability identity uses the retired Framework term.
**Migration**: Use `harness-charter` for recovery authority precedence.

#### Scenario: Recovery precedence is located after the rename

- **WHEN** a maintainer checks recovery authority
- **THEN** the active Harness Charter capability provides its one precedence rule
