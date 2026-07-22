## Context

The framework currently derives readiness in several observation paths. `ppt_flow.mjs` separately builds HTML resume guidance, enriches status, and renders status text; `state.mjs` produces a resume card from generic node state; controller guidance then consumes selected fields. Some existing reads use a healing state path, while direct owners independently validate mode/source, review evidence, authorization, transaction, and recovery before mutation. The result is duplicated next-action logic and an observation path that can be confused with authority.

This change is framework repository maintenance. It introduces an MD-to-JS observation protocol only: MD/Agent retains intent, path selection, artifact review, and human decisions; JS composes deterministic, owner-provided facts. Existing mode, source, state, review, authorization, transaction, and recovery owners remain the sole authorities for their records and mutation-time revalidation.

The design follows `human-centered-gates.md` for `guide|confirm|hard-stop` classification and continuation semantics, and `agent-assistance-and-control.md` plus `simple-reliable-control.md` for a direct, prerequisite-first, same-check-rerunnable control path.

## Goals / Non-Goals

**Goals:**

- Provide one pure `inspectWorkflow({ runDir, requestedIntent? })` composition seam and stable `pptmaker-workflow-inspection-v1` projection.
- Make status, raw-state JSON, text presentation, and resume guidance consume one ordered primary action while retaining their compatible outer fields and context.
- Record direct-owner facts and canonical journey baselines, including a reproducible BUG-033 probe, before any control deletion.
- Prove that inspection has no state/history/metadata/generated writes and no remote/provider calls, and that mutation owners do not trust a prior inspection.

**Non-Goals:**

- No generic node writer/reader retirement, new caller-facing command facade, or workflow-control cutover; these are Change 2.
- No Image Production graph, directory, physical implementation, production-mode, pipeline, durable-record, or compatibility-wire change; these are Change 3.
- No new cache, derived durable state, automatic heal, authorization, transition, recovery, force, or waiver path.
- No manual run-bundle, `_generated/`, receipt, authorization, state, or PPTX editing as a fixture or repair mechanism.

## Decisions

### 1. Add a pure inspection deep module owned by the JS observation protocol

