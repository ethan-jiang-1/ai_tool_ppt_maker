## MODIFIED Requirements

### Requirement: Valid structured slides produce inert self-contained HTML pages
The renderer module SHALL retain its existing closed canonical `buildHtmlPages(validatedRun, request)` and `composeHtmlSlides(validatedRun, request)` seams, opaque validated-run context, and canonical publication restrictions. It SHALL additionally expose one public review-only visual-slot candidate composition operation. That operation accepts only a framework-validated run, stable slide/slot identity, candidate ID, SHA-bound in-memory raster bytes, and bounded media evidence; it resolves current source geometry internally. It SHALL reject filesystem paths, manifest/profile/provider fields, caller-supplied boxes, publication-root overrides, and delivery variants. It SHALL publish only review-labeled immutable artifacts and SHALL never modify effective HTML-page/final-slide or delivery manifests. Phase 3 SHALL not import Phase 4 or discover candidate directories.

`validatedRun` SHALL be an immutable opaque framework-issued context, not a caller-assembled object. It SHALL bind one validated `html-first-v1` marker/plan, effective controls/catalog, exact discovered runtime/package profile, logical run version, exact `canonical-run` publication scope, and the current nullable `htmlProductionResetId`. Only canonical Stage-1/run validation MAY issue that context; it SHALL recheck the same source/control/asset receipts, and a non-branded, mutated, or mismatched context SHALL fail before writes. Both closed JS requests SHALL contain exactly optional `slideIds`, required boolean `dryRun`, and exact `compositionVariant: effective|forced-fallback`, because variant resolution can change self-contained HTML as well as pixels; serialized manifests/fingerprints use snake-case `composition_variant` and `html_production_reset_id`. Callers SHALL NOT separately supply theme, assets, fonts, receipts, paths, publication root, reset ID, selection policy, fingerprints, or browser configuration. Family adapters, asset/font selection, receipt validation, fingerprinting, manifest construction, publication, and lock ownership SHALL remain internal, and CLIs/tests SHALL cross the same seam.

The canonical context SHALL resolve only the target version's canonical `_generated/html_production/` owners. It SHALL not issue a scratch workspace, convert a whole-page source, or accept a caller-supplied alternative publication root. Renderer HTML/PNG bytes and composition fingerprints SHALL exclude physical workspace paths; manifests, receipts, locks, and diagnostics SHALL bind the exact canonical version and reset ID. `dryRun` SHALL create no output.

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

#### Scenario: Phase 4 requests a candidate comparison
- **WHEN** Phase 4 supplies a verified candidate value for one eligible slide/slot
- **THEN** Phase 3 produces a review-only comparison using the resolved HTML geometry
- **AND** current delivery manifest pointers remain unchanged

#### Scenario: Caller supplies a candidate path
- **WHEN** a caller attempts to pass a filesystem path or manifest override to candidate composition
- **THEN** the operation rejects it before reads or writes

#### Scenario: Caller supplies a noncanonical context
- **WHEN** a caller supplies a path, unbranded context, or context whose scope is not canonical-run
- **THEN** rendering fails before lock or object creation
- **AND** no alternate publication authority is created

### Requirement: HTML and final-slide publication is atomic and drift-safe
HTML pages, final slides, and review previews SHALL be immutable content-addressed objects under their canonical `_generated/html_production/*/objects/` owners. Exact raw-byte SHA-256 SHALL be the object filename/address; composition fingerprints and review/delivery digests SHALL remain entry metadata and SHALL NOT be used as substitute object addresses. Every object entry/current manifest, plan, receipt, and publish lock SHALL bind `publication_scope: canonical-run` and the state-owned current nullable `html_production_reset_id`. Review-plan hashing SHALL include that reset ID, while composition/final-slide fingerprints, delivery identity digests, and raw addressed HTML/PNG/contact-sheet bytes SHALL remain reset-ID-free as required for byte reuse. A consumer SHALL reject a scope or reset-ID mismatch before accepting an object's digest or publishing.

The two delivery current manifests SHALL use exact discriminators `schema: pptmaker-html-pages-manifest-v1` for `html_pages/manifest.json` and `schema: pptmaker-html-final-slides-manifest-v1` for `final_slides/manifest.json`; the review preview owner uses `pptmaker-html-preview-manifest-v1` as defined by `pipeline-orchestration`. Unknown schema, extra current-entry kind, or a schema/path-owner mismatch SHALL fail before carry/merge. Schema names are public persisted contract values, not implementation filenames or producer versions.

When the canonical `_generated/html_production/` owner is absent, validated-run creation SHALL inspect current-epoch authority before treating publication as a first build. If no authoritative content/visual/delivery record or HTML Stage-4/5 receipt is bound to the current nullable reset ID, local preview/build MAY create the owner normally. If any such current-epoch authority exists, absence is an unexpected owner loss and direct publication SHALL fail with a bounded `reset-html-production` action before directory/lock/object creation; only the state-owned reset transaction may rotate the epoch and authorize clean rebuild. Evidence bound to an older reset ID does not block rebuild after a completed reset.

