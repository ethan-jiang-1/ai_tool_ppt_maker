## Purpose

Define `visual_config.mjs`, the shared loader for `color_palette.json` consumed by both Stage 1 (prompt assembly) and Stage 3 (header rendering). This capability guarantees that prompt layout and deterministic text positioning read from one identical config instance — canvas dimensions, header safe zone, and font settings cannot drift apart between the two stages — with built-in defaults filling any missing fields.
## Requirements
### Requirement: Visual config is shared between Stage 1 and Stage 3

`visual_config.mjs` SHALL define a loader for `color_palette.json`. Both Stage 1 (prompt assembly) and Stage 3 (header rendering) SHALL consume the same config instance so that prompt layout and deterministic text positioning cannot drift apart.

#### Scenario: Stage 1 and Stage 3 read identical config

- **WHEN** `loadVisualConfig()` is called with the same `color_palette.json` path from both Stage 1 and Stage 3
- **THEN** both stages receive the same canvas dimensions, header safe zone values, and font settings
- **AND** missing fields in `color_palette.json` fall back to built-in defaults

### Requirement: Visual configuration exposes renderer-neutral HTML contract tokens

The existing `color_palette.json` SHALL remain the single visual-config source, selected through the existing version-override-first `styleAsset` precedence; HTML-first does not introduce a different palette search order. Legacy sources MAY omit `html_first`; an HTML-first source SHALL require valid UTF-8 strict JSON with no duplicate key anywhere in the document and one recursively closed `html_first` mapping, and SHALL not receive built-in HTML defaults. Strict `JSON.parse` validity and a duplicate-key lexical/AST audit SHALL share one file-byte read and one resulting source object between legacy and HTML projections. `html_first` SHALL contain exactly `schema_version`, `canvas`, `palette`, `typography`, `spacing`, `components`, `image_language`, and `geometry`. `schema_version` SHALL equal `1`; `canvas` SHALL equal `{width: 1000, height: 562.5}`.

The existing `loadVisualConfig()` legacy return shape SHALL remain byte/fingerprint-compatible and SHALL not gain an `html_first` property merely because the source file contains one. A separate branch-aware loader/projection SHALL validate and return the HTML-first config for structured planning while reusing the same validated source object when both projections are requested. Legacy Stage 1/3/header-review consumers SHALL continue to receive only the existing canvas/body/header/background projection, so seeding `html_first` in all presets does not alter legacy prompt/header fingerprints.

`palette` SHALL contain exactly `background`, `surface`, `text`, `muted_text`, `accent`, `accent_secondary`, `accent_tertiary`, and `divider`. Each value SHALL be a path reference to an existing root `background` or `colors.<name>.hex` token in the same file; validation resolves each to lowercase `#rrggbb` and rejects missing/cyclic/non-color references. Shipped presets SHALL use these mappings:

| Preset | background | surface | text | muted_text | accent | accent_secondary | accent_tertiary | divider |
|---|---|---|---|---|---|---|---|---|
| `clean-clinical` | `background` | `colors.panel_card.hex` | `colors.primary_text.hex` | `colors.secondary_text.hex` | `colors.emphasis.hex` | `colors.positive_accent.hex` | `colors.warning.hex` | `colors.divider.hex` |
| `corporate-safe` | `background` | `colors.panel_card.hex` | `colors.primary_text.hex` | `colors.secondary_text.hex` | `colors.primary_brand.hex` | `colors.positive_accent.hex` | `colors.warning.hex` | `colors.divider.hex` |
| `dark-executive` | `background` | `colors.panel_card.hex` | `colors.primary_text.hex` | `colors.secondary_text.hex` | `colors.emphasis.hex` | `colors.positive_accent.hex` | `colors.data_analysis.hex` | `colors.muted.hex` |
| `tech-startup` | `background` | `colors.panel_card.hex` | `colors.primary_text.hex` | `colors.secondary_text.hex` | `colors.accent_cyber.hex` | `colors.emphasis.hex` | `colors.data.hex` | `colors.muted.hex` |
| `warm-editorial` | `background` | `colors.panel_card.hex` | `colors.primary_text.hex` | `colors.secondary_text.hex` | `colors.accent_warmth.hex` | `colors.premium.hex` | `colors.calm.hex` | `colors.divider.hex` |

