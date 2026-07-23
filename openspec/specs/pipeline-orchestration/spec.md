## Purpose

Define marker-first orchestration through `scripts/03-html-production/unified_pipeline.mjs` on the checked-in supported Node runtime. It delegates HTML delivery to Phase 3 and whole-page Image Production to the public Phase-4 adapter, while Phase 5 retains markerless compatibility routing and targeted iteration paths.
## Requirements
### Requirement: One production policy dispatches every normal adapter operation

Public orchestration SHALL consume one shared production policy resolved from the exact run version.
For each mode it SHALL return the canonical pipeline, final page authority, refinement policy, and
style-master policy: `html-only` maps to `html-first-v1`/HTML/disabled/reserved-HTML-adapter;
`html-then-image2` maps to `html-first-v1`/HTML/required/reserved-HTML-adapter; and `image2-only` maps to
`legacy-image2-first`/whole-page Image2/not-applicable/current. Command routers, playbook validation,
init, and status SHALL not maintain independent mode tables.

`legacy-image2-first` in the policy is the normalized name for the canonical markerless branch; the
evaluator SHALL NOT require or write that value as source frontmatter. `html-only`'s disabled refinement
policy forbids new modern `image2 *` lifecycle operations while retaining previously attributable
refinement/source work for a later switch back to `html-then-image2`.

The evaluator SHALL validate state mode before source marker and shall stop at the first failed
authority/identity prerequisite. After a consistent policy is established, validate, pilot, gate,
build, refresh, and status SHALL delegate to the existing isolated adapter; no fallback chain SHALL
select an adapter from generated artifacts or from whichever readiness check succeeds.
For a first-class whole-page flow, orchestration SHALL determine whether the selected operation will
actually submit provider work before transport initialization; a submit requires the current
Controller-owned scoped authorization, while a proven zero-submit reuse/local path does not.

#### Scenario: HTML-then-Image2 selects HTML composition

- **WHEN** orchestration inspects a consistent `html-then-image2` run
- **THEN** normal production delegates to HTML and reports required modern refinement as completion policy
- **AND** whole-page Image2 is not selected

#### Scenario: Image2-only selects whole-page generation

- **WHEN** orchestration inspects a consistent `image2-only` run
- **THEN** pilot/build/refresh delegate to the whole-page adapter and preserve its gates/provenance

#### Scenario: Generated files suggest another adapter

- **WHEN** stale HTML artifacts coexist with an authoritative consistent `image2-only` run
- **THEN** orchestration ignores them as routing authority
- **AND** it does not try the HTML adapter as fallback

### Requirement: Pipeline runs on Node.js runtime

整个生产管线 SHALL 在 checked-in runtime profile 支持的 Node.js major (`22.x`、`24.x` 或 `26.x`) 上执行；`package.json` 的 `>=22` 只表达 engine floor，不自动支持 23/25 等未列出的 major. 所有脚本 SHALL 以 ESM (`.mjs`) 编写, `node script.mjs` 直接运行, 无需编译. 需要本地 HTML runtime 的调用 SHALL 消费 `html-render-runtime` 拥有的 exact Playwright/Chromium/font profile，而不得自行选择 system browser；legacy Image2 stages SHALL 继续使用其现有 Node adapter.

#### Scenario: Agent runs pipeline on Windows

- **WHEN** Agent runs `node scripts/ppt_flow.mjs build <run_dir>` on supported Windows with Node.js 22 and the selected pipeline's prerequisites
- **THEN** all selected production stages complete successfully, producing a `.pptx` file

#### Scenario: Node 20 is below the repository baseline

- **WHEN** Agent attempts to run the production pipeline on Node.js 20
- **THEN** the environment gate reports the unsupported runtime before production work proceeds

### Requirement: Unified pipeline supports semantic refresh paths

`unified_pipeline.mjs` SHALL classify the canonical production marker before resolving semantic refresh behavior. For `html-first-v1`, it SHALL support Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and the post-publication materialization portion of Structural Versioning using local structured plan/HTML/composition/delivery ownership; it SHALL not consult render mode, style master, `--force-images`, or provider authorization. For markerless legacy, Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, force semantics, reviewed-image reuse, and former Chain aliases SHALL remain compatible. Structural Versioning Path remains outer to both branch-specific refresh sets and SHALL not become a CLI enum.

#### Scenario: HTML visible copy changes

- **WHEN** one marked slide's header/body copy changes
- **THEN** Local Slide Rebuild runs local affected composition/delivery and no provider path

#### Scenario: Legacy raw image must regenerate

- **WHEN** a markerless selected image is intentionally rebuilt
- **THEN** existing `--only` scope plus `--force-images` semantics remain

### Requirement: Unified pipeline orchestrates stages

`unified_pipeline.mjs` SHALL probe the canonical marker and delegate each stage to the selected complete branch adapter. It SHALL support shared `--dry-run` and slide selection without embedding stage implementations. The HTML adapter SHALL use structured Stage 1, HTML page Stage 2, local compositor Stage 3, common final-slide Stage 4, and Stage 5 notes without loading `.env`, provider credentials, style master, or legacy generator/contact-sheet code. The markerless adapter SHALL retain `.env`/Image2 Stage 2, legacy contact sheet, header-lock Stage 3, and existing relevant `--force-images` behavior. Dry-run SHALL describe only the selected branch and remain write/remote-free.

#### Scenario: HTML dry run is credential-free

- **WHEN** a marked run invokes any dry-run stage selection
- **THEN** the plan names only local HTML stages and does not load Image2 environment configuration

#### Scenario: Legacy Stage 2 delegates in-framework

- **WHEN** a markerless run selects Stage 2
- **THEN** orchestration retains `stage2_generate_images.mjs` plus legacy `make_contact_sheet.mjs` ownership

### Requirement: Refinement recomposes through public local HTML operations

Refinement SHALL call a public Phase-3 review-only composition operation to create candidate comparisons in resolved slot geometry; only after successful accept or explicit fallback decision may it call public local recomposition/evidence operations for affected slides. Promotion SHALL not claim a current delivery until ordinary final-review evidence is renewed. Normal Stage orchestration SHALL remain provider-free and shall not discover or execute pending refinement attempts.

#### Scenario: Accepted candidate is promoted

