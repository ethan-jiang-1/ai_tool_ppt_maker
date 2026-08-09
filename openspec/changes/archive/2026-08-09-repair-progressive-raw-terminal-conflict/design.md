## Context

See [proposal.md](proposal.md) for the incident and motivation. The progressive
raw owner already reads immutable attempts, materialization provenance, and
media through one append-mostly plan snapshot. Its attempt-chain evaluator
currently permits a `known_failure` plus `unknown` sibling pair but rejects a
`succeeded` plus `unknown` pair, even when the succeeded terminal has the
ordinary direct provenance/bytes chain. Inspection catches that rejection and
projects `rebuild_progressive_raw_work`; public `image2 plan` and `reconcile`
then fail before they can perform such a rebuild.

The direct source of record remains the exact plan snapshot: attempt records,
their tuple-bound batch/grant lineage, validated materialization provenance,
and provider bytes. The progressive raw owner owns their evaluation; the CLI
only maps that owner result into its registered command/diagnostic surface.

The existing store reader validates each canonical immutable record, then
checks materialization bytes against `raw_sha256`. The existing owner
materialization validation verifies that a selected `succeeded` attempt names
the exact materialization provenance. The repair may reuse those facts only
after `loadPlanByHead` has completed both attempt-chain and materialization
validation; no inspection or public operation may expose a selected success
from a partially validated snapshot.

## Goals / Non-Goals

**Goals:**

- Recover the narrow verified `succeeded` plus `unknown` sibling race without
  rewriting immutable records.
- Make inspect, plan, reconcile, and generation share the same effective
  terminal evaluator and one executable next action.
- Preserve the existing non-retry cost discipline and fail closed for all
  unproven branches.
- Prove the incident sequence with fast, provider-free owner and CLI tests.

**Non-Goals:**

- No retry, direct provider polling, fallback endpoint, new grant, or recovery
  command.
- No hand edit, migration, deletion, or canonical rewrite of attempts,
  provenance, state, or generated artifacts.
- No adoption of a succeeded record without its existing direct provenance and
  media validation.
- No attempt to repair the named production deck as part of Harness source
  maintenance.

## Decisions

### 1. Treat only a proven success sibling as the effective terminal

The JS raw-owner evaluator will recognize exactly two childless terminal
children of one submitted parent when their immutable tuple is identical:
`succeeded` and `unknown`. It will retain the existing `succeeded` child as the
effective chain continuation and ignore only the `unknown` child for current
lifecycle selection after verifying the success through the existing
provenance/media validation path.

This is deliberately narrower than a general terminal-branch preference.
`succeeded` plus `known_failure`, multiple children, descendants, identity
mismatch, missing provenance, or invalid media remain integrity hard-stops.
The existing childless `known_failure` plus `unknown` compatibility rule is
unchanged. The rejected alternative, rewriting/removing `unknown`, would
violate append-only audit history. The rejected alternative, treating every
sibling branch as a hard-stop, leaves direct verified evidence unusable and
would also regress that existing known-failure rule.

The attempt evaluator may choose the candidate `succeeded` child only as an
internal continuation. The completed snapshot becomes usable only after the
existing materialization validator establishes its exact provenance and raw
bytes. This preserves the current direct-evidence ordering without a new
validator, field, or store format.

### 2. Reuse the owner evaluator across inspection and mutations

`loadPlanByHead` / attempt-state construction is the single source for the
effective terminal fact. Lifecycle inspection, current-plan locking,
reconciliation, and generation will therefore observe the same completed
verdict. A valid pair is a deterministic `guide`: the Agent may run the normal
owner-issued next action without new human approval. Existing grants retain
their exact maximum-submission accounting; the change cannot make an unknown
item eligible again.

`reconcile` has one additional no-write guard at this owner seam. When its
exact submitted parent already has the verified effective terminal, it returns
the completed owner projection without calling `lookup`, creating a terminal
attempt, changing a grant, or touching materialization. This makes a late
reconcile request idempotent instead of appending a third terminal sibling.

For an invalid branch, the evaluator remains a `hard-stop` protecting record
identity, provenance, and authorization. The CLI must not translate it into a
generic rebuild/retry statement unless a registered command can truly perform
that recovery. A bounded maintenance diagnostic is the sole fallback when no
runtime operation is legal. This removes the current misleading action rather
than adding another recovery route.

### 3. Validate at the owner seam and the public CLI seam

The primary regression is a three-item batch fixture: the first item submits
then reconciles to `unknown`; the second receives a verified media/provenance
success and an unknown sibling; the third remains the existing grant's only
eligible item. Lifecycle inspection and idempotent reconciliation of the
second parent must select that ordinary owner action without a new grant. A
negative companion removes or corrupts the success provenance and must remain
a hard-stop with no provider submit.

The owner suite is the deterministic tight loop. A focused public `ppt_flow
image2` fixture will prove that the valid pair no longer produces the generic
unreachable repair diagnostic, while invalid data produces only the bounded
maintenance failure. Full `npm test` remains the protected regression check;
real E2E/provider work is not needed because all fixtures use local bytes and
stubbed provider behavior.

## Control-Path Classification

Following [`human-centered-gates.md`](../../policies/human-centered-gates.md),
the verified pair is a `guide`; it needs no confirmation because it changes no
authority, scope, or human risk. Missing/invalid bytes or provenance and every
other branch shape remain `hard-stop`s. They protect immutable identity,
provenance, authorization, and recoverability, so no waiver or force route is
legal.

Following [`agent-assistance-and-control.md`](../../policies/agent-assistance-and-control.md)
and [`simple-reliable-control.md`](../../policies/simple-reliable-control.md),
the existing raw owner and store reader remain the one truth path. The only
control complexity removed is the inspection fallback that claims a generic
rebuild can fix an unrepairable integrity branch. For that branch, the CLI
reports the exact bounded maintenance outcome with `report_internal`; it does
not create a command, retry, state field, or recovery loop. Focused negative
tests prove no provider call or wrong-owner write occurs, while the valid test
proves the same checkpoint resumes.

## Risks / Trade-offs

- [A late success could be mistaken for an unproven success] -> Require the
  existing exact provenance and media validation before selecting it; otherwise
  fail closed.
- [The retained unknown could obscure provider cost] -> Keep it immutable and
  preserve normal exact grant consumption; never make that item retryable.
- [A broader branch rule could weaken integrity] -> Allow exactly one
  succeeded/unknown sibling shape alongside the existing known-failure/unknown
  shape, and retain focused negative tests for all other branches.
- [CLI and owner could diverge again] -> Test public diagnostics against the
  same owner fixture and leave CLI without a parallel evaluator.

## Migration Plan

No migration or deck mutation is required. The evaluator reads retained
immutable records under the same schema. A previous valid success/unknown pair
becomes usable only if its current direct provenance and media still validate;
otherwise it remains an unchanged hard-stop. Rollback is source rollback: no
new persistent field or record rewrite requires reversal.
