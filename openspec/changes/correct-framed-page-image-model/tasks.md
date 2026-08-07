## 1. Replacement Protocol And Hard-Stop Boundary

- [ ] 1.1 Replace Page Authority v2 production-marker and production-mode constants with `page-image-workflow-v1` / `image2-page-workflow-v1`, preserving `framed` and `pure` as the only version-level policies and retaining the local Harness locator as a separate binding contract.
- [ ] 1.2 Implement one shared replacement-identity evaluator used before parser, state, artifact, provider, Controller, and CLI work; reject v2 source/state/receipt/plan/review/final/delivery records byte-preservingly with the owner-issued `unsupported-protocol/export` action, before any legacy record decoder, derived-artifact read, provider initialization, or state mutation.
- [ ] 1.3 Replace v2 artifact/schema/path identifiers with the new Page Image Workflow record family and replacement-owned derived root; do not add a converter, adoption directory, evidence bridge, fallback reader, or automatic deck mutation.
- [ ] 1.4 Add focused tests proving malformed/mismatched current identity and every v2 entrypoint failure short-circuit before provider initialization, derived-artifact reads, or state mutation, then repair/re-run succeeds through the same current checkpoint.

## 2. Canonical Source And Visual Semantics

- [ ] 2.1 Replace the v2 Page Authority source parser/receipt with the `page-image-workflow-source-v1` parser that accepts only homogeneous current source, explicit `framed` or `pure`, ordered stable slide IDs, and no `hybrid` or per-slide policy.
- [ ] 2.2 Implement the closed `SLIDE BODY.items` Provider Content Schema: allowed semantic roles, bounded count/literal size, exact default copy policy, narrowly permitted `presentation_adaptable` supporting copy, frozen normalized receipt facts, and precise source diagnostics.
- [ ] 2.3 Remove inline `BODY`, display `CALLOUT`, free prompt, coordinate, local-rendering, and YAML-indirection ingress from current source; test exact field-level repair diagnostics and no-receipt behavior for invalid input.
- [ ] 2.4 Update visual-language resolution to remain content-neutral, remove active no-readable-text/no-label Page Authority rules, and reject visual clauses that override source content or attempt to make a Framed page text-free.
- [ ] 2.5 Implement Header Rendering Policy source normalization: Pure provider-visible header content; Framed exact three-field local-header input plus provider `context_not_to_render`; require one valid Framed preset and forbid it for Pure.

## 3. Shared Page Image Core And Adapter Seams

- [ ] 3.1 Create the shared Page Image Core Module and its compact Interface for normalized source, visual/Style Master selection, header policy, canonical semantic facts, and lineage inputs; make returned facts immutable and test it through that Interface.
- [ ] 3.2 Move common content normalization, literal-policy validation, canonical byte construction, and source/visual/style cross-checking behind the Core Implementation; keep actual Framed/Pure provider-input compilation out of shared transport.
- [ ] 3.3 Rebuild the Framed header renderer as a transparent three-field overlay with deterministic browser/font/capture profile, fit checks, minimal preset-bound contrast treatment, and protected-zone facts; reject body/callout/general local rendering and opaque-band/crop semantics.
- [ ] 3.4 Rebuild the Pure adapter over the same Core so it compiles complete provider-rendered content, including headers, without importing Framed renderer/profile code.
- [ ] 3.5 Add/adjust Harness architecture guards to assert one Core seam, selected-adapter-only prompt compilation, no sibling adapter imports, and no current v2 parser/adapter/state/evidence import or dispatch.

## 4. Provider Input, Progressive Lifecycle, And Style Master

