## Purpose

Define the visual asset catalog system: `asset-manifest.yaml` as SSOT for named visual files (SVG, PNG, JPG) stored under `2_backbone/visual-style/assets/`. This capability owns the asset manifest loading/validation, asset file path resolution (backbone vs override), and SHA-256 fingerprint computation. It does NOT own asset binding to slides (that belongs to `content-parsing`) or asset transmission to the image API (that belongs to `image-generation`).
## Requirements
### Requirement: Asset manifest loading parses YAML with graceful missing-file handling

`loadAssetManifest(assetsDir)` SHALL parse `asset-manifest.yaml` from the given directory using the `yaml` package. If the file does not exist, it SHALL return `{ version: 1, assets: {} }` — not an error. If the file exists but contains invalid YAML, it SHALL throw with a descriptive error naming the file path. The returned object SHALL have `version` (integer) and `assets` (object mapping kebab-case ids to asset entries).

#### Scenario: Loading a valid manifest returns parsed data

- **WHEN** `loadAssetManifest()` is called on a directory containing a valid `asset-manifest.yaml` with 2 assets
- **THEN** the returned object has `version: 1` and `assets` with 2 keys
- **AND** each asset entry has `path`, `type`, `label`, `description`, and `usage_guidance` fields

#### Scenario: Missing manifest file returns empty catalog

- **WHEN** `loadAssetManifest()` is called on a directory without `asset-manifest.yaml`
- **THEN** the function returns `{ version: 1, assets: {} }` without throwing

#### Scenario: Invalid YAML throws with file path

- **WHEN** `loadAssetManifest()` is called on a directory containing malformed YAML
- **THEN** the function throws an error containing the file path in its message

#### Scenario: Empty manifest file returns empty catalog

- **WHEN** `loadAssetManifest()` is called on a directory containing an empty `asset-manifest.yaml`
- **THEN** the function returns `{ version: 1, assets: {} }` without throwing

### Requirement: Asset manifest validation checks required fields and types

`validateAssetManifest(manifest)` SHALL return an array of problem strings (empty = valid). It SHALL check: `version` is a positive integer; each asset entry key is a non-empty kebab-case string; each entry value is an object with required keys `path` (string, must not contain `..` or start with `/` — paths are relative to the assets directory), `type` (one of `svg`, `png`, `jpg`), `label` (string), `description` (string), `usage_guidance` (string). It SHALL NOT reject unrecognized keys (forward-compat).

#### Scenario: Valid manifest yields empty problem array

- **WHEN** `validateAssetManifest()` is called on a well-formed manifest
- **THEN** the returned array is empty

#### Scenario: Missing required field produces problem

- **WHEN** `validateAssetManifest()` is called on a manifest where an asset entry is missing `description`
- **THEN** the returned array contains a string naming the asset id and the missing field

#### Scenario: Path traversal in asset path produces problem

- **WHEN** `validateAssetManifest()` is called on a manifest where an asset entry has `path: ../../../etc/passwd`
- **THEN** the returned array contains a string naming the asset id and rejecting the path

#### Scenario: Absolute path in asset path produces problem

- **WHEN** `validateAssetManifest()` is called on a manifest where an asset entry has `path: /etc/passwd`
- **THEN** the returned array contains a string naming the asset id and rejecting the path

#### Scenario: Invalid asset type produces problem

- **WHEN** `validateAssetManifest()` is called on a manifest where an asset entry has `type: pdf`
- **THEN** the returned array contains a string listing the invalid type and valid options

### Requirement: Asset file resolution checks override first, then backbone

`resolveAssetFile(runDir, manifest, assetId)` SHALL look up the asset ID in the manifest, then resolve the file path via `resolveAssetPath()` from `bundle_layout.mjs` (which checks version `overrides/` first, then `2_backbone/`). It SHALL return the absolute file path if the file exists on disk, or `null` if the id is unknown or the file is missing.

#### Scenario: Asset file found in backbone returns absolute path

- **WHEN** `resolveAssetFile()` is called for a registered asset whose file exists in `2_backbone/visual-style/assets/`
- **THEN** the function returns an absolute path ending with the correct relative path

#### Scenario: Unknown asset id returns null

- **WHEN** `resolveAssetFile()` is called with an asset id not in the manifest
- **THEN** the function returns `null`

#### Scenario: Asset file missing on disk returns null

- **WHEN** `resolveAssetFile()` is called for a registered asset whose file does not exist on disk
- **THEN** the function returns `null`

### Requirement: Asset SHA-256 computation is deterministic

`sha256Asset(runDir, manifest, assetId)` SHALL resolve the asset file, read its bytes, and return the hex SHA-256 digest. If the file cannot be read, it SHALL return `null`. `aggregateAssetSha256(runDir, manifest, assetIds)` SHALL compute the SHA-256 of each referenced file, sort the asset IDs alphabetically, concatenate their hex digest strings in that order, and return the SHA-256 of the concatenation. Missing files SHALL be skipped with a stderr warning. An empty or null `assetIds` SHALL return an empty string.

#### Scenario: Single asset SHA-256 is stable

- **WHEN** `sha256Asset()` is called twice on the same asset file
- **THEN** both calls return the same hex digest

#### Scenario: Aggregate hash is independent of input order

- **WHEN** `aggregateAssetSha256()` is called with `["b", "a"]` vs `["a", "b"]`
- **THEN** both calls return the same hex digest

#### Scenario: Empty asset list returns empty string

- **WHEN** `aggregateAssetSha256()` is called with an empty array
- **THEN** the function returns `""`

#### Scenario: Missing asset file is skipped with warning

- **WHEN** `aggregateAssetSha256()` is called with an asset id whose file does not exist
- **THEN** a warning is logged to stderr naming the missing asset
- **AND** the function returns the hash of only the files that were readable

