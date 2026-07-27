## ADDED Requirements

### Requirement: Bootstrap guidance exposes current operation-scoped readiness
Active bootstrap guidance SHALL describe only Page Authority raw-generation and local
Framed-composition readiness. It SHALL state that local Framed work does not require
provider credentials and that historical runs must use the adoption observer.

#### Scenario: Local Framed readiness is documented
- **WHEN** an operator follows active bootstrap guidance for a Framed local refresh
- **THEN** the guidance names the browser/font runtime prerequisite and does not request an Image2 credential


## REMOVED Requirements

### Requirement: BOOTSTRAP presents production mode before mode-specific readiness
**Reason**: The legacy contract is replaced by the current owner BOOTSTRAP + Page Authority.
**Migration**: Use the current contract owned by BOOTSTRAP + Page Authority.

### Requirement: BOOTSTRAP uses the Phase 0 environment interface
**Reason**: The legacy contract is replaced by the current owner BOOTSTRAP + `00-setup`.
**Migration**: Use the current contract owned by BOOTSTRAP + `00-setup`.

### Requirement: BOOTSTRAP Step 1 covers every selected doctor-profile check
**Reason**: The legacy contract is replaced by the current owner BOOTSTRAP + `00-setup`.
**Migration**: Use the current contract owned by BOOTSTRAP + `00-setup`.

### Requirement: BOOTSTRAP gate behavior is preserved
**Reason**: The legacy contract is replaced by the current owner BOOTSTRAP + `00-setup`.
**Migration**: Use the current contract owned by BOOTSTRAP + `00-setup`.

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP
**Reason**: The legacy contract is replaced by the current owner BOOTSTRAP + `00-setup`.
**Migration**: Use the current contract owned by BOOTSTRAP + `00-setup`.

### Requirement: BOOTSTRAP stays in sync with environment readiness profiles
**Reason**: The legacy contract is replaced by the current owner BOOTSTRAP + `00-setup`.
**Migration**: Use the current contract owned by BOOTSTRAP + `00-setup`.

### Requirement: BOOTSTRAP repairs the complete local HTML delivery prerequisites
**Reason**: The legacy contract is replaced by the current owner Framed compositor.
**Migration**: Use the current contract owned by Framed compositor.