Create `scripts/shared/workflow/inspect_workflow.mjs` (or the repository's established equivalent shared workflow location) exporting `inspectWorkflow({ runDir, requestedIntent })`. It invokes existing read-only owner interfaces for exact version/mode and source contract, durable-state validity/recovery posture, artifact/review freshness, authorization posture, and active transaction/journal facts. It returns a frozen projection:

```text
schema: "pptmaker-workflow-inspection-v1"
checkpoint: exact run/version plus observed direct-fact identities
posture: "ready" | "guide" | "confirm" | "hard-stop"
root_cause: nullable first bounded owner/fact blocking requestedIntent
primary_action: exactly one ordered legal action with owner and human requirement
observations: ordered non-primary facts
continuation: nullable, only an owner-provided allowed human choice
protected_invariant: nullable, required for hard-stop
evidence_summary: attributable artifact/review summary only
```

The object is a projection, never a generic workflow state machine. `requestedIntent` selects the path being inspected but cannot grant authority or bypass prerequisites. The module reads canonical direct facts through read-only APIs; it does not reimplement producer schemas.

**Why:** A small composition module hides owner ordering from callers while keeping every fact with its existing direct owner.

**Alternative considered:** Extend `buildResumeCard`, `buildHtmlResumeGuidance`, or the CLI router individually. This preserves multiple evaluators and cannot establish output parity across observation surfaces.

### 2. Use prerequisite-first precedence with one action and retained observations

Inspection evaluates source/identity/schema/recovery prerequisites before implications, then current requested-intent prerequisites. It returns the first repairable failed prerequisite as `root_cause` and exactly one `primary_action`. Independent, non-primary facts remain ordered `observations`; they cannot become competing recovery menu entries. `continuation` exists only when the owning gate reports a real human semantic choice. Gate owners, not inspection, classify `guide`, `confirm`, and `hard-stop`; a hard-stop includes its protected invariant and has no force/waive escape.

**Why:** This implements direct fact -> one check -> earliest root cause -> one legal action -> rerun, while preserving useful nonblocking evidence.

**Alternative considered:** A single string `next` field or a ranked list of commands. The former hides evidence and the latter requires Agents to arbitrate owner protocol.

### 3. Preserve raw state and require pure observation reads

`state --json` retains its raw durable state, state schema, recovery/debug fields, and current compatible resume-card data. It gains a nested `workflow_inspection`; the projection cannot replace or normalize raw state output. `status --json` gains the same nested object. Both call the inspection module once per command invocation and serialize its nested value using a common canonical serializer so the result is byte-equivalent across both outputs for the same checkpoint. Human-readable `state`/`status` show the primary action from that result and may retain each command's contextual text.

Inspection uses non-mutating state parsing/validation. A state needing migration, heal, or repair returns the owning repair action; it never performs that action merely because an Agent requested observation. The existing state and mutation APIs remain responsible for approved healing and must recheck direct facts immediately before write/submit.

**Why:** The no-write/no-network boundary prevents status from becoming a hidden repair or success authority, while raw state remains available for forensic debugging.

**Alternative considered:** Heal state during inspection or persist a cached readiness result. Either creates a writer/cached authority, violates the observation contract, and makes stale results actionable.

### 4. Adapt existing consumers; do not introduce a second controller model

`ppt_flow` owns CLI envelope and presentation adaptation; `state.mjs` remains owner of raw state and state APIs; playbooks retain workflow nodes and human decision language. Existing `html_resume_guidance`, status enrichment, resume card computation, and text rendering are refactored to adapt `workflow_inspection.primary_action` and owner-provided evidence rather than independently decide completion or next action. Temporary compatibility fields remain derived from the shared projection, not independently re-evaluated.

**Why:** Consumers receive the same direct result without moving playbook authority into JS or copying CLI diagnostic schema into controllers.

**Alternative considered:** A new public `inspect` command plus unchanged status/state. It adds another observation surface without removing the duplicated evaluators that this change exists to measure and consolidate.

### 5. Make the ledger and BUG-033 baseline durable review artifacts, not runtime state

Add a framework-maintenance ledger documenting each durable field's direct owner, writers, readers, freshness/invalidation, reconstructibility, and removal path. Add canonical journey baselines covering fresh HTML, fresh Image2-only, HTML-then-Image2, resume, small refresh, structural versioning, visual-slot refinement, migration/transition, and crash/recovery. The BUG-033 fixture uses supported init/owner interfaces and records each asserted blocker, its earliest direct diagnostic, exact file/state diff, human-decision requirement, and same-check rerun result.

The ledger is review/implementation evidence for Change 2, not a runtime registry or a replacement owner. If a claimed BUG-033 blocker cannot be reproduced, the baseline says so rather than inventing a fix or bypass.

## Risks / Trade-offs

- [A pure projection disagrees with legacy status behavior] -> Specify output parity, retain compatible outer fields, create before/after journey snapshots, and use the shared result as the only new next-action source.
- [Existing read APIs heal or mutate] -> Add/read through explicit observation-safe accessors; instrument focused fixtures to assert zero state/history/metadata/generated changes.
- [Inspection becomes a second authority] -> No cache or writes; direct owner records remain visible in raw state; every writer revalidates source/CAS/authorization/receipt before mutation.
- [One action hides important facts] -> Keep ordered observations and a nullable continuation only where a gate owner explicitly permits a human choice.
- [BUG-033 drives an unsafe shortcut] -> Treat it as a measurement probe; retain scope-bound authorization, provenance, canonical assembly, and recovery protections.
- [Scope leaks into Image Production realignment] -> Test and inventory unchanged paths/record keys/bytes; defer graph, directory, and durable-wire work to Change 3.

## Migration Plan

1. Establish the durable-field ledger and journey/BUG-033 baseline using current owners and non-writing observation probes.
2. Implement the pure inspection module with focused unit tests for ordering, result shape, and no side effects.
3. Adapt `status`, `state --json`, human text, and resume consumers behind the compatible nested projection; retain raw state and old outer status fields.
4. Add integration and E2E tests for JSON parity, markerless compatibility, representative production modes, same-check rerun, and mutation-owner revalidation.
5. Run focused tests followed by the full regression suite; compare protected records, paths, and bytes for the frozen Image Production baseline.

The rollout is additive at the output boundary. Rollback removes consumer use of the new nested projection and restores prior presentation adapters; it does not require state migration because inspection writes no durable record. A defect in a direct owner is repaired by that owner and rerun through the same inspection checkpoint.

## Open Questions

- Which existing state read entry can expose validated but unhealed bytes most cleanly, versus requiring a dedicated read-only adapter?
- Which canonical test fixture can exercise BUG-033 with owner-created authorization/receipts while remaining deterministic and provider-free?
- Which current compatibility fields must remain temporarily as aliases to `primary_action`, and which can be removed only in Change 2 after the ledger proves no supported reader?
