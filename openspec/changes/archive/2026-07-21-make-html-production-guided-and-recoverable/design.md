## Context

The current HTML-first review lifecycle has three different classes of failure mixed together:

1. **Contract defects**: pilot and read-back build different body projections; visual read-back has
   no composition input. These make a valid plan appear stale/incomplete.
2. **Reversible quality/process risks**: a user may intentionally continue with incomplete review or
   lineage evidence, but the CLI currently has no consistent path beyond a complete current plan.
3. **Integrity boundaries**: wrong plan/version/reset identity, active writers, corrupted state, and
   unapproved provider work cannot be made safe by user preference.

The system already has the right ownership primitives: immutable review plans, the preview manifest,
version-scoped reserved state nodes, a gate publication journal, reset/CAS fences, typed CLI
diagnostics, and a Phase-4 injectable transport. The design deepens those modules instead of adding
another workflow or state store.

This is framework repository maintenance. MD Controller owns recommendation and human interaction;
JS owns deterministic projection, validation, publication, diagnostics, and provider transport;
the human owns the decision to repair or waive a reversible risk.

## Goals / Non-Goals

**Goals:**

- Make freshly published content/visual review plans reproducibly current.
- Give every reversible gate risk a recommended repair plus an explicit reasoned continuation.
- Preserve exact identity, concurrency, state, and remote-authorization hard stops.
- Keep waiver records auditable and distinguish identity freshness from evidence completeness.
- Make notes-only edits stale only notes/delivery ownership.
- Expose read-only field-level state validation.
- Make authorized Phase-4 generation/reconciliation reachable from the public CLI.
- Encode the gate posture in OpenSpec governance and the runtime charter.

**Non-Goals:**

- Removing human gates or automatically waiving them.
- Allowing invalid/ambiguous source, state, plan hashes, reset epochs, paths, or active transactions.
- Treating waiver as approval or inferring evidence completeness from the waiver decision.
- Adding a top-level override store, a second readiness authority, or authorization only in history.
- Changing markerless legacy production behavior.
- Triggering provider work from HTML Phase 3, build force, preview, or offline refinement planning.
- Implementing markerless migration preparation or new HTML visual primitives (later changes).

## Decisions

### 1. One gate posture, three outcomes

`openspec/policies/human-centered-gates.md` will define a decision test used by OpenSpec artifacts and
runtime guidance:

| Outcome | Meaning | Runtime behavior |
|---|---|---|
| guide | safe deterministic repair or advisory best practice | repair/continue without human risk acceptance; report action |
| confirm | reversible user-owned quality/process risk | recommend repair, expose explicit waiver/force with reason |
| hard-stop | target identity, integrity, security, authorization, or recovery cannot be preserved | reject; explain invariant and safe recovery |

`openspec/config.yaml` will carry only the short rule and policy path. Runtime details remain in
Charter and capability specs. This avoids a second CLI/state schema in governance text.

Alternative considered: put the full policy only in `config.yaml`. Rejected because the config would
become a large duplicate authority and artifact instructions would become harder to audit.

### 1a. Durable policy placement and single-owner boundary

A change-local research note can preserve why an idea was considered, but it is
not a lasting governance input: archive moves it out of the active change
context, and `openspec/config.yaml` does not load it for later work. Adapted
guidance that must survive archive therefore belongs under `openspec/policies/`.

The two durable policies have non-overlapping policy authority:

- `human-centered-gates.md` classifies `guide`, `confirm`, and `hard-stop`,
  defines waiver meaning, and names non-bypassable invariants.
- `agent-assistance-and-control.md` shapes the legal path after that
  classification: direct source of truth, evaluator reuse, human/Agent/runtime
  handoff, bounded diagnostic, durable-state discipline, and recovery.
- Capability specifications and executable contracts remain the only owners of
  concrete commands, record schemas, byte validation, and permissions.

For an overlapping change, classify the outcome first, then design the control
path, then implement it through the owning capability. Neither policy can
create a force path, record field, or permission by itself.

Alternative considered: retain the adapted guidance only beside this change.
Rejected because it would become archival rationale rather than an active rule
for the next change.

### 2. One deep review-input resolver

Introduce one internal resolver owned by the HTML review/evidence module. Given trusted run context and
gate kind, it will return:

