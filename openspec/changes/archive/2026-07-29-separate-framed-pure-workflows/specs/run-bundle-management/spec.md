## ADDED Requirements

### Requirement: Init and validation distinguish target workflow authoring from CURRENT compatibility

After target activation, fresh run-bundle initialization SHALL seed only the
v2 Page Authority topology and a source-authoring path that requires an
explicit `framed` or `pure` workflow selection before the source becomes a
valid provider-work route. Init and validation SHALL bind a selected target
source to `page-authority-image2-v2` and `image2-page-authority-v2`; they SHALL
not infer the workflow from deck type or create a mixed default.

Bundle validation SHALL continue to recognize the exact CURRENT v1 pair as a
bounded compatibility input. It SHALL reject a partial/hybrid pair with the
owner-issued repair route and SHALL NOT migrate, rewrite, or use production
deck artifacts as evidence.

#### Scenario: Fresh target authoring waits for one explicit choice

- **WHEN** a new run bundle has not yet recorded `framed` or `pure` in its target source
- **THEN** validation identifies the workflow-selection prerequisite before provider work
- **AND** it does not seed a per-slide authority default or a state mode by guesswork

#### Scenario: Current mixed run remains recognized but not reinitialized as target

- **WHEN** bundle validation reads an exact v1 source/state pair with mixed per-slide authorities
- **THEN** it reports the CURRENT compatibility owner and preserves the source bytes
- **AND** it does not rewrite the run into a v2 workflow or create v2 evidence
