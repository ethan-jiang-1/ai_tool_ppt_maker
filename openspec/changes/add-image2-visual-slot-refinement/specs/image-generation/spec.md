## ADDED Requirements

### Requirement: Modern visual-slot transport is isolated from legacy generation

Modern Image2 submission SHALL live only behind the Phase-4 private transport adapter and consume persisted authorized attempt IDs. It SHALL emit secret-safe typed receipts suitable for reconciliation and SHALL not change or be imported by markerless whole-page generation.

#### Scenario: HTML build runs normally
- **WHEN** ordinary HTML build or local refresh runs
- **THEN** no modern transport or provider credential loader is initialized
