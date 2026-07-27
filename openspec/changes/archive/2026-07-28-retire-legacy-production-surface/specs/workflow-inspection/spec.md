## ADDED Requirements

### Requirement: Inspection projects current Page Authority or bounded legacy action
Workflow inspection SHALL produce one read-only Page Authority lifecycle action for a current run, or
one adoption/repair action for a historical/corrupt pair. It SHALL NOT compose a legacy production
cursor, provider request, or approval path.

#### Scenario: A recognized legacy run is inspected
- **WHEN** inspection reads an intact historical pair
- **THEN** it returns the provider-free adoption action and no legacy production route


## REMOVED Requirements

### Requirement: Inspection provides the sole run-scoped observation workflow entry
**Reason**: The legacy contract is replaced by the current owner workflow inspection.
**Migration**: Use the current contract owned by workflow inspection.

### Requirement: Inspection composes one action from the retained execution cursor
**Reason**: The legacy contract is replaced by the current owner workflow inspection.
**Migration**: Use the current contract owned by workflow inspection.

### Requirement: Workflow inspection provides a versioned read-only projection
**Reason**: The legacy contract is replaced by the current owner workflow inspection.
**Migration**: Use the current contract owned by workflow inspection.

### Requirement: Inspection reuses direct owners and short-circuits prerequisites
**Reason**: The legacy contract is replaced by the current owner workflow inspection.
**Migration**: Use the current contract owned by workflow inspection.

### Requirement: Inspection preserves protected gate boundaries
**Reason**: The legacy contract is replaced by the current owner workflow inspection.
**Migration**: Use the current contract owned by workflow inspection.

### Requirement: Workflow evidence is ledgered before control retirement
**Reason**: The legacy contract is replaced by the current owner workflow inspection.
**Migration**: Use the current contract owned by workflow inspection.
