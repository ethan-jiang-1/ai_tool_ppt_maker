## Purpose

Define `visual_config.mjs`, the shared loader for `color_palette.json` consumed by both Stage 1 (prompt assembly) and Stage 3 (header rendering). This capability guarantees that prompt layout and deterministic text positioning read from one identical config instance — canvas dimensions, header safe zone, and font settings cannot drift apart between the two stages — with built-in defaults filling any missing fields.

## Requirements

### Requirement: Visual config is shared between Stage 1 and Stage 3

`visual_config.mjs` SHALL define a loader for `color_palette.json`. Both Stage 1 (prompt assembly) and Stage 3 (header rendering) SHALL consume the same config instance so that prompt layout and deterministic text positioning cannot drift apart.

#### Scenario: Stage 1 and Stage 3 read identical config

- **WHEN** `loadVisualConfig()` is called with the same `color_palette.json` path from both Stage 1 and Stage 3
- **THEN** both stages receive the same canvas dimensions, header safe zone values, and font settings
- **AND** missing fields in `color_palette.json` fall back to built-in defaults
