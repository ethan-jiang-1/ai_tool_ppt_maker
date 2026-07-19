## MODIFIED Requirements

### Requirement: CLI surface preserves command names

The `ppt_flow` CLI SHALL expose exactly **14** top-level commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and `migrate-html`. Arguments and flags for the original thirteen commands SHALL remain compatible except where this change defines an earlier pipeline-specific rejection. `migrate-html` SHALL expose closed `preview` and `apply` operations and SHALL not mutate a source version in place.

#### Scenario: Help lists the complete surface

- **WHEN** `ppt_flow --help` runs
- **THEN** all 14 command names, including `state`, `slides`, and `migrate-html`, are listed once

#### Scenario: Existing init invocation remains valid

- **WHEN** Agent runs `ppt_flow init deck_demo --deck-type keynote --style dark-executive`
- **THEN** a run bundle is created using the current HTML-first default contract

### Requirement: ppt_flow delegates to capability scripts

`ppt_flow.mjs` SHALL delegate bundle management, environment checks, state, slide transactions, HTML migration, and the selected production branch to their owning capability scripts. It SHALL route HTML Stage 2/3 through the registered HTML renderer/compositor CLIs and markerless production through the legacy adapter. It SHALL keep orchestration/renderer logic out of the command router and SHALL probe the canonical marker before branch-specific readiness or option handling.

#### Scenario: HTML build routes to the HTML adapter

- **WHEN** a marked run invokes `ppt_flow build`
- **THEN** `ppt_flow` delegates through unified orchestration to the HTML Stage-2/3 capability scripts
- **AND** does not delegate to style-master or Image2 generation

#### Scenario: Legacy style command retains its owner

- **WHEN** a markerless run invokes `ppt_flow style-master`
- **THEN** `ppt_flow` delegates to `generate_style_master.mjs` rather than implementing it inline

### Requirement: Pilot uses preview readiness and does not waive gates

`ppt_flow pilot` SHALL classify the run before readiness. For markerless legacy, preview readiness SHALL remain structure plus style master, gates SHALL not be required or mutated, and Stage 2 SHALL receive `--preview`. For `html-first-v1`, pilot SHALL require structure plus valid local HTML source/runtime inputs but no style master and no approved gates; it SHALL compose production-equivalent review artifacts only and SHALL not publish Stage 4/PPTX. Neither branch SHALL write `waived` to unlock preview. Full build SHALL require that branch's current authoritative gate evidence.

#### Scenario: HTML preview runs while gates are pending

- **WHEN** a valid HTML-first run has pending content/visual gates
- **THEN** pilot produces review evidence without style master or provider setup
- **AND** Stage 4 remains blocked

#### Scenario: Legacy preview behavior remains compatible

- **WHEN** a markerless run has a style master and pending gates
- **THEN** pilot may run legacy Stage 2 under preview readiness
- **AND** does not mutate gate fields

### Requirement: Pilot accepts --force-images and skips by default

`ppt_flow pilot` SHALL retain `--force-images` for markerless legacy decks: without it existing current pilot images are skipped, and with it selected legacy images regenerate. For `html-first-v1`, `--force-images` SHALL fail with `USAGE` before readiness/writes because HTML preview freshness is fingerprint-driven; callers SHALL use the HTML preview/rebuild selector rather than a provider-generation flag.

#### Scenario: Legacy pilot skips existing images by default

- **WHEN** markerless pilot images exist and pilot runs without `--force-images`
- **THEN** legacy Stage 2 skips those current files

#### Scenario: HTML pilot receives force-images

- **WHEN** a marked HTML-first run invokes pilot with `--force-images`
- **THEN** the command fails before writes/provider setup with the HTML preview next action

### Requirement: approve dual-writes metadata and _state gates

`ppt_flow approve <runDir> <gate>` SHALL classify the run before validating approval evidence. For markerless legacy, existing metadata `content_gate|visual_gate` and `_state.gates.content|visual` compatibility writes/reads SHALL remain and HTML approval SHALL never overwrite them. For `html-first-v1`, content and visual approval/waiver SHALL require no reset pending plus the exact current-reset hash of an `approvable: true` plan covering every outstanding evidence item; scoped/incomplete/pre-reset plans SHALL fail and list missing/stale evidence. Successful publication SHALL write one version-scoped/current-reset `html-content-review` or `html-visual-review` record under authoritative `_state`, update only `_state.gates.html_content|html_visual` plus matching `_state.gates.html_content_run_version|html_visual_run_version`, then update only metadata `html_content_gate|html_visual_gate` plus matching `html_content_gate_run_version|html_visual_gate_run_version` through the recoverable journal protocol. These HTML fields are compatibility/status mirrors; they SHALL use status `pending|approved|waived`, exact normalized run version, and SHALL never satisfy legacy or HTML readiness by themselves. A waiver SHALL require a reason accepted by the shared 1024-byte `normalizeHumanReason` rule and the same complete current-reset plan. Ambiguous or unrecoverable partial writes SHALL fail closed.

