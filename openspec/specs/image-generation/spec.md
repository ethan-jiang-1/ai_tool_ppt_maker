## Purpose

Define Stage 2 (image generation) as an **in-framework Node** capability: async
submit→poll→download via `image_api_client.mjs`, batch generation via
`stage2_generate_images.mjs`, and QA contact sheets via `make_contact_sheet.mjs`.
Credentials SHALL use `IMAGE2_API_KEY` + `IMAGE2_BASE_URL` (CLI `--base-url` overrides the URL).
No external agent skills. No Python. No bash.
## Requirements
### Requirement: Stage 2 is implemented inside the framework
Image2 generation SHALL remain an in-framework Node ESM capability under
PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page, with resolveVendors,
stage2_generate_images.mjs, image_api_client.mjs, and the established submit/poll/download/error
contract. It is the Stage-2 implementation only for a current whole-page-image2-v1 source paired with
image2-only. Unified/public orchestration SHALL verify that source/state pair before stage dispatch,
option validation, credential/style-reference resolution, or writes: image2-only delegates to the
whole-page generator, while either HTML mode delegates HTML Stage 2 and SHALL not import or initialize
the whole-page adapter. A missing, retired, malformed, or state-inconsistent protocol has no Stage-2
fallback and returns the one owner-issued typed next action.

Direct whole-page invocation and public image2-only routes retain IMAGE2_API_KEY, IMAGE2_BASE_URL, and
supported base-url semantics. HTML renderer routes reject provider/base-url/model/style-reference options
before readiness or writes. Missing credentials and provider failures retain secret-safe Image2
diagnostics only when a chargeable current whole-page action is selected. Current content/visual/header
approval, generation-manifest provenance, reviewed-byte preservation, and explicit provider
authorization boundaries remain intact.

#### Scenario: Image2-primary Stage 2 uses whole-page generation
- **WHEN** unified pipeline selects Stage 2 for a consistent image2-only run
- **THEN** it delegates to the public current whole-page generator with existing Image2 resolution and provenance

#### Scenario: HTML Stage 2 uses local renderer
- **WHEN** unified pipeline selects Stage 2 for either HTML mode
- **THEN** it delegates to the HTML renderer
- **AND** does not resolve credentials, style master, provider URL, or whole-page modules

#### Scenario: HTML receives whole-page base-url override
- **WHEN** an HTML public build or preview receives a base-url option
- **THEN** it returns USAGE before renderer/provider readiness or writes

#### Scenario: Unsupported whole-page source has no generator continuation
- **WHEN** a markerless, retired, or state-inconsistent record selects whole-page Stage 2
- **THEN** it stops before credential lookup or generated-path writes
- **AND** it does not reuse a historical provider reader

### Requirement: Modern visual-slot transport is isolated from whole-page generation
Modern Image2 submission SHALL live only behind the visual-slot transport adapter and consume persisted
authorized attempt IDs. It SHALL emit secret-safe typed receipts suitable for reconciliation and SHALL
not change or import the current whole-page generator. Ordinary HTML build/local refresh SHALL initialize
neither modern transport nor a whole-page credential loader. Whole-page Image2 generation remains in its
separate public adapter and is selected only by the explicit current mode/pipeline pair.

#### Scenario: HTML build runs normally
- **WHEN** ordinary HTML build or local refresh runs
- **THEN** no modern transport or provider credential loader is initialized

#### Scenario: Current whole-page generation is isolated
- **WHEN** a consistent image2-only run invokes Stage 2
- **THEN** it uses the whole-page adapter without importing visual-slot request material or attempt state

### Requirement: CLI can inject the authorized modern visual-slot transport

