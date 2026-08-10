## Context

See `proposal.md` for motivation and the delta specs for the required behavior.
Today the raw owner can already prove the exact plan, batch, selected IDs,
maximum submissions, grant, attempt, and provenance path, but it has no durable
reference to the Work Request that permits normal provider work. It therefore
uses `requires_human: true` for every missing batch grant. The MD Controller
then faithfully stops on that producer flag, and the task projection repeats it
without owning the decision.

The current global State schema is v5 and permits optional version-scoped
records. Progressive raw plans and grants are immutable, content-addressed
records. A new protocol must preserve read/reconcile access to old records and
must not hand-edit a run bundle or derive authority from a task projection.

## Goals / Non-Goals

**Goals:**

- Make one current Work Request visible to the runtime as a bounded, durable
  Page Image Task Mandate without storing its conversational prose.
- Preserve the exact-grant and one-item-submit control path while making its
  routine steps Agent-run under a valid mandate.
- Keep direct owner facts authoritative across raw-owner inspection, CLI,
  Controller handoff, recovery, and audit.
- Preserve human visual decisions and every current identity/integrity/
  recoverability hard-stop.

**Non-Goals:**

- No generic budget ledger, numeric cost policy, natural-language intent
  parser, arbitrary scope flag, or mandate record in a derived presentation
  data view.
- No automatic acceptance of Pilot or Complete Page Review evidence.
- No change to Style Master grants, Page Class schema, provider transport, or
  Framed protected-composition behavior.
- No migration, writeback, or continuation of v3 production evidence.

## Decisions

### Normalize the mandate in State, then bind it through the raw plan

`state.mjs` will own an optional `page_image_task_mandate.by_version` record.
Its canonical fields are limited to the record schema, run version, workflow,
active execution ID, execution-start timestamp, and fixed
`normal-page-image-production` scope. Its canonical digest is the Task Mandate
reference. It deliberately contains no Work Request prose, prompt, credential,
provider response, or generic budget.

Selected adapter planning will first use one state-owned compare-and-swap
mutation to create or replay a deterministic mandate candidate from current
State. It then receives the candidate digest and compiles the progressive full
plan with that digest. The existing state-side raw-plan handoff rechecks the
same current state/plan facts under its own compare-and-swap write. Source
refinements in the same version/workflow/execution reuse the same record; a new
version, workflow, or execution creates a different digest.

The chosen owner is State because the mandate must survive a new invocation,
but it is not a new Controller or a source of semantic content. The MD Agent
recognizes a clear Work Request and decides whether feedback is still in scope;
JS validates only the exact resulting State/plan facts. A different Deck, new
goal, explicit limit, or genuinely new content/design direction must take the
existing fresh-execution/replacement route before planning. JS does not attempt
to infer any of those semantics from prompt text or a task card.

Alternative considered: create a new public `image2 mandate` command or store
the Work Request verbatim. The former adds an Agent-visible checkpoint solely
to record bookkeeping; the latter creates a privacy-sensitive, ambiguous
authority record. Reusing normal provider-free planning and normalized State
facts is shorter and matches the Task Mandate policy.

### Version the full-plan binding, not every downstream grant shape

New progressive raw plans will use a v2 schema that adds
`task_mandate_sha256`. Batches, grants, attempts, and provenance already bind
the exact plan hash, so they gain mandate attribution through the immutable
plan instead of duplicating the new field in every record shape. Before a grant
or one-item submission, the raw owner will validate that the plan's digest is
the current State mandate for the same version/workflow/execution.

Readers will continue to validate v1 plans and their grants/attempts for
inspection, terminal reconciliation, review, and historical evidence. A v1
plan is not eligible for a new grant or provider submission after this change;
the owner returns the one current-plan rebuild action. It never rewrites a v1
plan or attaches a mandate retroactively.

Alternative considered: add the mandate digest to the grant schema. That would
duplicate a fact already transitively bound by the plan and would force a wider
immutable-record migration. Plan-level binding is the smallest direct source
that still makes every exact grant attributable.

### Change only routine raw-owner actions to Agent-run guides

With a valid v2 mandate-bound plan, the raw owner will emit
`plan_progressive_pilot` and `authorize_progressive_raw_batch` as
`requires_human: false`. The MD Agent may select risk-representative formal
slide IDs within the current full plan, invoke the existing exact `pilot` /
`expansion` / `authorize` forms, and then call `generate` one item at a time.
The CLI forms and hash requirements do not change.

Partial Pilot `proceed | repair | redirect` and Complete Page Review
`proceed | repair` remain human quality choices. A submitted unknown attempt,
identity mismatch, stale/invalid plan, mismatched mandate, invalid media,
invalid provenance, or lifecycle conflict remains a hard-stop with its current
owner-issued recovery. The direct fact path is therefore:

