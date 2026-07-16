## Purpose

Define Stage 1 of the production pipeline: parsing `slide-specifications.md` into the machine-readable `slide_plan.json` and `page_prompts/_prompts.json` that drive every downstream stage. This capability guarantees that each slide's render mode, layout contract, and assembled image prompt are derived deterministically from the source markdown, and that malformed specs (for example a missing IMAGE PROMPT) are caught and reported before any image is generated.
## Requirements
### Requirement: Stage 1 parses markdown to JSON

Stage 1 SHALL parse `slide-specifications.md` into `slide_plan.json` and `page_prompts/_prompts.json`.

#### Scenario: Parse a body+header-lock slide

- **WHEN** input markdown contains a slide with RENDER MODE `body+header-lock`, KICKER, TITLE, IMAGE PROMPT, SPEAKER NOTE
- **THEN** `slide_plan.json` contains correct `render_mode: "body+header-lock"`, `layout_contract` with header safe zone from `color_palette.json`
- **AND** `_prompts.json` contains assembled prompt with header contract + body text contract + style anchoring clause

#### Scenario: Validate specs catches missing IMAGE PROMPT

- **WHEN** `validate_specs()` runs on a slide spec with empty IMAGE PROMPT
- **THEN** system reports error listing the slide ID and missing field, exits with non-zero code

### Requirement: Stage 1 is a standalone ESM script

The Stage 1 script SHALL be `stage1_build_inputs.mjs`, runnable with `node stage1_build_inputs.mjs <args>`.

#### Scenario: Stage 1 runs standalone

- **WHEN** `node stage1_build_inputs.mjs <run_dir>` is run directly
- **THEN** it parses `slide-specifications.md` and writes `slide_plan.json` and `page_prompts/_prompts.json` without requiring the orchestrator

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

### Requirement: Stage 1 parses VISUAL ASSETS field

Stage 1 SHALL extract the `**VISUAL ASSETS**` field from each slide block, split the value on commas, trim whitespace, and validate each resulting asset ID against the asset manifest when one is provided. Valid IDs SHALL be populated as `assets` in the `slide_plan.json` record and as `asset_ids` in the `_prompts.json` record. The image prompt text SHALL NOT be modified — assets are passed as reference images at the API level, not injected into the prompt. An asset manifest SHALL be an optional input; when absent, `**VISUAL ASSETS**` parsing SHALL be skipped entirely.

#### Scenario: VISUAL ASSETS field populates slide plan and prompts

- **WHEN** a slide contains `**VISUAL ASSETS**: ai_arch, pipeline`
- **AND** both IDs exist in the asset manifest
- **THEN** the `slide_plan.json` record includes `"assets": ["ai_arch", "pipeline"]`
- **AND** the `_prompts.json` record includes `"asset_ids": ["ai_arch", "pipeline"]`

#### Scenario: Unknown asset ID produces WARNING

- **WHEN** a slide references an asset ID not in the asset manifest
- **THEN** Stage 1 emits a WARNING naming the slide ID and the unknown asset ID
- **AND** the unknown ID is excluded from the output records
- **AND** processing continues (does not block the pipeline)

#### Scenario: No VISUAL ASSETS field is valid

- **WHEN** a slide has no `**VISUAL ASSETS**` field
- **THEN** no `assets` key appears in the `slide_plan.json` record
- **AND** no `asset_ids` key appears in the `_prompts.json` record
- **AND** behavior is identical to before this feature existed

#### Scenario: No asset manifest provided skips parsing

- **WHEN** `parseSlides()` is called without an `assetManifest` parameter
- **AND** a slide contains `**VISUAL ASSETS**: some_id`
- **THEN** no `assets` or `asset_ids` fields are populated
- **AND** no warnings are emitted for the asset reference

### Requirement: VISUAL ASSETS validation integrates with validateSpecRecords

`validateSpecRecords()` SHALL accept an optional `assetManifest` parameter. When provided and a slide references unknown asset IDs, it SHALL produce WARNING severity validation records naming the slide, the unknown ID, and the source file path. These WARNING records SHALL NOT cause pipeline failure (only ERROR severity blocks the gate). The convenience wrapper `validateSpecs()` SHALL also accept and forward the optional `assetManifest` parameter to `validateSpecRecords()`.

#### Scenario: Unknown asset in validateSpecRecords yields WARNING record

- **WHEN** `validateSpecRecords([file], manifest)` is called with a slide referencing an unregistered asset ID
- **THEN** a WARNING severity record is produced naming the slide and unknown ID
- **AND** the record includes the source file path
- **AND** the record's `field` is `"VISUAL ASSETS"` and `reason` is `"unknown_asset_reference"`

#### Scenario: validateSpecs forwards assetManifest to validateSpecRecords

- **WHEN** `validateSpecs([file], manifest)` is called with a slide referencing an unregistered asset ID
- **THEN** the returned array includes a WARNING string about the unknown asset
- **AND** the WARNING does not cause a non-zero exit

