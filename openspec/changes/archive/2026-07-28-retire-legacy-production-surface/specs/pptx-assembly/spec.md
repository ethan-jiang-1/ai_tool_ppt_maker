## ADDED Requirements

### Requirement: PPTX assembly consumes the Page Authority final manifest
PPTX assembly SHALL accept only the ordered Page Authority final-slide manifest and its receipt-bound
files. It SHALL reject HTML, whole-page, Header-Lock, or unregistered legacy final artifacts as current
assembly input.

#### Scenario: Current final slides are assembled
- **WHEN** a valid Page Authority final manifest is present
- **THEN** assembly produces a PPTX receipt bound to the ordered Page Authority final evidence


## REMOVED Requirements

### Requirement: Stage 4 builds PPTX container
**Reason**: The legacy contract is replaced by the current owner Page Authority assembly.
**Migration**: Use the current contract owned by Page Authority assembly.

### Requirement: Stage 4 is a standalone ESM script
**Reason**: The legacy contract is replaced by the current owner Page Authority assembly.
**Migration**: Use the current contract owned by Page Authority assembly.

### Requirement: Whole-page assembly uses the current receipt lineage
**Reason**: The legacy contract is replaced by the current owner Page Authority assembly.
**Migration**: Use the current contract owned by Page Authority assembly.
