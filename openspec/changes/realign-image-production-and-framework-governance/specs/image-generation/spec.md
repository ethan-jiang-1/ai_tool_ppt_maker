## ADDED Requirements

### Requirement: Whole-page generation retains authority after relocation
Whole-page generation SHALL retain its current provider authorization, raw-render provenance, and byte/fingerprint behavior after moving under Image Production.

#### Scenario: Whole-page rebuild remains authorized
- **WHEN** an `image2-only` rebuild reaches provider submit
- **THEN** existing scope-bound authorization remains required