`typography` SHALL contain exactly `kicker`, `title`, `subtitle`, `body`, `label`, `card_value`, `metric`, `quote`, `caption`, and `callout`. Every role SHALL be an exact mapping with keys in semantic order `{families,weight,size,line_height,color}`: `families` is exactly `["Source Sans 3", "Noto Sans SC"]`, `weight`/logical `size` are the exact finite numeric values below, `line_height` is the exact positive unitless value below, and `color` is the exact string `palette.<suffix>` named below. V1 shared metrics SHALL be: kicker `600/16/1.2/muted_text`; title `700/30/1.1/text`; subtitle `400/18/1.2/muted_text`; body `400/20/1.25/text`; label `600/16/1.2/muted_text`; card_value `700/28/1.0/accent`; metric `700/36/1.0/accent`; quote `600/26/1.2/text`; caption `400/16/1.25/muted_text`; callout `600/18/1.2/text`. Logical sizes use the same `1000 x 562.5` canvas units and later map 1:1 to CSS px at that logical viewport before uniform output scaling.

V1 field-to-role mapping SHALL also be closed: Markdown headers use their same-named roles; `text_block.heading`, card/step/metric labels, category/series names, generated chart numeric labels, and quote attribution use `label`; ordinary body/bullets, card/step bodies, metric detail, and hero supporting line use `body`; quote context and every visual-focus caption field use `caption`; `card.value` uses `card_value`; `metric.value` uses `metric`; `quote.quote` and `hero_statement` use `quote`; root callout uses `callout`. A later renderer SHALL not select a font role from prose or family heuristics.

`spacing` SHALL equal `{xs: 8, sm: 12, md: 20, lg: 32, xl: 48, page_x: 48, content_top: 150, content_bottom_no_callout: 74.5, page_bottom_with_callout: 46.5}`. `components` SHALL contain exactly `text_block`, `card`, `metric`, `step`, `quote`, `chart`, `icon`, `icon_composition`, `callout`, and `abstract_pattern`, with these shared v1 tokens: text_block `{field_gap:12,bullet_gap:8}`; card `{radius:16,padding:20,field_gap:12,border_width:1,background:palette.surface,border:palette.divider}`; metric `{padding:20,field_gap:10}`; step `{padding:12,field_gap:10,connector_width:2,connector:palette.divider}`; quote `{field_gap:12}`; chart `{axis:palette.muted_text,grid:palette.divider,series:[palette.accent,palette.accent_secondary,palette.accent_tertiary,palette.muted_text],stroke_width:3,plot_padding:{top:20,right:20,bottom:44,left:52},legend_position:"top",legend_gap:12,bar_orientation:"vertical",bar_mode:"grouped",line_curve:"linear",area_stacked:false}`; icon `{size:32,stroke_width:2,color:palette.accent}`; icon_composition `{inset_ratio:0.12,gap:16,max_cell_ratio:0.62}`; callout `{padding_x:24,padding_y:8,radius:12,background:palette.surface,border:palette.divider}`. Within each typed block, present fields SHALL render in the schema order listed by `html-slide-contract`; bullets remain in source order. `components.abstract_pattern` SHALL define exactly: `gradient-field {colors:[palette.background,palette.accent,palette.accent_secondary],angle_degrees:135,softness:0.7}`; `line-grid {line:palette.divider,accent:palette.accent,spacing:32,stroke_width:1}`; and `soft-orbs {colors:[palette.accent,palette.accent_secondary],count:3,blur:48,opacity:0.35}`. Config source stores the shown `palette.*` strings; the resolved plan theme substitutes every such reference with its concrete lowercase `#rrggbb` value while retaining the exact component structure. These are renderer-neutral values, not CSS strings.

`image_language` SHALL contain bounded non-empty single-line strings `medium`, `material`, `lighting`, `texture`, and `composition`, each at most 200 graphemes, plus `avoid: "forbidden"`. That path reference SHALL resolve the existing root `forbidden` array, limited to 16 non-empty single-line strings of at most 100 graphemes, so structured negative visual constraints enter the style-reference projection without being duplicated. The five shipped presets SHALL seed the positive fields as follows:

