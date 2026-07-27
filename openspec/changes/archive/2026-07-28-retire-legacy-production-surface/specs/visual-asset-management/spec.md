## ADDED Requirements

### Requirement: Current reference registry is Page Authority-confined
Current asset/reference resolution SHALL use the Page Authority registry, byte fingerprints, role
restrictions, and confined paths. An HTML catalog SHALL NOT become a current identity or provider
authority.

#### Scenario: A reference profile is compiled
- **WHEN** Page Authority builds a raw profile
- **THEN** it includes only registered Page Authority reference roles and fingerprints


## REMOVED Requirements

### Requirement: Asset manifest validation checks required fields and types
**Reason**: The legacy contract is replaced by the current owner `visual-asset-management` Image2 registry.
**Migration**: Use the current contract owned by `visual-asset-management` Image2 registry.

### Requirement: Asset catalogs resolve backbone and version overrides by stable ID
**Reason**: The legacy contract is replaced by the current owner `visual-asset-management` Image2 registry.
**Migration**: Use the current contract owned by `visual-asset-management` Image2 registry.

### Requirement: Asset selection evidence distinguishes applicability from integrity
**Reason**: The legacy contract is replaced by the current owner `visual-asset-management` Image2 registry.
**Migration**: Use the current contract owned by `visual-asset-management` Image2 registry.
