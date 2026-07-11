## ADDED Requirements

### Requirement: Version directory includes _scratch for temp backups

`bundle_layout.mjs` SHALL treat `3_versions/v{n}/_scratch/` as a first-class version subdirectory (`SCRATCH_SUBDIR`), embodying the **upper-strict / lower-loose** gradient: the version leaf may hold disposable temp files here; the deck root must not. `initBundle` and `--new-version` SHALL create `_scratch/` and seed `_scratch/README.md` explaining: purpose (this version’s temp copies / `.bak` / disposable drafts — not SSOT), the strictness gradient (deck root strict; `_scratch` loose), what belongs elsewhere (`1_upstream.../style-master-iterations/`, `_lessons/`, `_state/`, `_generated/`), and that contents MAY be deleted. `--new-version` SHALL NOT copy prior version scratch files. `renderTree()` SHALL list `_scratch/`. `selfCheck()` SHALL fail if `renderTree()` omits `_scratch`. Init-seeded `.gitignore` SHALL ignore scratch contents while keeping `README.md` tracked (pattern such as `3_versions/*/_scratch/*` with `!3_versions/*/_scratch/README.md`).

#### Scenario: Init creates version _scratch README

- **WHEN** Agent runs init for a new deck
- **THEN** `deck_*/3_versions/v1/_scratch/README.md` exists
- **AND** the README states temp/backup purpose and points away from `_lessons` / `_generated` / `_state`

#### Scenario: new-version seeds empty scratch

- **WHEN** Agent runs `--new-version` from v1 that has files under `_scratch/`
- **THEN** the new version has `_scratch/README.md`
- **AND** does not contain the prior version’s scratch bak files

#### Scenario: Canonical tree lists _scratch

- **WHEN** Agent inspects `renderTree()` output
- **THEN** the tree text includes `_scratch`

### Requirement: checkBundle allows _scratch and rejects deck-root litter

`checkBundle` version-root whitelist SHALL allow `_scratch/` in addition to slide-specifications, `overrides/`, `_generated/`, and `README.md`. Files inside `_scratch/` SHALL NOT be individually whitelisted (loose leaf). `checkBundle` SHALL also validate deck-root entries (strictest layer): only control files (`deck-guide.md`, `CLAUDE.md`, `project-metadata.yaml`, `README.md`), optional `MIGRATION.md`, tier dirs (`1_upstream_raw_material/`, `2_backbone/`, `3_versions/`), `_state/`, `_lessons/`, and credential/ignore files (`.env`, `.env.example`, `.gitignore`) are allowed; other entries (e.g. `_slidespec.bak-*`, ad-hoc `_tmp/`) SHALL be reported as unexpected and fail the check.

#### Scenario: Version _scratch is not unexpected

- **WHEN** a version dir contains `_scratch/` with a bak file inside
- **AND** Agent runs `bundle_layout --check` on that version
- **THEN** `_scratch` is not reported as an unexpected version-root entry

#### Scenario: Deck-root bak fails check

- **WHEN** a deck root contains `_slidespec.bak-kicker` (or similar loose bak)
- **AND** Agent runs `bundle_layout --check` on a version under that deck
- **THEN** check reports the deck-root entry as unexpected and exits non-zero
