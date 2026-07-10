## ADDED Requirements

### Requirement: Stage 1 parses markdown to JSON

Stage 1 SHALL parse `slide-specifications.md` into `slide_plan.json` and `page_prompts/_prompts.json`.

#### Scenario: Parse a body+header-lock slide

- **WHEN** input markdown contains a slide with RENDER MODE `body+header-lock`, KICKER, TITLE, IMAGE PROMPT, SPEAKER NOTE
- **THEN** `slide_plan.json` contains correct `render_mode: "body+header-lock"`, `layout_contract` with header safe zone from `color_palette.json`
- **AND** `_prompts.json` contains assembled prompt with header contract + body text contract + style anchoring clause

#### Scenario: Validate specs catches missing IMAGE PROMPT

- **WHEN** `validate_specs()` runs on a slide spec with empty IMAGE PROMPT
- **THEN** system reports error listing the slide ID and missing field, exits with non-zero code

### Requirement: Stage 1 is a standalone ESM script

The Stage 1 script SHALL be `stage1_build_inputs.mjs`, runnable with `node stage1_build_inputs.mjs <args>`.
