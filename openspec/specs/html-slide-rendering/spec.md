# html-slide-rendering Specification

## Purpose

Defines the html-slide-rendering behavior for PPTMAKER_FRAMEWORK.

## Requirements

### Requirement: Valid structured slides produce inert self-contained HTML pages

The renderer module SHALL retain its existing closed canonical `buildHtmlPages(validatedRun, request)` and `composeHtmlSlides(validatedRun, request)` seams, opaque validated-run context, and canonical/migration-preview publication restrictions. It SHALL additionally expose one public review-only visual-slot candidate composition operation. That operation accepts only a framework-validated run, stable slide/slot identity, candidate ID, SHA-bound in-memory raster bytes, and bounded media evidence; it resolves current source geometry internally. It SHALL reject filesystem paths, manifest/profile/provider fields, caller-supplied boxes, publication-root overrides, and delivery variants. It SHALL publish only review-labeled immutable artifacts and SHALL never modify effective HTML-page/final-slide or delivery manifests. Phase 3 SHALL not import Phase 4 or discover candidate directories.

`validatedRun` SHALL be an immutable opaque framework-issued context, not a caller-assembled object. It SHALL bind one validated HTML marker/plan, effective controls/catalog, exact discovered runtime/package profile, logical run version, exact publication scope `canonical-run|migration-preview`, and nullable `htmlProductionResetId` (current state value for canonical, null for migration preview). Only canonical Stage-1/run validation or the migration transaction's closed projected-run validator MAY issue that context; both SHALL recheck the same source/control/asset receipts, and a non-branded, mutated, or mismatched context SHALL fail before writes. Both closed JS requests SHALL contain exactly optional `slideIds`, required boolean `dryRun`, and exact `compositionVariant: effective|forced-fallback`, because variant resolution can change self-contained HTML as well as pixels; serialized manifests/fingerprints use snake-case `composition_variant` and `html_production_reset_id`. Callers SHALL NOT separately supply theme, assets, fonts, receipts, paths, publication root, reset ID, selection policy, fingerprints, or browser configuration. Family adapters, asset/font selection, receipt validation, fingerprinting, manifest construction, scope-specific publication, and lock ownership SHALL remain internal, and CLIs/tests SHALL cross the same seam.

`canonical-run` SHALL resolve only the target version's canonical `_generated/html_production/` owners. `migration-preview` SHALL resolve only the current migration transaction's exact confined `_scratch/html-migration/projected-run/` workspace, whose complete candidate source/control/assets and scratch Stage-1 plan have already been validated as the anticipated target version. Migration preview objects/manifests/contact sheets SHALL be scratch evidence only: they SHALL NOT satisfy canonical gates, state/status, build, assembly, notes, or delivery review, and apply SHALL NOT copy them into the target. Renderer HTML/PNG bytes and composition fingerprints SHALL exclude physical workspace paths and publication scope so apply can rerender the hidden canonical target and compare exact output; manifests, receipts, locks, and diagnostics SHALL bind the scope so scratch and canonical authority cannot be confused. Direct Stage-2/3 CLIs SHALL construct only `canonical-run`; only `production-mode-transition` orchestration may request the migration validator. `dryRun` SHALL create neither canonical nor migration workspace output.

For each valid slide, the module SHALL produce one UTF-8 HTML document containing the exact resolved family geometry/theme/content, only page-used bundled font files, validated local catalog assets, and renderer-owned chart/pattern/icon output. The document SHALL contain no external stylesheet/script/font/image/iframe, no service worker, no executable author-authored HTML/CSS/JavaScript, and no active external resource. Markdown/YAML parsing, family choice, alternate-control resolution, and source mutation SHALL remain outside the module.

#### Scenario: Page is complete without a server

- **WHEN** a valid HTML-first plan slide is prepared
- **THEN** the emitted HTML contains every dependency needed for local rendering
- **AND** opening it requires no network, provider, style master, or source re-interpretation

#### Scenario: Source prose cannot inject markup