- canonical current structured plan;
- current reset/version/scope;
- the shared content or visual review projection;
- current preview-manifest reference;
- verified shown composition/final-slide references and bytes for visual review;
- bounded mismatch records `{path, expected, actual, kind, slide_id?}`.

Pilot publication and later `readCurrentPlan` use the same projection functions from
`contracts/html_review_projection.mjs`. The body projection field set is defined once; neither
`rendererBodyProjection` nor `parseHtmlSourceAstV1` maintains a private exclusion list. Visual
read-back resolves composition evidence from the published preview/final-slide manifests and validates
the referenced bytes before rebuilding expected coverage.

Approved plans still require immutable current plan bytes and complete evidence. A waiver may use the
current computable projection plus the resolver's failed checks when no complete approvable plan exists.
Any caller-provided mismatched hash is not interpreted as a waiver request.

Alternative considered: exclude the body from content fingerprinting. Rejected because the content
gate would stop protecting the main reviewed slide content.

### 3. Projection ownership, not raw source bytes, determines freshness

The existing `content_review_fingerprint_v1` remains the content owner and continues to exclude notes.
Visual-system/page dependency projections retain their existing scopes. Add or formalize a notes-only
source projection used by Stage 5/delivery. Raw `source_sha256` remains provenance and drift evidence but
does not independently stale content/visual review.

`ordered_plan_digest` may continue to protect renderer/delivery plan identity, but content approval
read-back compares the content projection rather than a digest containing unrelated source bytes. A
stale matrix will cover notes-only, visible copy, visual config/recipe/assets, and structure changes.

Alternative considered: special-case speaker-note syntax before hashing raw Markdown. Rejected because
ad hoc text stripping would create another parser and remain sensitive to formatting-only edits.

### 4. Versioned records retain the existing state owners

Exact-key records gain fields, so writers will use versioned record schemas:

- `pptmaker-html-gate-review-v2`;
- `pptmaker-html-delivery-review-v2`;
- `pptmaker-image2-refinement-state-v2` for every newly created refinement plan/authorization after
  this change.

The state file remains schema v3. Reserved IDs and canonical keys remain:

- `html-content-review` / `html-visual-review`;
- `html-delivery-review`;
- `image2-refinement`;
- `by_version["3_versions/vN"]`.

Gate v2 adds closed fields `evidence_complete: boolean` and bounded `waived_checks`; approved records
require complete evidence, null reason, and exact plan audit. Waived records require a reason and current
projection/reset/version identity. A complete but intentionally waived review has
`evidence_complete: true` and an empty `waived_checks`; an incomplete waiver has
`evidence_complete: false` and at least one waived check. The review-plan hash is nullable only for
incomplete waiver basis; when present it must verify and match any caller-supplied hash.

`waived_checks` is a canonical, duplicate-free array capped at 64 entries. Each entry contains only a
check code matching `[a-z][a-z0-9_]{0,63}` and optional `kind/id` subject, where `kind` is one of
`gate|slide|recipe|artifact|receipt` and `id` matches `[A-Za-z0-9][A-Za-z0-9._:-]{0,127}`. It never
stores authored prose, reason text, absolute paths, prompts, provider bodies, or secrets. This is durable
audit state, not a copy of the CLI diagnostic envelope.

Delivery v2 binds every reviewable artifact actually present plus `evidence_complete`, `waived_checks`,
and the reason required for forced proceed. It retains the v1 delivery field names as an exact closed
key set and adds only `pptx_path`, `evidence_complete`, and `waived_checks`; missing lineage values
remain explicit nulls only when represented by a waived check, while reviewable PPTX/contact-sheet paths
and SHAs are always concrete. It never invents a path/SHA for a missing artifact.

Forced delivery does not accept or scan for a caller-selected PPTX. It resolves the HTML Stage-4
canonical PPTX output through the existing assembly/layout owner and resolves the delivery contact sheet
only from the current canonical preview-manifest delivery slot for the same reset/version. It confines
both paths and hashes their current bytes. Missing assembly/notes receipts may be waived; missing or
ambiguous reviewable bytes may not.
Refinement state v2 stores plan v2 plus a bounded nullable `prerequisite_waiver` inside its existing
version record; it is not delivery evidence and cannot complete refinement. Existing v1 refinement
records remain readable and are not rewritten by observation. Any new plan replaces the current
version's resolved refinement working record with v2 only after existing unresolved attempts/reviews
have passed the current conflict checks.

