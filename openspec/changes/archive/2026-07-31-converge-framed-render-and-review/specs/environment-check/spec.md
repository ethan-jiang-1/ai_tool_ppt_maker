## MODIFIED Requirements

### Requirement: Environment checks are operation-scoped for Page Authority

Environment diagnostics SHALL distinguish Page Authority raw-generation readiness from the canonical
Framed render-profile readiness required for plan-time layout proof and final local composition. A
Framed-local check SHALL validate the same pinned browser, checked-in font inventory, font integrity,
and capture-profile facts consumed by the Framed owner; it SHALL not require provider credentials,
initialize a provider, download a browser, or select a retired production family.

The direct environment adapter SHALL preserve its zero-static-npm-dependency startup. It SHALL inspect
package-backed Framed runtime facts only after package prerequisites pass, and shall report a missing or
mismatched runtime/font profile as an actionable environment result rather than a module-load crash or
source-validation failure.

#### Scenario: Framed-local doctor is provider-free

- **WHEN** doctor is invoked for Framed planning or local composition without Image2 credentials
- **THEN** it reports the browser, font, and capture-profile readiness result without a provider-credential failure
- **AND** it performs no provider initialization or network setup

#### Scenario: Fresh checkout reports missing runtime normally

- **WHEN** direct environment check runs before npm dependencies or paired browser assets are present
- **THEN** it starts successfully and reports the earliest missing package or runtime prerequisite
- **AND** it does not crash during static module loading or attempt browser acquisition

#### Scenario: Production and doctor consume the same profile facts

- **WHEN** doctor reports the current Framed runtime profile ready
- **THEN** Framed plan verification and final composition validate against those same owned runtime/font identities
- **AND** neither path constructs a competing readiness profile
