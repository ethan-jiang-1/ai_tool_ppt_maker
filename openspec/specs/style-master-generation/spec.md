## Purpose

Define retained visual-style primitives used by Page Authority raw profiles and
readiness. They do not create a separate production route.

## Requirements

### Requirement: Style master uses in-framework image client

When a retained visual-style sample is explicitly created, its Image2 client
primitive SHALL use the framework credential and transport owner rather than a
second parser, provider route, or external skill. The sample remains reference
input and does not become a source receipt or a production selector.

#### Scenario: Retained style sample uses the shared client

- **WHEN** an explicitly authorized visual-style sample is requested
- **THEN** the framework uses the shared Page Authority client boundary
- **AND** it creates no alternate adapter or lifecycle

### Requirement: Shared style primitives do not select a retired route

Retained visual-style and Image2 client primitives SHALL contribute only to Page
Authority raw profiles and readiness. They SHALL NOT expose an alternate current
production operation.

#### Scenario: Style readiness is evaluated

- **WHEN** Page Authority raw work checks style readiness
- **THEN** the result is bound to the Page Authority profile without selecting another adapter