- [ ] 4.1 Have each selected adapter compile canonical UTF-8 provider-input bytes per slide and bind their exact digests, Provider Content Schema digest, raw contract, visual/Style Master facts, generation profile, and policy-specific profile/geometry into current raw plans and secret-safe inspection projections.
- [ ] 4.2 Replace Page Authority raw-plan, authorization, batch, attempt, provenance, reconciliation, and evidence schemas/stores with Page Image Workflow records while preserving immutable history, CAS heads, exact batch authorization, one-item submit, verified-media-before-success, and uncertain-submission reconciliation semantics; prove that a stale or malformed record cannot become current from a filename, task card, or copied bytes.
- [ ] 4.3 Rebind Style Master draft resolution, plan/selection/acceptance, readiness, and diagnostics to the replacement source/state scope while preserving its CAS-scoped immutable plan/grant/attempt/provenance lifecycle and explicit provider-cost boundary; ensure v2 candidates or selected assets never satisfy current readiness.
- [ ] 4.4 Route shared Image2 transport only through already-bound adapter requests; remove transport-level semantic prompt assembly and verify stale compiled input blocks authorization/submit/reconcile before provider work.
- [ ] 4.5 Add focused lifecycle tests for exact request-byte binding, stale source/profile/geometry behavior, idempotent planning, authorization scope, unknown-submit recovery, and no current evidence reuse from v2 bytes.
- [ ] 4.6 Preserve the current bounded remote-work discipline under replacement records: scoped credential resolution, one endpoint and total deadline, same-invocation async polling, CRC-valid native PNG verification, secret-safe known failures, unknown-submit reconciliation/abandonment, immutable terminal provenance, and no retry/failover route.

## 5. Review, Finalization, And Delivery

- [ ] 5.1 Implement replacement Complete Page Review evidence: Framed binds exact provider raw page beside a production-equivalent header composite; Pure binds its complete provider page; both are one `proceed` or `repair` decision with no second composite approval record.
- [ ] 5.2 Preserve Pilot as an explicit sample/cost stage using the same selected-policy representation, while preventing Pilot evidence/decisions from publishing complete acceptance, final media, manifests, PPTX, notes, or delivery facts.
- [ ] 5.3 Implement current finalization from accepted replacement evidence: Pure publishes verified provider bytes unchanged; Framed reuses the reviewed local header input/profile to publish its final composite; both produce `page-image-final-slide-manifest-v1`.
- [ ] 5.4 Update PPTX assembly, ordinal projection, notes injection, final delivery receipts, and notes-only refresh to consume only the replacement final manifest/assembly lineage and hard-stop v2 before delivery artifact reads or writes.
- [ ] 5.5 Add integration coverage for raw-plus-composite review bindings, stale review/final rejection, Pure byte preservation, Framed profile/header drift rejection, and v2 assembly/notes non-mutation.

## 6. Invalidation, State, And Workflow Inspection

- [ ] 6.1 Replace field-name refresh heuristics with one current invalidation evaluator comparing compiled provider-input digest, protected geometry, raw contract, generation profile, Framed local profile, and accepted evidence bindings.
- [ ] 6.2 Implement Framed provider-free overlay refresh only when the evaluator proves all required equality; ensure header-literal changes route to raw rebuild and notes-only/structural paths retain their existing owners.
- [ ] 6.3 Update state schemas/writers/readers, clean target activation, and structural apply/replay to bind only replacement source/state facts, retain source records, start targets with fresh acceptance, and never inherit/rebind Style Master/raw/review/final/delivery evidence.
- [ ] 6.4 Update marker-first Workflow Inspection to use direct replacement facts, return the earliest one owner-issued action, project one Complete Page Review, and preserve v2 no-read/no-write hard-stops.
- [ ] 6.5 Add unit and integration tests for current-versus-stale classifications, provider-free refresh proof, target freshness, structural workflow switch, observer non-mutation, and v2 status/resume rejection.
- [ ] 6.6 Make clean target-draft activation atomic: validate target cleanliness and exact source selection, bind one manifest-valid selected-workflow `create-deck` draft route, preserve source records, and fail before a competing continuation/state write or provider work.

## 7. CLI And Controller Handoffs

