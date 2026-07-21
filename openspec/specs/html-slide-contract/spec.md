# html-slide-contract Specification

## Purpose
TBD - created by archiving change add-structured-html-slide-contract. Update Purpose after archive.
## Requirements
### Requirement: HTML-first source produces one validated structured slide plan

The opt-in `production.pipeline: html-first-v1` source branch SHALL require a valid UTF-8 source file with no NUL byte and exactly one structured body inside every slide block. `source_sha256` SHALL hash the exact source file bytes. The exact field grammar SHALL be an unindented `**SLIDE BODY**:` line immediately followed by an unindented ```` ```yaml ```` opener, YAML content, and an unindented ```` ``` ```` closer; the label/opener/closer lines are case-sensitive and contain no leading or trailing whitespace. Blank lines, prose, another info string, an indented fence, or more than one such field SHALL not be guessed as the owned body. Each YAML root SHALL be a mapping containing `schema_version: 1`, one registered `family`, that family's root fields, optional `callout`, and only the visual fields permitted by that family. It SHALL NOT repeat slide ID, position, Markdown header fields, concept, or notes. `KICKER`, `TITLE`, optional `SUBTITLE`, `CONCEPT`, and speaker notes SHALL remain owned by the surrounding Markdown slide block. The structured fence SHALL be the sole parsed authority for visible body/callout values; literal repetition in surrounding human prose is preserved but does not become a second contract input. Unsupported schema versions, missing/duplicate bodies, unknown fields, or conflicting legacy fields SHALL fail before a plan is published.

#### Scenario: Every structured slide parses

- **WHEN** a source declares `production.pipeline: html-first-v1` and every slide contains exactly one valid `SLIDE BODY` fence
- **THEN** parsing emits one versioned structured plan containing stable IDs, current positions, header/body content, family records, and source locators
- **AND** no browser, Image2 provider, or PPTX stage is invoked

#### Scenario: Missing one slide body fails the source

- **WHEN** one HTML-first slide omits its `SLIDE BODY` fence or contains two fences
- **THEN** parsing fails with that slide ID and fence location evidence
- **AND** no partial plan is published

#### Scenario: Legacy source remains outside the branch

- **WHEN** a source has no HTML-first pipeline marker
- **THEN** existing legacy Stage 1 parsing remains selected
- **AND** HTML-first fields are not inferred from prompt prose

#### Scenario: Near-miss body syntax is not inferred

- **WHEN** an HTML-first slide uses `SLIDE BODY` prose, a `json` fence, an indented fence, or a blank line between the field label and YAML opener
- **THEN** validation reports the missing exact body grammar for that slide
- **AND** it does not scan another code block and reinterpret it as source truth

The following is a normative minimal `split: text-visual` source example (the referenced SVG ID must exist in a valid v2 catalog):

````markdown
**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-visual
text:
  heading: Why now
  bullets:
    - Cost crossed the adoption threshold
    - Quality crossed the trust threshold
primary_visual:
  placement: right
  brief: A text-free layered system becoming simpler from left to right
  fit: cover
  focal_point:
    - 0.5
    - 0.5
  fallback:
    kind: icon-composition
    asset_ids:
      - system-layers
  selection: null
