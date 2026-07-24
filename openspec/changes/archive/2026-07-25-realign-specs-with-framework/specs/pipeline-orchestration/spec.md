## ADDED Requirements

### Requirement: Whole-page routing has one current protocol
Pipeline orchestration SHALL route an `image2-only` run through the explicit `whole-page-image2-v1` contract. It SHALL not expose a retired maintenance adapter or a source-to-HTML migration command.

#### Scenario: Whole-page operation is requested
- **WHEN** a current whole-page run invokes a pipeline operation
- **THEN** orchestration resolves its explicit mode and source marker
- **AND** it rejects an unavailable or inconsistent state before work begins

## MODIFIED Requirements

### Requirement: One production policy dispatches every normal adapter operation
Public orchestration SHALL consume one shared production policy for the exact run version. For each
durable mode it SHALL return the canonical source pipeline, final-page authority, refinement policy, and
style-master policy: `html-only` maps to `html-first-v1`/HTML/disabled/reserved-HTML-adapter;
`html-then-image2` maps to `html-first-v1`/HTML/required/reserved-HTML-adapter; and `image2-only` maps
to `whole-page-image2-v1`/whole-page Image2/not-applicable/current. Command routers, playbook
validation, init, and status SHALL not maintain independent mode tables.

The source parser SHALL require the direct scalar `production.pipeline` value declared by that policy.
The only supported pairs are `html-first-v1` with `html-only|html-then-image2` and
`whole-page-image2-v1` with `image2-only`. Missing, indirect, retired, malformed, unknown, or
state-inconsistent facts SHALL stop before branch-specific readiness, journal handling, or writes and
return the state owner's one bounded typed next action. No fallback chain may select an adapter from
generated artifacts, directory shape, Controller history, or whichever readiness check succeeds.

After a consistent policy is established, validate, pilot, gate, build, refresh, and status SHALL
delegate to the existing isolated adapter. For a whole-page operation, orchestration SHALL determine
whether the selected operation will actually submit provider work before transport initialization; a
submit requires current Controller-owned scoped authorization, while a proven zero-submit reuse or local
path does not.

#### Scenario: HTML-then-Image2 selects HTML composition
- **WHEN** orchestration inspects a consistent `html-then-image2` run
- **THEN** normal production delegates to HTML and reports required modern refinement as completion policy
- **AND** whole-page Image2 is not selected

#### Scenario: Image2-only selects whole-page generation
- **WHEN** orchestration inspects a consistent `image2-only` run
- **THEN** pilot, build, and refresh delegate to the whole-page adapter and preserve its gates and provenance

#### Scenario: Generated files suggest another adapter
- **WHEN** stale HTML artifacts coexist with an authoritative consistent `image2-only` run
- **THEN** orchestration ignores them as routing authority
- **AND** it does not try the HTML adapter as fallback

#### Scenario: Historical record lacks current identity
- **WHEN** a run cannot establish the explicit marker and durable mode pair
- **THEN** orchestration returns the one owner-issued typed next action before adapter selection
- **AND** it does not write an inferred mode or create a continuation

### Requirement: Pipeline runs on Node.js runtime
The production pipeline SHALL run on checked-in supported Node.js majors (`22.x`, `24.x`, or `26.x`);
`package.json`'s `>=22` expresses an engine floor and does not automatically support unlisted majors.
All production scripts SHALL be ESM (`.mjs`) runnable through `node script.mjs` without compilation. A
local HTML runtime SHALL consume the exact Playwright/Chromium/font profile owned by
`html-render-runtime`, not a caller-selected system browser. Current whole-page Image2 stages SHALL use
the public Node adapter under `04-image-production/whole-page`; no retired Phase-5 bridge is part of the
production path.

#### Scenario: Agent runs pipeline on Windows
- **WHEN** an Agent runs `node scripts/ppt_flow.mjs build <run_dir>` on supported Windows with Node.js 22 and selected-pipeline prerequisites
- **THEN** selected production stages complete successfully and produce a `.pptx` file

