## MODIFIED Requirements

### Requirement: Asset catalogs resolve backbone and version overrides by stable ID
The HTML-first asset resolver SHALL read optional `version: 2` manifest `2_backbone/visual-style/assets/asset-manifest.yaml` first and optionally merge the sparse `version: 2` manifest `3_versions/vN/overrides/visual-style/assets/asset-manifest.yaml` by stable asset ID. V2 manifests SHALL parse as exactly one YAML 1.2 core-schema mapping with unique string keys. Directives/document markers, multiple documents, aliases/anchors, merge keys, any explicit tag, non-JSON scalar objects, and duplicate keys SHALL fail, while ordinary comments MAY remain human guidance; parser semantics SHALL use the same pinned `yaml@2.9.0` version/core/unique-key authority as structured slide YAML. The v2 root SHALL contain exactly `version` and `assets`; `assets` SHALL be a mapping of at most 512 entries keyed by exact existing grammar `^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$`, with IDs at most 64 ASCII characters. Each asset entry SHALL contain exactly the existing `path`, `type`, `label`, `description`, and `usage_guidance` fields plus required lowercase 64-hex `sha256`; `type` remains `svg|png|jpg`. `path` SHALL be at most 240 UTF-8 bytes; `label`, `description`, and `usage_guidance` SHALL be at most 80, 400, and 600 graphemes respectively; each string SHALL be non-empty after ECMAScript `trim()`. A version entry MAY add a new ID or replace one backbone ID, and the effective merged catalog SHALL contain at most 512 distinct IDs. Each effective entry SHALL retain `origin: backbone|version`, its declaring manifest's run-bundle-root-relative path, an origin-relative asset path, exact raster/SVG media evidence, declared SHA, and measured SHA. Position or array index SHALL never be asset identity. If both manifests are absent, the effective HTML-first catalog is empty and validation succeeds only when no source/config asset ID is referenced. A `whole-page-image2-v1` source SHALL remain owned by its current whole-page asset records and SHALL not use this HTML v2 catalog as a compatibility reader.

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

#### Scenario: HTML-first v2 does not reinterpret a whole-page asset record
- **WHEN** an HTML-first source references a present manifest whose root version is not `2`
- **THEN** HTML-first catalog validation fails with the manifest path and supported version
- **AND** it does not select a whole-page asset reader

#### Scenario: Empty v1 catalog is not upgraded by a transition
- **WHEN** a current source contains a default empty `version: 1` manifest while HTML-first validation is selected
- **THEN** validation requires an explicit v2 manifest or no referenced asset
- **AND** it does not rewrite or reinterpret the v1 file

#### Scenario: Unregistered path shadow does not override by accident
- **WHEN** an override directory contains a file at the same relative path as a backbone asset but the sparse override manifest does not declare that asset ID
- **THEN** the HTML-first resolver continues to use the backbone entry and bytes
- **AND** no whole-page asset record is consulted

## REMOVED Requirements

### Requirement: Migration candidate assets are a final sparse overlay
**Reason**: The projected candidate overlay, its scratch assets, and migration receipt provenance are retired with the source-to-HTML path.

**Migration**: Use current source-owned asset contracts. A production-mode transition constructs a clean target from its explicitly authored target inputs without a migration asset overlay.
