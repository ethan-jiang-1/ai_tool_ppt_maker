## Context

See `proposal.md` for the observed repair-routing failure. Direct record
validation already establishes a `decided_by_prepared` relationship between an
immutable prepared Complete Page Review and its one immutable decision record.
Some consumers only test the prepared record's own unset decision field. That
locally plausible test conflicts with the append-only record model: a later
repair decision does not mutate the prepared input.

The progressive raw owner is the direct source of record and current evaluator
for this fact. Its lifecycle projection, state-mutating review operations, and
read-only current-review reader must agree. The artifact view already consumes
the relation-aware reader and is not a new authority.

## Goals / Non-Goals

**Goals:**

- Establish one relation-aware current-review selector inside the existing raw
  owner and reuse it at every current-review control point.
- Make the already-recorded human `repair` decision lead to one deterministic
  existing recovery action: source repair followed by raw rebuild and the same
  Complete Page Review.
- Lock down the real lifecycle sequence with focused, provider-free tests.

**Non-Goals:**

- Changing record layouts, CLI grammar or JSON, grants, provider transport,
  retry/reconciliation, accepted-evidence rules, or final/delivery behavior.
- Altering, deleting, migrating, or hand-editing any run-bundle record, media,
  receipt, or generated artifact.
- Choosing a page repair, changing user content, or submitting provider work.

## Decisions

### Use one owner-local current-review selector

Add a small internal selector over the validated complete-review snapshot. It
returns only reviews with an unset local decision *and* no entry in
`decided_by_prepared` for their digest, retaining the existing invalid-state
failure when more than one eligible review remains.

The selector is used by the complete-review action chooser, lifecycle current
evidence projection, unaccepted `prepare` replay selection, `accept` target
selection, and the public read-only current-review reader. This makes direct
validated lineage the one truth path across inspect, gate, and submit-style
operations, as required by `simple-reliable-control.md`.

`controller_handoffs.complete_raw_review` is intentionally different: it is a
decision-history projection consumed by the task handoff to show that the
human chose `repair`. It may retain the decision record, but must not select
current evidence or override the primary action. The existing accepted-review
replay is also intentionally separate: accepted evidence remains the current
finalization authority and its deterministic review projection may be rebuilt.

Alternative considered: mutate the prepared record when a decision is made.
Rejected because immutable prepared evidence is part of the auditable
append-only lineage. Alternative considered: patch only lifecycle inspection.
Rejected because preparation and acceptance would still revive or decide
historical evidence.

### Fail preparation and acceptance at the existing owner boundary

After a repair decision, the selector produces no current review and
`nextAction` produces `rebuild_progressive_raw_work`. Preparation rejects
before publishing or writing when there is neither an accepted-review replay
nor a current prepared review and the owner action is rebuild. Acceptance
rejects before validation or writing when there is no current prepared review.
Both return their existing bounded failure form with that single next action.
No replacement error schema or recovery command is added.

The human gate remains a `confirm`: the person records `proceed` or `repair`.
Once `repair` is recorded, the Agent can take only legal mechanical work; the
authoritative raw owner supplies the existing recovery route. Invalid or
ambiguous direct record lineage continues to fail closed through its existing
hard-stop errors, preserving integrity and recoverability under
`human-centered-gates.md`.

Alternative considered: silently prepare a new review for unchanged raw bytes.
Rejected because it turns one human repair decision into a second gate without
a source/raw rebuild and obscures the historical decision.

### Retain durable state and recovery discipline

No field, writer, cache, migration, or agent-side state is added. The direct
source is the current plan's validated immutable review/decision records;
`validateCompleteRecords` builds the relationship, the owner reads it, and no
other module persists a conclusion. The only invalidation is the existing raw
rebuild path, which produces a new current plan/review lineage through owner
interfaces.

This removes five inconsistent local selector expressions rather than layering
a new controller or validator. It satisfies the direct-fact, one-check, and
one-next-action requirements in `agent-assistance-and-control.md` and
`simple-reliable-control.md`.

## Risks / Trade-offs

- [A relation-aware change could hide a valid prepared review or break an
  accepted-review replay] -> retain the existing exact one-current-review
  cardinality check and cover prepared acceptance, accepted replay, and repair
  routing separately.
- [A later caller could still write before discovering repair] -> check the
  owner action/selector before invoking publication or writing a review, and
  assert direct records remain byte-for-byte unchanged on rejected requests.
- [Historical evidence could be mistaken for deleted evidence] -> preserve all
  immutable review and decision records; change only their currentness
  projection.

## Migration Plan

No data migration is needed. Existing append-only records already carry the
prepared-to-decision relation. Deploying the code changes only how those valid
facts are selected as current. Rollback restores the prior projection behavior
without rewriting run-bundle state, though it would reintroduce the known
incorrect route; it is therefore not a recovery technique for affected runs.

## Verification Strategy

- Unit/integration: extend the existing progressive raw-owner fixture from a
  fully materialized prepared review through a human `repair`; assert the
  original red symptom is green: rebuild is the primary action and current
  review evidence is absent.
- Negative owner operations: assert prepare and accept both reject after repair
  before a publisher/validator can run, return the rebuild next action, and
  leave direct records unchanged.
- Regression guard: extend the focused raw-owner seam with successful current
  prepared-review / `proceed` and accepted-review replay coverage, and assert
  that the audit-only repair handoff remains historical rather than becoming
  current evidence. The selected workflow wrappers are unchanged delegates, so
  their existing broader workflow coverage is not a new validation target.
- E2E: not required. The change is a deterministic owner-local lifecycle
  projection with no public-command, provider, or production-deck mutation.