#### Scenario: Node 20 is below the repository baseline
- **WHEN** an Agent attempts to run the production pipeline on Node.js 20
- **THEN** the environment gate reports the unsupported runtime before production work proceeds

### Requirement: Unified pipeline supports semantic refresh paths
`unified_pipeline.mjs` SHALL verify the current production-mode/source-marker pair before resolving
semantic refresh behavior. For `html-first-v1`, it SHALL support Local Slide Rebuild, Local Deck
Rebuild, Notes-Only Refresh, and post-publication Structural Versioning materialization using local
structured-plan, HTML, composition, and delivery ownership; it SHALL not consult render mode, style
master, `--force-images`, or provider authorization. For `whole-page-image2-v1`, it SHALL support Header
Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, force semantics, and reviewed-image
reuse through the normal current adapter. Structural Versioning Path remains outside both branch-specific
refresh sets and SHALL not become a CLI enum. Unsupported historical protocols SHALL not receive any
refresh projection or inferred force/reuse behavior.

#### Scenario: HTML visible copy changes
- **WHEN** one marked slide's header or body copy changes
- **THEN** Local Slide Rebuild runs local affected composition and delivery with no provider path

#### Scenario: Current whole-page raw image must regenerate
- **WHEN** a selected `whole-page-image2-v1` image is intentionally rebuilt
- **THEN** existing `--only` scope and `--force-images` semantics apply through its current authorization boundary

#### Scenario: Historical source requests refresh
- **WHEN** the current pair cannot be established for a whole-page refresh
- **THEN** the operation stops with the one owner-issued typed next action before artifact reuse or provider setup

### Requirement: Unified pipeline orchestrates stages
`unified_pipeline.mjs` SHALL verify the canonical marker and durable mode, then delegate each stage to
the selected complete branch adapter. It SHALL support shared `--dry-run` and slide selection without
embedding stage implementations. The HTML adapter SHALL use structured Stage 1, HTML page Stage 2, local
compositor Stage 3, common final-slide Stage 4, and Stage 5 notes without loading `.env`, provider
credentials, style master, or whole-page generator/contact-sheet code. The current whole-page adapter
SHALL use its Image2 Stage 2, current contact-sheet owner, header-lock Stage 3, and relevant
`--force-images` behavior from `04-image-production/whole-page`. Dry-run SHALL describe only the
selected branch and remain write- and remote-free. A retired marker or missing mode SHALL fail before a
stage adapter is loaded.

#### Scenario: HTML dry run is credential-free
- **WHEN** a marked HTML run invokes any dry-run stage selection
- **THEN** the plan names only local HTML stages and does not load Image2 environment configuration

#### Scenario: Whole-page Stage 2 delegates in-framework
- **WHEN** a consistent `whole-page-image2-v1` run selects Stage 2
- **THEN** orchestration delegates to the current whole-page generation and contact-sheet owners

### Requirement: --preview uses preview readiness for Stage 2
When Stage 2 is selected, orchestration SHALL resolve the current mode and verify its explicit pipeline
before readiness. HTML preview SHALL require valid structure, source, catalog, and local runtime but no
whole-page style master or approved gates; it publishes review-only page/final-slide/preview evidence and
does not publish Stage 4. HTML non-preview delivery requires current authoritative HTML content/visual
evidence. `image2-only` preview SHALL require structure plus current style master without content/visual
gate approval; non-preview whole-page Stage 2 retains pipeline readiness. Preview SHALL not waive or
mutate gates, and any actual whole-page submission separately requires scoped provider authorization. A
historical protocol cannot obtain preview readiness through a fallback.

#### Scenario: HTML Stage 2 preview runs with pending gates
- **WHEN** a valid HTML-mode run selects Stage 2 with `--preview`
- **THEN** local review composition proceeds without whole-page style master or metadata approval

#### Scenario: Current whole-page preview retains readiness
- **WHEN** an `image2-only` run selects Stage 2 preview
- **THEN** it uses whole-page preview readiness and requires provider authorization only if submission is needed

