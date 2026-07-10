## Purpose

Define the boundary for Stage 2 (image generation): the framework does NOT generate images itself but routes Stage 2 work to the external `image2-ppt` skill, discovered at runtime, with credentials bridged from `.env`. This capability guarantees that image generation stays a pluggable, external concern — keeping the framework free of any specific image-model implementation while still integrating cleanly into the pipeline.

## Requirements

### Requirement: Stage 2 routes to external skill

Stage 2 (image generation) SHALL remain external to the framework. The unified pipeline SHALL route Stage 2 work to the `image2-ppt` skill, discovered at runtime. The framework does NOT implement image generation itself.

#### Scenario: Pipeline delegates to skill

- **WHEN** `unified_pipeline.mjs --stage all` is run
- **THEN** Stage 2 delegates to the `image2-ppt` skill with proper credential bridging from `.env`