```
````

### Requirement: Structured YAML is a closed JSON-like value tree

HTML-first YAML SHALL parse as exactly one YAML 1.2 core-schema document containing mappings, sequences, strings, booleans, null, and finite numbers only. Mapping keys SHALL be strings and SHALL be unique. YAML directives, explicit `---`/`...` document markers, an additional document, comments inside the owned YAML, anchors, aliases, merge keys, any explicit tag (including a core tag), non-JSON scalar objects, non-finite numbers, and duplicate keys SHALL fail. A plain scalar matching timestamp-like grammar `^[0-9]{4}-[0-9]{2}-[0-9]{2}(?:[Tt ][0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}(?::?[0-9]{2})?)?)?$` SHALL also fail and must be quoted to remain an ordinary string. Explanatory prose/comments belong in surrounding Markdown where round-trip ownership is byte-preserved. The pinned parser SHALL use semantic equivalents of `{version: "1.2", schema: "core", uniqueKeys: true, merge: false}` plus AST/source-token checks for the forbidden syntax. The source schema SHALL be closed recursively: unknown root or nested keys SHALL fail, and blocks SHALL be typed by their family-owned field position rather than by a user-authored `type` key. After YAML parsing, schema validation SHALL not coerce a scalar from one type to another or normalize Unicode.

#### Scenario: YAML convenience features fail closed

- **WHEN** a structured body uses a YAML directive/document marker, second document, comment, anchor/alias, merge key, explicit tag, unquoted timestamp-like scalar, duplicate key, or unknown nested field
- **THEN** validation reports the exact fenced field path and reason
- **AND** the published model contains no expanded or coerced value

### Requirement: Structured plan envelope is explicit and self-identifying

An HTML-first Stage-1 projection SHALL write one top-level `slide_plan.json` object with keys in this order: `schema: pptmaker-html-slide-plan-v1`, `contract_version: 1`, `source_sha256`, `input_receipts`, `production: {pipeline: html-first-v1}`, optional `identity`, resolved `theme`, effective `asset_catalog`, deck-level `style_reference_contract_fingerprint`, ordered `slides`, and `ordered_plan_digest`. The file SHALL use deterministic two-space JSON plus one final newline. `input_receipts` SHALL be an array of exact `{scope,path,sha256}` records sorted by `(scope,path)` in code-unit order, where `scope` is `run|framework` and `sha256` hashes the exact bytes at that path. `run` paths SHALL be POSIX paths relative to the deck/run-bundle root (for example `3_versions/vN/slide-specifications.md` or `2_backbone/...`); `framework` paths SHALL be POSIX paths relative to `PPTMAKER_FRAMEWORK/` (for example `scripts/fonts/inventory.json`); neither form may be absolute or contain `.`/`..` segments. Receipts SHALL cover the exact source, the one effective palette selected through existing visual-style override precedence, the checked-in geometry-registry file, every present v2 manifest, every validated manifest asset, and every inventory/CSS/font/sentinel/legal file read by the verified framework font authority. Receipts are provenance/TOCTOU evidence and SHALL not enter the ordered plan digest. `identity`, when present, SHALL use the existing `{scheme}` evidence. `asset_catalog` SHALL be keyed in asset-ID code-unit sort order and each entry SHALL expose exact fields `origin`, run-bundle-root-relative `manifest_path`, origin-relative `path`, `type`, `label`, `description`, `usage_guidance`, `media`, `declared_sha256`, and `measured_sha256`. Raster media SHALL be exactly `{kind:"raster",bytes,width,height}`. SVG media SHALL be exactly `{kind:"svg",bytes,width,height,view_box}`; `view_box` is null or `[min_x,min_y,width,height]`, and width/height use explicit SVG size when present or the view-box dimensions otherwise.

`theme` SHALL include the fully resolved HTML-first config (all palette/component/typography references replaced by concrete lowercase colors and `image_language.avoid` replaced by the validated string array), expanded `geometry: {registry,registry_sha256}`, and exact `font_profile: {inventory_schema,inventory_sha256,families}` from the already-verified framework font authority, where `families` is exactly `["Source Sans 3","Noto Sans SC"]`; registry/font evidence therefore enters `ordered_plan_digest` through the resolved theme but neither narrow acceptance fingerprint except the geometry registry/record already listed for visual acceptance. Each slide record SHALL contain exactly the contract fields `slide_id`, `spoken_key`, derived `position`, `header: {kicker,title,subtitle}` with absent optional values represented as `null`, narrative `visual_type`, `concept: {must_communicate,must_not}`, `family`, `body` containing only that family's non-callout/non-visual typed fields, nullable `callout`, nullable `primary_visual`, `geometry: {variant,boxes,overlays}`, `preflight: {source_capacity,font_ranges}`, `semantic_content_fingerprint`, `visual_contract_fingerprint`, nullable `visual_resolution`, and `source: {path,slide_line,body_line}`. `source_capacity` SHALL equal `{status: "passed", checks}` where each check is exactly `{path,unit,measured,minimum,maximum}`, `unit` is `graphemes|graphemes_total|items|lines`, numeric values are non-negative integers, an inapplicable bound is `null`, and records sort by `(path,unit)` in code-unit order. `font_ranges` SHALL equal `{status: "passed", profile: "source-scalar-ranges-v1", inventory_sha256, checked_scalar_count, unique_code_points}` where the count includes repeated non-LF visible scalars and `unique_code_points` is an ascending numeric array. A failed check is diagnostic-only and no slide record is published. Source paths SHALL be run-bundle-root-relative, line values positive, and source locators SHALL not enter fingerprints or the ordered plan digest. The projection SHALL contain no legacy prompt, render mode, provider, candidate, authorization, timestamp, absolute path, or browser field.

A resolved asset evidence object SHALL contain exactly `{asset_id,origin,manifest_path,path,type,media,declared_sha256,measured_sha256}` using the same relative-path/media meanings as `asset_catalog`. For a declared primary visual, `visual_resolution` SHALL contain exactly `{state,effective,fallback,selected}`. `fallback` SHALL be exactly one of `{kind: "asset", asset}`, `{kind: "abstract-pattern", recipe}`, or `{kind: "icon-composition", assets, layout}`; icon `assets` preserve source order and `layout` is exactly `{inner_box,items}` with ordered items `{asset_id,box}`. `selected` SHALL be null only when source `selection` is null; otherwise it is exactly `{asset,accepted_for,output_sha256,applicability}` where applicability is `current|stale`. Published state/effective pairs SHALL be `fallback/fallback`, `selected/selected`, or `stale/fallback`; a broken binding remains diagnostic-only. Families without `primary_visual` SHALL publish `visual_resolution: null`.

`font_profile.inventory_schema` SHALL equal `pptmaker-html-font-inventory-v1`. Receipt `(scope,path)` pairs SHALL be unique. All mapping field lists declared as exact in this requirement SHALL also define emitted JSON key order; family body/nested mappings use the same schema order as canonical YAML, while arrays preserve semantic/source order. Capacity-check `path` values SHALL use exact plan-root dotted grammar `header.<field>`, `body.<field>`, or `callout`, with zero-based array indices such as `body.cards[0].label`, no leading `$`, and no alternate slash/one-based notation.

#### Scenario: Later renderer can branch without guessing

- **WHEN** a valid HTML-first Stage-1 projection is read
- **THEN** its top-level schema, contract version, production branch, resolved theme/catalog, ordered slides, and digest are explicit
- **AND** a consumer does not infer the branch from family names or the absence of legacy fields

### Requirement: V1 typed blocks have fixed shapes and capacities

The v1 contract SHALL support these shared closed typed blocks and no arbitrary HTML/CSS/SVG strings:

| Type | Fields | V1 capacity |
|---|---|---|
| `text_block` | optional `heading`, optional `body`, optional `bullets` | heading <= 40 graphemes; body <= 120; bullets 2-5, each <= 40 |
| `card` | `label`, optional `value`, optional `body`, optional `icon` asset ID | label <= 20; value <= 24; body <= 40 |
| `metric` | `value`, `label`, optional `detail` | value <= 12; label <= 20; detail <= 30 |
| `step` | `label`, optional `body`, optional `icon` asset ID | label <= 20; body <= 40 |
| `data_series` | `name`, finite numeric `values` | name <= 30; 1-12 values each in `[-1e15,1e15]`; values length equals categories length |
| `quote_block` | `quote`, optional `attribution`, optional `context` | quote <= 90 when alone; when attribution/context is present, quote <= 60, attribution <= 20, context <= 20, and total present graphemes <= 90 |

Every present visible string SHALL be non-empty after trimming; trimming is a validation-only emptiness check and does not remove authored leading/trailing spaces from the parsed value, emitted plan, or fingerprint. Headings, labels, values, metric details, bullets, category/series names, attribution/context, card/step fields, supporting line, caption fields, and callout SHALL be single-line parsed strings. `text_block.body` MAY contain at most six explicit LF-delimited lines; `hero_statement` at most two; `quote_block.quote` at most four. A `text_block` SHALL contain at least one of `heading`, `body`, or `bullets`; when `bullets` is present it SHALL contain 2-5 strings unless a family narrows that range. A `card` SHALL not contain both `value` and `body`. Each `icon` SHALL be one registered asset whose manifest media `type` is `svg`; an SVG used by a block icon or `icon-composition` fallback SHALL additionally contain no `<text>` element after XML parsing. `callout`, when present, SHALL be a non-empty string of at most 80 graphemes. Unknown fields, wrong types, non-finite chart values, excess collection items/lines/graphemes, or a forbidden line break SHALL fail closed rather than truncate or coerce content.

#### Scenario: Maximum-capacity blocks pass

- **WHEN** a fixture uses each typed block at its declared maximum collection and grapheme capacity
- **THEN** source-capacity validation passes

#### Scenario: Unknown or excess content fails

- **WHEN** a block contains an unknown field, a wrong type, too many items, or one grapheme beyond its limit
- **THEN** validation reports slide ID, family, field path, measured value, and allowed capacity
- **AND** content is not truncated, scaled, or split automatically

### Requirement: Markdown-owned visible headers have v1 source capacities

After the existing optional-header presence normalization, an HTML-first slide SHALL require a non-placeholder single-line `TITLE` of at most 60 graphemes. A present single-line `KICKER` SHALL be at most 40 graphemes, and a present single-line `SUBTITLE` at most 50 graphemes. These are source capacities under the existing Markdown field grammar, not browser wrapping guarantees; validation SHALL not infer soft wraps.

#### Scenario: Header source capacity is measured before rendering

- **WHEN** an HTML-first header exceeds its grapheme limit or violates the existing single-line field grammar
- **THEN** validation reports the slide ID, Markdown field, measured value, and v1 capacity
- **AND** it does not shrink typography or claim a browser overflow result

### Requirement: V1 layout family registry is a closed discriminated union

The only v1 families SHALL be `hero`, `split`, `cards`, `kpi`, `comparison`, `flow`, `timeline`, `data`, `quote`, and `visual-focus`. Family fields live directly at the YAML root after `schema_version` and `family`; there is no `body` wrapper and no block `type` property. The exact family roots and primary-visual rules SHALL be:

| Family | Required/allowed body contract | Collection rules | Primary visual |
|---|---|---|---|
| `hero` | optional `hero_statement`, optional `supporting_line` strings | statement <= 120 graphemes and <= 2 explicit newline-delimited lines; supporting <= 160 | optional, `full-bleed` |
| `split` | `mode: text-text` requires `left` + `right`; `mode: text-visual` requires `text` + `primary_visual` | each present bullets array has 2-4 items | forbidden for `text-text`; required at `left` or `right` for `text-visual` |
| `cards` | `cards: card[]` | 2-4 cards | forbidden |
| `kpi` | `metrics: metric[]` | 1-3 metrics | forbidden |
| `comparison` | `left: text_block`, `right: text_block` | 2-5 bullets per side | forbidden |
| `flow` | `steps: step[]` | 3-5 steps | forbidden |
| `timeline` | `steps: step[]` | 3-5 steps | forbidden |
| `data` | `chart: {kind,categories,series,value_format,legend}`, optional `insight: text_block` | kind `bar|line|area`; 1-12 non-empty categories <= 20 graphemes and <= 120 total; 1-4 series with names <= 80 total; each values array matches categories | forbidden |
| `quote` | `quote: quote_block`, optional `supporting: text_block` | exactly one main quote | optional, `left` or `right` |
| `visual-focus` | `primary_visual`, optional `caption: text_block` | caption <= 3 bullets | required at `body` |

Every family MAY additionally contain root `callout`. `split` SHALL be a true discriminated union: `text-text` cannot contain `text`/`primary_visual`, and `text-visual` cannot contain `left`/`right`. Each split text block narrows heading to 40, body to 120, and bullets to 2-4 items of at most 40; body and bullets are mutually exclusive. `comparison.left` and `comparison.right` narrow heading to 40, require 2-5 bullets of at most 20, and forbid body. `data.chart.value_format` SHALL be the exact mapping `{kind,decimals}` for kind `number|percent|compact`, or `{kind: currency, decimals, currency}`; decimals is integer `0|1|2` and currency is exactly three uppercase ASCII letters. Percent-formatted source values SHALL additionally lie in `[-1e4,1e4]`. Formatting uses ECMAScript `toFixed(decimals)` after normalizing `-0` to `0`: `number` adds no grouping; `percent` first multiplies by 100 and appends `%`; `currency` prefixes `CCC ` and adds no grouping; `compact` selects by absolute value the largest threshold among `1e3/1e6/1e9/1e12`, divides the signed value, and appends `K/M/B/T` (or uses unscaled number below `1e3`). `data.chart.legend` SHALL be `auto|show|hide`; `auto` resolves to show only when series length is greater than one. Generated numeric labels therefore use only ASCII digits, `-`, `.`, `%`, spaces, ISO currency letters, and compact suffixes, with no locale heuristic. `data.insight` narrows heading to 30, body to 100, and bullets to 2-4 items of at most 14; body and bullets are mutually exclusive. `quote.supporting` narrows heading to 30, body to 60, and bullets to exactly 2 items of at most 16, SHALL contain exactly one of those three fields, and every present string SHALL be single-line. `visual-focus.caption` narrows heading to 40, body to 100, and bullets to 2-3 items of at most 30, SHALL contain exactly one of those three fields, and every present string SHALL be single-line. These family restrictions override the generic multiline body allowance. `hero` MAY have no body fields because the Markdown title is its main statement. `visual-focus` SHALL always have a non-empty local fallback. Families that forbid a primary visual SHALL reject it rather than ignore it.

#### Scenario: Every family has minimum and maximum fixtures

- **WHEN** v1 registry validation runs
- **THEN** each of the ten families has passing minimum-capacity and maximum-capacity fixtures plus an invalid-field fixture

#### Scenario: Split branch mixing fails

- **WHEN** `split` mode `text-visual` also contains `left` or `right`
- **THEN** validation fails with a discriminated-union diagnostic

### Requirement: Primary visual and fallback contracts are closed and locally complete

A permitted `primary_visual` SHALL contain exactly `placement`, a non-empty `brief` of at most 600 graphemes, `fit: cover`, `focal_point: [x,y]` where each coordinate is a finite number in `[0,1]`, a structured `fallback`, and `selection` equal to `null` or the exact binding `{asset_id, accepted_for, output_sha256}`. `asset_id` SHALL be a non-empty registered ID; `accepted_for` and `output_sha256` SHALL be lowercase 64-hex SHA-256 values. The schema SHALL provide no field for exact visible text, numbers, chart labels, or brand marks inside the primary visual. The MD Controller/Agent SHALL ensure brief semantics and reviewed fallback/selected assets remain text/mark-free where the page contract requires it; JS SHALL validate structure and capacity but SHALL not claim to understand arbitrary prose or inspect visual meaning.

Fallback kinds and family compatibility SHALL be:

| Kind | Allowed families | Required input |
|---|---|---|
| `icon-composition` | `split`, `quote`, `visual-focus` | exact mapping `{kind, asset_ids}` with 1-3 unique registered `svg` asset IDs |
| `asset` | `hero`, `split`, `quote`, `visual-focus` | exact mapping `{kind, asset_id}` with one registered `svg|png|jpg` asset ID |
| `abstract-pattern` | `hero`, `visual-focus` | exact mapping `{kind, recipe}` where recipe is `gradient-field|line-grid|soft-orbs` |

Fallback SHALL be validated unconditionally before selection resolution. Free-form HTML/SVG/CSS and a `none`/empty fallback kind SHALL not be accepted. Optional-visual `hero` and `quote` SHALL omit `primary_visual` entirely when no decoration is intended. Therefore every declared primary visual, including required `split: text-visual` and `visual-focus`, has a local renderable recovery path. `asset` uses the primary visual's `cover`/focal-point contract. `abstract-pattern` fills the primary box from its versioned recipe tokens. For `icon-composition`, let primary box be `[x,y,w,h]`, inset ratio `r`, configured gap `g`, icon count `n`, and max-cell ratio `m`. The inner box SHALL be `[x+w*r,y+h*r,w*(1-2*r),h*(1-2*r)]`; its width SHALL split into `n` equal ordered cells separated by `g`; each icon box SHALL be a centered square of side `min(cell.width,cell.height)*m`. Source `asset_ids` order is preserved, SVG fit is `contain`, and the plan materializes the inner box plus ordered icon boxes inside `visual_resolution.fallback.layout`; those fallback-dependent boxes do not enter the family geometry registry or visual acceptance fingerprint. The renderer does not choose an arrangement. With `selection: null`, no Image2 configuration, and no refinement directories, every allowed family SHALL remain a complete local contract rather than a pending placeholder.

#### Scenario: Local fallback needs no Image2

- **WHEN** an allowed primary visual has a valid structured fallback and `selection: null`
- **THEN** the contract is complete with zero provider credentials, style reference, candidates, or authorization

#### Scenario: Selected bytes cannot hide broken fallback

- **WHEN** selection is valid but the fallback recipe or referenced asset is invalid
- **THEN** source validation fails before selection resolution
- **AND** the accepted asset does not mask the HTML-only recovery contract

#### Scenario: Declared visual cannot fall back to nothing

- **WHEN** any `primary_visual` declares fallback `{kind: none}` or an empty fallback mapping
- **THEN** validation rejects the fallback kind
- **AND** optional-visual families are directed to omit `primary_visual` instead of publishing a half-contract

### Requirement: Slot geometry is canonical and source contains no pixels

All geometry SHALL resolve from checked-in strict JSON file `PPTMAKER_FRAMEWORK/scripts/contracts/html-family-geometry-v1.json`, selected by the HTML-first visual config, on a normalized logical canvas `1000 x 562.5`; slide source SHALL name only semantic family fields and an allowed primary-visual placement. The registry file SHALL use exact top-level keys `schema: "pptmaker-html-family-geometry-v1"`, `canvas: {width:1000,height:562.5}`, and `variants`, be serialized as two-space JSON plus one final newline, and contain no duplicate/unknown field. `variants` SHALL be keyed by the 68 expanded variant keys; each record is exactly `{boxes,overlays}`, boxes map semantic names to `[x,y,width,height]`, and overlays are an ordered array of exact `{back,front}` box-name pairs. `registry_sha256` SHALL hash the shared-canonical-JSON serialization of the parsed `{schema,canvas,variants}` envelope without a trailing newline; the input receipt separately hashes exact file bytes. Rectangles use `[x,y,width,height]`. The shared header boxes SHALL be exactly `kicker [48,24,904,20]`, `title [48,48,904,70]`, and `subtitle [48,122,904,22]`; absent optional fields leave their box unused. The v1 no-callout primary-visual boxes SHALL be exactly: `full-bleed [0,0,1000,562.5]`, `left [48,158,430,330]`, `right [522,158,430,330]`, and `body [48,150,904,338]`. With a callout, the shared content box SHALL be `[48,150,904,280]`, the callout box `[48,454,904,62]`, side placements SHALL be `left [48,150,430,280]` and `right [522,150,430,280]`, and `body` SHALL be `[48,150,904,280]`; `full-bleed` remains the background box and the callout is an explicitly declared overlay.

For deterministic materialization, let `C` be `[48,150,904,338]` without callout or `[48,150,904,280]` with callout. `columns(C,n,20)` SHALL split `C` into `n` equal-width boxes in source order with 20-unit gaps. `rows(B,n,16)` SHALL split any box `B` into `n` equal-height boxes in source order with 16-unit gaps. Side boxes SHALL be the exact left/right boxes above rather than recomputed. Family slots SHALL resolve as follows:

| Family/variant | Concrete slot rule |
|---|---|
| `hero` | Header uses shared boxes; present `hero_statement`/`supporting_line` use `rows(C,n,16)` in that order; optional primary visual uses `full-bleed` behind all other boxes. |
| `split: text-text` | `left` and `right` use the corresponding side boxes. |
| `split: text-visual` | primary visual uses its declared side box and `text` uses the opposite side box. |
| `cards` | card records use `columns(C, cards.length, 20)`. |
| `kpi` | metric records use `columns(C, metrics.length, 20)`. |
| `comparison` | `left` and `right` use the corresponding side boxes. |
| `flow`, `timeline` | step records use `columns(C, steps.length, 20)`; connector anchors are the ordered horizontal centers of adjacent step boxes. |
| `data` without `insight` | `chart` uses `C`. |
| `data` with `insight` | `chart` is `[48, C.y, 616, C.height]`; `insight` is `[688, C.y, 264, C.height]`. |
| `quote` without primary visual | without `supporting`, `quote` uses `C`; with `supporting`, supporting is the bottom 70 units of `C`, quote uses the remaining height above a 16-unit gap. |
| `quote` with primary visual | visual uses its side box; without `supporting`, `quote` uses the opposite side; with `supporting`, supporting is the bottom 70 units of the opposite side and quote uses the remaining height above a 16-unit gap. |
| `visual-focus` without `caption` | primary visual uses `C`. |
| `visual-focus` with `caption` | caption is `[C.x, C.y + C.height - 76, C.width, 76]`; primary visual is `[C.x, C.y, C.width, C.height - 92]`, leaving a 16-unit gap. |

Division results SHALL be serialized as finite JSON numbers without renderer-specific rounding; the checked-in registry's 68 concrete records SHALL equal these formulas. A renderer MAY derive internal text/chart/icon layout only from the resolved box plus versioned typography/spacing/component tokens; it SHALL not move, resize, reorder, or choose a different family-level box.

The v1 geometry registry SHALL have a closed variant key derived only from: family; `split` mode; collection counts for individually boxed cards, metrics, and steps; presence of optional `hero_statement`, `supporting_line`, `insight`, `supporting`, or `caption`; primary-visual presence/placement; and callout presence. Chart category/series counts and text/bullet counts remain data inside their resolved chart/text boxes and SHALL not multiply geometry variants. Under these dimensions v1 SHALL contain exactly 68 variants: hero 16, split 6, cards 6, kpi 6, comparison 2, flow 6, timeline 6, data 4, quote 12, and visual-focus 4. The registry SHALL cover every schema-valid combination and resolve concrete named boxes for every visible block/item, not return a CSS rule or leave a renderer choice. Every non-overlay box SHALL have positive width/height, remain within the canvas, and avoid the reserved header/callout boxes; any permitted overlay relationship SHALL be named in the registry. Missing variants, extra variant dimensions, or geometry inconsistent with collection capacity SHALL fail contract validation. A checked-in canonical registry SHA-256 SHALL bind the 68 sorted records. `html-family-geometry-v1` is immutable: changing a record requires a new registry ID plus the corresponding contract/projection version update, not an in-place edit. Presence/absence of callout and the complete resolved geometry variant SHALL enter the visual contract fingerprint. Later browser rendering MAY uniformly scale these logical units but SHALL not reinterpret placement or item arrangement.

Variant keys SHALL use these exact kebab tokens joined by `--`: `hero--statement0|1--support0|1--visual0|1--callout0|1`; `split--text-text--callout0|1` or `split--text-visual-left|right--callout0|1`; `cards|kpi|flow|timeline--n<N>--callout0|1`; `comparison--callout0|1`; `data--insight0|1--callout0|1`; `quote--support0|1--visual-none|left|right--callout0|1`; and `visual-focus--caption0|1--callout0|1`. `visual-none` means the whole optional `primary_visual` field is absent, not a fallback kind. Here the `|` notation enumerates alternatives and is not a literal key character. `geometry.variant` in the plan SHALL be one exact expanded key, and the config SHALL contain no alias key.

#### Scenario: Placement resolves deterministically

- **WHEN** a `split` text-visual slide places its primary visual at `right`
- **THEN** the structured plan records the canonical right-slot geometry from visual config
- **AND** no pixel coordinates or CSS are read from slide source

#### Scenario: Callout geometry is fingerprinted

- **WHEN** the same slide adds a valid callout
- **THEN** its resolved body/visual geometry follows the versioned callout projection
- **AND** its visual contract fingerprint changes

#### Scenario: Optional and count variants are total

- **WHEN** registry tests enumerate every schema-valid family/mode/count/optional-field/placement/callout combination
- **THEN** each combination resolves exactly one variant with concrete named boxes for all visible records
- **AND** an unregistered or incomplete combination fails before plan publication

### Requirement: Source preflight validates capacity and actual font coverage

HTML-first validation SHALL count Unicode grapheme clusters with `Intl.Segmenter("und", {granularity: "grapheme"})` and collection/explicit-line sizes against the v1 capacities, without NFC/NFKC or locale-specific normalization after YAML's specified scalar/line-break decoding. It SHALL also collect the parsed Unicode scalar sequence of every visible `KICKER`, `TITLE`, `SUBTITLE`, typed-block, category/series label, and callout string. Parsed LF SHALL be the only accepted structural line separator, SHALL count for explicit-line limits, and SHALL be excluded from glyph-range lookup. CR, TAB, other C0 controls, NEL `U+0085`, line separator `U+2028`, paragraph separator `U+2029`, and unpaired surrogate code units SHALL fail as invalid visible source; LF SHALL additionally fail in every field declared single-line. Every remaining scalar SHALL fall within at least one eligible Unicode range in the already-verified bundled Source Sans 3/Noto Sans SC inventory owned by `html-render-runtime`. A checked-in contract fixture SHALL separately prove coverage for the fixed chart-formatter alphabet (`0-9`, `-`, `.`, `%`, space, `A-Z`, `KMBT`). `CONCEPT`, visual briefs, speaker notes, asset metadata, and fallback recipe names SHALL not be treated as visible slide text. This result is declared-range evidence only and SHALL not claim actual browser glyph use, wrapping, or pixel-overflow proof.

#### Scenario: Bilingual visible source is covered

- **WHEN** a slide uses covered Latin, accented Latin, punctuation/currency, numerals, Simplified Chinese, and CJK punctuation in visible fields
- **THEN** capacity and font coverage preflight return structured pass evidence

#### Scenario: Unsupported code point blocks the plan

- **WHEN** an exact visible field contains a code point outside the declared font coverage
- **THEN** validation reports the slide ID, field path, code point, and font-profile boundary
- **AND** it does not accept OS font fallback or claim the browser will fix it

#### Scenario: Canonically distinct strings stay distinct

- **WHEN** two visible strings differ only by precomposed versus combining Unicode scalars
- **THEN** each scalar sequence is measured, range-checked, and fingerprinted as authored
- **AND** validation does not normalize one sequence into the other

### Requirement: Selection resolution separates fallback validity, asset integrity, and applicability

Stage 1 SHALL own one fixed resolution order. It SHALL first validate the fallback. If `selection` is null, it SHALL return `fallback`. Otherwise it SHALL resolve `asset_id` through the merged catalog and validate registration, origin-relative path, supported type, readable bytes, catalog SHA, and equality between actual bytes and `selection.output_sha256`; any failure SHALL return `broken` and block publication. Only after asset integrity passes SHALL it compare `selection.accepted_for` with the current visual contract fingerprint, returning `selected` on equality or `stale` on inequality. `stale` SHALL preserve the binding and use fallback; `broken` SHALL not silently use fallback.

A publishable `visual_resolution` SHALL use the exact evidence shapes defined by the plan envelope requirement. State `fallback` has effective `fallback` and `selected: null`; state `selected` has effective `selected` and selected applicability `current`; state `stale` has effective `fallback` and selected applicability `stale`. Asset evidence SHALL use only asset ID, origin, manifest/origin-relative paths, type, bounded media metadata, and declared/measured SHA; it SHALL not duplicate file bytes, descriptive metadata, or absolute paths. `broken` exists only as validation/diagnostic evidence and SHALL never appear in a published plan.

#### Scenario: Current selection is selected

- **WHEN** the selected asset is complete and its `accepted_for` equals the current visual contract fingerprint
- **THEN** resolution returns `selected` with asset ID, origin layer, and actual SHA evidence

#### Scenario: Intact but inapplicable selection is stale

- **WHEN** selected bytes are complete but `accepted_for` differs from the current fingerprint
- **THEN** resolution returns `stale`, preserves the source binding, and emits fallback evidence

#### Scenario: Missing selected bytes are broken

- **WHEN** a selected asset is unregistered, missing, unsupported, unreadable, or digest-mismatched
- **THEN** resolution returns `broken` and blocks the structured plan
- **AND** it does not reclassify the page as ordinary fallback

### Requirement: Fingerprint projections have separate stable purposes

The contract SHALL emit lowercase SHA-256 fingerprints over recursively canonical UTF-8 JSON. Canonicalization SHALL preserve array order and authored Unicode scalar sequences, sort mapping keys by code-unit order, serialize finite numbers with the shared JSON semantics, and omit no declared projection key; non-JSON values SHALL have failed earlier. Projection version keys/values SHALL be exact: `semantic_content_projection_version: 1`, `visual_contract_projection_version: 1`, `style_reference_projection_version: 1`, and `ordered_plan_projection_version: 1`. Consumed contract keys SHALL likewise use exact `source_schema_version: 1`, `contract_version: 1`, and, where applicable, `visual_config_schema_version: 1`; future changes add new versions rather than silently changing a v1 projection. Each projection SHALL then contain only the fields declared below:

- `semantic_content_fingerprint`: semantic projection version, contract/source schema versions, stable slide ID, exact normalized header object with absent kicker/subtitle represented as null, family discriminator, and the complete typed non-visual body plus nullable callout value tree including chart numbers and inline icon asset IDs; header normalization means the existing presence-normalization/trim rules only (empty, `(none)`, `(无)`, or whole-field bracket placeholders become `null`); it does not Unicode-normalize, case-fold, or otherwise rewrite authored scalar sequences. The projection excludes physical position, notes, visual type, concept, primary visual, fallback/selection, and resolved asset bytes/evidence.
- `visual_contract_fingerprint`: visual projection version, contract/config schema versions, stable slide ID, primary-visual brief/placement/fit/focal point or explicit null, family and complete resolved geometry variant, exact `CONCEPT` `MUST communicate`/`MUST NOT` values, and `visual_projection_v1` (`canvas` plus the resolved geometry record); excludes exact header/body/callout text, fallback/selected asset evidence, deck-global palette/image-language tokens, renderer-only typography/spacing/component/font tokens, position, notes, provider/model, style reference, and generation inputs.
- `style_reference_contract_fingerprint`: style projection version, config schema version, and a deck-level closed allowlist projection of resolved global palette plus image-language `medium`, `material`, `lighting`, `texture`, `composition`, and `avoid` tokens; excludes slide content, family/slot geometry, provider profile, and existing style-reference bytes.
- `ordered_plan_digest`: ordered-plan projection version plus the complete renderer-consumed resolved projection in physical slide order, including the style fingerprint, resolved narrative and exact parsed header/concept/body records, passed preflight evidence, resolved theme and geometry, both per-slide fingerprints, fallback/selection bindings, resolution state, and origin-relative evidence for every referenced catalog entry/SHA. It excludes unreferenced catalog entries, input receipts, source locators, absolute paths, diagnostics, unstructured planning prose such as `deck_system.txt`, speaker notes, timestamps, and the digest field itself. It is the only listed value that changes for a pure reorder, but it also changes for any other renderer-consumed plan change.

#### Scenario: Copy edit does not stale an unrelated primary visual

- **WHEN** exact body copy changes but primary-visual brief, relevant concept semantics, family geometry, and projected visual tokens do not
- **THEN** semantic content fingerprint changes
- **AND** visual contract fingerprint remains unchanged

#### Scenario: Reorder preserves per-slide fingerprints

- **WHEN** unchanged slides are reordered
- **THEN** all per-slide semantic and visual fingerprints plus the deck style-reference fingerprint remain unchanged
- **AND** among acceptance/ordering identities only positions and ordered plan digest change, while source SHA/receipt/line locators update as non-fingerprint provenance

#### Scenario: Global image-language change stales future setup contract

- **WHEN** a projected global medium/material/lighting/composition token changes
- **THEN** style-reference contract fingerprint changes
- **AND** no existing accepted page asset is declared corrupt solely for that reason

#### Scenario: Fallback evidence changes the plan but not visual acceptance

- **WHEN** a fallback binding or its verified bytes change while the primary-visual brief, relevant concept, family geometry, and selected binding remain unchanged
- **THEN** visual contract fingerprint remains unchanged and a still-applicable selected visual does not become stale
- **AND** ordered plan digest changes because renderer-consumed recovery evidence changed

#### Scenario: Selection transition changes resolved plan evidence

- **WHEN** a slide transitions among `fallback`, `selected`, or `stale` without changing its visual contract projection
- **THEN** visual contract fingerprint remains unchanged
- **AND** ordered plan digest changes with the binding and resolution state

### Requirement: Source and config fields have one explicit invalidation classification

The v1 contract SHALL classify every consumed field as follows; implementation SHALL not add a field to a fingerprint by broad object hashing or omit a renderer-consumed field from the ordered plan projection:

| Field group | Visible/font-range preflight | Narrow acceptance fingerprint | Ordered plan digest |
|---|---|---|---|
| plan/source/contract/config/projection versions; `production.pipeline` | no | versions enter the applicable named projection; production enters none | yes |
| stable `slide_id` | no | semantic + visual | yes |
| identity scheme and `spoken_key` | no | none | yes |
| physical order / derived `position` | no | none | yes |
| `KICKER`/`TITLE`/`SUBTITLE`, complete typed non-visual body (including chart values/icon IDs), callout | visible strings only | semantic content; callout presence also affects visual geometry | yes |
| family discriminator | no glyph check | semantic + visual | yes |
| `VISUAL TYPE` | no | none | yes |
| required `CONCEPT` constraints | no | visual | yes |
| other concept bullets and speaker notes | no | none | no |
| primary-visual brief/placement/fit/focal point | no | visual | yes |
| fallback mapping/recipe and selection binding/state | no | none | yes |
| resolved canvas/geometry record | no | visual | yes |
| resolved palette/image-language | no | style-reference | yes |
| resolved typography/spacing/components and verified font profile | no | none | yes |
| referenced asset ID/origin/path/type/media/declared+measured SHA | no | none | yes |
| deterministic passed capacity/font preflight evidence | derived check only | none | yes |
| `source_sha256`, unreferenced catalog entries, asset descriptive metadata, input receipts, source locators, diagnostics | no | none | no |

#### Scenario: Coherence audit catches accidental broad hashing

- **WHEN** a field is added or moved in the source/config/plan schema
- **THEN** a checked-in classification test requires one explicit row/category decision
- **AND** neither object spread nor whole-record serialization can silently change an acceptance fingerprint

### Requirement: Structured source round-trip preserves non-owned Markdown

The parser/serializer SHALL use the shared slide-document interface. A parse/serialize no-op SHALL preserve every source byte, including raw `SLIDE BODY` fence formatting. A semantic body edit SHALL rewrite only that slide's owned YAML content; an explicit per-slide canonicalization SHALL have the same write boundary. Canonical YAML SHALL build a schema-ordered plain object and use the pinned `yaml` package with equivalent options `{indent: 2, indentSeq: true, lineWidth: 0, blockQuote: "literal", simpleKeys: true}`. Before emission, every string scalar matching the forbidden timestamp-like grammar SHALL be assigned YAML double-quoted scalar style so canonical output always revalidates; other ambiguity quoting remains owned by pinned `yaml@2.9.0`. Root keys SHALL be ordered `schema_version`, `family`, non-visual family fields in registry order, optional `callout`, then allowed/required `primary_visual`; nested keys follow their schema order, collections use block style, multiline strings use literal block style, anchors/tags are absent, and the surrounding document's newline convention is retained. Leading frontmatter, preamble, headers, `CONCEPT`, speaker notes, epilogue, fence label/open/close lines, and unrelated slide blocks SHALL remain byte-preserved. Structural move/delete/insert behavior and heading/reference writes remain owned separately by `slide-identity-and-ordering`.

The parser/serializer SHALL additionally expose a public Phase-3 selection-binding transaction. Given a validated run, stable slide ID, registered asset ID, exact current visual-contract fingerprint, and measured output SHA, it SHALL update only that slide's owned `primary_visual.selection` to the existing closed binding shape and serialize through the canonical source path. It SHALL reject missing primary visual, arbitrary YAML/path input, caller-supplied geometry, or an asset not currently registered by the effective catalog. Phase 4 may invoke it only as a bound promotion step and SHALL not parse or edit `slide-specifications.md` directly.

#### Scenario: No-op round trip is byte-identical

- **WHEN** a valid structured source is parsed and serialized without an edit
- **THEN** the complete source is byte-identical

#### Scenario: One body edit has a bounded write set

- **WHEN** one typed block is changed and serialized
- **THEN** only that slide's owned YAML content changes
- **AND** other Markdown and notes remain byte-identical

#### Scenario: Refinement binds an accepted asset

- **WHEN** the Phase-3 transaction receives a registered candidate asset and current visual contract
- **THEN** only the target slide's owned selection binding changes
- **AND** all non-owned Markdown, other slide blocks, and geometry remain unchanged

### Requirement: Migration candidate inputs are a closed receipt-bound overlay

The HTML contract SHALL expose one migration-candidate validation entry reachable only from the closed migration adapter. It SHALL accept the current source run plus its exact confined `_scratch/html-migration/projected-run/` candidate root, not caller-supplied source, palette, asset, or publication paths. The candidate source is authoritative for proposed slide content; effective visual inputs use the ordered precedence `candidate overrides > source-version overrides > deck-root backbone`. The candidate root may supply only the normal version-local override shapes already owned by run-bundle layout; it SHALL not emulate a deck root, supply metadata/state, or alter normal public HTML validation.

The entry SHALL use the same parser, structured-body validator, visual-config validator, asset-catalog validator, preflight, and plan builder as canonical HTML validation. It SHALL return one normalized receipt projection, serialized through the existing canonical sorted `base_receipts` and `candidate_receipts` arrays, covering candidate source/overrides and every inherited source-version/backbone input that influenced the plan, with paths confined relative to the real deck root. Revalidation SHALL reject an arbitrary candidate root, a symlink escape, receipt drift, or a forged overlay before renderer context issuance. It SHALL not create a second plan/freshness authority.

Preparation SHALL preserve every retained formal slide ID verbatim. It SHALL add `identity.scheme: mnemonic-v1` only when all retained IDs already satisfy that scheme; otherwise the candidate omits that marker and retains compatible legacy identity validation. Legacy `IMAGE PROMPT` fields SHALL not appear in the candidate structured source. Any retained prompt reference is authoring-only support and SHALL not enter the structured plan, receipt-derived visible contract, or staged target.

#### Scenario: Candidate palette shadows inherited controls

- **WHEN** a prepared candidate has `overrides/visual-style/color_palette.json`
- **THEN** migration validation uses that palette ahead of a source-version override and backbone palette
- **AND** the receipt set binds every selected candidate and inherited control input

#### Scenario: Candidate asset overlay is receipt-bound

- **WHEN** a candidate sparse asset override adds or replaces one referenced asset ID
- **THEN** the structured plan resolves that candidate asset ahead of inherited catalogs
- **AND** its manifest and bytes are included in the candidate validation receipts

#### Scenario: Arbitrary migration input path is rejected

- **WHEN** a caller attempts to validate a source, palette, asset, or candidate root outside the exact migration projected root
- **THEN** validation fails before source-plan or renderer publication
- **AND** no alternate public validation path is created

#### Scenario: Legacy identity remains stable through preparation

- **WHEN** a markerless source has retained stable IDs that do not all satisfy `mnemonic-v1`
- **THEN** preparation preserves those IDs and omits the mnemonic marker
- **AND** it does not rewrite IDs merely to make the candidate parse
