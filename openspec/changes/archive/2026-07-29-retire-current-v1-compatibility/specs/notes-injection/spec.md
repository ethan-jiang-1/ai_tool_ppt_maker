## MODIFIED Requirements

### Requirement: Notes receipt binds Page Authority final assembly lineage
Notes Injection SHALL accept v2 Page Authority input only when its ordered stable IDs, current PPTX assembly receipt, final-manifest digest, and final-slide fingerprints match the resolved receipt. It SHALL bind the notes receipt to that delivery lineage and reject a raw underlay, foreign-protocol receipt, partial manifest, or mismatched ordered ID set.

#### Scenario: Notes follow a current Page Authority assembly
- **WHEN** a current v2 Framed or Pure final manifest and matching notes are supplied
- **THEN** notes are injected by stable slide ID and the receipt records the Page Authority assembly lineage
- **AND** no renderer-private manifest is used to infer alignment

### Requirement: Notes completion consumes Page Authority final delivery
Notes extraction and injection SHALL consume the v2 Page Authority final manifest and assembly receipt. They SHALL NOT accept foreign or unregistered delivery evidence.

#### Scenario: Current notes are injected
- **WHEN** v2 Page Authority finalization has published a valid final manifest
- **THEN** notes injection writes a receipt bound to that Page Authority assembly lineage
