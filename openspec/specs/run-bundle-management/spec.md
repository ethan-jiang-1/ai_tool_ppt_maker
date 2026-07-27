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
