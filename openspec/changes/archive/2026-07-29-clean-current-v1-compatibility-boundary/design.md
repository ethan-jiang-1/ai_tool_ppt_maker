## Context

The archived separate-framed-pure-workflows change established one target
new-authoring graph:

    03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration

It deliberately retained an exact CURRENT v1
page-authority-image2-v1 / image2-page-authority mixed run as bounded
compatibility. Post-archive inspection found that the boundary is not yet
operationally clean.

For a selected v2 run that already had its v2 source receipt, running
ppt_flow status created the v1 source-receipt.json as a side effect. The
write comes from ppt_flow's controller-context construction: it calls the v1
resolvePageAuthorityReceipt writer merely to derive slide_specs_valid before
the read-only workflow inspection runs. The direct observation sources already
exist: the marker/state resolver, inspectWorkflow, the v1 delivery-evidence
reader, and the v2 target-state reader. The writer-based context check is a
second, mutating projection rather than a missing source of truth.

The physical topology also retains an uncalled scripts/05-iteration wrapper,
empty test/E2E owner directories, and numbered v1 workflow paths that look
like active method-module owners. These paths make the required v1
compatibility implementation indistinguishable from a new-authoring route.

This is framework repository maintenance only. No deck_*, dpt_*, or
_generated/ production data is a fixture or migration target.

## Goals / Non-Goals

**Goals:**

- Make every status and controller observation marker-first and zero-write for
  workflow-selection-pending, selected v2 Framed/Pure, and exact CURRENT v1
  runs.
- Reuse the existing direct read-only inspection/evidence evaluators; make an
  absent or stale receipt a reported owner action rather than an observation
  side effect.
- Move retained v1 implementation, guidance, classifier, and focused proof to
  one explicit compatibility/current-v1-page-authority logical home.
- Remove demonstrably dead pass-throughs and README-only stale owner
  directories, then make architecture, source-to-test, documentation-link, and
  retirement audits reject their return.
- Preserve the target graph and keep 05-delivery as the only shared delivery
  owner for target workflows and bounded v1 delivery.

**Non-Goals:**

- No public CLI verb, flag, stdout/stderr diagnostic schema, provider
  authorization rule, source/state schema, or run-bundle migration changes.
- No change to exact v1 source-receipt, raw, final, delivery, or provider
  authorization byte semantics when an explicit v1 mutation route is used.
- No automatic CURRENT-v1-to-v2 conversion, compatibility fallback, new
  workflow, gate, cache, retry, durable state, or human decision.
- No relocation of target Framed, Pure, Delivery, or Iteration ownership.
- No project-versioning decision; H.10 remains a user-authorized decision
  outside this cleanup change.

## Decisions

### 1. One marker-first, read-only observation seam

JS retains deterministic marker/state/evidence evaluation. Markdown Controllers
retain flow and presentation ownership; they consume a derived inspection
projection and do not validate source bytes or manufacture a route. Humans
retain only the existing content, visual-review, and continuation decisions.

Both public observation paths, ppt_flow status and the ordinary ppt_flow state
projection, will obtain one workflow inspection before building a resume card.
Controller context will derive its slide-source condition from that same
inspection checkpoint or a direct read-only helper already used by it. It will
not call a v1 or v2 source-receipt writer. A source receipt that is missing,
stale, or otherwise not usable produces the existing closest owner-issued
action; it is not initialized while being observed.

The direct Source of Record remains the exact marker/source/state pair plus
the protocol-specific receipt/evidence files. inspectWorkflow remains the
single projection/evaluator owner for the observation checkpoint. No status
cache, status record, or controller-local pass/fail field is added. A mutation
owner still revalidates its direct facts immediately before it writes or
submits.

This preserves the existing human-centered gate classification:

| Inspection result | Owner | Meaning after this change |
| --- | --- | --- |
| guide | existing repair/adoption owner | The same deterministic provider-free repair or advisory is offered. |
| confirm | existing raw-review, delivery, workflow-selection, or continuation owner | The existing reversible human decision remains required and auditable. |
| hard-stop | existing identity, state, receipt, authorization, byte, or lineage owner | The protected invariant remains non-waivable; repair the named direct fact and rerun inspection. |

The protected invariant is that an observer cannot manufacture, refresh, or
authorize evidence. Direct-fact failure stops before dependent symptoms and
returns one legal next action. This removes the writer-based duplicate
validation instead of adding a quality-control layer.

Alternatives considered:

- Branch in the controller and call the v1 receipt writer only for v1. Rejected:
  status still mutates v1 evidence and retains a separate controller
  evaluator.
- Add a persisted status validity cache. Rejected: it duplicates direct facts,
  creates freshness/invalidation work, and cannot authorize a mutation.
- Parse source separately in the controller. Rejected: it creates a second
  authority beside the existing inspection/evidence readers.

### 2. Give CURRENT v1 one explicit compatibility home

The compatibility home is a logical path with domain-root-specific physical
locations:

| Surface | Final location |
| --- | --- |
| v1 implementation | PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/ |
| v1 workflow guidance and classifier | PPTMAKER_FRAMEWORK/workflow/compatibility/current-v1-page-authority/ |
| focused v1 unit/integration proof | tests/compatibility/current-v1-page-authority/ |

The current v1 adapter remains callable only after the marker/state resolver
has established an exact v1 pair. Its receipt-writing and lifecycle operations
remain mutation interfaces, not inspection interfaces. The top-level process
adapter has one narrow exception: an exact-v1 mutation dispatch may dynamically
call that compatibility interface only after routing has succeeded. This
exception never applies to status, ordinary state observation, target adapters,
shared workflow inspection, or a route resolved to a non-v1 pair.

