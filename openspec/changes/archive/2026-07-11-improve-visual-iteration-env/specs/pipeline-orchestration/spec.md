## ADDED Requirements

### Requirement: Shared slide-id resolution for --only

`unified_pipeline.mjs` SHALL resolve `--only` tokens via a shared helper also used by `ppt_flow`: exact id, then `sNN`/zero-padded prefix, then 1-based page index into `slide_plan.json`, then unique case-insensitive substring. Ambiguous or unknown tokens SHALL fail and list available ids.

#### Scenario: Prefix s03 resolves

- **WHEN** `--only s03` is passed and exactly one plan id starts with `s03`
- **THEN** Stage 2 processes that slide only

#### Scenario: Page number resolves

- **WHEN** `--only 3` is passed and the plan has at least three slides
- **THEN** Stage 2 targets the third slide's id

### Requirement: --preview uses preview readiness for Stage 2

When Stage 2 is included, `unified_pipeline.mjs` SHALL validate with **pipeline** readiness by default, and with **preview** readiness when `--preview` is set (style master required; metadata gates not required). `--preview` SHALL NOT mutate gate fields.

#### Scenario: Stage 2 with --preview while gates pending

- **WHEN** metadata gates are `pending`
- **AND** style master exists
- **AND** `unified_pipeline … --stage 2 --preview` runs
- **THEN** validation passes the gate check
- **AND** Stage 2 may proceed

#### Scenario: Stage 2 without --preview still needs gates

- **WHEN** metadata gates are `pending`
- **AND** `unified_pipeline … --stage 2` runs without `--preview`
- **THEN** validation fails with a gate-related error

### Requirement: Stage 2 regenerates only when --force-images is set

Stage 2 SHALL skip existing image files unless `--force-images` is set. Presence of `--only` SHALL NOT by itself force regeneration.

#### Scenario: --only without force skips existing files

- **WHEN** `--only <id>` is set, the image file exists, and `--force-images` is absent
- **THEN** Stage 2 skips that file and does not call the image API for it

#### Scenario: --force-images regenerates selection

- **WHEN** `--force-images` is set with or without `--only`
- **THEN** selected existing images are regenerated
