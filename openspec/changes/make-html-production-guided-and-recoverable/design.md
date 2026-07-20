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
- Treating waiver as approval or complete evidence.
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
- `pptmaker-image2-refinement-state-v2` only when a prerequisite waiver is present or a v2 record is
  otherwise written.

The state file remains schema v3. Reserved IDs and canonical keys remain:

- `html-content-review` / `html-visual-review`;
- `html-delivery-review`;
- `image2-refinement`;
- `by_version["3_versions/vN"]`.

Gate v2 adds closed fields `evidence_complete: boolean` and bounded `waived_checks`; approved records
require complete evidence, null reason, and exact plan audit. Waived records require a reason, current
projection/reset/version identity, and at least one waived check when evidence is incomplete. The
review-plan hash is nullable only for incomplete waiver basis; when present it must verify and match any
caller-supplied hash.

Delivery v2 binds every reviewable artifact actually present plus `evidence_complete`, `waived_checks`,
and the reason required for forced proceed. It never invents a path/SHA for a missing artifact.
Refinement v2 stores a bounded `prerequisite_waiver` inside its existing version record; it is not
delivery evidence and cannot complete refinement.

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

#### `state --record-delivery-review proceed --force --reason`

Normal proceed still forbids a reason and requires complete current delivery evidence. Forced proceed
requires a reason and at least reviewable current PPTX plus contact sheet identity; it records missing or
stale lineage checks in delivery v2. Repair/redirect semantics stay unchanged.

#### `image2 plan --force --reason`

Normal planning requires current delivery proceed. Forced planning requires current identifiable HTML
final-slide/slot inputs and stores a prerequisite waiver in refinement v2. It remains offline.
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
reconcile operations, then injects the returned transport into the existing application API. HTML Phase
3 never imports or initializes it.

The first implementation task is a contract spike against checked-in/fake Image2 relay fixtures to
confirm submit, poll/result, cancellation/timeout, and provider-request-ID reconciliation shapes for
style-reference and visual-slot attempts. If the relay cannot reconcile by persisted attempt/provider
request identity, design/specs must be updated before live implementation; blind retry is forbidden.

No new dependency is expected. Node `fetch`, the existing credential authority, bounded receipts, and
fake transport tests remain sufficient.

Alternative considered: make the CLI import `04-image2-refinement/internal/transport.mjs` directly.
Rejected because it violates the Phase public-interface boundary. Alternative considered: reuse the
legacy whole-page generator wholesale. Rejected because modern refinement owns different attempt,
candidate, and reconciliation semantics.

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

## Open Questions

- Does every supported Image2 relay expose a stable provider request/task identifier that can reconcile
  both style-reference and visual-slot attempts? The compatibility spike must answer this before the
  live adapter task; an unsupported relay remains `unknown-submit` and cannot be retried automatically.
