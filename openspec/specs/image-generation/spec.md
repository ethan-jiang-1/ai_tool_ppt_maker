## Purpose

Define Stage 2 (image generation) as an **in-framework Node** capability: async
submit→poll→download via `image_api_client.mjs`, batch generation via
`stage2_generate_images.mjs`, and QA contact sheets via `make_contact_sheet.mjs`.
Credentials SHALL use `IMAGE2_API_KEY` + `IMAGE2_BASE_URL` (CLI `--base-url` overrides the URL).
No external agent skills. No Python. No bash.
## Requirements
### Requirement: Stage 2 is implemented inside the framework

Stage 2 SHALL be implemented by Node ESM modules under `PPTMAKER_FRAMEWORK/scripts/`. The unified pipeline SHALL call these modules directly, not discover external skills.

Image credentials SHALL be resolved by a single SSOT helper (`resolveVendors`) into a single `{ base_url, api_key }` entry. The key is `IMAGE2_API_KEY`; the base URL is `IMAGE2_BASE_URL`, with CLI `--base-url` taking priority. These variables are for **image generation only**, not chat LLMs. Missing key or URL SHALL produce a clear error naming the missing variable.

`generateOneImage` SHALL submit the image request, poll if async, and save the result. On failure it SHALL throw an `ImageProviderError` with host, reason, and HTTP status where known. Sync vs async SHALL remain one thin post-submit branch: if `extractImageRef` yields an image, save it; else if a task id exists, poll; else fail that attempt. Output shapes (`url`, `b64_json`, poll-embedded URL) SHALL continue through one extract helper.

#### Scenario: Pipeline uses in-framework generator

- **WHEN** `unified_pipeline.mjs --stage 2` runs
- **THEN** Stage 2 uses `stage2_generate_images.mjs` with Image2-resolved credentials

#### Scenario: Missing base URL fails at resolve time

- **WHEN** Stage 2 runs with `IMAGE2_API_KEY` set but no `IMAGE2_BASE_URL`
- **THEN** resolution fails naming `IMAGE2_BASE_URL`

#### Scenario: CLI --base-url overrides IMAGE2_BASE_URL

- **WHEN** `--base-url https://custom.example/v1` is passed and `IMAGE2_API_KEY` is set
- **THEN** the custom URL is used instead of `IMAGE2_BASE_URL`

#### Scenario: Missing API key fails at resolve time

- **WHEN** Stage 2 runs with `IMAGE2_BASE_URL` set but no `IMAGE2_API_KEY`
- **THEN** resolution fails naming `IMAGE2_API_KEY`

#### Scenario: Provider failure surfaces host and reason

- **WHEN** the image provider returns an error
- **THEN** the `ImageProviderError` includes host, reason, and HTTP status where known
- **AND** no credential values or raw response bodies appear in the error

#### Scenario: Sync submit success without task_id

- **WHEN** submit returns an extractable image ref and no task id
- **THEN** the client saves the image without polling

### Requirement: Submit and poll accept data-array response envelopes

`image_api_client.mjs` SHALL extract submit `task_id` from object and array `data` envelopes, including `{ code, data: [ { task_id, status } ] }`, consistent with result's `data[0]` handling (closes BUG-008). Poll status SHALL read top-level or unwrapped `data` so array envelopes are not stuck as unknown. Unit tests SHALL cover array submit and object regression.

#### Scenario: Submit response with data array yields task_id

- **WHEN** submit returns `{"code":200,"data":[{"status":"submitted","task_id":"task_abc"}]}`
- **THEN** the client obtains `task_abc` without throwing `No task_id`

#### Scenario: Submit response with object data still works

- **WHEN** submit returns `{"task_id":"task_xyz"}` or `{"data":{"task_id":"task_xyz"}}`
- **THEN** the client still obtains the task id

### Requirement: Image2 smoke, persist secrets to .env, lessons to _lessons/

