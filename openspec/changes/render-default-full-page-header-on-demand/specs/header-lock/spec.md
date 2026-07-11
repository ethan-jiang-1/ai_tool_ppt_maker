## ADDED Requirements

### Requirement: Header-lock is an on-demand remedy sharing geometry with the full-page soft contract

Header-lock (Stage 3 hard text overlay) SHALL be applied to a slide only when that slide's resolved `render_mode` is `body+header-lock` — i.e. selected on demand via the deck `render.header-lock` exception list or a per-slide explicit `RENDER MODE`, not by a whole-deck default. Full-page slides SHALL continue to pass through Stage 3 unchanged. The header geometry (position, size, alignment) used by the hard overlay SHALL be the same `color_palette.json` geometry that Stage 1 injects into the full-page soft contract, so that switching a slide between `full-page` and `body+header-lock` changes only how the header is enforced (AI-drawn vs script-drawn), not where it is placed.

#### Scenario: Overlay applies only to on-demand locked pages

- **WHEN** a deck defaults to `full-page` and one page is added to the `header-lock` exception list
- **THEN** Stage 3 overlays header text on that one page and passes every `full-page` page through unchanged

#### Scenario: Header position is identical across modes

- **WHEN** the same slide is rendered once as `full-page` (soft contract) and once as `body+header-lock` (hard overlay)
- **THEN** the header occupies the same position and size in both, because both read the same `color_palette.json` header geometry
