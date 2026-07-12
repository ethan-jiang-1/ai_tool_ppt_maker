## ADDED Requirements

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