Before reading/merging current entries, each owner SHALL verify that no `html-production-reset` transaction is `deletion_pending`, resolve the current nullable reset ID, acquire transient exclusive `.publish.lock` through atomic directory creation, and then exclusively create `.publish.lock/owner.json`. That canonical JSON record SHALL contain exactly `schema: pptmaker-html-publish-lock-v1`, opaque cryptographically random 64-lowercase-hex `owner_token`, `owner_kind: html-pages|final-slides|preview`, `publication_scope`, nullable `html_production_reset_id`, normalized host, positive PID, exact `created_at_epoch_ms`, `input_scope_sha256`, and nullable `prior_manifest_sha256`. `input_scope_sha256` SHALL hash canonical operation/variant/requested-ID/current-input-receipt/reset-ID fields without source prose or absolute paths. An empty lock directory or missing/invalid/mismatched record is uncertain ownership and SHALL never be automatically reclaimed. Automatic reclaim SHALL require a valid record, exact same host, process-liveness proof that the PID is dead, and age at least `PUBLISH_LOCK_AUTO_RECOVERY_MIN_AGE_MS = 60000`; PID reuse/live/permission ambiguity, clock-invalid data, or another host SHALL remain `CONFLICT`. Every precommit recheck SHALL also require the reset record/status/ID to remain unchanged.

Every scoped commit SHALL revalidate all carried entries against current plan membership and their own current input receipts, remove deleted/stale carried entries even when outside requested IDs, merge newly verified entries, and serialize current entries in plan order. A scoped manifest MAY therefore be incomplete; no consumer may treat it as complete delivery until exactly one eligible entry exists for every plan ID. An existing final object path SHALL be accepted only when its bytes match the addressed digest. A missing object SHALL be written only to same-directory exclusive `.object.<owner-token>.<sha256>.tmp`, fully flushed/closed and digest-verified, followed by a target-absence recheck and atomic rename to its final SHA path; if a target appeared, its bytes SHALL verify before the owner removes only its own temp. Thus an interrupted object write never occupies the final content address. After all objects verify, each owner SHALL recheck every byte receipt, lexical/realpath confinement proof, lock record, and prior manifest SHA immediately before atomically replacing only its `manifest.json` through same-directory `.manifest.<owner-token>.tmp`. Only the matching lock owner or proven-stale-lock recovery MAY remove temps bearing that exact token. Recovery SHALL remove only matching object/manifest temps before removing/reclaiming the lock and starting a fresh transaction; unrelated temps or malformed lock state fail closed. The manifest SHALL be the sole current-set commit point; publication SHALL NOT rely on multi-file or directory replacement. Failure, timeout, drift, or interruption before manifest commit SHALL preserve the prior current set and SHALL not expose a mixed manifest. Normal publication SHALL NOT delete final objects; a reader holding a prior manifest therefore retains its referenced bytes. Garbage collection is explicit future maintenance and out of scope.

A cross-host, uncertain, or invalid publication lock has no automatic or single-lock deletion path. The Controller SHALL first require the gate-approval journal to be absent (resolving it through its own exact recovery path if present), then show the publication conflict and obtain explicit human confirmation that no canonical HTML writer/reader must be preserved. It SHALL invoke only the closed state-owned `resetHtmlProduction` route; the Controller and renderer SHALL not delete the tree themselves. That transaction SHALL rotate/persist the version reset ID and `deletion_pending` fence before deleting exactly the target run's `_generated/html_production/` tree, then complete idempotently as specified by `node-specification`. It SHALL stale prior HTML gate/delivery evidence even after a byte-identical rebuild and SHALL not retain/copy individual objects, manifests, plans, locks, or temps. No source/control file, execution history, or authoritative prior review record is deleted.

Only an `effective` HTML-page/final-slide transaction SHALL replace the corresponding delivery current manifest. A `forced-fallback` transaction SHALL acquire the same owner lock, revalidate inputs and existing addressed bytes, publish/verify immutable review objects, and return their exact receipts without changing either delivery manifest. The preview owner SHALL then revalidate those receipts and atomically make them current only through its review-labeled preview plan/manifest. Failure before that preview commit leaves non-current orphan objects and preserves all prior current pointers. `dryRun` SHALL publish neither objects nor manifests.

#### Scenario: Input drifts before final rename
- **WHEN** plan, config, geometry, font, manifest, or referenced asset bytes change after preparation
- **THEN** publication aborts and preserves the prior HTML/final-slide set
- **AND** the next action is a clean local rerun

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
- **AND** the only override is the explicitly confirmed whole-owner reset

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
- **AND** the unreferenced review objects remain non-current

#### Scenario: Dry run plans forced fallback
- **WHEN** either renderer operation uses `dryRun: true`
- **THEN** it may return planned fingerprints/diagnostics but writes no object, temp, lock residue, or manifest

## REMOVED Requirements

### Requirement: Migration-preview context is issued from one validated candidate overlay
**Reason**: The projected candidate overlay, migration publication scope, and scratch renderer context are retired.

**Migration**: The renderer receives only its canonical `html-first-v1` validated-run context. Production-mode transition target construction remains outside the HTML renderer and creates no migration preview context.
