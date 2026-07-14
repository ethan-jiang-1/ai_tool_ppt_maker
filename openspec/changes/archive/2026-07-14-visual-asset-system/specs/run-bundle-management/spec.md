## ADDED Requirements

### Requirement: Init creates assets directory skeleton with stub manifest

`initBundle()` SHALL create the `assets/` subdirectory under `2_backbone/visual-style/` with four entries: `svg/`, `reference/`, `icons/` subdirectories and a stub `asset-manifest.yaml`. The stub manifest SHALL contain `version: 1` and `assets: {}`. A README file SHALL be written into the `assets/` directory explaining its purpose (visual asset catalog) and usage (add asset files, register in manifest, bind to slides with `**VISUAL ASSETS**`).

The `assets/` directory is **optional infrastructure** — `checkBundle()` SHALL NOT require it, and the pipeline SHALL operate correctly when it is absent. Old decks created before this feature SHALL continue to pass validation without it. `--new-version` SHALL copy any existing `overrides/visual-style/assets/` but SHALL NOT require it.

#### Scenario: Init creates assets skeleton

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** `2_backbone/visual-style/assets/` exists
- **AND** `2_backbone/visual-style/assets/asset-manifest.yaml` exists with `version: 1` and `assets: {}`
- **AND** `2_backbone/visual-style/assets/svg/`, `reference/`, and `icons/` directories exist

#### Scenario: Init writes assets README

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** `2_backbone/visual-style/assets/README.md` exists
- **AND** the README mentions `asset-manifest.yaml` and `**VISUAL ASSETS**`

#### Scenario: Init log mentions asset catalog creation

- **WHEN** `initBundle()` scaffolds a new deck
- **THEN** the returned log array includes an entry for the asset catalog path

#### Scenario: Old deck without assets directory passes validation

- **WHEN** `checkBundle()` validates a deck created before this feature (no `assets/` directory)
- **THEN** validation passes without error
- **AND** the absence of `assets/` is not reported as a problem
