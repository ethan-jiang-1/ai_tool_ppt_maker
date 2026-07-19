## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates

Every registered node SHALL declare globally unique kebab-case `node`, `lifecycle_phase` in exact set `0|1|2|3|4|5`, `method_module` in exact set `00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`, ordered `requires`, deterministic `entry`, and `exit`; routing gates SHALL declare unique allowed decisions. Fenced controller YAML and standalone shared-node frontmatter remain the only forms. Legacy single `phase` and removed module names `01-visual|02-content|03-prompts|04-production` SHALL fail validation with migration guidance. During Change 3, the active index SHALL reject any executable lifecycle-4/module-`04-image2-refinement` node.

#### Scenario: Production node uses final metadata

- **WHEN** the HTML production node is indexed
- **THEN** it resolves to lifecycle 3/module `03-html-production`

#### Scenario: Removed module remains in active frontmatter

- **WHEN** a node declares `method_module: 04-production`
- **THEN** validation fails and names `03-html-production` as the final owner

#### Scenario: Phase-4 execution appears too early

- **WHEN** a Change-3 active playbook registers lifecycle 4
- **THEN** validation fails because the directory is README-only unavailable

### Requirement: State schema is explicitly versioned and migrated

`state.yaml` SHALL use schema version 3 while preserving whole-workflow `started_at`, active execution IDs/times, controller working-set rules, stack semantics, typed records, atomic writes, and reserved system records. Read/heal SHALL classify the canonical source marker and apply an ordered, idempotent v1/v2->v3 migration covering final lifecycle/module enums, old playbook/node aliases, pipeline-specific controller rebinding, stack frames, gate evidence, time normalization, and reserved-record normalization.

Known one-to-one mappings SHALL preserve completed/skipped evidence, in-progress/failed status, typed decisions, human waits, execution identity, stack position, gates, and capability freshness records. Markerless legacy gate values/evidence SHALL retain legacy semantics. For HTML-marked v1/v2 state, scalar or legacy content/visual values SHALL be preserved only as migration audit/mirror status and SHALL NOT fabricate `html-content-review` or `html-visual-review`; those authoritative records remain pending until current exact evidence is reviewed. State predating reset support SHALL interpret absence as nullable reset ID null and SHALL not fabricate an `html-production-reset` record during heal. Markerless old create/edit production work SHALL map only to declared legacy maintenance ownership; HTML-marked work SHALL map only to final HTML controllers. Missing/conflicting source marker or one-to-many semantic mappings SHALL return a typed `replacement_required` diagnostic and SHALL not rewrite/clear the original state. Starting a new top-level execution still requires explicit replacement authorization when incomplete and preserves reserved records.

One bounded post-publication exception SHALL prevent legacy-to-HTML migration from stranding deck-root state: when the active execution is the exact source-version `migrate-import` apply node and the requested target contains current verified `_generated/qa/html_migration.json` bound to that source execution ID/plan hash/mode, but no handoff has been recorded, observe mode SHALL return non-writing `migration_handoff_pending` rather than `replacement_required`. It SHALL expose only source/target versions and suggested resume, not output SHAs/paths. The Controller SHALL then use one ordinary atomic state write to complete the source migration execution with that receipt and start the canonical target HTML `migrate-import` continuation at exact node `migration-target-review` (`lifecycle_phase: 3`, `method_module: 03-html-production`, pipeline `html-first-v1`). That continuation SHALL begin with target reset ID null and target content/visual reviews pending and SHALL create no reset record, approval, waiver, delivery review, or copied node completion. Any receipt/state/source/target mismatch remains non-writing `replacement_required`/`CONFLICT`; no generic cross-pipeline execution rebinding is allowed.

#### Scenario: V2 HTML state gains final metadata

- **WHEN** a valid schema-v2 HTML-first state has old module/node names with a one-to-one mapping
- **THEN** heal writes schema 3 with final names and identical execution/evidence/wait semantics
- **AND** a second heal is byte-stable apart from the first migration diagnostic policy

#### Scenario: V2 HTML scalar gates were approved

- **WHEN** an HTML-marked v2 state or metadata contains approved scalar gates but no exact HTML review records
- **THEN** migration preserves the old values for audit/mirror compatibility but leaves authoritative HTML reviews pending
- **AND** Stage 4 remains blocked until current content/visual evidence is reviewed

#### Scenario: V2 markerless production becomes legacy maintenance

- **WHEN** an in-progress markerless deck points to an old whole-page production node
- **THEN** migration rebinds it to the declared legacy controller/node without approving or rerunning work

#### Scenario: Ambiguous migration preserves original state

- **WHEN** the source is missing/conflicting or the old node has no unique semantic successor
- **THEN** read returns a replacement-required action
- **AND** does not silently reset progress or write a guessed current node

#### Scenario: Stack migration preserves suspended execution

- **WHEN** old stack frames contain renamed playbooks/nodes/modules
- **THEN** every unambiguous frame maps with its execution/controller evidence intact

#### Scenario: Incomplete execution is not silently replaced

- **WHEN** the active execution is incomplete and no explicit replacement authorization exists
- **THEN** starting another top-level controller fails without clearing it

#### Scenario: Migration published before state handoff

- **WHEN** an exact target success receipt exists but the active source migration execution has not recorded handoff
- **THEN** state/status report `migration_handoff_pending` without rewriting state
- **AND** resume can atomically complete the source execution and start `migration-target-review`

#### Scenario: Migration receipt does not match active execution

- **WHEN** target receipt plan/mode/source execution differs from deck-root state
- **THEN** no handoff is inferred and the original state remains unchanged

### Requirement: State file is YAML at run bundle root

Every new or actively executing run bundle SHALL contain deck-root `_state/` with durable `state.yaml` (single truth source for execution pointer and authoritative HTML gate evidence); append-only reference-only `history.jsonl` SHALL remain allowed and created on demand. Historical markerless decks MAY lack `_state/` during structure-only check/status compatibility; ordinary check/status SHALL not create it. Entering an explicit legacy controller/resume uses the existing state initialization authority. `state.yaml` SHALL retain active playbook, current node, per-node status, gate decisions/evidence, stack, waits/notes, and deck metadata. `readState`, `appendHistory`, and `readHistory` SHALL retain their existing ownership; `history.jsonl` SHALL not participate in automatic recovery.

