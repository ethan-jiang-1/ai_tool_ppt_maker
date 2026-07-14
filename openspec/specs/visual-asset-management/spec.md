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