#### Scenario: HTML visual approval binds current evidence

- **WHEN** Agent approves visual with the exact current HTML review-plan hash
- **THEN** authoritative current-version visual evidence is published before mirrors are synchronized
- **AND** the record binds current preview/fingerprint evidence

#### Scenario: HTML waiver omits a reason

- **WHEN** Agent requests an HTML gate waiver without an explicit reason
- **THEN** approval fails without changing authoritative evidence or mirrors

#### Scenario: HTML scoped plan is incomplete

- **WHEN** approval supplies a current hash whose plan is non-approvable because other evidence is outstanding
- **THEN** approval fails, identifies the missing IDs/coverage, and writes neither state nor mirrors

#### Scenario: Legacy approval remains compatible

- **WHEN** Agent approves a markerless legacy gate
- **THEN** existing metadata and `_state.gates` values remain synchronized

#### Scenario: HTML approval coexists with approved legacy version

- **WHEN** one deck has markerless legacy gate scalars and an HTML version is approved
- **THEN** HTML publication changes only `html_*` mirror fields and authoritative HTML evidence
- **AND** legacy `content_gate|visual_gate` plus `_state.gates.content|visual` remain byte-semantically unchanged

### Requirement: state prints a where-am-I resume card

`ppt_flow.mjs state` human output and successful `--json` output SHALL retain the whole-session where-am-I card and SHALL classify the canonical production marker before state interpretation. The card SHALL expose non-empty `workflow_summary` and `suggested_next`, exact `pipeline`, and `state_present`. When durable state exists it SHALL retain active `playbook`, `current_node`, current-node status, optional `waiting_for`/`note`, gates, and `playbook_stack`. For a historical markerless deck without state it SHALL expose legacy-maintenance ownership through a non-persisted compatibility card, leave absent execution fields explicitly null/not-active, and SHALL not create `_state/state.yaml`. When the exact migration target receipt exists but its source execution handoff is absent, state/status SHALL expose `migration_handoff_pending: true`, source/target version, and resume guidance without writing or leaking receipt SHAs/paths; all other outputs use false/null.

`state --recover-gate-journal <owner-token>` SHALL be a closed HTML-only repair operation requiring the exact token previously shown by plain state/status. `state --record-delivery-review <proceed|repair|redirect> [--reason <text>]` SHALL be the only public publication route for `html-delivery-review`; it SHALL derive current evidence through the deep module, require reason for repair/redirect, forbid it for proceed, and accept no evidence override. Both operations SHALL be mutually exclusive with `--json`, `--check-gates`, and each other and SHALL emit no ordinary resume card until their transaction completes. Markerless runs SHALL reject both before writes with branch-inapplicable guidance.

For HTML-first, human output and top-level JSON `html_reviews` SHALL expose the exact bounded snapshot: content/visual objects with `decision: pending|approved|waived` and `freshness: current|stale|missing|invalid`; content `review_required` boolean; visual sorted `outstanding_recipe_keys` and `outstanding_slide_ids`; delivery with `freshness: current|stale|missing|invalid`, `decision: null|proceed|repair|redirect`, and `reason_present` boolean; reset with `status: absent|deletion-pending|complete`, `ownership: none|active|waiting|recoverable|uncertain|invalid`, and nullable `retry_after_ms`; and journal `status: absent|active|uncertain|recoverable-abort|recoverable-mirror|recoverable-cleanup|recoverable-reset-yield|invalid|forbidden` plus optional `owner_token` of exactly 64 lowercase hex when non-absent. Plain state/status SHALL not expose reset IDs/tokens, claim timestamps, bound SHAs/paths/raw owner data, or perform recovery. For markerless compatibility, `html_reviews` SHALL be null and pipeline SHALL be exact `legacy-image2-first`; HTML uses exact `html-first-v1`.

