## Purpose

Define Stage 4 of the production pipeline: assembling the finished PNG images into a 16:9 `.pptx` container with `pptxgenjs`, one full-bleed image per slide on a blank layout. This capability guarantees that the output deck's slide count and order match `slide_plan.json` exactly, with each slide rendered edge-to-edge.

## Requirements

### Requirement: Stage 4 builds PPTX container

Stage 4 SHALL assemble final PNG images into a 16:9 `.pptx` file using `pptxgenjs`. Each slide SHALL be a full-bleed image, blank layout.

#### Scenario: Build PPTX from header_locked images

- **WHEN** `header_locked/` contains N PNG images and `slide_plan.json` has N slides
- **THEN** output .pptx has N slides, each a 16:9 full-frame image
- **AND** slide order matches `slide_plan.json` sequence

### Requirement: Stage 4 is a standalone ESM script

The Stage 4 script SHALL be `stage4_build_pptx.mjs`, using `pptxgenjs` for PPTX generation.

#### Scenario: Stage 4 runs standalone

- **WHEN** `node stage4_build_pptx.mjs <run_dir>` is run directly
- **THEN** it assembles the images in `header_locked/` into a 16:9 `.pptx` using `pptxgenjs`, without requiring the orchestrator
