## ADDED Requirements

### Requirement: Shared style primitives do not select a retired route
Retained style-master and Image2 client primitives SHALL contribute only to Page Authority raw profiles
and readiness. They SHALL NOT expose whole-page generation as a current production operation.

#### Scenario: Style readiness is evaluated
- **WHEN** Page Authority raw work checks style readiness
- **THEN** the result is bound to the Page Authority profile without selecting a whole-page adapter