Suggested-next SHALL be waiting-first, then journal conflict/repair, then owning stale/missing review or delivery action, and SHALL never present unavailable Phase 4 as required debt after complete delivery. Card construction SHALL remain in the shared state module so `status` consumes the same semantics without mutating state. Deck resolution SHALL use `deckRoot(resolve(runDir))`. The complete CLI surface SHALL remain exactly 14 commands.

#### Scenario: HTML resume card exposes outstanding review

- **WHEN** an HTML-first run has current content approval but stale page evidence for two slides
- **THEN** state output identifies the HTML pipeline and the two sorted outstanding slide IDs
- **AND** suggested-next names the visual-review path rather than Image2 refinement

#### Scenario: Complete HTML card omits Phase-4 debt

- **WHEN** current delivery, notes, gates, and `html-delivery-review: proceed` verify
- **THEN** workflow summary reports a complete deliverable
- **AND** suggested-next does not require lifecycle 4 or create optional-refinement state

#### Scenario: Markerless state card does not seed execution

- **WHEN** `state` inspects a historical markerless deck without `_state/state.yaml`
- **THEN** output identifies markerless legacy-maintenance ownership and `state_present: false`
- **AND** no state file is written and no active node is fabricated

#### Scenario: Interrupted journal is observable but not healed by plain state

- **WHEN** plain state sees new authoritative state with the old metadata mirror
- **THEN** `html_reviews.journal.status` is `recoverable-mirror`
- **AND** state emits no journal or metadata write

#### Scenario: Cross-host journal is explicitly recovered

- **WHEN** the Controller has shown an uncertain journal, obtained human confirmation that its owner stopped, and invokes `state --recover-gate-journal` with the exact current token after 300000 ms
- **THEN** CLI applies only the exact recovery matrix and exits with bounded recovered/blocked status
- **AND** it does not create a content/visual decision

#### Scenario: Recovery token is stale or owner is active

- **WHEN** the token mismatches, journal changed, minimum age is unmet, or same-host PID is active
- **THEN** recovery fails with `CONFLICT` or repair-required evidence and changes no store

#### Scenario: Uncertain owner diagnostic requires a human

- **WHEN** state/check-gates/build cannot automatically recover an uncertain journal
- **THEN** the producer-owned next action marks human confirmation required and carries the opaque token for the Controller
- **AND** does not tell the human to edit `_state` or invent approval

#### Scenario: Delivery review decision is recorded

- **WHEN** the Controller invokes `state --record-delivery-review repair --reason <text>` after showing current delivery
- **THEN** the command publishes one current evidence-bound repair decision
- **AND** status remains incomplete and routes to the owning repair node

#### Scenario: Delivery review targets legacy run

- **WHEN** markerless state receives `--record-delivery-review`
- **THEN** it fails before state writes and points to legacy controller review semantics

#### Scenario: Waiting state remains first

- **WHEN** durable state has a non-empty current-node `waiting_for`
- **THEN** `suggested_next` surfaces that wait before artifact-based heuristics

#### Scenario: State resolves deck via deckRoot

- **WHEN** Agent supplies a version run directory under `3_versions/vN`
- **THEN** state resolves the deck through `deckRoot(resolve(runDir))`

### Requirement: status surfaces playbook position and lesson count

`ppt_flow.mjs status` SHALL classify the canonical marker before reading branch-specific state/artifacts and SHALL reuse the same non-mutating resume-card projection and exact `html_reviews` enums as `state`. With durable state, human and JSON output SHALL retain `playbook` and `current_node`; an HTML-first run SHALL additionally expose the same `pipeline`, `state_present`, freshness/outstanding coverage, journal status, delivery-review decision, workflow summary, and completion semantics. A historical markerless deck without state SHALL report `state_present: false` and legacy-maintenance ownership without healing/seeding `_state`; it SHALL not silently claim an active playbook/node. A complete current HTML delivery SHALL be complete without any Phase-4 record or action.

Status SHALL retain the `Lessons` line and JSON `lessons_count`, counting files in deck-root `_lessons/` except `README.md` without invoking `lessons.mjs` as a subprocess. Missing/empty means zero/`none`; positive counts retain the review hint.

#### Scenario: Status shows lesson count when lessons exist

- **WHEN** Agent runs status on a deck with two lesson files excluding README
- **THEN** human output shows `Lessons: 2` with the review hint
- **AND** JSON includes `lessons_count: 2`

