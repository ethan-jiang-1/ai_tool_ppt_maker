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

### Requirement: First-look README seeds surface _scratch on the placement map

Init-seeded directory READMEs from `_DIR_READMES` in `bundle_layout.mjs` SHALL make `_scratch/` discoverable **before** an agent opens the leaf drawer, consistent with capability `run-bundle-layout` Where Map tokens. The deck-root README (`.`) SHALL state that version temp/bak lives under `3_versions/v{n}/_scratch/` and SHALL mention the structure gradient (上严下松 / root strictest). The `3_versions` README SHALL state that `--new-version` does not copy `_scratch/` contents (in addition to not copying `_generated/`).

#### Scenario: Deck-root seed README names _scratch

- **WHEN** Agent reads the init-seeded deck-root `README.md` from `_DIR_READMES['.']`
- **THEN** the text mentions `_scratch` under `3_versions/v{n}/` as the temp/bak outlet

#### Scenario: Versions seed README mentions scratch on new-version

- **WHEN** Agent reads the init-seeded `3_versions/README.md`
- **THEN** the text states that new-version does not copy `_scratch` contents

### Requirement: Golden sample first-look READMEs match current seeds

The live golden deck `deck_ai_sdlc_keynote` root `README.md` and `3_versions/v1/README.md` SHALL be refreshed to match the current init-seed placement map (including `_scratch/`), because `_writeIfAbsent` does not update stale READMEs on existing decks.

#### Scenario: Keynote root README mentions _scratch

- **WHEN** Agent opens `deck_ai_sdlc_keynote/README.md`
- **THEN** the file mentions `_scratch` as the version temp outlet (not an outdated three-tier-only map without scratch)
