## Context

Change 1 established a pinned local browser/font runtime, but deliberately did not define slide source or composition. The next renderer needs an input that is explicit enough to validate before browser work: content blocks, layout family, slot geometry, visual selection, asset provenance, and stable identity must have one owner. The current legacy source remains Markdown-first and prompt-oriented, so the new contract must be opt-in and coexist without changing legacy defaults.

The change crosses parser, visual configuration, asset resolution, run-bundle control records, and slide identity. MD Controller owns the authoring choice/presentation for opting into the branch and how human decisions are requested; the shared JS marker probe is the sole executable authority for selecting or rejecting that branch at every CLI entry. JS also owns parsing, canonical serialization, validation, deterministic fingerprints, and diagnostics. Later rendering changes consume the resolved plan; they do not reinterpret raw Markdown or duplicate family rules.

## Goals / Non-Goals

**Goals:**

- Define a versioned `production.pipeline: html-first-v1` source branch with fenced `SLIDE BODY` YAML and loss-aware round-trip editing.
- Produce one validated, renderer-neutral slide plan with typed blocks, layout-family discriminators, canonical slot geometry, capacity metadata, and fallback rules.
- Validate English and Simplified-Chinese content before rendering using grapheme-aware counts and declared family capacities, without claiming browser pixel measurement.
- Validate every exact visible source code point against Change 1's bundled font inventory before later browser work.
- Resolve `primary_visual` and asset selection through one ID-based catalog that preserves source layer, path, SHA, selection state, and fallback evidence.
- Keep slide semantic, visual-contract, and style-reference-contract fingerprints stable across reorder and deterministic serialization while giving each fingerprint a non-overlapping purpose.
- Make contract output reusable by later HTML rendering without depending on Image2 credentials, style master, browser launch, or new-deck default workflow.

**Non-Goals:**

- Browser HTML composition, screenshot, pixel overflow, PPTX assembly, or Stage 4 changes.
- Image2 transport, generation fingerprints, candidate review, authorization, promotion, or refinement state.
- Switching fresh deck defaults, migrating workflow directories, or redesigning the run-bundle state machine.
- Full CJK support; the contract's non-Latin fixture scope is Simplified Chinese (`Hans`) only.

## Decisions

### 1. Opt-in source branch with an explicit marker

The parser recognizes the closed direct-node `production: { pipeline: html-first-v1 }` mapping in leading frontmatter; aliases/anchors/merges/tags cannot synthesize the marker. It requires exactly one body field in every slide block for that branch. Its literal Markdown grammar is an unindented `**SLIDE BODY**:` line immediately followed by an unindented ```` ```yaml ```` opener, YAML content, and an unindented ```` ``` ```` closer, with no leading/trailing whitespace on those three control lines. `KICKER`, `TITLE`, optional `SUBTITLE`, the existing `CONCEPT` bullets, and speaker notes remain Markdown-owned fields; the fence is the only parsed authority for visible body/callout values, while repeated prose elsewhere remains human-only Markdown rather than a second body input. HTML-first source forbids legacy top-level `render`, per-slide `RENDER MODE`, `IMAGE PROMPT`, and `VISUAL ASSETS`, so the branches cannot silently mix two content or layout truths. A legacy source without the marker continues through the existing parser. A conflicting marker, missing/duplicate body block, unsupported schema version, or partial branch fails closed with a bounded source diagnostic. The marker is a source contract, not a default change; init/templates remain legacy until Change 3.

**Alternative:** infer the branch from YAML shape or from the presence of HTML-like fields. Rejected because inference makes migration ambiguous and lets legacy prompt prose silently enter a new contract.

### 2. YAML is parsed into a discriminated domain model, then canonically serialized

The implementation parses each slide's fenced YAML once with exact YAML 1.2 core-schema semantics into a structured model with explicit schema version, typed family fields, visual contract, and asset references; slide identity/order and Markdown-owned fields come from the shared slide-document record rather than being duplicated inside YAML. Blocks are typed by their family-owned field position, not by a redundant user-authored `type` property. More than one YAML document, directives/document markers, comments, duplicate keys, aliases/anchors/merge keys, any explicit tag, unquoted timestamp-like scalar, non-string mapping keys, unknown fields, invalid scalar types, and cross-field violations fail before serialization. A parse-and-serialize no-op preserves the raw fence bytes. A semantic edit or explicit canonicalization rewrites only the owned fence with schema-ordered objects and a fixed serializer option set. Because those bytes and parse semantics are a contract, the existing `yaml` dependency is pinned from `^2.9.0` to exact `2.9.0`; unrelated Markdown, speaker notes, comments outside the fence, and legacy sections remain byte-preserved.