Reserved system evidence SHALL reuse the existing state shape rather than add another top-level container. `RESERVED_NODE_IDS` SHALL be exactly `header-review`, `html-content-review`, `html-visual-review`, `html-delivery-review`, and `html-production-reset`. Each HTML reserved record SHALL live only at `nodes[reserved_id].by_version["3_versions/<vN>"]`; its internal `run_version` and all state/metadata mirror companions SHALL use normalized `<vN>`. Reserved records SHALL remain excluded from controller working-set/status transitions, and state migration SHALL preserve other version keys. A record stored under a mismatched key/run-version pair is invalid and SHALL not be selected by current-version readiness.

The only additional allowed file SHALL be transient `_state/gate-approval-journal.json`, owned exclusively by recoverable gate approval. Its absence is normal. Its presence SHALL not independently satisfy a gate. Journal creation SHALL be exclusive and publish canonical JSON containing exactly `schema: pptmaker-html-gate-approval-journal-v1`, opaque `owner_token` (full 64 lowercase hex SHA-256 of canonical owner/run/transaction fields), normalized `owner_host`, positive `owner_pid`, exact `created_at_epoch_ms`, normalized `run_version: vN`, and four 64-lowercase-hex fields `old_state_sha256`, `new_state_sha256`, `old_metadata_sha256`, and `new_metadata_sha256`; no extra evidence/path field is accepted. Precondition SHAs SHALL be rechecked before each commit. While any journal exists, it SHALL be an exclusive write fence for `_state/state.yaml` and metadata gate mirrors: only the matching transaction owner may publish the exact bound new state/mirror. Ordinary node transitions, state-heal rewrites, delivery-review publication, another approval, and unrelated metadata-gate writes SHALL return `CONFLICT` without mutation. Plain observe reads SHALL report journal state without rewriting a healable file. Gate approval SHALL canonicalize/heal state before exclusive journal creation, never after.

Automatic recovery SHALL require exact same host, proven-dead PID, and age at least `GATE_JOURNAL_AUTO_RECOVERY_MIN_AGE_MS = 60000`; active/PID-reused/permission-uncertain owners SHALL cause immediate `CONFLICT`. Recovery SHALL use the exact actual SHA pair: `(old_state,old_metadata)` removes the uncommitted journal without approval; `(new_state,old_metadata)` writes only the planned metadata mirror after revalidation; `(new_state,new_metadata)` removes the completed journal. One bounded reset-race projection SHALL also be recoverable without approval: actual state MUST equal old state except for one same-version valid `html-production-reset: deletion_pending` record plus only matching HTML state mirrors set pending, and actual metadata MUST equal old metadata or old metadata plus only matching HTML metadata mirrors set pending. In that exact case the gate new-state SHA is absent, so the journal owner/recovery SHALL remove the superseded uncommitted gate journal and yield to the reset. `(old_state,new_metadata)` or every other unbound/third SHA remains forbidden/ambiguous. Missing/invalid evidence SHALL require deterministic repair and preserve authoritative state rather than infer approval. Whole-workflow status MAY compose state with artifact status but SHALL not create another persisted phase file.

For a cross-host/otherwise uncertain abandoned journal, automatic recovery is forbidden. After plain state/status exposes exact `owner_token` and the Controller obtains explicit human confirmation that no other deck process/machine is active, `state --recover-gate-journal <owner-token>` MAY invoke explicit recovery only when the token exactly matches and age is at least `GATE_JOURNAL_EXPLICIT_RECOVERY_MIN_AGE_MS = 300000`. A provably active same-host PID remains non-overridable. Token mismatch, younger journal, changed journal bytes, or forbidden/unbound SHA pair fails closed. Explicit recovery applies the same matrix and creates no gate decision.

#### Scenario: Agent resumes without a gate transaction

- **WHEN** no approval is in progress
- **THEN** `_state/state.yaml` and any on-demand `history.jsonl` retain their normal read/resume semantics
- **AND** the journal is absent

#### Scenario: Historical markerless deck lacks state

- **WHEN** structure-only check/status inspects an old markerless deck without `_state/`
- **THEN** compatibility remains valid and no state file is created
- **AND** explicit controller entry applies the existing state initialization path before execution

#### Scenario: Two gate approvals start concurrently

- **WHEN** a second approval observes an existing journal or changed precondition SHA
- **THEN** it recovers the first transaction or fails closed before writing its own evidence
- **AND** cannot overwrite a concurrent gate decision

#### Scenario: Node transition races gate approval

- **WHEN** ordinary `writeState` attempts a node transition while a gate journal exists
- **THEN** it returns `CONFLICT` and does not create a third state SHA

#### Scenario: Plain status sees healable state plus journal

- **WHEN** observe-mode status sees a healable state defect while a journal exists
- **THEN** it reports both conditions without rewriting state
- **AND** recovery/repair occurs through the journal owner path first

#### Scenario: Invalid journal is present

- **WHEN** journal schema, version, path, or SHA evidence is invalid
- **THEN** state read/status reports deterministic repair-required evidence
- **AND** neither metadata nor the journal is treated as gate approval

#### Scenario: Cross-host journal requires human-confirmed token

- **WHEN** a journal owner is another host and remains older than 300000 ms
- **THEN** plain status reports `uncertain` plus its opaque owner token without writing
- **AND** only exact token recovery after human confirmation may apply the normal matrix

#### Scenario: Crash occurs before state publication

- **WHEN** recovery sees both stores at their journal-bound old SHAs
- **THEN** it removes the uncommitted journal and leaves the gate pending

#### Scenario: Metadata-first pair appears

- **WHEN** recovery sees old state SHA and new metadata SHA
- **THEN** it fails closed as a forbidden transition and does not infer state approval

### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL retain `state <runDir>`, `state <runDir> --json`, and `state <runDir> --check-gates`, and add closed HTML-only forms `state <runDir> --recover-gate-journal <owner-token>` and `state <runDir> --record-delivery-review <proceed|repair|redirect> [--reason <text>]` on the same registered command interface. Both forms SHALL be mutually exclusive with JSON/check-gates and each other, resolve through `deckRoot`, and classify the canonical production marker before writes. Recovery SHALL require exact 64-lowercase-hex token plus the human-confirmed/age/owner rules below. Delivery recording SHALL call only `publishHtmlDeliveryDecision(runDir,{decision,reason})`, require reset not pending plus current exact reset ID/delivery/contact-sheet/assembly-v2/notes-v3 evidence and absent journal, require normalized non-empty reason for `repair|redirect`, forbid reason for `proceed`, and accept no reset-ID/digest/path/SHA/timestamp overrides. Existing usable state SHALL use the normal heal path, including only unambiguous schema-v3 migration. A historical markerless deck with no `_state/state.yaml` SHALL be inspected through a non-persisted legacy compatibility projection; state/status/check-gates SHALL not seed a file merely to report it. A marked HTML run with missing, ambiguous, or unusable authoritative state SHALL fail closed with the producer-owned state-repair/replacement diagnostic rather than fall back to metadata.

For markerless legacy, `--check-gates` SHALL retain the existing scalar `isGateApproved` compatibility semantics and exit behavior using only legacy metadata `content_gate|visual_gate` and `_state.gates.content|visual`; every `html_*` mirror/evidence field is ineligible. For `html-first-v1`, `--check-gates` SHALL first invoke the explicit journal-recovery interface, then pass only when no reset is `deletion_pending`, current normalized-version `html-content-review` and `html-visual-review` records exist, their reset IDs equal the current nullable reset ID, their bound complete `approvable: true` plans/audit bytes verify, all current content/system/recipe/page fingerprints are fresh, and the approval journal is absent. Plain human/JSON state and status SHALL inspect/report journal/reset state without recovery writes. Metadata gates or any `_state.gates` scalar mirrors alone SHALL never pass HTML readiness. A pending/stale/missing HTML review SHALL exit `1` with final envelope code `GATE_BLOCKED` and bounded outstanding gate/recipe-key/slide-ID evidence. Active/uncertain journal ownership or `deletion_pending` reset SHALL return `CONFLICT`; invalid journal or forbidden/third-SHA recovery state SHALL fail closed with its repair diagnostic and SHALL not be flattened into approval or ordinary pending status.

Successful human and JSON state output SHALL remain a whole-session resume card and SHALL additionally expose exact `pipeline`, whether durable state is present, and, for HTML, content/visual/delivery-review freshness plus outstanding recipe-key/page coverage. `html-delivery-review` SHALL inform completion/suggested-next but SHALL not become a third gate checked by `--check-gates`. A complete current HTML delivery SHALL not report unavailable Phase-4 refinement as debt. Markerless compatibility output SHALL identify legacy-maintenance ownership without fabricating an active execution record. `workflow_summary` and `suggested_next` remain non-empty; waiting-first semantics and existing optional node fields/stack/gates remain when durable state exists.

#### Scenario: HTML scalar mirrors cannot pass gate check

- **WHEN** an HTML-first run has approved metadata and `_state.gates` scalars but missing or stale authoritative HTML review evidence
- **THEN** `state --check-gates` exits `1` with `GATE_BLOCKED`
- **AND** the diagnostic identifies bounded outstanding review evidence without treating mirrors as authority

#### Scenario: Current HTML reviews pass gate check

- **WHEN** both current-version HTML review records, their audit bytes, fingerprints, and settled journal state verify
- **THEN** `state --check-gates` exits `0`
- **AND** absence of `html-delivery-review` does not turn the two-gate check into a third gate

#### Scenario: Journal owner is active

- **WHEN** HTML gate checking encounters an active or uncertain approval-journal owner
- **THEN** it returns `CONFLICT` immediately
- **AND** neither scalar mirrors nor partial transaction bytes satisfy readiness

#### Scenario: Historical markerless state inspection is non-writing

- **WHEN** a markerless historical deck has no `_state/state.yaml` and Agent runs state, status, or check-gates
- **THEN** legacy compatibility semantics are reported without creating `_state/state.yaml`
- **AND** explicit controller entry remains the authority that initializes durable execution state

#### Scenario: Complete HTML state has no refinement debt

- **WHEN** current HTML gates, delivery, notes, and `html-delivery-review: proceed` verify
- **THEN** the resume card reports completion
- **AND** does not suggest an unavailable lifecycle-4 node or create a placeholder record

#### Scenario: Controller records current final review

- **WHEN** the Controller has shown current HTML delivery and invokes state with `--record-delivery-review proceed`
- **THEN** JS derives and publishes the current version-scoped `html-delivery-review`
- **AND** no third gate or metadata gate field is created

#### Scenario: Repair omits reason

- **WHEN** Controller records `repair` without non-empty `--reason`
- **THEN** the command returns `USAGE` and writes no delivery-review record

#### Scenario: Proceed includes reason

- **WHEN** Controller records `proceed --reason ...`
- **THEN** the command rejects the non-canonical combination before writes

#### Scenario: Caller supplies delivery digest override

- **WHEN** delivery-review state mode receives an unsupported digest/path/SHA/timestamp option
- **THEN** it returns `USAGE` before reading a human decision into state

### Requirement: State writes are atomic

`writeState(deckDir, state, { journalOwnerToken, expectedStateSha } = {})` SHALL retain unique same-directory temp write plus atomic rename and shall ignore stale temp siblings as truth. Every HTML-state mutation SHALL provide the SHA of the exact state snapshot from which its output was derived; markerless compatibility MAY retain existing behavior when no expected SHA is supplied. The writer SHALL verify that SHA before temp creation and immediately before rename. With a journal present, a missing/mismatched token SHALL return `CONFLICT` before temp creation; a matching token SHALL be accepted only when canonical output SHA equals the journal-bound new-state SHA. With `html-production-reset.status: deletion_pending`, every exported non-reset writer SHALL return `CONFLICT`; only the evidence module's internal reset transition with the matching current reset owner token may claim ownership, preserve the exact reset ID, or move its own pending transaction through the specified mirror/completion states. Immediately before rename every HTML writer SHALL recheck unchanged journal bytes/absence as applicable, current-state SHA, and reset status/ID/owner token. Any mismatch SHALL remove only its own temp and fail without replacing state. No ordinary caller SHALL learn or reuse a journal owner token or internal reset-write capability.

