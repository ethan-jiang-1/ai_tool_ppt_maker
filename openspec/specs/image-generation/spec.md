## Purpose

Define Stage 2 (image generation) as an **in-framework Node** capability: async
submit→poll→download via `image_api_client.mjs`, batch generation via
`stage2_generate_images.mjs`, and QA contact sheets via `make_contact_sheet.mjs`.
No external agent skills. No Python. No bash.

## Requirements

### Requirement: Stage 2 is implemented inside the framework

Stage 2 SHALL be implemented by Node ESM modules under
`PPTMAKER_FRAMEWORK/scripts/`. The unified pipeline SHALL call these modules
directly (import or equivalent), not discover `.claude/skills` / `.agents/skills`.

#### Scenario: Pipeline uses in-framework generator

- **WHEN** `unified_pipeline.mjs --stage 2` (or `all`) is run
- **THEN** Stage 2 uses `stage2_generate_images.mjs` with credentials from
  `OPENAI_API_KEY` / `OPENAI_BASE_URL` (APIMART_* aliases accepted)

### Requirement: Contact sheet is in-framework

After image generation, the pipeline SHALL produce a contact sheet using
`make_contact_sheet.mjs` (`@napi-rs/canvas`), not an external skill.

#### Scenario: Contact sheet written under preview/

- **WHEN** Stage 2 completes successfully
- **THEN** a JPEG contact sheet is written under `_generated/preview/`

### Requirement: No external skill dependency

The framework SHALL NOT require `image2-ppt` or `image2-imagegen` skills to be
installed for production readiness.

#### Scenario: Doctor without skills dirs

- **WHEN** env-check runs with no `.claude/skills` / `.agents/skills` present
- **THEN** `stage2_generator` is still `ok` if in-framework scripts exist