- **WHEN** acceptance commits a current source asset
- **THEN** final-slide delivery is locally recomposed without a provider call

### Requirement: Shared slide-id resolution for --only

`unified_pipeline.mjs` SHALL resolve every `--only` token through the shared selector contract owned by `slide-identity-and-ordering`, also used by `ppt_flow`: exact current formal ID, spoken key, explicit 1-based position, unique case-insensitive title fragment, then supported legacy-prefix fallback. It SHALL resolve all tokens against one current `slide_plan.json` snapshot and preserve per-token bindings with `matched_by`; after that, this caller MAY deduplicate repeated formal IDs for stage execution. Ambiguous or unknown tokens SHALL fail and list bounded available `position + slide_id + title` tuples; approximate matches SHALL NOT be selected automatically.

#### Scenario: Spoken mnemonic resolves

- **WHEN** `--only "UX gap"` is passed and the plan contains formal ID `UXGap`
- **THEN** Stage 2 processes `UXGap` only

#### Scenario: Prefix s03 resolves

- **WHEN** `--only s03` is passed, no higher-precedence selector matches, and exactly one legacy plan ID starts with `s03`
- **THEN** Stage 2 processes that formal legacy ID only

#### Scenario: Page number resolves

- **WHEN** `--only 3` is passed and the plan has at least three slides
- **THEN** Stage 2 targets the third slide's formal ID

#### Scenario: Ambiguous selector fails closed

- **WHEN** a title fragment or supported legacy prefix matches more than one plan entry
- **THEN** resolution fails with the matching position, formal ID, and title tuples
- **AND** no pipeline stage runs for an inferred selection

### Requirement: --preview uses preview readiness for Stage 2

When Stage 2 is selected, orchestration SHALL resolve mode and verify pipeline before readiness. HTML
preview SHALL require valid structure/source/catalog/local runtime but no whole-page style master or
approved gates, publish review-only page/final-slide/preview evidence, and not publish Stage 4. HTML
non-preview delivery requires current authoritative HTML content/visual evidence. First-class
`image2-only` and historical markerless preview SHALL retain structure plus style master without
content/visual gate approval; non-preview whole-page Stage 2 retains pipeline readiness. Preview SHALL
not waive or mutate either adapter's gates, and any actual first-class submit separately requires scoped
provider authorization.

#### Scenario: HTML Stage 2 preview runs with pending gates

- **WHEN** a valid HTML-mode run selects Stage 2 with `--preview`
- **THEN** local review composition proceeds without whole-page style master or metadata approval

#### Scenario: Legacy preview remains compatible

- **WHEN** a historical markerless run has style master and pending metadata gates
- **THEN** Stage 2 with `--preview` may proceed while non-preview remains blocked

#### Scenario: Image2-primary preview retains whole-page readiness

- **WHEN** `image2-only` selects Stage 2 preview
- **THEN** it uses whole-page preview readiness and requires provider authorization only if submission is needed

### Requirement: Stage 2 regenerates only when --force-images is set

For first-class `image2-only` and historical markerless compatibility, existing images SHALL be skipped
unless `--force-images` is set; `--only` remains scope, not force. A first-class regeneration submit
must remain within current authorization. For both HTML modes, `--force-images` SHALL be rejected before
writes and currentness SHALL be decided by validated composition receipts/fingerprints and explicit
slide scope; stale/missing selected pages rebuild locally and current matching pages reuse without force.

#### Scenario: Legacy only without force skips

- **WHEN** historical markerless Stage 2 receives `--only` for an existing current image without force
- **THEN** it skips provider generation

#### Scenario: HTML Stage 2 receives force-images

- **WHEN** an HTML-mode run supplies `--force-images`
- **THEN** the branch rejects the whole-page-only option before publication

#### Scenario: Image2-primary force remains scoped

- **WHEN** `image2-only` Stage 2 will regenerate selected IDs with force
- **THEN** transport begins only if those IDs/profile/count match current authorization

### Requirement: Automatic pilot selection covers content full-page header risk

Automatic pilot selection SHALL be mode/pipeline-specific and deterministic. For first-class
`image2-only` and historical markerless compatibility it SHALL retain VISUAL TYPE canonicalization,
content full-page sampling counts, opener/closer coverage, deduplication, and exact explicit `--only`.
For either HTML mode it SHALL sort canonical component-recipe hashes and choose the code-unit-smallest
current stable ID per key plus stale affected pages; reorder alone does not change representatives.
Every HTML representative shows effective output plus forced fallback when current selection hides it.
Explicit `--only` remains authoritative, but incomplete scoped review remains non-approvable and reports
uncovered evidence rather than silently adding IDs.

#### Scenario: HTML automatic preview covers new geometry

- **WHEN** a marked HTML plan introduces an uncovered family/geometry key
- **THEN** automatic preview includes a deterministic representative before visual approval

#### Scenario: Legacy content full-page sampling remains

- **WHEN** a historical markerless deck has at least two content full-page slides and default pilot runs
- **THEN** existing two-page content-risk sampling remains

#### Scenario: Image2-primary sampling remains whole-page

- **WHEN** default `image2-only` pilot selects representatives
- **THEN** it uses the existing whole-page sampling algorithm without HTML recipe inference

### Requirement: Header review gate guides per-slide

The header-review gate SHALL be whole-page-Image2-only and applies to first-class `image2-only` plus
historical markerless compatibility. It SHALL retain per-slide full-page header fingerprints, `--only`
scope, generation-profile/image-byte checks, actionable pilot commands, and pure-full-page applicability.
Both HTML modes SHALL reject it before state mutation and route to HTML content/visual review; HTML
title/visual changes can never be authorized by `header-review`.

#### Scenario: Legacy reviewed title bytes drift

- **WHEN** a historical markerless reviewed full-page PNG no longer matches its manifest
- **THEN** header review identifies the affected ID and existing force/review action

#### Scenario: HTML run invokes header gate

- **WHEN** an HTML-mode run requests whole-page header review
- **THEN** it fails with the HTML visual-review route and writes no whole-page evidence

#### Scenario: Image2-primary header gate stays first class

- **WHEN** `image2-only` has stale full-page title bytes
- **THEN** the same per-slide gate returns its normal pilot/review action without compatibility routing

### Requirement: Gate output is MD-controller-friendly