**Alternative:** retain arbitrary JSON blobs or let each family parse its own text. Rejected because downstream renderers would inherit inconsistent validation and error locations.

The implementation seam is intentionally narrow:

```text
exact source bytes
      |
      v
shared slide_document  -- owns frontmatter/blocks/identity/ranges/round-trip
      |
      v
html_slide_contract    -- owns fence YAML, families, capacities, geometry,
      |                    preflight, projections, resolution, plan schema
      +----------+----------+
                 |          |
                 v          v
       HTML config view   v2 asset catalog
                 \          /
                  \        /
                   v      v
                resolved plan
                       |
                       v
             Stage 1 atomic projection
```

Stage 1 orchestrates these interfaces but does not switch on family names or reconstruct their schemas. Public orchestration uses a small shared leading-frontmatter production-marker probe before readiness/credential work; that probe selects/rules out a branch but does not perform body validation or duplicate the contract.

The external seam is one branch-aware contract adapter, not a collection of family-specific callers. Its public operations are deliberately small: `probeProductionMarker(sourceBytes)`, `validateHtmlFirstRun(runContext)`, and `buildHtmlFirstPlan(validatedRun)`. The probe is a dependency-free, read-only adapter used by every public entry path that can reach readiness or writes (`ppt_flow`, `unified_pipeline`, style-master/header commands, and structural materialization); it accepts only leading-frontmatter bytes and returns `legacy`, `html-first-v1`, or a bounded source diagnostic. It never parses slide bodies and never resolves credentials. After the probe selects HTML-first, the direct CLI argument adapter permits only one canonical `--spec` and rejects legacy aliases/unknown flags; it performs this usage check before loading config/catalog/font inputs. `validateHtmlFirstRun` owns the deep parser/config/catalog/font/fingerprint behavior and returns either a complete validated intermediate or bounded diagnostics. Only `buildHtmlFirstPlan` may construct the renderer-consumed envelope; orchestration supplies the run context and performs the atomic publication. This keeps the seam deep and prevents callers from learning family, geometry, or invalidation rules.

For the canonical run-directory adapter, `slide-specifications.md` is the only eligible HTML-first source name. If any sibling matching the legacy `slide-specifications*.md` pattern exists, the adapter must inspect the exact canonical file first and fail the HTML-first branch with a bounded "multiple source candidates" diagnostic rather than selecting the lexicographically first file. Legacy standalone multi-input behavior remains behind the markerless branch.

The write-enabled computation order is fixed to avoid fingerprint/resolution cycles:

```text
parse source + config + catalog + verified fonts
                 |
                 v
       family validation + geometry + preflight
                 |
                 v
        semantic / visual / style fingerprints
                 |
                 v
          fallback + selection resolution
                 |
                 v
             ordered plan digest
                 |
                 v
      recheck every receipt/confinement proof
                 |
                 v
          atomic slide_plan.json rename
```

Structural editing composes this module without adding another control resolver. Preview passes the current run context plus an in-memory projected canonical-source byte override; config/catalog/font inputs still resolve from the current effective run context. The Structural Versioning Path copies only version-owned source/override controls, continues to inherit the shared backbone/framework normally, and apply validates that hidden staged vNext as a real effective run context before rename. Neither call asks `buildHtmlFirstPlan` to publish.

### 3. Ten layout families share a registry and geometry model

`html-slide-contract` owns the fixed v1 discriminators `hero`, `split`, `cards`, `kpi`, `comparison`, `flow`, `timeline`, `data`, `quote`, and `visual-focus`, together with their exact root fields, typed-block shapes, collection/grapheme limits, allowed primary-visual placements, fallback combinations, and one checked-in `PPTMAKER_FRAMEWORK/scripts/contracts/html-family-geometry-v1.json` registry. The normalized logical canvas remains `1000 x 562.5`. Each preset's `html_first.geometry` contains only the supported registry ID, not 68 duplicated records. The registry has one closed schema/canvas/variants envelope, a canonical semantic SHA-256, and exact two-space checked-in JSON bytes; it covers family mode, collection count, optional-block presence, primary-visual placement, and callout presence. Stage 1 resolves one variant to concrete named family boxes in the plan so the later renderer consumes geometry rather than inventing it. Fallback-dependent icon-composition sub-boxes are resolved separately inside fallback evidence, so fallback kind/count does not mutate the immutable 68-variant family registry or its acceptance fingerprint. Slide source never contains arbitrary pixels or CSS. Family modules do not launch a renderer. Later Change 3 maps the resolved logical geometry to its browser viewport.

