## ADDED Requirements

### Requirement: Notes receipt binds Page Authority final assembly lineage
Notes Injection SHALL accept Page Authority input only when its ordered stable IDs, current PPTX assembly
receipt, final-manifest digest, and final-slide fingerprints match the resolved receipt. It SHALL bind
the notes receipt to that delivery lineage and reject a raw underlay, legacy branch receipt, partial
manifest, or mismatched ordered ID set.

#### Scenario: Notes follow a mixed Page Authority assembly
- **WHEN** a current mixed Pure/Framed final manifest and matching notes are supplied
- **THEN** notes are injected by stable slide ID and the receipt records the Page Authority assembly lineage
- **AND** no renderer-private manifest is used to infer alignment