The old numbered v1 paths are removed as a single relocation:

- scripts/04-image-production/ moves into the scripts compatibility home.
- workflow/04-image-production/ and workflow/05-iteration/ consolidate into
  the workflow compatibility home.
- tests/04-image-production/ moves into the test compatibility home.
- scripts/05-iteration/ is deleted after its only remaining classifier has
  moved to workflow guidance and its uncalled structural pass-through is
  removed.
- README-only tests/05-iteration/, tests_e2e/04-image-production/, and
  tests_e2e/05-iteration/ are deleted.

There are no long-lived re-exports or redirect modules. A path move is
performed atomically with all internal import and documentation-link changes,
so a released revision has either the old validated tree or the new validated
tree, never a compatibility shim. workflow/05-delivery/ and
tests/05-delivery/ remain in place because they are active shared delivery
owners.

Alternatives considered:

- Keep numbered directories with compatibility-only READMEs. Rejected: they
  continue to advertise retired active ownership and retain stale test owners.
- Keep an index re-export at scripts/04-image-production/. Rejected: it
  creates a durable second import route and hides accidental new callers.
- Fold v1 code into a target adapter. Rejected: it weakens v2-to-v1 isolation
  and reintroduces a mixed-workflow branch into new authoring.

### 3. Make architecture and ownership inventories encode the boundary

The architecture contract will distinguish the compatibility interface from
active target method modules. It will require the compatibility interface and
its focused test owner, while treating only 03-framed-image,
04-pure-image, 05-delivery, and 06-iteration as the target method graph.
Static import checks will reject a target adapter or shared observer that
imports the compatibility mutation surface, and focused process checks will
reject a compatibility-writer call from status or ordinary state observation.
The top-level exact-v1 mutation dispatcher is the narrow explicit exception.

The source-to-test ownership manifest, ownership baseline, governance and
retirement ledgers, and documentation/link audits will be updated in the same
wave. They will fail closed on a missing compatibility owner, an unowned moved
test, the deleted wrapper interface, a stale numbered path, or a target-to-v1
writer edge. The commands-reference requirement rename and its non-normative
Purpose text will be reconciled when the accepted delta is synced. The
05-delivery owner will continue to validate both compatible final-manifest
provenances through one delivery interface rather than branch on workflow
semantics.

Alternatives considered:

- Leave the inventories broad and rely on code review. Rejected: the existing
  stale wrapper and placeholder directories demonstrate that this boundary must
  be mechanically visible.
- Model compatibility as another target Phase. Rejected: it would make v1 a
  competing new-authoring route.

### 4. Verification is layered around mutation prevention and retained behavior

Unit/integration coverage will move with the v1 owner and retain exact v1 raw,
final, structural, and delivery-lineage contracts. Shared workflow tests will
continue to own inspection because it is the observer's stable responsibility.

Public-process tests will snapshot an entire temporary run bundle before and
after both status and ordinary state observation. The focused negative cases
will cover:

- workflow-selection-pending v2;
- selected v2 Framed and selected v2 Pure with a current v2 receipt and no v1
  receipt;
- exact CURRENT v1 with missing/stale evidence;
- a hybrid marker/state pair.

They must prove no state, metadata, history, provider request, generated
artifact, v1 receipt, or v2 receipt changes. Existing explicit validate and
v1 lifecycle tests retain the proof that only the sanctioned mutation route
may write a v1 receipt. Selected E2E retains exact v1 compatibility and both
target workflow journeys; it adds the selected-target observation regression
that previously escaped the fresh-selection test.

Architecture/documentation tests will assert the new ownership map and absence
of deleted paths. Full npm test remains the regression check after focused and
selected E2E checks pass.

## Risks / Trade-offs

- [Controller card changes when a receipt is missing] -> Derive the condition
  from the inspected direct fact and assert the existing nearest action rather
  than silently recreating evidence.
- [Relocation breaks a direct import or documentation link] -> Change imports,
  source-to-test manifest, link audit, and architecture contract in the same
  wave; run the static architecture test before broader tests.
- [A deleted placeholder was masking a real owner] -> Prove callers and test
  ownership first; preserve active delivery and shared-workflow tests rather
  than recreating empty directories.
- [A v1 compatibility move leaks into target authoring] -> Add a negative
  target-to-compatibility-writer architecture test and run selected Framed/Pure
  E2E journeys.
- [Observation becomes less helpful after writer removal] -> Require its
  output to retain the same owner-issued guide, confirm, or hard-stop posture
  and one nearest legal action; do not infer fallback state.

## Migration Plan

1. Add the selected-target status/state non-mutation regression first, then
   route controller context through the existing read-only inspection seam.
2. Relocate the retained v1 implementation, guidance, classifier, and focused
   test in one import-complete change; delete the numbered paths and dead
   wrapper in that same change.
3. Update architecture, ownership, retirement, and documentation inventories
   to declare the compatibility interface and reject old/cross-protocol routes.
4. Run focused unit/integration and process checks, selected E2E, npm test,
   git diff --check, and strict OpenSpec validation.

No run-bundle migration or generated-artifact rewrite occurs. Rollback is a
normal repository revert of this cleanup change: user data is untouched, exact
v1 receipt bytes remain compatible, and no dual-read or dual-write period is
needed.

## Open Questions

None. The final compatibility-home naming, migration direction, reader/writer
boundary, and rollback strategy are resolved by this design. H.10 remains
explicitly outside this change and requires separate user authorization.
