## ADDED Requirements

### Requirement: Asset catalogs resolve backbone and version overrides by stable ID

The HTML-first asset resolver SHALL read optional `version: 2` manifest `2_backbone/visual-style/assets/asset-manifest.yaml` first and optionally merge the sparse `version: 2` manifest `3_versions/vN/overrides/visual-style/assets/asset-manifest.yaml` by stable asset ID. V2 manifests SHALL parse as exactly one YAML 1.2 core-schema mapping with unique string keys. Directives/document markers, multiple documents, aliases/anchors, merge keys, any explicit tag, non-JSON scalar objects, and duplicate keys SHALL fail, while ordinary comments MAY remain human guidance; parser semantics SHALL use the same pinned `yaml@2.9.0` version/core/unique-key authority as structured slide YAML. The v2 root SHALL contain exactly `version` and `assets`; `assets` SHALL be a mapping of at most 512 entries keyed by exact existing grammar `^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$`, with IDs at most 64 ASCII characters. Each asset entry SHALL contain exactly the existing `path`, `type`, `label`, `description`, and `usage_guidance` fields plus required lowercase 64-hex `sha256`; `type` remains `svg|png|jpg`. `path` SHALL be at most 240 UTF-8 bytes; `label`, `description`, and `usage_guidance` SHALL be at most 80, 400, and 600 graphemes respectively; each string SHALL be non-empty after ECMAScript `trim()`. A version entry MAY add a new ID or replace one backbone ID, and the effective merged catalog SHALL contain at most 512 distinct IDs. Each effective entry SHALL retain `origin: backbone|version`, its declaring manifest's run-bundle-root-relative path, an origin-relative asset path, exact raster/SVG media evidence, declared SHA, and measured SHA. Position or array index SHALL never be asset identity. If both manifests are absent, the effective HTML-first catalog is empty and validation succeeds only when no source/config asset ID is referenced. The legacy loader's existing positive-version/forward-compatible field behavior and override-first path resolution SHALL remain unchanged for legacy pipeline markers.

#### Scenario: Version override replaces one asset ID

- **WHEN** a version override declares the same asset ID as a backbone entry and passes path/metadata/SHA validation
- **THEN** the resolved catalog uses the override and records the version layer as origin
- **AND** unrelated backbone entries remain effective

#### Scenario: Version manifest adds one local asset ID

- **WHEN** a valid sparse version manifest declares an ID absent from the backbone manifest
- **THEN** the effective catalog adds that ID with `origin: version`
- **AND** no backbone manifest edit is required for the version-local asset

#### Scenario: Invalid version entry is rejected

- **WHEN** an override has an invalid path, unsupported media type, missing file, or digest mismatch
- **THEN** catalog resolution fails with the asset ID and integrity reason
- **AND** no generated copy is used to mask the error

#### Scenario: HTML-first v2 does not reinterpret a legacy manifest

- **WHEN** an HTML-first source references a present manifest whose root version is not `2`
- **THEN** HTML-first catalog validation fails with the manifest path and supported version
- **AND** the legacy pipeline continues to use its existing loader/version semantics

#### Scenario: Empty init-seeded v1 catalog has an explicit opt-in migration

- **WHEN** an Agent converts a legacy-initialized run to `html-first-v1` and the backbone still contains the default empty `version: 1` manifest
- **THEN** authoring guidance requires changing it to an empty `version: 2` manifest or deleting it when no asset is referenced
- **AND** HTML-first validation does not silently reinterpret the present v1 file as v2

#### Scenario: Unregistered path shadow does not override by accident

- **WHEN** an override directory contains a file at the same relative path as a backbone asset but the sparse override manifest does not declare that asset ID
- **THEN** the HTML-first resolver continues to use the backbone entry and bytes
- **AND** legacy override-first behavior remains isolated to the legacy resolver

### Requirement: Asset selection evidence distinguishes applicability from integrity

The resolver SHALL validate every fallback and selected asset independently. A selected binding MAY be stale or inapplicable without corrupt bytes, but a missing, unregistered, or digest-invalid asset SHALL be `broken` and SHALL block the structured plan.

