## MODIFIED Requirements

### Requirement: Init and bundle validation seed only Page Authority topology
Fresh initialization and normal bundle validation SHALL create and validate only v2 Page Authority source, state, and topology. A retired source/state pair remains byte-preserving under read-only classification and SHALL not be mutated, initialized, or adopted by normal validation.

#### Scenario: A fresh bundle is initialized
- **WHEN** init creates a new run bundle
- **THEN** its canonical source marker and production-mode record are v2 Page Authority values

#### Scenario: A retired bundle is checked
- **WHEN** normal validation reads a retired source/state identity
- **THEN** it returns the migration/export hard-stop without writing bundle state or artifacts

### Requirement: Init and validation distinguish target workflow authoring from CURRENT compatibility
After retirement, fresh run-bundle initialization SHALL seed only the v2 Page Authority topology and a source-authoring path that requires an explicit `framed` or `pure` workflow selection before the source becomes a valid provider-work route. Init and validation SHALL bind a selected target source to `page-authority-image2-v2` and `image2-page-authority-v2`; they SHALL not infer the workflow from deck type or create a mixed default.

Bundle validation SHALL reject every non-v2 pair with the owner-issued identity or migration/export hard-stop. It SHALL NOT migrate, rewrite, or use production deck artifacts as evidence.

#### Scenario: Fresh target authoring waits for one explicit choice
- **WHEN** a new run bundle has not yet recorded `framed` or `pure` in its target source
- **THEN** validation identifies the workflow-selection prerequisite before provider work
- **AND** it does not seed a per-slide authority default or a state mode by guesswork

#### Scenario: Retired pair is not reinitialized
- **WHEN** bundle validation reads a retired source/state pair
- **THEN** it preserves source bytes and reports its bounded migration/export action
- **AND** it does not create v2 evidence or a compatibility route
