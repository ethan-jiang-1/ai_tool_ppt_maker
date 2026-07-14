## ADDED Requirements

### Requirement: Stage 2 passes per-slide assets as additional reference images

`generateOneImage()` SHALL accept an optional `additionalReferencePaths` parameter (array of absolute file paths, default `[]`). Each file SHALL be converted to a base64 data URL via `fileToDataUrl()`, which SHALL be extended to recognize `.svg` → `image/svg+xml` in addition to existing PNG/WEBP/GIF/JPEG mappings. Missing or unreadable files SHALL be skipped with a WARNING. Valid data URLs SHALL be appended to `body.images` after the style reference entry. The `body.image` (singular) field SHALL continue to hold only the style reference for backward compatibility. The `body.image_urls` array SHALL mirror the merged `body.images`. When `additionalReferencePaths` is empty or omitted, behavior SHALL be identical to the current implementation.

#### Scenario: Asset reference paths are sent to the API

- **WHEN** `generateOneImage()` is called with `additionalReferencePaths: ['/path/to/diagram.svg']`
- **AND** the diagram file exists
- **THEN** the diagram is converted to a data URL and appended to `body.images`
- **AND** `body.images[0]` remains the style reference data URL
- **AND** `body.images[1]` is the diagram data URL

#### Scenario: Missing asset file is skipped with warning

- **WHEN** `generateOneImage()` is called with an `additionalReferencePaths` entry pointing to a nonexistent file
- **THEN** a WARNING is logged naming the missing file
- **AND** the file is excluded from `body.images`
- **AND** generation proceeds with only the available references

#### Scenario: Empty additionalReferencePaths preserves existing behavior

- **WHEN** `generateOneImage()` is called without `additionalReferencePaths` (or with `[]`)
- **THEN** only the style reference is sent as a reference image
- **AND** `body.images` contains exactly one entry

### Requirement: Generation profile includes asset reference fingerprints

`generationProfile()` SHALL accept an optional `assetRefs` parameter (default `{}`). When `assetRefs` is non-empty, the returned profile SHALL include an `asset_refs` key containing the provided `{ aggregate_sha256, asset_count, assets: { id: sha256 } }` object. When `assetRefs` is empty or omitted, no `asset_refs` key SHALL appear in the profile — the serialized output SHALL be identical to the current implementation.

#### Scenario: Profile includes asset_refs when provided

- **WHEN** `generationProfile()` is called with `assetRefs: { aggregate_sha256: "abc123", asset_count: 2, assets: { a: "def456", b: "ghi789" } }`
- **THEN** the returned profile contains an `asset_refs` key with that exact object

#### Scenario: Profile omits asset_refs when not provided

- **WHEN** `generationProfile()` is called without `assetRefs` (or with `{}`)
- **THEN** the returned profile does NOT contain an `asset_refs` key
- **AND** `stableJson(profile)` produces identical output to the current implementation

### Requirement: Per-slide asset profile drives provenance invalidation

`generateImages()` SHALL accept an optional `assetResolver` function (default `null`). When provided, it SHALL, **for each slide individually**, resolve that slide's `asset_ids` to file paths via `assetResolver`, compute SHA-256 of each referenced file, and build a per-slide `assetRefs` map. The per-slide `assetRefs` SHALL be passed to `generationProfile()` to produce a per-slide profile. The resulting per-slide `generation_fingerprint` SHALL include asset reference hashes only for slides that reference assets. Slides without `asset_ids` SHALL produce a profile with no `asset_refs` key — identical to the current implementation. A change to a referenced asset file SHALL change that slide's `generation_fingerprint`, causing only that slide's existing image to be marked stale by `inspectImageProvenance()`.

#### Scenario: Asset change alters only referencing slide's fingerprint

- **WHEN** slide S1 references asset `diagram_a` (SHA `aaa`) and slide S2 references no assets
- **AND** `diagram_a` is later modified to a different SHA `bbb`
- **THEN** slide S1's per-slide `generation_fingerprint` differs from its original
- **AND** slide S1's existing image is marked not current by `inspectImageProvenance()`
- **AND** slide S2's per-slide profile contains no `asset_refs` key
- **AND** slide S2's `generation_fingerprint` is identical to before the asset change

#### Scenario: No asset resolver preserves existing fingerprint behavior

- **WHEN** `generateImages()` is called without `assetResolver`
- **THEN** no asset hashes are computed
- **AND** `generationProfile()` is called without `assetRefs`
- **AND** `generation_fingerprint` is identical to the current implementation

### Requirement: Post-generation provenance check uses per-slide profiles

`generateImages()` SHALL return a `profiles` Map (`slideId → profile`) in its result, replacing the single shared `profile` return value. The caller SHALL use per-slide profiles when performing the post-generation provenance check — calling `inspectImageProvenance()` with the slide-specific profile rather than a single shared profile for all slides. This SHALL ensure that non-referencing slides (with no `asset_refs` in their profile) and referencing slides (with `asset_refs`) are each validated against their correct expected fingerprint.

#### Scenario: Post-generation check passes for mixed asset/non-asset slides

- **WHEN** `generateImages()` completes with slide S1 (references assets) and slide S2 (no assets)
- **AND** the post-generation check calls `inspectImageProvenance()` with S1's profile (has `asset_refs`) and S2's profile (no `asset_refs`)
- **THEN** both slides are validated against their correct per-slide fingerprints
- **AND** both are reported as current
