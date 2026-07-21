## MODIFIED Requirements

### Requirement: Node frontmatter defines entry and exit gates

Every registered node SHALL declare globally unique kebab-case `node`, `lifecycle_phase` in exact set
`0|1|2|3|4|5`, `method_module` in exact set
`00-setup|01-content|02-visual-system|03-html-production|04-image2-refinement|05-iteration`, ordered
`requires`, deterministic `entry`, and `exit`; routing gates SHALL declare unique allowed decisions.
Fenced controller YAML and standalone shared-node frontmatter remain the only forms. Legacy single
`phase` and removed module names `01-visual|02-content|03-prompts|04-production` SHALL fail validation
with migration guidance. The active index SHALL permit lifecycle 4/module `04-image2-refinement` only
for nodes owned by `image2-refine`. Its controller entry SHALL require a marked HTML-first run with
identifiable current final-slide/slot inputs; normal planning additionally requires current
`html-delivery-review: proceed` with complete evidence, while forced planning must publish the explicit Phase-4 prerequisite
waiver before authorization nodes become eligible. All other controllers reject that lifecycle/module.

#### Scenario: Production node uses final metadata

- **WHEN** the HTML production node is indexed
- **THEN** it resolves to lifecycle 3/module `03-html-production`

#### Scenario: Removed module remains in active frontmatter

- **WHEN** a node declares `method_module: 04-production`
- **THEN** validation fails and names `03-html-production` as the final owner

#### Scenario: Unowned Phase 4 node is registered

- **WHEN** a controller other than `image2-refine` declares lifecycle 4
- **THEN** validation fails with an ownership diagnostic

#### Scenario: Phase 4 plan starts from an explicit prerequisite waiver

- **WHEN** `image2-refine` has a current prerequisite waiver and valid HTML final-slide/slot inputs
- **THEN** entry validation permits the offline planning node
- **AND** authorization and provider generation remain separate exit requirements

### Requirement: CLI exposes state via ppt_flow state command

`scripts/ppt_flow.mjs` SHALL retain `state <runDir>`, `state <runDir> --json`, and `state <runDir>
--check-gates`, plus closed HTML-only forms `state <runDir> --recover-gate-journal <owner-token>` and
`state <runDir> --record-delivery-review <proceed|repair|redirect> [--force] [--reason <text>]` on the
same registered command interface. Both forms SHALL be mutually exclusive with JSON/check-gates and
each other, resolve through `deckRoot`, and classify the canonical production marker before writes.
Recovery SHALL require an exact 64-lowercase-hex token plus the human-confirmed/age/owner rules.
Delivery recording SHALL call only `publishHtmlDeliveryDecision(runDir,{decision,reason,force})`,
require reset not pending and journal absent, derive current delivery identity itself, require a
normalized non-empty reason for `repair|redirect` or forced `proceed`, forbid a reason for normal
`proceed`, and accept no reset-ID/digest/path/SHA/timestamp overrides. Normal proceed SHALL require
complete current contact-sheet/assembly-v2/notes-v3 evidence. Forced proceed SHALL require current
target-version PPTX and contact-sheet bytes and MAY waive missing/stale lineage evidence; missing
reviewable artifacts, ambiguous target identity, unsafe paths, invalid state, or concurrency conflicts
remain hard stops. `repair|redirect` SHALL retain their complete-current-evidence requirement. Existing usable state SHALL use the normal heal path, including only unambiguous
schema-v3 migration. A historical markerless deck with no `_state/state.yaml` SHALL be inspected through
a non-persisted legacy compatibility projection; state/status/check-gates SHALL not seed a file merely
to report it. A marked HTML run with missing, ambiguous, or unusable authoritative state SHALL fail
closed with the producer-owned state-repair/replacement diagnostic rather than fall back to metadata.

