## ADDED Requirements

### Requirement: Environment checks are operation-scoped for Page Authority
Environment diagnostics SHALL distinguish Page Authority raw-generation readiness from local Framed
composition readiness. A local Framed check SHALL not require provider credentials or select a retired
production family.

#### Scenario: Framed-local doctor is provider-free
- **WHEN** doctor is invoked for a Framed local operation without Image2 credentials
- **THEN** it reports the browser/font runtime result without a provider-credential failure

