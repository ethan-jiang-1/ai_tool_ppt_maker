## Context

See proposal.md for the motivation. The current target raw runtime stores a
single v2 work plan and accepted evidence under the version-derived
_generated tree, records one plan-wide authorization, submits every item in
one loop, and writes raw bytes after the loop returns. That shape cannot
preserve an irreversible provider attempt if the process stops between a
request and the later batch write.

Change 2 now guarantees a current accepted Style Master selection before the
page raw plan is built. The remaining design problem is therefore narrow but
cross-cutting: retain one complete plan as authority, make paid work
recoverable item by item, and expose the right selected-workflow human
checkpoint without adding a second renderer, controller, review system, or
authorization evaluator.

## Goals / Non-Goals

**Goals:**

- Replace the plan-wide raw provider authorization with immutable exact batch
  grants derived from one current full plan.
- Preserve every irreversible paid-work fact before the next provider call,
  while keeping progress and task cards derived.
- Give Framed and Pure separate Pilot evidence and Controller experiences,
  then converge them at complete raw review and the existing delivery chain.
- Make recovery deterministic: direct records first, one action next, and no
  inferred result or repeated charge.
- Keep existing Page Authority source/workflow/style and final delivery owners
  authoritative.

**Non-Goals:**

- No parallel provider submissions, background worker, polling daemon, or
  implicit retry.
- No new Style Master candidate/promotion lifecycle, structural-versioning
  protocol, or per-slide workflow dispatch.
- No automatic deck migration, production-deck scan, hand editing of
  _generated, or import of production data as test fixtures.
- No second full raw plan, cost ledger, raw review, or Framed renderer.

## Decisions

### 1. Separate irreversible raw history from rebuildable projections

**Owner: JS raw materialization owner; layout declares paths; MD only consumes
references.**

Introduce page-authority-raw-work-plan-v3 and
page-authority-accepted-raw-evidence-v3. The current full plan is first
compiled provider-free from the selected adapter. Its append-mostly plan container
lives in:

    1_upstream_raw_material/page-production-iterations/
      plans/<plan-sha256>/
      scopes/<run-version>/<workflow>/head.json
      _staging/

The append-mostly plan container carries exact full-plan input facts, batch
projections/grants, attempts, materialization provenance, and canonical raw
bytes. Its immutable plan identity is staged and validated before the initial
container rename; later direct records are independently staged and published
as immutable additions. The small scope head advances with compare-and-swap
only after the initial plan container is published. It is the only mutable
current-plan pointer and stores the exact scope-bound full-plan identity, not
progress, derived debt, or a competing batch head.

The version _generated/page_authority_image2/raw and review directories retain
only rebuildable plan/review/final projections. A delete or rebuild of those
derived artifacts cannot erase or recreate a provider attempt. This follows
the existing Style Master candidate-history pattern instead of treating
_generated filenames as durable authority.

Alternative considered: retain attempts and bytes beside the v2 plan under
_generated. Rejected because the project explicitly treats that leaf as
rebuildable and a removed projection would make irreversible cost facts
ambiguous. A generic state.yaml ledger was also rejected because it would
duplicate the raw owner's direct facts and create a second writer.

### 2. Derive exact batches from the complete plan

**Owner: JS raw plan/batch evaluator; Agent proposes sample semantics; human
confirms exact cost.**

The v3 plan covers all current raw items in canonical source order. A batch is
an immutable projection:

    full plan identity
      + kind (pilot or expansion)
      + ordered selected IDs and raw-contract digests
      + review-sample IDs
      + paid-submission IDs
      + source/execution/profile identities
      + maximum submissions

Each immutable batch also carries a positive owner-issued `batch_generation`
and nullable `previous_batch_sha256`. They make an exact same-plan retry
distinct without accepting a caller nonce: the raw evaluator derives the only
eligible predecessor from validated direct records. Reissuing the same eligible
planning action exact-replays its batch; a conflicting second live branch or
overlapping paid scope hard-stops. A successor can be planned only after its
predecessor has no live claim and every selected paid item is either
materialized or terminal. Thus a known-failed item remains paid debt for a
newly disclosed successor scope, while successful tuples are reused rather
than resubmitted.

