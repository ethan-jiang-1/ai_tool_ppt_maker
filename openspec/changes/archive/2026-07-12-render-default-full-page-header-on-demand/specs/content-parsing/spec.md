## ADDED Requirements

### Requirement: Render policy extends the existing YAML frontmatter with an explicit legacy boundary

Stage 1 SHALL parse an optional YAML frontmatter block only when it begins at the start of `slide-specifications.md`, using a structured YAML parser. A file without leading frontmatter SHALL remain valid and have no `render` key. Stage 1 SHALL preserve and tolerate unrelated top-level keys while consuming an optional closed `render` mapping whose only allowed keys are `default` and `header-lock`. A present mapping SHALL accept `default` (`full-page` or `body+header-lock`, defaulting to `full-page` when omitted) and `header-lock` (an array defaulting to empty). Exception ids SHALL be trimmed, non-empty, unique after trimming, present in the file, and unambiguous; an id matching duplicate slide blocks SHALL be rejected. Markdown `---` separators after the leading frontmatter SHALL remain body content. Malformed leading YAML, duplicate YAML keys, an unknown render key, invalid type/mode, or an empty/duplicate/unknown/ambiguous exception id SHALL fail loudly with a specific error. When invoked through `ppt_flow`, the orchestrator SHALL retain its standard JSON failure envelope contract.

When Stage 1 is invoked with multiple input files, each file's leading frontmatter SHALL apply only to the slide blocks from that file, and exception ids SHALL be validated within that file; policy state SHALL NOT leak between inputs.

#### Scenario: Existing frontmatter keys coexist with render policy
- **WHEN** a slide specification frontmatter contains existing metadata keys plus a valid `render` mapping
- **THEN** Stage 1 reads the render policy without rejecting or discarding the unrelated keys
- **AND** strips the single frontmatter block before splitting slide blocks

#### Scenario: Invalid policy fails loudly
- **WHEN** leading YAML has duplicate keys, `render` contains an unknown key such as `header_lock`, `render.default` has an unsupported value, or `render.header-lock` has the wrong type or invalid ids
- **THEN** validation fails and identifies every policy problem and affected id
- **AND** `ppt_flow` emits its standard JSON failure envelope on failure

#### Scenario: Multiple standalone inputs keep policies scoped
- **WHEN** Stage 1 receives two input files with different or absent render policies
- **THEN** each file's slides resolve only against that file's policy and exception ids

### Requirement: Render mode uses distinct policy and legacy resolution branches

When the top-level `render` key is present, Stage 1 SHALL resolve each slide through: per-slide explicit `RENDER MODE` > `render.header-lock` exception > hero guard > `render.default`. When the entire `render` key is absent, Stage 1 SHALL preserve legacy resolution: per-slide explicit `RENDER MODE` > VISUAL TYPE derivation. Absence of `render` SHALL NOT also mean a new full-page policy. Every result SHALL record `render_mode_source` as `explicit`, `policy:exception`, `derived:hero_type`, `policy:default`, or `derived:visual_type`.

#### Scenario: Initialized policy defaults content pages to full-page
- **WHEN** frontmatter contains `render.default: full-page` and a non-hero slide has no explicit mode or exception
- **THEN** it resolves to `full-page` with source `policy:default` and `header_safe_zone: 0`

#### Scenario: Present render mapping may omit default
- **WHEN** frontmatter contains `render: { header-lock: [] }`
- **THEN** its effective default is `full-page` with source `policy:default`

#### Scenario: Legacy deck preserves VISUAL TYPE behavior
- **WHEN** the entire top-level `render` key is absent and the slide has no explicit mode
- **THEN** opener/divider/closer derive to `full-page`, other slides derive to `body+header-lock`, and source is `derived:visual_type`

#### Scenario: Exception locks one policy page
- **WHEN** a valid policy lists a slide id under `header-lock` and that slide has no explicit mode
- **THEN** it resolves to `body+header-lock` with source `policy:exception` and configured header safe zone

#### Scenario: Explicit mode wins in both branches
- **WHEN** a slide declares a valid per-slide `RENDER MODE`
- **THEN** that mode wins over policy, exception, hero guard, and legacy derivation with source `explicit`

### Requirement: Hero guard operates on canonicalized VISUAL TYPE values

