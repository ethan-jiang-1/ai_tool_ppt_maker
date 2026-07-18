## MODIFIED Requirements

### Requirement: HTML-first source validation is available before HTML-first production

The three write-free validation routes from Change 2 SHALL remain: `ppt_flow validate <run-dir>`, direct Stage-1 `--validate --spec <canonical-source>`, and unified Stage-1 `--dry-run`. Their single canonical-source/no-alternate-control/legacy-alias restrictions, write-free behavior, receipt validation, and direct arbitrary-output rejection SHALL remain unchanged.

For a valid `production.pipeline: html-first-v1` run, canonical unified Stage 1 SHALL publish only the structured plan; HTML Stage 2 SHALL publish self-contained pages; HTML Stage 3 SHALL publish measured verified final slides and preview evidence; Stage 4 SHALL consume provider-neutral final slides; Stage 5 SHALL inject notes. HTML preview/build/refresh/materialization SHALL run without dotenv, credentials, style master, provider/model setup, legacy prompt files, header lock, or any remote-call adapter. The temporary `html_first_delivery_unavailable` failure SHALL no longer apply to supported HTML preview/build/refresh/structural-materialization paths. Direct legacy style-master/header approval commands SHALL remain inapplicable to HTML-first runs with a branch-specific diagnostic rather than becoming HTML prerequisites.

The markerless branch SHALL retain legacy options, style-master/readiness guards, whole-page Stage 2, Stage-3 header behavior, pilot/header review, refresh paths, and standalone artifact interfaces. Malformed markers SHALL fail before either branch's readiness or writes. Branches SHALL not consume each other's manifests, gates, generated directories, or prerequisites.

#### Scenario: Structured source validates locally

- **WHEN** a valid HTML-first source runs any explicit validation route
- **THEN** contract validation completes with zero writes and zero remote setup

#### Scenario: HTML-first canonical Stage 1 remains the sole plan writer

- **WHEN** canonical unified Stage 1 processes a valid HTML-first run
- **THEN** it atomically rebuilds only `_generated/slide_plan.json`
- **AND** direct Stage 1 still cannot publish to an arbitrary output

#### Scenario: HTML-first complete build succeeds locally

- **WHEN** content/visual gate requirements are current and the user runs build on a valid HTML-first deck
- **THEN** Stages 1-5 publish current HTML pages, final slides, contact sheet, PPTX, and notes
- **AND** no Image2 credential/style-master/provider prerequisite is resolved

#### Scenario: HTML-first stage dry-run remains write-free

- **WHEN** any supported HTML-first stage selection uses `--dry-run`
- **THEN** orchestration validates and reports the planned local work without publishing generated/state bytes

#### Scenario: Invalid or drifted stage preserves prior artifacts

- **WHEN** HTML source/control/runtime input validation or a pre-publish receipt recheck fails
- **THEN** the prior plan/page/final/delivery artifacts remain intact
- **AND** no newly created generated directory is left current

#### Scenario: Legacy style/header command targets HTML-first

- **WHEN** `style-master` or legacy header approval targets an HTML-first run
- **THEN** it fails before provider/readiness/writes with a branch-inapplicable diagnostic
- **AND** points to HTML visual preview/gate rather than removing the marker

#### Scenario: Legacy production remains unchanged

- **WHEN** a source has no HTML-first marker
- **THEN** existing legacy pilot/build/refresh behavior and prerequisites remain selected
- **AND** HTML manifests or gates cannot authorize it

## ADDED Requirements

### Requirement: HTML-first preview, gates, build, and local refresh have explicit ordering

HTML-first orchestration SHALL allow content validation and local preview before visual approval. Final PPTX publication SHALL require current pipeline-specific content and visual gate evidence, while HTML preview/final-slide composition used for review MAY run with gates pending. Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and Structural Versioning materialization SHALL compute the smallest stale set from source ownership and current manifest/fingerprint evidence. No local path SHALL create or invoke Image2 refinement.

#### Scenario: Visual gate reviews production-equivalent pixels

- **WHEN** an HTML visual gate is pending
- **THEN** orchestration may create representative pages/final slides/contact sheet through the production compositor
- **AND** blocks final PPTX publication until human approval is recorded

#### Scenario: Ordinary copy edit is local

- **WHEN** one slide's visible copy changes without global visual-system or fallback changes
- **THEN** Local Slide Rebuild recomposes that slide and downstream delivery locally
- **AND** does not stale the whole-deck visual approval

#### Scenario: Global visual config change requires representative review

- **WHEN** an HTML visual-system fingerprint changes
- **THEN** Local Deck Rebuild produces representative current previews before full delivery
- **AND** the previous HTML visual gate cannot authorize Stage 4

### Requirement: HTML and legacy production adapters remain mutually isolated

Every public run-dir entry SHALL probe the canonical marker before branch-specific readiness. The HTML adapter SHALL reject legacy prompt/render/header artifacts as authority; the legacy adapter SHALL not infer HTML from structured-looking prose or consume HTML production manifests. Provider-call spies and exact directory diffs SHALL prove that HTML create/preview/build/refresh/structural operations never touch the legacy remote path or Image2 refinement partitions.

#### Scenario: HTML deck has legacy generated files

- **WHEN** stale legacy prompt/image/header directories coexist with a marked source
- **THEN** HTML orchestration ignores them as production authority
- **AND** consumes only structured-plan and HTML-production evidence

#### Scenario: Markerless deck has HTML generated files

- **WHEN** a markerless legacy run contains stray HTML-production bytes
- **THEN** legacy orchestration does not use them to satisfy production or review gates
