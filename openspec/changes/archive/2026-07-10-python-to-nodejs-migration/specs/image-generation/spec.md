## ADDED Requirements

### Requirement: Stage 2 routes to external skill

Stage 2 (image generation) SHALL remain external to the framework. The unified pipeline SHALL route Stage 2 work to the `image2-ppt` skill, discovered at runtime. The framework does NOT implement image generation itself.

#### Scenario: Pipeline delegates to skill

- **WHEN** `unified_pipeline.mjs --stage all` is run
- **THEN** Stage 2 delegates to the `image2-ppt` skill with proper credential bridging from `.env`
