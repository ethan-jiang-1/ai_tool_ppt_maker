## ADDED Requirements

### Requirement: state.yaml carries a discoverability header on every write

`writeState(deckDir, state)` SHALL write `state.yaml` as a UTF-8 file whose leading lines are `#` comments that identify the file as playbook execution state and point readers to `charter/NODE-SPEC.md` and `scripts/lib/state.mjs` (and MAY mention `ppt_flow state`). The header text SHALL be defined once in `state.mjs` and SHALL be re-emitted on every successful write so it is not lost when the YAML body is regenerated from the in-memory object. `parseYaml` / `readState` SHALL continue to ignore `#` comment lines.

#### Scenario: Header survives rewrite

- **WHEN** `writeState` is called twice on the same deck with updated state
- **THEN** the resulting `state.yaml` still begins with a `#` comment header
- **AND** `readState` still returns the expected playbook fields

### Requirement: writeState ensures _state README exists

`state.mjs` SHALL export the canonical `_state/README.md` body used by bundle scaffolding. Before or as part of writing `state.yaml`, `writeState` SHALL ensure `_state/README.md` exists (create if absent) using that same body. `state.mjs` SHALL NOT import `bundle_layout.mjs`.

#### Scenario: Legacy deck gains README on next write

- **WHEN** a deck has `_state/state.yaml` but no `_state/README.md`
- **AND** `writeState` runs
- **THEN** `_state/README.md` is created with the canonical discoverability content

#### Scenario: State module does not import bundle_layout

- **WHEN** a developer inspects `scripts/lib/state.mjs` imports
- **THEN** it does not import `bundle_layout.mjs`
