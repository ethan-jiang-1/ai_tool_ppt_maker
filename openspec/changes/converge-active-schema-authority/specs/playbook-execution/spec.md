## REMOVED Requirements

### Requirement: Active Controller guidance rejects v2 Page Authority routes

**Reason**: Naming a retired route makes it appear to be a contract generation
that a future Controller might need to understand. The active Controller only
needs to distinguish declared current facts from undeclared input.

**Migration**: Replace this requirement with the undeclared-contract boundary
below. The existing `unsupported-protocol/export` hard-stop and byte-preserving
behavior remain; no source/state/evidence conversion is introduced.

## ADDED Requirements

### Requirement: Active Controller guidance rejects undeclared workflow contracts

Registered active playbooks, Controller manifests, resume cards, and task
projection sources SHALL describe only declared current Page Image Workflow
facts. When they encounter source, state, or evidence outside the declared
current contract, they SHALL show the owner-issued
`unsupported-protocol/export` hard-stop and preserve bytes. They SHALL not
register, select, rewrite, resume, adopt, migrate, or route an undeclared
workflow.

#### Scenario: An undeclared run cannot enter an active controller

- **WHEN** a controller attempts to resolve an undeclared source/state pair
- **THEN** it presents the `unsupported-protocol/export` action before
  selecting nodes
- **AND** it does not create a compatibility controller or task projection

## ADDED Requirements

### Requirement: Page Image task projections declare their current report contract

For an exact active current Page Image Workflow Controller route, the optional
`_state/page-production-task-projection.md` SHALL use its declared current
shared report contract and be rebuilt only from owner-issued inspection and
typed handoffs. It may show bounded plan, evidence, review, manifest, delivery,
and current-action references, but it SHALL not become a selector, source of
authority, authorization, acceptance record, or provider progress evaluator.

#### Scenario: A task projection is rebuilt

- **WHEN** an eligible current Controller route rebuilds its task projection
- **THEN** the projection carries its declared current report contract and only
  owner-issued facts
- **AND** it does not add a versioned route marker or advance workflow state