Whole-page header-gate output SHALL retain the exact six-field format and compatibility for old callers,
whether owned by first-class `image2-only` or historical maintenance. HTML content/visual planning SHALL
retain its separate versioned schema with exact pipeline/run version, evidence kind, review-plan hash,
status, bounded changed IDs/dependencies, and structured human next action. Both schemas remain bounded,
deterministic, and adapter-labeled; neither controller parses prose or accepts cross-pipeline evidence.

#### Scenario: Legacy header gate passes

- **WHEN** no historical markerless slide needs header review
- **THEN** the existing `{format: 2, applicable: true, ok: true, changed: [], action: null, hint: null}` remains valid

#### Scenario: HTML review plan is emitted

- **WHEN** HTML content or visual evidence is stale
- **THEN** output identifies the HTML review schema/hash and cannot be consumed as header approval

#### Scenario: Image2-primary gate keeps the stable shape

- **WHEN** first-class whole-page header review passes
- **THEN** it emits the same six-field schema rather than inventing a new first-class format

### Requirement: buildHeaderReviewInputs produces per-slide fingerprints

`buildHeaderReviewInputs()` SHALL remain a whole-page Image2 helper for first-class `image2-only` and
historical compatibility. It computes each full-page header fingerprint and
`hasBodyHeaderLockSlides`; it rejects or remains unreachable for both HTML modes. HTML review continues
to use its three owning content/visual/page dependency fingerprints instead of extending this helper.

#### Scenario: HTML branch reaches legacy helper

- **WHEN** HTML orchestration attempts to build whole-page header inputs
- **THEN** branch isolation fails the operation before evidence publication

#### Scenario: Image2-primary builds header inputs

- **WHEN** a consistent `image2-only` pilot/build evaluates full-page header review
- **THEN** the existing helper computes per-slide fingerprints under whole-page ownership

### Requirement: mergeHeaderReviewRecord stores per-slide state

`mergeHeaderReviewRecord()` SHALL remain whole-page-Image2-only for first-class `image2-only` and
historical compatibility, retaining snapshot/fingerprint/status merge plus deleted-ID cleanup. It writes
only version-scoped `header-review` evidence. HTML content/visual records use their journaled authority
and SHALL never be merged into or initialized from header-review records.

#### Scenario: Legacy slide is deleted

- **WHEN** a historical markerless reviewed ID leaves the plan
- **THEN** the whole-page merge removes its per-slide header record as before

#### Scenario: HTML evidence is supplied to legacy merge

- **WHEN** a caller supplies an HTML review record
- **THEN** the helper rejects it without mutating either evidence store

#### Scenario: Image2-primary merge uses existing state

- **WHEN** first-class whole-page review publishes a partial current batch
- **THEN** it merges into the same version-scoped header record without a duplicate evidence store

### Requirement: changedFullPageIds supports per-slide state

`changedFullPageIds()` SHALL remain a whole-page Image2 helper: with per-slide state it reads
`status === changed`, and without it falls back to the existing global snapshot diff. Both HTML modes
SHALL derive affected pages from composition/content/visual dependency fingerprints and current
manifest evidence instead.

#### Scenario: Legacy state is absent

- **WHEN** historical markerless pilot has no per-slide state
- **THEN** the existing snapshot fallback remains available

#### Scenario: HTML local rebuild computes scope

- **WHEN** a marked HTML slide dependency changes
- **THEN** scope comes from HTML fingerprints rather than full-page header state

#### Scenario: Image2-primary computes changed full pages

- **WHEN** `image2-only` has current per-slide header state
- **THEN** the existing per-slide changed-status path determines its review scope

### Requirement: Structural refresh impact is computed by stable identity

After structural source publication, orchestration SHALL compare source/target by stable ID and classify retained/inserted/deleted/reordered/content-or-profile changes. For HTML-first, the impact SHALL report target current positions, IDs/titles, matching or stale composition input receipts, target-owned reuse eligibility, required local stages/reviews, and zero remote work. Reorder alone SHALL preserve slide-local HTML/final bytes and invalidate ordered delivery; inserted/stale IDs SHALL be locally composable, not `needs_render` remote debt. For markerless legacy, existing raw-render verification/materialization, cheap Stage-3/delivery invalidation, `verified|legacy-located`, `needs_render`, and review semantics SHALL remain.

#### Scenario: HTML reorder is locally reusable

- **WHEN** a marked target only reorders unchanged IDs
- **THEN** impact preserves their composition bytes and schedules target-owned ordered delivery

#### Scenario: Legacy insert retains needs-render semantics

- **WHEN** a markerless target inserts an ID without verified raw render
- **THEN** only that ID appears under legacy `needs_render`

### Requirement: Structural versions materialize only verified expensive raw renders

Materialization SHALL remain target-owned and branch-specific. Markerless legacy SHALL retain shared resolver checks for stable ID, engine, raw-render kind, generation profile/fingerprint, source-byte SHA, exclusion of `legacy-located`, target copy/manifests, locally rebuilt Stage 3+, `needs_render`, and verified non-waiver header evidence rules. HTML-first MAY reuse prior immutable HTML/final-slide bytes only after source-only target publication, recomputed target composition fingerprints/membership, exact path/SHA/profile/receipt verification, and copy into target-owned objects/manifests; it SHALL never copy preview/gate/PPTX/notes truth or point across versions. Unverifiable HTML bytes SHALL recompose locally and SHALL not become remote debt.

#### Scenario: HTML retained object verifies

- **WHEN** a retained marked slide's target fingerprint and prior immutable receipt match
- **THEN** bytes become target-owned and ordered outputs rebuild locally

#### Scenario: Legacy located-only raw file remains unusable

- **WHEN** a markerless adapter cannot prove raw-render fingerprint/bytes
- **THEN** it remains `needs_render` and is not materialized

### Requirement: Structural materialization never silently invokes remote rendering

Structural source apply and impact analysis SHALL invoke no renderer. Subsequent explicit materialization SHALL never invoke a remote renderer. HTML-first materialization MAY reuse verified target-owned bytes or run the local HTML renderer/compositor for missing/stale IDs, then rebuild local delivery. Markerless materialization SHALL retain verified raw reuse and report missing/stale IDs as `needs_render`; only a separately authorized Generated Image Rebuild may call Image2. Reorder/delete-only work with verifiable inputs SHALL complete target-local delivery with zero remote calls in both branches.