Every v2 manifest entry SHALL be validated even when the current slide set does not reference it. Its `path` SHALL equal its ECMAScript-trimmed value, use `/` separators, contain no NUL or `\`, and be a normalized POSIX-relative path with no empty, `.` or `..` segment and no absolute, drive-letter, UNC, or URI form. Both lexical resolution and the real path of the final regular file SHALL remain under the declaring layer's `assets/` directory; symlink escape, directory/special-file targets, unreadable bytes, or declared/measured digest mismatch SHALL fail the catalog. Media validation SHALL require lowercase exact extension (`.svg|.png|.jpg`), signature/header content, and manifest `type` agreement plus positive intrinsic dimensions no larger than `8192 x 8192`. PNG SHALL require the 8-byte PNG signature followed by a 13-byte first `IHDR` chunk whose big-endian width/height pass the bound, then fully decode with exact `fast-png@8.0.0` option `{checkCrc:true}` and require decoded dimensions to match IHDR. JPEG SHALL require SOI and scan bounded marker segments for the first SOF marker in exact set `C0,C1,C2,C3,C5,C6,C7,C9,CA,CB,CD,CE,CF`, validate its big-endian height/width, then fully decode with exact `jpeg-js@0.4.4` options `{useTArray:true,tolerantDecoding:false,maxMemoryUsageInMB:512}` and require decoded dimensions to match SOF. Decoding SHALL occur sequentially and discard pixel buffers after validation. Each raster may be at most 20 MiB. SVG may be at most 2 MiB of valid UTF-8 source and SHALL be parsed with exact direct dependency `saxes@6.0.0` in namespace-aware mode, with parser errors treated as fatal. Its sole root SHALL be `<svg>` in namespace `http://www.w3.org/2000/svg`. XML numbers SHALL match `[-+]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][-+]?[0-9]+)?`. A present `viewBox` SHALL contain exactly four such finite numbers separated only by comma/ASCII whitespace, with width/height positive and at most 8192. `width`/`height` SHALL be both absent or both present as positive finite numbers with optional exact `px`, each at most 8192; at least a valid `viewBox` or the complete width/height pair is required. The effective merged catalog SHALL not exceed 512 MiB measured bytes.

V2 SVG SHALL be a deliberately CSS-free passive subset. Validation SHALL reject every DOCTYPE/entity declaration, every processing instruction other than an optional leading XML declaration, namespace-local `<script>`, `<foreignObject>`, `<style>`, `<animate>`, `<animateMotion>`, `<animateTransform>`, `<set>`, or `<discard>` element, every `style` or `xml:base` attribute, and every case-insensitive event-handler attribute. Every present `id` SHALL match `^[A-Za-z_][A-Za-z0-9_.:-]*$` and be unique. After entity decoding, every namespace-local `href` (including `xlink:href`) SHALL match local fragment grammar `^#[A-Za-z_][A-Za-z0-9_.:-]*$`; any non-style attribute containing `url(` SHALL, after trimming, match exact local-fragment form `^url\(#[A-Za-z_][A-Za-z0-9_.:-]*\)$`; every referenced fragment SHALL resolve to one declared ID after the full parse, and external, protocol-relative, file, and data references SHALL fail. The parser SHALL cap nesting depth at 128, total elements at 50,000, and attributes per element at 64. An SVG used as a typed-block icon or `icon-composition` fallback SHALL additionally contain no namespace-local `<text>` element. This is a deterministic safety/network boundary, not a semantic claim that other drawings contain no unintended visible text or brand mark.

PNG validation SHALL reject APNG animation chunks `acTL`, `fcTL`, and `fdAT`; JPEG validation SHALL reject an APP1 payload beginning `Exif\0\0` so browser-side orientation metadata cannot disagree with SOF/decoded dimensions. V2 raster evidence represents one passive, orientation-free still image only.

#### Scenario: Stale selection keeps a valid fallback

- **WHEN** a selected binding is stale but both selected and fallback bytes are valid
- **THEN** resolution reports `stale` with the fallback evidence available
- **AND** it does not invoke Image2 or change source selection automatically

#### Scenario: Catalog digest and selection digest both bind selected bytes

- **WHEN** a selected binding resolves to a catalog entry
- **THEN** actual bytes SHALL match both the catalog entry `sha256` and `selection.output_sha256`
- **AND** mismatch with either value is reported as `broken`

#### Scenario: Unused invalid entry still fails catalog integrity

- **WHEN** a v2 manifest contains an unreferenced entry whose real path escapes its declaring assets directory or whose bytes mismatch `sha256`
- **THEN** catalog validation fails before slide selection resolution
- **AND** the invalid entry is not hidden merely because no current slide references it

#### Scenario: Active or externally linked SVG is rejected

- **WHEN** a v2 SVG contains script/event behavior, a foreign object, external/data resource reference, or imported CSS
- **THEN** catalog validation fails with the asset ID and normalized media reason
- **AND** later HTML rendering cannot gain a network or active-content path through the catalog

#### Scenario: SVG subset rejects hidden styling and broken fragments

- **WHEN** a v2 SVG contains embedded/inline CSS, animation, `xml:base`, duplicate IDs, or a local fragment reference with no declared target
- **THEN** catalog validation fails before the asset enters the effective catalog
- **AND** the validator does not defer CSS, animation, or reference interpretation to a browser
