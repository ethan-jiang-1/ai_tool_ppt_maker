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

#### Scenario: Historical markerless behavior remains compatible

- **WHEN** a migrated historical markerless run resolves to `image2-only`
- **THEN** its existing whole-page generator behavior and source artifacts remain valid

#### Scenario: HTML Stage 2 uses local renderer

- **WHEN** unified pipeline selects Stage 2 for either HTML mode
- **THEN** it delegates to `stage2_render_html.mjs`
- **AND** does not resolve credentials, style master, provider URL, or whole-page Image2 modules

#### Scenario: HTML receives whole-page base-url override

- **WHEN** an HTML public build/preview receives `--base-url`
- **THEN** it returns `USAGE` before renderer/provider readiness or writes

#### Scenario: Whole-page provider behavior remains compatible

- **WHEN** the whole-page generator receives sync output, async task output, or a provider failure
- **THEN** it retains the existing shared extract/poll/save or secret-safe `ImageProviderError` behavior
