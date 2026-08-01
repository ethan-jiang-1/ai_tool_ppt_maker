## MODIFIED Requirements

### Requirement: Raw evidence is addressed by exact Page Authority tuples

Each current raw item SHALL bind its stable slide_id, raw byte digest, raw image
contract digest, generation-profile digest, registered reference eligibility,
source epoch, and the exact full raw-work-plan identity. A materialized item
SHALL additionally bind one immutable materialization-provenance record. A
provider-produced provenance record SHALL bind its exact batch grant and
terminal attempt; a provider-free reuse record SHALL bind the owner-verified
source tuple from which it is reusable. An ID match, copied filename, last
grant digest, or task projection alone SHALL NOT satisfy current raw evidence.

A current v3 Framed Text Frame-only local rebind SHALL preserve the accepted
provider-free local-compose path only through the existing local-rebind
validator. When no unresolved submitted attempt exists and every retained
raw/review condition is exact, the raw owner SHALL create a provider-free
successor v3 plan/evidence bound to the new source receipt, revalidated
per-item reuse provenance, and the retained complete raw-review reference
without advancing source epoch. It SHALL not create a
Pilot/Expansion batch or grant, submit a provider request, or require a new
raw-quality decision. Any failed retention condition SHALL follow the normal
current full-plan debt path.

#### Scenario: Generation profile drift invalidates review

- **WHEN** provider, model, output, style-profile, or registered reference facts change
- **THEN** raw reuse and review coverage become stale
- **AND** a new source epoch is not manufactured solely for that profile change

#### Scenario: One batch grant cannot prove another item

- **WHEN** a current full plan contains materializations from a Pilot and an Expansion batch
- **THEN** each accepted raw item is bound to its own current provenance, grant, and attempt facts
- **AND** the owner does not use either batch's grant digest as plan-wide provenance

#### Scenario: Framed Text Frame-only rebind remains provider-free

- **WHEN** a current v3 Framed source changes only Text Frame literals, no unresolved submitted attempt exists, and the existing local-rebind validator accepts every retained raw/review condition
- **THEN** the raw owner publishes a successor v3 plan/evidence with the retained complete raw-review reference and revalidated reuse provenance
- **AND** it does not advance source epoch, create a Pilot/Expansion/grant, submit a provider request, or ask another raw-quality question

### Requirement: TARGET raw mechanics consume typed workflow plans without semantic dispatch

The shared raw owner SHALL accept only a page-authority-raw-work-plan-v3 written
by the selected target workflow adapter. It SHALL use the plan's bound source
receipt digest, workflow, ordered stable IDs, typed raw-contract digests,
provider profile, effective Style Master selection, and source/execution
identity to derive exact batch projections, submit items, record
materializations, and prepare complete review. It SHALL publish only
page-authority-accepted-raw-evidence-v3, bound to that exact full plan, all
current raw bytes, each item's materialization provenance, and a complete
raw-review decision.

Shared raw mechanics SHALL NOT interpret Text Frame literals, reserved
rectangles, no-text requirements, Pure display literals, Pilot sample quality,
or workflow-specific refresh policy. A source, workflow, raw-contract,
provider-profile, byte, foreign-protocol, or batch-scope drift SHALL invalidate
the affected record through its owning interface before another submit, review,
or finalization.

#### Scenario: Typed target plan receives scoped production

- **WHEN** the selected target adapter submits a valid typed full raw plan and a current exact batch grant
- **THEN** the shared raw owner records only the authorized selected items with plan-bound provenance
- **AND** it does not branch on Framed or Pure semantic fields

#### Scenario: Foreign evidence cannot satisfy target work

- **WHEN** evidence is supplied with a different protocol, full-plan digest, or item tuple
- **THEN** the raw owner reports it as unavailable
- **AND** it does not promote the evidence, infer byte reuse, or submit a provider request automatically

## ADDED Requirements

### Requirement: Progressive raw production has one full plan and exact batch projections

After the selected workflow has a current accepted effective Style Master, Image
Generation SHALL first materialize one provider-free full raw work plan covering
the current ordered generation range. The plan SHALL be the only raw-production
authority; a Pilot or Expansion batch SHALL be an immutable projection of that
plan, not a partial plan or a second full plan.