For markerless legacy, `--check-gates` SHALL retain the existing scalar `isGateApproved` compatibility
semantics and exit behavior using only legacy metadata `content_gate|visual_gate` and
`_state.gates.content|visual`; every `html_*` mirror/evidence field is ineligible. For `html-first-v1`,
`--check-gates` SHALL first invoke the explicit journal-recovery interface, then pass only when no reset
is `deletion_pending`, current normalized-version `html-content-review` and `html-visual-review` records
exist, their reset IDs equal the current nullable reset ID, each record has current source/projection and
recorded plan/artifact audit bytes, all owning content/system/recipe/page fingerprints are fresh, and the
approval journal is absent. An approved record SHALL additionally require complete plan evidence; an
incomplete waived record SHALL instead require its bounded reason/check snapshot and current computable
projection. Plain human/JSON state and status SHALL inspect/report journal/reset state without recovery
writes. Metadata gates or `_state.gates` scalar mirrors alone SHALL never pass HTML readiness. A
pending/stale/missing HTML review SHALL exit `1` with final envelope code `GATE_BLOCKED` and bounded
outstanding gate/recipe-key/slide-ID evidence. Active/uncertain journal ownership or `deletion_pending`
reset SHALL return `CONFLICT`; invalid journal or forbidden/third-SHA recovery state SHALL fail closed
with its repair diagnostic and SHALL not be flattened into approval or ordinary pending status.

Successful human and JSON state output SHALL remain a whole-session resume card and SHALL additionally
expose exact `pipeline`, whether durable state is present, and, for HTML, content/visual/delivery-review
decision, identity freshness, evidence completeness, waived checks, and outstanding recipe-key/page
coverage. `html-delivery-review` SHALL inform completion/suggested-next but SHALL not become a third gate
checked by `--check-gates`. A current user-accepted HTML delivery SHALL not report unavailable Phase-4
refinement as debt; incomplete evidence SHALL produce a repair recommendation without undoing the
current decision. Markerless compatibility output SHALL identify legacy-maintenance ownership without
fabricating an active execution record. `workflow_summary` and `suggested_next` remain non-empty;
waiting-first semantics and existing optional node fields/stack/gates remain when durable state exists.

#### Scenario: HTML scalar mirrors cannot pass gate check

- **WHEN** an HTML-first run has approved metadata and `_state.gates` scalars but missing or stale authoritative HTML review evidence
- **THEN** `state --check-gates` exits `1` with `GATE_BLOCKED`
- **AND** the diagnostic identifies bounded outstanding review evidence without treating mirrors as authority

#### Scenario: Current HTML reviews pass gate check

- **WHEN** both current-version HTML review decisions, their required audit/current-projection evidence, and settled journal state verify
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
- **AND** it does not suggest an unavailable lifecycle-4 node or create a placeholder record

#### Scenario: Controller records current final review

- **WHEN** the Controller has shown current HTML delivery and invokes state with `--record-delivery-review proceed`
- **THEN** JS derives and publishes the current version-scoped `html-delivery-review`
- **AND** no third gate or metadata gate field is created

#### Scenario: Repair omits reason

- **WHEN** Controller records `repair` without non-empty `--reason`
- **THEN** the command returns `USAGE` and writes no delivery-review record

#### Scenario: Proceed includes reason

- **WHEN** Controller records `proceed --reason ...` without `--force`
- **THEN** the command rejects the non-canonical combination before writes

#### Scenario: Forced proceed records an evidence waiver

- **WHEN** Controller records `proceed --force --reason ...` for current reviewable PPTX/contact-sheet bytes with incomplete lineage
- **THEN** the command publishes current user acceptance with `evidence_complete: false` and bounded `waived_checks`
- **AND** it does not invent missing receipt fields

#### Scenario: Caller supplies delivery digest override

- **WHEN** delivery-review state mode receives an unsupported digest/path/SHA/timestamp option
- **THEN** it returns `USAGE` before reading a human decision into state

### Requirement: HTML review readiness has one deep module interface

