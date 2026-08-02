## Context

See [proposal.md](proposal.md) for motivation. The framework already has the
right durable owners: `controller-manifest-v3.json` owns Controller nodes,
playbooks own semantic lifecycle, `workflow_inspection` owns ordered observation
for an exact run, owner CLIs own mutation/authorization, and the run-bundle
locator owns exact-run resolution. The current gaps are at their presentation
and handoff boundaries: discovery lives mostly in prose, some prose teaches a
retired command sequence, doctor delegation loses a child action, and `state`
refreshes a collaboration card without declaring that narrowly permitted write.

This design adds no runtime workflow engine. It makes the missing discovery
contract static and auditable, then aligns existing entry, observation, and
documentation seams around it.

## Goals / Non-Goals

**Goals:**

- Give an Agent a closed, intent-first discovery surface for foundation, work,
  and orientation requests.
- Let novices express goals and understand the expected outcome and one real
  decision boundary without learning the production protocol.
- Preserve current owner CLI grammar, lifecycle authority, exact-run locator,
  provider authorization, and Page Authority semantics.
- Make delegated recovery and state/projection side effects deterministic,
  bounded, and testable.

**Non-Goals:**

- Natural-language parsing, a `ppt work` command, a `PptControl` registry, or
  any third production executable.
- New persistent route state, a changed provider/authentication contract, or a
  new authorizing action.
- Changing Framed/Pure semantics, Style Master, progressive Pilot/Expansion,
  or delivery state machines.
- Reading, migrating, or using production `deck_*` / `dpt_*` data as a test
  fixture.

## Decisions

### 1. Use a static catalog as the discovery seam

`PPTMAKER_FRAMEWORK/playbook/intent-routes-v1.json` will be a checked-in JSON
document with this minimal top-level shape:

```json
{
  "schema": "pptmaker-intent-routes-v1",
  "routes": []
}
```

Each route record uses exactly the eight agreed fields. `required_context` is a
small list of stable context tokens such as `exact-run` or
`failure-envelope`; `entry` and `first_safe_step` are stable discovery labels,
not shell syntax or lifecycle node sequences. `fallback` is another catalog ID
or `null`, which is permitted only for the terminal Route Gap. `visibility`
controls whether a user-goal rendering is available; it does not expose a route
ID or an owner implementation name to a novice.

| Route group | Required context | Entry / first safe step | Risk boundary |
| --- | --- | --- | --- |
| `foundation-local-runtime` | none | foundation / inspect local runtime | `no-remote` |
| `foundation-provider-readiness` | selected operation when needed | foundation / establish applicable readiness | `no-remote` |
| `foundation-channel-probe` | none | probe controller / disclose submit count | `confirm-live-diagnostic` |
| `work-new` | none | new-deck / establish local foundation | `owner-issued-authorization` |
| `work-resume` | exact run | resume / inspect exact run | `owner-issued-authorization` |
| `work-change` | exact run | classifier / classify requested change | `owner-issued-authorization` |
| `work-change-{text,visual,notes,structure}` | exact run | existing leaf playbook / confirm classified scope | `owner-issued-authorization` |
| `orientation-locate-run` | none | locator / request supported locator input | `no-remote` |
| `orientation-diagnostic` | failure envelope or symptom | diagnostic / consume current producer result | `no-remote` |
| `orientation-env-recovery` | none | recovery / run direct environment check | `no-remote` |
| `orientation-unrouted-intent` | none | Route Gap / name smallest missing extension | `no-remote` |

The fallback graph is intentionally short: missing exact-run context goes to
`orientation-locate-run`; a leaf change route can fall back to `work-change`
for classifier disambiguation; the unrecoverable discovery terminus is Route
Gap. Fallback cannot select a Deck, invoke a provider, or become an implicit
retry path.

The catalog stays beside the manifest rather than inside it because user-goal
discovery and lifecycle nodes change at different rates. It is preferable to a
new CLI because it adds no public execution grammar. It is preferable to prose
alone because contract tests can enforce coverage, context, and risk boundaries.

### 2. Preserve the ownership handoff at every route

The Agent interprets words; the catalog only validates the selected discovery
route. Once an exact run is resolved, the precedence rule is:

```text
explicit requested change -> classify-change -> existing leaf playbook
otherwise resume -> state --json -> workflow_inspection.primary_action
```

No route can turn a resume action into a mutation or a change request into a
resume. If the exact run is unavailable, the only work continuation is the
existing `RUN_BUNDLE.md`/exact-path locator. The design deliberately deletes
the tempting but unsafe alternative of scanning `deck_*` or inferring a latest
version.

For an unrecognized request, Route Gap is conversational only. It tells the
user whether a new route, playbook, or owner capability is needed, then waits
for confirmation before framework-maintenance work begins. It never writes
`selected_route_id` or any substitute into state, receipts, grants, attempts,
history, or the task projection.

### 3. Separate novice rendering from Agent audit detail

`COMMANDS.md` will use the catalog to organize a short goal-oriented table.
The table describes what a user can ask for, what the Agent will clarify or
inspect, the expected result, the meaningful confirmation/cost boundary, and
coarse timing. A separate Agent-facing mapping may name catalog routes and
current owner documentation, but the user-facing table will not teach command
grammar, hashes, grants, Page Authority, or raw topology.

New-deck presentation stops after the stable handoff:

```text
local foundation -> init -> user content and necessary choices
  -> create-deck Controller/current owner action
```

This avoids a second stale lifecycle description while preserving the current
owner's ability to change exact Style Master or progressive raw steps later.

### 4. Use one normal entry and one bounded recovery entry