#### Scenario: Unsupported record asks for a preview
- **WHEN** the source and state cannot establish a current pipeline pair
- **THEN** preview returns the bounded owner action without creating review artifacts or loading a provider adapter

### Requirement: Stage 2 regenerates only when --force-images is set
For `image2-only` with `whole-page-image2-v1`, current images SHALL be skipped unless
`--force-images` is set; `--only` remains scope, not force. A regeneration submit must remain within
current authorization. For both HTML modes, `--force-images` SHALL be rejected before writes and
currentness SHALL be decided by validated composition receipts/fingerprints and explicit slide scope;
stale or missing selected pages rebuild locally and current matching pages reuse without force. No
historical compatibility record may obtain the whole-page force path.

#### Scenario: Current whole-page pilot skips existing images by default
- **WHEN** current whole-page pilot images exist and pilot runs without `--force-images`
- **THEN** Stage 2 skips those current files

#### Scenario: HTML Stage 2 receives force-images
- **WHEN** an HTML-mode run supplies `--force-images`
- **THEN** the branch rejects the whole-page-only option before publication

#### Scenario: Image2-primary force remains scoped
- **WHEN** `image2-only` Stage 2 will regenerate selected IDs with force
- **THEN** transport begins only if those IDs, profile, and count match current authorization

### Requirement: Automatic pilot selection covers content full-page header risk
Automatic pilot selection SHALL be mode- and pipeline-specific and deterministic. For `image2-only`
with `whole-page-image2-v1`, it SHALL retain VISUAL TYPE canonicalization, content full-page sampling
counts, opener/closer coverage, deduplication, and exact explicit `--only`. For either HTML mode it
SHALL sort canonical component-recipe hashes and choose the code-unit-smallest current stable ID per key
plus stale affected pages; reorder alone does not change representatives. Every HTML representative shows
effective output plus forced fallback when current selection hides it. Explicit `--only` remains
authoritative, but incomplete scoped review remains non-approvable and reports uncovered evidence rather
than silently adding IDs. Missing or retired whole-page identity SHALL not be treated as a sampling
variant.

#### Scenario: HTML automatic preview covers new geometry
- **WHEN** a marked HTML plan introduces an uncovered family or geometry key
- **THEN** automatic preview includes a deterministic representative before visual approval

#### Scenario: Current whole-page sampling remains whole-page
- **WHEN** a current `image2-only` deck has at least two content full-page slides and default pilot runs
- **THEN** the existing two-page content-risk sampling remains

#### Scenario: Image2-primary sampling avoids HTML inference
- **WHEN** default `image2-only` pilot selects representatives
- **THEN** it uses the whole-page sampling algorithm without HTML recipe inference

### Requirement: Header review gate guides per-slide
The header-review gate SHALL be `whole-page-image2-v1`-only. It SHALL retain per-slide full-page header
fingerprints, `--only` scope, generation-profile/image-byte checks, actionable pilot commands, and
pure-full-page applicability for a current `image2-only` run. Both HTML modes SHALL reject it before
state mutation and route to HTML content/visual review; HTML title/visual changes can never be authorized
by `header-review`. A missing or retired whole-page protocol SHALL not inherit header-review evidence.

#### Scenario: Current reviewed title bytes drift
- **WHEN** a current whole-page reviewed full-page PNG no longer matches its manifest
- **THEN** header review identifies the affected ID and current force/review action

#### Scenario: HTML run invokes header gate
- **WHEN** an HTML-mode run requests whole-page header review
- **THEN** it fails with the HTML visual-review route and writes no whole-page evidence

#### Scenario: Image2-primary header gate stays first class
- **WHEN** `image2-only` has stale full-page title bytes
- **THEN** the per-slide gate returns its normal pilot/review action without a compatibility route

### Requirement: Gate output is MD-controller-friendly
Whole-page header-gate output SHALL retain its exact six-field format for current
`whole-page-image2-v1` callers. HTML content/visual planning SHALL retain its separate versioned schema
with exact pipeline/run version, evidence kind, review-plan hash, status, bounded changed IDs or
dependencies, and structured human next action. Both schemas remain bounded, deterministic, and
adapter-labeled; neither controller parses prose, accepts cross-pipeline evidence, or translates an old
whole-page record into a current response.

