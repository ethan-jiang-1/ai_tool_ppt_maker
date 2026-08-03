## Context

See `proposal.md` for motivation and the delta `image-generation` spec for the
behavior contract. The progressive raw owner already reads all immutable batch,
grant, attempt, and materialization records through one direct evaluator.
`validateAttemptState` currently rejects every sibling attempt transition before
it can derive the current attempt or issue a reconciliation action. The v7
reproduction contains exactly one branch: a submitted parent with valid
childless `known_failure` and `unknown` children.

## Goals / Non-Goals

**Goals:**

- Preserve the direct-record evaluator as the only source of progress and
  recovery truth.
- Derive a deterministic effective terminal record for the one proven-safe
  redundant-terminal shape without altering any record on disk.
- Let the existing current unresolved attempt regain its normal exact
  reconciliation route after the historical branch is evaluated.

**Non-Goals:**

- Repairing, deleting, reordering, or migrating historical records.
- Adding a CLI command, a force/waive path, provider lookup, retry, or a
  persisted repair decision.
- Treating `unknown` as successful, reusable, current raw evidence, or a
  provider-free materialization.
- General tolerance for duplicate roots, arbitrary sibling transitions,
  `succeeded` conflicts, or incomplete records.

## Decisions

### D1: Normalize only one validated sibling pair in the direct evaluator

**Owner: JS.** After existing schema, plan/batch/grant binding, and individual
transition validation succeeds, `validateAttemptState` will inspect each
submitted parent's direct children. It will accept a sibling set only when it
has exactly two entries with statuses `known_failure` and `unknown`, both are
terminal transitions from that same submitted parent, and neither has a child.
The evaluator will retain the `known_failure` child in its effective chain and
mark the `unknown` sibling as ignored for derivation only.

This happens before live-claim, current tuple, grant-consumption, and next
action computation, so every current consumer sees the same effective graph.
The immutable direct records remain enumerable and unchanged. The alternative
of a separate repair file would create a second source of truth; the alternative
of accepting arbitrary branches would weaken the integrity boundary.

### D2: Known failure is the only permitted effective terminal outcome

**Owner: JS.** A fully received unusable provider response is already recorded
as `known_failure`; a sibling `unknown` contains no stronger evidence and
cannot reopen a paid submission. Selecting the known failure preserves the
strictest safe result: no materialization, no success, no retry under the old
grant, and normal successor derivation only after all current facts permit it.

No equivalent rule exists for `succeeded`, two `unknown` records, two known
failures, a nonterminal sibling, or a descendant. Those remain hard-stops.
This narrow asymmetry is preferable to timestamp ordering because immutable
attempt records have no authoritative ordering field and a timestamp-based
winner would manufacture a result from presentation metadata.

### D3: Keep the gate and recovery route unchanged

The recognized pair is a deterministic `guide` inside the existing evaluator:
the Agent may rerun the existing owner-issued checkpoint without another human
decision. Per `human-centered-gates.md`, every other divergent shape stays an
integrity `hard-stop`, protecting attributable attempts and provider-cost
recoverability; no waiver crosses that invariant.

Per `agent-assistance-and-control.md`, the direct records and one evaluator
remain authoritative. Per `simple-reliable-control.md`, the change removes the
false global branch failure rather than adding a repair controller: direct
facts -> existing evaluator -> current exact reconcile action. The closest
legal next action after an unsupported branch remains the existing integrity
repair path; after the accepted pair it is whatever the evaluator already
derives for the current attempt.

### D4: Test both the permitted shape and its nearest unsafe neighbor

**Unit/integration:** extend the progressive raw-owner fixture to append the
two valid terminal children to one submitted parent, then create a newer
unresolved successor. Assert that inspection/generation blocks only on the
newer exact reconciliation action, the historical effective status is known
failure, and no direct record changes during read-only inspection.

Add a near-miss branch with `succeeded` plus `unknown` (or a descendant) and
assert the original attempt-chain hard-stop, no provider submit, and no
wrong-owner mutation. Reuse the workflow-inspection seam to prove the same
owner action is projected without a provider call. No E2E is needed because
the defect is deterministic direct-record evaluation and external I/O would
not add coverage.

## Risks / Trade-offs

- [A malformed branch resembles the accepted pair] -> require exact statuses,
  direct shared parent, valid transitions, no descendants, and all existing
  binding checks before deriving any effective terminal.
- [A future writer creates the pair again] -> immutable history remains
  inspectable; focused tests preserve the narrow evaluator behavior while no
  writer is relaxed.
- [The current v7 recovery still has an unresolved newer attempt] -> the
  repaired evaluator exposes its existing exact reconciliation action; it does
  not declare the newer attempt resolved.

## Migration Plan

1. Add the red direct-record regression and the unsafe near-miss regression.
2. Implement the evaluator-only normalization and rerun the same tests plus
   workflow inspection and repository verification.
3. Strict-validate the OpenSpec change, then re-run v7 through the existing
   owner interface: first exact reconciliation, then the resulting owner action.
4. No data migration occurs. Rollback is code-only and returns the affected
   history to the previous integrity hard-stop without changing records.
