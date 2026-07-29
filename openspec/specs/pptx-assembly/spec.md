## Purpose

Define Page Authority PPTX assembly from the ordered current final-slide manifest.
Assembly creates one receipt-bound delivery container and never accepts a raw,
historical, partial, or unregistered final artifact as current input.

## Requirements

### Requirement: PPTX assembly consumes the Page Authority final manifest
PPTX assembly SHALL accept only the ordered v2 Page Authority final-slide manifest and its receipt-bound files. It SHALL reject foreign or unregistered final artifacts as current assembly input.

#### Scenario: Current final slides are assembled
- **WHEN** a valid v2 Page Authority final manifest is present
- **THEN** assembly produces a PPTX receipt bound to the ordered Page Authority final evidence
