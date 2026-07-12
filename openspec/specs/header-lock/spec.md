## Purpose

Define Stage 3 (Header-Lock) of the production pipeline: overlaying deterministic kicker/title/subtitle text onto AI-generated images with `@napi-rs/canvas`, at the exact pixel positions declared in the visual config. This capability guarantees that header typography is pixel-precise and reproducible rather than baked into the image by the generator, that fonts resolve through a defined priority chain (bundled fonts > `PPT_FONT_DIR` > OS font directories > fallback sans), and that a missing font degrades gracefully with a warning instead of aborting the pipeline.
## Requirements
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

#### Scenario: Stage 3 runs standalone

- **WHEN** `node stage3_lock_headers.mjs <run_dir>` is run directly
- **THEN** it overlays header text onto the images and writes them to `header_locked/` using `@napi-rs/canvas`, without requiring the orchestrator

### Requirement: Stage 3 follows resolved render mode regardless of its source

Stage 3 SHALL overlay header text on every slide whose resolved `render_mode` is `body+header-lock`, regardless of whether the source is a per-slide explicit value, policy exception, whole-deck policy default, or legacy VISUAL TYPE derivation. Stage 3 SHALL pass every `full-page` slide through unchanged. `render_mode_source` is diagnostic metadata and SHALL NOT alter Stage 3 behavior.

#### Scenario: Every body+header-lock source overlays
- **WHEN** slides resolve to `body+header-lock` from different supported sources
- **THEN** Stage 3 overlays each of them using the same normal processing path

#### Scenario: Every full-page source passes through
- **WHEN** slides resolve to `full-page` from policy, explicit, hero, or legacy sources
- **THEN** Stage 3 passes each through without drawing header text

### Requirement: Hard overlay and full-page soft contract share real visual config geometry

Stage 3 SHALL continue to draw using the header position, font, line-height, margin, color, and fixed left-alignment values returned by `visual_config.mjs`. Stage 1's content full-page soft contract SHALL target those same values. This shared target SHALL NOT be interpreted as a guarantee that an image model reproduces the hard overlay pixel-for-pixel.

#### Scenario: Both modes target the same configuration
- **WHEN** the same content slide is prepared once as full-page and once as body+header-lock
- **THEN** both paths target the same configurable header geometry and fixed left-alignment invariant
- **AND** only Stage 3 guarantees the final pixel placement and text clarity

