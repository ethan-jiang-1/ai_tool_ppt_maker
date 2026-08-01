## 1. Canonical Progressive Raw Records

- [x] 1.1 Define and validate canonical `page-authority-raw-work-plan-v3`, predecessor/generation-bound batch projection/grant, item claim/attempt, materialization provenance, Pilot decision/evidence, coverage-bound complete-review record, and `page-authority-accepted-raw-evidence-v3` schemas with stable hashes and exact source/workflow/profile/raw-contract bindings.
- [x] 1.2 Add run-bundle path helpers and layout validation for the append-mostly `1_upstream_raw_material/page-production-iterations/` owner, append-mostly `plans/<plan-sha256>/` containers holding immutable direct records, confined staging entries, and scoped `<run-version>/<workflow>/head.json` CAS pointers.
- [x] 1.3 Implement validated initial-plan-container staging/publication, separately staged immutable direct-record additions, and compare-and-swap head advancement so only a referenced immutable v3 plan is current, unresolved submitted attempts block successor-head advancement, and the head contains no derived progress, paid debt, or batch pointer.
- [x] 1.4 Compile one provider-free ordered v3 full raw plan from the selected Page Authority adapter, bind it to the current Style Master/source execution facts, and publish only rebuildable raw/review projections beneath the version `_generated` owner.
- [x] 1.5 Implement the direct-record materialization evaluator for current provider-free reuse, including the existing Framed Text Frame-only local-rebind retention validator, provider-produced bytes, per-item provenance, paid debt, remaining scope, and bounded derived progress without using filenames, timestamps, checkboxes, or state as a ledger.
- [x] 1.6 Preserve pre-progressive v2 raw records as readable, byte-preserved history and return the owner-issued replan/rebuild action without seeding a v3 head, scanning decks, or silently migrating evidence.

## 2. Exact Batches and Durable Materialization

- [x] 2.1 Implement Pilot batch derivation from repeated exact current formal slide IDs, resolving the IDs once through the existing identity authority and emitting full-plan-ordered tuples, display-only position/title, review/paid membership, and maximum submissions while rejecting empty, duplicate, unknown, stale, count-only, inferred, reuse-only partial, or caller-selected lineage scope.
- [x] 2.2 Implement Expansion batch derivation only after a current partial Pilot `proceed`, deriving its complete remaining paid scope from direct materialization facts rather than caller-selected IDs or a mutable default.
- [x] 2.3 Encode the zero-debt and one-through-five-debt branches in the batch evaluator: zero debt skips every synthetic Pilot record, and a small complete paid debt set uses one Pilot scope then routes directly to complete review.
- [x] 2.4 Implement exact grant authorization with full-plan and batch hashes, immutable ordered tuple/profile/source/execution bindings, bounded maximum submissions, same-batch exact replay, and pre-submit stale/currentness checks that invalidate only unconsumed grants and claims on drift.
- [x] 2.5 Implement the serialized per-item lifecycle `eligible -> claimed -> submitted -> succeeded | known_failure | unknown`, persisting the claim and provider request/idempotency identity before any provider outcome can be lost.
- [x] 2.6 Implement one-item `generate` execution that revalidates all direct facts, makes at most one provider submission, consumes a slot at submitted CAS, and stages/publishes a validated immutable materialization bundle before the succeeded-attempt visibility CAS; orphaned bundles must remain non-authoritative.
- [x] 2.7 Implement explicit reconciliation for a persisted submitted attempt using only supported lookup/idempotency facts or a validated persisted materialization bundle; prove success or known failure when possible, otherwise terminalize `unknown`, preserve its old grant as unusable history, and emit no successor plan/batch/grant or submission from reconciliation.
- [x] 2.8 Make the raw owner expose one derived next action for eligible, known-failure, terminal-unknown, stale, and completed states: later unsubmitted items may continue after known failure, but any failed/unknown retry requires a terminal predecessor's newly derived exact successor batch, newly disclosed scope, and new grant.

## 3. Pilot and Complete Review Evidence

