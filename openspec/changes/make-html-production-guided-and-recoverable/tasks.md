## 1. Contract Baseline and Governance

- [x] 1.1 (`framework-charter`) Add `openspec/policies/human-centered-gates.md` defining guide, confirm, hard-stop outcomes, the protected invariants, required human reason, and the rule that waiver is not approval; keep runtime schemas in capability specs.
- [x] 1.2 (`framework-charter`) Update `openspec/config.yaml` context and proposal/spec/design/tasks rules to require the gate-posture policy for gate/readiness/validation/diagnostic/override changes; clarify that explicit continuation publishes a version-scoped waiver rather than silently ignoring a pending gate.
- [x] 1.3 (`framework-charter`, `playbook-execution`) Update `AGENT_CONTRACT.md`, relevant playbook guidance, and command routing text so each blocked quality gate presents what changed, recommended repair, explicit continuation, and the hard-stop invariant when applicable.
- [x] 1.4 (`pipeline-orchestration`, `node-specification`) Add failing contract fixtures for BUG-016/018/019/030: pilot/read-back projection equality, composition coverage reload, and notes-only stale ownership before changing implementation.
- [x] 1.5 (`cli-surface`) Extend the command-return audit fixture inventory for `approve`, `build`, `state --validate-state`, forced delivery review, and `image2 plan/generate/unknown-submit` normal, guide, waiver, conflict, and secret-redaction outcomes.
- [x] 1.6 (`framework-charter`, `cli-surface`) Align the repository coherence validator and its diagnostics with the current 15-command `ppt_flow` contract and global direct-CLI producer purpose; add a regression so the docs-consistency suite no longer enforces the stale 14-command hint.

## 2. Canonical Review Projections

- [x] 2.1 (`pipeline-orchestration`) Centralize the HTML review body/content/visual projection helpers so pilot publication and `readCurrentPlan` use one field set and canonical serialization; remove duplicate body exclusion lists.
- [x] 2.2 (`pipeline-orchestration`) Implement a trusted current-review-input resolver that loads the current source plan, reset/version/scope, preview manifest, and verified shown composition/final-slide references for a requested gate.
- [x] 2.3 (`pipeline-orchestration`) Pass resolved composition evidence into visual-plan reconstruction and validate every referenced artifact SHA/path before declaring coverage current.
- [x] 2.4 (`pipeline-orchestration`) Replace opaque stale failures with bounded mismatch objects containing field path, expected/actual summary, affected slide/recipe, and a producer-owned next action; redact authored prose, provider bodies, prompts, and `.env` values.
- [x] 2.5 (`pipeline-orchestration`) Add regression tests proving BUG-016 exact plan approval succeeds immediately after pilot, BUG-018 body fingerprints remain equal for callout/primary-visual slides, and BUG-019 visual reconstruction remains approvable when composition evidence is present.

## 3. Versioned State and Evidence Records

- [x] 3.1 (`node-specification`) Define closed v2 schemas for HTML gate and delivery records with `evidence_complete`, canonical bounded `waived_checks` entries, and waiver basis fields; retain reserved IDs and canonical `3_versions/vN` keys; make completeness independent from the approved/waived decision.
- [x] 3.2 (`node-specification`) Add v1 read compatibility and v2 write migration rules; infer `evidence_complete: true` only for a valid current v1 record that already required complete evidence, and reject ambiguous records without mutation.
- [x] 3.3 (`node-specification`, `visual-slot-refinement`) Add v1/v2 refinement-state readers in shared state and Phase 4; keep observation non-writing, require every newly created plan/authorization to use state/plan v2, and preserve the existing unresolved-attempt/review conflict before replacing a working record.
- [x] 3.4 (`node-specification`) Implement gate waiver publication through the existing approval journal/CAS/reset authority, including current source/projection identity, bounded reason, failed checks, and no legacy mirror mutation.
- [x] 3.5 (`node-specification`) Implement delivery v2 evidence-waiver recording that resolves only the HTML Stage-4 canonical PPTX and current canonical-manifest delivery sheet, verifies confinement/current byte hashes, binds those reviewable artifacts, and never scans for or invents paths/SHAs for missing artifacts.
- [x] 3.6 (`node-specification`) Update readiness/status projections to expose decision, identity freshness, evidence completeness, and waived checks separately; keep `html-delivery-review` out of the third Stage-4 gate; allow a current forced `proceed` with reviewable PPTX/contact sheet to complete user acceptance while recommending repair for incomplete lineage.
- [x] 3.7 (`node-specification`) Add read-only state validation over YAML shape, unknown/extra keys, reserved version keys, record invariants, confined paths, SHA references, and delivery field diffs; ensure validation never heals, seeds, or rewrites state.
- [x] 3.8 (`node-specification`) Add unit/integration coverage for BUG-024 canonical-key diagnostics, BUG-027 17-field delivery mismatches, BUG-029 expected/actual output, BUG-031 read-only validation, journal conflicts, reset drift, and mixed v1/v2 records.

