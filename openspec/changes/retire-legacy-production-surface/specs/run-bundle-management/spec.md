## ADDED Requirements

### Requirement: Init and bundle validation seed only Page Authority topology
Fresh initialization and normal bundle validation SHALL create and validate only the Page Authority
source/state/topology. Existing historical runs remain readable only through the observer/adoption
boundary and SHALL not be mutated by normal validation.

#### Scenario: A fresh bundle is initialized
- **WHEN** init creates a new run bundle
- **THEN** its canonical source marker and production-mode record are Page Authority values