#### Scenario: HTML insert composes locally after publication

- **WHEN** a marked target adds one valid slide and explicit materialization runs
- **THEN** only required local HTML composition plus ordered delivery runs with zero remote calls

#### Scenario: Legacy insert does not spend quota

- **WHEN** a markerless target lacks one raw render
- **THEN** materialization reports that ID and waits for explicit remote rebuild authorization

### Requirement: Order-dependent views display position and stable identity

Pipeline status, selector diagnostics, pilot/contact-sheet labels, and structural impact output SHALL present each current page as `position + formal slide_id + title` when those fields are available. Position SHALL be treated as the current snapshot projection and formal ID as the cross-version reference.

#### Scenario: Contact sheet remains easy to discuss

- **WHEN** a contact sheet is rebuilt after reordering
- **THEN** each label shows the page's new position and unchanged formal ID
- **AND** the image artifact remains associated by ID rather than label text

### Requirement: Whole-page Image2 entry points enforce their own remote prerequisites

Every first-class `image2-only` or historical compatibility orchestration path SHALL first determine
whether selected work can reuse current verified artifacts. Only a path that is about to submit Image2
work SHALL validate action-specific prerequisites, immediately before entering its remote adapter.
Every remote submit SHALL require resolvable Image2 credentials and base URL. Whole-page generation
through pilot, build, or visual rebuild SHALL additionally require its current style-reference asset.
Style-master generation SHALL require transport prerequisites but SHALL NOT require a pre-existing
style master. The guard SHALL use existing credential, run-bundle, and style-reference authorities and
SHALL NOT rely on a prior doctor result. A missing prerequisite SHALL fail before provider submit with
the existing secret-safe CLI diagnostic authority.

A first-class `image2-only` submit SHALL also require the active Controller node's current scoped typed
authorization for the exact run, operation, stable IDs/roles, generation profile, and maximum
submissions; orchestration SHALL rederive and compare that scope before transport. Historical
compatibility SHALL retain its already-accepted authorization contract. Local-only Stage subsets, dry
runs, Structural Versioning materialization from verified artifacts, notes-only refresh, assembly that
reuses already reviewed images, a no-op style-master invocation retaining its existing output, and
Stage 2 when every selected image has current provenance SHALL NOT acquire transport prerequisites or
provider authorization and SHALL NOT make a remote request merely because a doctor profile omitted
Image2 checks.

#### Scenario: Legacy pilot has no credentials

- **WHEN** a historical compatibility pilot reaches its Image2 generation boundary without resolvable `IMAGE2_API_KEY` or `IMAGE2_BASE_URL`
- **THEN** it fails before the provider adapter is called
- **AND** the diagnostic points to explicit Image2 readiness/remediation without exposing secret values

#### Scenario: Legacy Stage 2 has no style reference

- **WHEN** a historical compatibility build or visual refresh is about to enter Stage 2 and its required style master is absent
- **THEN** orchestration fails before any Image2 submit
- **AND** it identifies the style-reference prerequisite through existing run-bundle paths

#### Scenario: Style-master generation has no style master yet

- **WHEN** whole-page style-master generation has valid Image2 transport prerequisites but no existing style master
- **THEN** the action may enter its remote adapter after any required current scoped authorization
- **AND** does not impose the page-generation style-reference guard on itself

#### Scenario: Local stages do not inherit Image2 gate

- **WHEN** an invocation runs only Stages 1, 3, 4, or 5 from valid local/reviewed inputs
- **THEN** missing Image2 credentials do not block the invocation
- **AND** no provider submit occurs

#### Scenario: Structural materialization remains remote-free

- **WHEN** a structural version reuses verified expensive raw renders under the existing materialization contract
- **THEN** it does not run an Image2 readiness or authorization guard as a substitute for materialization evidence
- **AND** it never silently invokes remote rendering

#### Scenario: Dry run does not require or submit Image2

- **WHEN** a whole-page pipeline invocation includes Stage 2 but is executed with `--dry-run`
- **THEN** it may report the future prerequisite/authorization boundary but does not require secret values, launch a provider adapter, or submit remote work

#### Scenario: Current generated artifacts require no transport lookup

- **WHEN** style-master or Stage 2 determines that every selected output can be retained or reused under current provenance without generation
- **THEN** missing Image2 credentials and base URL do not block the invocation
- **AND** no transport prerequisite resolver, provider-authorization lookup, or provider adapter is invoked

#### Scenario: First-class Image2 submit has stale authorization

- **WHEN** an `image2-only` operation would submit a changed or expanded scope relative to the active node's typed decision
- **THEN** orchestration fails before transport and reports the exact scope requiring fresh authorization

### Requirement: HTML-first source validation is available before HTML-first production

The three write-free validation routes SHALL remain: `ppt_flow validate <run-dir>`, direct Stage-1
`--validate --spec <canonical-source>`, and unified Stage-1 `--dry-run`. Their single canonical-source,
no-alternate-control/legacy-alias, write-free, receipt-validation, and direct arbitrary-output rejection
contracts remain unchanged.

For a valid `production.pipeline: html-first-v1` run in either HTML mode, canonical unified Stage 1 SHALL
publish only the structured plan; HTML Stage 2 publishes self-contained pages; HTML Stage 3 publishes
measured verified final slides and preview evidence; Stage 4 consumes provider-neutral final slides;
and Stage 5 injects notes. HTML preview/build/refresh/materialization SHALL run without dotenv,
credentials, whole-page style master, provider/model setup, whole-page prompt files, header lock, or a
remote adapter. Direct whole-page style-master/header approval commands remain inapplicable to HTML
with branch-specific guidance rather than becoming prerequisites.

For first-class `image2-only` and historical markerless compatibility, the markerless branch SHALL
retain its whole-page options, style-master/readiness guards, Stage 2, Stage-3 header behavior,
pilot/header review, refresh paths, and standalone artifact interfaces. The first-class route adds only
mode/controller authorization and final-review ownership around those interfaces. Malformed markers or
mode/source drift SHALL fail before either adapter's readiness or writes. Adapters SHALL not consume one
another's manifests, gates, generated directories, or prerequisites.

#### Scenario: Structured source validates locally

- **WHEN** a valid HTML-first source runs any explicit validation route
- **THEN** contract validation completes with zero writes and zero remote setup