### Requirement: Stage 1 emits stable identity and derived position

Stage 1 SHALL parse slide blocks through the shared structured slide-document contract. Every `slide_plan.json` slide and `_prompts.json` entry SHALL retain the formal `slide_id` and include its derived 1-based `position`. Array order SHALL remain current assembly order. For newly written prompt records, the logical raw-image output SHALL be the position-independent `<slide_id>.png`; a cheap human-readable prompt twin MAY include current position in its filename. New template/init sources SHALL declare `identity.scheme: mnemonic-v1` in leading frontmatter; Stage 1 SHALL preserve and project that supported identity scheme without creating a second order source.

#### Scenario: Plan exposes both concepts

- **WHEN** source block `UXGap` is physically the seventh slide
- **THEN** its plan and prompt records contain formal ID `UXGap` and `position: 7`
- **AND** its logical raw-image output does not contain `07`

#### Scenario: Reorder changes projection only

- **WHEN** unchanged slide `UXGap` moves from physical position 7 to position 3
- **THEN** Stage 1 emits `position: 3` and the same formal ID and logical output filename

### Requirement: Stage 1 blocks identity and heading invariant violations

For a canonical run-directory source, Stage 1 SHALL fail before generation when an ID is empty, a current ID or spoken key is duplicated, a slide heading number is missing or repeated, or heading numbers do not equal the continuous physical positions `01..N`. Any level-2 heading that begins like a slide heading but does not match canonical slide grammar SHALL also fail rather than become epilogue. Its diagnostic SHALL identify the source slide or heading and direct heading-only drift to `ppt_flow slides normalize`. It SHALL NOT silently normalize production source.

When the reserved top-level `identity` key is present, it SHALL be a mapping whose only allowed key is `scheme`, and `scheme` SHALL equal `mnemonic-v1`; malformed type, duplicate/unknown nested key, missing/empty scheme, or unsupported scheme SHALL fail loudly. Under `mnemonic-v1`, every current ID SHALL satisfy the 5–8 ASCII-letter, exactly-two-block BlockCase syntax owned by `slide-identity-and-ordering`. Without the marker, unique legacy ID shapes SHALL remain accepted. Strict mnemonic validation SHALL still apply to every ID supplied by a new template/authoring or insertion path, not retroactively reject retained IDs in a legacy deck or automatically add the all-ID marker to a mixed-ID target. In standalone multi-input mode, heading continuity SHALL be validated independently as `01..N` within each input before globally deriving positions from input order and block order.

#### Scenario: Duplicate ID is blocking

- **WHEN** two current slide blocks declare `UXGap`
- **THEN** Stage 1 reports an error rather than a warning
- **AND** does not publish a usable plan or prompt manifest

#### Scenario: Heading drift points to normalize

- **WHEN** the fourth physical block is headed `Slide 07`
- **THEN** Stage 1 fails with the expected and observed positions
- **AND** identifies `ppt_flow slides normalize` as the deterministic repair path

#### Scenario: Legacy shape remains readable

- **WHEN** a current source contains unique legacy ID `s07_problem` at a different current position
- **THEN** Stage 1 accepts the ID as identity
- **AND** derives position solely from physical block order

#### Scenario: Mnemonic-native source validates every current ID

- **WHEN** source frontmatter declares `identity.scheme: mnemonic-v1`
- **AND** one current ID violates the mnemonic syntax contract
- **THEN** Stage 1 fails with that ID and source location before publishing usable outputs

#### Scenario: Unsupported identity scheme fails loudly

- **WHEN** source frontmatter declares an identity scheme other than a supported value
- **THEN** Stage 1 fails with the scheme and source location
- **AND** does not reinterpret the source as markerless legacy input

#### Scenario: Malformed slide-like heading is not epilogue

- **WHEN** the source contains `## Slide seven UXGap` after valid slide blocks
- **THEN** Stage 1 reports a malformed slide heading
- **AND** does not silently exclude the remaining text as an epilogue

#### Scenario: Multiple inputs restart local heading numbers

- **WHEN** Stage 1 receives two input files with two valid slide blocks each, numbered `01, 02` within each file
- **THEN** both inputs pass local heading validation
- **AND** the merged plan positions are `1, 2, 3, 4` in CLI input order

### Requirement: Stage 1 preserves stable-ID inputs across ordering-only changes

Stage 1 SHALL exclude physical position, heading number, source block order, and any position-bearing prompt-twin filename from expensive generation inputs. Reordering alone SHALL leave the final assembled image prompt and other semantic generation inputs byte-equivalent for every retained slide.

#### Scenario: Reorder preserves image-generation inputs

- **WHEN** only the order and normalized heading numbers of existing slide blocks change
- **THEN** each retained ID has the same final assembled image prompt and semantic generator inputs as before
- **AND** only order-dependent cheap projections are rebuilt