The registered `ppt_flow image2 generate` and `image2 unknown-submit --decision retain` reconciliation routes SHALL
construct a Phase-4 transport from
the existing Image2 credential authority (`IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, and the supported
`--base-url` override) without duplicating the legacy credential parser or importing private Phase-4
implementation modules from HTML Phase 3. For `generate`, the adapter SHALL call only a persisted
authorized attempt ID plus a current, plan-bound provider-neutral request materialized from the
validated HTML plan. The request SHALL include a request-contract version and fingerprint, stable slide/slot
identity, text-free
visual brief/concept constraints, resolved slot geometry, style/profile contract, and verified reference
asset bytes together with their SHA-256 bindings (or an explicitly supported provider-neutral reference
kind that does not require bytes). The `unknown-submit` reconciliation path SHALL use the persisted provider request identity and
attempt binding rather than reconstructing or persisting prompt/body material. The adapter SHALL emit
the existing secret-safe typed submit/reconcile receipts
without persisting prompt/provider bodies, and preserve unknown-submit handling. Plan creation and
authorization remain provider-free and separate from generation.

The transport SHALL validate authorization/attempt/plan identity as an envelope separate from the
deterministic request-material fingerprint. It SHALL verify in-memory reference bytes against their
bound SHAs before adapting the request to a provider payload.

The supported response contract SHALL be closed: a synchronous submit succeeds only with returned image
bytes; an asynchronous submit succeeds only with a stable task/provider request ID that can drive
poll/result or reconciliation. A timeout, ambiguous acceptance, or async acceptance without that ID
SHALL persist `unknown-submit` and SHALL NOT retry. A relay outside these shapes SHALL fail as an
unsupported provider prerequisite before it is enabled for live use.

#### Scenario: Authorized CLI generation reaches the adapter

- **WHEN** a current authorized attempt is passed to `ppt_flow image2 generate`
- **THEN** the CLI resolves the canonical credentials and injects a transport into the public Phase-4 interface
- **AND** the request contains persisted authorization/attempt IDs and matches the authorized request fingerprint

#### Scenario: Current plan materializes the request

- **WHEN** the current HTML plan contains a valid text-free visual brief, slot geometry, and reference bindings
- **THEN** Phase 4 materializes a deterministic provider-neutral request before provider submission
- **AND** the request fingerprint equals the authorized attempt binding

#### Scenario: Request material changes after authorization

- **WHEN** current source, geometry, style contract, or reference bytes produce a different request fingerprint
- **THEN** generation fails stale before provider submission
- **AND** the user is directed to create a fresh plan and authorization

#### Scenario: Credentials are absent

- **WHEN** generation reaches its remote boundary without resolvable Image2 credentials/base URL
- **THEN** it fails before provider submission with the existing secret-safe prerequisite diagnostic
- **AND** it does not mark the attempt submitted

#### Scenario: Submit outcome is unknown

- **WHEN** the adapter cannot determine whether a chargeable request was accepted
- **THEN** it records `unknown-submit` for reconciliation
- **AND** it does not blindly retry or create a second attempt

#### Scenario: Synchronous submit returns image bytes

- **WHEN** a supported relay returns complete image bytes in the submit response without a task ID
- **THEN** the attempt completes through the synchronous result path
- **AND** reconciliation is not required

#### Scenario: Async acceptance omits a stable ID

- **WHEN** a relay indicates asynchronous acceptance but returns no stable task/provider request ID
- **THEN** the attempt becomes `unknown-submit`
- **AND** the adapter neither polls an invented ID nor resubmits the attempt

#### Scenario: User abandons an unknown submit

- **WHEN** `image2 unknown-submit --decision abandon` resolves an attempt
- **THEN** no provider credential or transport is initialized
- **AND** any replacement still requires a fresh plan and authorization

### Requirement: Submit and poll accept data-array response envelopes

`image_api_client.mjs` SHALL extract submit `task_id` from object and array `data` envelopes, including `{ code, data: [ { task_id, status } ] }`, consistent with result's `data[0]` handling (closes BUG-008). Poll status SHALL read top-level or unwrapped `data` so array envelopes are not stuck as unknown. Unit tests SHALL cover array submit and object regression.

#### Scenario: Submit response with data array yields task_id

- **WHEN** submit returns `{"code":200,"data":[{"status":"submitted","task_id":"task_abc"}]}`
- **THEN** the client obtains `task_abc` without throwing `No task_id`

#### Scenario: Submit response with object data still works

- **WHEN** submit returns `{"task_id":"task_xyz"}` or `{"data":{"task_id":"task_xyz"}}`
- **THEN** the client still obtains the task id

### Requirement: Image2 smoke, persist secrets to .env, lessons to _lessons/

Framework entry docs (`BOOTSTRAP.md` and Image2 SSOT `workflow/00-setup/03-runtime-and-tools.md`) SHALL require the Agent to verify `IMAGE2_API_KEY` and `IMAGE2_BASE_URL` through offline `doctor --image2` before offering a live diagnostic. `doctor --smoke` SHALL be the cheap first-vendor channel diagnostic; entry docs SHALL disclose its one expected provider submit and obtain human confirmation before invocation. `style-master ... --force --resolution 1k` SHALL NOT be presented as an interchangeable channel-health probe because it creates a real production reference asset.

When image-path symptoms persist, entry docs SHALL offer channel体检 in plain language. Before `doctor --probe-vendors`, they SHALL disclose the locally resolved vendor count and one submit per vendor and obtain confirmation. Declining either live probe SHALL make zero provider submits and SHALL NOT invalidate offline readiness evidence. Probe success SHALL prove channel health only and SHALL NOT authorize later production work.

After a successful confirmed probe and separate confirmation to retain the result, the **run bundle** retains:

1. **Secrets in `.env`** (walk-up, prefer deck-root): `IMAGE2_API_KEY` and `IMAGE2_BASE_URL` values.
2. **Non-secret lesson** -> `deck_*/_lessons/image2-proven.yaml` under `_lessons/` (read-before-guess). Fields: `proven_at`, `base_url`, `via` (`env`|`cli`), optional `notes`; **no API key field**.

Entry docs SHALL describe `_lessons/` as the general retained-lessons surface and SHALL treat `image2-proven.yaml` as an Image2 example entry, not the definition of `_lessons/`. Next session SHOULD read `_lessons/` before guessing endpoints. The Agent SHALL NOT auto-write `.env` or `_lessons` from a probe, leave proven combinations only in chat, put keys in `_lessons/`, or invent non-canonical lesson folders.

#### Scenario: Smoke succeeds then bundle retains the lesson

- **WHEN** a confirmed smoke succeeds with valid credentials
- **AND** the human separately confirms retaining the working result
- **THEN** `.env` retains the working `IMAGE2_API_KEY` and `IMAGE2_BASE_URL`
- **AND** `_lessons/image2-proven.yaml` exists without an API key field

#### Scenario: Novice is not left with a single hard failure

- **WHEN** offline Image2 readiness reports missing URL/key or a confirmed smoke fails
- **THEN** entry docs offer concrete credential remediation or a confirmed channel-health diagnostic before leaving "configure the API yourself" as the only next step
- **AND** no live diagnostic starts before its submit count is disclosed and confirmed

#### Scenario: Persist docs name _lessons as general surface

- **WHEN** an Agent follows BOOTSTRAP or `03-runtime-and-tools` after a successful confirmed smoke
- **THEN** those docs offer the non-secret receipt under `_lessons/` as one lesson among possible lessons, not under `_state/` or as chat-only
- **AND** they do not describe `_lessons/` as an Image2-only directory

#### Scenario: User declines channel diagnosis

- **WHEN** the Agent discloses the expected `--smoke` or `--probe-vendors` submit count and the human declines
- **THEN** the Agent does not invoke the live flag or style-master as a substitute probe
- **AND** no probe-derived `.env` or `_lessons` write occurs

### Requirement: Contact sheet is in-framework
Contact-sheet production SHALL remain in-framework using make_contact_sheet.mjs and @napi-rs/canvas,
never an external skill. For HTML final-slide delivery/review, orchestration SHALL pass plan-ordered
common verified final-slide entries to the provider-neutral builder that does not understand a private
renderer manifest. For image2-only with whole-page-image2-v1, the current whole-page raw-image
contact-sheet interface and timing remain under _generated/preview and may satisfy only current
whole-page review/completion owners. It is not provider-neutral HTML final-slide evidence.

For canonical html-first-v1, production/review contact-sheet objects and current manifest remain under
_generated/html_production/preview. HTML production SHALL not write the whole-page preview path as
authority. Each HTML sheet entry/receipt retains publication scope, current reset ID, ordered IDs,
final-slide fingerprints/SHAs, composition variants, dimensions/profile, and delivery/review digest.
Only canonical current-reset effective variants may enter authoritative HTML delivery; forced-fallback
variants remain review-only. No migration-preview sheet, projected scratch context, or historical
whole-page contact sheet may satisfy a current target's review or delivery evidence.

#### Scenario: Current whole-page Stage 2 completes
- **WHEN** a current whole-page image-generation batch completes successfully
- **THEN** its ordered raw-image contact sheet remains under _generated/preview
- **AND** it is consumed only by current whole-page owners

#### Scenario: HTML final slides complete
- **WHEN** current effective HTML final slides exist for the ordered plan
- **THEN** the provider-neutral builder publishes the delivery contact sheet under _generated/html_production/preview
- **AND** no whole-page Stage-2 directory or provider interface is required

#### Scenario: Forced-fallback review sheet is requested
- **WHEN** selected pages require fallback review
- **THEN** their forced-fallback objects may appear only in a review-labeled contact sheet and evidence digest
- **AND** that sheet cannot satisfy delivery readiness

#### Scenario: Delivery and visual-review sheets coexist
- **WHEN** both remain fresh after delivery-sheet publication
- **THEN** preview manifest retains separate current references for review and delivery
- **AND** each consumer resolves only its owning slot

#### Scenario: Retired scratch evidence cannot become current
- **WHEN** a caller offers a migration or projected-scratch contact sheet as target evidence
- **THEN** current contact-sheet validation rejects it before review/delivery publication

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

### Requirement: Raw image artifacts are addressed by stable slide ID
New Stage 2 writes SHALL use <slide_id>.png for raw image output and associate manifest entries with the
formal stable slide ID. The generation fingerprint SHALL cover every semantic generation input but
exclude current position, heading number, slide order, and position-bearing human-view filenames. The
logical Image2 artifact key is (slide_id, image2, raw-render, generation_fingerprint). Current reads
accept only an ID-addressed output whose manifest proves current engine, kind, fingerprint/profile, and
image-byte SHA. Filename guessing or an unrecognized historical manifest does not establish reuse,
currentness, or materialization authority.

#### Scenario: Reorder keeps cache current
- **WHEN** a slide moves position while its prompt, style reference, assets, model, resolution, and generator options remain unchanged
- **THEN** its generation fingerprint is unchanged
- **AND** Stage 2 reuses the manifest-proven ID-addressed raw image without remote rendering

#### Scenario: Position-prefixed file without current proof is stale
- **WHEN** a matching-looking position-prefixed PNG exists but no current manifest entry proves fingerprint and bytes
- **THEN** Stage 2 classifies it as missing or stale rather than current cache
- **AND** normal reuse treats the requested raw render as requiring current evidence or a later authorized rebuild

### Requirement: Cross-version raw image reuse is verified materialization

When orchestration requests reuse from a source version, Stage 2 SHALL expose enough manifest evidence to verify the same formal ID, `image2` engine, `raw-render` kind, generation fingerprint/profile, and source image SHA-256. Only a byte-verified match SHALL be copied into the target version and recorded atomically in the target manifest with source-version lineage. The target SHALL own its materialized artifact; normal target processing SHALL NOT read an earlier version as an implicit fallback. A failed verification SHALL return `needs_render` to orchestration and SHALL NOT itself invoke the remote renderer.

#### Scenario: Matching retained slide is materialized

- **WHEN** a retained ID has the same generation fingerprint/profile and its source PNG bytes match the source manifest
- **THEN** the target receives an ID-addressed copy and a current target manifest entry
- **AND** no remote generation is invoked

#### Scenario: Source bytes no longer match manifest

- **WHEN** the source PNG bytes differ from the recorded image SHA
- **THEN** cross-version materialization refuses that entry
- **AND** the target reports the ID as `needs_render` without a remote call

### Requirement: Whole-page generation identifies the current lineage
Whole-page Image2 generation receipts and produced artifact records SHALL identify `whole-page-image2-v1` and current whole-page producers. They SHALL not emit or accept a retired lineage value or require a compatibility reader.

#### Scenario: Whole-page artifacts are published
- **WHEN** authorized whole-page generation publishes an artifact record
- **THEN** its pipeline lineage is `whole-page-image2-v1`
- **AND** later consumers can validate it without a legacy reader

### Requirement: Page Authority raw requests are receipt-bound and authorization-scoped
Image Generation SHALL compile provider requests only from a resolved Page Authority receipt, trusted
visual-language selection, permitted identity projection, canvas/reserved-frame facts, and Pure-only
structured display fields. A nonzero submit batch SHALL require exact current human authorization.
Preview, validation, local composition, review, assembly, notes, and zero-submit reuse SHALL be
provider-free.

#### Scenario: Framed payload excludes Text Frame literals
- **WHEN** a Framed receipt contains visible Text Frame fields
- **THEN** the provider payload excludes every literal field value and carries the no-text constraints
- **AND** absent authorization stops before provider invocation

### Requirement: Raw evidence and acceptance use exact tuples
Each raw item SHALL have `{slide_id, raw_sha256, raw_image_contract_digest,
raw_generation_profile_digest}`. Reuse and review freshness SHALL require all four values to match.
Raw review `proceed` coverage is version-scoped and SHALL also bind the SHA-256 of the actual raw-review
projection PNG, its canonical projection-renderer profile digest, and source epoch. The projection is a
non-publishing visual artifact derived from one nonempty lexical order of the covered exact raw tuples:
Pure entries show their raw page; Framed entries show their raw underlay with only the fixed safe-zone
guide, never a local Text Frame literal. Its renderer profile covers the checked-in contact-sheet layout,
guide geometry, fonts/runtime, capture, and normalizer facts; a filename, metadata entry, or final
projection cannot substitute for either bound value. A changed covered tuple, guide/authority geometry,
or projection-renderer profile SHALL require a new raw-review projection and decision. Page Authority
finalization SHALL not publish on absent coverage: a complete current reviewable projection without a
decision produces the raw-review `confirm` action, while missing, partial, stale, or mismatched evidence
is a hard-stop repair action.

#### Scenario: Generation profile drift invalidates review
- **WHEN** provider/model/output/style-profile facts change while source visual semantics are unchanged
- **THEN** raw reuse and review coverage become stale
- **AND** the source epoch does not advance solely for that profile change

#### Scenario: A stale raw contact sheet cannot satisfy review
- **WHEN** a covered raw tuple, Framed safe-zone guide, or projection-renderer profile changes after a
  raw-review projection was captured
- **THEN** the previous `proceed` coverage is stale and a fresh non-publishing raw projection is required
- **AND** a final projection, filename, or copied review record cannot satisfy finalization

### Requirement: Structural raw materialization is target-owned and unreviewed
For a Page Authority structural plan, Image Generation SHALL classify a retained slide as materializable
only when its source raw bytes, exact raw tuple, and declared source lineage match the target's resolved
raw image contract and generation profile. Apply SHALL revalidate the plan-bound classification, copy
only verified bytes into the target raw manifest, and mark the target provenance `unreviewed`. It SHALL
not copy raw-review acceptance, final output, provider authorization, or a provider request; a missing or
mismatched source item SHALL remain `needs_raw_generation` for a later separately authorized operation.

#### Scenario: Materialization cannot inherit review approval
- **WHEN** a source Page Authority raw tuple is byte-verified and materialized for a structural target
- **THEN** the target records source lineage and an `unreviewed` raw item without a provider call
- **AND** the target cannot finalize until its own current raw-review `proceed` coverage exists