The file remains shared, but the in-memory projections do not widen each other. Existing `loadVisualConfig()` keeps its legacy return shape because current Stage-3/header-review fingerprints hash that object. A separate HTML-first projection validates `html_first`; adding the new source keys to preset JSON therefore does not make every legacy artifact stale.

**Alternative:** store arbitrary CSS or per-slide coordinates in source. Rejected because it couples source to one renderer and defeats family-level preflight.

### 4. Content preflight is grapheme-aware and honest about its boundary

Preflight counts grapheme clusters with `Intl.Segmenter("und", { granularity: "grapheme" })` and counts declared collection/line units, then compares them with family capacities. It reports field path, family, measured count, capacity, and a bounded remediation, and publishes deterministic passed-check evidence rather than a free-form summary. It separately collects parsed visible header/body/callout Unicode scalar values, treats parsed LF as the only permitted structural line separator and not as a glyph, rejects other C0 controls including CR/TAB plus NEL/U+2028/U+2029, and reuses Change 1's verified inventory/range parser to reject values outside all eligible local-font ranges. It does not apply Unicode normalization before capacity, coverage, or fingerprinting; YAML's specified source line-break decoding occurs during parsing. `CONCEPT`, visual briefs, and speaker notes are not visible-text inputs. English and Simplified-Chinese fixtures exercise accents, combining marks, punctuation, numerals, Han characters, and CJK punctuation. This is declared-range source evidence only; actual browser glyph use, wrapping, and pixel overflow belong to Change 3.

**Alternative:** count UTF-16 code units or rely on browser measurement in this change. Rejected because code-unit counts are misleading and browser measurement belongs to Change 3.

### 5. Visual contract is renderer-neutral and Image2-independent

Each visual-bearing slide may declare one `primary_visual` with `placement`, bounded `brief`, `fit: cover`, normalized `focal_point`, structured `fallback`, and nullable `selection`. A non-null selection is exactly `{asset_id, accepted_for, output_sha256}`. Fallbacks use closed mappings: `asset`, `icon-composition`, or `abstract-pattern`; the three abstract recipes are `gradient-field`, `line-grid`, and `soft-orbs`. Optional-visual families omit `primary_visual` entirely when no decoration is intended; once the field is declared, it always has a real local fallback. The schema has no exact-text/labels field inside the visual; the Agent owns keeping arbitrary brief prose and reviewed fallback/selected assets free of unintended lettering, numbers, chart labels, and brand marks because JS cannot prove that semantic property. Resolution first validates fallback unconditionally, then validates selected asset catalog/path/type/bytes/SHA, and only then compares `accepted_for`; it publishes `fallback`, `selected`, or `stale`, while `broken` remains bounded diagnostic-only evidence.

Four projections have separate jobs:

- per-slide semantic content fingerprint: normalized header values plus the complete typed non-visual body/callout data (including chart values and inline icon asset IDs) and schema/contract versions, excluding order and notes;
- `visual_contract_fingerprint`: only the primary visual's brief/placement/fit/focal point, family/resolved geometry variant, relevant `CONCEPT` semantic constraints, and the closed `canvas + resolved geometry` projection; it excludes exact header/body text, fallback/selected bytes, deck-global palette/image-language and renderer-only typography/spacing/component/font tokens, provider/model/style-reference inputs, notes, and order;
- deck-level `style_reference_contract_fingerprint`: only a versioned allowlist projection of global palette plus image-language `medium`/`material`/`lighting`/`texture`/`composition`/`avoid` tokens, excluding slide content/family/slot/provider/style-reference bytes.
- `ordered_plan_digest`: the complete renderer-consumed resolved-plan projection in physical slide order, including both fingerprints, passed preflight evidence, resolved theme/geometry, fallback/selection bindings, resolution state, and origin-relative asset/SHA evidence; it excludes input receipts, source locators, absolute paths, diagnostics, speaker notes, and unstructured planning prose such as `deck_system.txt`.