- **WHEN** a visible source string contains HTML-significant characters
- **THEN** the renderer emits them as escaped text
- **AND** they cannot create an element, style, script, URL, or event handler

#### Scenario: Caller supplies inconsistent resolved inputs

- **WHEN** a caller attempts to pass a separate theme, asset map, runtime, or output path alongside a validated run
- **THEN** the interface rejects the unsupported field
- **AND** cannot compose bytes from mutually inconsistent validated inputs

#### Scenario: Migration preview renders without polluting the legacy run

- **WHEN** `production-mode-transition preview` supplies its current framework-issued migration context
- **THEN** the same renderer seam publishes only beneath the projected-run scratch owner
- **AND** no legacy or anticipated-target canonical manifest, gate, state, PPTX, or notes evidence changes

#### Scenario: Phase 4 requests a candidate comparison

- **WHEN** Phase 4 supplies a verified candidate value for one eligible slide/slot
- **THEN** Phase 3 produces a review-only comparison using the resolved HTML geometry
- **AND** current delivery manifest pointers remain unchanged

#### Scenario: Caller supplies a candidate path

- **WHEN** a caller attempts to pass a filesystem path or manifest override to candidate composition
- **THEN** the operation rejects it before reads or writes

#### Scenario: Caller forges a migration publication root

- **WHEN** a caller supplies a path, unbranded context, or canonical context relabeled as migration preview
- **THEN** rendering fails before lock or object creation
- **AND** no alternate publication authority is created

### Requirement: Ten family components obey the resolved geometry and token contract

One closed component registry SHALL render `hero`, `split`, `cards`, `kpi`, `comparison`, `flow`, `timeline`, `data`, `quote`, and `visual-focus`. Components SHALL place every visible record in the named boxes from the resolved immutable geometry variant, preserve source/item order, use only the plan's closed typography/spacing/component tokens, and materialize resolved fallback/selection evidence without moving or resizing family-level boxes. Every one of the 68 registry variants SHALL resolve exactly one component output.

#### Scenario: Geometry variant is rendered without inference

- **WHEN** a plan contains `split--text-visual-right--callout1`
- **THEN** the component uses the plan's named text, visual, header, and callout boxes exactly
- **AND** it does not recompute a different split or choose another placement

#### Scenario: Registry and component coverage drift

- **WHEN** a valid geometry variant has no component mapping or a component emits an undeclared visible box
- **THEN** renderer coherence validation fails before browser launch

### Requirement: Data charts use a closed deterministic ECharts SVG adapter

Data-family charts SHALL be converted from the structured chart record and resolved chart tokens through exact direct dependency `echarts@6.1.0` using Node-side SSR SVG rendering with animation disabled. The adapter SHALL own a closed option mapping for `bar|line|area`, exact formatter output, series/categories/legend, colors, axes, grid, and plot padding; source SHALL NOT supply ECharts options. The resulting SVG SHALL be structurally checked for a bounded renderer-owned passive vocabulary, fragment-only references, declared dimensions, and absence of script, CSS imports, animation, external/data resources, or event behavior before being embedded. Validation SHALL parse URL-bearing attributes/CSS values rather than reject arbitrary `http` substrings; inert exact namespace declarations such as `http://www.w3.org/2000/svg` SHALL be allowed. Every inline SVG instance SHALL derive exact prefix `pm-<first16hex>-` from SHA-256 of canonical `[slide_id, field_path, zero_based_occurrence, source_svg_sha256]` and rewrite all `id`, `href`, and `url(#...)` references; random, process, and timestamp inputs are forbidden. Typed icons SHALL forbid SVG `<text>`; any other permitted SVG text SHALL use covered bundled fonts and pass the same custom-font/measurement checks as HTML text. ECharts JavaScript SHALL NOT execute in the page browser.

#### Scenario: Chart renders with no browser script

- **WHEN** a valid data slide is prepared
- **THEN** the HTML contains a deterministic inline SVG chart
- **AND** contains no ECharts runtime script or remote resource

#### Scenario: Adapter output violates the closed subset

