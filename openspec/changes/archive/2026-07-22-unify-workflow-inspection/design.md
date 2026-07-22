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

Create `scripts/shared/workflow/inspect_workflow.mjs` (or the repository's established equivalent shared workflow location) exporting `inspectWorkflow({ runDir, requestedIntent })`. It invokes existing read-only owner interfaces for bundle-layout/canonical-path validity, exact version/mode and source contract, durable-state validity/recovery posture, artifact/review freshness, applicable authorization posture, and active transaction/journal facts. It returns a frozen projection:

```text
schema: "pptmaker-workflow-inspection-v1"
checkpoint: exact run/version plus every direct-fact identity used for the verdict
posture: "ready" | "guide" | "confirm" | "hard-stop"
root_cause: nullable first bounded owner/fact blocking requestedIntent
primary_action: exactly one typed action with owner, action ID, human requirement,
                and terminal/completion representation when no mutation follows
observations: ordered non-primary facts
continuation: nullable, only an owner-provided allowed human choice
protected_invariant: nullable, required for hard-stop
evidence_summary: attributable artifact/review summary only
```

The object is a projection, never a generic workflow state machine. `primary_action` is a typed object rather than a command string: its stable fields are `owner`, `action_id`, `requires_human`, and `kind: continue|repair|review|recover|complete`; it may carry an owner-issued structured invocation or a bounded display label, but no caller-authored shell text. `kind: complete` is the single terminal action and has no mutation invocation. This prevents a ready or completed checkpoint from manufacturing a fictitious command merely to satisfy the one-action rule.

`requestedIntent` is nullable. When present, it is an owner-issued, normalized observation descriptor from the current controller/adapter, not a public free-form command, mode override, authorization request, or a second playbook. Inspection passes it only to the direct owner that already defines that descriptor. An absent descriptor means "resume the exact current run". A descriptor that is absent, malformed, or inapplicable produces the owning bounded repair/selection action and does not cause inspection to guess a path. Authorization is inspected only when the selected direct owner declares it applicable to this descriptor; inspection never eagerly evaluates every possible provider operation. Multiple technically eligible controller branches remain controller-owned routing facts: inspection emits one action to obtain that routing decision, and exposes alternatives only as a bounded continuation when the gate owner requires a human semantic choice.

**Why:** A small composition module hides owner ordering from callers while keeping every fact with its existing direct owner.

**Alternative considered:** Extend `buildResumeCard`, `buildHtmlResumeGuidance`, or the CLI router individually. This preserves multiple evaluators and cannot establish output parity across observation surfaces.

### 2. Use prerequisite-first precedence with one action and retained observations

Inspection evaluates run-bundle layout/canonical path, source/identity/schema/recovery prerequisites, then current requested-intent prerequisites before implications. It returns the first repairable failed prerequisite as `root_cause` and exactly one `primary_action`. Independent, non-primary facts remain ordered `observations`; they cannot become competing recovery menu entries. `continuation` exists only when the owning gate reports a real human semantic choice. Gate owners, not inspection, classify `guide`, `confirm`, and `hard-stop`; a hard-stop includes its protected invariant and has no force/waive escape.

**Why:** This implements direct fact -> one check -> earliest root cause -> one legal action -> rerun, while preserving useful nonblocking evidence.

**Alternative considered:** A single string `next` field or a ranked list of commands. The former hides evidence and the latter requires Agents to arbitrate owner protocol.

### 3. Preserve raw state and require pure observation reads

`state --json` retains an explicit `durable_state` payload containing the exact parsed durable-state document used for observation. It is the only raw-state document in the report: raw keys are not duplicated at top level. Top-level fields retain the documented resume-card/compatibility projection (`pipeline`, `state_present`, reviews, mode card, node/card fields, and `workflow_inspection`), so a projection cannot overwrite a field inside `durable_state` or double report size. This preserves the existing CLI JSON sanitizer's depth/byte bounds rather than expanding them for a duplicate state. `status --json` gains the same nested inspection object. Both call the inspection module once per command invocation and serialize the projection with a shared canonical JSON serializer (stable key order, no outer-report formatting) so equality is asserted over those canonical bytes, not incidental pretty-print position. `checkpoint` contains only stable direct-fact identities, never wall-clock time, process identity, random value, command name, or presentation data. Parity is required only when both commands observe the same checkpoint, and a changed identity requires a new projection rather than cache reuse. Human-readable `state`/`status` show the primary action from that result and may retain each command's contextual text.

Inspection uses the existing non-mutating state pair: `readState(deckDir, { purpose: "observe", heal: false, runDir })` supplies the parsed durable document, and `validateStateReadOnly(deckDir, { runDir })` supplies bounded persisted-byte/evidence diagnostics. The latter is required because an unhealed `readState` result alone does not expose every canonicalization defect that execution could heal. State-owner mapping converts a validator issue into the existing repair/replacement action; inspection never performs that action merely because an Agent requested observation. The existing execution and mutation APIs remain responsible for approved healing and must recheck direct facts immediately before write/submit.

**Why:** The no-write/no-network boundary prevents status from becoming a hidden repair or success authority, while raw state remains available for forensic debugging.

**Alternative considered:** Heal state during inspection or persist a cached readiness result. Either creates a writer/cached authority, violates the observation contract, and makes stale results actionable.

### 4. Adapt existing consumers; do not introduce a second controller model

`ppt_flow` owns CLI envelope and presentation adaptation; `state.mjs` remains owner of raw state and state APIs; the run-bundle layout module remains owner of canonical bundle structure; playbooks retain workflow nodes and human decision language. Existing `html_resume_guidance`, status enrichment, resume card computation, and text rendering are refactored to adapt `workflow_inspection.primary_action` and owner-provided evidence rather than independently decide completion or next action. Temporary compatibility fields remain derived from the shared projection, not independently re-evaluated.

**Why:** Consumers receive the same direct result without moving playbook authority into JS or copying CLI diagnostic schema into controllers.

**Alternative considered:** A new public `inspect` command plus unchanged status/state. It adds another observation surface without removing the duplicated evaluators that this change exists to measure and consolidate.

### 5. Make the ledger and BUG-033 baseline durable review artifacts, not runtime state

Add a framework-maintenance ledger documenting each durable field's direct owner, writers, readers, freshness/invalidation, reconstructibility, and removal path. Add canonical journey baselines covering fresh HTML, fresh Image2-only, HTML-then-Image2, resume, small refresh, structural versioning, visual-slot refinement, migration/transition, and crash/recovery. The BUG-033 fixture uses supported init/owner interfaces and records each asserted blocker, its earliest direct diagnostic, exact file/state diff, human-decision requirement, and same-check rerun result.

The ledger is review/implementation evidence for Change 2, not a runtime registry or a replacement owner. The BUG-033 fixture starts from the existing temporary-run helpers (`createHtmlFirstRun` for source/layout cases and `createCurrentHtmlDelivery` for settled HTML delivery), but its new setup steps use only init and owning state/review/authorization/assembly interfaces. It does not copy a run bundle, write YAML/receipt/PPTX bytes directly, or mutate `_generated/` to manufacture a result. Existing CLI contract tests are the public-surface harness; focused helper tests are the direct-owner harness. If a claimed BUG-033 blocker cannot be reproduced, the baseline says so rather than inventing a fix or bypass.

### 6. Reuse the existing observe read path and make compatibility adapters explicit

Inspection reads durable state through the existing `readState(deckDir, { purpose: "observe", heal: false, runDir })` and `validateStateReadOnly(deckDir, { runDir })` contracts. It does not add a second parser, validator, or generic state-read API. If a direct owner needs a more specific observation projection, that owner exposes it through its existing read boundary and the inspection module composes the result.

The only Change-1 compatibility next-action adapters are `html_resume_guidance`, `workflow_summary`, `suggested_next`, and `eligible_candidates`. They remain available for their current readers but derive from `workflow_inspection` and direct owner evidence; they are not independent evaluators. The durable-field ledger records each reader and the Change-2 retirement condition. Other new aliases are out of scope.

**Why:** This makes the implementation seam concrete, prevents a parallel state parser, and bounds compatibility debt before control retirement.

**Alternative considered:** Create a new generic read facade or preserve every existing summary field indefinitely. The former duplicates state authority; the latter leaves the present control duplication intact.

### 7. Detect an unstable multi-owner checkpoint instead of mixing facts

Every direct-owner read returns or permits derivation of a stable identity used in `checkpoint` (for example canonical state/source/receipt bytes, version-bound record identity, or layout result identity). Inspection records these identities, composes its result, then rechecks each participating identity once. It does not retry in a loop or acquire a new lock. If any identity changed, it discards the mixed verdict and returns `posture: guide` with one bounded read-only `{ owner: "workflow-inspection", action_id: "refresh-workflow-inspection", kind: "continue", requires_human: false }` action; `root_cause` names the changed direct owner and callers rerun the same observation checkpoint. This coordinator action owns no fact and creates no new state authority.

**Why:** The projection must describe one coherent fact set without creating a snapshot store, lock owner, retry daemon, or cache.

**Alternative considered:** Return the mixed result with a list of identities, or retry until stable. The former can recommend an action from stale facts; the latter is an unbounded control loop and can mask active-writer contention.

## Risks / Trade-offs

- [A pure projection disagrees with legacy status behavior] -> Specify output parity, retain compatible outer fields, create before/after journey snapshots, and use the shared result as the only new next-action source.
- [Existing read APIs heal or mutate] -> Use `purpose: observe, heal: false` at every inspection entry; instrument focused fixtures to assert zero state/history/metadata/generated changes.
- [Projection overwrites or duplicates a durable field] -> Keep the exact parsed document only under `durable_state`; test conflicting field names, one-copy output, and existing CLI JSON depth/byte bounds.
- [Intent becomes a hidden route/authorization API] -> Accept only owner-issued normalized descriptors, evaluate authorization only when that owner makes it applicable, and return owner selection/repair rather than infer a route.
- [Inspection becomes a second authority] -> No cache or writes; direct owner records remain visible in raw state; every writer revalidates source/CAS/authorization/receipt before mutation.
- [One action hides important facts] -> Keep ordered observations and a nullable continuation only where a gate owner explicitly permits a human choice.
- [BUG-033 drives an unsafe shortcut] -> Treat it as a measurement probe; retain scope-bound authorization, provenance, canonical assembly, and recovery protections.
- [Scope leaks into Image Production realignment] -> Test and inventory unchanged paths/record keys/bytes; defer graph, directory, and durable-wire work to Change 3.

## Migration Plan

1. Establish the durable-field ledger and journey/BUG-033 baseline using current owners, the existing temporary-run fixture helpers, and non-writing observation probes.
2. Implement the pure inspection module by reusing `readState(..., { purpose: "observe", heal: false })` plus `validateStateReadOnly`, with focused unit tests for layout-first ordering, typed action/terminal shape, owner-issued intent handling, canonical serialization, checkpoint drift, and no side effects.
3. Adapt `status`, `state --json`, human text, and the four named resume compatibility adapters behind the compatible nested projection; retain the raw state only under `durable_state` and documented outer card fields without duplicating raw bytes.
4. Add integration and E2E tests for JSON parity, markerless compatibility, representative production modes, same-check rerun, and mutation-owner revalidation.
5. Run focused tests followed by the full regression suite; compare protected records, paths, and bytes for the frozen Image Production baseline.

The rollout is additive at the output boundary. Successful status/state JSON reports retain the registered CLI JSON transaction/sanitizer and its existing depth/byte bounds. Existing non-zero input/identity/state failures retain their single producer-owned stderr envelope rather than emitting a partial or fabricated stdout projection. Rollback removes consumer use of the new nested projection and restores prior presentation adapters; it does not require state migration because inspection writes no durable record. A defect in a direct owner is repaired by that owner and rerun through the same inspection checkpoint.

## Open Questions

None block implementation. The Change-1 ledger will record the exact reader inventory and observed BUG-033 diagnostic results; it may narrow the explicitly named compatibility adapters, but it must not add new ones without a supported reader and a Change-2 retirement condition.
