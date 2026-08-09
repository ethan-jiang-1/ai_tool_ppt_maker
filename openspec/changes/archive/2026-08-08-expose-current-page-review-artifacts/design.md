## Context

See `proposal.md` for the observed production block and the
`image-generation` delta for the required behavior. The existing artifact-view
already rebuilds a derived display surface from canonical owners. It reads the
progressive raw owner, validates the selected workflow's stored plan, and uses
the workflow adapter to project Pilot and accepted Complete Page Review media.

The defect is narrow: Complete Page Review display is conditioned on accepted
raw evidence. That evidence is intentionally created only after the human's
`proceed` decision, while the human needs the review pages before making that
decision.

## Goals / Non-Goals

**Goals:**

- Make owner-established, undecided Complete Page Review pages locatable in the
  existing provider-free artifact view for both Pure and Framed workflows.
- Reuse the same plan, raw-byte, and presentation validators that establish
  review validity; display never discovers files by path convention alone.
- Preserve the existing review `confirm` boundary: visibility supplies its
  input and never records `proceed`, `repair`, or any other decision.

**Non-Goals:**

- Changing `image2` commands, success JSON, selector grammar, state schema,
  grants, provider transport, review decisions, finalization, or delivery.
- Adding a second review artifact, a retry/reconciliation path, a local Pure
  compositor, or a display fallback for invalid/uncertain evidence.
- Migrating, rewriting, or treating production deck artifacts as fixtures.

## Decisions

### Use the progressive raw owner as the one authority for current review eligibility

Add a read-only owner reader for an exact current full plan's undecided
Complete Page Review. It will validate the current plan and all ordered
materializations, bind the review record to that same plan, and return only
current materialization facts plus the review identity. It is analogous to the
existing read-only Pilot evidence reader, rather than a directory scan.

The reader SHALL select a prepared review only when the raw owner's validated
`decided_by_prepared` relation has no corresponding decision record. A prepared
record remains immutable after `proceed` or `repair`, so testing only
`review.decision === null` would incorrectly revive historical review bytes.

The raw owner owns current plan, materialization, and review-record integrity;
the JS artifact view consumes that reader. The view adds no state writer,
cache, or duplicate review eligibility evaluator. If that reader cannot prove
current evidence, the existing bounded owner/CLI failure path remains the one
legal recovery.

Alternative considered: derive locators directly from `review_root` after
seeing a review digest in inspection. Rejected because filenames and an old
projection are not authority for current bytes, provenance, or workflow.

### Validate the workflow-specific presentation before projecting it

Expose a read-only current Complete Page Review inspector from each selected
workflow adapter. The inspector will consume the new raw-owner reader and the
existing Pure or Framed complete-page presentation validator. This preserves
Pure's one provider-rendered complete page and Framed's provider page plus its
production-equivalent header composite.

`targetImage2Operations` will expose this inspector beside the existing
accepted-review inspector. The artifact-view will prefer an undecided current
review when the raw owner establishes one; it will retain the existing accepted
reader for final-manifest and delivery eligibility. A current review may list
its pages and contact sheet, but it cannot make final media or delivery
available.

Alternative considered: relax the accepted-review inspector so it accepts an
undecided review. Rejected because finalization must keep its existing
accepted-evidence precondition, and combining the readers would make it easier
to use a display fact as finalization authority.

### Keep the display contract additive only at the evidence stage

The renderer and its collision-aware typed display references remain unchanged.
The Complete Page Review branch will emit existing-style provider-page entries,
Framed complete-page entries where applicable, and one contact-sheet entry in
full-plan order. Their purpose text will say `current` rather than `accepted`
when no decision exists. The existing unavailable item is emitted only when
neither an owner-validated current review nor accepted review exists.

This is a `confirm` input under `human-centered-gates.md`, not a new gate or a
continuation. The human still owns the one `proceed` or `repair` decision.
Invalid owner facts remain existing hard-stops protecting exact plan identity,
current bytes, review provenance, and recoverability. The Agent can always
mechanically rebuild the view; it never repairs evidence or enters a decision.

This is simpler than the current behavior: one owner-derived current-review
projection replaces a misleading unavailable status and avoids an Agent-side
path workaround. No durable state, retry, fallback, or second Controller is
added, in accordance with `agent-assistance-and-control.md` and
`simple-reliable-control.md`.

## Risks / Trade-offs

- [A stale or already-decided review projection could be displayed after source
  or raw drift] ->
  require the new reader and adapter inspector to revalidate current plan,
  materializations, prepared-to-decision relation, bindings, and workflow
  presentation before emitting any locator; retain the existing bounded failure
  rather than a fallback path.
- [Pure and Framed expose different page representations] -> share only the
  owner eligibility reader; preserve workflow-specific presentation validation
  and assert their distinct artifact sets in focused tests.
- [A display entry could be mistaken for acceptance] -> retain typed
  read-target language and test that rebuilding the view does not write state,
  decision, grant, attempt, or provider facts.

## Migration Plan

No source or durable-record migration is required. Existing run bundles retain
their evidence bytes. After deployment, `image2 artifact-view <run-dir>`
rebuilds the derived Markdown view from current records; removing the code
change reverts only the rebuildable projection. No rollback touches state,
receipts, grants, raw media, final media, or delivery artifacts.

## Verification Strategy

- Unit/integration: extend the progressive raw owner and Pure/Framed adapter
  coverage for an undecided, fully materialized complete review and for stale
  evidence rejection.
- CLI integration: extend the existing human artifact reference CLI fixture to
  prepare a current review, rebuild the public view, and assert every expected
  page/contact locator, order, type, purpose, workflow distinction, and no
  state/provider mutation.
- Real provider E2E: not required. The change consumes existing deterministic
  current evidence and makes no network call; provider behavior is already
  outside `artifact-view` by contract.