Stage 1 SHALL canonicalize supported hero VISUAL TYPE spellings before mode resolution. `Title / Opener`, `Section Divider / Bridge`, `Section Divider`, and `Closer` SHALL be recognized as hero types after trimming and normalizing case/whitespace. Every slide in the policy branch SHALL have a non-empty, non-placeholder VISUAL TYPE so Stage 1 can choose a hero or content prompt contract. Under a present policy, a hero slide not explicitly overridden or named in the exception list SHALL resolve to `full-page`. Its source SHALL be `derived:hero_type` only when the guard overrides an effective `body+header-lock` default; when the effective default is already `full-page`, its source SHALL remain `policy:default`.

#### Scenario: Template divider alias is protected
- **WHEN** policy default is `body+header-lock` and a slide uses the template spelling `Section Divider`
- **THEN** it resolves to `full-page` with source `derived:hero_type`

#### Scenario: Hero under a full-page default uses the default source
- **WHEN** policy default is `full-page` and a hero slide has no explicit mode or exception
- **THEN** it resolves to `full-page` with source `policy:default`

#### Scenario: Policy slide missing VISUAL TYPE fails
- **WHEN** a slide is resolved under a present render policy but its VISUAL TYPE is empty or a bracket placeholder
- **THEN** validation fails rather than guessing whether to inject a hero or content contract

### Requirement: Content full-page prompts carry the shared header placement contract

For non-hero `full-page` slides, Stage 1 SHALL assemble a fixed-format header placement contract from structured kicker/title/subtitle and the same visual config fields used by Stage 3: canvas, body header safe-zone height, margins and y positions, line heights, font family/weight/size/color, plus the existing fixed left-alignment invariant. The contract SHALL combine a semantic top-left header-band instruction with exact canvas/px values, reserve that band for header elements only, and direct body visuals below it. Alignment SHALL NOT be described as a configurable `color_palette.json` field. The configured band height is a prompt-only soft target; every full-page slide SHALL retain `layout_contract.header_safe_zone: 0` so the existing field continues to mean a deterministic overlay hard safe zone. Hero full-page slides SHALL NOT receive fixed geometry, but SHALL receive an exact-text contract containing every present structured header field so their composition remains free without losing or requiring duplicate title text in the source IMAGE PROMPT. Exact text SHALL be serialized with stable JSON escaping. Stage 1 SHALL use one shared presence normalization for optional header fields: empty, case-insensitive `(none)`, `(无)`, or whole-field bracket-placeholder values are absent and SHALL be omitted from both the emitted slide record and assembled prompt. A content full-page slide without a real TITLE SHALL produce a non-blocking warning naming the slide.

#### Scenario: Content prompt receives shared geometry
- **WHEN** a non-hero full-page slide has real header fields
- **THEN** its prompt contains those fields and directives derived from the shared visual config
- **AND** the prompt excludes body visuals from the configured band while its layout contract remains `header_safe_zone: 0`
- **AND** equivalent content pages use identical geometry directives apart from their text

#### Scenario: Hero prompt stays free-form
- **WHEN** a canonical hero slide resolves to full-page with structured title text
- **THEN** no fixed header band contract is injected
- **AND** the assembled prompt still requires the exact structured title text while leaving its composition free
- **AND** its layout contract keeps `header_safe_zone: 0`

#### Scenario: Missing optional fields are omitted
- **WHEN** kicker or subtitle is empty, any case variant of `(none)`, `(无)`, or a bracket placeholder
- **THEN** no clause or visible sentinel for that field is emitted in either render path

#### Scenario: Missing content title warns
- **WHEN** a non-hero full-page slide lacks a real TITLE
- **THEN** validation emits a non-blocking warning naming it and does not abort

### Requirement: Body-lock image prompts are independent of deterministic header text

For `body+header-lock` slides, the assembled image prompt SHALL contain the reserved header band and body-layout instructions but SHALL NOT contain the slide's kicker, title, or subtitle values. It MAY state generically that Stage 3 will overlay header text later. The structured header values SHALL remain in `slide_plan.json` for Stage 3. Therefore changing only those fields SHALL NOT change the final Stage-2 prompt or raw-image generation fingerprint.

#### Scenario: Title-only body-lock edit preserves the raw prompt
- **WHEN** only kicker/title/subtitle changes on a body+header-lock slide
- **THEN** its assembled Stage-2 prompt is byte-identical
- **AND** Stage 3 receives the new structured text from `slide_plan.json`