- **WHEN** generated SVG contains a forbidden active or external construct
- **THEN** page preparation fails with renderer/version evidence
- **AND** the browser is not asked to interpret the construct

### Requirement: Browser composition uses the pinned runtime and zero-network policy

Composition SHALL reuse the exact Playwright and `echarts@6.1.0` package roots/versions discovered by base readiness and their paired Chromium, reject bare re-resolution plus channel/executable overrides, launch with `--force-color-profile=srgb`, inject content into initial `about:blank`, block service workers, and abort/fail on every routed resource/navigation/socket request regardless of scheme. No `http|https|file|ftp|ws|wss|blob`, protocol-relative, or custom-scheme exception is allowed; embedded image/font data bytes SHALL not create routed external requests. Before compositor implementation, the paired-runtime probe SHALL prove that the selected Playwright/CDP hooks observably cover document/resource navigation, each forbidden scheme, WebSocket, and service-worker attempts; an unobservable class SHALL require a revised tested mechanism/spec before implementation and SHALL NOT be accepted through CSP-only reasoning. Context SHALL use exact `locale: en-US`, `timezoneId: UTC`, `colorScheme: light`, `reducedMotion: reduce`, and `forcedColors: none`; HTML SHALL declare `lang="und" dir="ltr"`; renderer CSS SHALL set `line-break: strict`, `word-break: normal`, `overflow-wrap: normal`, `hyphens: none`, and `font-synthesis: none`. Each document SHALL carry a renderer-owned CSP equivalent to `default-src 'none'; script-src 'none'; connect-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'`. Serialized UTF-8 HTML SHALL be at most `64 * 1024 * 1024` bytes after construction and before publication/browser load. Composition SHALL render pages sequentially in one context, close every page/context/browser in `finally`, enforce exact `COMPOSE_PAGE_TIMEOUT_MS = 30000`, and enforce `COMPOSE_DECK_TIMEOUT_MS = 30000 + 30000 * selected_slide_count` for the invocation. It SHALL report the last normalized phase and SHALL NOT install/download a browser or initialize Image2/provider configuration.

#### Scenario: Page attempts an external request

- **WHEN** any page resource/runtime code attempts a routed request or navigation in any scheme
- **THEN** the request is aborted and composition fails
- **AND** no final-slide manifest entry is published

#### Scenario: Browser work stalls

- **WHEN** launch, load, fonts, measurement, or screenshot exceeds the page timeout
- **THEN** composition reports the last normalized phase
- **AND** closes created browser resources

#### Scenario: Self-contained page exceeds the byte cap

- **WHEN** serialized HTML is larger than 64 MiB
- **THEN** preparation fails before object publication or browser launch with page/asset/font byte evidence

#### Scenario: Deck invocation reaches its computed timeout

- **WHEN** selected composition work exceeds `30000 + 30000 * selected_slide_count` milliseconds
- **THEN** the invocation fails, identifies the last page/phase, and closes the shared context

### Requirement: Browser measurement proves fonts, bounds, and overflow before capture

Before screenshot, the renderer SHALL derive the exact expected visible leaf-marker set from the plan and require the observed renderer-owned set to match one-for-one. It SHALL wait for local fonts, use CDP platform-font evidence to prove non-zero actual bundled-font glyph use for every rendered family/weight role, including permitted SVG text and mixed English/Hans fallback roles, and inspect root/slot scroll bounds, Range/text line boxes, every SVG text bbox, chart/image bounds, family geometry, computed visibility/opacity, and cross-owner overlap/occlusion. The pre-implementation paired-runtime probe SHALL prove those CDP/Range/SVG evidence shapes are available and stable; failure SHALL revise the evidence contract before implementation rather than downgrade to font-load or declared-range evidence. Exact `GEOMETRY_EPSILON_CSS_PX = 0.5` SHALL apply: escape/overflow greater than epsilon fails; non-overlay cross-owner intersection fails when both overlap dimensions exceed epsilon. Single-line/explicit-line contracts SHALL remain satisfied. Other cross-owner overlap is allowed only for exact registry-declared overlays; chart-internal marks SHALL remain inside their chart owner. After screenshot, decoding SHALL prove exact dimensions and nonblank pixels. Failure is diagnostic-only and SHALL publish neither a current HTML-page nor final-slide entry.

