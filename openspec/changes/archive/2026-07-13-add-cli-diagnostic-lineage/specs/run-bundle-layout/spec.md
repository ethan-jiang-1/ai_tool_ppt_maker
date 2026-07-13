## ADDED Requirements

### Requirement: Run-bundle root admits an agent-agnostic generated entry control

The canonical strict deck root SHALL admit `AGENTS.md` as a named control file alongside `CLAUDE.md` and `deck-guide.md`. `AGENTS.md` SHALL be a short agent-agnostic pointer to the guide, not a second workflow or directory ontology. `bundle_layout.mjs` constants, deck-root whitelist, module tree comment, and `renderTree()` SHALL agree on this control file.

Legacy run bundles without `AGENTS.md` SHALL remain structurally valid. A manually added unknown root file remains invalid; adding `AGENTS.md` to the whitelist SHALL NOT loosen other root rules.

#### Scenario: Canonical tree shows both Agent entry controls

- **WHEN** Agent inspects `renderTree()`
- **THEN** deck root includes `AGENTS.md` and `CLAUDE.md`
- **AND** both point conceptually to `deck-guide.md`

#### Scenario: Legacy deck remains valid

- **WHEN** an existing conformant run bundle lacks `AGENTS.md`
- **AND** structure validation runs
- **THEN** absence of that optional compatibility control alone does not fail validation