#### Scenario: HTML-first canonical Stage 1 remains the sole plan writer

- **WHEN** canonical unified Stage 1 processes a valid HTML-mode run
- **THEN** it atomically rebuilds only `_generated/slide_plan.json`
- **AND** direct Stage 1 still cannot publish to an arbitrary output

#### Scenario: HTML-first complete build succeeds locally

- **WHEN** content/visual gate requirements are current and the user runs build on a valid HTML-mode deck
- **THEN** Stages 1-5 publish current HTML pages, final slides, contact sheet, PPTX, and notes
- **AND** no Image2 credential/whole-page-style-master/provider prerequisite is resolved

#### Scenario: HTML-first stage dry-run remains write-free

- **WHEN** any supported HTML-first stage selection uses `--dry-run`
- **THEN** orchestration validates and reports planned local work without publishing generated/state bytes

#### Scenario: Invalid or drifted stage preserves prior artifacts

- **WHEN** HTML source/control/runtime input validation or a pre-publish receipt recheck fails
- **THEN** the prior plan/page/final/delivery artifacts remain intact
- **AND** no newly created generated directory is left current

#### Scenario: Legacy style/header command targets HTML-first

- **WHEN** whole-page `style-master` or header approval targets an HTML-mode run
- **THEN** it fails before provider/readiness/writes with branch-inapplicable guidance
- **AND** points to HTML visual preview/gate rather than removing the marker

#### Scenario: Legacy production remains unchanged

- **WHEN** a consistent `image2-only` or historical compatibility source has no HTML-first marker
- **THEN** existing whole-page pilot/build/refresh behavior and prerequisites remain selected
- **AND** HTML manifests or gates cannot authorize it

### Requirement: HTML-first preview, gates, build, and local refresh have explicit ordering

HTML-first orchestration SHALL compute stale ownership from deterministic content, visual-system,
page-visual, notes, delivery, and structural projections. It SHALL present a human-readable recommended
repair and an explicit continuation when the issue is reversible evidence/process risk. `build --force
--reason` SHALL publish current gate waivers through the existing gate publication authority before
local assembly; it SHALL not mutate approved evidence into approval, invoke Image2, or bypass reset,
journal, CAS, source-parse, or bundle-structure checks. Final PPTX publication SHALL require no reset
transaction pending plus authoritative current-version/current-reset `html-content-review` and
`html-visual-review` decisions whose recorded projections and evidence are current; a current explicit
waiver may satisfy the decision requirement while status still reports incomplete evidence. Metadata
gate mirrors alone SHALL not authorize delivery. HTML preview/final-slide composition MAY run while
gates are pending but not while canonical reset is `deletion_pending`. Review requests SHALL declare
the exact `effective|forced-fallback` composition variant; only effective objects enter delivery
manifests and Stage 4. Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and Structural
Versioning materialization SHALL compute the smallest stale set from source ownership and current
manifest/fingerprint evidence. No local path SHALL create or invoke Image2 refinement. Notes-only
changes SHALL not stale content or visual review projections.

#### Scenario: Pilot plan is approved after revalidation

- **WHEN** pilot publishes a content or visual plan and the same current plan is read back
- **THEN** body projection, plan hash, reset ID, and logical version verify identically
- **AND** a complete plan can be approved with its exact hash

#### Scenario: Visual plan revalidation has composition evidence

- **WHEN** `readCurrentPlan` rebuilds a visual review plan
- **THEN** it loads the same shown composition/final-slide evidence used by pilot
- **AND** it does not mark all slides missing merely because the caller omitted a composition argument

#### Scenario: User forces a reversible gate continuation

- **WHEN** current source and reset identity are valid but content/visual evidence is pending or incomplete
- **THEN** orchestration records a bounded current waiver with reason and proceeds with local build
- **AND** status exposes the waived decision and independently computed evidence completeness

#### Scenario: Forced build is unnecessary

- **WHEN** both current HTML gates already satisfy readiness and the user invokes `build --force --reason`
- **THEN** orchestration records no new waiver and reports `force_not_needed`
- **AND** local build proceeds through the ordinary current-evidence path

#### Scenario: Forced build is dry-run

- **WHEN** a user invokes `build --force --reason --dry-run`
- **THEN** orchestration reports the prospective waiver/check set and local build plan
- **AND** it writes no state, metadata, or generated artifact

#### Scenario: Unsafe identity remains a hard stop

- **WHEN** a plan hash, reset, journal, CAS precondition, or source version is ambiguous or mismatched
- **THEN** orchestration returns a conflict/stale diagnostic
- **AND** `--force` does not write or render

#### Scenario: Visual gate reviews production-equivalent pixels

- **WHEN** an HTML visual gate is pending
- **THEN** orchestration may create representative pages/final slides/contact sheet through the production compositor
- **AND** final PPTX publication requires an approved or explicitly waived current gate decision

#### Scenario: Ordinary copy edit is local

- **WHEN** one slide's visible copy changes without global visual-system or fallback changes
- **THEN** Local Slide Rebuild recomposes that slide and downstream delivery locally
- **AND** it does not stale unrelated visual-system approval
- **AND** it stales content approval when the reviewed content fingerprint changes

#### Scenario: Global visual config change requires representative review

- **WHEN** an HTML visual-system fingerprint changes
- **THEN** Local Deck Rebuild produces current representatives for every current component recipe key before full delivery
- **AND** the previous visual gate cannot authorize Stage 4

#### Scenario: Metadata says approved without current HTML evidence

- **WHEN** metadata gate scalars are approved but current-version HTML gate records are missing or stale
- **THEN** preview may run but Stage 4 remains blocked

#### Scenario: Forced fallback is composed for review

- **WHEN** a selected-current slide needs fallback review
- **THEN** preview explicitly composes the forced-fallback variant
- **AND** delivery continues to resolve only the effective variant

### Requirement: HTML review plans are immutable current artifacts