#### Scenario: Source capacity passed but pixels overflow

- **WHEN** a valid structured slide produces browser text outside its owned slot
- **THEN** composition fails with slide ID, field path, box, measured overflow, and remediation boundary
- **AND** it does not shrink text or truncate content automatically

#### Scenario: Browser falls back to a system font

- **WHEN** visible glyphs do not use the expected bundled custom font
- **THEN** composition fails despite `document.fonts.ready`
- **AND** no screenshot is accepted as verified

#### Scenario: Component omits a visible field

- **WHEN** expected and observed leaf-marker sets differ
- **THEN** composition fails with slide ID and bounded field paths before capture

#### Scenario: CSS clips text without scroll overflow

- **WHEN** Range/SVG text boxes escape their owner despite hidden overflow
- **THEN** measurement fails rather than accepting the clipped pixels

#### Scenario: Captured page is blank

- **WHEN** decoded PNG has no non-background visible pixels under the checked profile
- **THEN** final-slide verification fails and publishes no current entry

### Requirement: Final-slide screenshot profile and evidence are versioned

The v1 screenshot profile SHALL capture the exact logical canvas `1000 x 562.5` at device scale factor 2 into a nonblank, byte-deterministic `2000 x 1125` non-animated PNG on the paired runtime. Apply SHALL prove fractional clip plus repeated identical PNG SHA before enabling production; a mismatch/nondeterministic raw capture SHALL require a spec/profile revision to a tested deterministic capture/re-encode path rather than runtime rounding or unstable-byte acceptance. A verified final-slide entry SHALL bind slide ID, exact composition variant, composition fingerprint, HTML SHA-256, PNG path/SHA-256/dimensions, runtime/screenshot/renderer/compositor/component/chart/recipe versions, normalized measurement/font/network evidence, and exact input receipts.

#### Scenario: Exact profile renders

- **WHEN** a valid page passes measurement under the pinned runtime
- **THEN** the output is one 2000 x 1125 PNG with current manifest evidence
- **AND** the entry binds the HTML and all rendering-version inputs

#### Scenario: Screenshot dimensions drift

- **WHEN** captured PNG dimensions differ from the profile
- **THEN** the slide fails verification
- **AND** Stage 4 cannot consume the bytes

### Requirement: Composition fingerprints are slide-local and delivery digest is ordered

`composition_fingerprint_v1` SHALL hash exact `composition_variant: effective|forced-fallback`, renderer/compositor/component/chart/recipe versions, pinned runtime profile, complete renderer-consumed slide projection, resolved theme/geometry/visual resolution, and referenced asset/font SHAs while excluding physical position, source locators, timestamps, notes, and unreferenced catalog entries. `composition_input_receipt_v1` SHALL bind that slide-local projection/current-plan membership plus effective visual config/geometry registry, referenced asset/font bytes, and exact renderer/runtime/package versions with confined paths. It SHALL exclude whole source/plan SHA, order, notes, other slides, and unreferenced catalog assets. Removed IDs SHALL not remain current; reorder, notes-only, or unrelated-slide edits SHALL not stale unchanged composition. Current HTML-page/final-slide delivery manifests SHALL contain only `effective`; preview manifests MAY reference review-only `forced-fallback` HTML/final-slide objects and SHALL bind exact variant/digest. `html_delivery_digest_v1` SHALL hash the Stage-1 ordered plan digest plus ordered slide IDs and their current effective composition fingerprints/final-slide SHAs. Reorder SHALL preserve per-slide composition fingerprints and bytes but change the delivery digest.

#### Scenario: Pure reorder reuses slide pixels

- **WHEN** unchanged slides are reordered
- **THEN** their composition fingerprints and final PNG SHAs remain current
- **AND** the delivery digest/contact sheet/PPTX order changes

