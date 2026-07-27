## ADDED Requirements

### Requirement: PPTX assembly consumes the Page Authority final manifest
PPTX assembly SHALL accept only the ordered Page Authority final-slide manifest and its receipt-bound
files. It SHALL reject HTML, whole-page, Header-Lock, or unregistered legacy final artifacts as current
assembly input.

#### Scenario: Current final slides are assembled
- **WHEN** a valid Page Authority final manifest is present
- **THEN** assembly produces a PPTX receipt bound to the ordered Page Authority final evidence

