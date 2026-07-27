## ADDED Requirements

### Requirement: Inspection projects current Page Authority or bounded legacy action
Workflow inspection SHALL produce one read-only Page Authority lifecycle action for a current run, or
one adoption/repair action for a historical/corrupt pair. It SHALL NOT compose a legacy production
cursor, provider request, or approval path.

#### Scenario: A recognized legacy run is inspected
- **WHEN** inspection reads an intact historical pair
- **THEN** it returns the provider-free adoption action and no legacy production route