`prerequisite_waiver` has exact fields `reason`, canonical `waived_checks`, `run_version`, nullable
`html_production_reset_id`, `html_delivery_digest`, and `recorded_at`. Its checks reuse the bounded safe
audit-entry shape owned by `node-specification`. The offline plan does not duplicate reason text; it binds
`prerequisite_waiver_fingerprint`, computed from normalized reason, checks, run/reset identity, and the
current delivery digest. Authorization revalidates the authoritative state waiver and fingerprint.

Readers accept existing v1 records. Because v1 gate waivers required a complete current plan, a valid
v1 current record is projected as `evidence_complete: true` with no waived checks. New writes use v2.
Unknown or ambiguous records are reported, not guessed.

Alternative considered: store force events only in `history.jsonl`. Rejected because history is
reference-only and cannot authorize continuation. Alternative considered: add `html-build-override`.
Rejected because it would duplicate gate readiness.

### 5. Command semantics are explicit

#### `approve`

- Normal HTML approval requires `--plan-hash` and complete current evidence.
- `--waive --reason` may omit `--plan-hash`; it binds the current computable projection and failed
  checks. If a hash is supplied, it must match the current resolved plan.
- Header and markerless compatibility remain unchanged.

#### `build --force --reason`

The command publishes a waiver only for unresolved content/visual gates, in deterministic content then
visual order through the existing journal/CAS publisher. It re-inspects both gates before invoking local
build. A crash between publications leaves at most one visible waiver and no build; rerun safely
publishes the remaining decision. Source/bundle/reset/journal/CAS failures remain hard stops.
If both gates are already current, force records no waiver and proceeds normally with an explicit
`force_not_needed` result. With `--dry-run`, it returns the prospective waiver/check set and local build
plan without publishing decisions or artifacts.

#### `state --record-delivery-review proceed --force --reason`

Normal proceed still forbids a reason and requires complete current delivery evidence. Forced proceed
requires a reason and at least reviewable current PPTX plus contact sheet identity; it records missing or
stale lineage checks in delivery v2. When those reviewable artifacts and the current target identity are
valid, the user's `proceed` decision may complete the HTML delivery workflow even with
`evidence_complete: false`; status/resume must show the evidence waiver separately and recommend repair.
Missing reviewable artifacts remain a hard stop. Repair/redirect semantics stay unchanged.

#### `image2 plan --force --reason`

Normal planning requires current delivery proceed with complete evidence. Forced planning requires
current identifiable HTML final-slide/slot inputs and stores a prerequisite waiver in refinement v2 when delivery is missing or
incomplete; an explicit current `repair|redirect` decision remains owned by its controller and is not
silently overridden. It remains offline.
For either route, `delivery_digest` comes from the Phase-3 public current final-slide resolver and its
verified ordered manifest, never from a synthetic status hash. The forced route also binds that digest
and current reset/version into the prerequisite waiver before writing the plan.
If `--force --reason` is supplied while normal complete delivery eligibility already holds, planning
creates an ordinary plan, stores no prerequisite waiver, and reports `force_not_needed`.
Authorization rejects stale plan/waiver inputs; generation still requires credentials and authorization;
promotion/final completion still requires current final review.

All new flag combinations participate in Commander usage validation and command-return audit. `--force`
without a reason is `USAGE`, not an implicit default.

### 6. Read-only state validation uses raw parse plus semantic checks

`state --validate-state` uses a non-writing parse/inspection path. It does not call healing writers or
seed missing historical state. Validation layers are:

1. YAML/document parse and duplicate/unknown key diagnostics;
2. state schema and reserved-node/version-key validation;
3. record exact-key/schema/decision invariants;
4. confined path, SHA format, and referenced-byte validation;
5. current source/reset/version freshness and delivery field diff.

The human output shows a short summary and safe next action. JSON contains bounded issue objects with
field path and redacted expected/actual. The CLI producer owns this structure; MD Controller consumes
category/reason/next only.

Alternative considered: validate by running `readState(..., heal: true)`. Rejected because a validation
command must not mutate the evidence it is diagnosing.

### 7. Phase-4 CLI adapter remains isolated and authorization-gated