`scripts/shared/state/html_review_evidence.mjs` (or an equivalently named single owner) SHALL expose
exactly the orchestration-level interfaces `inspectHtmlReviewReadiness(runDir)`,
`recoverHtmlGatePublication(runDir, { confirmedOwnerToken } = {})`,
`publishHtmlGateDecision(runDir, { gate, planHash, status, waiverReason })`,
`publishHtmlDeliveryDecision(runDir, { decision, reason, force = false })`, and
`resetHtmlProduction(runDir, { confirmedRunVersion })`. It SHALL canonicalize the run/version, classify
the marker, resolve immutable plan/artifact bytes, compute current
content/system/recipe/page/notes/delivery projections, and own all evidence/journal/reset publication
internally. Callers SHALL not pass metadata gates, state records, manifest paths, fingerprints, reset
IDs, timestamps, or SHAs as alternate truth. `confirmedOwnerToken` SHALL be accepted only by the
explicit human-confirmed CLI route; normal build/check-gates/publication calls SHALL omit it.
`confirmedRunVersion` SHALL be accepted only by the closed full-reset CLI route and SHALL exactly equal
the normalized target version. Gate and delivery reasons SHALL be stored for resume/audit and SHALL not
enter freshness fingerprints.

The module SHALL own one `normalizeHumanReason` rule for gate waiver, forced delivery proceed, and
delivery repair/redirect reasons: normalize CRLF/CR to LF, trim leading/trailing Unicode whitespace,
preserve remaining Unicode scalars without normalization, reject NUL and C0 controls except LF/TAB,
require non-empty, and cap serialized UTF-8 at 1024 bytes. Failure diagnostics SHALL report only
invalid/missing/too-long classification and SHALL not echo reason text.

`inspectHtmlReviewReadiness` SHALL be strictly read-only, including when a journal or reset transaction
exists. `recoverHtmlGatePublication` SHALL operate only on an existing journal using the exact recovery
matrix and SHALL never create a new decision: old/old abort-cleanup, new/old mirror completion, new/new
cleanup, exact reset-pending takeover cleanup, and old/new or every other third SHA fail closed. Without
a token it SHALL allow only same-host dead-owner automatic recovery after 60000 ms. With an exact
confirmed token it MAY recover cross-host/uncertain ownership only after 300000 ms and SHALL still reject
a provably active same-host PID.

`publishHtmlGateDecision` SHALL invoke automatic recovery without a token, canonicalize state, and then
create the exclusive fence before publishing. Approval SHALL require the exact current complete plan.
Waiver SHALL require current source/projection/reset/version identity and a normalized reason; `planHash`
MAY be null only when complete plan evidence is unavailable, and any supplied hash SHALL match exactly.
The module SHALL compute evidence completeness and bounded waived checks rather than accept them from a
caller. `publishHtmlDeliveryDecision` SHALL require the gate journal absent, require the current
controller node to declare the exact delivery decision, derive the canonical playbook index, and
atomically publish both the reserved `html-delivery-review` record and current-execution node decision
with an exact evidence reference in one `writeState`; it SHALL not require a later `setNodeDecision`.
Normal proceed SHALL require complete current delivery lineage. Forced proceed SHALL require current
reviewable target-version PPTX/contact-sheet bytes and a normalized reason, derive the missing/stale
lineage checks, and SHALL not invent absent artifacts. The module SHALL recheck the state precondition
before atomic write.

`resetHtmlProduction` SHALL own the complete state-first invalidation, HTML-mirror reset, exact
generated-owner deletion, and idempotent completion protocol defined by the main specification; no
Controller or renderer caller may reproduce those steps. Plain state/status and direct `checkBundle`
SHALL inspect only. `state --check-gates` and HTML build orchestration SHALL attempt automatic
gate-journal recovery then inspect before readiness. Stage-4 readiness and controller completion SHALL
consume the resulting snapshot. Tests SHALL cross these same interfaces; clock/filesystem fault seams
MAY remain internal. Markerless logic SHALL remain outside this module except for returning a
branch-inapplicable classification before writes.

All five orchestration interfaces SHALL remain synchronous, local-filesystem-only, and
provider/browser-free so existing synchronous `checkBundle` callers do not change contract. To avoid a
`bundle_layout` to HTML-contract import cycle, the implementation MAY place the single evaluator in
internal `html_review_evidence_core.mjs` (or equivalent). `bundle_layout.mjs` SHALL construct its trusted
context only from its own canonical constants/resolvers and call that core for pipeline readiness; the
public facade SHALL construct the same trusted context through `bundle_layout` exports and call the same
core. The core/context interface SHALL not be exported as an alternate orchestration interface. No
other caller may supply paths or a prebuilt context. External tests SHALL cover the five public
interfaces plus `checkBundle` integration; internal fault seams remain implementation-private.