| Preset | medium | material | lighting | texture | composition |
|---|---|---|---|---|---|
| `clean-clinical` | clinical editorial vector diagrams and restrained data visualization | matte white paper with restrained teal and blue accents | soft diffuse daylight with no dramatic glow | nearly textureless with subtle paper grain | precise grid, generous whitespace, evidence-first hierarchy |
| `corporate-safe` | polished corporate information design and restrained vector geometry | matte white boardroom paper with solid blue and slate surfaces | neutral even studio light | clean flat surfaces with minimal texture | conservative grid, aligned panels, clear executive hierarchy |
| `dark-executive` | cinematic dark-interface information design with crisp vector forms | deep navy glass, brushed metal, and luminous cyan-blue accents | controlled edge lighting and restrained cool glow | fine technical grain without noisy particles | high-contrast focal hierarchy, disciplined asymmetry, generous negative space |
| `tech-startup` | futuristic SaaS information design with synthwave vector geometry | deep purple glass with neon cyan and magenta light | controlled neon rim light with localized glow | subtle digital grain and gradient depth | bold central focal point, energetic diagonals, clean product-like spacing |
| `warm-editorial` | warm editorial illustration and refined information design | cream paper, charcoal ink, rust, and muted-gold accents | soft warm natural light | subtle paper grain and tactile print finish | editorial rhythm, human scale, asymmetric whitespace, calm hierarchy |

`geometry` SHALL equal `{registry: "html-family-geometry-v1"}`. The referenced checked-in registry is owned by `html-slide-contract` and contains the 68 exact variant records `{boxes,overlays}`: boxes map semantic slot/item names to `[x,y,width,height]`, repeated items use source-order names such as `card_1`, `metric_2`, or `step_5`, and overlays are deterministically ordered `{back,front}` pairs. Visual config SHALL reject any other registry ID in schema v1 and SHALL not duplicate family fields, capacities, formulas, or concrete records. Tokens SHALL be deterministic JSON values and independent of browser CSS or Image2 prompts. Existing legacy canvas/body/header fields and defaults SHALL remain unchanged for legacy pipeline markers; no second `html-theme.json` SHALL be introduced.

#### Scenario: Structured plan resolves shared tokens

- **WHEN** an HTML-first source selects a family and references the visual configuration
- **THEN** the resolved plan contains the family geometry and required typography/spacing/component tokens
- **AND** the legacy canvas profile is not rewritten

#### Scenario: Adding HTML tokens does not widen the legacy loader object

- **WHEN** the same palette file is loaded once for a legacy source and once for an HTML-first source
- **THEN** the legacy `loadVisualConfig()` result remains deep-equal to its pre-change projection
- **AND** only the HTML-first branch receives the validated `html_first` projection

#### Scenario: Invalid token fails before rendering

- **WHEN** a required token is missing, malformed, or outside its declared domain
- **THEN** contract validation fails with the token path and expected domain
- **AND** no browser or provider work is started

#### Scenario: HTML-first config does not inherit silent defaults

- **WHEN** an HTML-first source resolves a palette with no `html_first` mapping or a missing required nested token
- **THEN** validation fails at that config path
- **AND** JS does not borrow legacy pixels or a preset-independent HTML default

### Requirement: HTML token changes have explicit contract version evidence

The resolved visual contract SHALL include the HTML visual-config schema version and checked-in dependency-projection versions in its fingerprint inputs. `visual-config` SHALL own two closed, versioned, disjoint path allowlists. `visual_projection_v1` SHALL contain exactly the resolved `canvas`, geometry registry ID/SHA, and one resolved registry record used by the slide. `style_reference_projection_v1` SHALL contain exactly the fully resolved `palette` and `image_language` mappings, including resolved `avoid`. Slide source, palette data, and `deck_system.txt` SHALL not supply or expand either allowlist. A path present in both lists or an allowlisted path absent from the closed config schema SHALL fail a checked-in coherence test. `typography`, `spacing`, and `components` remain renderer-consumed plan tokens outside both acceptance projections; they enter the resolved `theme` and therefore `ordered_plan_digest` but do not stale an accepted primary visual or future style-reference contract by themselves. A token change SHALL invalidate only the narrow fingerprints whose allowlist contains that path and SHALL not change legacy fingerprints that do not consume `html_first`.