#### Scenario: Ordinary state write has no journal

- **WHEN** a node transition writes state and no gate journal exists
- **THEN** the complete old or new YAML is visible through the existing atomic rename contract

#### Scenario: Ordinary writer encounters journal

- **WHEN** `writeState` is called without the exact owner token while a journal exists
- **THEN** it returns `CONFLICT` before creating a temp or changing state

#### Scenario: Journal owner attempts different bytes

- **WHEN** the exact owner token is supplied but canonical state SHA differs from the journal-bound new SHA
- **THEN** write fails closed and leaves the old state/journal unchanged

#### Scenario: Precondition changes before rename

- **WHEN** journal or current-state bytes change after temp creation
- **THEN** the writer removes only its own temp and does not publish

#### Scenario: Ordinary writer races reset start

- **WHEN** a node transition prepares from old state and reset publishes `deletion_pending` before its final rename
- **THEN** the transition's expected-state recheck fails and it cannot overwrite the reset fence

#### Scenario: Reset races uncommitted gate journal

- **WHEN** gate journal creation and reset pending publication overlap but the gate-bound new state was never published
- **THEN** exact reset-only state/metadata projection permits journal cleanup without approval
- **AND** every non-reset third-state projection remains forbidden

### Requirement: state.mjs SAFETY — heal before blaming the user

`readState` SHALL retain tolerant YAML parsing and canonical semantic healing for a usable state, but SHALL classify the source pipeline and read purpose before any replacement write. Its closed purpose SHALL be `observe|execute`; existing execution callers MAY retain `execute` as the compatibility default, while state/status/check paths SHALL pass `observe`. In observe mode, absence on a historical markerless deck returns the non-persisted compatibility projection and SHALL not create `_state`. Explicit controller execution retains initialization authority.

Safe, one-to-one field normalization and schema-v3 migration MAY atomically rewrite existing state while preserving evidence only when no gate journal write fence exists (or when invoked by its exact owner as part of the bound publication). An HTML-marked state that cannot yield a usable object, has ambiguous pipeline/topology, or cannot preserve authoritative review/execution evidence SHALL return typed `replacement_required`, leave the original file bytes/path unchanged, and SHALL not seed a default or rename the only evidence aside. Markerless execute mode MAY retain the existing broken-file backup/default recovery only when legacy ownership is unambiguous and no journal fence exists; observe mode SHALL not create a missing state merely to report it. Controllers SHALL surface normalized repair/replacement guidance without dumping raw YAML or asking novices to repair syntax manually.

#### Scenario: Usable HTML state is normalized safely

- **WHEN** HTML state parses and has a one-to-one healable schema defect
- **THEN** heal preserves executions/reviews and writes canonical schema-v3 state

#### Scenario: Unrecoverable HTML state is preserved

- **WHEN** HTML state cannot be parsed into a usable evidence-preserving object
- **THEN** read returns `replacement_required`
- **AND** does not rename, overwrite, or replace the original state

#### Scenario: Missing historical markerless state is observed

- **WHEN** `readState` is called with `purpose: observe` for a markerless deck with no state
- **THEN** it returns compatibility status without creating `_state`

#### Scenario: Explicit legacy execution may recover state

- **WHEN** unambiguous markerless controller execution reads a broken legacy state in execute mode
- **THEN** the existing backup/default recovery remains available with normalized, non-secret diagnostics

## ADDED Requirements

### Requirement: HTML review readiness has one deep module interface

`scripts/lib/html_review_evidence.mjs` (or an equivalently named single owner) SHALL expose exactly the orchestration-level interfaces `inspectHtmlReviewReadiness(runDir)`, `recoverHtmlGatePublication(runDir, { confirmedOwnerToken } = {})`, `publishHtmlGateDecision(runDir, { gate, planHash, status, waiverReason })`, `publishHtmlDeliveryDecision(runDir, { decision, reason })`, and `resetHtmlProduction(runDir, { confirmedRunVersion })`. It SHALL canonicalize the run/version, classify the marker, resolve immutable plan/artifact bytes, compute current content/system/recipe/page/delivery fingerprints, and own all evidence/journal/reset publication internally. Callers SHALL not pass metadata gates, state records, manifest paths, fingerprints, reset IDs, timestamps, or SHAs as alternate truth. `confirmedOwnerToken` SHALL be accepted only by the explicit human-confirmed CLI route; normal build/check-gates/publication calls SHALL omit it. `confirmedRunVersion` SHALL be accepted only by the closed full-reset CLI route and SHALL exactly equal the normalized target version. Delivery reason SHALL follow the exact decision rules above and be stored for resume, not used as evidence/fingerprint input.

The module SHALL own one `normalizeHumanReason` rule for gate-waiver and delivery repair/redirect reasons: normalize CRLF/CR to LF, trim leading/trailing Unicode whitespace, preserve remaining Unicode scalars without normalization, reject NUL and C0 controls except LF/TAB, require non-empty, and cap serialized UTF-8 at 1024 bytes. Failure diagnostics SHALL report only invalid/missing/too-long classification and SHALL not echo reason text.

`inspectHtmlReviewReadiness` SHALL be strictly read-only, including when a journal or reset transaction exists. `recoverHtmlGatePublication` SHALL operate only on an existing journal using the exact recovery matrix and SHALL never create a new decision: old/old abort-cleanup, new/old mirror completion, new/new cleanup, exact reset-pending takeover cleanup, and old/new or every other third SHA fail closed. Without a token it SHALL allow only same-host dead-owner automatic recovery after 60000 ms. With an exact confirmed token it MAY recover cross-host/uncertain ownership only after 300000 ms and SHALL still reject a provably active same-host PID. `publishHtmlGateDecision` SHALL invoke automatic recovery without a token, canonicalize state, and then create the exclusive fence before publishing. `publishHtmlDeliveryDecision` SHALL require the journal absent, require the current controller node to declare the exact delivery decision, derive the canonical playbook index, and atomically publish both the reserved `html-delivery-review` record and current-execution node decision with an exact evidence reference in one `writeState`; it SHALL not require a later `setNodeDecision`. It SHALL recheck the state precondition before atomic write. `resetHtmlProduction` SHALL own the complete state-first invalidation, HTML-mirror reset, exact generated-owner deletion, and idempotent completion protocol defined below; no Controller or renderer caller may reproduce those steps. Plain state/status and direct `checkBundle` SHALL inspect only. `state --check-gates` and HTML build orchestration SHALL attempt automatic gate-journal recovery then inspect before readiness. Stage-4 readiness and controller completion SHALL consume the resulting snapshot. Tests SHALL cross these same interfaces; clock/filesystem fault seams MAY remain internal. Markerless logic SHALL remain outside this module except for returning a branch-inapplicable classification before writes.

