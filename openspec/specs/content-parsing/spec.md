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

### Requirement: Render policy requires an explicit current pipeline
Stage 1 SHALL parse leading YAML only when it begins at the start of `slide-specifications.md` through a
structured YAML parser. Current source frontmatter SHALL contain the direct `production.pipeline` scalar
required by the source contract; missing, indirect, duplicate, retired, malformed, or unknown values
fail before render-policy or slide parsing. Unrelated current top-level keys remain preserved. A
whole-page-image2-v1 source MAY contain the closed `render` mapping with only `default` and
`header-lock`: `default` is `full-page` or `body+header-lock` and defaults to `full-page` when omitted;
`header-lock` defaults to an empty array. Exception IDs SHALL be trimmed, non-empty, unique after
trimming, present in the file, and unambiguous. An HTML-first source SHALL reject the mapping before a
plan is published. Markdown separators after leading frontmatter remain body content. Multiple inputs
retain separate frontmatter policy scope, but html-first remains a single canonical source.

#### Scenario: Current whole-page frontmatter contains render policy
- **WHEN** a whole-page-image2-v1 source contains current metadata plus a valid render mapping
- **THEN** Stage 1 reads the marker and render policy without discarding unrelated current metadata
- **AND** strips only the leading frontmatter block before splitting slides

#### Scenario: Invalid marker or policy fails loudly
- **WHEN** leading YAML has duplicate keys, an invalid production pipeline, an unknown render key, invalid render type/mode, or invalid exception IDs
- **THEN** validation fails with the marker or policy problem and affected ID
- **AND** ppt_flow emits its standard JSON failure envelope

#### Scenario: HTML source rejects whole-page render policy
- **WHEN** an html-first-v1 source declares top-level render policy
- **THEN** validation fails before structured-plan publication
- **AND** it does not reinterpret the source as whole-page work

### Requirement: Current whole-page render mode resolves from explicit policy
For a current whole-page-image2-v1 source, Stage 1 SHALL resolve each slide through per-slide explicit
RENDER MODE, then render.header-lock exception, then hero guard, then render.default. It SHALL record
render_mode_source as explicit, policy:exception, derived:hero_type, or policy:default. The absent
render-key visual-type fallback is retired: an otherwise current whole-page source receives its explicit
empty/default policy semantics, and a missing/invalid source marker fails before mode resolution. HTML
sources own their visible layout through the structured renderer and SHALL not use this resolver.

#### Scenario: Initialized policy defaults content pages to full-page
- **WHEN** current whole-page frontmatter contains render.default full-page and a non-hero slide has no explicit mode or exception
- **THEN** it resolves to full-page with source policy:default and header_safe_zone 0

#### Scenario: Present render mapping may omit default
- **WHEN** current whole-page frontmatter contains render with an empty header-lock list
- **THEN** its effective default is full-page with source policy:default

#### Scenario: Exception locks one policy page
- **WHEN** a valid current policy lists a slide ID under header-lock and that slide has no explicit mode
- **THEN** it resolves to body+header-lock with source policy:exception and configured header safe zone

#### Scenario: Explicit mode wins in the current whole-page branch
- **WHEN** a current whole-page slide declares a valid per-slide RENDER MODE
- **THEN** that mode wins over policy, exception, and hero guard with source explicit

#### Scenario: Retired markerless mode resolution is unavailable
- **WHEN** a source lacks a current production marker and has only visual-type/renders hints
- **THEN** Stage 1 fails before mode resolution and does not derive a current whole-page route

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

For a canonical run-directory source, Stage 1 SHALL fail before generation when an ID is empty, a current ID or spoken key is duplicated, a slide heading number is missing or repeated, or heading numbers do not equal the continuous physical positions `01..N`. The shared slide-document parser SHALL preserve arbitrary Markdown as preamble after leading frontmatter and before the first exact canonical slide heading, including unnumbered section prose such as `## Slide Specifications` or `## Slide Map`. A canonical slide heading remains the exact `## Slide <number>:` grammar with its required stable-ID form. Before the first valid heading, any slide-like heading that contains a decimal slide-number candidate but fails that grammar SHALL fail rather than become preamble. After the slide region begins, any level-2 heading that begins like a slide heading but does not match canonical slide grammar SHALL also fail rather than become epilogue. Its diagnostic SHALL identify the source slide or heading and direct heading-only drift to `ppt_flow slides normalize`. It SHALL NOT silently normalize production source.

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
- **AND** does not reinterpret the source as a current whole-page input

#### Scenario: Slide-named preamble stays prose