The inspection snapshot SHALL normalize the public readiness projection without leaking evidence bytes:
exact pipeline/run version/state presence; content/visual decision, `current|stale|missing|invalid`,
independent evidence completeness, and bounded waived checks; content review-required; sorted
outstanding recipe keys/slide IDs; delivery freshness/typed decision/evidence completeness/waived checks;
reset with `status: absent|deletion-pending|complete`, `ownership:
none|active|waiting|recoverable|uncertain|invalid`, and nullable non-negative `retry_after_ms`; and
journal status
`absent|active|uncertain|recoverable-abort|recoverable-mirror|recoverable-cleanup|recoverable-reset-yield|invalid|forbidden`
plus optional opaque owner token when non-absent. Reset ownership SHALL be `none` unless pending; live
same-host is `active`, dead-but-too-young is `waiting`, dead/old-enough same-host is `recoverable`, valid
cross-host/PID-uncertain is `uncertain`, and malformed ownership is `invalid`. `retry_after_ms` SHALL be
present only for a valid age-gated owner that has not reached its applicable 60000/300000-ms floor; it
SHALL expose no timestamp/host/PID. Internal callers MAY receive the current nullable reset ID/owner
proof and additional typed proof handles, but public state/status SHALL not receive reset IDs/tokens,
raw SHAs, paths, source content, raw host/PID, or mutable records from which to implement a second
validator.

Public `evidence_complete` SHALL be `true|false|null`; null means no valid record establishes that fact.
Public `waived_checks` SHALL be the canonical stored list or `[]` when no valid waiver record exists,
never a reconstruction from free-form diagnostics.

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
- **AND** the module derives timestamps, evidence, SHAs, journal transitions, completeness, and returned snapshot

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
- **THEN** the module derives and validates every artifact required by that decision mode before publication
- **AND** callers cannot submit their own digest or receipt SHA

#### Scenario: Delivery evidence and node branch publish atomically

- **WHEN** the current declared final-review node records a valid decision
- **THEN** one atomic state write contains both current `html-delivery-review` and the current-execution node decision referencing it
- **AND** a crash exposes neither a system-only nor node-only decision

#### Scenario: Wrong current node records delivery review

- **WHEN** state current node does not declare the supplied final-review decision
- **THEN** publication fails before mutation and does not attach the decision to another node

### Requirement: HTML content and visual gate evidence is versioned and pipeline-specific

State SHALL reserve `html-content-review` and `html-visual-review` in addition to legacy
`header-review`. New HTML gate writes SHALL use exact schema `pptmaker-html-gate-review-v2` and remain
scoped under `nodes[reserved_id].by_version["3_versions/<vN>"]`. A record SHALL contain `gate:
content|visual` matching its reserved ID, `pipeline: html-first-v1`, normalized `run_version`, status
`approved|waived`, nullable normalized `waiver_reason`, nullable 64-lowercase-hex
`review_plan_hash`, nullable `html_production_reset_id` equal to the current reset ID, UTC ISO-8601
`decided_at`, `evidence_complete: boolean`, bounded `waived_checks`, and only the gate-owned evidence
fields defined below. Readers SHALL accept valid current v1 records and project them as complete; new
writes SHALL use v2 without rewriting valid historical records.