#### Scenario: Current header gate passes
- **WHEN** no current whole-page slide needs header review
- **THEN** it emits `{format: 2, applicable: true, ok: true, changed: [], action: null, hint: null}`

#### Scenario: HTML review plan is emitted
- **WHEN** HTML content or visual evidence is stale
- **THEN** output identifies the HTML review schema/hash and cannot be consumed as header approval

#### Scenario: Image2-primary gate keeps the stable shape
- **WHEN** first-class whole-page header review passes
- **THEN** it emits the same six-field schema rather than inventing a separate format

### Requirement: buildHeaderReviewInputs produces per-slide fingerprints
`buildHeaderReviewInputs()` SHALL remain a current whole-page Image2 helper. It computes each full-page
header fingerprint and `hasBodyHeaderLockSlides` only for a consistent `image2-only` /
`whole-page-image2-v1` run; it rejects or remains unreachable for both HTML modes. HTML review continues
to use its owning content, visual, and page-dependency fingerprints instead of extending this helper.

#### Scenario: HTML branch reaches whole-page helper
- **WHEN** HTML orchestration attempts to build whole-page header inputs
- **THEN** branch isolation fails the operation before evidence publication

#### Scenario: Image2-primary builds header inputs
- **WHEN** a consistent `image2-only` pilot or build evaluates full-page header review
- **THEN** the helper computes per-slide fingerprints under whole-page ownership

### Requirement: mergeHeaderReviewRecord stores per-slide state
`mergeHeaderReviewRecord()` SHALL remain whole-page-Image2-only for a consistent `image2-only` /
`whole-page-image2-v1` record, retaining snapshot/fingerprint/status merge plus deleted-ID cleanup. It
writes only version-scoped `header-review` evidence. HTML content/visual records use their journaled
authority and SHALL never be merged into or initialized from header-review records. An old state shape
does not authorize a migration or alias into this record.

#### Scenario: Current whole-page slide is deleted
- **WHEN** a current whole-page reviewed ID leaves the plan
- **THEN** the merge removes its per-slide header record

#### Scenario: HTML evidence is supplied to whole-page merge
- **WHEN** a caller supplies an HTML review record
- **THEN** the helper rejects it without mutating either evidence store

#### Scenario: Image2-primary merge uses existing state
- **WHEN** first-class whole-page review publishes a partial current batch
- **THEN** it merges into the same version-scoped header record without a duplicate evidence store

### Requirement: changedFullPageIds supports per-slide state
`changedFullPageIds()` SHALL remain a current whole-page Image2 helper: with per-slide state it reads
`status === changed`, and without it falls back only to the current whole-page global snapshot diff. Both
HTML modes SHALL derive affected pages from composition/content/visual dependency fingerprints and
current manifest evidence instead. The fallback SHALL not make a historical protocol eligible for a
current Controller route.

#### Scenario: Current per-slide state is absent
- **WHEN** a current whole-page pilot has no per-slide state
- **THEN** the existing snapshot fallback determines its review scope

#### Scenario: HTML local rebuild computes scope
- **WHEN** a marked HTML slide dependency changes
- **THEN** scope comes from HTML fingerprints rather than full-page header state

#### Scenario: Image2-primary computes changed full pages
- **WHEN** `image2-only` has current per-slide header state
- **THEN** the per-slide changed-status path determines its review scope

### Requirement: Structural refresh impact is computed by stable identity
After structural source publication, orchestration SHALL compare source and target by stable ID and classify retained, inserted, deleted, reordered, content, or profile changes. For HTML-first, the impact SHALL report target positions, IDs/titles, matching or stale composition input receipts, target-owned reuse eligibility, required local stages/reviews, and zero remote work. Reorder alone SHALL preserve slide-local HTML/final bytes and invalidate ordered delivery; inserted or stale IDs SHALL be locally composable, not needs_render remote debt. For whole-page-image2-v1, the impact SHALL use current raw-render verification/materialization, cheap Stage-3/delivery invalidation, verified or needs_render, and current review semantics. Located bytes without current proof are not verified. An unsupported historical source has no structural materialization route.