This prevents ordinary copy edits or fallback-byte changes from making a still-semantically-valid accepted visual stale. Image2-specific generation fingerprints remain out of scope.

**Alternative:** treat a selected asset as authoritative without rechecking fallback or bytes. Rejected because stale/corrupt selections would be hidden until rendering.

### 6. Layered asset catalogs preserve origin and override deterministically

The resolver reads an optional HTML-first `version: 2` backbone manifest at `2_backbone/visual-style/assets/asset-manifest.yaml` first and an optional sparse `version: 2` manifest at `3_versions/vN/overrides/visual-style/assets/asset-manifest.yaml` second. A version entry may add a new ID or replace one backbone ID only after validating the closed manifest shape, POSIX-relative lexical and realpath confinement, regular-file/media metadata, required SHA-256, and bytes relative to the declaring layer. Raster headers are bounded first, then exact pure-JS `fast-png@8.0.0`/`jpeg-js@0.4.4` decoders prove complete pixel-stream validity sequentially without trusting the existing native canvas decoder on malformed input. SVG uses exact direct dependency `saxes@6.0.0` in namespace-aware strict mode; the contract rejects DTD/entity declarations, non-XML processing instructions, active/foreign/text-for-icon elements, event handlers, external/data references, embedded CSS, excessive structural complexity, and ambiguous intrinsic dimensions without loading Playwright or asking an image decoder to fetch resources. A same-relative-path file without a corresponding version-manifest entry cannot shadow a backbone entry in the HTML-first resolver. The resolved catalog retains every entry's origin layer and source record. A missing pair means an empty catalog; any referenced ID must still resolve. The legacy loader's existing forward-compatible version semantics and override-first path behavior remain unchanged for legacy pipeline markers.

**Alternative:** copy assets into generated directories or merge manifests by array position. Rejected because generated copies are rebuildable and position-based merges break when pages are reordered.

### 7. Fingerprints exclude order but bind semantic content and contract inputs

Slide semantic and visual contract fingerprints are calculated from their separately defined canonical projections keyed by stable ID, not array position. Reordering changes order metadata but not per-slide fingerprints. Adding, deleting, changing content, changing fallback/selection evidence, or changing a renderer-consumed token changes the ordered plan digest; only the relevant semantic/visual/style fingerprint changes according to its narrower projection. Fingerprints and the plan digest include projection/schema/contract versions so future migrations cannot silently reuse incompatible evidence.

The repository already has equivalent recursive key-sorted JSON logic in `image_provenance.mjs` and `slide_document.mjs`. Implementation extracts one dependency-light `canonical_json.mjs` authority, keeps compatibility re-exports where needed, and proves existing generation/edit hashes are byte-identical. The new contract does not introduce a third near-copy or couple HTML planning to Image2 provenance.

### 8. Ownership and diagnostics remain split

JS/CLI emits deterministic parse/validation/asset diagnostics through existing CLI error authorities. MD Controller offers the opt-in authoring path and presents choices, but does not select the executable branch or duplicate the marker/YAML schema/family capacities; the shared JS probe and contract adapter are authoritative. Human judgment remains required for content meaning and visual selection where the contract cannot decide.

This change does not add a `cli-surface` delta because it adds no command, flag, envelope field, category, or diagnostic schema. The existing validation/Stage-1 commands and closed `FAILED` code are reused; `pipeline-orchestration` owns the new marker routing and token-shaped `reason.kind` values, while implementation still uses `cli_error.mjs` and all existing CLI return-audit obligations.

### 9. Change 2 exposes validation but blocks production delivery

