## ADDED Requirements

### Requirement: Init and bundle validation seed only Page Authority topology
Fresh initialization and normal bundle validation SHALL create and validate only the Page Authority
source/state/topology. Existing historical runs remain readable only through the observer/adoption
boundary and SHALL not be mutated by normal validation.

#### Scenario: A fresh bundle is initialized
- **WHEN** init creates a new run bundle
- **THEN** its canonical source marker and production-mode record are Page Authority values


## REMOVED Requirements

### Requirement: Version publication completes only after production-mode registration
**Reason**: The legacy contract is replaced by the current owner state + management.
**Migration**: Use the current contract owned by state + management.

### Requirement: Control-file templates mention _state
**Reason**: The legacy contract is replaced by the current owner run-bundle management.
**Migration**: Use the current contract owned by run-bundle management.

### Requirement: checkBundle supports preview vs pipeline readiness
**Reason**: The legacy contract is replaced by the current owner run-bundle management.
**Migration**: Use the current contract owned by run-bundle management.

### Requirement: First-look README seeds surface layout placement tokens
**Reason**: The legacy contract is replaced by the current owner management docs.
**Migration**: Use the current contract owned by management docs.

### Requirement: Golden sample first-look READMEs match current seeds
**Reason**: The legacy contract is replaced by the current owner management docs.
**Migration**: Use the current contract owned by management docs.

### Requirement: Init creates assets directory skeleton with stub manifest
**Reason**: The legacy contract is replaced by the current owner management.
**Migration**: Use the current contract owned by management.

### Requirement: Structural version publication is source-only and renderer-free
**Reason**: The legacy contract is replaced by the current owner structural versioning.
**Migration**: Use the current contract owned by structural versioning.

### Requirement: Fresh init seeds an explicit production mode and matching source
**Reason**: The legacy contract is replaced by the current owner management.
**Migration**: Use the current contract owned by management.

### Requirement: Bundle checks are pipeline-aware without mutating existing decks
**Reason**: The legacy contract is replaced by the current owner management.
**Migration**: Use the current contract owned by management.

### Requirement: Cross-pipeline transitions publish only clean target versions
**Reason**: The legacy contract is replaced by the current owner adoption transaction.
**Migration**: Use the current contract owned by adoption transaction.

### Requirement: Transition candidates are directional authored contracts
**Reason**: The legacy contract is replaced by the current owner adoption transaction.
**Migration**: Use the current contract owned by adoption transaction.