All five orchestration interfaces SHALL remain synchronous, local-filesystem-only, and provider/browser-free so existing synchronous `checkBundle` callers do not change contract. To avoid a `bundle_layout`↔HTML-contract import cycle, the implementation MAY place the single evaluator in internal `html_review_evidence_core.mjs` (or equivalent). `bundle_layout.mjs` SHALL construct its trusted context only from its own canonical constants/resolvers and call that core for pipeline readiness; the public facade SHALL construct the same trusted context through `bundle_layout` exports and call the same core. The core/context interface SHALL not be exported as an alternate orchestration interface. No other caller may supply paths or a prebuilt context. External tests SHALL cover the five public interfaces plus `checkBundle` integration; internal fault seams remain implementation-private.

The inspection snapshot SHALL normalize the public readiness projection without leaking evidence bytes: exact pipeline/run version/state presence; content/visual decision plus `current|stale|missing|invalid`; content review-required; sorted outstanding recipe keys/slide IDs; delivery freshness/typed decision; reset with `status: absent|deletion-pending|complete`, `ownership: none|active|waiting|recoverable|uncertain|invalid`, and nullable non-negative `retry_after_ms`; and journal status `absent|active|uncertain|recoverable-abort|recoverable-mirror|recoverable-cleanup|recoverable-reset-yield|invalid|forbidden` plus optional opaque owner token when non-absent. Reset ownership SHALL be `none` unless pending; live same-host is `active`, dead-but-too-young is `waiting`, dead/old-enough same-host is `recoverable`, valid cross-host/PID-uncertain is `uncertain`, and malformed ownership is `invalid`. `retry_after_ms` SHALL be present only for a valid age-gated owner that has not reached its applicable 60000/300000-ms floor; it SHALL expose no timestamp/host/PID. Internal callers MAY receive the current nullable reset ID/owner proof and additional typed proof handles, but public state/status SHALL not receive reset IDs/tokens, raw SHAs, paths, source content, raw host/PID, or mutable records from which to implement a second validator.

#### Scenario: Metadata-only readiness is evaluated once

- **WHEN** state/status, checkBundle, and Stage 4 inspect the same scalar-approved but evidence-stale HTML run
- **THEN** each consumes the same snapshot and reports blocked readiness
- **AND** no caller independently upgrades the mirrors to approval

#### Scenario: Synchronous checkBundle remains compatible

- **WHEN** an existing caller invokes `checkBundle(runDir, "pipeline")` without `await`
- **THEN** HTML readiness uses the shared core synchronously and returns the existing violation-array shape
- **AND** no browser, provider, or asynchronous initialization starts

#### Scenario: Caller attempts to inject trusted paths

- **WHEN** an orchestration caller tries to pass a preview manifest path, state record, or prebuilt evaluation context
- **THEN** none of the five public interfaces accepts it
- **AND** only the bundle-layout-owned internal context reaches the core

#### Scenario: Approval publication is module-owned

- **WHEN** the CLI publishes a current visual decision
- **THEN** it passes only gate/hash/status/reason to the module
- **AND** the module derives timestamps, evidence, SHAs, journal transitions, and returned snapshot

#### Scenario: Plain status observes an interrupted gate write

- **WHEN** plain state/status encounters a recoverable new-state/old-metadata journal
- **THEN** inspection reports the exact recoverable condition without changing metadata or removing the journal

#### Scenario: Build recovers before readiness

- **WHEN** HTML build encounters that same recoverable journal
- **THEN** orchestration invokes explicit recovery, completes only the planned mirror, removes the journal, and then inspects readiness
- **AND** recovery creates no new approval decision

#### Scenario: Delivery decision encounters a gate fence

- **WHEN** final delivery publication starts while any gate journal exists
- **THEN** it returns `CONFLICT` before reading a human decision into state
- **AND** the gate transaction remains the only state/mirror writer

#### Scenario: Final decision binds current delivery

- **WHEN** a controller records `proceed|repair|redirect`
- **THEN** the module derives and validates current delivery/contact-sheet/assembly/notes lineage before publication
- **AND** callers cannot submit their own digest or receipt SHA

#### Scenario: Delivery evidence and node branch publish atomically

- **WHEN** the current declared final-review node records a valid decision
- **THEN** one atomic state write contains both current `html-delivery-review` and the current-execution node decision referencing it
- **AND** a crash exposes neither a system-only nor node-only decision

#### Scenario: Wrong current node records delivery review

- **WHEN** state current node does not declare the supplied final-review decision
- **THEN** publication fails before mutation and does not attach the decision to another node

### Requirement: Canonical HTML production reset is a version-scoped idempotent transaction

Each normalized HTML run version SHALL have at most one current reserved `html-production-reset` record. Absence means the current reset ID is null. A record SHALL contain exactly `schema: pptmaker-html-production-reset-v1`, `pipeline: html-first-v1`, normalized `run_version`, a cryptographically random 64-lowercase-hex semantic `reset_id`, `status: deletion_pending|complete`, UTC ISO-8601 `started_at`, nullable UTC ISO-8601 `completed_at`, cryptographically random 64-lowercase-hex `owner_token`, normalized `owner_host`, positive `owner_pid`, and exact `owner_claimed_at_epoch_ms`. `completed_at` SHALL be null exactly while pending and non-null exactly when complete; `started_at`/reset ID never change during takeover. Before starting a new reset epoch, the module SHALL preflight bundle-layout's exact canonical owner path. If present it MUST be a real directory rather than a symlink/escaped path. If absent, a new reset is allowed only when authoritative content/visual/delivery review or HTML Stage-4/5 receipt evidence is bound to the current nullable reset ID, proving that lost generated ownership could otherwise revive current human authorization; an absent owner with no such current-epoch authority is not a destructive-reset target. Unsafe ownership fails before state mutation. Starting a newly confirmed reset SHALL atomically publish `deletion_pending` with fresh reset and owner tokens before generated deletion, set only that matching version's `_state.gates.html_content|html_visual` mirrors and exact run-version companions to pending, and preserve legacy mirrors, authoritative decisions, execution history, source, and control. The new reset ID becomes current immediately; existing content/visual/delivery records remain immutable audit but stale because their bound reset ID no longer matches.