`ppt_flow validate <run-dir>`, `stage1_build_inputs.mjs --validate --spec <canonical-source>`, and `unified_pipeline.mjs --run-dir <vN> --stage 1 --dry-run` are the three general Stage-1-equivalent validation routes and write nothing. Structural preview also composes the same validation core, but only inside a concrete edit transaction; it is not a fourth general validation route and cannot publish or substitute inputs. The sole generated-artifact publication route in Change 2 is literal `unified_pipeline.mjs --run-dir <vN> --stage 1` without `--dry-run`; it atomically projects a resolved HTML-first plan into the existing rebuildable `_generated/slide_plan.json` and does not create page prompts or image/PPTX artifacts. A non-validation direct `stage1_build_inputs.mjs` invocation is not a second HTML-first writer. Until Change 3 owns rendering and delivery, direct/public style-master, header approval, pilot/build/refresh, any `unified_pipeline --stage` selection containing Stages 2-5, and legacy structural materialization detect the marker before readiness, dotenv/credential/provider prerequisite lookup, implicit Stage 1, or any write/stage, then fail with the existing `FAILED` envelope and reason `html_first_delivery_unavailable`. Standalone Stage 2-5 scripts remain artifact-driven and unchanged because they are not passed a run-directory source marker. This avoids accidentally routing structured source through the legacy orchestration path without claiming impossible inference at lower artifact-only CLIs.

**Alternative:** allow the existing unified pipeline to continue until it happens to fail. Rejected because that could create misleading prompts, paid calls, or partial legacy artifacts from an unsupported source branch.

### 10. Pre-apply probes calibrate deterministic boundaries

Six repository-local, non-writing probe groups were run while refining this design:

- Exact `yaml@2.9.0` serialization with the chosen options produced stable schema-ordered block YAML, literal multiline strings, block sequences, and no wrapping. Focused probes also showed that core-schema date-looking strings remain plain by default, so canonicalization explicitly marks only the contract's timestamp-like strings as double-quoted scalar nodes before emission, and that a strict `JSON.parse` validity check plus the pinned YAML AST's unique-key diagnostics can detect duplicate JSON keys without changing the legacy projection. This supports pinning the existing dependency and golden-testing edited fences/config parsing rather than implementing a second YAML emitter or broad JSON replacement.
- The candidate grapheme corpus (decomposed Latin accents, Simplified Chinese/CJK punctuation, CRLF/TAB, emoji ZWJ, flags, and Indic conjuncts) produced identical counts on Node `22.23.1`, `24.18.0`, and `26.5.0` with the tested ICU 78.2/78.3 Unicode-17 profiles. The corpus and expected counts still belong in tests so a future runtime-profile change cannot silently alter capacities.
- Expanding the current verified font authority into exact per-file receipts yields 111 unique framework records, about 23.3 KB of compact receipt JSON, while the inventory-bound font bytes total about 4.7 MB. That bounded cost supports rechecking every actual font-authority input before plan rename instead of inventing an opaque composite receipt that a later consumer could not independently audit.
- A temporary zero-network Chromium measurement used Change 1's committed Source Sans 3/Noto Sans SC files on the logical v1 boxes. It rejected the earlier broad maxima (`quote: 280`, card body 120, comparison bullets 90, etc.) as visibly unrealistic for Han content. The revised header, callout, hero, split, cards, KPI, comparison, flow/timeline, data-insight, quote/supporting, and caption maxima fit the tested worst-form legal combinations in their narrowest current boxes. This is calibration evidence only; Change 3 still owns actual-page font usage, wrapping, and pixel-overflow enforcement.
- The supported Node majors expose no built-in `DOMParser`, and the current dependency graph contains no XML parser. A temporary exact `saxes@6.0.0` probe showed strict malformed-XML errors, namespace-local element/attribute events, entity-decoded URL attribute values, and explicit DOCTYPE/processing-instruction events. That evidence supports a small pinned SAX dependency plus a deliberately CSS-free passive-SVG subset instead of a custom XML parser, transitive undeclared parser, or browser launch.
- A malformed-raster probe showed the existing native canvas `loadImage(buffer)` path does not provide a reliable fail-closed Promise outcome for corrupt input. Exact pure-JS `fast-png@8.0.0` with CRC checking and `jpeg-js@0.4.4` with tolerant decoding disabled rejected truncated/corrupted fixtures while decoding valid buffers to the expected dimensions; their temporary production lock audit reported zero known vulnerabilities. That supports header bounds followed by sequential full decode rather than accepting SHA-correct but unusable fallback bytes.
- Package metadata probes confirmed the exact direct dependencies are compatible with the repository's supported Node majors: `yaml@2.9.0` requires Node >=14.6, `saxes@6.0.0` requires Node >=12.22.7, and `fast-png@8.0.0`/`jpeg-js@0.4.4` declare no narrower engine floor. Apply still needs a checked-in worst-case catalog benchmark (512 MiB total entries, 20 MiB per raster, sequential decode) with an explicit bounded runtime/memory assertion; the benchmark is an acceptance test for the validator, not permission to relax integrity checks.

