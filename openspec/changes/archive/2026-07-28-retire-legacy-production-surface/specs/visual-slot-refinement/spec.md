## ADDED Requirements

### Requirement: Visual refinement retirement remains enforced
Historical observer/adoption handling of a visual-slot refinement source or state pair SHALL remain
read only and SHALL NOT expose a current provider, review, promotion, state, or
completion path. Current visual work SHALL use Page Authority raw regeneration or Framed local refresh
according to ownership.

#### Scenario: A visual change is classified
- **WHEN** an operator requests a current visual update
- **THEN** the route is a Page Authority operation and no retired refinement choice is offered

## REMOVED Requirements

### Requirement: Refinement is mode-scoped, bounded, and authorization-gated
**Reason**: Visual-slot refinement is not a current production authority.
**Migration**: Use Page Authority raw regeneration or Framed local refresh according to ownership.

### Requirement: Chargeable attempts are persisted and never blindly retried
**Reason**: Retired refinement attempts no longer exist.
**Migration**: Use Page Authority raw authorization and manifest evidence.

### Requirement: Candidate review and source promotion are separate transactions
**Reason**: Retired visual-slot candidate promotion is removed.
**Migration**: Use Page Authority raw review and finalization.

### Requirement: Setup, cleanup, and vNext preserve ownership boundaries
**Reason**: The retired refinement lifecycle has no active state or cleanup owner.
**Migration**: Use current Page Authority generated-artifact ownership.

### Requirement: Refinement provenance and promotion recovery are canonical
**Reason**: Retired refinement provenance is not current evidence.
**Migration**: Use Page Authority receipt/raw/final evidence and bounded legacy adoption.
