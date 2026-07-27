## ADDED Requirements

### Requirement: Notes completion consumes Page Authority final delivery
Notes extraction and injection SHALL consume the Page Authority final manifest and assembly receipt.
They SHALL NOT accept HTML or whole-page current delivery evidence.

#### Scenario: Current notes are injected
- **WHEN** Page Authority finalization has published a valid final manifest
- **THEN** notes injection writes a receipt bound to that Page Authority assembly lineage