#### Scenario: HTML reorder is locally reusable
- **WHEN** a marked target only reorders unchanged IDs
- **THEN** impact preserves their composition bytes and schedules target-owned ordered delivery

#### Scenario: Whole-page insert retains needs-render semantics
- **WHEN** a consistent whole-page target inserts an ID without verified raw-render evidence
- **THEN** only that ID appears under needs_render
- **AND** no provider call occurs during source publication

### Requirement: Structural versions materialize only verified expensive raw renders
Materialization SHALL remain target-owned and branch-specific. whole-page-image2-v1 SHALL retain shared resolver checks for stable ID, engine, raw-render kind, generation profile/fingerprint, source-byte SHA, target copy/manifests, locally rebuilt Stage 3 and later outputs, needs_render, and verified non-waiver header evidence rules. HTML-first MAY reuse prior immutable HTML/final-slide bytes only after source-only target publication, recomputed target composition fingerprints/membership, exact path/SHA/profile/receipt verification, and copy into target-owned objects/manifests; it SHALL never copy preview, gate, PPTX, notes, or state truth across versions. Unverifiable HTML bytes SHALL recompose locally and SHALL not become remote debt. Unverified or historical raw bytes SHALL not be promoted via a compatibility marker.

#### Scenario: Whole-page located-only raw file remains unusable
- **WHEN** a raw image exists but lacks current stable-ID, profile, or provenance verification
- **THEN** materialization leaves that ID under needs_render
- **AND** it does not copy the byte into the target manifest

#### Scenario: HTML matching immutable object is reused
- **WHEN** a target HTML slide recomputes the exact source composition fingerprint and receipt proof
- **THEN** materialization copies or links the object into target-owned paths without provider work

### Requirement: Structural materialization never silently invokes remote rendering
Structural publication and target materialization SHALL be source-, receipt-, and proof-driven. Neither HTML-local composition nor whole-page verification/materialization may invoke provider rendering as an implicit fallback. A whole-page target with needs_render SHALL return selected IDs and its later authorization boundary; an HTML target with missing proof SHALL locally recompose. Dry-run remains write- and remote-free. The operation SHALL not use Image2 readiness or authorization as a substitute for materialization evidence.

#### Scenario: HTML insert composes locally after publication
- **WHEN** an HTML structural target contains an inserted or stale slide
- **THEN** its explicit materializer composes it locally after publication
- **AND** it performs no provider authorization or submission

#### Scenario: Whole-page insert does not spend quota
- **WHEN** a current whole-page target contains an unproven inserted ID
- **THEN** materialization reports needs_render without spending quota
- **AND** a later Generated Image Rebuild remains separately authorized

### Requirement: Whole-page Image2 entry points enforce their own remote prerequisites
Every image2-only / whole-page-image2-v1 orchestration path SHALL determine whether its selected operation will submit provider work before it initializes transport. A current submit requires the exact mode, explicit source marker, current style-master prerequisites where applicable, and an active Controller-owned authorization whose operation, selected IDs, profile, and count match the request. Pilot and Stage 2 preview remain gate-preserving; a proven zero-submit reuse/local path does not require credentials, base URL, provider lookup, or authorization. HTML-only stages, dry runs, structural materialization, and current generated-artifact reuse SHALL not inherit whole-page prerequisites. Missing or unsafe identity remains a hard-stop and cannot be repaired by a provider fallback.

#### Scenario: Whole-page pilot has no credentials
- **WHEN** a current pilot would submit Image2 work without resolvable provider configuration
- **THEN** orchestration stops before transport and reports the bounded environment prerequisite

#### Scenario: Whole-page Stage 2 has no style reference
- **WHEN** a current build or visual refresh is about to enter Stage 2 and its required style master is absent
- **THEN** orchestration stops before provider setup and names the style-master owner