#### Scenario: One fallback asset changes

- **WHEN** a referenced fallback asset byte changes through a valid source transaction
- **THEN** only consuming slides' composition fingerprints become stale
- **AND** unreferenced slides remain reusable

#### Scenario: Another slide's copy changes

- **WHEN** one slide changes while a second slide's renderer-consumed projection and dependencies remain identical
- **THEN** the second slide's composition input receipt remains current despite the whole-plan SHA changing

#### Scenario: Slide is removed from the current plan

- **WHEN** a previously rendered stable ID is absent from the current plan
- **THEN** its object may remain immutable storage but no current manifest may retain it

#### Scenario: Selected page is reviewed in forced-fallback mode

- **WHEN** a slide has a current selected asset and fallback review is requested
- **THEN** its review PNG visibly uses the fallback and has a forced-fallback fingerprint distinct from effective delivery
- **AND** the review object cannot satisfy the delivery manifest

### Requirement: HTML and final-slide publication is atomic and drift-safe

HTML pages, final slides, and previews SHALL be immutable content-addressed objects under their respective scope-owned `html_production/*/objects/` directories. Exact raw-byte SHA-256 SHALL be the object filename/address; composition fingerprints and review/delivery digests SHALL remain entry metadata and SHALL NOT be used as substitute object addresses. Every object entry/current manifest, plan, receipt, and publish lock SHALL carry exact `publication_scope: canonical-run|migration-preview`; every canonical current manifest/plan/receipt SHALL additionally carry `html_production_reset_id` equal to the state-owned current nullable reset ID, while migration-preview evidence carries null. Review-plan hashing SHALL include that field, but composition/final-slide fingerprints, delivery identity digests, and raw addressed HTML/PNG/contact-sheet bytes SHALL remain reset-ID-free and scope-free as required for byte reuse and migration output equality. A consumer SHALL reject a metadata scope or reset-ID mismatch before accepting an object's digest or publishing, and only `canonical-run` may satisfy ordinary delivery/review state.

The two delivery current manifests SHALL use exact discriminators `schema: pptmaker-html-pages-manifest-v1` for `html_pages/manifest.json` and `schema: pptmaker-html-final-slides-manifest-v1` for `final_slides/manifest.json`; the preview owner uses `pptmaker-html-preview-manifest-v1` as defined by `pipeline-orchestration`. Unknown schema, extra current-entry kind, or a schema/path-owner mismatch SHALL fail before carry/merge. Schema names are public persisted contract values, not implementation filenames or producer versions.

When the canonical `_generated/html_production/` owner is absent, validated-run creation SHALL inspect current-epoch authority before treating publication as a first build. If no authoritative content/visual/delivery record or HTML Stage-4/5 receipt is bound to the current nullable reset ID, local preview/build MAY create the owner normally. If any such current-epoch authority exists, absence is an unexpected owner loss and direct publication SHALL fail with a bounded `reset-html-production` action before directory/lock/object creation; only the state-owned reset transaction may rotate the epoch and authorize clean rebuild. Evidence bound to an older reset ID does not block rebuild after a completed reset.

Before reading/merging current entries, each owner SHALL verify that no `html-production-reset` transaction is `deletion_pending`, resolve the current nullable reset ID, acquire transient exclusive `.publish.lock` through atomic directory creation, and then exclusively create `.publish.lock/owner.json`. That canonical JSON record SHALL contain exactly `schema: pptmaker-html-publish-lock-v1`, opaque cryptographically random 64-lowercase-hex `owner_token`, `owner_kind: html-pages|final-slides|preview`, `publication_scope`, nullable `html_production_reset_id`, normalized host, positive PID, exact `created_at_epoch_ms`, `input_scope_sha256`, and nullable `prior_manifest_sha256`. `input_scope_sha256` SHALL hash canonical operation/variant/requested-ID/current-input-receipt/reset-ID fields without source prose or absolute paths. An empty lock directory or missing/invalid/mismatched record is uncertain ownership and SHALL never be automatically reclaimed. Automatic reclaim SHALL require a valid record, exact same host, process-liveness proof that the PID is dead, and age at least `PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS = 60000`; PID reuse/live/permission ambiguity, clock-invalid data, or another host SHALL remain `CONFLICT`. Every precommit recheck SHALL also require the reset record/status/ID to remain unchanged.