- [ ] 7.1 Rewire `ppt_flow` public `style-master` and `image2` operations to current Page Image Workflow adapters, exact plan/batch identities, bounded provider input inspection, and one Complete Page Review surface; keep `pilot` provider-free batch planning separate from its later authorization/generation sample work, retain secret-safe diagnostics, and do not add commands/flags for legacy adoption, force, retry, prompt, provider, or profile overrides.
- [ ] 7.2 Update CLI diagnostic classification for Framed closed-header fit, environment/profile availability, protected geometry, compiled input, and evidence drift; test bounded earliest-root output and no browser/provider blame for pre-submit errors.
- [ ] 7.3 Update Controller manifest/playbooks, state handoffs, task-projection eligibility, and resume routing for selected replacement workflow creation, Style Master sequencing, Pilot, Complete Page Review, final delivery, and direct owner recovery.
- [ ] 7.4 Keep task projections as rebuildable non-authoritative views; test that card edits cannot authorize cost, select work, prove evidence, or make v2 input appear resumable.
- [ ] 7.5 Retain the session-bounded Image2 channel-probe offer for current provider-path symptoms, with explicit probe authorization and no page-work authority from probe results.

## 8. Active Guidance And Normative Surface

- [ ] 8.1 Update Charter, Agent Contract, NODE-SPEC, BOOTSTRAP, COMMANDS, workflow/reference/playbook guidance, controller manifests, inspection baseline/ledger, and change-classifier language to use Page Image Core, Header Rendering Policy, Provider Content Schema, compiled-input invalidation, and one Complete Page Review.
- [ ] 8.2 Remove active descriptions of text-free Framed underlays, local body/callout frames, per-slide authority, duplicate composite gates, and v2-as-current behavior from the existing Charter, workflow, reference, and controller sources; do not claim an untracked context or ADR artifact as authority.
- [ ] 8.3 Update run-bundle layout/management documentation and generated controls to describe exact local Harness binding separately from the replacement page protocol, current artifact owners, fresh vNext evidence, and the byte-preserving `unsupported-protocol/export` boundary.
- [ ] 8.4 Update active main-spec Purpose text and retained requirement blocks that delta sync cannot safely rename, without editing OpenSpec archives; consolidate the duplicate accepted `cli-surface` heading `Non-v2 CLI requests fail before execution` into one replacement identity contract, and ensure active capability docs, code comments, help text, and test names use old vocabulary only in explicit negative/historical contexts.

## 9. Test Suites And Regression Guards

- [ ] 9.1 Replace Page Authority v2 source, adapter, raw-plan, state, delivery, and workflow fixtures with minimal current Page Image Workflow fixture factories; retain only narrowly named negative v2 fixtures.
- [ ] 9.2 Add unit coverage for Provider Content Schema roles/policies, Page Image Core facts, Framed transparent header behavior, Pure header ownership, adapter compiled-input digests, and prohibited local/body/text-free inputs.
- [ ] 9.3 Add integration coverage for selected adapter plan -> authorization -> mocked generation -> Pilot -> Complete Page Review -> final manifest -> PPTX/notes, including stale and wrong-owner negative paths.
- [ ] 9.4 Add mock E2E journeys through public CLI/Controller for Framed and Pure plus a v2 rejection journey that proves no resume, plan, submit, publish, assemble, or notes mutation occurs.
- [ ] 9.5 Expand coherence/retirement scans over active `ppt_maker_harness/`, `openspec/` current specs, `docs/`, `tests/`, and `tests_e2e/` (excluding archives and explicit negative fixtures) to detect legacy routes, imports, or active terminology.
- [ ] 9.6 Add lifecycle regression cases for replacement Style Master CAS/head/grant/attempt/selection behavior, Page Image plan/batch/provenance/reconciliation behavior, current media and async outcomes, and target-draft activation without source-evidence inheritance.

## 10. Validation And Completion

- [ ] 10.1 Run focused unit/integration suites for parser, Core, adapters, progressive lifecycle, state, inspection, CLI, delivery, and coherence guards; fix all failures without reintroducing a v2 fallback.
- [ ] 10.2 Run the replacement mock E2E journeys and the full repository regression suite; record that no real provider submission or production deck migration was used for verification.
- [ ] 10.3 Run `git diff --check`, current-term/legacy-route audits, and `openspec validate correct-framed-page-image-model --strict`; verify the active change's specs, design, and completed tasks agree before requesting apply completion/review.