The installed normal route remains the fixed twelve-command `ppt_flow`
surface. Direct `env-check` remains intentionally narrow: pre-install recovery
or unavailable-main-entry diagnosis. It can inspect operation-scoped readiness
but cannot locate a Deck, initiate a Controller, or grant a production action.

Direct help will be generated/maintained from the parser's actual accepted
forms, including `--mode` and `--operation`, and will remove retired
`--image2`. The normal doctor remains offline by default. A live smoke probe
is one submit; an all-channel probe is one submit per resolved channel. The
Agent displays that count and waits for confirmation. Probe success is a
channel-health fact only, never a raw-generation authorization.

### 5. Preserve diagnostic producers and fail closed at delegation

The parent doctor facade will first validate a child failure as a complete,
supported diagnostic. For valid child data, it constructs the parent envelope
by retaining the child producer fields and its exact `next`, then appending
only bounded delegated lineage. For invalid, missing, or unsafe child data,
the facade emits a new bounded delegated/internal diagnostic with
`report_internal`; raw child stderr is not a source of recovery policy.

This follows the direct control loop from
`agent-assistance-and-control.md` and `simple-reliable-control.md`:

```text
producer fact -> producer diagnostic -> one producer action -> rerun
```

It removes the current generic-action override instead of adding a parent
classifier or fallback menu.

### 6. Make the collaboration projection an explicit, narrow post-inspection writer

`inspectWorkflow` remains fully zero-write. The `state` command first obtains
its inspection result, then evaluates a small eligibility predicate: exact
current v2 run, selected workflow, active `create-deck` Controller identity,
and active progressive Controller node. Only then may it call the existing
atomic task-projection writer. All other observations return
`task_projection.status: "not-applicable"` without importing a writer.

The state response will always include:

```json
{ "task_projection": { "status": "created|updated|current|not-applicable" } }
```

Text output will render the same status. The card remains derived from current
inspection and typed handoffs, never read as control input. `status` and
`state --validate-state` skip the eligibility/writer path entirely. This keeps
the stated authority truth and the existing compatibility card behavior both
visible, rather than falsely calling the latter a zero-write observation.

### 7. Align contracts and tests around current vocabulary

Active `COMMANDS.md`, `BOOTSTRAP.md`, script help, current main specs, and
config pointers will be reconciled with the fixed owner grammar. Retirement
cleanup changes active terminology only; archives retain their historical
spelling unless a precise per-file exception is necessary. Test descriptions
will distinguish core, focused, sweep, mock E2E, and real E2E. `ppt_flow test`
keeps compatibility but states that it runs the core tier.

## Gate And Responsibility Model

| Situation | Outcome | Direct fact / owner | Human and Agent behavior |
| --- | --- | --- | --- |
| Missing local dependency or offline readiness failure | `guide` | environment-check | Agent can guide the deterministic repair and rerun the same check. |
| Requested smoke/channel probe | `confirm` | environment-check resolver count | Agent discloses the exact submit count; human confirms live diagnostic work. |
| Invalid/missing delegated diagnostic, identity drift, invalid authorization, or uncertain provider outcome | `hard-stop` | current producer/owner | Preserve the invariant, expose one owner action, and do not waive, infer, or retry. |
| Route Gap | advisory discovery result | catalog | Explain the missing extension; human decides whether to start maintenance. |

This does not alter gate classifications owned by
`human-centered-gates.md`. In particular, no route selection or readiness
result crosses authorization, identity, integrity, or recovery boundaries.

## Verification Strategy

- **Unit/contract:** validate catalog schema, closed route IDs, fallback graph,
  risk boundaries, absence of command/hash/authorization content, and absence
  of route persistence in every authority file/projection.
- **Focused integration:** use temporary run-bundle fixtures to prove explicit
  change precedence, locator-only behavior, offline foundation, valid versus
  invalid doctor delegation, and all four task-projection statuses while
  snapshotting authority files.
- **Process/document checks:** compare top-level/family help with parser forms,
  verify docs/config links and current terminology, and assert the novice table
  plus verification-tier wording.
- **E2E:** run affected mock E2E only when the modified public boundary needs
  it; real E2E remains separately authorized and is not a default validation
  step. No new test makes a real provider call.

## Migration Plan

1. Land fail-first tests and the static catalog validator before using catalog
   content in Agent-facing documentation.
2. Implement the narrow CLI/delegation/projection behavior and verify the
   direct owner facts remain unchanged.
3. Rewrite mirrors and help only after the behavior they describe is covered;
   update current specs/config pointers in the same change.
4. Run focused and core tiers, then strict OpenSpec validation. Affected mock
   E2E is opt-in; real-provider verification is not implied.

There is no run-bundle data migration and no durable route-state migration.
The catalog is additive and can be removed from discovery presentation without
touching production state. If the projection change must be rolled back, the
existing card remains derived/non-authoritative and no source, receipt, grant,
attempt, or authorization needs restoration.

## Risks / Trade-offs

- [Catalog becomes a second lifecycle engine] -> restrict its fields to
  discovery labels and assert the owner/lifecycle/catalog/presentation
  precedence in tests.
- [Novice copy conflicts with an owner change] -> keep exact lifecycle commands
  in owner docs and present only the durable handoff in the novice surface.
- [Projection eligibility broadens a hidden write] -> centralize the predicate,
  expose every outcome, and test `status`/validation/non-applicable paths as
  zero-write.
- [Delegation becomes more convenient but less trustworthy] -> preserve valid
  producer facts exactly and fail closed when validation cannot establish them.
- [Terminology cleanup mutates history] -> change only active contracts and
  maintain historical wording through narrow, explicit exceptions if required.