#### Scenario: Token change changes HTML contract evidence

- **WHEN** a versioned update changes the selected geometry registry ID or the resolved checked-in record while source content is unchanged
- **THEN** its `visual_contract_fingerprint` changes
- **AND** legacy pipeline evidence remains governed by its existing config contract

#### Scenario: Natural-language prose is not hashed implicitly

- **WHEN** `deck_system.txt` changes without corresponding structured image-language tokens changing
- **THEN** JS does not parse or hash the prose into either fingerprint
- **AND** authoring guidance requires the Agent to update structured tokens when the visual direction materially changes

#### Scenario: Projection allowlists cannot overlap silently

- **WHEN** a checked-in path is added to both the per-slide and deck-global projection allowlists or no longer exists in schema v1
- **THEN** contract-coherence tests fail with the path and projection versions
- **AND** runtime data cannot redefine the allowlists

### Requirement: Callout geometry is versioned and complete

The `html_first.geometry.registry` ID SHALL resolve to both callout-off and callout-on geometry for every closed family variant. The registry's shared header/callout/primary boxes and every formula-derived visible block/item box SHALL equal the coordinates owned by `html-slide-contract`; the abstract formula variable `C` is not emitted as a second overlapping visible box. Every valid mode/count/optional-field combination SHALL receive concrete named boxes. Geometry records SHALL remain within the logical canvas, have positive width/height, and SHALL not overlap reserved header/callout regions except for an explicitly named permitted overlay. Missing, extra-dimension, or inconsistent variants SHALL fail registry/coherence validation before plan publication.

#### Scenario: Callout variants resolve without magic numbers

- **WHEN** the same family is resolved once without a callout and once with a callout
- **THEN** the visual-config registry ID resolves both checked-in contract records
- **AND** the resolved variant participates in the visual contract fingerprint

### Requirement: Migration palette preparation is deterministic and diagnostically complete

`visual-config` SHALL provide one migration preparation projection for a named shipped preset and a legacy `color_palette.json`. The selected preset SHALL supply the complete closed HTML-first schema/form. The projection SHALL start from that preset, overlay only named legacy root token paths referenced by the selected preset's `html_first.palette`, retain preset values for missing/incompatible paths, and report `legacy|preset` provenance per resulting palette token. It SHALL write the resulting complete palette only to the projected candidate's `overrides/visual-style/color_palette.json`, which is the final candidate overlay above source-version overrides and backbone controls. The projection SHALL not change the legacy loader return shape or mutate the source palette. It SHALL not infer token roles from IMAGE PROMPT prose, color names, or generated bytes.

The same visual-config owner SHALL validate prepared/candidate palettes for prepare, preview, and apply. On a strict JSON, duplicate-key, closed-schema, token, typography, spacing, component, image-language, or geometry mismatch, it SHALL return a bounded field-level difference set with stable paths and safe expected/actual summaries for every detected independent mismatch. It SHALL not stop at an opaque first mismatch, print arbitrary full palette/source content, or start browser/provider work. Unknown preset names SHALL fail before any projected candidate write.

#### Scenario: Known preset seeds a valid candidate palette

- **WHEN** preparation receives a valid explicit whole-page palette and a shipped preset name
- **THEN** it writes a deterministic HTML-first candidate palette with recorded preset/legacy-token provenance
- **AND** repeated preparation with identical inputs yields the same validated projection

#### Scenario: Invalid candidate reports field differences

- **WHEN** a prepared candidate palette has independently invalid typography and component tokens
- **THEN** validation reports bounded differences for both field paths with expected/actual summaries
- **AND** it does not invoke rendering or provider code

#### Scenario: Unknown preset is non-writing

- **WHEN** preparation receives a preset name outside the shipped registry
- **THEN** it fails before creating or changing the projected candidate
- **AND** the source palette remains byte-identical