Each projection SHALL bind the full-plan digest, current source/execution
identity, generation-profile digest, exact ordered formal slide IDs, the
corresponding ordered raw-contract digests, review-sample membership, paid
submission membership, maximum submissions, a positive owner-issued
batch-generation, and a nullable predecessor-batch digest. The raw evaluator
SHALL derive generation and predecessor from validated direct records; a caller
shall not supply a nonce, predecessor, position, title, or alternate batch
identity. The same current planning action SHALL exact-replay one immutable
batch, and a conflicting second live branch or overlapping paid scope SHALL
hard-stop. A successor batch SHALL be eligible only after its predecessor has
no live claim and every selected paid item is materialized or terminal.

The owner SHALL resolve a selected set against the current full-plan formal IDs
and emit the selected IDs in full-plan order. It SHALL reject an empty,
duplicated, unknown, stale, or non-current scope before grant creation; a
count-only, all-plan, inferred, or replayable authorization SHALL not be
accepted. When paid debt exceeds five items, a partial Pilot SHALL have a
nonempty paid-submission set that is a subset of its review-sample membership;
a reuse-only sample SHALL not create a Pilot batch, cost gate, or decision.

Paid-generation debt SHALL be derived only by the materialization evaluator.
Current reusable tuples may enter a Pilot review sample without receiving a
provider grant. If debt is one through five items, the whole debt set SHALL be
the only paid Pilot scope and the next review SHALL be the complete raw review.
If debt is zero, the owner SHALL not create a Pilot grant, Pilot evidence, or
synthetic decision and SHALL route directly to complete raw review when
acceptance is missing.

#### Scenario: Pilot is a projection of one complete plan

- **WHEN** a human selects three current formal IDs from a ten-item full plan for Pilot
- **THEN** the owner writes one Pilot projection whose ordered IDs and raw contracts are filtered from that full plan
- **AND** it does not create a three-item raw work plan or authorize the other seven items

#### Scenario: Same Pilot planning action cannot mint a second live batch

- **WHEN** a current partial Pilot scope is requested again before its batch becomes terminal
- **THEN** the owner exact-replays the same batch identity and does not create another grant
- **AND** a conflicting or overlapping current paid scope hard-stops before a provider call

#### Scenario: Reuse-only selection cannot become a partial Pilot

- **WHEN** current paid debt exceeds five items and a requested Pilot sample contains only reusable tuples
- **THEN** the owner rejects the scope and identifies the need for at least one current paid-debt formal ID
- **AND** it does not create a zero-cost Pilot decision or allow Expansion planning

#### Scenario: Small debt has one quality review

- **WHEN** current paid-generation debt contains four items and all other full-plan tuples are current reuse
- **THEN** the owner binds the four items as the paid Pilot scope and prepares complete raw review after materialization
- **AND** it does not publish a partial Pilot decision or an Expansion grant

#### Scenario: Zero debt remains provider-free

- **WHEN** every full-plan tuple has current materialization provenance but accepted raw evidence is absent or stale
- **THEN** the owner prepares the complete raw-review prerequisite without a Pilot authorization or provider submission
- **AND** it does not represent the review as a paid Pilot

### Requirement: Raw batch submission is durable, serialized, and reconciliation-first

Before each provider call, the raw owner SHALL revalidate the current full plan,
batch projection, grant, item contract, and one-item plan-wide live-claim constraint. It
SHALL durably create the exact item attempt before any provider request, record
the provider request identity before an outcome can be lost, and atomically
commit returned bytes, immutable provenance, terminal attempt status, and
derived grant consumption before another item may submit. A persisted
`submitted` attempt consumes its one submission slot even before its terminal
outcome; grant consumption SHALL be derived from attempt records rather than
stored as a mutable counter. A returned-byte materialization bundle is current
only when its immutable bytes/provenance and the matching `succeeded` terminal
attempt are both validated and linked; staging or orphaned published files do
not become materialization or evidence. A grant's maximum submissions is an
upper bound, not an obligation to consume every unclaimed item.