- [x] 3.1 Implement generic Pilot-evidence validation that requires complete attributable current review-sample tuples, including every paid Pilot tuple, and keeps the resulting record distinct from complete raw-review evidence and accepted raw evidence.
- [x] 3.2 Add the Framed Pilot publisher using the existing private canonical compiler, browser evaluator, checked-in fonts, underlay validator, and capture profile to emit preview-only raw-underlay and production-equivalent Text Frame composite evidence.
- [x] 3.3 Reject Framed Pilot renderer, HTML, CSS, font, capture, proof, and output-path overrides before browser initialization, and ensure Pilot preflight/capture failures return their existing owner repair action without final artifacts.
- [x] 3.4 Add the Pure Pilot publisher that presents only exact current full-page raw bytes and generic plan/profile identity evidence, with no Framed imports, Text Frame, safe-zone, or compositor semantics.
- [x] 3.5 Enforce selected-workflow isolation for Pilot publication and reject a Framed/Pure sibling adapter mismatch before evidence is written.
- [x] 3.6 Implement partial Pilot decisions `proceed|repair|redirect` so only a current partial `proceed` unlocks Expansion planning; repair/redirect return the raw owner's repair/replan action, and no decision grants cost, accepts raw output, finalizes, or delivers.
- [x] 3.7 Implement complete raw-review preparation and acceptance that revalidates every ordered current full-plan tuple, including reuse, Pilot, Expansion, and explicit retry provenance, before publishing the sole accepted-raw-evidence-v3 record.

## 4. Lifecycle, Finalization, and Migration Routing

- [x] 4.1 Update Page Authority orchestration to require the current selected workflow and accepted effective Style Master before v3 raw planning or any page raw provider call, without changing Style Master ownership or structural-versioning semantics.
- [x] 4.2 Replace the retired full-plan authorization/generation route with full-plan -> Pilot -> conditional Expansion -> complete raw review, enforcing the small-debt and zero-debt branches and same-check recovery from owner facts.
- [x] 4.3 Gate selected-workflow final manifest/publication on current accepted-raw-evidence-v3, then preserve the existing final projection, PPTX, notes, and Delivery Review ownership and lineage contracts.
- [x] 4.4 Preserve exact source/state workflow binding across fresh and structural target routes, retain the existing validated Framed Text Frame-only local-rebind path without source-epoch advance or progressive paid checkpoints, reject mixed Framed/Pure evidence before final publication, and route old raw lineage through the explicit replan/rebuild action.
- [x] 4.5 Update derived raw/review/final projection rebuild paths so removal or regeneration under `_generated` cannot recreate canonical attempts, bytes, grants, or acceptance evidence.

## 5. CLI, Inspection, and Diagnostic Contracts

- [x] 5.1 Replace the public `image2` command parser/help with the fixed progressive `plan`, `pilot`, `expansion`, `authorize`, one-item `generate`, `pilot-review`, `pilot-accept`, complete `review`/`accept`, and `reconcile` forms and their exact hash/formal-ID arguments, including bounded Pilot scope/cost display output and no caller-controlled batch lineage.
- [x] 5.2 Reject every retired or bypassing CLI form before provider initialization or artifact mutation: plan-only authorize/generate, `--slides`, friendly selectors, arbitrary prompt/provider/profile/path overrides, force, retry, and direct provider flags.
- [x] 5.3 Connect mutating CLI operations to the raw owner so Pilot/Expansion planning stays provider-free and exact-replays the current batch, authorization binds exact current hashes, generation returns bounded progress and one legal next invocation, complete branches reject synthetic Pilot review/accept commands, and stale submitted attempts permit only exact historical reconciliation.
- [x] 5.4 Extend producer-owned CLI diagnostics for stale plan/batch/grant/item facts, unknown outcomes, and adapter failures so each failure reports the smallest protected invariant plus one secret-safe owner action without Controller prose parsing.
- [x] 5.5 Update workflow inspection to read only the exact raw owner lifecycle and existing Framed local-rebind validator, return the ordered current action, bounded progress, and evidence references, and write no head, state, grant, attempt, receipt, generated artifact, or provider initialization.
- [x] 5.6 Make inspection fail closed on malformed, stale, cross-bound, or missing direct records and return the earliest repair/reconcile action rather than reconstructing status from Markdown, task cards, generated files, caches, or conversation context.

## 6. Controller, State, and Collaboration Projection

