## ADDED Requirements

### Requirement: Retained browser runtime is internal Framed-compositor infrastructure
The pinned browser, font, CSP/network denial, timeout, geometry, nonblank, and cleanup guarantees
SHALL remain available to the Page Authority Framed compositor as an internal runtime. They SHALL NOT
be advertised as an HTML deck source, renderer, review, or delivery protocol.

#### Scenario: Runtime use does not create a deck route
- **WHEN** a Framed finalizer invokes the browser capture runtime
- **THEN** callers provide only Page Authority evidence and cannot supply HTML deck source, CSS, browser, or provider controls