## Risks / Trade-offs

- **[A source contract adds authoring ceremony]** -> Keep the branch opt-in, provide minimal fixtures/examples, and preserve legacy source compatibility.
- **[Capacity preflight can be mistaken for pixel proof]** -> Name every result `source_capacity` and explicitly defer browser measurement to Change 3.
- **[Ten families may become a premature taxonomy]** -> Version the registry, require discriminated names, and permit a new family only through a future contract change rather than ad hoc fields.
- **[Layered assets can hide an invalid override]** -> Validate every candidate and retain origin/SHA evidence; fail closed on path, digest, or metadata errors.
- **[Passive SVG validation can become an accidental XML/CSS/security subsystem]** -> Pin one strict SAX parser, reject DTD/PI/CSS/active content and unbounded structure, accept only local fragment references, and keep semantic text/brand review human-owned.
- **[Native or permissive raster decode can hang, crash, or accept corrupt fallback bytes]** -> Use exact pure-JS decoders after header bounds, enable PNG CRC and strict JPEG mode with a memory cap, decode sequentially, and discard pixels immediately.
- **[Full-catalog integrity can become operationally expensive]** -> Keep the 512 MiB aggregate/20 MiB per-raster caps, decode sequentially, discard pixel buffers, and make the worst-case benchmark a required apply test with a documented limit; do not hide invalid entries by validating only referenced assets.
- **[Round-trip editing can damage Markdown]** -> Limit writes to the owned fenced block and test byte preservation of surrounding sections and notes.
- **[Legacy and opt-in branches can drift]** -> Keep explicit marker gating, branch-specific fixtures, and tests proving legacy output remains unchanged.
- **[An opt-in source could accidentally enter the legacy paid path]** -> Detect the pipeline marker at orchestration entry and fail before Stage 2 or any provider prerequisite resolution.
- **[A deck-global palette/image-language/avoid change may make an accepted page feel stylistically stale without changing its page contract]** -> Keep automatic page acceptance scoped to the slide brief/concept/geometry; require the Agent to update affected slide `CONCEPT`/brief and re-bind selection when human review judges the global change material. Do not label intact bytes corrupt or silently invalidate every page for any deck-global style edit.

## Migration Plan

1. Add parser/model helpers and the `html-first-v1` marker/`SLIDE BODY` fixture without changing init defaults.
2. Add family registry, typed block validation, capacity/font preflight, canonical serializer, and contract diagnostics.
3. Add visual/style-reference fingerprints and layered v2 asset resolver with source-layer/SHA evidence, exact `saxes@6.0.0`/`fast-png@8.0.0`/`jpeg-js@0.4.4`, bounded full raster decode, and the passive-SVG subset.
4. Seed all five preset `html_first` projections with the shared geometry-registry ID while proving the legacy loader object/fingerprints remain unchanged.
5. Add identity/order fingerprint and round-trip integration tests.
6. Add one explicitly validation-only `reference/html-first-v1-authoring.md` linked from the script/reference index, including converting the init-seeded empty v1 asset manifest to v2 (or removing it when no assets are referenced), plus a fail-before-production orchestration boundary; do not change the active deck template/default workflow before Change 3.

Rollback removes the opt-in parser/registry/config keys/guidance, exact SVG/raster validation dependencies, and HTML-only guards, and restores the prior YAML dependency declaration/lock if the canonical-fence contract is abandoned; legacy parser, catalogs, IDs, generated artifacts, and workflow state remain valid. No generated artifact is edited by hand.

## Open Questions

No unresolved product/design choice is currently known. The final coherence rounds have established 68 unique expanded geometry keys with the specified per-family counts, valid semantic palette references for all five shipped presets, calibrated bilingual source capacities, explicit preflight/resolution/fingerprint projections, exact validation/publication routes, and proven fail-closed non-browser SVG/raster parsing seams. One implementation acceptance experiment remains intentionally explicit: run the worst-case bounded catalog benchmark described above and record its runtime/peak-memory result on each supported Node major. A mismatch reopens the owning contract rather than becoming implementation discretion; it does not authorize weakening integrity checks.