Content and visual review planning SHALL serialize immutable canonical JSON under the scope-owned
`html_production/preview/plans/<plan-hash>.json` and publish current references only through the atomic
preview manifest. The plan hash SHALL cover canonical bytes excluding its own hash field. Every plan
SHALL bind exact `schema: pptmaker-html-review-plan-v1`, `publication_scope:
canonical-run|migration-preview`, nullable `html_production_reset_id` (current state value for canonical,
null for migration preview), pipeline, normalized logical run version, `kind: content|visual`,
`approvable`, current fingerprints/outstanding evidence, exact input receipts, and referenced artifact
confined paths/SHAs. Content plans SHALL include the complete ordered human-reviewed projection. Visual
plans SHALL include system coverage, page visual dependencies, and shown effective/forced-fallback
preview references. Scoped plans missing any outstanding evidence SHALL set `approvable: false` and
list it; they cannot publish approval but remain eligible for an explicit waiver after the current
source/reset/version projection is verified. Ordinary approval SHALL resolve only a `canonical-run`
plan referenced by a same-reset `canonical-run` current preview manifest and revalidate reset
ID/plan/artifact bytes/receipts. Migration-preview plans remain comparison evidence even if internally
complete. Failure diagnostics SHALL not echo authored content.

The schema-closed `preview/manifest.json` SHALL contain exact `schema:
pptmaker-html-preview-manifest-v1`, `publication_scope: canonical-run|migration-preview`, nullable
`html_production_reset_id` (current state value for canonical, null for migration preview),
pipeline/logical run version, plus independent nullable current references `review_plans.content`,
`review_plans.visual`, `contact_sheets.visual_review`, and `contact_sheets.delivery`. Each non-null
reference SHALL bind confined path, SHA-256, owning plan/review/delivery digest, and applicable
composition variants of the same scope/reset epoch. One atomic owner commit SHALL revalidate and
preserve unaffected current references, clear every stale/deleted/incompatible or
cross-scope/cross-reset carried reference, and update only the intended slots. Approval SHALL use only
the matching canonical/current-reset `review_plans.<gate>` slot; final delivery review SHALL use only
canonical/current-reset `contact_sheets.delivery`.

#### Scenario: Content plan survives process exit

- **WHEN** content review planning completes
- **THEN** the exact shown projection and plan hash are recoverable from current confined files

#### Scenario: Referenced preview changes

- **WHEN** a visual plan's referenced image bytes no longer match
- **THEN** approval fails stale and publishes no gate evidence

#### Scenario: Old plan remains as immutable storage

- **WHEN** a newer preview manifest replaces the current plan reference
- **THEN** the old plan cannot be approved even if its object file remains

#### Scenario: Migration plan is complete but non-authoritative

- **WHEN** a migration-preview review plan is internally complete and approvable
- **THEN** ordinary approval rejects its scope and publishes no target-version gate evidence

#### Scenario: Content and visual plans coexist

- **WHEN** a current content plan is followed by visual-plan publication with unchanged content inputs
- **THEN** one preview manifest retains both independently verified current plan references

#### Scenario: Delivery sheet update preserves current review refs

- **WHEN** delivery contact sheet publishes and current review plan inputs remain fresh
- **THEN** only `contact_sheets.delivery` changes and current plan slots remain valid

#### Scenario: Carried visual plan becomes stale during content update

- **WHEN** content-plan publication discovers the carried visual plan no longer verifies
- **THEN** the same manifest commit clears the visual slot rather than preserving false current evidence

### Requirement: Review projections separate notes from visual/content ownership

The content review projection SHALL reuse `content_review_fingerprint_v1` and exclude notes, runtime,
source locators, and selection transport. A notes projection SHALL cover notes source only. Visual-system
and page-visual projections SHALL retain their existing disjoint ownership. Raw source SHA MAY be kept
as provenance but SHALL not alone determine content/visual gate freshness.

#### Scenario: Notes-only edit uses the notes owner

- **WHEN** only a speaker note changes
- **THEN** content and visual projections remain equal
- **AND** the controller recommends Stage 5 and delivery review only

#### Scenario: Visible copy edit stales content only

- **WHEN** one slide's reviewed visible body changes without visual-system or fallback changes
- **THEN** content review becomes stale
- **AND** unrelated visual-system coverage remains current

### Requirement: Review-plan revalidation preserves canonical evidence ownership

Current plan references SHALL remain immutable hash-addressed objects. Every revalidation SHALL use the
same canonical projection builder, current reset/version, and shown composition/final-slide evidence;
it SHALL clear stale cross-scope/cross-reset references through the existing atomic manifest owner.
Diagnostics SHALL identify bounded expected/actual projection paths without echoing authored prose.

#### Scenario: Body projection is serialized consistently

- **WHEN** a slide contains callout or primary-visual fields
- **THEN** pilot and read-back use the same body field set
- **AND** `content_fingerprint` matches when source bytes and plan inputs are unchanged

#### Scenario: Old plan object remains stored but cannot approve

- **WHEN** the manifest points to a newer plan
- **THEN** the older immutable object remains available for audit
- **AND** approval rejects it as non-current without mutating the gate

### Requirement: Migration preparation resolves one isolated candidate before comparison

The migration adapter SHALL resolve a prepared candidate only from the current source version's `_scratch/html-migration/projected-run/`. The candidate owns its authored slide source and sparse `overrides/`; it inherits source-version overrides and deck-root backbone controls through the trusted precedence `candidate > source-version override > backbone`. Its preparation receipt and bounded authoring-checklist projection are candidate support artifacts; its `_generated/` HTML preview owners are rebuildable derived evidence and are not candidate authority. The resolver SHALL reuse the existing HTML source, visual-config, and asset-catalog validators through their closed migration-candidate interface rather than introducing a parallel readiness evaluator.

Preparation SHALL build or verify that candidate from a markerless source and a selected preset without writing outside `projected-run/`, publishing a visible version, loading provider credentials, or invoking a renderer/provider. A matching prepared candidate SHALL be idempotent. A source/preset/receipt conflict with existing authored candidate inputs SHALL stop before replacement. A legacy loose scratch candidate may be inspected only by explicit preparation compatibility handling; preview SHALL not copy, move, or adopt it.

Before renderer setup, preview SHALL use the resolver to distinguish a valid unprepared markerless run from an incomplete candidate. Those are `guide` outcomes with a bounded prepare or authoring next action and no render, plan, state, source, or visible-version write. An invalid source/candidate identity, confinement failure, live journal, or conflicting owner is a `hard-stop`; it protects attributable authored inputs and transaction recovery and SHALL short-circuit derived renderer symptoms. A complete candidate SHALL continue through the existing migration-preview context and complete comparison transaction.

