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
