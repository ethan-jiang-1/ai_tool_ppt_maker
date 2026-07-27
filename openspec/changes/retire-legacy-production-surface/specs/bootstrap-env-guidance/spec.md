## ADDED Requirements

### Requirement: Bootstrap guidance exposes current operation-scoped readiness
Active bootstrap guidance SHALL describe only Page Authority raw-generation and local
Framed-composition readiness. It SHALL state that local Framed work does not require
provider credentials and that historical runs must use the adoption observer.

#### Scenario: Local Framed readiness is documented
- **WHEN** an operator follows active bootstrap guidance for a Framed local refresh
- **THEN** the guidance names the browser/font runtime prerequisite and does not request an Image2 credential