Framework entry docs (`BOOTSTRAP.md` and Image2 SSOT `workflow/00-setup/03-tool-selection.md`) SHALL require: on missing credentials or image failure, the agent verifies `IMAGE2_API_KEY` and `IMAGE2_BASE_URL` and runs a cheap smoke (`doctor --smoke` and/or `style-master … --force --resolution 1k`) before telling a novice to self-configure. When image-path symptoms persist (smoke fail, 502, or user reports images will not generate), entry docs SHALL direct the agent to offer channel体检 in plain language (`doctor --probe-vendors`) rather than only "configure the API yourself".

On success, the **run bundle** retains:

1. **Secrets in `.env`** (walk-up, prefer deck-root): `IMAGE2_API_KEY` and `IMAGE2_BASE_URL` values.
2. **Non-secret lesson** → `deck_*/_lessons/image2-proven.yaml` under `_lessons/` (read-before-guess). Fields: `proven_at`, `base_url`, `via` (`env`|`cli`), optional `notes`; **no API key field**.

Entry docs SHALL describe `_lessons/` as the general retained-lessons surface and SHALL treat `image2-proven.yaml` as an Image2 example entry, not as the definition of `_lessons/`. Next session SHOULD read `_lessons/` before guessing endpoints. The agent SHALL NOT leave proven combos only in chat, SHALL NOT put keys in `_lessons/`, and SHALL NOT invent non-canonical folders for these lessons.

#### Scenario: Smoke succeeds then bundle retains the lesson

- **WHEN** a smoke succeeds with valid credentials
- **THEN** `.env` retains the working `IMAGE2_API_KEY` and `IMAGE2_BASE_URL`
- **AND** `_lessons/image2-proven.yaml` exists without an API key field

#### Scenario: Novice is not left with a single hard failure

- **WHEN** doctor reports missing Image2 URL/key or the smoke fails
- **THEN** entry docs direct verifying credentials and channel体检 as a concrete next step before "configure the API yourself" as the only next step

#### Scenario: Persist docs name _lessons as general surface

- **WHEN** an agent follows BOOTSTRAP / `03-tool-selection` after a successful smoke
- **THEN** those docs tell them to write the non-secret receipt under `_lessons/` as one lesson among possible lessons (not under `_state/` or as chat-only)
- **AND** they do not describe `_lessons/` as an Image2-only directory

### Requirement: Contact sheet is in-framework

After image generation, the pipeline SHALL produce a contact sheet using
`make_contact_sheet.mjs` (`@napi-rs/canvas`), not an external skill.

#### Scenario: Contact sheet written under preview/

- **WHEN** Stage 2 completes successfully
- **THEN** a JPEG contact sheet is written under `_generated/preview/`

### Requirement: No external skill dependency

The framework SHALL NOT require `image2-ppt` or `image2-imagegen` skills to be
installed for production readiness.

#### Scenario: Doctor without skills dirs

- **WHEN** env-check runs with no `.claude/skills` / `.agents/skills` present
- **THEN** `stage2_generator` is still `ok` if in-framework scripts exist

### Requirement: Poll loop emits heartbeat within MAX_WAIT_MS

`image_api_client.mjs` SHALL emit a progress log at least every **30 seconds** (`HEARTBEAT_MS`) while waiting on a single image, covering:

1. **Submit wait** — while `POST …/images/generations` is in flight (including sync vendors that block until the image is ready), including elapsed time, vendor base URL, and `phase=submit` (or equivalent).
2. **Poll wait** — while polling a task, including elapsed time, last known status, and task id when known (`phase=poll` or equivalent).

Submit wait SHALL be bounded by the same per-image budget as poll (`MAX_WAIT_MS` or documented equivalent) via abort/timeout; on submit timeout the attempt SHALL fail with an error that identifies timeout, `phase=submit`, vendor, and elapsed time. On poll timeout it SHALL fail that image with an error that identifies the timeout and task id when known, and SHALL stop polling that task.