The plan and hidden-target apply inputs SHALL bind the resolved candidate-source, candidate-override, inherited source-override, and backbone receipt set produced by this resolver. Apply SHALL re-resolve that set, construct a hidden target from those inherited inputs, stage only revalidated candidate source/overrides, and rebuild canonical target output locally. It SHALL never copy the legacy source tree, projected-run generated pages, final slides, manifests, contact sheets, review evidence, deck-root metadata, or any approval/state authority into the target.

#### Scenario: Prepare is isolated and idempotent

- **WHEN** the migration adapter prepares the same valid markerless source and preset twice
- **THEN** the second result verifies the existing candidate without changing authored inputs
- **AND** both runs make no source, visible-version, renderer, or provider write

#### Scenario: Bare preview returns a guide before rendering

- **WHEN** a valid markerless run has no projected candidate
- **THEN** preview returns the preparation guide from the candidate resolver
- **AND** no HTML renderer context, contact sheet, or migration plan is created

#### Scenario: Incomplete candidate remains authored work

- **WHEN** the candidate validator reports missing structured fields for two stable slide IDs
- **THEN** preview returns only those bounded authoring requirements
- **AND** it does not regenerate the candidate source or erase its controls

#### Scenario: Apply rerenders instead of promoting scratch bytes

- **WHEN** a complete candidate preview has an exact confirmed hash and apply stages the target
- **THEN** the target is rendered through a fresh canonical context from revalidated candidate inputs
- **AND** its generated objects are not copied from the migration-preview workspace

### Requirement: HTML and whole-page Image2 production adapters remain mutually isolated

Every public run-dir entry SHALL inspect canonical version-scoped production mode and verify the
canonical source marker before branch-specific readiness. The HTML adapter SHALL reject whole-page
prompt/render/header artifacts as authority; the whole-page Image2 adapter SHALL not infer HTML from
structured-looking prose or consume HTML production manifests. Provider-call spies and exact directory
diffs SHALL prove that HTML create/preview/build/refresh/structural operations never touch whole-page
Image2 or modern-refinement remote paths, and that `image2-only` operations never consume HTML output.
Calling the whole-page adapter from a first-class Image2-primary controller SHALL not weaken this
isolation or turn modern visual-slot refinement into a whole-page renderer.

#### Scenario: HTML deck has legacy generated files

- **WHEN** stale whole-page prompt/image/header directories coexist with a consistent HTML-mode source
- **THEN** HTML orchestration ignores them as production authority
- **AND** consumes only structured-plan and HTML-production evidence

#### Scenario: Markerless deck has HTML generated files

- **WHEN** a consistent `image2-only` run contains stray HTML-production bytes
- **THEN** whole-page orchestration does not use them to satisfy production or review gates

#### Scenario: First-class Image2 path reuses the isolated adapter

- **WHEN** create-deck dispatches a new `image2-only` run
- **THEN** it invokes the existing whole-page stages through the shared policy
- **AND** does not label the user workflow as HTML refinement or legacy-only maintenance

### Requirement: Legacy-to-HTML migration comparison is complete and zero-remote

Migration preview SHALL always validate and locally render the complete proposed HTML deck and contact sheet through the same renderer seam using a framework-issued `migration-preview` context rooted only at the current transaction's `_scratch/html-migration/projected-run/`. It SHALL emit exact `old_side_mode: verified-current|degraded-missing|degraded-stale`. `verified-current` SHALL require one current common-adaptable legacy final-slide per current plan ID and SHALL build the old comparison sheet locally from those entries. A legacy Stage-2 raw contact sheet alone SHALL not qualify. Degraded modes SHALL display a final-slide evidence diagnosis/placeholder, SHALL not display stale bytes or claim visual parity, and SHALL offer a separately authorized legacy-maintenance next action; migration SHALL still complete preview with zero provider calls. Scratch renderer manifests/contact sheets SHALL be comparison evidence only and SHALL not become the legacy run's or anticipated target's canonical current pointers.

The canonical plan hash SHALL bind base/candidate source-control-asset receipts, anticipated visible target version, old-side mode/evidence, ordered proposed composition fingerprints/final PNG SHAs, and proposed contact-sheet SHA while excluding scratch/hidden absolute paths. Apply SHALL require explicit human acknowledgement of that exact hash/mode, recheck every precondition, construct a fresh `canonical-run` context for the hidden real target, rerender without copying scratch generated bytes, and require exact equality of its ordered composition fingerprints/final PNG SHAs/contact-sheet SHA before visible publication. Any target-name/input/evidence/output drift SHALL abort without a visible version and require a new preview. Migration SHALL remain distinct from ordinary structural publication. Publication of the target SHALL carry no content/visual approval or delivery-review decision; its locally current HTML/final/contact-sheet artifacts remain reviewable inputs, and canonical Stage 4 remains blocked until target-version human gates are recorded.

#### Scenario: Current legacy contact sheet exists

- **WHEN** migration finds verified current legacy final slides/contact sheet
- **THEN** preview compares them with the complete proposed HTML contact sheet
- **AND** makes zero provider calls

#### Scenario: Legacy pixels are missing

- **WHEN** no current verified legacy visual evidence exists
- **THEN** migration emits `degraded-missing`, shows no old pixels, and neither regenerates legacy images nor claims parity
- **AND** offers separately authorized legacy maintenance without blocking review of the complete proposal

#### Scenario: Hidden target pixels differ from preview

- **WHEN** target rerender produces any different composition fingerprint, final PNG SHA, or contact-sheet SHA
- **THEN** apply publishes no visible version and requires a new preview

#### Scenario: Scratch preview evidence is offered to canonical build

- **WHEN** a caller tries to satisfy target gates or Stage 4 with migration-preview manifests or receipts
- **THEN** scope validation rejects them before canonical writes
- **AND** target review evidence remains pending until the visible target is reviewed

### Requirement: HTML structural materialization reuses only target-owned verified objects

Structural source publication SHALL remain source-only, renderer-free, and provider-free. A later explicit target-local HTML materialization MAY reuse an unchanged prior page/final-slide object only after recomputing the target composition fingerprint and verifying prior path/SHA/profile/receipt evidence. Reused bytes SHALL be copied or linked through a confined verified transaction into target-owned immutable object paths, and target-owned manifests SHALL reference only target-version paths and bind the target version's current reset ID (initially null unless that target itself was reset). Fingerprint mismatch or unverifiable bytes SHALL require local recomposition after source publication, never remote rendering during publication.

