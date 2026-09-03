## MODIFIED Requirements

### Requirement: Management enforces run-bundle-layout via bundle_layout.mjs

`bundle_layout.mjs` SHALL provide the CLI/scaffold surface that **enforces** the run-bundle ontology defined by capability `run-bundle-layout`: `--init` (scaffold, including `_state/` hints and initial state when absent), `--check` (validate), `--new-version` (create clean downstream version), and `--self-check` (drift alarm for CI, including `_state` presence in `renderTree()`). Other scripts SHALL import general bundle path constants from `bundle_layout.mjs`. The `_state` directory/file name constants SHALL be imported from `scripts/lib/state.mjs` (not re-declared as string literals in `bundle_layout.mjs`). Absence of `_state/` on a legacy deck SHALL NOT by itself cause `--check --structure-only` to fail.

This capability SHALL NOT define a second directory ontology. Conformity of `deck_*` trees is owned by `run-bundle-layout`. The glossary Where Map is owned by `run-bundle-layout`.

#### Scenario: Init creates whitelist-clean bundle

- **WHEN** `bundle_layout --init deck_test` runs
- **THEN** `bundle_layout --check deck_test/3_versions/v1 --structure-only` passes with zero violations

#### Scenario: Check catches ad-hoc directory

- **WHEN** a run bundle has a manually created unexpected entry at the version root (for example `random_dir/`)
- **THEN** `bundle_layout --check` reports it as an unexpected entry and exits non-zero

#### Scenario: Init seeds _state for both entry points

- **WHEN** either `bundle_layout --init` or `ppt_flow init` creates a new deck
- **THEN** `deck_*/_state/state.yaml` exists after init completes
- **AND** the file begins with a `#` comment header

### Requirement: Version directory includes _scratch for temp backups

`bundle_layout.mjs` SHALL **enforce** the `run-bundle-layout` role of `3_versions/v{n}/_scratch/` (`SCRATCH_SUBDIR`): `initBundle` and `--new-version` SHALL create `_scratch/` and seed `_scratch/README.md` (purpose, gradient pointer, route-elsewhere, deletable). `--new-version` SHALL NOT copy prior version scratch files. `selfCheck()` SHALL fail if `renderTree()` omits `_scratch`. Init-seeded `.gitignore` SHALL ignore scratch contents while keeping `README.md` tracked.

#### Scenario: Init creates version _scratch README

- **WHEN** Agent runs init for a new deck
- **THEN** `deck_*/3_versions/v1/_scratch/README.md` exists
- **AND** the README states temp/backup purpose and points away from `_lessons` / `_generated` / `_state`

#### Scenario: new-version seeds empty scratch

- **WHEN** Agent runs `--new-version` from v1 that has files under `_scratch/`
- **THEN** the new version has `_scratch/README.md`
- **AND** does not contain the prior version’s scratch bak files

### Requirement: checkBundle allows _scratch and rejects deck-root litter

`checkBundle` SHALL enforce `run-bundle-layout` strictness: version-root whitelist allows `_scratch/` (internals not filename-whitelisted); deck-root allows only control files, optional `MIGRATION.md`, tier dirs, `_state/`, `_lessons/`, and `.env` / `.env.example` / `.gitignore`; other deck-root entries (for example `_slidespec.bak-*`, ad-hoc `_tmp/`) SHALL fail the check.

#### Scenario: Version _scratch is not unexpected

- **WHEN** a version dir contains `_scratch/` with a bak file inside
- **AND** Agent runs `bundle_layout --check` on that version
- **THEN** `_scratch` is not reported as an unexpected version-root entry

#### Scenario: Deck-root bak fails check

- **WHEN** a deck root contains `_slidespec.bak-kicker` (or similar loose bak)
- **AND** Agent runs `bundle_layout --check` on a version under that deck
- **THEN** check reports the deck-root entry as unexpected and exits non-zero

## RENAMED Requirements

- FROM: `### Requirement: Bundle layout is the directory constitution`
- TO: `### Requirement: Management enforces run-bundle-layout via bundle_layout.mjs`

## ADDED Requirements

### Requirement: First-look README seeds surface layout placement tokens

Init-seeded `_DIR_READMES` SHALL surface `run-bundle-layout` placement tokens before an agent opens leaf drawers: deck-root README SHALL name `3_versions/v{n}/_scratch/` as version temp/bak and mention structure gradient (上严下松); `3_versions` README SHALL state that `--new-version` does not copy `_scratch/` contents (in addition to not copying `_generated/`).

#### Scenario: Deck-root seed README names _scratch

- **WHEN** Agent reads the init-seeded deck-root `README.md`
- **THEN** the text mentions `_scratch` under `3_versions/v{n}/` as the temp/bak outlet

#### Scenario: Versions seed README mentions scratch on new-version

- **WHEN** Agent reads the init-seeded `3_versions/README.md`
- **THEN** the text states that new-version does not copy `_scratch` contents

### Requirement: Golden sample first-look READMEs match current seeds

`deck_ai_sdlc_bpm_keynote/README.md` and `deck_ai_sdlc_bpm_keynote/3_versions/v1/README.md` SHALL be refreshed to match current init-seed placement maps (including `_scratch/`), because `_writeIfAbsent` does not update stale READMEs.

#### Scenario: Keynote root README mentions _scratch

- **WHEN** Agent opens `deck_ai_sdlc_bpm_keynote/README.md`
- **THEN** the file mentions `_scratch` as the version temp outlet