Every scoped commit SHALL revalidate all carried entries against current plan membership and their own current input receipts, remove deleted/stale carried entries even when outside requested IDs, merge newly verified entries, and serialize current entries in plan order. A scoped manifest MAY therefore be incomplete; no consumer may treat it as complete delivery until exactly one eligible entry exists for every plan ID. An existing final object path SHALL be accepted only when its bytes match the addressed digest. A missing object SHALL be written only to same-directory exclusive `.object.<owner-token>.<sha256>.tmp`, fully flushed/closed and digest-verified, followed by a target-absence recheck and atomic rename to its final SHA path; if a target appeared, its bytes SHALL verify before the owner removes only its own temp. Thus an interrupted object write never occupies the final content address. After all objects verify, each owner SHALL recheck every byte receipt, lexical/realpath confinement proof, lock record, and prior manifest SHA immediately before atomically replacing only its `manifest.json` through same-directory `.manifest.<owner-token>.tmp`. Only the matching lock owner or proven-stale-lock recovery MAY remove temps bearing that exact token. Recovery SHALL remove only matching object/manifest temps before removing/reclaiming the lock and starting a fresh transaction; unrelated temps or malformed lock state fail closed. The manifest SHALL be the sole current-set commit point; publication SHALL NOT rely on multi-file or directory replacement. Failure, timeout, drift, or interruption before manifest commit SHALL preserve the prior current set and SHALL not expose a mixed manifest. Normal Change-3 publication SHALL NOT delete final objects; a reader holding a prior manifest therefore retains its referenced bytes. Garbage collection is explicit future maintenance and out of scope.

A cross-host/uncertain/invalid publication lock has no automatic or single-lock deletion path, and its override SHALL follow the lock's proven publication scope. For `canonical-run`, the Controller SHALL first require the gate-approval journal to be absent (resolving it through its own exact recovery path if present), then show the publication conflict and obtain explicit human confirmation that no canonical HTML writer/reader must be preserved. It SHALL invoke only the closed state-owned `resetHtmlProduction` route; the Controller and renderer SHALL not delete the tree themselves. That transaction SHALL rotate/persist the version reset ID and `deletion_pending` fence before deleting exactly the target run's `_generated/html_production/` tree, then complete idempotently as specified by `node-specification`. It SHALL stale prior HTML gate/delivery evidence even after a byte-identical rebuild and SHALL not retain/copy individual objects, manifests, plans, locks, or temps. No source/control file, legacy generated owner, execution history, or authoritative prior review record is deleted.

For `migration-preview`, or when an invalid lock lies inside the exact projected-run owner and scope cannot be trusted, the Controller SHALL first require `apply-journal.json` to be absent through its own migration-apply recovery matrix, identify that the entire current migration transaction is disposable scratch, obtain explicit confirmation that no migration preview writer/reader must be preserved, and delete exactly that source run's `_scratch/html-migration/` transaction before rebuilding candidate/comparison/plan evidence. It SHALL not delete or stale canonical HTML production/state/gates, retain an old migration plan, or remove only the lock/projected-run subtree. If the lock location itself is not confined to one of these exact owners, recovery fails closed without deletion.

Only an `effective` HTML-page/final-slide transaction SHALL replace the corresponding delivery current manifest. A `forced-fallback` transaction SHALL acquire the same owner lock, revalidate inputs and existing addressed bytes, publish/verify immutable review objects, and return their exact receipts without changing either delivery manifest. The preview owner SHALL then revalidate those receipts and atomically make them current only through its review-labeled preview plan/manifest. Failure before that preview commit leaves non-current orphan objects and preserves all prior current pointers. `dryRun` SHALL publish neither objects nor manifests.

