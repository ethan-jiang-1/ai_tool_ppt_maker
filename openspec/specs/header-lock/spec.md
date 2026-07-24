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
Stage 3 SHALL overlay header text on every slide whose resolved `render_mode` is `body+header-lock`, regardless of whether the source is a per-slide explicit value, policy exception, whole-deck policy default, or current whole-page plan control. Stage 3 SHALL pass every `full-page` slide through unchanged. `render_mode_source` is diagnostic metadata and SHALL NOT alter Stage 3 behavior.

#### Scenario: Every body+header-lock source overlays
- **WHEN** slides resolve to `body+header-lock` from different supported sources
- **THEN** Stage 3 overlays each of them using the same normal processing path

#### Scenario: Every full-page source passes through
- **WHEN** slides resolve to `full-page` from supported policy or explicit source controls
- **THEN** Stage 3 passes each through without drawing header text

### Requirement: Hard overlay and full-page soft contract share real visual config geometry

Stage 3 SHALL continue to draw using the header position, font, line-height, margin, color, and fixed left-alignment values returned by `visual_config.mjs`. Stage 1's content full-page soft contract SHALL target those same values. This shared target SHALL NOT be interpreted as a guarantee that an image model reproduces the hard overlay pixel-for-pixel.

#### Scenario: Both modes target the same configuration
- **WHEN** the same content slide is prepared once as full-page and once as body+header-lock
- **THEN** both paths target the same configurable header geometry and fixed left-alignment invariant
- **AND** only Stage 3 guarantees the final pixel placement and text clarity

### Requirement: Stage 3 publishes an ID-addressed final-image manifest
Stage 3 SHALL resolve a `verified` raw input by formal slide ID, render engine, and `raw-render` kind through the current whole-page raw-render manifest and SHALL write new final images with position-independent ID-addressed names. It SHALL atomically maintain `_generated/header_locked/_manifest.json` with exactly one current entry per processed `(slide_id, render_engine, "final-slide")` key. Each entry SHALL record artifact kind, engine, the final output path and SHA-256, raw input path and SHA-256, resolved render mode, the header fields/config or deterministic header fingerprint that governs the output, and generation time. Full-page passthrough outputs SHALL be registered under the same contract.

Only provenance-complete manifest entries SHALL be `verified`. Stage 3 SHALL NOT infer current identity or select among files from a directory glob when a manifest mapping is available, and SHALL reject an unregistered raw input as a current source.

#### Scenario: Body-lock output records complete provenance
- **WHEN** Stage 3 overlays the header for slide `UXGap`
- **THEN** its manifest entry maps `UXGap` to the final image
- **AND** binds the output bytes to the raw-image SHA, resolved mode, and header fingerprint

#### Scenario: Full-page passthrough is registered
- **WHEN** slide `PPTGo` resolves to `full-page`
- **THEN** Stage 3 registers its passthrough final image and byte SHA in the same manifest
- **AND** downstream assembly does not need a separate filename rule for that mode

#### Scenario: Reorder preserves final artifact
- **WHEN** an unchanged slide is reordered and its raw-image SHA, render mode, and header fingerprint remain current
- **THEN** its ID-addressed Stage 3 artifact remains reusable
- **AND** its old position is not part of the manifest identity or fingerprint

### Requirement: Target versions rebuild Stage 3 locally from verified raw inputs
This change SHALL NOT materialize Stage 3 final images across versions. After a verified expensive raw render is materialized into a target version, Stage 3 SHALL recompute the local final/header-lock output and atomically publish a target-owned `final-slide` manifest entry using current source/header inputs. This keeps cheap output derivation and provenance local to the target. A missing, unregistered, or unverified raw input SHALL stop Stage 3 for that ID and report the upstream `needs_render` prerequisite; Stage 3 SHALL NOT invoke a remote renderer.

#### Scenario: Verified raw image is recomposited after reorder
- **WHEN** a retained reordered slide has a verified target-owned raw image and unchanged current header inputs
- **THEN** target Stage 3 recomputes and publishes the final image locally
- **AND** does not copy a source-version final image as current

#### Scenario: Header input changed
- **WHEN** a retained slide's title or header configuration changes
- **THEN** target Stage 3 uses the new header fingerprint for its local rebuild
- **AND** the previous version's final artifact remains isolated

#### Scenario: Unverified raw image blocks final publication
- **WHEN** the current raw-render manifest cannot verify a raw input's kind, engine, fingerprint, and bytes
- **THEN** Stage 3 does not publish a current final manifest entry for that input
- **AND** reports that the raw render must be explicitly rebuilt or otherwise proven