## 4. Explicit CLI Continuations

- [x] 4.1 (`cli-surface`) Close BUG-020 for approval: normal content/visual approval requires exact `--plan-hash`, while `--waive --reason` may bind the current computable projection; reject any supplied mismatched hash without mutation.
- [x] 4.2 (`pipeline-orchestration`, `cli-surface`) Close BUG-017/020 for build: add `build --force --reason` with deterministic content-then-visual waiver publication, reinspection before local assembly, and no provider invocation; a partial waiver must never start a build; already-current gates return `force_not_needed` without new records, and `--dry-run` reports prospective waivers/build scope with zero writes.
- [x] 4.3 (`cli-surface`, `node-specification`) Close BUG-020 for delivery: add `state --record-delivery-review proceed --force --reason` validation requiring reviewable current artifacts and recording evidence waiver fields; preserve normal proceed/repair/redirect reason rules.
- [ ] 4.4 (`visual-slot-refinement`, `cli-surface`) Close BUG-017/020 for optional refinement: require current proceed plus complete evidence for normal planning; add `image2 plan --force --reason` that derives the real Phase-3 final-slide delivery digest, stores the exact state-v2 prerequisite waiver, and binds only its fingerprint into the offline plan; complete eligibility returns `force_not_needed` with no waiver; keep current `repair|redirect` decisions authoritative; allow exact candidate review/promotion after waiver while requiring a new final review after promotion.
- [ ] 4.5 (`cli-surface`) Register all new options and paths in Commander help, usage diagnostics, JSON success/failure envelopes, and `cli_return_audit`; add mutual-exclusion and missing-reason tests.
- [ ] 4.6 (`pipeline-orchestration`, `playbook-execution`) Add BUG-017/020 end-to-end CLI tests for recommended repair, explicit waiver, wrong hash hard stop, active journal conflict, missing delivery artifacts, and status transparency.

## 5. Ownership-Aware Freshness and Notes

- [ ] 5.1 (`pipeline-orchestration`, `node-specification`) Reuse `content_review_fingerprint_v1` for content freshness, add the notes-only projection, and remove raw `source_sha256` as a sole content/visual freshness authority while retaining it as provenance.
- [ ] 5.2 (`pipeline-orchestration`) Implement and test a stale matrix for notes-only, visible copy, visual config/recipe, fallback/asset, and structural edits; each case must name the smallest owning refresh path.
- [ ] 5.3 (`notes-injection`) Change multiline speaker-note extraction to accept blank quote lines, normalize content, and still reject blank-only notes or mismatched stable slide IDs.
- [ ] 5.4 (`notes-injection`, `pipeline-orchestration`) Add regressions for BUG-023 and BUG-030 proving notes-only refresh reaches Stage 5/delivery without restaling unrelated content/visual approvals and leaves legacy parsing compatible.

## 6. Phase-4 CLI Transport