The Pilot command accepts repeated current formal IDs only. It resolves that
set once through the existing identity authority, then filters it in full-plan
order. The Agent owns why those pages are representative; JS owns whether the
IDs, tuples and plan are current. Reusable current materializations can be in
the review sample but never inflate paid scope. When current paid debt exceeds
five, a partial Pilot must contain at least one paid-submission ID and every
paid Pilot item must also be a review-sample tuple; a reuse-only sample cannot
become a synthetic cost/quality gate. The owner returns the ordered formal IDs,
paid membership, maximum submissions, and source-derived `position + title`
display fields for human scope review. Position/title are presentation only and
are excluded from batch identity.

Expansion is not selected by the caller. After a persisted current partial
Pilot proceed, the evaluator derives the remaining paid debt from direct
materialization facts and emits one exact Expansion batch. Thus neither an
input count nor a later grant can reinterpret prior Pilot bytes.

For debt of one through five, the exact debt set becomes the paid Pilot
materialization scope but no partial Pilot decision is produced. Once all
full-plan coverage is present, complete review asks the only quality question.
For zero debt, the evaluator skips Pilot completely and routes straight to
complete review.

Alternative considered: make Pilot and Expansion partial raw plans. Rejected
because it would create competing plan identities, complicate reuse, and let
the later batch act as accidental full-plan authority.

### 3. Use a one-item durable attempt state machine

**Owner: JS raw materialization owner.**

For each paid item the owner uses a bounded lifecycle:

    eligible -> claimed -> submitted -> succeeded | known_failure | unknown

Claim is persisted after all direct-fact checks and before a provider request.
Immediately before the request, the attempt records the deterministic provider
request/idempotency identity. Success atomically commits the bytes,
provenance, succeeded terminal record and grant consumption. The next item
cannot claim until that commit or an explicit terminal outcome completes.

More precisely, a persisted `submitted` attempt consumes its one grant slot;
consumption is derived from attempts and is never a mutable counter. On a
successful response, the owner stages bytes and provenance in one confined
materialization bundle, validates it, atomically publishes that bundle, and
CAS-transitions the submitted attempt to `succeeded` with its provenance
identity. The terminal CAS is the visibility boundary: an orphan staging entry
or published bundle without its exact succeeded attempt is not materialization
or evidence. This gives atomic logical commit even though filesystem files are
published in a safe order. A known failure cannot retry its item under the old
grant, but it does not hide later unsubmitted selected items; when the batch
becomes terminal, retrying its remaining debt requires a successor batch and
new exact grant.

Generate processes at most one eligible item per invocation. This is the
shortest visible loop that permits Agent progress reporting and lets a person
pause before the next cost. A claimed pre-submit attempt can resume only the
same exact generate action. A submitted attempt without a provable outcome is
unresolved and blocks the batch. Reconcile is an explicit operation that
queries only the persisted request identity through supported provider
idempotency or lookup semantics; it may prove success, prove a known failure,
or terminalize the record as `unknown`. It never resubmits. A terminal
`unknown` cannot reopen its old grant or become current evidence. Once its
predecessor is terminal, any later paid attempt needs an owner-derived
successor batch/projection, a newly disclosed scope, and a new exact grant.

An unresolved submitted attempt blocks every successor batch, grant, and
full-plan head advance, not only the next generate call. If source or profile
facts drift while it is unresolved, reconciliation still accepts the exact
historical attempt identity solely to establish its terminal record; the result
never makes historical bytes current or reusable without ordinary tuple
validation.

Derived progress classifies items as materialized, unsubmitted,
known-failure-terminal or unknown. It is recomputed from plan/batch/attempt/
provenance records for inspect, CLI and Controller. No counter, checkbox, file
count or process-local progress is persisted as an alternative truth.

Alternative considered: retain the existing full-plan generate loop and flush
all results at the end. Rejected because a process loss can no longer tell
whether a paid request occurred. A background retry queue was rejected because
it obscures cost and introduces another control path.

### 4. Keep Pilot evidence mechanically equivalent but semantically separate

**Owner: selected workflow adapter; shared raw owner validates generic coverage.**

The Framed adapter exposes a private Pilot composite operation using the same
canonical compiler, browser evaluator, font inventory and capture profile as
finalization. It produces two preview-only views for each selected tuple:
validated raw underlay and the final-equivalent local Text Frame composite.
This operation cannot write final manifest, final projection, PPTX, notes,
accepted raw evidence or delivery state.