The reset record itself SHALL be the durable transaction marker and exclusive HTML-production fence. While `deletion_pending`, canonical HTML page/final-slide/preview publication, build, Stage 4, gate decision publication, delivery decision publication, and any non-reset HTML mirror/state heal SHALL return `CONFLICT`; plain inspection SHALL report `deletion-pending` without writes. Reset start SHALL first observe the gate journal absent and use state SHA compare-and-swap to publish pending state. If a gate journal was concurrently created from the same old state, neither operation may publish over the other: the reset stops before metadata/deletion until the journal owner or authorized recovery recognizes only the exact reset-pending takeover projection and removes that uncommitted journal.

Only the current reset `owner_token` may perform metadata, deletion, or completion steps. Another invocation observing `deletion_pending` SHALL never merely join the deletion. Exact same-host proven-live ownership returns `CONFLICT`. Exact same-host proven-dead ownership MAY be claimed automatically only after `RESET_AUTO_RECOVERY_MIN_AGE_MS = 60000`; cross-host/PID-reused/permission-uncertain valid ownership MAY be claimed only after `RESET_EXPLICIT_RECOVERY_MIN_AGE_MS = 300000` through the same exact-version human-confirmed reset route, and a proven-live same-host PID remains non-overridable. Claiming SHALL require the gate journal absent, then atomically replace only owner token/host/PID/claim time through expected-state compare-and-swap while retaining reset ID/status/start time; every competing claimant must then re-read and yield to the single winner. Missing/malformed/clock-invalid owner fields fail closed as state corruption rather than permit deletion. The owner token/reset ID SHALL remain internal and never appear in public state/status or CLI success output.

The current reset owner SHALL publish only the matching-version metadata `html_content_gate|html_visual_gate` statuses and run-version companions as pending while preserving all other metadata, using metadata SHA compare-and-swap. It SHALL re-read and verify journal absence, unchanged reset ID/owner token/record bytes, and metadata precondition before and after that mirror write and immediately before deletion. An active/unrecovered gate-approval journal, unusable state, marker/version mismatch, metadata drift, lost ownership, or changed pending record SHALL block deletion.

After the state-first fence and mirrors verify, the module SHALL resolve exactly the canonical target run's `_generated/html_production/` owner through bundle-layout-owned paths. If present it SHALL still be the same real directory class and SHALL not have been replaced by a symlink/escaped path; otherwise deletion fails while retaining the fence. The module SHALL remove the whole owner without selecting individual locks, objects, plans, or manifests. If the owner was already absent under the allowed current-authority-loss preflight, or an exact owned pending retry finds it absent, deletion is already satisfied rather than an error. It SHALL verify absence, recheck unchanged ownership, and then atomically replace only the matching reset record with `status: complete` and `completed_at`, retaining the same reset ID/start timestamp and final owner claim. A crash after the first state write is deliberately over-invalidating: retry with the same confirmed run version SHALL detect `deletion_pending`, safely claim it under the age/owner matrix, retain its reset ID, finish any pending mirror/deletion/completion steps, and SHALL NOT rotate another ID. A retry that finds `complete` plus an absent generated owner SHALL return idempotent success without an owner claim only when no authoritative review/delivery or HTML Stage-4/5 receipt is bound to that completed reset ID. If current-epoch authority was published after completion and the owner later disappeared, the next confirmed reset SHALL rotate a new reset ID even though the owner is absent. A later explicitly confirmed reset MAY otherwise rotate a new ID only when no reset is pending and canonical generated ownership exists again. Deletion or final-state failure SHALL leave `deletion_pending` as a visible safe fence and exact retry action; it SHALL never restore prior approval.

Every canonical HTML content/visual review plan, gate record, delivery-review record, current HTML-production manifest/receipt, and HTML Stage-4/5 receipt SHALL carry `html_production_reset_id` equal to the current reset ID or null when no reset has occurred. Review-plan hashing SHALL include this field; composition/final-slide fingerprints and raw HTML/PNG/contact-sheet bytes SHALL exclude it. Approval, Stage 4, Stage 5, delivery publication, final-review completion, and post-approval freshness SHALL require exact reset-ID equality in addition to their existing byte/fingerprint checks. Migration-preview evidence SHALL carry null and remain scope-ineligible. The separate target `html_migration.json` remains publication/handoff provenance rather than review/delivery authority and is not relabeled into this epoch. Thus byte-identical rebuilds retain content identity but cannot revive a pre-reset review hash, approval, delivery decision, or completion.

#### Scenario: Reset crashes after state invalidation

- **WHEN** reset publishes `deletion_pending` but stops before metadata reset, deletion, or completion
- **THEN** all prior HTML reviews are already stale and canonical publication remains fenced
- **AND** the same command resumes the same reset ID rather than creating another invalidation epoch

#### Scenario: Byte-identical rebuild follows reset

- **WHEN** clean local rebuild reproduces the same HTML, PNG, contact sheet, fingerprints, and delivery digest
- **THEN** its reset-bound review plan differs from the pre-reset plan and old gates/delivery review remain stale

#### Scenario: Completed reset is retried after response loss

- **WHEN** the reset record is `complete`, `_generated/html_production/` is absent, and no authority is bound to that reset ID
- **THEN** retry returns idempotent success without changing state, metadata, or reset ID

#### Scenario: Generated owner disappears after reapproval

- **WHEN** canonical generated ownership is absent but content/visual/delivery or Stage-4/5 evidence is bound to the current reset ID
- **THEN** direct rebuild is blocked and confirmed reset rotates a new ID even when there are no generated bytes left to delete