- **WHEN** leading frontmatter is followed by `## Slide Specifications` and `## Slide Map` before the first exact slide heading
- **THEN** the parser preserves those lines as preamble
- **AND** the first exact slide heading starts position 1

#### Scenario: Numeric preamble typo fails closed

- **WHEN** preamble contains `## Slide 01` without the required canonical delimiter and ID
- **THEN** Stage 1 reports a malformed slide heading with its source line
- **AND** does not silently treat the numeric candidate as preamble

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

### Requirement: Content parsing gates the opt-in HTML-first branch
Stage 1 SHALL accept only a leading direct `production` mapping whose sole v1 key is the direct string scalar `pipeline` with value `html-first-v1` or `whole-page-image2-v1`. Missing, malformed, indirect, duplicate, retired, or unknown pipeline markers SHALL fail before branch-specific parsing and SHALL report both supported values. Anchors, aliases, merges, and explicit tags SHALL not synthesize either node.

For `html-first-v1`, Stage 1 SHALL retain the existing single canonical `slide-specifications.md` input and structured-body contract: exactly one unindented `**SLIDE BODY**:` plus adjacent `yaml` fence per slide, no competing top-level `render` mapping or `RENDER MODE`/`IMAGE PROMPT`/`VISUAL ASSETS` fields, and no alternate marked input or path override. For `whole-page-image2-v1`, Stage 1 SHALL use the current whole-page plan/prompt contract without treating the source as markerless or as a fallback branch. It SHALL not infer either pipeline from filenames, sibling files, generated bytes, or prior state.

#### Scenario: HTML marker selects structured parsing
- **WHEN** leading source metadata declares `production.pipeline: html-first-v1`
- **THEN** Stage 1 emits the structured plan contract into the rebuildable `slide_plan.json` projection
- **AND** it does not emit whole-page prompts or parse free-form prompt prose as body truth

#### Scenario: Whole-page marker selects current prompt parsing
- **WHEN** leading source metadata declares `production.pipeline: whole-page-image2-v1`
- **THEN** Stage 1 emits the current whole-page plan/prompt contract
- **AND** it preserves the explicit marker without invoking a compatibility reader

#### Scenario: Marker omission fails closed
- **WHEN** a source omits `production.pipeline`
- **THEN** Stage 1 reports the missing marker and both supported values
- **AND** it does not select or write a pipeline

#### Scenario: Mixed HTML and whole-page controls fail
- **WHEN** an HTML-first source also declares top-level `render` or a slide contains `IMAGE PROMPT`, `RENDER MODE`, or `VISUAL ASSETS`
- **THEN** Stage 1 fails with the conflicting field and source location
- **AND** it does not guess a transition or enter whole-page Stage 2

#### Scenario: HTML-first does not merge standalone inputs
- **WHEN** Stage 1 receives multiple inputs and any input declares `html-first-v1`
- **THEN** validation fails with the single canonical source requirement
- **AND** it does not merge identities or positions

#### Scenario: HTML-first does not select a backup source
- **WHEN** a canonical HTML run contains `slide-specifications.md` plus another matching sibling
- **THEN** validation fails with the canonical and sibling paths
- **AND** it does not select a file lexicographically

### Requirement: HTML-first source diagnostics identify owned fields

Structured parser failures SHALL identify source file, slide ID when available, fenced field path, and a bounded reason through the existing diagnostic authority. The parser SHALL not expose stacks, provider payloads, or absolute machine paths.

#### Scenario: Invalid block reports a bounded location

- **WHEN** a typed block has an invalid value
- **THEN** the failure names the source field and slide context
- **AND** the diagnostic is safe for the MD Controller to consume

### Requirement: HTML-first slide metadata and concept remain explicit Markdown inputs

Each HTML-first slide block SHALL retain a non-placeholder single-line `VISUAL TYPE` of at most 80 graphemes, non-placeholder `TITLE`, and the existing Markdown `**CONCEPT**:` section with exactly one non-empty single-line `- **MUST communicate**:` bullet and exactly one non-empty single-line `- **MUST NOT**:` bullet. Duplicate required bullets SHALL fail rather than select one. `MUST communicate` SHALL be at most 400 graphemes and `MUST NOT` at most 240. Other existing concept bullets remain byte-preserved but are not contract fields in Change 2. `KICKER` and `SUBTITLE` MAY be absent through the existing presence-normalization contract. Speaker notes MAY be absent in Change 2 but, when present, SHALL remain bound to the stable slide ID. `VISUAL TYPE` SHALL express narrative role only; `SLIDE BODY.family` SHALL express deterministic layout only.

#### Scenario: Narrative role and layout remain separate

