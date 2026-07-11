## ADDED Requirements

### Requirement: Render mode resolves through a precedence cascade defaulting to full-page

Stage 1 SHALL resolve each slide's `render_mode` through a fixed precedence cascade (most specific wins): per-slide explicit `RENDER MODE` > deck-level `render.header-lock` exception list > hero VISUAL TYPE guard > deck-level `render.default` > VISUAL TYPE derivation. When no deck-level `render:` policy is present, `render.default` SHALL be treated as `full-page`. The hero VISUAL TYPE guard means slides whose VISUAL TYPE is `Title / Opener`, `Section Divider / Bridge`, or `Closer` SHALL resolve to `full-page` (free-form composition) unless a per-slide explicit mode or the exception list names them — so a whole-deck `render.default: body+header-lock` never force-locks a cover/divider/closer. The deck-level policy SHALL be read from an optional `render:` frontmatter block in `3_versions/v{n}/slide-specifications.md`. Every resolved `layout_contract` SHALL record `render_mode_source` so the decision is traceable (`explicit`, `policy:exception`, `derived:hero_type`, `policy:default`, or `derived:visual_type`).

#### Scenario: Default deck resolves every slide to full-page

- **WHEN** a slide has no per-slide `RENDER MODE` and the deck has no `render:` policy block (or `render.default: full-page`)
- **THEN** `slide_plan.json` contains `render_mode: "full-page"` with `render_mode_source: "policy:default"`
- **AND** no header safe zone is reserved (`header_safe_zone: 0`)

#### Scenario: Exception list locks a single page

- **WHEN** the deck `render:` block lists a slide id under `header-lock:` and that slide has no per-slide `RENDER MODE`
- **THEN** that slide resolves to `render_mode: "body+header-lock"` with `render_mode_source: "policy:exception"` and a header safe zone from `color_palette.json`
- **AND** all other slides remain `full-page`

#### Scenario: Hero slide resists a body+header-lock deck default

- **WHEN** the deck sets `render.default: body+header-lock` and a slide whose VISUAL TYPE is `Title / Opener` has no per-slide `RENDER MODE` and is not in the `header-lock` exception list
- **THEN** that hero slide resolves to `full-page` with `render_mode_source: "derived:hero_type"` (free-form composition, not force-locked)
- **AND** a non-hero slide under the same deck default resolves to `body+header-lock`

#### Scenario: Per-slide explicit mode overrides the deck default

- **WHEN** a slide declares `RENDER MODE: body+header-lock` while the deck `render.default` is `full-page`
- **THEN** that slide resolves to `body+header-lock` with `render_mode_source: "explicit"`

#### Scenario: Legacy deck without policy falls back to VISUAL TYPE derivation

- **WHEN** a deck's `slide-specifications.md` has no `render:` frontmatter block and a slide has no per-slide `RENDER MODE`
- **THEN** Stage 1 derives the mode from VISUAL TYPE (opener/divider/closer → full-page, else body+header-lock) with `render_mode_source: "derived:visual_type"`, preserving backward compatibility

### Requirement: Content full-page prompts carry a header placement contract; hero slides stay free-form

For `full-page` slides whose VISUAL TYPE is NOT a hero/composition type (`Title / Opener`, `Section Divider / Bridge`, `Closer`), Stage 1 SHALL assemble the image prompt with an explicit header placement contract built from the slide's structured kicker/headline/subtitle plus the header position, size, and alignment from `color_palette.json` (the same geometry `header-lock` uses), rather than relying on header text hand-written into the source IMAGE PROMPT prose. This contract SHALL be identical in geometry across all such content full-page slides of a deck so the AI-drawn header stays positionally and typographically stable page to page. Hero full-page slides SHALL NOT receive a fixed header band — their title is the composition and MUST remain free-form. Any header sub-clause whose source field is empty or a bracket placeholder SHALL be omitted from the contract. When a content full-page slide has no real TITLE (empty or placeholder), Stage 1 SHALL emit a non-blocking WARN naming the slide (it would ship without a header title) rather than silently dropping it; hero full-page slides SHALL NOT trigger this warning.

#### Scenario: Content full-page prompt includes structured header placement

- **WHEN** Stage 1 assembles the prompt for a content `full-page` slide (non-hero VISUAL TYPE) with kicker/headline/subtitle
- **THEN** the assembled prompt contains the present header fields together with position, size, and alignment directives derived from `color_palette.json` header geometry

#### Scenario: Hero full-page slide stays free-form

- **WHEN** Stage 1 assembles the prompt for a `full-page` slide whose VISUAL TYPE is `Title / Opener`, `Section Divider / Bridge`, or `Closer`
- **THEN** no fixed header band is imposed and the title composition is left to the image generator

#### Scenario: Empty or placeholder header fields are omitted

- **WHEN** a content `full-page` slide has an empty or bracket-placeholder kicker (or subtitle)
- **THEN** that sub-clause is omitted from the header placement contract and only the present fields are directed

#### Scenario: Header geometry is uniform across content full-page slides

- **WHEN** two content `full-page` slides in the same deck are assembled
- **THEN** both prompts specify the same header zone position, size, and alignment (only the header text differs)

#### Scenario: Content full-page slide missing a real title warns (non-blocking)

- **WHEN** a content `full-page` slide (non-hero VISUAL TYPE) has no real TITLE (empty or bracket placeholder)
- **THEN** Stage 1 emits a non-blocking WARN naming the slide (it would ship without a header title) and does not abort
- **AND** a hero `full-page` slide with no TITLE does NOT trigger this warning