`waived_checks` SHALL be a canonically sorted, duplicate-free array of at most 64 exact objects
`{code, subject}`. `code` SHALL match `[a-z][a-z0-9_]{0,63}`. `subject` SHALL be null or exact
`{kind,id}`, where `kind` is `gate|slide|recipe|artifact|receipt` and `id` SHALL match
`[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. Entries SHALL sort by code, then nullable kind, then nullable ID
using code-unit order.
The array SHALL contain no authored prose, reason text, absolute path, prompt/provider body, or secret.

Approval SHALL require a complete current plan, `evidence_complete: true`, empty `waived_checks`, a
null reason, and exact plan audit. Waiver SHALL require a normalized non-empty reason and current
source/projection/reset/version identity. A complete intentional waiver MAY have
`evidence_complete: true` with empty `waived_checks`; an incomplete waiver SHALL have
`evidence_complete: false`, non-empty bounded `waived_checks`, and MAY omit the review-plan hash when
no complete current plan exists. Any supplied plan hash SHALL verify and match the current plan.
Identity freshness and evidence completeness SHALL be reported separately. A stale/mismatched supplied
hash, ambiguous version/reset, active journal, corrupted state, invalid source, or unsafe path SHALL
remain a hard stop and SHALL NOT publish a decision.

Post-decision freshness SHALL require reset-ID equality, every recorded immutable plan/artifact audit
byte to verify, and current owning content/system/page fingerprints to match, but SHALL NOT require an
old plan to remain the preview manifest's current pointer. HTML SHALL have no partially published gate
state. `_state` evidence SHALL be authoritative for HTML readiness. HTML status mirrors SHALL use only
`_state.gates.html_content|html_visual` with exact `*_run_version` companions and metadata
`html_content_gate|html_visual_gate` with exact `*_run_version` companions. Legacy SHALL continue to
own only `_state.gates.content|visual` and metadata `content_gate|visual_gate`; HTML publication SHALL
not mutate those fields. Neither mirror family may satisfy the other pipeline, and no scalar alone may
authorize HTML Stage 4.

`content_review_fingerprint_v1` SHALL hash the ordered human-reviewed content projection: stable
IDs/order, headers, `visual_type`, concept, family body/callout fields, and structured fallback/brief
semantics. It SHALL exclude notes, theme/runtime, source locators, and selection transport.

The visual record SHALL bind `visual_system_fingerprint_v1` over global resolved visual
config/runtime/family-registry and renderer/component/chart/recipe/compositor versions. It SHALL bind
every current `component_recipe_key_v1`, defined as SHA-256 of canonical JSON containing family,
geometry variant, ordered typed-block kinds, chart kind/series-category counts/formatter/legend
resolution, and primary-visual kind/abstract recipe/icon-layout discriminator while excluding ordinary
text, chart numeric values, and asset bytes. Keys SHALL sort by hash; each representative SHALL be the
code-unit-smallest current stable ID for that key, independent of position. Its effective output SHALL
be shown, plus forced fallback when current selection hides fallback. Representative deletion SHALL
select the next ID and stale that key's evidence. `page_visual_dependency_fingerprint_v1` SHALL
separately hash page visual type, component recipe key, ordered finite chart numeric values, primary
placement/fit/focal point, effective fallback/selection state, and referenced
fallback/selected/inline-icon asset IDs/SHAs. It SHALL exclude global system inputs, ordinary visible
copy, notes, and position. Each page review SHALL bind that dependency fingerprint plus exact shown
effective and applicable forced-fallback composition/preview SHAs for audit. Freshness SHALL compare
the two disjoint fingerprints by their owning scope.

Gate dual-write SHALL remain recoverable through transient `_state/gate-approval-journal.json`: an
exclusively and atomically published journal SHALL bind owner token/host/PID/epoch-ms start plus old/new
`_state` and metadata SHAs, authoritative `_state` evidence SHALL publish first, metadata mirror
second, and journal removal last. Same-host proven-dead automatic recovery requires 60000 ms;
cross-host/uncertain explicit-token recovery requires 300000 ms plus prior human confirmation; a
proven-active same-host PID remains blocked. Every recovery SHALL apply the exact old/old abort,
new/old mirror-complete, new/new cleanup, exact reset-pending takeover cleanup, and
old/new-or-other-third-SHA fail-closed matrix and SHALL create no decision. A metadata-first,
metadata-only, missing/invalid-journal, or ambiguous partial write SHALL not satisfy HTML readiness.

#### Scenario: Current waiver is visible but not approval

- **WHEN** a user waives incomplete visual evidence for the current reset/version
- **THEN** state reports `status: waived`, `evidence_complete: false`, and the bounded `waived_checks`
- **AND** it does not report the record as approved or evidence-complete

#### Scenario: Complete intentional waiver remains distinct from approval

- **WHEN** the current evidence is complete but the user explicitly chooses waiver with a reason
- **THEN** state records `status: waived`, `evidence_complete: true`, and empty `waived_checks`
- **AND** readiness preserves the user's decision without relabeling it as approval

#### Scenario: Copy edit preserves deck visual approval

- **WHEN** ordinary body copy changes without visual-system/family/fallback change
- **THEN** deck visual-system evidence remains current
- **AND** content approval or waiver becomes stale when the reviewed content projection changes

#### Scenario: Notes-only edit preserves content approval

- **WHEN** only speaker notes change
- **THEN** the content fingerprint and content decision remain current
- **AND** notes/delivery ownership becomes the only stale owner requiring refresh

#### Scenario: New component recipe invalidates deck visual approval

- **WHEN** a current plan introduces an uncovered component recipe key
- **THEN** visual gate becomes stale until representative HTML output is reviewed or explicitly waived

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
- **AND** page-local dependency fingerprints do not all stale merely by duplicating global inputs

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
- **THEN** its review plan is `approvable: false`, lists B, and cannot publish approval
- **AND** only an explicit reasoned waiver may continue after current identity is verified

#### Scenario: Complete visual plan is approved

- **WHEN** shown evidence covers every outstanding representative/page dependency and remains current
- **THEN** the exact approvable plan may publish one approved visual record

#### Scenario: Reset or version identity changes

- **WHEN** a waiver is read under a different reset ID or run version
- **THEN** the record is stale and cannot satisfy HTML readiness
- **AND** no force flag reuses it

### Requirement: State and status expose complete delivery without optional-refinement debt

State SHALL reserve version-scoped `html-delivery-review` as system evidence, not a third pipeline
gate. New writes SHALL use exact schema `pptmaker-html-delivery-review-v2`; readers SHALL accept valid
current v1 records as complete without rewriting them. The v2 record SHALL bind `pipeline:
html-first-v1`, normalized `run_version`, current nullable `html_production_reset_id`, HTML delivery
digest, every reviewable delivery artifact actually present, typed human `decision:
proceed|repair|redirect`, nullable normalized `reason`, `evidence_complete: boolean`, bounded
`waived_checks`, and UTC ISO-8601 `decided_at`. Reviewable delivery evidence SHALL include current
target-version PPTX and contact-sheet paths/SHAs. Complete evidence SHALL additionally bind the
assembly-v2 receipt path/SHA and PPTX SHA plus notes-v3 receipt path/SHA. The record SHALL never invent
paths or SHAs for absent artifacts.

The v2 record SHALL retain the complete 17-field v1 set with the same names and add only exact
`pptx_path`, `evidence_complete`, and `waived_checks` fields. Artifact path/SHA fields for missing
lineage SHALL be present as null rather than omitted, and only fields covered by a `waived_checks` entry
may be null. Current `pptx_path`, `pptx_sha256`, `contact_sheet_path`, and `contact_sheet_sha256` are
never nullable for forced `proceed`.

Forced delivery SHALL resolve `pptx_path` only through the HTML Stage-4 canonical assembly/layout owner
and SHALL resolve the contact sheet only from the current canonical preview-manifest delivery slot for
the same reset/version. It SHALL not scan for a convenient PPTX or accept caller-supplied artifact
paths. Both resolved paths SHALL be confined and their current bytes hashed before publication.

Normal `proceed` SHALL have no reason and require complete current evidence. Forced `proceed` SHALL
require a normalized non-empty reason, current target identity, and reviewable current PPTX/contact
sheet, and SHALL record every missing/stale lineage check with `evidence_complete: false`.
`repair|redirect` SHALL retain their complete-current-evidence requirement, required normalized
non-empty reasons, and routing semantics.
Reason SHALL not enter delivery freshness/fingerprint and SHALL not be echoed in failure diagnostics.
JS SHALL validate exact reset-ID equality and every recorded current byte/lineage before accepting a
decision; MD Controller SHALL show the contact sheet plus PPTX/notes result and obtain the decision.
Any reset-ID, delivery, PPTX, contact-sheet, or recorded receipt change SHALL stale the record.

The same atomic state publication SHALL write the current final-review node's typed decision with
current execution ID and exact reference to this system record; checkpoint/verification branching
SHALL accept only that referenced decision and SHALL not rely on an unbound prior conversation or
duplicate later state write. On resume, `repair` routes its reason through pipeline-first change
classification to the owning source/system/production repair node. For `create-deck`, `redirect` SHALL
retain explicit reset-to-`checkpoint-intake` semantics and clear downstream current-execution
completion before re-intake. For HTML iteration controllers, redirect SHALL enter shared classification
and require a separate typed target in exact set
`edit-text|edit-visual|edit-notes|restructure-slides|create-deck|stop`; `legacy-image2-maintenance` is
invalid for an HTML run. `stop` SHALL leave the current controller incomplete, set `waiting_for:
user:resume-or-replace`, and make resume report a user pause rather than Phase-4 debt or an automatic
next node. Free text SHALL not auto-switch playbooks.

When HTML Stage 1-5 receipts, content/visual decisions, and a current `html-delivery-review: proceed`
are present, status/resume SHALL report the user-accepted deck complete even if the proceed decision
contains an explicit evidence waiver. Status SHALL separately expose identity freshness,
`evidence_complete`, and `waived_checks`, and SHALL recommend repairing missing evidence without
re-blocking the user's accepted delivery. Optional modern Phase 4 SHALL create no debt: no placeholder
node, authorization, reserved refinement record, or required action is created when the user ends after
HTML delivery. Markerless decks SHALL report legacy maintenance ownership separately.

#### Scenario: User stops after HTML delivery

- **WHEN** current HTML PPTX/notes/final review exist
- **THEN** status reports a complete deliverable and no pending refinement

#### Scenario: User continues with an incomplete lineage receipt

- **WHEN** current reviewable artifacts exist but one lineage receipt is missing or stale
- **THEN** explicit `--force --reason` records proceed with an evidence waiver
- **AND** status reports user acceptance and incomplete evidence separately while recommending repair

#### Scenario: No reviewable artifacts exist

- **WHEN** target-version PPTX or contact sheet cannot be shown
- **THEN** delivery proceed remains blocked despite `--force`
- **AND** the diagnostic recommends producing and reviewing the target artifacts

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
- **AND** it does not infer a destination playbook from the reason alone or enter legacy maintenance for HTML

### Requirement: Playbook index reserves final system evidence and enforces pipeline ownership

The canonical index/state reserved-ID registry SHALL reserve the six IDs defined by the main state
contract, validate controller pipeline declarations, reject cross-pipeline entry conditions, and ensure
no reserved ID is declared as a controller node. Only nodes in `image2-refine` may declare Phase
4/module `04-image2-refinement`; controller entry requires identifiable current HTML final-slide/slot
inputs, and authorization/generation nodes additionally require either current delivery proceed evidence
with complete evidence or the current plan-bound prerequisite waiver. Legacy maintenance continues to reject HTML-first runs.

#### Scenario: Controller declares reserved review node

- **WHEN** a playbook declares `node: html-content-review`, `html-visual-review`, `html-delivery-review`, `html-production-reset`, or `image2-refinement`
- **THEN** validation fails because the ID is system evidence

#### Scenario: Controller declares reserved refinement evidence

- **WHEN** a playbook declares `node: image2-refinement`
- **THEN** validation fails because it is system evidence

#### Scenario: Legacy controller allows HTML pipeline

- **WHEN** legacy maintenance declares or is entered with `html-first-v1`
- **THEN** index/entry validation fails closed

## ADDED Requirements

### Requirement: State validation is non-mutating by default

The public state interface SHALL provide a read-only validation mode that checks canonical state shape,
reserved version keys, SHA/path references, exact delivery keys, and waiver/approval field invariants.
Validation SHALL return bounded field-level diagnostics and SHALL not heal, rewrite, or seed state unless
a separate explicit repair operation is invoked.

#### Scenario: Validation finds extra delivery fields

- **WHEN** a delivery record contains an undeclared key
- **THEN** validation identifies the extra field and expected key set
- **AND** it leaves the original state bytes unchanged