#### Scenario: All asset files missing returns empty string

- **WHEN** `aggregateAssetSha256()` is called with asset IDs where none of the files exist on disk
- **THEN** a warning is logged for each missing file
- **AND** the function returns `""`

### Requirement: Asset catalogs resolve backbone and version overrides by stable ID

The HTML-first asset resolver SHALL read optional `version: 2` manifest `2_backbone/visual-style/assets/asset-manifest.yaml` first and optionally merge the sparse `version: 2` manifest `3_versions/vN/overrides/visual-style/assets/asset-manifest.yaml` by stable asset ID. V2 manifests SHALL parse as exactly one YAML 1.2 core-schema mapping with unique string keys. Directives/document markers, multiple documents, aliases/anchors, merge keys, any explicit tag, non-JSON scalar objects, and duplicate keys SHALL fail, while ordinary comments MAY remain human guidance; parser semantics SHALL use the same pinned `yaml@2.9.0` version/core/unique-key authority as structured slide YAML. The v2 root SHALL contain exactly `version` and `assets`; `assets` SHALL be a mapping of at most 512 entries keyed by exact existing grammar `^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$`, with IDs at most 64 ASCII characters. Each asset entry SHALL contain exactly the existing `path`, `type`, `label`, `description`, and `usage_guidance` fields plus required lowercase 64-hex `sha256`; `type` remains `svg|png|jpg`. `path` SHALL be at most 240 UTF-8 bytes; `label`, `description`, and `usage_guidance` SHALL be at most 80, 400, and 600 graphemes respectively; each string SHALL be non-empty after ECMAScript `trim()`. A version entry MAY add a new ID or replace one backbone ID, and the effective merged catalog SHALL contain at most 512 distinct IDs. Each effective entry SHALL retain `origin: backbone|version`, its declaring manifest's run-bundle-root-relative path, an origin-relative asset path, exact raster/SVG media evidence, declared SHA, and measured SHA. Position or array index SHALL never be asset identity. If both manifests are absent, the effective HTML-first catalog is empty and validation succeeds only when no source/config asset ID is referenced. The legacy loader's existing positive-version/forward-compatible field behavior and override-first path resolution SHALL remain unchanged for legacy pipeline markers.

In addition to existing `svg/`, `reference/`, and `icons/` roots, a v2 entry MAY use only the Phase-4-owned `refined/image2/style-reference/` or `refined/image2/visual-slots/` root; no other new asset subdirectory is valid. The v2 catalog SHALL additionally expose a bounded Phase-2 public registration transaction that accepts a validated target run, a caller-supplied stable asset ID and approved raster bytes plus bounded descriptive metadata, writes the asset beneath one of those exact version override refined roots, and atomically adds or replaces exactly that v2 manifest entry with its measured SHA. It SHALL reject caller-supplied paths, manifest documents, origin, SHA, unsupported media, or arbitrary override writes. Phase 4 may call this public operation only within its bound promotion journal and SHALL not parse or edit the manifest itself.

#### Scenario: Version override replaces one asset ID

- **WHEN** a version override declares the same asset ID as a backbone entry and passes path/metadata/SHA validation
- **THEN** the resolved catalog uses the override and records the version layer as origin
- **AND** unrelated backbone entries remain effective

#### Scenario: Version manifest adds one local asset ID

- **WHEN** a valid sparse version manifest declares an ID absent from the backbone manifest
- **THEN** the effective catalog adds that ID with `origin: version`
- **AND** no backbone manifest edit is required for the version-local asset

#### Scenario: Refinement registers an accepted candidate

- **WHEN** Phase 4 passes a validated candidate value and target asset ID to Phase 2
- **THEN** the canonical version asset and exact manifest entry are committed with measured SHA
- **AND** no candidate-derived path or provider metadata enters the manifest

#### Scenario: Registration requests an arbitrary asset root

- **WHEN** a caller requests a refined asset path outside the two canonical Phase-4 roots
- **THEN** the transaction rejects it before writing bytes or a manifest

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

### Requirement: Migration candidate assets are a final sparse overlay

The asset-catalog owner SHALL resolve a migration candidate only through the HTML contract's trusted projected-candidate context. Its optional sparse `projected-run/overrides/visual-style/assets/asset-manifest.yaml` and confined asset bytes SHALL be a final candidate overlay above the source-version override and backbone v2 catalogs. It SHALL use the existing v2 grammar, ID uniqueness, path confinement, media validation, and SHA checks; the effective catalog SHALL retain the existing public `backbone|version` origin enum while its private migration receipt projection records whether the selected version-layer entry came from the candidate overlay. The candidate root is not a normal run directory.

The candidate overlay SHALL be read-only during preview/apply validation. Preparation may create its empty/scaffold manifest and registered local candidate assets only below `projected-run/`; preview/apply SHALL neither infer an asset from IMAGE PROMPT prose nor copy scratch generated bytes into the catalog. Hidden target staging SHALL reproduce the catalog by applying the revalidated candidate sparse override after source-version overrides. Arbitrary migration asset roots, manifest documents, paths, origin labels, or SHA values supplied by callers SHALL fail before read/write.

#### Scenario: Candidate override wins without mutating source catalogs

- **WHEN** a prepared candidate replaces one source-version asset ID in its sparse v2 manifest
- **THEN** migration preview resolves the candidate entry as a version-layer asset with candidate-overlay provenance
- **AND** the source-version and backbone manifests remain byte-identical

#### Scenario: Candidate asset path escapes its root

- **WHEN** a candidate manifest references an absolute, traversing, or symlink-escaping asset path
- **THEN** candidate catalog validation fails before rendering or hidden target staging
- **AND** no source catalog or generated object is written
