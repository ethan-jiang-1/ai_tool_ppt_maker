## Context

See proposal.md for motivation. The shared progressive raw owner already has
the direct records needed to distinguish a raw-contract/provider-request tuple
from one paid submission attempt: immutable batch, grant, and attempt records.
The current production reproduction shows that a successor reuses the same
current slide request while its new `claimed -> submitted` record is rejected
by the lifecycle evaluator before it can expose reconciliation.

## Goals / Non-Goals

**Goals:**

- Preserve the existing exact unresolved-attempt hard-stop for a successor
  submission.
- Keep each paid successor submission attributable to its own batch/grant and
  attempt chain while retaining the same plan-bound raw request where valid.
- Make raw-owner inspection and workflow inspection return the same exact
  reconciliation action for the successor attempt.

**Non-Goals:**

- No provider lookup, resubmission, fallback, force flag, or old-grant reopen.
- No attempt/state/receipt migration or hand-editing of run-bundle records.
- No new CLI command, public diagnostic schema, durable state field, or
  controller route.

## Decisions

### Keep submission identity batch-local

The JS raw owner remains the sole writer and evaluator of attempt records. A
successor may legitimately reuse the plan-bound raw-contract and provider
request for a slide, but its paid submission identity must remain distinct from
the predecessor's chain through the existing current batch/grant facts.
Alternatives considered were rewriting old records or treating identical
provider-request content as a duplicate attempt; both violate immutable
history and conflate request content with a paid submission.

### Reuse the existing evaluator and reconciliation action

The repair belongs in the current direct-record evaluator and its attempt
construction/binding path. Inspection, generation preflight, and state already
consume that evaluator, so no new recovery controller or projection is added.
For a transport interruption, `human-centered-gates.md` keeps the result a
non-bypassable `hard-stop` protecting provider-cost recoverability; the only
legal next action remains exact reconciliation. The Agent can run that
mechanical action, while a later successor grant remains the existing human
cost confirmation.

### Lock the actual multi-batch pattern at the raw-owner seam

The regression will create a six-item plan, terminalize a one-item partial
Pilot as `unknown`, derive and authorize its successor, then inject a transport
failure on the successor's first item. It asserts a current `submitted` record
and the exact reconcile action from both raw-owner inspection and the
workflow-inspection projection. This is a deterministic unit/integration seam;
no E2E or real provider call is needed. It removes the false-invalid branch
from the quality path rather than adding a validator or recovery state, in
line with `simple-reliable-control.md`.

## Risks / Trade-offs

- [Treating a genuinely malformed cross-batch record as valid] -> retain all
  existing plan, batch, grant, raw-contract, and predecessor validation; only
  the valid successor chain becomes legal.
- [Existing production records remain immutable] -> the evaluator must accept
  the valid historic shape or return its existing bounded hard-stop; it never
  rewrites evidence to manufacture recoverability.
- [A test accidentally masks the transport boundary] -> inject an exception
  after durable submission and assert the `submitted` record plus reconcile
  action, not merely a thrown error.

## Migration Plan

1. Add and run the red local successor-interruption regression.
2. Repair the direct attempt identity/evaluator path and rerun the same test.
3. Run existing raw-owner and workflow-inspection suites, then re-inspect the
   specified v7 run through the owner interface.
4. No migration or rollback data operation is needed: removing the code change
   restores the previous evaluator without touching immutable records.
