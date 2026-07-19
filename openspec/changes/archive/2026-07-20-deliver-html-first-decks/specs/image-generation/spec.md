## MODIFIED Requirements

### Requirement: Stage 2 is implemented inside the framework

Image2 generation SHALL remain an in-framework Node ESM capability under `PPTMAKER_FRAMEWORK/scripts/`, with `resolveVendors`, `stage2_generate_images.mjs`, `image_api_client.mjs`, and its existing submit/poll/download/error contract. It SHALL be the Stage-2 implementation only for the markerless legacy branch. Unified/public orchestration SHALL probe the canonical production marker before stage dispatch, option validation, credential/style-reference resolution, or writes: markerless Stage 2 delegates to the Image2 generator, while `html-first-v1` Stage 2 delegates to `stage2_render_html.mjs` and SHALL not import or initialize the Image2 adapter.

Direct legacy Image2 invocation and markerless public routes SHALL retain `IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, and direct legacy `--base-url` semantics. HTML public/direct renderer routes SHALL reject provider/base-url/model/style-reference options before readiness or writes. Missing credentials and provider failures SHALL retain the existing secret-safe Image2 diagnostics only when the legacy generator is actually selected.

#### Scenario: Markerless Stage 2 uses Image2

- **WHEN** unified pipeline selects Stage 2 for a markerless legacy run
- **THEN** it delegates to `stage2_generate_images.mjs` with existing Image2 resolution

#### Scenario: HTML Stage 2 uses local renderer

- **WHEN** unified pipeline selects Stage 2 for an `html-first-v1` run
- **THEN** it delegates to `stage2_render_html.mjs`
- **AND** does not resolve credentials, style master, provider URL, or Image2 modules

#### Scenario: HTML receives legacy base-url override

- **WHEN** an HTML public build/preview receives `--base-url`
- **THEN** it returns `USAGE` before renderer/provider readiness or writes

#### Scenario: Legacy provider behavior remains compatible

- **WHEN** the markerless generator receives sync output, async task output, or a provider failure
- **THEN** it retains the existing shared extract/poll/save or secret-safe `ImageProviderError` behavior

### Requirement: Contact sheet is in-framework

Contact-sheet production SHALL remain in-framework using `make_contact_sheet.mjs` and `@napi-rs/canvas`, never an external skill. For HTML-first final-slide delivery/review, orchestration SHALL pass plan-ordered common verified final-slide entries to a provider-neutral builder that does not understand a private render engine/manifest. For markerless legacy Stage 2, the existing raw-image contact-sheet interface and timing SHALL remain unchanged; it SHALL not be reclassified as provider-neutral final-slide evidence.

For markerless legacy Stage 2, the existing contact sheet SHALL remain under `_generated/preview/` with its existing raw provenance. For canonical `html-first-v1`, production/review contact-sheet objects and current manifest SHALL be under `_generated/html_production/preview/`; migration comparison sheets SHALL remain under the projected-run scratch owner. HTML production SHALL not write the legacy preview path as authority. Each HTML sheet entry/receipt SHALL bind exact `publication_scope`, nullable `html_production_reset_id` (current for canonical, null for migration preview), ordered IDs, final-slide fingerprints/SHAs, composition variants, dimensions/profile, and delivery or review digest. The rendered contact-sheet image bytes SHALL exclude publication scope, reset ID, and physical workspace path so migration preview and hidden canonical rerender can have the same SHA. Only canonical current-reset effective variants may enter an authoritative delivery contact sheet; forced-fallback variants are permitted only in explicitly labeled review evidence, and migration-preview sheets may satisfy only their hash-bound comparison transaction.

HTML contact-sheet publication SHALL update only `pptmaker-html-preview-manifest-v1` slot `contact_sheets.visual_review` or `contact_sheets.delivery` as applicable, through the same-scope/reset preview owner's atomic merge/revalidation. It SHALL not overwrite `review_plans.content|visual`, and it SHALL clear any carried slot whose referenced bytes/inputs/scope/reset ID no longer verify. Consumers SHALL not infer currentness from an object file, the other contact-sheet slot, a pre-reset slot, or a migration-preview manifest.

#### Scenario: Legacy Stage 2 completes

- **WHEN** markerless legacy image generation completes successfully
- **THEN** its JPEG contact sheet remains under `_generated/preview/`

#### Scenario: HTML final slides complete

- **WHEN** current effective HTML final slides exist for the ordered plan
- **THEN** the provider-neutral builder publishes the delivery contact sheet under `_generated/html_production/preview/`
- **AND** no legacy Stage-2 directory or provider interface is required

#### Scenario: Forced-fallback review sheet is requested

- **WHEN** selected pages require fallback review
- **THEN** their forced-fallback objects may appear only in a review-labeled contact sheet and evidence digest
- **AND** that sheet cannot satisfy delivery readiness

#### Scenario: Delivery and visual-review sheets coexist

- **WHEN** both remain fresh after delivery-sheet publication
- **THEN** preview manifest retains separate current references for review and delivery
- **AND** each consumer resolves only its owning slot