#### Scenario: Unapproved preview owner disappears

- **WHEN** generated ownership is absent and no authoritative review/delivery or Stage-4/5 receipt is bound to the current reset ID
- **THEN** ordinary local preview may rebuild without inventing a reset epoch

#### Scenario: Two reset commands overlap

- **WHEN** a second reset invocation sees the first reset owner PID proven live
- **THEN** it returns `CONFLICT` and does not write metadata, delete the owner, or mark completion

#### Scenario: Dead reset owner is resumed

- **WHEN** the same-host reset owner is proven dead for at least 60000 ms
- **THEN** one claimant atomically installs a new owner token while retaining the reset ID and resumes the transaction
- **AND** competing claimants observe that new live owner and do not delete concurrently

#### Scenario: Cross-host reset owner is uncertain

- **WHEN** a valid pending reset belongs to another/uncertain host and is at least 300000 ms old
- **THEN** only the exact-version human-confirmed reset route may claim and resume it
- **AND** a proven-live same-host owner remains non-overridable

#### Scenario: New writer attempts publication during deletion

- **WHEN** a canonical publisher observes `html-production-reset.status: deletion_pending`
- **THEN** it fails with `CONFLICT` before lock/object/manifest creation

### Requirement: HTML content and visual gate evidence is versioned and pipeline-specific

State SHALL reserve `html-content-review` and `html-visual-review` in addition to legacy `header-review`. A published current HTML record SHALL be scoped by normalized run version and contain common fields exact `schema: pptmaker-html-gate-review-v1`, `gate: content|visual` matching its reserved ID, `pipeline: html-first-v1`, normalized `run_version`, status `approved|waived`, nullable `waiver_reason` (null for approved, normalized non-empty for waived), 64-lowercase-hex `review_plan_hash`, nullable `html_production_reset_id` equal to the current reset ID, and UTC ISO-8601 `decided_at`, plus only the gate-owned content/visual evidence fields defined below. Absent or stale record means pending. Approval-time validation requires the plan to be current and bound to that same reset ID. Post-approval freshness SHALL require reset-ID equality, immutable plan/artifact audit bytes to verify, and current owning content/system/page fingerprints to match, but SHALL NOT require the old plan to remain the preview manifest's current pointer. HTML SHALL have no partially approved gate state. `_state` evidence SHALL be authoritative for HTML readiness. HTML status mirrors SHALL use only `_state.gates.html_content|html_visual` with their exact `*_run_version` companions and metadata `html_content_gate|html_visual_gate` with exact `*_run_version` companions. Legacy SHALL continue to own only `_state.gates.content|visual` and metadata `content_gate|visual_gate`; HTML publication SHALL not mutate those four legacy fields. Neither mirror family may satisfy the other pipeline, and no scalar alone may authorize HTML Stage 4.

`content_review_fingerprint_v1` SHALL hash the ordered human-reviewed content projection: stable IDs/order, headers, `visual_type`, concept, family body/callout fields, and structured fallback/brief semantics. It SHALL exclude notes, theme/runtime, source locators, and selection transport.

The visual record SHALL bind `visual_system_fingerprint_v1` over global resolved visual config/runtime/family-registry and renderer/component/chart/recipe/compositor versions. It SHALL bind every current `component_recipe_key_v1`, defined as SHA-256 of canonical JSON containing family, geometry variant, ordered typed-block kinds, chart kind/series-category counts/formatter/legend resolution, and primary-visual kind/abstract recipe/icon-layout discriminator while excluding ordinary text, chart numeric values, and asset bytes. Keys SHALL sort by hash; each representative SHALL be the code-unit-smallest current stable ID for that key, independent of position. Its effective output SHALL be shown, plus forced-fallback when current selection hides fallback. Representative deletion SHALL select the next ID and stale that key's evidence. `page_visual_dependency_fingerprint_v1` SHALL separately hash page visual type, component recipe key, ordered finite chart numeric values (not labels), primary placement/fit/focal point, effective fallback/selection state, and referenced fallback/selected/inline-icon asset IDs/SHAs. It SHALL exclude global system inputs, ordinary visible copy, notes, and position. Each page review SHALL bind that dependency fingerprint plus exact shown effective and applicable forced-fallback composition/preview SHAs for audit. Freshness SHALL compare the two disjoint fingerprints by their owning scope.

Gate dual-write SHALL be recoverable through transient `_state/gate-approval-journal.json`: an exclusively and atomically published journal SHALL bind owner token/host/PID/epoch-ms start plus old/new `_state` and metadata SHAs, authoritative `_state` evidence SHALL publish first, metadata mirror second, and journal removal last. Same-host proven-dead automatic recovery requires 60000 ms; cross-host/uncertain explicit token recovery requires 300000 ms plus prior human confirmation; a proven-active same-host PID remains blocked. Every recovery SHALL apply the exact old/old abort, new/old mirror-complete, new/new cleanup, exact reset-pending takeover cleanup, and old/new-or-other-third-SHA fail-closed matrix above and SHALL create no decision. A metadata-first, metadata-only, missing/invalid-journal, or ambiguous partial write SHALL not satisfy HTML readiness.

#### Scenario: Copy edit preserves deck visual approval

- **WHEN** ordinary body copy changes without visual-system/family/fallback change
- **THEN** deck visual-system evidence remains current
- **AND** content approval becomes stale when the reviewed content projection changes

#### Scenario: Notes-only edit preserves content approval

- **WHEN** only speaker notes change
- **THEN** the content fingerprint and content approval remain current

#### Scenario: New component recipe invalidates deck visual approval

- **WHEN** a current plan introduces an uncovered component recipe key
- **THEN** visual gate becomes stale until representative HTML output is reviewed

#### Scenario: One fallback asset changes

- **WHEN** valid source updates a page-local fallback asset
- **THEN** only that slide's page review becomes stale
- **AND** approval requires forced-fallback preview evidence

#### Scenario: Covered recipe changes locally

- **WHEN** a slide changes to a component recipe key already covered by current deck approval
- **THEN** only that page review becomes stale
- **AND** unaffected system coverage remains approved

#### Scenario: Global system changes