#### Scenario: Status shows no lessons

- **WHEN** `_lessons/` is absent or contains no counted files
- **THEN** human output shows `Lessons: none`
- **AND** JSON includes `lessons_count: 0`

#### Scenario: Status shows durable playbook position

- **WHEN** a run has usable `_state/state.yaml`
- **THEN** human and JSON output include its active playbook and current node

#### Scenario: HTML status exposes evidence freshness

- **WHEN** an HTML run has stale content, one uncovered recipe key, and no delivery review
- **THEN** status exposes each condition through the shared HTML review projection
- **AND** does not reduce them to metadata scalar gate values

#### Scenario: Markerless status is non-writing

- **WHEN** a historical markerless deck lacks `_state/state.yaml`
- **THEN** status reports legacy compatibility without creating state or inventing an execution pointer

### Requirement: Title refresh routes by the affected slides' resolved modes

`ppt_flow refresh --kind title` SHALL classify the canonical marker and retain `--only <ids>|--all` selector semantics. For HTML-first, header text is renderer-owned visible content: the command SHALL refresh Stage 1, locally rebuild affected HTML/final-slide review output, validate overflow, stale content approval when its fingerprint changes, and preserve visual approval when the page visual dependency fingerprint is unchanged. It SHALL reject legacy force/reuse/profile options. It SHALL not publish Stage 4 until current content/visual evidence exists; after exact content review, repeating or continuing the controller path SHALL rebuild ordered delivery without remote work. For markerless legacy, existing render-mode routing, selector-free body-lock restriction, `TITLE_REVIEW_REQUIRED`, force-pilot/header evidence, and reviewed-image reuse SHALL remain.

#### Scenario: HTML title changes

- **WHEN** one marked slide title changes
- **THEN** local review pixels are rebuilt, content evidence becomes stale, and visual evidence remains current if visual dependencies are unchanged
- **AND** no Image2/header-review route is selected

#### Scenario: Legacy full-page title changes

- **WHEN** a markerless selected title belongs to full-page and lacks current header review
- **THEN** existing `TITLE_REVIEW_REQUIRED` and exact force-pilot action remain

### Requirement: Existing approve command records header review evidence

`ppt_flow approve <run-dir> header` SHALL be explicitly markerless-legacy-only. For markerless runs it SHALL retain current pilot/provenance checks, version-scoped `nodes.header-review.by_version`, matching-profile merge/partial coverage, stale rejection, and ID-plus-reason waiver behavior without changing content/visual metadata gates. For HTML-first, it SHALL fail before readiness/artifact/state writes with branch-inapplicable guidance to `approve ... visual --plan-hash`; HTML evidence SHALL never enter `header-review`.

#### Scenario: Legacy partial header batches merge

- **WHEN** two markerless current pilot batches have matching fingerprint/profile
- **THEN** their reviewed IDs merge under the same version record

#### Scenario: HTML run approves header

- **WHEN** a marked run invokes `approve ... header`
- **THEN** CLI writes no legacy evidence and points to the current HTML visual review path

### Requirement: Build preserves reviewed full-page images

For markerless legacy, current header evidence SHALL retain reviewed/accepted full-page image preservation: default force conflicts with reviewed bytes, `build --reuse-images` preserves matching reviewed images and generates only missing/unreviewed ones, and profile drift requires new pilot/review. For HTML-first, currentness SHALL come from effective composition fingerprints/manifests; `--reuse-images`, legacy resolution/model/provider options, and reviewed legacy image evidence SHALL be rejected before writes. HTML build SHALL reuse current immutable effective objects automatically and SHALL never treat review-only forced-fallback bytes as delivery.

#### Scenario: Legacy reviewed build uses reuse

- **WHEN** markerless header evidence/profile/images are current
- **THEN** `build --reuse-images` preserves those images and fills only missing legacy output

#### Scenario: HTML build receives reuse-images

- **WHEN** a marked run invokes build with `--reuse-images`
- **THEN** the command rejects the legacy-only option before production writes

### Requirement: CLI envelope tests cover the registered executable inventory