The Pure adapter publishes exact current raw full-page bytes plus generic
identity/plan/profile binding. It has no Framed imports or safe-zone/Text Frame
semantics. Shared machinery can lay out generic labels and verify raw tuples,
but cannot decide visual quality or translate one workflow's contribution into
the other.

Pilot decision records are separate from complete raw-review records. A
partial Pilot proceed solely enables Expansion planning. Complete review
rebuilds/validates a full ordered projection from every materialization
provenance, then a proceed writes the one accepted-raw-evidence-v3 record.
The existing selected workflow finalizer, PPTX assembly, notes injection and
Delivery Review run only from that evidence.

Alternative considered: use the existing complete raw contact sheet as Pilot
evidence. Rejected because it cannot show a Framed final composite and would
wrongly suggest partial coverage can become raw acceptance.

### 5. Make the public CLI explicit and deliberately breaking

**Owner: CLI producer; MD Controller consumes its output.**

The fixed image2 forms in the cli-surface delta are the only progressive
production operations. The important boundary is:

    plan -> pilot or expansion -> authorize -> one-item generate
         -> pilot-review/pilot-accept or complete review/accept

All mutating submit commands require both the full plan hash and batch hash.
The Pilot command owns official exact-scope creation from formal IDs; --slides
is not retained as an alias or fallback. The old plan-only authorize/generate
forms are rejected rather than silently treating all items as a batch. Review
and accept are stage-specific so a complete review cannot be confused with a
partial Pilot decision.

CLI remains the sole producer of secret-safe envelopes and exact rerun
invocations. Inspection remains read-only. The Controller does not parse
diagnostic prose, manufacture a call, or store copies of grant/attempt data.
Pilot planning output gives the Controller the ordered scope/cost disclosure
needed for human confirmation, but no caller can submit a title, position,
batch generation, predecessor, or alternative scope identity.

Alternative considered: hide current batch selection behind a mutable CLI
default. Rejected because the command would no longer assert the exact scope
whose cost is being consumed.

### 6. Replace raw Controller nodes without adding another Controller

**Owner: MD Controller playbook/manifest; runtime inspection owns facts.**

The selected workflow keeps one straight create-deck route. The existing
one-shot raw authorize/generate/review handoff is replaced by:

    full plan
      -> Pilot recommendation and scope/cost gate
      -> item progress
      -> partial Pilot evidence and decision
      -> conditional Expansion scope/cost gate and item progress
      -> complete raw review
      -> selected finalization -> shared delivery -> Delivery Review

The exact Framed and Pure node sets remain separate. State records only the
normal typed node decisions/evidence references needed to resume; it does not
own full-plan progress. Workflow inspection reads the raw owner and gives one
nearest action. This keeps the control loop:

    direct record -> owning evaluator -> one action -> same-check rerun

instead of adding controller-side branching or status heuristics.

For each progressive route, the Controller also regenerates the run-scoped
`_state/page-production-task-projection.md` collaboration card from the current
owner-issued inspection and normal typed Controller handoffs. It contains only
plan/batch/evidence references, bounded derived progress, the prescribed next
action, and the corresponding typed human decision plus its optional persisted
note. The
card may help an Agent and human resume their conversation, but it neither
authorizes a cost, resumes a submit, proves materialization, nor acts as state
or evidence truth; deleting it triggers a rebuild from its owners rather than
a provider call or a ledger reconstruction.

### 7. Currentness, invalidation and recovery fail closed

**Owner: each existing artifact owner; raw owner coordinates batch staleness.**

Style selection/profile, source, workflow, source receipt/epoch, full plan,
raw contract, selected IDs or execution identity drift invalidates
unconsumed grants and claims before submit. Historical attempts remain
append-only; they are never rewritten to look current. Current Pilot bytes can
be reused by Expansion only after the materialization evaluator revalidates
their exact tuple. A raw/review/final/delivery projection is rebuilt only by
its existing owner.

