# Run Bundle Management Specification

## Purpose

Define creation, validation, current topology, and bounded historical handling for
run bundles.
## Requirements
### Requirement: Init and bundle validation seed only Page Authority topology

Fresh initialization and normal bundle validation SHALL create and validate only
the Page Authority source, state, and topology. Existing historical runs remain
readable only through the observer/adoption boundary and SHALL not be mutated by
normal validation.

#### Scenario: A fresh bundle is initialized

- **WHEN** init creates a new run bundle
- **THEN** its canonical source marker and production-mode record are Page Authority values

### Requirement: Current bundle ownership is explicit

Bundle validation SHALL identify source, state, raw, review, final, assembly, and
notes ownership through Page Authority paths. `_generated/` remains rebuildable
derived data and is never hand-edited source.

#### Scenario: A current version is checked

- **WHEN** a Page Authority run is validated
- **THEN** it receives current ownership diagnostics without selecting historical artifacts

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
