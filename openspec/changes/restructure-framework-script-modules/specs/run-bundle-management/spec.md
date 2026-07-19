## MODIFIED Requirements

### Requirement: Management enforces run-bundle-layout via bundle_layout.mjs

`PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs` SHALL provide the CLI/scaffold surface that **enforces** the run-bundle ontology defined by capability `run-bundle-layout`: `--init` (scaffold, including `_state/` hints and initial state when absent), `--check` (validate), `--new-version` (create clean downstream version), and `--self-check` (drift alarm for CI, including `_state` presence in `renderTree()`). Other modules SHALL import general bundle path constants from this public shared run-bundle interface. The `_state` directory/file name constants SHALL be imported from `PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs` and SHALL NOT be re-declared as string literals in `bundle_layout.mjs`. Absence of `_state/` on a legacy deck SHALL NOT by itself cause `--check --structure-only` to fail.

This capability SHALL NOT define a second directory ontology. Conformity of `deck_*` trees is owned by `run-bundle-layout`. The glossary Where Map is owned by `run-bundle-layout`.

#### Scenario: Init creates whitelist-clean bundle

- **WHEN** the canonical `bundle_layout --init deck_test` direct CLI runs
- **THEN** `bundle_layout --check deck_test/3_versions/v1 --structure-only` passes with zero violations

#### Scenario: Check catches ad-hoc directory

- **WHEN** a run bundle has a manually created unexpected entry at the version root
- **THEN** `bundle_layout --check` reports it as an unexpected entry and exits non-zero

#### Scenario: Init seeds _state for both entry points

- **WHEN** either the relocated direct `bundle_layout --init` or stable `ppt_flow init` creates a new deck
- **THEN** `deck_*/_state/state.yaml` exists after init completes
- **AND** the file begins with a `#` comment header

### Requirement: Run bundle scaffolds a discoverable _state directory

`bundle_layout.mjs` SHALL treat `_state/` as a first-class run-bundle root directory. `initBundle` SHALL create `_state/` and write `_state/README.md` using the same README body owned by `PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs` so init scaffolding and `writeState` self-heal cannot drift. That README SHALL explain: purpose (playbook execution progress / whole-session resume pointer), primary fields (including that per-node `waiting_for` may record human waits), coexistence with `project-metadata.yaml`, pointers to `charter/NODE-SPEC.md` and `PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs`, and that **after a cleared chat / disconnect / new session** agents MUST run `ppt_flow state` (where-am-I resume card) before restarting work because progress is on the deck disk, not in chat. `renderTree()` and the module header layout comment SHALL include `_state/` and SHALL indicate that `history.jsonl` is created on demand. `selfCheck()` SHALL fail if `renderTree()` omits `_state`.

#### Scenario: Init creates _state README

- **WHEN** Agent runs init for a new deck through either canonical entry
- **THEN** `deck_*/_state/README.md` exists
- **AND** the README mentions `NODE-SPEC` or the shared `state.mjs` interface as schema authority

#### Scenario: Canonical tree lists _state

- **WHEN** Agent inspects `renderTree()` output, including the relocated direct `bundle_layout.mjs` with no mode flags
- **THEN** the tree text includes `_state`

#### Scenario: _state README mentions clear-context resume

- **WHEN** a developer reads `_state/README.md` from a freshly initialized deck
- **THEN** it instructs using `ppt_flow state` or equivalent to recover progress after a cleared session
