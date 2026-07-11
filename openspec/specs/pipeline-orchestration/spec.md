## Purpose

Define how the five production stages are orchestrated: the whole pipeline runs on the Node.js 18+ runtime as directly-runnable ESM (`.mjs`, no build step), and the `unified_pipeline.mjs` entry point supports the three editing chains (Chain A: stages 1,3,4,5; Chain B: all stages; Chain C: stage 5 only), loads credentials from `.env`, and offers `--dry-run`, `--force-images`, and `--only <id>` while running Stage 2 via in-framework `stage2_generate_images.mjs` (no external skills). This capability guarantees that full builds and targeted edits share one orchestrator, so an iteration re-runs only the stages it actually needs.

## Requirements

### Requirement: Pipeline runs on Node.js runtime

整个生产管线 SHALL 在 Node.js 18+ 运行时上执行. 所有脚本 SHALL 以 ESM (`.mjs`) 编写, `node script.mjs` 直接运行, 无需编译.

#### Scenario: Agent runs pipeline on Windows

- **WHEN** Agent runs `node scripts/ppt_flow.mjs build <run_dir>` on Windows 11 with Node.js 20
- **THEN** all 5 stages complete successfully, producing a .pptx file

### Requirement: Unified pipeline supports editing chains

The unified pipeline entry point (`unified_pipeline.mjs`) SHALL support three editing chains: Chain A (stages 1,3,4,5), Chain B (all stages), Chain C (stage 5 only).

#### Scenario: Chain A skips image regeneration

- **WHEN** `--stage 1,3,4,5` is passed
- **THEN** Stage 2 (image generation) is skipped entirely
- **AND** pipeline completes in under 5 minutes for a standard deck

### Requirement: Unified pipeline orchestrates stages

`unified_pipeline.mjs` SHALL delegate to individual stage scripts, load credentials from `.env`, and support `--dry-run`, `--force-images`, `--only <id>`, and Stage 2 via in-framework `stage2_generate_images.mjs` + `make_contact_sheet.mjs`.

#### Scenario: Dry run reports stages without executing them

- **WHEN** `node unified_pipeline.mjs --stage all --dry-run` is run
- **THEN** the orchestrator reports the stage scripts it would invoke and the credentials it would load from `.env`
- **AND** no stage is actually executed

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
