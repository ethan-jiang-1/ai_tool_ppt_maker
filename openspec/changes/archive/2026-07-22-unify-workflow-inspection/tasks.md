## 1. Baseline And Direct-Owner Evidence

- [x] 1.1 [workflow-inspection] Create the Change-1 durable-field ledger covering mode/source, generic node records, domain transactions, review/receipt/provenance, authorization, human decisions, journals, reset, and recovery; record owner, writer, readers, freshness/invalidation, reconstructibility, and removal path for every field.
- [x] 1.2 [workflow-inspection] Capture canonical journey baselines for fresh HTML-only, Image2-only, HTML-then-Image2, resume, small refresh, structural versioning, visual-slot refinement, migration/transition, and crash/restart, including command count, authority hops, writes, human gates, and independent failure branches.
- [x] 1.3 [workflow-inspection] Build the BUG-033 minimal fixture from the existing temporary-run helpers and only supported init/owner interfaces; record each claimed blocker’s earliest direct diagnostic, file/state diff, required human decision, canonical repair, and same-check rerun result without direct YAML/receipt/authorization/PPTX or `_generated/` edits.
- [x] 1.4 [workflow-inspection] Add focused baseline tests that fail if the probe or representative observation path writes state/history/metadata/generated artifacts or opens a remote/provider client.

## 2. Read-Only Inspection Core

- [x] 2.1 [workflow-inspection] Add the shared `inspectWorkflow({ runDir, requestedIntent? })` module and versioned projection schema with identity-bound checkpoint, posture, root cause, exactly one typed primary action (including terminal completion), observations, continuation, protected invariant, and evidence summary.
- [x] 2.2 [workflow-inspection] Compose the existing `readState(..., { purpose: "observe", heal: false })` and `validateStateReadOnly` boundaries (and owner-specific read projections where needed) so inspection reports repairable/invalid/markerless state without schema heal, migration, journal recovery, cache creation, or durable writes; do not add a second parser, validator, or generic state-read facade.
- [x] 2.3 [workflow-inspection] Compose the run-bundle layout/canonical-path, mode/source, artifact/review, applicable authorization, transaction/journal, provenance, and recovery readers in prerequisite-first order; preserve owner-produced gate classification, continuation, invariant, and repair actions rather than reproducing their schemas.
- [x] 2.4 [workflow-inspection] Define owner-issued nullable intent descriptors, canonical nested-projection serialization, immutable result construction, and stable checkpoint identity capture (without time/process/random/presentation entropy) so only identical observed checkpoints produce byte-equivalent output across consumers.
- [x] 2.5 [workflow-inspection] Add unit tests for stable result and typed terminal-action shape, owner-issued intent scoping, layout-first/prerequisite short-circuiting, `validateStateReadOnly` repair mapping, ordered observations, one primary action, guide/confirm/hard-stop handling, unknown submit fail-closed behavior, zero-write/zero-network behavior, checkpoint-drift refresh without retry/lock/cache, and same-check rerun after owner repair.

## 3. Observation Consumer Cutover

- [x] 3.1 [cli-surface] Refactor `ppt_flow status` and `status --json` to obtain readiness and next action from inspection, retain compatible status/artifact fields, present the shared primary action without a competing status evaluator, and preserve registered CLI JSON transaction/sanitization plus existing non-zero envelope behavior.
- [x] 3.2 [node-specification] Refactor `ppt_flow state` and `state --json` plus resume-card adapters to add nested `workflow_inspection` and immutable `durable_state` as the sole raw-state document, retain documented recovery/debug/card output and markerless compatibility, avoid raw-state duplication under existing CLI JSON bounds, and preserve state mutation ownership.
- [x] 3.3 [cli-surface] Ensure plain status/state observation does not heal/migrate/recover or invoke providers; route repairable state and interrupted journals through existing producer-owned diagnostics and owner actions.
- [x] 3.4 [playbook-execution] Update active resume/gate guidance to consume inspection’s primary action, observations, and explicit continuations while keeping playbook routing, human reason capture, artifact presentation, and hard-stop explanations with their existing owners.
- [x] 3.5 [workflow-inspection] Retain only `html_resume_guidance`, `workflow_summary`, `suggested_next`, and `eligible_candidates` as compatibility adapters derived from inspection/direct evidence; document their supported readers and Change-2 retirement condition in the ledger, and do not begin generic node control retirement or Image Production wire/graph changes.

## 4. Integration And Regression Coverage

- [x] 4.1 [cli-surface] Add integration tests proving successful `status --json` and `state --json` contain canonically byte-equivalent `workflow_inspection` for an unchanged checkpoint, diverge only with changed checkpoint identities, retain distinct compatible outer fields, preserve conflicting durable fields only inside `durable_state`, and do not double-serialize large version-scoped records beyond existing CLI JSON bounds; prove unusable context retains one stderr envelope without partial stdout projection.
- [x] 4.2 [node-specification] Add negative tests proving a prior inspection cannot satisfy changed source/receipt/authorization/CAS prerequisites for a subsequent gate, transition, journal, reset, or recovery mutation; assert wrong-owner no-mutation behavior.
- [x] 4.3 [playbook-execution] Add controller tests for durable resume, markerless compatibility, explicit confirm reason/continuation, hard-stop invariant/recovery, controller-owned multiple-candidate routing, and no inferred alternate mode/controller/recovery path.
- [x] 4.4 [workflow-inspection] Add representative fresh HTML-only, Image2-only, and HTML-then-Image2 inspection fixtures, including stale review, required visual-slot refinement, and current complete delivery cases; assert no HTML/refinement debt is fabricated across modes.
- [x] 4.5 [workflow-inspection] Add E2E coverage for status/state observation parity, zero-write/zero-network inspection, BUG-033 earliest-diagnostic evidence, and canonical repair followed by the same build checkpoint.
- [x] 4.6 [workflow-inspection] Run the frozen Image Production baseline and verify unchanged directory paths, `image2-refinement` record key, mode enum/pipeline behavior, protected bytes/path behavior, authorization, receipt/provenance, CAS/journal, and recovery contracts.

## 5. Validation And Handoff

- [x] 5.1 Run focused unit and integration suites for the inspection module, state, CLI observation, controller guidance, and BUG-033 fixture; resolve all failures without adding bypasses or manual generated artifacts.
- [x] 5.2 Run the relevant `tests_e2e/` scenarios and full `npm test`; record any pre-existing unrelated failure separately from this change.
- [x] 5.3 Run `openspec validate unify-workflow-inspection --strict` and verify `openspec status --change unify-workflow-inspection` is apply-ready.
- [x] 5.4 Review the ledger, journey baselines, and output snapshots against the Change-1 exit criteria: one shared evaluator, byte-equivalent JSON projection, raw-state compatibility, zero-write/zero-network observation, evidence-backed BUG-033 classification, and no scope creep into Changes 2 or 3.