#### Scenario: Local stages do not inherit Image2 gate
- **WHEN** a valid HTML-only local stage runs without Image2 configuration
- **THEN** it proceeds through its local prerequisites without a whole-page authorization lookup

#### Scenario: Structural materialization remains remote-free
- **WHEN** a structural target has reusable or missing whole-page raw images
- **THEN** materialization verifies or reports needs_render without transport initialization

#### Scenario: Dry run does not require or submit Image2
- **WHEN** a whole-page pipeline invocation includes Stage 2 but runs with --dry-run
- **THEN** it may report the future prerequisite/authorization boundary but does not require secrets or submit work

#### Scenario: Current generated artifacts require no transport lookup
- **WHEN** style-master or Stage 2 proves every selected output can be retained or reused under current provenance
- **THEN** missing provider credentials and base URL do not block the invocation
- **AND** no transport prerequisite resolver, authorization lookup, or provider adapter is invoked

#### Scenario: First-class Image2 submit has stale authorization
- **WHEN** an image2-only operation would submit a changed or expanded scope relative to the active decision
- **THEN** orchestration stops before transport and reports the exact scope requiring fresh authorization

### Requirement: HTML-first source validation is available before HTML-first production
The three write-free validation routes SHALL remain ppt_flow validate <run-dir>, direct Stage-1 --validate --spec <canonical-source>, and unified Stage-1 --dry-run. Their single-canonical-source, no-alternate-control, write-free, receipt-validation, and direct arbitrary-output rejection contracts remain unchanged. For a valid production.pipeline: html-first-v1 run in either HTML mode, canonical unified Stage 1 SHALL publish only the structured plan; HTML Stage 2 publishes self-contained pages; HTML Stage 3 publishes composition/final-slide evidence; and the normal current review/gate sequence governs delivery. A source marked whole-page-image2-v1 SHALL be dispatched only by the current whole-page adapter, while any absent, retired, indirect, or unknown marker is rejected before either branch uses generated artifacts as authority.

#### Scenario: Structured source validates locally
- **WHEN** a consistent HTML-mode source invokes a write-free validation route
- **THEN** validation checks its canonical structured source without provider setup or output writes

#### Scenario: HTML-first canonical Stage 1 remains the sole plan writer
- **WHEN** a valid HTML source begins normal production
- **THEN** only the HTML Stage-1 owner publishes its structured plan

#### Scenario: HTML-first complete build succeeds locally
- **WHEN** current HTML source and gate evidence are valid
- **THEN** the HTML adapter proceeds without whole-page credentials or a whole-page style master

#### Scenario: HTML-first stage dry-run remains write-free
- **WHEN** a valid HTML source selects unified Stage 1 with --dry-run
- **THEN** it produces no plan, state, generated artifact, or provider write

#### Scenario: Whole-page source is not validated as HTML
- **WHEN** a consistent whole-page-image2-v1 source reaches an HTML-only validation or style command
- **THEN** the command rejects the branch before writing HTML evidence

### Requirement: HTML review plans are immutable current artifacts
Content and visual review planning SHALL serialize immutable canonical JSON under the canonical scope-owned html_production/preview/plans/<plan-hash>.json and publish current references only through the atomic preview manifest. The plan hash SHALL cover canonical bytes excluding its own hash field. Every plan SHALL bind exact schema pptmaker-html-review-plan-v1, publication_scope canonical-run, the current html_production_reset_id, pipeline, normalized logical run version, kind content|visual, approvable, current fingerprints/outstanding evidence, exact input receipts, and referenced confined artifact paths/SHAs. Content plans SHALL include the complete ordered human-reviewed projection. Visual plans SHALL include system coverage, page visual dependencies, and shown effective/forced-fallback preview references. Scoped plans missing outstanding evidence SHALL set approvable false and list it; they cannot publish approval but remain eligible for an explicit waiver after the current source/reset/version projection is verified. Ordinary approval SHALL resolve only a same-reset canonical plan referenced by the current preview manifest. Transition candidates and retired scratch contexts SHALL not publish an HTML review plan or satisfy target gates.

