## MODIFIED Requirements

### Requirement: Stage 2 is implemented inside the framework

Image2 generation SHALL remain an in-framework Node ESM capability under
`PPTMAKER_FRAMEWORK/scripts/`, with `resolveVendors`, `stage2_generate_images.mjs`,
`image_api_client.mjs`, and its existing submit/poll/download/error contract. It SHALL be the Stage-2
implementation for the whole-page `legacy-image2-first` pipeline, whether reached through a first-class
`image2-only` production controller or historical markerless compatibility. Unified/public
orchestration SHALL resolve canonical production mode and verify the source marker before stage
dispatch, option validation, credential/style-reference resolution, or writes: `image2-only` delegates
to the whole-page generator, while either HTML mode delegates HTML Stage 2 to
`stage2_render_html.mjs` and SHALL not import or initialize the whole-page adapter.
`legacy-image2-first` SHALL remain the normalized pipeline label for a markerless source; generation
SHALL not require or create that value as `production.pipeline` frontmatter.

Direct whole-page Image2 invocation and public `image2-only` routes SHALL retain `IMAGE2_API_KEY`,
`IMAGE2_BASE_URL`, and supported `--base-url` semantics. HTML public/direct renderer routes SHALL
reject provider/base-url/model/style-reference options before readiness or writes. Missing credentials
and provider failures SHALL retain the existing secret-safe Image2 diagnostics only when a chargeable
whole-page generator action is actually selected. Promotion to a first-class route SHALL NOT weaken
existing content/visual/header approval, generation-manifest provenance, reviewed-byte preservation,
or explicit provider authorization boundaries.

#### Scenario: Image2-primary Stage 2 uses whole-page generation

- **WHEN** unified pipeline selects Stage 2 for a consistent `image2-only` run
- **THEN** it delegates to `stage2_generate_images.mjs` with existing Image2 resolution and provenance

#### Scenario: Markerless Stage 2 uses Image2

- **WHEN** a migrated historical markerless run resolves to `image2-only`
- **THEN** its existing whole-page generator behavior and source artifacts remain valid

#### Scenario: HTML Stage 2 uses local renderer

- **WHEN** unified pipeline selects Stage 2 for either HTML mode
- **THEN** it delegates to `stage2_render_html.mjs`
- **AND** does not resolve credentials, style master, provider URL, or whole-page Image2 modules

#### Scenario: HTML receives legacy base-url override

- **WHEN** an HTML public build/preview receives `--base-url`
- **THEN** it returns `USAGE` before renderer/provider readiness or writes

#### Scenario: Legacy provider behavior remains compatible

- **WHEN** the whole-page generator receives sync output, async task output, or a provider failure
- **THEN** it retains the existing shared extract/poll/save or secret-safe `ImageProviderError` behavior

### Requirement: Contact sheet is in-framework

Contact-sheet production SHALL remain in-framework using `make_contact_sheet.mjs` and
`@napi-rs/canvas`, never an external skill. For HTML-mode final-slide delivery/review, orchestration
SHALL pass plan-ordered common verified final-slide entries to the provider-neutral builder that does
not understand a private renderer manifest. For first-class `image2-only` and historical markerless
compatibility, the existing whole-page raw-image contact-sheet interface and timing SHALL remain
unchanged; it SHALL not be reclassified as provider-neutral HTML final-slide evidence.

Whole-page contact sheets SHALL remain under `_generated/preview/` with existing raw provenance. For
canonical `html-first-v1`, production/review contact-sheet objects and current manifest SHALL remain
under `_generated/html_production/preview/`; migration comparison sheets remain under the projected-run
scratch owner. HTML production SHALL not write the whole-page preview path as authority. Each HTML sheet
entry/receipt SHALL retain exact `publication_scope`, nullable `html_production_reset_id`, ordered IDs,
final-slide fingerprints/SHAs, composition variants, dimensions/profile, and delivery/review digest.
Rendered sheet bytes SHALL continue to exclude publication scope, reset ID, and physical workspace path.
Only canonical current-reset effective variants may enter authoritative HTML delivery; forced-fallback
variants remain review-only and migration-preview sheets satisfy only their hash-bound comparison.

HTML contact-sheet publication SHALL continue to update only the owning
`pptmaker-html-preview-manifest-v1` slot `contact_sheets.visual_review` or `contact_sheets.delivery`
through same-scope/reset atomic merge and revalidation. It SHALL not overwrite content/visual review
plans and SHALL clear carried slots whose bytes/inputs/scope/reset no longer verify. Consumers SHALL not
infer currentness from an object file, the other slot, a pre-reset slot, or migration-preview manifest.
Whole-page consumers SHALL use their existing raw provenance/header/final-review owners instead of the
HTML manifest.

#### Scenario: Legacy Stage 2 completes

- **WHEN** historical markerless image generation completes successfully
- **THEN** its JPEG contact sheet remains under `_generated/preview/`

#### Scenario: HTML final slides complete

- **WHEN** current effective HTML final slides exist for the ordered plan
- **THEN** the provider-neutral builder publishes the delivery contact sheet under `_generated/html_production/preview/`
- **AND** no whole-page Stage-2 directory or provider interface is required

#### Scenario: Forced-fallback review sheet is requested

- **WHEN** selected pages require fallback review
- **THEN** their forced-fallback objects may appear only in a review-labeled contact sheet and evidence digest
- **AND** that sheet cannot satisfy delivery readiness

#### Scenario: Delivery and visual-review sheets coexist

- **WHEN** both remain fresh after delivery-sheet publication
- **THEN** preview manifest retains separate current references for review and delivery
- **AND** each consumer resolves only its owning slot

#### Scenario: Image2-primary contact sheet remains whole-page evidence

- **WHEN** a first-class `image2-only` pilot/build publishes its ordered contact sheet
- **THEN** it remains under `_generated/preview/` and may satisfy only current whole-page review/completion owners