A current v3 Framed Text Frame-only local rebind is the existing narrow
provider-free preservation path, not a zero-debt Pilot shortcut. Only after no
unresolved submitted attempt exists and the existing local-rebind validator
proves every retained raw/review condition may the raw owner publish a
provider-free successor v3 plan/evidence bound to the next source receipt, with
revalidated per-item provenance and the retained complete raw-review reference.
It keeps the source epoch unchanged and creates no Pilot, Expansion, grant,
provider submit, or new raw-quality decision. Any failed retention condition
returns the normal current full-plan/debt path.

A persisted submitted attempt is not an unconsumed grant or claim: it remains
the current raw owner's reconciliation hard-stop until one terminal outcome is
recorded. No source/profile-driven v3 plan publication may CAS a new head over
that scope while such an attempt remains unresolved. After terminalization,
the history stays readable but any bytes that no longer match the new tuple
remain historical, never automatic reuse.

Gate treatment follows human-centered-gates.md:

| Outcome | Applied here | Owner action |
| --- | --- | --- |
| guide | Rebuildable projection or deterministic format repair | Owning interface repairs and reruns the checkpoint. |
| confirm | Exact cost, Pilot quality, complete raw quality, or delivery quality | Controller shows current evidence and records the bounded human decision. |
| hard-stop | Identity, grant, provenance, bytes, coverage, CAS, or provider outcome is uncertain | Raw owner returns one repair/reconcile action; no waiver or force exists. |

This is also the net simplification required by simple-reliable-control.md:
the former batch-wide implicit progression is removed, while one evaluator
serves inspect, preflight, submit and audit for the same facts. The focused
negative tests below prove a valid path is not blocked and the wrong owner
cannot be mutated.

## Risks / Trade-offs

- [New append-mostly raw history is more storage than one generated PNG set]
  -> Canonical bytes are retained only once per immutable materialization;
  rebuildable projections remain under the existing version leaf and are not
  copied into another authority.
- [V2 raw lineage cannot be safely inferred as V3] -> Preserve it read-only
  and return a single explicit replan/rebuild action; do not attempt a
  best-effort migration.
- [One-item generate increases command invocations] -> It creates a clear
  cost boundary, deterministic resume and human-visible progress; the Agent
  can execute the returned next invocation mechanically.
- [Framed Pilot browser work is more expensive than a contact sheet] -> It is
  limited to the selected sample and reuses the production renderer, avoiding
  a weaker preview that could mislead the human decision.
- [Provider reconciliation capabilities vary] -> An unsupported or
  inconclusive lookup terminalizes the attempt as unknown and requires new
  explicit authorization for later cost; no provider-specific fallback chain
  is introduced.

## Migration Plan

1. Add the v3 artifact validators, append-mostly paths, CAS head writer, batch
   evaluator and item attempt/materialization owner behind the current selected
   workflow adapters.
2. Replace the plan-wide authorization/generation CLI and Controller nodes with
   the progressive operations; update help, diagnostics, inspection, manifest
   validation, and the rebuildable Controller task projection atomically.
3. Teach Framed and Pure adapters to supply their separate Pilot evidence
   contributions, then gate finalization on accepted raw evidence v3.
4. Treat selected existing v2 raw plan/evidence as inspectable but not current
   progressive authority. The first current production operation returns the
   owner-issued replan/rebuild action. It does not scan decks or write a head
   during observation.
5. There is no automatic rollback/migration mutation. If deployment must be
   reverted, immutable v3 history remains preserved; the older runtime must
   report it as unsupported rather than reinterpret or delete it.

## Verification Strategy

**Unit:** canonical v3 plan/batch/grant/attempt/provenance validation, full-plan
ordering, paid-debt branches, CAS/replay, one-item commit ordering, reconciliation,
and all stale/cross-bound negative cases. These prove deterministic ownership.

**Integration:** selected Framed/Pure adapter flows, Framed browser
production-equivalence, Pure isolation, raw-to-final/PPTX/notes lineage, CLI
argument rejection/diagnostics, and read-only inspection. These prove module
boundaries without a real provider.

**E2E:** one fresh and one interrupted/resumed mock-provider journey for each
workflow. Cover partial Pilot -> Expansion -> complete review -> delivery,
small debt -> one complete review, zero debt -> provider-free review, and an
unknown attempt that cannot retry. Fixtures stay under tests and tests_e2e and
use no production deck or research directory.
