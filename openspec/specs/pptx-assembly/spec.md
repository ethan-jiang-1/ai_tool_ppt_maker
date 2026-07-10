## ADDED Requirements

### Requirement: Stage 4 builds PPTX container

Stage 4 SHALL assemble final PNG images into a 16:9 `.pptx` file using `pptxgenjs`. Each slide SHALL be a full-bleed image, blank layout.

#### Scenario: Build PPTX from header_locked images

- **WHEN** `header_locked/` contains N PNG images and `slide_plan.json` has N slides
- **THEN** output .pptx has N slides, each a 16:9 full-frame image
- **AND** slide order matches `slide_plan.json` sequence

### Requirement: Stage 4 is a standalone ESM script

The Stage 4 script SHALL be `stage4_build_pptx.mjs`, using `pptxgenjs` for PPTX generation.