#### Scenario: Long poll prints heartbeat

- **WHEN** a poll waits longer than 30 seconds before completion
- **THEN** output includes at least one progress line with elapsed time

#### Scenario: Long sync submit prints heartbeat

- **WHEN** a submit request stays in flight longer than 30 seconds before returning
- **THEN** output includes at least one progress line naming the vendor and submit phase

#### Scenario: Submit timeout fails the attempt

- **WHEN** a single submit stays in flight longer than `MAX_WAIT_MS`
- **THEN** that vendor attempt fails with a timeout error identifying submit phase
- **AND** the client records the timeout error with submit phase and host

#### Scenario: Per-image timeout stops polling

- **WHEN** a single image poll exceeds `MAX_WAIT_MS`
- **THEN** that image generation fails with a timeout error
- **AND** the client does not continue polling that task

### Requirement: Image API response fixtures cover extract paths

The test suite SHALL include checked-in, secret-free JSON fixtures for known relay shapes (at minimum: submit `data:[{task_id}]`, and a completed poll body with embedded image URL under `data.result.images[0].url`). Tests SHALL assert exported unwrap/extract helpers accept those fixtures.

#### Scenario: Fixture poll embedded URL extracts

- **WHEN** tests load the poll-embedded-image fixture
- **THEN** the extract helper returns the image URL (or downloadable ref)
- **AND** no API key appears in the fixture files

### Requirement: Stage 2 batch progress is logged as i/N

`stage2_generate_images.mjs` SHALL log batch progress for each slide using 1-based `i/N` (index and total) and the slide id when starting generation and when finishing with success or error.

#### Scenario: Stage 2 prints slide i of N

- **WHEN** Stage 2 generates a batch of three slides
- **THEN** output includes progress lines that identify each slide as part of `i/3` (or equivalent `i/N`)

### Requirement: Image generation trace records provider info without secrets

When `generateOneImage` succeeds and writes a trace JSON (e.g. `*.image-task.json`), the trace SHALL include the `base_url`, task id, model, resolution, elapsed time, and an `attempts` array of prior failed tries as `{ base_url, reason, status }` (empty array when the first attempt succeeded), **without** API key values or raw response bodies. Total failure SHALL NOT be required to write a trace file; the thrown attempts summary is sufficient.

#### Scenario: Trace records provider metadata

- **WHEN** image generation succeeds and a trace path is provided
- **THEN** the trace file includes `base_url`, task id, model, and elapsed seconds
- **AND** `attempts` records any prior failed attempts with host, reason, and HTTP status
- **AND** no API key appears in the trace file

#### Scenario: First-attempt success writes empty attempts

- **WHEN** the provider succeeds on the first try and a trace path is provided
- **THEN** the trace includes the `base_url`
- **AND** `attempts` is an empty array

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

### Requirement: generateOneImage logs when no style reference is provided

`generateOneImage` SHALL log an informational message when `styleReferencePath` is falsy, before the vendor loop begins. The message SHALL indicate that generation is proceeding without visual style anchoring. This makes the absence of a style reference visible to callers — both production pipelines and scratch experiments — without treating it as an error or warning.

When `styleReferencePath` is provided and valid, no additional log SHALL be emitted (the existing behavior is unchanged).

#### Scenario: No style reference logs informational message

- **WHEN** `generateOneImage` is called without a `styleReferencePath` (the parameter is falsy: null, undefined, or empty string)
- **THEN** output includes the line `"No style reference — generating without visual style anchoring"`
- **AND** the log appears once per call, before vendor-specific output

#### Scenario: Style reference provided does not log extra message

- **WHEN** `generateOneImage` is called with a valid `styleReferencePath`
- **THEN** no "no style reference" message is logged
- **AND** existing behavior (attaching the ref as base64 data URL) is unchanged

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