- **WHEN** global visual config/runtime/renderer versions change while page-local dependencies do not
- **THEN** deck-level representatives for every current recipe key become stale
- **AND** page-local dependency fingerprints do not all stale merely by duplicating the global inputs

#### Scenario: Pure reorder preserves representatives

- **WHEN** slides reorder without membership/recipe changes
- **THEN** code-unit representative IDs and coverage evidence remain unchanged

#### Scenario: Selected representative hides fallback

- **WHEN** a recipe representative has a current selected visual
- **THEN** review evidence includes both effective and forced-fallback output

#### Scenario: Chart values change shape

- **WHEN** chart numeric values change while its recipe key stays covered
- **THEN** only that page's visual dependency review becomes stale in addition to content review

#### Scenario: Ordinary chart label copy changes

- **WHEN** labels change without counts, formatter, values, or other visual dependency change
- **THEN** content/overflow checks rerun but page visual approval remains current

#### Scenario: Copy rebuild replaces current preview

- **WHEN** a copy-only rebuild publishes a newer preview manifest while approved visual projections still match
- **THEN** prior immutable review evidence remains valid audit and visual approval stays current

#### Scenario: Metadata mirror is ahead of state

- **WHEN** metadata says `approved` but authoritative current-version HTML evidence is absent or stale
- **THEN** HTML Stage 4 remains blocked

#### Scenario: Gate write stops after state commit

- **WHEN** authoritative `_state` publication succeeds but metadata mirror publication is interrupted
- **THEN** the pending journal permits deterministic mirror healing
- **AND** no ambiguous evidence is treated as current

#### Scenario: Scoped preview omits another stale page

- **WHEN** visual preview shows A but B also has outstanding page evidence
- **THEN** its review plan is `approvable: false`, lists B, and cannot publish gate evidence

#### Scenario: Complete visual plan is approved

- **WHEN** shown evidence covers every outstanding representative/page dependency and remains current
- **THEN** the exact approvable plan may publish one approved visual record

### Requirement: State and status expose complete delivery without optional-refinement debt

State SHALL reserve version-scoped `html-delivery-review` as system evidence, not a third pipeline gate. The record SHALL bind exact `schema: pptmaker-html-delivery-review-v1`, `pipeline: html-first-v1`, normalized `run_version`, current nullable `html_production_reset_id`, HTML delivery digest, effective contact-sheet manifest/path/SHA, assembly schema-v2 receipt path/SHA and PPTX SHA, notes schema-v3 receipt path/SHA, typed human `decision: proceed|repair|redirect`, nullable normalized `reason` (null for proceed, required for repair/redirect), and UTC ISO-8601 `decided_at`. JS SHALL validate exact reset-ID equality and current bytes/lineage before recording or accepting `proceed`; MD Controller SHALL show the contact sheet plus PPTX/notes result and obtain the decision. Any reset-ID, delivery, PPTX, or notes-receipt change SHALL stale the record. The same atomic state publication SHALL write the current final-review node's typed decision with current execution ID and exact reference to this system record; checkpoint/verification branching SHALL accept only that referenced decision and SHALL not rely on an unbound prior conversation or duplicate later state write.

`repair|redirect` SHALL additionally persist normalized non-empty human reason; `proceed` SHALL have no reason. Reason SHALL not enter delivery freshness/fingerprint and SHALL not be echoed in failure diagnostics. On resume, `repair` routes its reason through pipeline-first change classification to the owning source/system/production repair node. For `create-deck`, `redirect` SHALL retain explicit reset-to-`checkpoint-intake` semantics and clear downstream current-execution completion before re-intake. For HTML iteration controllers, redirect SHALL enter shared classification and require a separate typed target in exact set `edit-text|edit-visual|edit-notes|restructure-slides|create-deck|stop`; `legacy-image2-maintenance` is invalid for an HTML run. `stop` SHALL leave the current controller incomplete, set `waiting_for: user:resume-or-replace`, and make resume report a user pause rather than Phase-4 debt or an automatic next node. Free text SHALL not auto-switch playbooks.

When HTML Stage 1-5 receipts, content/visual gates, and `html-delivery-review: proceed` are current, status/resume SHALL report the deck complete even though no modern Phase-4 execution or Image2 directory exists. It SHALL not create a placeholder node, authorization, reserved refinement record, or suggested required action. Markerless decks SHALL report their legacy maintenance ownership separately.

#### Scenario: User stops after HTML delivery

- **WHEN** current HTML PPTX/notes/final review exist
- **THEN** status reports a complete deliverable and no pending refinement

#### Scenario: Notes change after final review

- **WHEN** Stage 5 publishes a new notes receipt/PPTX after `html-delivery-review: proceed`
- **THEN** prior delivery review becomes stale and status requests current final review

#### Scenario: Reset transaction is complete but deck is not rebuilt

- **WHEN** `html-production-reset.status` is `complete` while current reset-bound production/gates/delivery are missing
- **THEN** status reports reset deletion complete but deck completion false with local rebuild/re-review next action

#### Scenario: Final review chooses repair

- **WHEN** the human chooses `repair`
- **THEN** completion remains false and the controller routes to the owning repair node

#### Scenario: Final review chooses redirect

- **WHEN** the human chooses `redirect` with a reason
- **THEN** completion remains false and create-deck returns to intake or an iteration controller requests one exact typed target
- **AND** does not infer a destination playbook from the reason alone or enter legacy maintenance for HTML

### Requirement: Playbook index reserves final system evidence and enforces pipeline ownership

The canonical index/state reserved-ID registry SHALL reserve exactly `header-review`, `html-content-review`, `html-visual-review`, `html-delivery-review`, and `html-production-reset`, validate controller-level supported pipeline declarations, reject cross-pipeline entry conditions, and verify that Change-3 active nodes do not target unavailable Phase 4. None of those IDs may be declared as a controller node.

#### Scenario: Controller declares reserved review node

- **WHEN** a playbook declares `node: html-content-review`, `html-visual-review`, `html-delivery-review`, or `html-production-reset`
- **THEN** validation fails because the ID is system evidence

#### Scenario: Legacy controller allows HTML pipeline

- **WHEN** legacy maintenance declares or is entered with `html-first-v1`
- **THEN** index/entry validation fails closed
