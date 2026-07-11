## MODIFIED Requirements

### Requirement: Run bundle scaffolds a discoverable _state directory

`bundle_layout.mjs` SHALL treat `_state/` as a first-class run-bundle root directory. `initBundle` SHALL create `_state/` and write `_state/README.md` using the same README body owned by `scripts/lib/state.mjs` (so init scaffolding and `writeState` self-heal cannot drift). That README SHALL explain: purpose (playbook execution progress), primary fields, coexistence with `project-metadata.yaml`, pointers to `charter/NODE-SPEC.md` and `scripts/lib/state.mjs`, and that **after a cleared chat / new session** agents MUST run `ppt_flow state` (resume card) before restarting work. `renderTree()` and the module header layout comment SHALL include `_state/` and SHALL indicate that `history.jsonl` is created on demand. `selfCheck()` SHALL fail if `renderTree()` omits `_state`.

#### Scenario: Init creates _state README

- **WHEN** Agent runs init for a new deck (via `bundle_layout --init` or `ppt_flow init`)
- **THEN** `deck_*/_state/README.md` exists
- **AND** the README mentions `NODE-SPEC` or `state.mjs` as the schema authority

#### Scenario: Canonical tree lists _state

- **WHEN** Agent inspects `renderTree()` output (including `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` with no mode flags)
- **THEN** the tree text includes `_state`

#### Scenario: _state README mentions clear-context resume

- **WHEN** a developer reads `_state/README.md` from a freshly initialized deck
- **THEN** it instructs using `ppt_flow state` (or equivalent) to recover progress after a cleared session

### Requirement: Control-file templates mention _state

The `deck-guide.md` body seeded by `initBundle` SHALL mention `_state/state.yaml` as the place to inspect playbook progress (in addition to any `_generated/` artifact hints) and SHALL note that cleared-context resume starts with `ppt_flow state`. The framework copy at `workflow/00-setup/template-deck-guide.md` SHALL likewise mention `_state/state.yaml` in its progress guidance so Expert/manual paths do not contradict init. The deck-root `README.md` template SHALL list `_state/` alongside the three-tier directories. The `project-metadata.yaml` template SHALL include a leading comment stating that pipeline gate fields live in metadata while playbook progress/gates live under `_state/` (field names and values SHALL remain unchanged).

#### Scenario: New deck-guide references state file

- **WHEN** a new bundle is initialized
- **THEN** `deck-guide.md` contains the path `_state/state.yaml`

#### Scenario: Framework template-deck-guide mentions _state

- **WHEN** a developer opens `PPTMAKER_FRAMEWORK/workflow/00-setup/template-deck-guide.md`
- **THEN** it contains the path `_state/state.yaml`

#### Scenario: New root README lists _state

- **WHEN** a new bundle is initialized
- **THEN** the deck-root `README.md` mentions `_state/`

#### Scenario: New metadata comments point at _state

- **WHEN** a new bundle is initialized
- **THEN** `project-metadata.yaml` contains a `#` comment that mentions `_state`

#### Scenario: Deck-guide mentions resume via ppt_flow state

- **WHEN** a developer opens the seeded `deck-guide.md` or framework `template-deck-guide.md`
- **THEN** it mentions `ppt_flow state` (or `state.yaml`) as the clear-context recovery entry