- [ ] 6.1 (`image-generation`, `visual-slot-refinement`) Complete the provider compatibility spike against checked-in fake relay fixtures: prove deterministic request materialization, synchronous bytes, async task IDs/poll/result, provider request IDs, timeout, failed submit, and unknown-submit reconciliation for both style-reference and slot attempts. The fixed contract is: bytes returned from submit are terminal; async responses must expose a stable task/provider ID; timeout or accepted-without-ID becomes `unknown-submit` and is never retried.
- [ ] 6.2 (`image-generation`) After the spike, extract an import-safe shared Image2 credential/base-URL resolver used by legacy resolution and the modern CLI adapter without duplicating secret parsing or changing legacy behavior.
- [ ] 6.3 (`visual-slot-refinement`) Persist the closed `profile_contract` and existing opaque profile fingerprint in plan v2; add `request_contract_version: pptmaker-refinement-submit-request-v1` and deterministic role-bound 64-hex request-material fingerprints; exclude random authorization/attempt IDs, plan hash, and inline bytes from the fingerprint, copy the matching fingerprint onto allocated attempts, and expose a lazy public Phase-4 transport factory from `index.mjs` that accepts resolved credentials/config and returns a transport whose submit method consumes the current provider-neutral request with fixed visual-slot defaults; importing Phase 4 remains side-effect-free.
- [ ] 6.4 (`cli-surface`, `visual-slot-refinement`) Wire `image2 generate` to materialize, SHA-verify references, and match the current plan-bound request fingerprint before the attempt enters `submitting` or the public transport is called; wire existing `image2 unknown-submit --decision retain` to persisted provider-request/attempt identity without reconstructing prompt/body material; prove `--decision abandon` remains provider-free; keep HTML Phase 3 and preview/pilot free of transport initialization.
- [ ] 6.5 (`image-generation`, `visual-slot-refinement`) Add tests for missing credentials, secret-safe provider errors, typed receipts, unknown-submit persistence, no blind retries, and BUG-021 CLI reachability.

## 7. Controller and Documentation Consumers

- [ ] 7.1 (`playbook-execution`) Update gate nodes and resume cards to consume producer-owned guide/waiver/hard-stop diagnostics, show recommended and continuation commands, and never hand-edit state or infer approval from conversation.
- [ ] 7.2 (`playbook-execution`, `framework-charter`, `commands-reference`) Update HTML create/iteration/final-review playbooks and `COMMANDS.md` for `--force --reason`, `state --validate-state`, waiver status, and the distinction between current waiver and complete delivery evidence.
- [ ] 7.3 (`cli-surface`, `node-specification`) Document the v2 gate/delivery record shape, canonical version key, validation output, and safe repair actions without requiring users to construct records manually.
- [ ] 7.4 (`image-generation`, `visual-slot-refinement`) Document that Phase-4 plan is optional/offline, authorization is still explicit, credentials are loaded only at generate or `unknown-submit --decision retain` reconciliation, abandon remains offline, and modern transport is not a legacy whole-page route.

## 8. Verification and Release Readiness

- [ ] 8.1 Run targeted contract, state, CLI, notes, and fake-transport tests for every scenario in the delta specs; record any baseline failure by exact test name and independent cause.
- [ ] 8.2 Run the HTML-first fixture end to end from pilot through approve/waive, local build, delivery review, optional offline Image2 plan, authorized fake generate, and `unknown-submit` reconciliation without a real provider submit.
- [ ] 8.3 Run `npm test` and `npm run test:e2e`; verify legacy markerless approval, pilot, notes, and Image2 behavior remains compatible.
- [ ] 8.4 Run `openspec validate make-html-production-guided-and-recoverable --strict`, verify CLI return-audit completeness, and review all JSON diagnostics for bounded secret-safe output.
- [ ] 8.5 Confirm no task edits `_generated/` manually, no deck production data is used as a framework fixture, and no provider call occurs in preview/pilot/build-force/offline-plan paths.