Credential/endpoint resolution will be factored into a shared import-safe resolver used by legacy
`resolveVendors` and the Phase-4 CLI adapter; provider payload/submission logic stays separate by owner.
Phase 4 exposes a public lazy factory from `index.mjs`; root `ppt_flow` calls it only for `generate` or
the existing `unknown-submit --decision retain` reconciliation operation with resolved
credentials/config, then injects the returned transport into the
existing application API. The generate operation passes its current provider-neutral request to the
transport submit method; reconciliation passes only persisted provider/attempt identity. HTML Phase
3 never imports or initializes it. The transport implementation remains private, so this uses the
existing `framework-script-layout` public-Phase-interface rule and does not change that capability.
`unknown-submit --decision abandon` remains provider-free.

The current application request contains identities but not enough material to submit a useful image.
Therefore the refinement plan becomes `pptmaker-image2-refinement-plan-v2` and binds a
`request_contract_version` plus per-attempt `request_fingerprint`. Before authorization and again before
submission, Phase 4 materializes a provider-neutral `RefinementSubmitRequestV1` from the current
validated HTML plan: stable slide/slot identity, text-free `primary_visual.brief`, structured concept
constraints, resolved slot geometry, style/profile contract, and verified reference bytes with SHA-256
bindings (or an explicitly supported provider-neutral reference kind that does not require bytes). The
provider adapter may turn that in-memory request into its endpoint payload. Reconciliation uses the
persisted provider request identity and attempt binding; it does not reconstruct or persist prompt/body
material. Prompt/body text and provider response bodies are never persisted in state or receipts. A changed request fingerprint
is stale and requires a new plan/authorization; it is never silently regenerated at charge time. The
request contract identifier is `pptmaker-refinement-submit-request-v1`; each fingerprint is a lowercase
SHA-256 of the canonical deterministic request-material projection defined below.

`RefinementSubmitRequestV1` is an in-memory, closed request with a transport envelope plus deterministic
material. The envelope contains `attempt_id`, `authorization_id`, and `plan_hash`. The material contains
`request_contract_version`, `kind` (`style-reference|slot`), nullable `slide_id`, nullable `slot`, the
text-free `visual_brief`/structured concept constraints selected from the HTML plan, nullable for a
`style-reference` attempt, resolved slot `geometry` (required for `slot`, null for `style-reference`),
the resolved `profile_contract`, and `references`. Each reference contains a safe role, media type,
SHA-256, and bytes when the provider upload requires them.

The `request_fingerprint` is SHA-256 over canonical deterministic material with references projected to
role/media/SHA only. It excludes the fingerprint itself, inline reference bytes, and the random or
derived transport envelope (`attempt_id`, `authorization_id`, `plan_hash`). Plan v2 binds fingerprints
by deterministic attempt role (`style-reference` or slide/slot); authorization copies the matching
fingerprint onto each newly allocated attempt. Submission validates the envelope separately, verifies
reference bytes against their bound SHAs, and recomputes the same material fingerprint before the
attempt enters `submitting`. This avoids a plan-hash cycle while preserving exact charge-time freshness.
The request object is never written to state, plan, receipt, or diagnostic; only its contract version,
fingerprint, and safe envelope identities are durable.

Plan v2 also persists the closed, provider-neutral `profile_contract` used to materialize that request:
`{schema: "pptmaker-image2-visual-slot-profile-v1", mode: "visual-slot", profile_fingerprint}`.
`profile_fingerprint` is the existing 64-hex opaque profile identity accepted by the CLI/API; unknown
keys and provider credentials are rejected. The adapter resolves only its fixed provider-neutral
visual-slot defaults, so generation does not pretend to reconstruct model/size/resolution values that
were not provided by the existing contract.
Reference bytes are resolved through the current HTML asset/style-reference manifest owner, confined to
the run bundle, and rehashed at plan, authorization, and submit boundaries. The CLI cannot inject an
arbitrary reference path or replace a bound SHA.

The first implementation task is a contract spike against checked-in/fake Image2 relay fixtures. The
accepted transport contract is deliberately closed: synchronous bytes returned by submit are terminal;
an asynchronous response must expose a stable task/provider request ID for polling/reconciliation; a
timeout or accepted response without such an ID is persisted as `unknown-submit` and is never retried.
The same rules apply to style-reference and visual-slot attempts. A fixture that violates this contract
is an unsupported relay and remains unavailable to the adapter; it does not trigger a second implicit
transport protocol.

