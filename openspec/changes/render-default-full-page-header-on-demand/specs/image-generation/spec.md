## ADDED Requirements

### Requirement: Raw image cache reuse is proven by a generation manifest

Stage 2 SHALL maintain `_generated/page_images_full/_manifest.json` with one entry per generated slide. Each entry SHALL record output filename, a SHA-256 generation fingerprint, SHA-256 hash of the generated PNG bytes (`image_sha256`), generation profile fields, and generation timestamp. The generation fingerprint SHALL deterministically cover the final assembled prompt, style-reference file content hash, resolution, model identifier, and every generator option that changes image semantics; runtime endpoint and timestamps SHALL NOT affect it.

Stage 2 SHALL report `skipped-exists` only when both the output image and a matching current manifest entry exist. If an image exists but its entry is missing, corrupt, or has a different fingerprint, Stage 2 SHALL treat it as stale and fail loudly with a hint to rerun affected ids using `--force-images`; it SHALL NOT silently reuse the image or automatically incur regeneration cost. After successful generation, Stage 2 SHALL atomically update the entry. A failed generation SHALL NOT mark the fingerprint current. `--only` generation SHALL preserve unrelated valid entries.

#### Scenario: Matching image is reused
- **WHEN** a slide image exists and its manifest fingerprint matches current generation inputs
- **THEN** Stage 2 may skip generation and report `skipped-exists`

#### Scenario: Prompt change makes cache stale
- **WHEN** final prompt text changes while the old image remains
- **THEN** Stage 2 refuses reuse and identifies the slide as requiring `--force-images`

#### Scenario: Style or generator option change makes cache stale
- **WHEN** style-reference bytes, resolution, model, or another semantic generator option changes
- **THEN** the fingerprint changes and the old image is stale

#### Scenario: Selected regeneration preserves unrelated entries
- **WHEN** Stage 2 runs with `--only` and `--force-images`
- **THEN** successful selected entries update atomically and unrelated valid entries remain intact

### Requirement: Pilot and header approval verify raw image provenance

Pilot contact-sheet generation and `ppt_flow approve <run-dir> header` SHALL verify that every selected raw image has a current manifest fingerprint. A selected image with missing or stale provenance SHALL prevent header approval even when the PNG and pilot plan exist.

Header review evidence SHALL bind each reviewed full-page id to its manifest `image_sha256` and generation profile. Stage 4 SHALL reject evidence when the current raw image bytes no longer match. A production run SHALL NOT force-regenerate a currently reviewed/accepted full-page image and continue directly to assembly; it SHALL fail before generation and require either reuse of the reviewed image or a new target-profile pilot and approval. Evidence created at a different resolution/model/style profile SHALL not satisfy that production profile.

#### Scenario: Old cached image cannot approve a new title
- **WHEN** Stage 1 contains new header text but the selected PNG was generated from an older prompt
- **THEN** header approval fails and directs regeneration with `--force-images`

#### Scenario: Default force build cannot overwrite reviewed pages
- **WHEN** a build would force-regenerate a full-page image currently bound to valid header evidence
- **THEN** it fails before image generation and directs `--reuse-images` or target-profile re-pilot/re-approval

#### Scenario: Different production profile requires new review
- **WHEN** header review used 1K but production requests 2K, a different model, or a different style reference
- **THEN** that evidence does not authorize the production profile

#### Scenario: Reviewed image bytes must survive to assembly
- **WHEN** the reviewed PNG bytes change after approval even with identical prompt inputs
- **THEN** Stage 4 rejects the stored image hash and does not assemble the PPTX