#### Scenario: Input drifts before final rename

- **WHEN** plan, config, geometry, font, manifest, or referenced asset bytes change after preparation
- **THEN** publication aborts and preserves the prior HTML/final-slide set
- **AND** the next action is a clean local rerun

#### Scenario: Migration-scoped manifest reaches canonical consumer

- **WHEN** preview, gate, Stage 4, or delivery review resolves a valid-bytes manifest whose `publication_scope` is `migration-preview`
- **THEN** it rejects the artifact as branch-inapplicable before treating any entry as current

#### Scenario: First render fails

- **WHEN** `_generated/html_production/` did not exist and rendering fails
- **THEN** no current manifest is published and any unreferenced immutable object is non-current

#### Scenario: Generated owner is missing after approval

- **WHEN** the canonical owner is absent while a gate/delivery/Stage-4/5 receipt is bound to the current reset ID
- **THEN** renderer/compositor/preview fails before recreating the owner and directs the closed reset command

#### Scenario: Generated owner is missing before any authority

- **WHEN** the canonical owner is absent and no current-reset authoritative review/delivery/Stage-4/5 evidence exists
- **THEN** ordinary local preview may create the owner without rotating a reset ID

#### Scenario: Two scoped rebuilds overlap

- **WHEN** a second publisher reaches the same owner while a valid or uncertain publish lock exists
- **THEN** it immediately fails with `CONFLICT` and does not replace the first transaction's merged manifest

#### Scenario: Same-host dead lock is old enough

- **WHEN** the recorded PID is proven dead on the exact host and lock age is at least 60000 ms
- **THEN** recovery removes only object/manifest temps bearing that lock's exact owner token, removes the lock, and starts a fresh transaction

#### Scenario: Process crashes during object write

- **WHEN** a publisher dies after writing only part of an object temp
- **THEN** no final SHA-addressed object exists at that path
- **AND** valid same-host recovery may remove only that token-bound temp before retry

#### Scenario: Lock directory has no valid owner record

- **WHEN** `.publish.lock` exists without one valid matching `owner.json`
- **THEN** publication reports uncertain `CONFLICT` and does not infer host, PID, age, or temp ownership
- **AND** recovery requires the confirmed full-tree reset path

#### Scenario: Lock came from another host

- **WHEN** a current owner sees a cross-host or otherwise uncertain lock
- **THEN** it returns `CONFLICT` and does not remove the lock
- **AND** the only override is the explicitly confirmed scope-specific whole-owner reset

#### Scenario: Gate journal exists during reset request

- **WHEN** a full generated reset is requested while `_state/gate-approval-journal.json` exists
- **THEN** reset remains blocked until that journal is resolved or deterministically rejected
- **AND** generated audit bytes are not deleted out from under an in-flight gate transaction

#### Scenario: Reset epoch changes during publication

- **WHEN** a publisher acquires its lock and the state-owned reset ID or reset status changes before manifest commit
- **THEN** publication aborts without replacing the current manifest
- **AND** it does not remove or complete the reset transaction

#### Scenario: Reset is deletion-pending

- **WHEN** a canonical renderer/compositor/preview operation starts while the reset transaction is incomplete
- **THEN** it returns `CONFLICT` before creating a publish lock, object temp, or manifest temp

#### Scenario: Migration lock cannot be reclaimed

- **WHEN** an uncertain lock is confined beneath `_scratch/html-migration/projected-run/`
- **THEN** recovery may only discard the entire confirmed migration transaction and start a new preview
- **AND** canonical HTML production, state, gates, and delivery review remain unchanged

#### Scenario: Migration apply journal exists during scratch reset

- **WHEN** migration-preview lock recovery finds `apply-journal.json`
- **THEN** it does not delete scratch and routes first to the migration-apply recovery matrix

#### Scenario: Addressed object path already exists with different bytes

- **WHEN** an immutable object path exists but its SHA does not match the address
- **THEN** publication fails as integrity corruption and does not overwrite the object