Byte reuse SHALL NOT copy, relabel, or synthesize version-scoped `html-production-reset`, `html-content-review`, `html-visual-review`, metadata approval mirrors, `html-delivery-review`, or final-review node decisions. The target SHALL retain historical source-version records only as history and SHALL begin with target reset ID null plus content/visual/delivery freshness pending/missing. The explicit materialization controller SHALL first publish target Stage-1/2/3 objects, target-owned reset-null content/visual review plans, and production-equivalent review/contact-sheet artifacts, then return a typed `review_required` continuation while Stage 4/5/PPTX/notes remain absent or stale. After the target-version gates are recorded, the same controller path SHALL revalidate target inputs and continue locally through order-dependent delivery contact sheet, Stage 4, Stage 5, and final review. This applies even to reorder-only targets: unchanged per-slide pixels may be reused, but ordered content/delivery semantics and human authorization are not inherited.

#### Scenario: Pure reorder materializes locally

- **WHEN** unchanged slides are reordered into an authorized target version
- **THEN** source publication performs no rendering and the later materializer reuses matching bytes into target ownership
- **AND** publishes target review-ready artifacts before gates, then rebuilds target PPTX/notes order only after target approvals

#### Scenario: Pure reorder has approved source-version gates

- **WHEN** an HTML target is materialized from a source version whose content/visual reviews were current
- **THEN** target pixels may be reused but target-version reviews remain pending until exact target plans are approved
- **AND** source-version evidence cannot authorize target Stage 4

#### Scenario: Materialization reaches the target gate boundary

- **WHEN** target Stage 1-3 and exact review plans are current but target gates are pending
- **THEN** the controller returns `review_required` with no target Stage-4/5 publication
- **AND** post-approval continuation remains local and reuses the same target-owned evidence

### Requirement: Review projections separate notes from visual/content ownership

The content review projection SHALL reuse `content_review_fingerprint_v1` and exclude notes, runtime,
source locators, and selection transport. A notes projection SHALL cover notes source only. Visual-system
and page-visual projections SHALL retain their existing disjoint ownership. Raw source SHA MAY be kept
as provenance but SHALL not alone determine content/visual gate freshness.

#### Scenario: Notes-only edit uses the notes owner

- **WHEN** only a speaker note changes
- **THEN** content and visual projections remain equal
- **AND** the controller recommends Stage 5 and delivery review only

#### Scenario: Visible copy edit stales content only

- **WHEN** one slide's reviewed visible body changes without visual-system or fallback changes
- **THEN** content review becomes stale
- **AND** unrelated visual-system coverage remains current

### Requirement: Review-plan revalidation preserves canonical evidence ownership

Current plan references SHALL remain immutable hash-addressed objects. Every revalidation SHALL use the
same canonical projection builder, current reset/version, and shown composition/final-slide evidence;
it SHALL clear stale cross-scope/cross-reset references through the existing atomic manifest owner.
Diagnostics SHALL identify bounded expected/actual projection paths without echoing authored prose.

#### Scenario: Body projection is serialized consistently

- **WHEN** a slide contains callout or primary-visual fields
- **THEN** pilot and read-back use the same body field set
- **AND** `content_fingerprint` matches when source bytes and plan inputs are unchanged

#### Scenario: Old plan object remains stored but cannot approve

- **WHEN** the manifest points to a newer plan
- **THEN** the older immutable object remains available for audit
- **AND** approval rejects it as non-current without mutating the gate

### Requirement: Transition preview validates the selected target contract without cross-quality inference

Transition orchestration SHALL resolve the exact source mode/pipeline before candidate processing and
select only the target adapter declared by the candidate.  An Image2-to-HTML preview MAY use the local
HTML adapter to validate and deterministically materialize the proposed target, but its result SHALL be
contract/receipt evidence only.  It SHALL NOT compare quality, assert visual parity, score layout, or
block conversion on subjective HTML appearance.

An HTML-to-Image2 preview SHALL validate the markerless target source through the existing whole-page
source contract without Stage-2 transport, style-master creation, provider credentials, or Image2
submission.  After target publication, normal first-class Image2 pilot/build retains all existing
provider authorization, provenance, content/visual/header review, and final-review behavior.

Candidate preparation MAY generate only an identity continuity ledger: formal slide IDs, spoken-key
reservation, and current order.  Source material may be shown as read-only authoring context, but no
source prose, notes, prompt, render-mode, visual-asset, metadata/history value, rendered pixel, or
generated artifact may populate target source/control automatically. Every renderer-owned target field and
every target-intake field must be explicitly authored in the direction's candidate before preview. The
preview plan hash covers the target-intake digest as a separate human-confirmed target decision, not a
source completion. This restriction applies to
the generalized Image2-to-HTML path as well as HTML-to-Image2; identity continuity is not source
completion, target approval, or content conversion authority.

#### Scenario: HTML target is operationally valid

- **WHEN** the selected HTML target validates and the local adapter produces its current deterministic receipt
- **THEN** preview may be confirmed as a transition plan without an added HTML quality or parity decision

#### Scenario: Image2 target has no provider authority yet

- **WHEN** an HTML-to-Image2 target preview has valid authored markerless source but no credentials or authorization
- **THEN** preview succeeds offline and reports later `needs_render` work without initializing a provider adapter

#### Scenario: Candidate names the wrong pipeline

- **WHEN** candidate source marker and selected target mode disagree
- **THEN** orchestration hard-stops before either adapter reads generated artifacts or performs writes

#### Scenario: Candidate cannot inherit target authoring from its source

- **WHEN** a target candidate is prepared from an opposite-pipeline source containing prose, notes, prompts, assets, or generated pages
- **THEN** preparation may expose only the identity continuity ledger and read-only reference context
- **AND** preview guides the Agent to author any missing target-owned fields rather than copying or inferring them

#### Scenario: Target intake is explicit

- **WHEN** a candidate omits its target audience, takeaway, or success criteria
- **THEN** preview returns a bounded authoring guide and cannot be confirmed
- **AND** it does not read a source intake decision as a substitute
