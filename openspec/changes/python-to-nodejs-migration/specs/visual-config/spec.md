## ADDED Requirements

### Requirement: Visual config is shared between Stage 1 and Stage 3

`visual_config.mjs` SHALL define a loader for `color_palette.json`. Both Stage 1 (prompt assembly) and Stage 3 (header rendering) SHALL consume the same config instance so that prompt layout and deterministic text positioning cannot drift apart.

#### Scenario: Stage 1 and Stage 3 read identical config

- **WHEN** `loadVisualConfig()` is called with the same `color_palette.json` path from both Stage 1 and Stage 3
- **THEN** both stages receive the same canvas dimensions, header safe zone values, and font settings
- **AND** missing fields in `color_palette.json` fall back to built-in defaults
