## ADDED Requirements

### Requirement: Stage 3 overlays header text on images

Stage 3 (Header-Lock) SHALL load AI-generated images, overlay kicker/title/subtitle text using `@napi-rs/canvas`, and save to `header_locked/`. Font resolution SHALL follow the priority: bundled fonts > `PPT_FONT_DIR` env var > OS font directories > fallback sans.

#### Scenario: Overlay header on body+header-lock image

- **WHEN** input image is `body+header-lock` mode, `slide_plan.json` specifies kicker "INTRODUCTION", title "The Problem Statement" at configured positions
- **THEN** output image has text rendered at exact pixel positions from `color_palette.json` header_lock config
- **AND** text uses the specified font family, weight, size, and color
- **AND** full-page mode images pass through unchanged

#### Scenario: Missing font falls back gracefully

- **WHEN** configured font file is not found in any search path
- **THEN** system logs a warning and falls back to a sans-serif font at the correct size
- **AND** does NOT abort pipeline execution

### Requirement: Stage 3 is a standalone ESM script

The Stage 3 script SHALL be `stage3_lock_headers.mjs`, using `@napi-rs/canvas` for image manipulation and text rendering.
