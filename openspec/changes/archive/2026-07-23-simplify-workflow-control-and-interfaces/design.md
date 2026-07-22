## Context

Change 1 established `workflow_inspection` as the canonical zero-write projection for one exact
run. Generic controller state and CLI/status routing still retain overlapping control decisions.
This Change removes only facts that the Change-1 ledger proves reconstructible, while preserving
all direct mutation owners and the Image Production physical/durable model for Change 3.

## Goals / Non-Goals

**Goals:**

- Give each supported exact-run resume/iteration goal one deep workflow-entry interface backed by
  inspection, while preserving direct initialization and mutation entries.
- Retire reconstructible generic node writes in checkpointed, reversible steps.
- Preserve raw state compatibility and direct-owner mutation-time revalidation.

**Non-Goals:**

- Change Image Production graph, directories, record keys, adapters, provider authorization, or
  whole-page implementation.
- Add a workflow cache, generic state setter, new CLI command, or an operation-catalog facade.

## Decisions

### D1 - Inspection is the sole run-scoped observation/resume seam

**Owner: MD<->JS protocol.** After a Controller has resolved a semantic intent and exact run, its
resume/iteration observation consumes the existing inspection projection's single ordered action.
`status` and `state` are the CLI observation consumers. The entry accepts only the existing
owner-issued normalized observation descriptor, not arbitrary user intent, public command flags,
or a mode override. It does not expose owner-specific state fields, authorization records, or
recovery protocol beyond the owner-issued bounded action.

Greenfield `init` has no exact run and remains its direct CLI entry. A run-scoped mutation command
(`build`, `refresh`, `approve`, `state` mutation, `image2`, migration, and equivalents) remains a
closed-grammar dispatch to its direct owner: it may return that owner's gate/recovery result, but
MUST NOT replace the requested operation with an inspection resume action. The module is deep
because it hides observation composition; it is not a mutation authority or operation catalog.

### D2 - Retire generic state only from the ledger

**Owner: state.** `tests/contracts/workflow-control-ledger-v2.json` is the machine-checkable Change-2
ledger; `PPTMAKER_FRAMEWORK/reference/workflow-inspection-ledger.md` is its human explanation, not a
second source of truth. Every entry names `id`, `surface` (`durable|derived`), direct owner, writer,
readers, invalidation/freshness rule, reconstructibility, decision, and replacement tests. A
compatibility decision additionally names retirement owner, removal trigger, and exact
`retire_by` (`change:<name>` or `release:<version>`). The ledger test rejects missing fields,
unknown decisions, malformed/expired retirement bounds, and a writer retirement without a
replacement test.

The execution cursor (`playbook`, `current_node`, execution/version binding, and current-node
`waiting_for`) is classified `retain-direct`: it is not reconstructible generic control. Candidate
derived action evaluators are the `buildResumeCard` summary/suggested-next/eligible-candidate logic
and the `ppt_flow` HTML-resume compatibility adapter. A reconstructible record stops new writes or
an evaluator stops making decisions only after its consumers have a proven direct replacement;
supported historical records remain readable only through an inventoried compatibility reader.
Human intent that cannot be reconstructed may remain only as a minimal durable fact under its direct
writer's CAS boundary. A field with incomplete ledger evidence is retained for this change.

### D3 - Three checkpoint cutover

1. Controller and CLI observation consume inspection while legacy generic writers and direct
   mutation dispatch remain unchanged.
2. Ledger-approved generic writers stop writing; direct owners retain their existing writes.
3. Remove readers with no supported caller, or retain named compatibility readers.

Each checkpoint has focused regression before the next starts. Checkpoint 2 cannot retire a writer
until the ledger row and replacement-reader test are complete; checkpoint 3 cannot retain an alias
or reader without its bounded removal record. Release rollback restores the prior implementation;
it never asks users to edit state. Existing state remains parseable throughout.

### D4 - Gate and mutation boundaries do not move

Inspection still reports owner classification. `guide` identifies a mechanical next action,
`confirm` exposes only owner-approved reasoned continuation, and hard-stop protects
identity/integrity/authorization/recovery without force or waive. Every mutation independently
rechecks direct facts, CAS/journal/receipt/provenance and authorization after entry returns.

### D5 - Inspection owns resume-action composition; cards retain facts and display adapters

**Owner: workflow-inspection.** After layout, state-integrity, exact mode, journal, and other
protected direct prerequisites are checked, inspection reads the state-owned execution cursor.
It returns one `primary_action` for a current `waiting_for`, an in-progress node, or a bounded
controller-routing choice; it never emits an action menu. The wait action is exactly state-owned
`wait-for-human` / `continue` / `requires_human: true` with no mutation invocation. The other two
actions are playbook-controller-owned `resume-current-node` and `select-controller-route`, both
`continue`; their bounded display/invocation data identifies the route without asking a caller to
reconstruct it from cursor fields. Any waiting action is non-mutating and requires a fresh
inspection before a later mutation. Cursor facts remain available in the raw state/card for
context, but no caller may synthesize a competing action from them.

`workflow_summary` and `suggested_next` remain non-empty public display fields because the current
CLI contract requires them. `ppt_flow state/status` derives both solely from the same inspection
`primary_action`; `html_resume_guidance`, if retained during compatibility, is a lossy display
adapter of that same action and is never a controller input. `eligible_candidates` may remain a
bounded diagnostic list, but cannot select a route or override the primary action. `buildResumeCard`
retains factual cursor/card projection and stops independently deriving resume actions.

## Risks / Trade-offs

- [Ledger misclassifies a record as reconstructible] -> writer retirement is checkpointed and
  restart/same-check tests prove the direct owner can rebuild the action before reader removal.
- [Entry grows into a facade] -> deletion test and a fixed goal-to-entry table reject entries that
  merely rename command sequences.
- [Compatibility survives indefinitely] -> each retained reader names its retirement owner,
  trigger, and exact `retire_by`; no new write is permitted.
- [Inspection action changes a requested CLI operation] -> mutation dispatch stays with the
  command's direct owner; a regression proves a pending resume action cannot redirect a direct
  operation into a different command.
- [Control simplification loses a waiting or in-progress execution] -> the cursor is explicitly
  retained and inspection returns its one action before any optional candidate/summary display.
- [Simplification bypasses gates] -> direct owner remains authoritative and hard-stop negative
  coverage proves no state/authorization/receipt bypass.

## Migration Plan

1. Capture machine-checkable ledger decisions and its reference explanation, then baseline contract tests.
2. Land the three checkpoints in order, with schema-compatible reads at every point.
3. On regression, release-rollback the checkpoint implementation and preserve existing durable
   bytes; do not run a user-state migration.

## Entry Criteria

- Task 2.2 is blocked until every affected field has a complete machine-checkable ledger decision; uncertain
  non-reconstructible intent remains unchanged rather than being inferred away.
- Task 2.3 is blocked until the alias and compatibility-reader inventory records either `none` or
  a retirement owner, removal trigger, and exact `retire_by` for every retained path.