- [x] 6.1 Extend Node state validation and typed handoffs for distinct partial-Pilot, complete-raw-review, and delivery decision/evidence references while keeping plans, grants, attempts, consumption, bytes, provenance, and progress exclusively under the raw owner; fence the legacy v2 raw-authorization state fields from every progressive cost/evidence path.
- [x] 6.2 Replace the one-shot raw nodes in the Controller manifest and selected Framed/Pure playbook routes with separate workflow-specific Pilot recommendation/cost, per-item progress, partial decision, conditional Expansion, complete raw review, finalization, and Delivery Review checkpoints.
- [x] 6.3 Make every progressive Controller resume resolve the exact run/controller identity and refresh workflow inspection before selecting a node; ensure partial Pilot `proceed` only displays the next Expansion cost checkpoint.
- [x] 6.4 Implement the rebuildable `_state/page-production-task-projection.md` writer as a run-scoped collaboration view containing only owner-issued plan/batch/evidence references, bounded progress, prescribed next action, and the typed human decision plus optional note from its handoff.
- [x] 6.5 Ensure the Controller rebuilds a missing or stale task projection on entry/resume and after relevant decisions, while manual card edits, checkbox changes, prose, or deletion cannot authorize cost, resume a submit, advance state, prove materialization, or become evidence truth.
- [x] 6.6 Update manifest/playbook validation and Controller-facing workflow documentation to describe the progressive checkpoints and task card as a non-authoritative collaboration surface without duplicating raw schemas or sibling-workflow semantics.

## 7. Focused Unit and Integration Coverage

- [x] 7.1 Add unit coverage for canonical v3 hashes/validators, full-plan ordering, predecessor/generation batch lineage, exact-replay versus conflicting live branches, Pilot paid-sample membership/disclosure, reuse/debt classification, small-debt and zero-debt branches, and stale/cross-bound plan/profile/source/workflow rejection.
- [x] 7.2 Add unit coverage for initial-container staging/CAS/replay, immutable direct-record additions, serialized claims, submitted-slot consumption, pre-submit interruption, orphan materialization non-authority, terminal visibility ordering, known-failure residual scope, submitted-to-terminal-unknown reconciliation, and the no-implicit-retry/new-grant invariant.
- [x] 7.3 Add integration coverage for Framed production-equivalent Pilot composition and preview-only limits, Pure full-page isolation, sibling adapter rejection, and complete-review mixed-provenance acceptance.
- [x] 7.4 Add integration coverage for selected-workflow orchestration through v3 finalization/PPTX/notes/delivery lineage, validated Framed Text Frame-only local-rebind retention, legacy v2 replan behavior, `_generated` rebuild safety, and mixed-workflow rejection.
- [x] 7.5 Add CLI and inspection tests for every registered progressive form, bounded Pilot disclosure, command/override rejection, bounded producer diagnostics, one-item progression, stale-batch preflight short-circuit, submitted-attempt reconciliation-before-replan, terminal-unknown successor planning, validated Framed local-rebind precedence, and read-only inspection.
- [x] 7.6 Add state/Controller/manifest tests for workflow-specific routes, legacy v2 authorization fencing, partial-Pilot proceed/repair/redirect handoff, small/zero-debt omitted nodes, same-check resume, and task-projection rebuild/edit non-authority.

## 8. End-to-End Verification and Release Checks

- [x] 8.1 Add mock-provider E2E journeys for fresh Framed and Pure partial Pilot -> Expansion -> complete review -> finalization -> delivery, asserting only the selected workflow publishes evidence and artifacts.
- [x] 8.2 Add interrupted/resumed mock-provider E2E journeys for both workflows, including a committed item resume, an unresolved submitted attempt that blocks source/profile successor work until reconciliation, a reconciliation that terminalizes `unknown` without retrying, and a later paid retry requiring a new disclosed scope and grant.
- [x] 8.3 Add E2E coverage for one-through-five-item complete debt and zero paid debt, proving they bypass partial Pilot/Expansion and retain the single complete raw-quality decision.
- [x] 8.4 Run focused unit/integration/E2E suites and the relevant regression suite; confirm no fixture reads from production `deck_*` or `dpt_*` directories and no production path hand-edits `_generated`.
- [x] 8.5 Run `openspec validate introduce-progressive-page-production --strict`, `openspec validate --all --strict`, and `git diff --check`, then record any required implementation follow-up before requesting archive.