The progress projection SHALL derive materialized, explicitly unsubmitted,
terminal-known-failure, and terminal-unknown items from these direct records.
Resume SHALL only continue an item whose current attempt proves it has not been
submitted. A `submitted` attempt without a provable outcome, or a malformed
attempt, SHALL hard-stop all later submits for that batch. The owner SHALL
expose one explicit reconciliation action using the provider's supported
idempotency or lookup facts; it SHALL never infer a result or retry. If
reconciliation cannot prove a reusable result, it SHALL terminalize the old
attempt as `unknown`. That terminal record cannot reopen its old grant or
become current evidence; any later paid submit requires an owner-derived
successor batch, newly disclosed exact scope, and new grant.

A terminal known failure SHALL not authorize another submit for the same item
under its old grant, but it MAY leave later unsubmitted selected items eligible
for their one authorized submit. Once all selected paid items are materialized
or terminal, a retry of any residual paid debt SHALL require a newly derived
successor batch and a newly disclosed exact grant. An unresolved `submitted`
attempt SHALL block every successor batch, grant, and full-plan head advance,
including after source/profile drift; reconciliation may read that exact
historical attempt only to record its terminal outcome and shall not make its
bytes current by doing so.

#### Scenario: An interruption preserves the next legal item

- **WHEN** one Pilot item commits bytes and the process ends before the next item claims
- **THEN** inspection reports the committed item, the remaining explicitly unsubmitted items, and one next generate action
- **AND** resume does not resubmit the committed item or consume an unclaimed grant slot

#### Scenario: Unresolved submission exposes reconciliation only

- **WHEN** an item is `submitted` with a persisted provider request identity but no provable terminal result
- **THEN** generation hard-stops at that item and exposes only its reconciliation action
- **AND** it does not submit a later item, mark the attempt failed, or retry under the old grant

#### Scenario: Terminal unknown requires a newly disclosed successor scope

- **WHEN** reconciliation terminalizes a selected item as `unknown` and its predecessor batch has no live claim or nonterminal selected paid item
- **THEN** the owner exposes only the current owner-derived successor planning action for any later paid work
- **AND** it does not reopen the old grant, submit an item, or treat the terminal unknown as current materialization or evidence

#### Scenario: A known failure does not hide residual authority

- **WHEN** an authorized item ends in a known terminal provider failure
- **THEN** the owner reports that terminal record and the bounded remaining scope
- **AND** it does not treat unused maximum submissions as an implicit retry authorization

#### Scenario: Unresolved submission blocks a stale-plan successor

- **WHEN** source or generation-profile facts drift after an exact item attempt reached `submitted`
- **THEN** planning, authorization, and full-plan head advancement return that attempt's reconciliation action first
- **AND** they do not issue a successor plan, batch, or grant until a terminal outcome is recorded

### Requirement: Pilot evidence is distinct from complete raw acceptance

The raw owner SHALL prepare Pilot evidence only for a current Pilot projection
whose sample tuples are complete and attributable. A partial Pilot decision may
record only proceed, repair, or redirect for that exact evidence. Proceed SHALL
allow the Controller to request a current remaining-scope Expansion projection;
it SHALL NOT authorize Expansion, publish accepted raw evidence, finalize, or
deliver.

Repair or redirect SHALL persist only the exact Pilot decision and return the
raw owner's next repair/replan action. Neither decision SHALL mint a successor
batch, reuse an old grant, or make a partial sample current complete evidence.

Complete raw review SHALL instead verify every tuple in the current full plan,
including provider-free reuse, Pilot materialization, Expansion materialization,
and any explicit post-reconciliation retry. Only a complete, current,
per-item-provenance projection plus a human complete-review proceed decision
SHALL publish accepted raw evidence. Missing, stale, partial, mismatched, or
unattributable coverage is a hard-stop before the quality decision.

#### Scenario: Partial Pilot proceed does not publish acceptance

- **WHEN** a current Pilot sample with remaining paid debt receives proceed
- **THEN** the owner persists only the Pilot decision and exposes the exact Expansion planning action
- **AND** no accepted raw evidence, final manifest, PPTX, notes receipt, or delivery receipt is written

#### Scenario: Complete review binds mixed provenance

- **WHEN** a full plan contains current reuse, Pilot bytes, and Expansion bytes
- **THEN** complete raw review verifies every ordered tuple and its individual provenance before asking for a decision
- **AND** the accepted evidence records the full current coverage rather than a last-batch summary