```text
State Task Mandate + v2 full plan -> exact batch -> exact grant
  -> one item submit/reconcile -> Pilot or Complete Page Review
```

`inspectWorkflow` and CLI diagnostics continue to consume the raw owner's one
action; they do not reclassify it from prose. The task projection remains a
derived card and never establishes mandate or grant authority.

### Retain controller node identities but remove their human-cost decision

The existing Framed and Pure `authorize-target-*-pilot` and
`authorize-target-*-expansion` node IDs remain stable to avoid needlessly
retiring current Controller identities. Their `authorize/revise/decline`
decision declarations and user-decision exits are replaced by one CLI-evidence
exit for a validated mandate-bound exact grant. The downstream generation nodes
depend on that evidence, not a synthetic `user` decision.

After a successful `image2 authorize`, a state-owned, idempotent Controller
handoff verifies the direct raw-owner grant, plan, and mandate before recording
`cli` evidence and completing the corresponding node. If this handoff loses a
CAS race, the raw grant stays the source of truth; rerunning the exact
`authorize` command replays the grant and repairs the same handoff. No task
projection write can complete a node.

Alternative considered: delete the authorize nodes or let the projection mark
them complete. Deleting nodes creates avoidable current-state migration
pressure; allowing a projection to decide lifecycle state creates a second
authority. Stable node IDs plus direct CLI evidence preserve the existing
ownership boundary.

### Keep the change narrow and policy-aligned

`human-centered-gates.md` classifies a matching mandate as `guide`: the Agent
continues without a second permission prompt. Pilot/Complete Page Review remain
`confirm` because they ask for a presentation-quality choice. Identity,
integrity, attributable execution, security, and recoverability remain
non-bypassable `hard-stop`s. `agent-assistance-and-control.md` is satisfied by
one direct source (State + raw owner), one evaluator, and a same-check repair.
`simple-reliable-control.md` is satisfied because the change removes repeated
cost-confirm branches and adds no retry, fallback, or parallel success store.

## Verification Strategy

- **Unit:** extend progressive schema/raw-owner tests for v2 plan binding,
  mandate replay, stale/missing mandate short-circuit, v1 read/reconcile-only
  behavior, exact grant replay, and unchanged unknown-attempt handling.
- **Integration:** add State and selected Framed/Pure planning fixtures proving
  one deterministic mandate record, same-execution source refinement reuse,
  fresh-execution invalidation, typed CLI handoff evidence, and no write during
  observation.
- **CLI/Controller:** exercise public `image2 plan/pilot/authorize/generate`
  diagnostics and Controller parsing so routine scopes carry
  `requires_human: false`, while Pilot/Complete Page Review and true hard-stops
  retain their existing posture.
- **E2E:** extend the existing mock target-workflow journey for both Framed and
  Pure through Pilot, Expansion, and Complete Page Review. It will prove that
  exact grants remain required without a human-cost diagnostic and that the
  human review branch is still present. No live provider or production deck is
  a test fixture.

## Risks / Trade-offs

- [A mandate could become broader than the Work Request] -> Bind it to one
  exact version/workflow/execution and require the Agent to begin a fresh
  execution for changed goal/scope; do not infer semantic intent in JS.
- [A v2 plan could make historic evidence unreadable] -> Keep v1 readers for
  inspection/reconciliation and reject only a *new* v1 provider submission.
- [State/plan CAS races could leave a grant without Controller progress] ->
  Treat the raw-owner grant as direct authority and make the state handoff
  idempotent via exact grant replay.
- [A policy sentence could weaken visual review] -> Tests assert that partial
  Pilot and Complete Page Review still return `requires_human: true` and only
  a typed user decision opens their downstream branch.
- [Style Master still asks for its own candidate authorization] -> Keep that
  separate explicitly; this change removes the repeated Page Image raw-batch
  prompt without asserting a false cross-owner unification.

## Migration Plan

1. Add the optional v5 State record and v1/v2 progressive-plan readers before
   any writer changes; observation remains byte-preserving.
2. Make selected Framed/Pure provider-free planning atomically establish or
   reuse the mandate and publish a v2 plan.
3. Require mandate/plan matching before a new grant or provider attempt, then
   update owner actions, CLI diagnostics, and Controller handoff nodes.
4. Run focused unit/integration/CLI tests, the mock Framed/Pure journey, strict
   OpenSpec validation, and the repository regression suite.
5. Rollback before any v2 scope is used is ordinary code rollback. After a v2
   plan exists, retain the dual reader and use the owner recovery/replan path;
   do not revert the Harness in a way that makes current evidence unreadable.

No run bundle is migrated in place. A historical v1 scope remains historical;
new provider work starts from a newly planned current mandate-bound scope.