- **WHEN** an HTML-first slide declares a narrative `VISUAL TYPE` and a valid body family
- **THEN** both values are retained independently in the structured plan
- **AND** neither is derived from the other

#### Scenario: Missing title or concept blocks validation

- **WHEN** an HTML-first slide has a placeholder/empty TITLE or lacks `CONCEPT.MUST communicate` or `CONCEPT.MUST NOT`
- **THEN** validation fails with the slide ID and missing Markdown field

#### Scenario: Additional concept prose is not silently fingerprinted

- **WHEN** `Bridge from previous`, `Bridge to next`, or `Content structure` changes while the two required concept constraints do not
- **THEN** those Markdown bytes remain preserved and available to humans
- **AND** Change 2 does not add them implicitly to the visual contract fingerprint

### Requirement: Page Authority source resolves one authority per slide
For `production.pipeline: page-authority-image2-v1`, content parsing SHALL accept only
`production.pipeline`, `production.page_authority_default`, and a per-slide `PAGE AUTHORITY` override
of `pure-image2` or `framed-image2`. The resolved receipt SHALL record one authority for every stable
slide ID. Duplicate keys, aliases, tags, unknown production keys, legacy `render`/`RENDER MODE`, and
free `IMAGE PROMPT` input SHALL hard-stop before derived-artifact or provider work.

#### Scenario: Source default and slide override resolve
- **WHEN** a valid source defaults to `framed-image2` and one slide overrides it with `pure-image2`
- **THEN** the receipt records the correct authority for each stable slide ID
- **AND** metadata, filenames, and generated artifacts do not affect resolution

### Requirement: Framed display fields remain local receipt data
For Framed slides, `TITLE` SHALL be required and optional kicker, subtitle, and callout SHALL normalize
into a `standard-v1` Text Frame receipt. An omitted Framed `FRAME PRESET` SHALL normalize to
`standard-v1`; when present it SHALL equal exactly `standard-v1`. Pure slides SHALL reject a frame
preset. Identity selection, subject count, subject restrictions, and the typed visual brief SHALL be
validated before compilation.

#### Scenario: Contradictory frame or identity selection is rejected
- **WHEN** a Pure slide selects a frame preset or an identity selects `no-identity-subject`
- **THEN** parsing returns the field-level repair diagnostic
- **AND** no raw contract is emitted

### Requirement: Page Authority source admits only a closed visual-brief selection
Every Page Authority slide SHALL contain exactly one `VISUAL BRIEF` mapping with exactly these keys in
semantic order: `recipe`, `composition`, `motifs`, and `negative_constraints`. `recipe` and
`composition` SHALL be unquoted registered lower-kebab IDs. `motifs` SHALL be an ordered,
duplicate-free sequence of zero to six unquoted registered lower-kebab IDs. `negative_constraints` SHALL
be an ordered, duplicate-free sequence selected only from `no-readable-text`, `no-labels`, `no-logo`, and
`no-watermark`. Free prose, quoted literals, nested mappings, aliases, anchors, tags, unknown keys, and
unregistered IDs SHALL fail at the source span before a receipt or raw contract is emitted.

For Framed slides, `negative_constraints` SHALL include both `no-readable-text` and `no-labels`. For a
Pure slide with any structured display field, those two constraints SHALL be rejected as contradictory;
Pure slides with no structured display field MAY select any subset of the four constraints. An absent
`IDENTITY SUBJECT COUNT` or `SUBJECT RESTRICTIONS` SHALL normalize to `none`; their only explicit v1
values are respectively `none|one` and `none|no-generic-metal-robot|no-identity-subject`.
`VISUAL IDENTITY`, when present, SHALL be one unquoted `<profile>/<role>` pair of registered
lower-kebab IDs. An absent identity requires the normalized count `none`; a selected identity requires
`one`. The last subject restriction SHALL reject a selected identity. No v1 source form represents
multiple identities.

#### Scenario: Free visual prose cannot enter a Page Authority request
- **WHEN** a Page Authority slide supplies a prose scalar, quoted literal, unknown visual-brief key, or
  unregistered ID instead of the closed selection
- **THEN** parsing returns the field-level repair diagnostic before registry compilation
- **AND** no provider payload, authorization scope, or raw contract is created

#### Scenario: Authority-aware constraints retain text ownership
- **WHEN** a Framed slide omits `no-labels` or a Pure slide with a title selects `no-readable-text`
- **THEN** parsing rejects the contradictory constraint selection at `VISUAL BRIEF`
- **AND** it does not silently add, remove, or rewrite any selected constraint