#### Scenario: Stage 4 holds the previous manifest during new publication

- **WHEN** a final-slide manifest is replaced after Stage 4 loaded the previous one
- **THEN** normal publication leaves every previous referenced object available
- **AND** Stage 4 still rechecks its loaded receipt before assembly publication

#### Scenario: Scoped rebuild omits another stale slide

- **WHEN** direct scope requests A but current validation finds carried entry B stale
- **THEN** the committed manifest includes current A, removes B from the current set, and reports B missing/stale
- **AND** Stage 4 remains blocked rather than consuming B's old object

#### Scenario: Forced fallback object is prepared

- **WHEN** review orchestration composes `forced-fallback`
- **THEN** verified immutable HTML/PNG review objects may be written under their owners
- **AND** HTML-page and final-slide delivery manifests remain byte-identical

#### Scenario: Preview commit fails after forced object preparation

- **WHEN** forced objects verify but preview plan/manifest publication fails
- **THEN** the prior preview and delivery current pointers remain unchanged
- **AND** the unreferenced forced objects are non-current orphan storage

#### Scenario: Dry run plans forced fallback

- **WHEN** either renderer operation uses `dryRun: true`
- **THEN** it may return planned fingerprints/diagnostics but writes no object, temp, lock residue, or manifest

### Requirement: HTML rendering has an explicit language and locale boundary

The v1 renderer SHALL preserve authored Unicode scalar sequences as UTF-8 without normalization and SHALL support the Change-2 English plus Simplified Chinese/Hans corpus in horizontal LTR layout under the exact context/document/CSS profile above. `en-US` and `lang=und` are deterministic runtime inputs, not language detection or normalization. Renderer/chart output SHALL not apply locale-sensitive number or date formatting. It SHALL NOT claim RTL, vertical text, full-CJK coverage, or OS-independent pixel identity. Exact screenshot evidence on the maintained Mac SHALL be normative; Windows, Linux, and CI instructions SHALL remain compatibility guidance and non-pixel contract tests unless separately evidenced.

#### Scenario: Authored bilingual text is composed

- **WHEN** a valid English/Hans LTR slide contains composed or decomposed Unicode scalar sequences
- **THEN** the HTML preserves the authored sequence without normalization
- **AND** bundled-font coverage and browser measurement determine acceptance

#### Scenario: Unsupported writing mode is requested

- **WHEN** source requires RTL or vertical writing
- **THEN** validation fails with an explicit v1 scope diagnostic
- **AND** does not claim a visually verified fallback layout

### Requirement: Migration-preview context is issued from one validated candidate overlay

Only the migration adapter MAY request a migration-preview renderer context. It SHALL obtain that context from the HTML contract's closed candidate-overlay validation result, bind the anticipated target logical version and null reset ID, and publish only beneath the exact candidate's `_scratch/html-migration/projected-run/_generated/html_production/` owners. Callers SHALL not supply an alternate publication root, source, palette, asset catalog, receipt set, or logical target path.

The context SHALL bind the same effective candidate source, candidate overrides, inherited source-version overrides, and backbone receipts that preview plan/apply revalidation use. Candidate visual controls and assets SHALL therefore affect preview bytes exactly as they affect a hidden target constructed from the same inherited inputs after its candidate overlay is staged. Renderer output fingerprints SHALL remain independent of physical scratch/canonical publication paths and scope, while manifests and diagnostics remain scope-bound. Scratch output SHALL remain comparison evidence only and SHALL never be copied or relabeled as target output.

#### Scenario: Overlay preview equals hidden target inputs

- **WHEN** a candidate palette or asset override changes a complete migration preview
- **THEN** the migration context renders from that effective overlay
- **AND** apply can reproduce the same output only by revalidating and overlaying the same inputs in the hidden target

#### Scenario: Caller cannot forge an overlay context

- **WHEN** a caller passes a hand-built candidate path, receipt, publication root, or relabeled canonical context
- **THEN** context issuance fails before lock or object creation
- **AND** no scratch or canonical manifest is mutated
