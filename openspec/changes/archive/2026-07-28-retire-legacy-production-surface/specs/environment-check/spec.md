## ADDED Requirements

### Requirement: Environment checks are operation-scoped for Page Authority
Environment diagnostics SHALL distinguish Page Authority raw-generation readiness from local Framed
composition readiness. A local Framed check SHALL not require provider credentials or select a retired
production family.

#### Scenario: Framed-local doctor is provider-free
- **WHEN** doctor is invoked for a Framed local operation without Image2 credentials
- **THEN** it reports the browser/font runtime result without a provider-credential failure


## REMOVED Requirements

### Requirement: Doctor derives readiness guidance from production mode
**Reason**: The legacy contract is replaced by the current owner `00-setup`.
**Migration**: Use the current contract owned by `00-setup`.

### Requirement: npm and dependency check
**Reason**: The legacy contract is replaced by the current owner `00-setup` common profile.
**Migration**: Use the current contract owned by `00-setup` common profile.

### Requirement: In-framework Stage 2 scripts are a hard requirement
**Reason**: The legacy contract is replaced by the current owner `00-setup` + Page Authority.
**Migration**: Use the current contract owned by `00-setup` + Page Authority.

### Requirement: Environment check separates production readiness profiles
**Reason**: The legacy contract is replaced by the current owner `00-setup`.
**Migration**: Use the current contract owned by `00-setup`.

### Requirement: HTML browser and font checks block only HTML readiness
**Reason**: The legacy contract is replaced by the current owner `00-setup` + compositor.
**Migration**: Use the current contract owned by `00-setup` + compositor.