No new dependency is expected. Node `fetch`, the existing credential authority, bounded receipts, and
fake transport tests remain sufficient.

Alternative considered: make the CLI import `04-image2-refinement/internal/transport.mjs` directly.
Rejected because it violates the Phase public-interface boundary. Alternative considered: reuse the
legacy whole-page generator wholesale. Rejected because modern refinement owns different attempt,
candidate, request, and reconciliation semantics.

### 8. Speaker-note parsing stays in the shared document model

The multiline extractor will recognize quote lines with or without content after the exact speaker-note
heading, then normalize and require at least one non-empty content line. Slide splitting and stable-ID
matching remain delegated to `parseSlideDocument`; no second slide-heading parser is introduced.

## Risks / Trade-offs

- **[Risk] Waiver becomes an easy default** -> Help and diagnostics list recommended repair first;
  waiver/force always requires an explicit reason and never runs automatically.
- **[Risk] v2 records make rollback to old code difficult** -> Land v1/v2 readers before v2 writers,
  test mixed records, and retain v1 read support. Rollback must keep the compatibility reader; no
  automatic lossy downgrade is provided.
- **[Risk] Build force partially publishes two gate waivers** -> Deterministic sequential publication,
  journal recovery, and reinspection guarantee no build starts until both are current.
- **[Risk] Incomplete delivery waiver binds the wrong artifact** -> Require target-version PPTX/contact
  sheet identity, confined paths, and actual byte hashes; absent reviewable artifacts remain hard stop.
- **[Risk] Diagnostics expose authored or secret data** -> Emit only allowlisted field paths, hashes,
  enum/domain summaries, and bounded redacted values through `cli_error.mjs`.
- **[Risk] Shared credential resolver couples legacy and modern protocols** -> Share only env/base URL
  resolution; keep request/response adapters in their owning Phase modules.
- **[Risk] Notes-only optimization misses a visual/content dependency** -> Contract tests cover the full
  stale matrix and compare projections before enabling the optimized route.
- **[Risk] Change breadth hides partial completion** -> Tasks and acceptance map each covered bug to a
  requirement/test; the change cannot archive until the vertical lifecycle and CLI transport pass.

## Baseline Verification Note

At proposal time, `npm test` reaches 499 passing tests and two failures in
`tests/contracts/test_docs_consistency.mjs`. Both failures have the same independent cause:
`PPTMAKER_FRAMEWORK/scripts/contracts/framework_coherence.mjs` still validates the obsolete
14-command/purpose hint while the authoritative `cli-surface` main spec and CLI expose 15 commands.
Task 1.6 owns that mechanical alignment; it is not evidence of a new lifecycle regression.
The existing E2E baseline passes all 40 tests across six files.

## Migration Plan

1. Add governance policy/config rules and characterize BUG-016/018/019/023/030 with failing contract
   tests before changing writers.
2. Add shared review-input resolution and projection fixes; keep existing v1 state writers initially.
3. Add v1/v2 record readers, validation-only state inspection, and mixed-record tests.
4. Enable v2 gate/delivery/refinement writers and the explicit CLI waiver/force modes.
5. Add the shared credential resolver and Phase-4 public CLI transport factory after the compatibility
   spike; verify no import/provider activity during HTML build/preview/plan.
6. Update playbooks, Charter, OpenSpec policy/config, CLI audit, and run-bundle guidance.
7. Run targeted tests, `npm test`, `npm run test:e2e`, and strict OpenSpec validation.

Rollback before v2 writers is code-only. After v2 records exist, rollback must retain the v2 read-only
compatibility parser or restore the forward version; no task rewrites state back to v1. Generated HTML,
PPTX, and refinement candidates remain derived and are rebuilt through their owners, never hand-edited.

## Resolved Compatibility Assumption

The adapter supports only the closed fake-fixture contract above. Synchronous responses are accepted
only when image bytes are present; asynchronous responses are accepted only with a stable provider/task
identifier. A relay that cannot satisfy either shape is reported as an unsupported provider prerequisite,
not guessed or retried. This keeps apply implementation deterministic while leaving provider onboarding
explicit and bounded.
