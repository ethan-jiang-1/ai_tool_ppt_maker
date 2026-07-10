## ADDED Requirements

### Requirement: Pipeline runs on Node.js runtime

整个生产管线 SHALL 在 Node.js 18+ 运行时上执行, 不依赖 Python 或 bash. 所有脚本 SHALL 以 TypeScript 编写, 通过 `tsx` 直接运行, 无需预编译.

#### Scenario: Agent runs environment check

- **WHEN** Agent runs `npx tsx 00_project_setup/00-env-check.ts`
- **THEN** system checks Node.js version >= 18, npm availability, API key in `.env`, required npm packages installed
- **AND** outputs READY/NOT READY status identical to the Python version

#### Scenario: Agent runs pipeline on Windows

- **WHEN** Agent runs `npx tsx 06_reference_scripts/ppt_flow.ts build <run_dir>` on Windows 11 with Node.js 20
- **THEN** all 5 stages complete successfully, producing a .pptx file identical in appearance to the Python pipeline output

### Requirement: Stage 1 parses markdown to JSON

Stage 1 SHALL parse `slide-specifications.md` into `slide_plan.json` and `page_prompts/_prompts.json`, with identical output schema to the Python `stage1_build_inputs.py`.

#### Scenario: Parse a body+header-lock slide

- **WHEN** input markdown contains a slide with RENDER MODE `body+header-lock`, KICKER, TITLE, IMAGE PROMPT, SPEAKER NOTE
- **THEN** `slide_plan.json` contains correct `render_mode: "body+header-lock"`, `layout_contract` with header safe zone from `color_palette.json`
- **AND** `_prompts.json` contains assembled prompt with header contract + body text contract + style anchoring clause

#### Scenario: Validate specs catches missing IMAGE PROMPT

- **WHEN** `validate_specs()` runs on a slide spec with empty IMAGE PROMPT
- **THEN** system reports error listing the slide ID and missing field, exits with non-zero code

### Requirement: Stage 3 overlays header text on images

Stage 3 (Header-Lock) SHALL load AI-generated images, overlay kicker/title/subtitle text using `@napi-rs/canvas`, and save to `header_locked/`. Font resolution SHALL follow the same priority: bundled fonts > `PPT_FONT_DIR` env var > OS font directories > fallback sans.

#### Scenario: Overlay header on body+header-lock image

- **WHEN** input image is `body+header-lock` mode, `slide_plan.json` specifies kicker "INTRODUCTION", title "The Problem Statement" at configured positions
- **THEN** output image has text rendered at exact pixel positions from `color_palette.json` header_lock config
- **AND** text uses the specified font family, weight, size, and color
- **AND** full-page mode images pass through unchanged

#### Scenario: Missing font falls back gracefully

- **WHEN** configured font file is not found in any search path
- **THEN** system logs a warning and falls back to a sans-serif font at the correct size
- **AND** does NOT abort pipeline execution

### Requirement: Stage 4 builds PPTX container

Stage 4 SHALL assemble final PNG images into a 16:9 `.pptx` file using `pptxgenjs`. Each slide SHALL be a full-bleed image, blank layout.

#### Scenario: Build PPTX from header_locked images

- **WHEN** `header_locked/` contains N PNG images and `slide_plan.json` has N slides
- **THEN** output .pptx has N slides, each a 16:9 full-frame image
- **AND** slide order matches `slide_plan.json` sequence

### Requirement: Stage 5 injects speaker notes

Stage 5 SHALL extract SPEAKER NOTE blocks from source markdown and inject them into the PPTX notes panel.

#### Scenario: Inject notes into PPTX

- **WHEN** source markdown has N slides each with a SPEAKER NOTE section
- **THEN** output .pptx has speaker notes in Presenter View for each slide
- **AND** notes count matches slide count, or system aborts with error

### Requirement: Pipeline supports editing chains

The unified pipeline entry point SHALL support the same three editing chains as the Python version: Chain A (stages 1,3,4,5), Chain B (all stages), Chain C (stage 5 only).

#### Scenario: Chain A skips image regeneration

- **WHEN** `--stage 1,3,4,5` is passed
- **THEN** Stage 2 (image generation) is skipped entirely
- **AND** pipeline completes in under 5 minutes for a standard deck

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose the same command names as the Python version: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`.

#### Scenario: Agent runs ppt_flow init

- **WHEN** Agent runs `npx tsx 06_reference_scripts/ppt_flow.ts init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created at `deck_demo/` with the three-tier structure, preset templates seeded, metadata initialized

### Requirement: Bundle layout is the directory constitution

`bundle_layout.ts` SHALL be the single source of truth for run-bundle directory structure. All other scripts SHALL import path constants from it. `--check` SHALL validate a directory against the whitelist.

#### Scenario: Init creates whitelist-clean bundle

- **WHEN** `bundle_layout --init deck_test` runs
- **THEN** `bundle_layout --check deck_test/3_versions/v1` passes with zero violations

#### Scenario: Check catches ad-hoc directory

- **WHEN** a run bundle has a manually created `deck_test/random_dir/` not in the whitelist
- **THEN** `bundle_layout --check` reports it as an unexpected entry and exits non-zero