The test suite SHALL maintain the exact registered inventory of **thirteen** executable `.mjs` entries: existing `bundle_layout.mjs`, `env-check.mjs`, `generate_style_master.mjs`, `make_contact_sheet.mjs`, `ppt_flow.mjs`, `stage1_build_inputs.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, and `unified_pipeline.mjs`, plus `stage2_render_html.mjs` and `stage3_compose_slides.mjs`. It SHALL compare this set with direct-entry guards/shebangs and probe help plus deterministic failure-envelope behavior for every entry. Libraries SHALL remain excluded; any inventory drift SHALL fail with exact names.

#### Scenario: HTML compositor lacks a failure probe

- **WHEN** `stage3_compose_slides.mjs` is executable but absent from the inventory tests
- **THEN** the CLI contract suite fails and names it

### Requirement: The complete ppt_flow command surface has return-audit coverage

The command-return registry SHALL cover exactly the 14 registered top-level commands: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, `state`, `slides`, and `migrate-html`. Every command/subcommand/closed repair or evidence operation SHALL register applicable success/usage/validation/gate/conflict/stale/commit/internal return categories or an explicit not-applicable reason. `state --recover-gate-journal` SHALL cover mutual-exclusion/invalid-token/too-young/token-drift/active-owner/forbidden-SHA/successful-abort/mirror-complete/cleanup/exact-reset-yield returns and prove no approval creation. `state --record-delivery-review` SHALL cover invalid decision, required/forbidden reason combinations, reason control/UTF-8-size validation, markerless rejection, missing/stale/current evidence, journal/reset conflict, each typed decision success, and unsupported evidence overrides. `refresh --kind reset-html-production` SHALL cover explicit-versus-default flag detection, exact-version confirmation, markerless/unusable-state/gate-journal/reset-CAS/metadata-CAS/unsafe-owner conflicts, gate-journal race yield, new reset, live/waiting/dead/uncertain/invalid owner matrices at exact 60000/300000-ms boundaries, competing takeover CAS, same-reset resume, idempotent completed retry only without current-epoch authority, absent-owner no-reset-needed versus authority-loss epoch rotation, deletion failure with retained fence, and successful completion without approval creation. `slides` SHALL retain its operation-specific audit; `migrate-html preview|apply` SHALL cover complete/degraded preview, exact mode/hash acknowledgement, drift, decline, apply-journal mutual exclusion, automatic/confirmed recovery age-token-owner matrices, absent-target owned cleanup/full rerender, exact-target idempotent completion, conflicting target/foreign path denial, and zero-provider failures. Set mismatch SHALL fail.

#### Scenario: Migrate command is not audited

- **WHEN** `migrate-html` is registered without preview/apply return cases
- **THEN** return audit fails and names the missing command/subcommands

## ADDED Requirements

### Requirement: HTML renderer and compositor CLIs are registered envelope-compliant executables

Direct `stage2_render_html.mjs` and `stage3_compose_slides.mjs` SHALL be Node ESM registered executables whose production interface accepts exactly required `--run-dir <vN>`, optional shared `--only <selectors>`, exact `--variant effective|forced-fallback`, and `--dry-run` in addition to side-effect-free `--help`. `effective` SHALL be the explicit default only when the flag is absent; review orchestration SHALL pass `forced-fallback` explicitly. The CLIs SHALL derive canonical plan/control/object/manifest paths internally from the validated run and SHALL accept no arbitrary input/output/manifest path, provider/base-url/model/style-master, browser channel/executable, or package-root override. They SHALL provide deterministic stdout and the existing one-final-JSON failure envelope. Diagnostics SHALL identify bounded slide/field/box/artifact/runtime phases without absolute paths, raw HTML, source prose, browser stack, or asset bytes.

#### Scenario: Renderer CLI help is audited

- **WHEN** executable inventory runs `--help`
- **THEN** each CLI exits zero without creating files or launching Chromium

#### Scenario: Caller attempts an arbitrary output manifest

- **WHEN** either direct CLI receives `--output`, `--manifest`, or another unsupported path override
- **THEN** it returns `USAGE` before validated-run creation or writes

#### Scenario: Pixel overflow fails

- **WHEN** direct composition detects overflow
- **THEN** stderr ends with one `FAILED` envelope carrying slide/field/measurement evidence and a local source/layout repair action

#### Scenario: Direct forced fallback is review-only

- **WHEN** a direct renderer/compositor invocation uses `--variant forced-fallback`
- **THEN** it may publish verified immutable review objects and deterministic receipts
- **AND** it does not replace HTML-page/final-slide delivery manifests or claim a current preview plan

#### Scenario: Direct dry-run writes nothing

- **WHEN** either direct CLI uses `--dry-run`
- **THEN** it publishes no object, manifest, plan, lock residue, or generated directory

### Requirement: Public HTML build and refresh commands route without provider flags

`ppt_flow validate`, preview, build, status, approve, slides, and refresh SHALL probe the source marker before branch-specific argument/readiness handling. HTML-first build SHALL use the local Stages 1-5 adapter. HTML refresh SHALL expose Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, structural materialization, and the exceptional full generated-owner recovery through existing command ownership or explicit closed `--kind` values; it SHALL reject legacy provider/model/resolution/style-master/`--force-images`/`--reuse-images` flags and never delegate to legacy image generation/style-master/header approval. Markerless behavior and flags remain backward compatible.

The only public canonical full-reset syntax SHALL be `ppt_flow refresh <run-dir> --kind reset-html-production --confirm-run-version <vN>`. It SHALL require exact normalized version equality and invoke the state-owned `resetHtmlProduction` interface with no caller-supplied reset/owner ID, path, lock, or manifest. This kind SHALL be mutually exclusive with explicitly supplied `--only`, `--all`, `--dry-run`, `--resolution`, `--provider`, `--base-url`, `--model`, every style/style-master option, force/reuse image flags, and every other refresh-kind-specific override. Parser defaults SHALL not count as supplied options or flow into reset; `--confirm-run-version` SHALL be rejected for every non-reset kind. Unsupported combinations SHALL return `USAGE` before state or filesystem writes. Markerless runs SHALL reject the kind as branch-inapplicable.

For a new reset the command SHALL atomically install its owner claim. For pending reset, a live same-host owner SHALL return `CONFLICT`; a dead same-host owner younger than 60000 ms SHALL return a bounded retry-after conflict; same-host proven-dead age at least 60000 ms MAY be claimed automatically; valid cross-host/PID-uncertain ownership younger than 300000 ms SHALL remain blocked, and at/after 300000 ms MAY be claimed only after the Controller's explicit no-active-writer confirmation represented by this exact destructive route. Invalid ownership SHALL fail closed. Every takeover SHALL retain the semantic reset ID and use state CAS to install a fresh internal owner claim before deletion. Success SHALL report only normalized run version, whether the transaction was `started|resumed|already-complete`, and that local rebuild plus fresh content/visual/final review is required; it SHALL not expose reset/owner IDs, old evidence hashes, or claim rebuild completion.

An absent generated owner SHALL not by itself make reset valid. When no current-reset authoritative review/delivery or HTML Stage-4/5 receipt exists, reset SHALL return branch-appropriate no-reset-needed guidance and ordinary preview may rebuild. When such authority exists, reset SHALL rotate a new epoch and complete with deletion already satisfied. Likewise `complete + owner absent` is `already-complete` only before any authority is published in that completed epoch; if authority was later published and the owner then disappeared, the command SHALL start a new reset rather than return idempotent success.

#### Scenario: HTML build without credentials

- **WHEN** a valid gated HTML-first run invokes `ppt_flow build`
- **THEN** it completes local delivery without reading Image2 environment variables

#### Scenario: Legacy-only flag targets HTML

- **WHEN** an HTML refresh/build receives `--force-images`, provider URL, or style-master option
- **THEN** CLI returns `USAGE` before remote prerequisite resolution or writes

#### Scenario: Reset confirmation names the wrong version

- **WHEN** `--confirm-run-version` does not exactly equal the canonical target version
- **THEN** refresh returns `USAGE` without state, metadata, or generated-owner mutation

#### Scenario: Reset resumes after deletion crash

- **WHEN** the target version already has `html-production-reset.status: deletion_pending`
- **THEN** the command continues that reset ID through mirror/deletion/completion and reports `resumed`

#### Scenario: Explicit parser defaults do not fake a flag conflict

- **WHEN** reset is invoked without a user-supplied resolution/provider/style option but the command parser has defaults for ordinary refresh
- **THEN** those defaults do not enter reset validation or the reset interface

#### Scenario: Live reset owner blocks a second command

- **WHEN** a second reset command observes a proven-live same-host owner
- **THEN** it returns `CONFLICT` without changing ownership, metadata, generated bytes, or completion status

#### Scenario: Reset is retried after completion

- **WHEN** the same version has a complete reset, no canonical generated owner, and no authority bound to that completed reset ID
- **THEN** the command reports `already-complete` without rotating state or writing files

#### Scenario: Completed epoch loses its rebuilt owner

- **WHEN** a complete reset ID later has current approvals/delivery evidence but its generated owner is absent
- **THEN** the confirmed command starts a new reset epoch and does not report `already-complete`

### Requirement: HTML content and visual approval are exact-evidence-hash bound

The public content and visual approval paths SHALL accept a required exact review-plan hash for HTML-first runs and SHALL verify current reset ID plus content projection or preview manifest/bytes/receipts before writing pipeline-specific gate evidence. A waiver SHALL also require an explicit reason. A `deletion_pending` reset SHALL return `CONFLICT`; a pre-reset plan hash SHALL be stale even when rebuilt raw artifacts are byte-identical. Legacy visual/header approval syntax and evidence remain isolated. A stale/missing hash SHALL fail with a human-review next action and no gate mutation.

#### Scenario: User approves current HTML preview

- **WHEN** the supplied review-plan hash matches current shown artifacts
- **THEN** `approve ... visual` records current `html-visual-review` evidence and visual gate status

#### Scenario: Preview changed after showing

- **WHEN** the supplied hash no longer matches current source/config/artifacts
- **THEN** approval fails without changing the gate

#### Scenario: Reviewed content changes

- **WHEN** the ordered content fingerprint no longer matches the supplied content review hash
- **THEN** content approval fails without changing authoritative evidence or mirrors

### Requirement: Legacy-to-HTML migration has preview and exact apply commands

`ppt_flow migrate-html <run-dir> preview` SHALL validate a version-local candidate transaction, render the complete proposed HTML deck/contact sheet, and emit exact `old_side_mode: verified-current|degraded-missing|degraded-stale`, anticipated target version, and exact plan hash without publishing a version. Only `verified-current` may include old pixels. Degraded modes SHALL show diagnosis/placeholder, no stale pixels/parity claim, and a separately authorized legacy-maintenance next action; preview itself SHALL succeed locally. Normal `ppt_flow migrate-html <run-dir> apply --plan-hash <sha> --old-side-mode <mode>` SHALL accept only the current exact hash/mode after human acknowledgement and an exact active source `migrate-import` apply execution, bind that execution ID into journal/target receipt, recheck target/input/evidence, and publish only when hidden-target ordered composition/final PNG/contact-sheet SHAs exactly match preview. Closed recovery form `ppt_flow migrate-html <run-dir> apply --recover-journal <owner-token>` SHALL be mutually exclusive with plan/mode flags, require exact 64-lowercase-hex token plus the human-confirmed/age/active-owner rules, and apply only the bounded migration-apply recovery matrix. A recoverable/uncertain journal SHALL be reported with opaque token; the Agent carries it without requiring user transcription. Preview, normal apply, and recovery SHALL make zero provider calls; unknown/legacy-generation/evidence/path flags SHALL be usage errors.

#### Scenario: Migration preview runs

- **WHEN** an Agent has prepared a complete candidate under canonical migration scratch
- **THEN** preview emits source/comparison evidence and a plan hash while the visible version set remains unchanged

#### Scenario: Bare migration apply is rejected

- **WHEN** apply omits or mismatches the exact plan hash
- **THEN** CLI fails before hidden staging or visible version publication

#### Scenario: Migration apply has no matching active execution

- **WHEN** normal apply finds no exact source `migrate-import` execution bound to the confirmed plan/mode
- **THEN** it fails before journal/reservation/staging creation and points to the controller entry

#### Scenario: Migration recovery flags are mixed

- **WHEN** apply receives `--recover-journal` together with plan hash or old-side mode
- **THEN** it returns `USAGE` before journal/staging/target mutation

#### Scenario: Cross-host migration recovery is confirmed

- **WHEN** the Controller supplies the exact old-enough token after the human confirms no migration apply is active
- **THEN** apply performs only the bound recovery matrix and creates no review approval

### Requirement: HTML and workflow migration diagnostics remain producer-owned

New reason kinds for renderer preparation, browser measurement, manifest drift, visual-review staleness, pipeline ownership, and state replacement SHALL be emitted only by the responsible JS producer through `cli_error.mjs`. MD/node specs SHALL consume category/reason/next semantics without copying the full envelope schema or interpreting shell prose.

#### Scenario: Browser error crosses ppt_flow boundary

- **WHEN** a delegated renderer fails
- **THEN** `ppt_flow` preserves one normalized actionable parent diagnostic
- **AND** does not append raw child stderr or a second JSON envelope