The schema-closed preview/manifest.json SHALL contain exact schema pptmaker-html-preview-manifest-v1, publication_scope canonical-run, current html_production_reset_id, pipeline/logical run version, plus independent nullable current references review_plans.content, review_plans.visual, contact_sheets.visual_review, and contact_sheets.delivery. Each non-null reference SHALL bind confined path, SHA-256, owning plan/review/delivery digest, and applicable composition variants of the same reset epoch. One atomic owner commit SHALL revalidate and preserve unaffected current references, clear stale/deleted/incompatible or cross-reset carried references, and update only intended slots. Approval SHALL use only the matching canonical/current-reset review_plans.<gate> slot; final delivery review SHALL use only canonical/current-reset contact_sheets.delivery.

#### Scenario: Content plan survives process exit
- **WHEN** content review planning completes
- **THEN** the exact shown projection and plan hash are recoverable from current confined files

#### Scenario: Referenced preview changes
- **WHEN** a visual plan's referenced image bytes no longer match
- **THEN** approval fails stale and publishes no gate evidence

#### Scenario: Old plan remains as immutable storage
- **WHEN** a newer preview manifest replaces the current plan reference
- **THEN** the old plan cannot be approved even if its object file remains

#### Scenario: Transition candidate cannot publish a canonical review plan
- **WHEN** a production-mode transition candidate is inspected before target handoff
- **THEN** it cannot publish a canonical HTML review plan or satisfy target-version gate evidence

#### Scenario: Content and visual plans coexist
- **WHEN** a current content plan is followed by visual-plan publication with unchanged content inputs
- **THEN** one preview manifest retains both independently verified current plan references

#### Scenario: Delivery sheet update preserves current review refs
- **WHEN** delivery contact sheet publishes and current review plan inputs remain fresh
- **THEN** only contact_sheets.delivery changes and current plan slots remain valid

#### Scenario: Carried visual plan becomes stale during content update
- **WHEN** content-plan publication discovers the carried visual plan no longer verifies
- **THEN** the same manifest commit clears the visual slot rather than preserving false current evidence

### Requirement: HTML and whole-page Image2 production adapters remain mutually isolated
Every public run-dir entry SHALL inspect canonical version-scoped production mode and verify its explicit source marker before branch-specific readiness. The HTML adapter SHALL reject whole-page prompt, render, and header artifacts as authority; the whole-page Image2 adapter SHALL not infer HTML from structured-looking prose or consume HTML production manifests. Provider-call spies and exact directory diffs SHALL prove that HTML create, preview, build, refresh, and structural operations never touch whole-page Image2 or modern-refinement remote paths, and that image2-only operations never consume HTML output. Calling the whole-page adapter from a first-class Image2 Controller SHALL not weaken this isolation or turn modern visual-slot refinement into a whole-page renderer.

#### Scenario: HTML deck has stray whole-page generated files
- **WHEN** stale whole-page prompt, image, or header directories coexist with a consistent HTML-mode source
- **THEN** HTML orchestration ignores them as production authority
- **AND** consumes only structured-plan and HTML-production evidence

#### Scenario: Explicit whole-page deck has HTML generated files
- **WHEN** a consistent image2-only run contains stray HTML-production bytes
- **THEN** whole-page orchestration does not use them to satisfy production or review gates

#### Scenario: First-class Image2 path reuses the isolated adapter
- **WHEN** create-deck dispatches a new image2-only run
- **THEN** it invokes the current whole-page stages through the shared policy
- **AND** it does not label the workflow as HTML refinement or a maintenance compatibility path

## REMOVED Requirements

### Requirement: Migration preparation resolves one isolated candidate before comparison
**Reason**: The historical HTML-migration candidate and comparison route are removed.

**Migration**: The state-owned production-mode transition owns its current candidate, preview, confirmation, and apply sequence.

### Requirement: Legacy-to-HTML migration comparison is complete and zero-remote
**Reason**: Old-side migration comparison modes and compatibility evidence are not part of the supported framework.

**Migration**: A current transition remains offline through preview/apply and hands the target to its normal production/review path.
