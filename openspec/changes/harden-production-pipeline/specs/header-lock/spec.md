## MODIFIED Requirements

### Requirement: Stage 3 follows resolved render mode regardless of its source

Stage 3 SHALL overlay header text on every slide whose resolved `render_mode` is `body+header-lock`, regardless of source. Stage 3 SHALL pass every `full-page` slide through by reading the PNG IHDR chunk (first 24 bytes of file, pure Node.js Buffer, no `@napi-rs/canvas`) to obtain dimensions. When dimensions match the canonical canvas size, Stage 3 SHALL `copyFileSync` directly. Only when dimensions differ SHALL it invoke `loadImage` for canvas resize. `render_mode_source` is diagnostic metadata and SHALL NOT alter Stage 3 behavior.

#### Scenario: Every body+header-lock source overlays

- **WHEN** slides resolve to `body+header-lock` from different supported sources
- **THEN** Stage 3 overlays each of them using the same normal processing path

#### Scenario: Every full-page source passes through without decoding

- **WHEN** slides resolve to `full-page` from policy, explicit, hero, or legacy sources
- **AND** the source image dimensions match the canonical canvas size
- **THEN** Stage 3 copies the file directly via `copyFileSync` without invoking `@napi-rs/canvas` image decoding

#### Scenario: Full-page source with mismatched dimensions is resized

- **WHEN** a slide resolves to `full-page`
- **AND** the source image dimensions differ from the canonical canvas size
- **THEN** Stage 3 decodes and resizes the image through canvas to the canonical dimensions
