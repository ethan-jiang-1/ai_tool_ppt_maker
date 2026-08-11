## ADDED Requirements

### Requirement: Framed protected-composition fields remain schema-declared and static

The schema README and active `page-source-receipt`, `layout-config`,
`page-layout`, and `image2-request` stage definitions SHALL collectively
declare C6's current boundary: the source-owned closed subject-restriction fact
on both workflows' receipts; one CSS-pixel Framed `header_region`; one
profile-derived `protected_composition` with `coordinate_space:
normalized-canvas`, reserved-header and full-width body-safe regions plus
provenance; and the absence of a local-header field or header-derived context
from the Framed provider-request shape. Independently source-owned provider
content may retain a matching literal. The declarations SHALL identify their
existing producer, input,
downstream consumer, invalidation, and Framed/Pure scope without becoming a
runtime planner, provider gate, review decision, or alternate authority.

The opt-in production-schema conformance sweep SHALL validate a synthetic C6
Framed publication/request for those declared bindings and a Pure publication
that retains its source restriction only at the receipt/ordinary
identity-resolution boundary while omitting all Framed composition and C6
Framed request bindings. It SHALL report a direct schema mismatch for a missing
source restriction, `header_region`, or Framed composition provenance; an
undeclared request field; a serialized local-header field or header-derived
context in a Framed request; a former `protected_geometry` field; or a
Framed-only binding on Pure. Runtime
source/configuration and adapter validators remain the owning checks.

#### Scenario: A Framed C6 publication matches declared ownership

- **WHEN** the opt-in sweep inspects a synthetic valid Framed C6 publication
- **THEN** it finds declared source restriction, `header_region`, normalized
  composition formula/provenance, and local-only-header/request boundaries
- **AND** the check remains provider-free and does not create a lifecycle or
  review decision

#### Scenario: Schema drift cannot become a runtime control path

- **WHEN** a synthetic Framed C6 request contains a local-header field or
  header-derived context, or a Pure publication contains a Framed
  protected-composition or C6 Framed request binding, or an active Framed
  declaration retains `protected_geometry`
- **THEN** the opt-in sweep reports the direct static mismatch
- **AND** it does not call a provider, mutate source/state, or add an
  authorization or recovery path
