## MODIFIED Requirements

### Requirement: Run-bundle root admits an agent-agnostic generated entry control

The canonical strict deck root SHALL admit `AGENTS.md` as a named control file alongside `CLAUDE.md`, `deck-guide.md`, and `README.md`. `deck-guide.md` SHALL be the static, portable **continuation card**: it SHALL carry deck identity, the fixed `framework_relation: ../PPTMAKER_FRAMEWORK` (the project-owned soft bundle, one level above the deck root), and a plain-language invitation to attach the file to a new chat and state the desired continuation in ordinary language. `README.md`, `AGENTS.md`, and `CLAUDE.md` SHALL be short agent-agnostic pointers that route to `deck-guide.md`; none of them SHALL be a second workflow, directory ontology, command menu, or status surface. `bundle_layout.mjs` constants, deck-root whitelist, module tree comment, and `renderTree()` SHALL agree on these control files.

The continuation card SHALL be static. It SHALL NOT carry the current run version as authoritative, the current node, the next action, gate status, a digest, or any mutable state. Any version reference it contains SHALL be the init-time seed value and SHALL be labeled non-authoritative, directing the reader to `_state/state.yaml` (and `ppt_flow state`/`status`) for the current version and position. No new deck-root file is introduced to hold the continuation-card role.

Legacy run bundles without `AGENTS.md` (or without the continuation-card content in `deck-guide.md`) SHALL remain structurally valid. A manually added unknown root file remains invalid; the deck-root whitelist SHALL NOT be loosened to admit a new continuation-card file type, and adding the continuation-card role to `deck-guide.md` SHALL NOT loosen any other root rule.

#### Scenario: Canonical tree shows both Agent entry controls

- **WHEN** Agent inspects `renderTree()`
- **THEN** deck root includes `AGENTS.md` and `CLAUDE.md`
- **AND** both point conceptually to `deck-guide.md`

#### Scenario: Legacy deck remains valid

- **WHEN** an existing conformant run bundle lacks `AGENTS.md`
- **AND** structure validation runs
- **THEN** absence of that optional compatibility control alone does not fail validation

#### Scenario: Deck root designates the continuation card and thin pointers

- **WHEN** Agent reads the deck-root file roles from `run-bundle-layout`
- **THEN** `deck-guide.md` is designated the static portable continuation card carrying deck identity and the fixed `../PPTMAKER_FRAMEWORK` relation
- **AND** `README.md`, `AGENTS.md`, and `CLAUDE.md` are designated thin pointers to `deck-guide.md`
- **AND** no new deck-root file is admitted to hold the continuation-card role

#### Scenario: Continuation card carries no mutable status

- **WHEN** the continuation-card role is defined
- **THEN** it forbids authoritative current version, current node, next action, gate status, and digest fields
- **AND** any seeded version reference is labeled non-authoritative and directs the reader to `_state` for the current position
