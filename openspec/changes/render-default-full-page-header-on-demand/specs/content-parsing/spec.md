## ADDED Requirements

### Requirement: Render mode resolves through a precedence cascade defaulting to full-page

Stage 1 SHALL resolve each slide's `render_mode` through a fixed precedence cascade (most specific wins): per-slide explicit `RENDER MODE` > deck-level `render.header-lock` exception list > deck-level `render.default` > VISUAL TYPE derivation. When no deck-level `render:` policy is present, `render.default` SHALL be treated as `full-page`. The deck-level policy SHALL be read from an optional `render:` frontmatter block in `3_versions/v{n}/slide-specifications.md`. Every resolved `layout_contract` SHALL record `render_mode_source` so the decision is traceable (`explicit`, `policy:exception`, `policy:default`, or `derived:visual_type`).

#### Scenario: Default deck resolves every slide to full-page

- **WHEN** a slide has no per-slide `RENDER MODE` and the deck has no `render:` policy block (or `render.default: full-page`)
- **THEN** `slide_plan.json` contains `render_mode: "full-page"` with `render_mode_source: "policy:default"`
- **AND** no header safe zone is reserved (`header_safe_zone: 0`)

#### Scenario: Exception list locks a single page

- **WHEN** the deck `render:` block lists a slide id under `header-lock:` and that slide has no per-slide `RENDER MODE`
- **THEN** that slide resolves to `render_mode: "body+header-lock"` with `render_mode_source: "policy:exception"` and a header safe zone from `color_palette.json`
- **AND** all other slides remain `full-page`

#### Scenario: Per-slide explicit mode overrides the deck default

- **WHEN** a slide declares `RENDER MODE: body+header-lock` while the deck `render.default` is `full-page`
- **THEN** that slide resolves to `body+header-lock` with `render_mode_source: "explicit"`

#### Scenario: Legacy deck without policy falls back to VISUAL TYPE derivation

- **WHEN** a deck's `slide-specifications.md` has no `render:` frontmatter block and a slide has no per-slide `RENDER MODE`
- **THEN** Stage 1 derives the mode from VISUAL TYPE (opener/divider/closer → full-page, else body+header-lock) with `render_mode_source: "derived:visual_type"`, preserving backward compatibility

### Requirement: Full-page prompts carry a header placement contract from the shared geometry

For `full-page` slides, Stage 1 SHALL assemble the image prompt with an explicit header placement contract built from the slide's structured kicker/headline/subtitle plus the header position, size, and alignment from `color_palette.json` (the same geometry `header-lock` uses), rather than relying on header text hand-written into the source IMAGE PROMPT prose. The contract SHALL be identical in geometry across all full-page slides of a deck so the AI-drawn header stays positionally and typographically stable page to page.

#### Scenario: Full-page prompt includes structured header placement

- **WHEN** Stage 1 assembles the prompt for a `full-page` slide with kicker/headline/subtitle
- **THEN** the assembled prompt contains the header text together with position, size, and alignment directives derived from `color_palette.json` header geometry

#### Scenario: Header geometry is uniform across full-page slides

- **WHEN** two `full-page` slides in the same deck are assembled
- **THEN** both prompts specify the same header zone position, size, and alignment (only the header text differs)
