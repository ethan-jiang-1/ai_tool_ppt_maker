## Purpose

Define the receipt-bound Page Authority raw-image lifecycle. It compiles current
Pure and Framed raw requests, requires an exact human authorization before a
nonzero provider submission, records deterministic raw evidence, and exposes a
review projection before finalization.
## Requirements
### Requirement: Page Authority raw requests are receipt-bound and authorization-scoped

Image Generation SHALL compile page provider requests only from a resolved Page Authority receipt,
trusted visual-language selection, a current accepted effective-style selection, permitted identity
projection, canvas/reserved-frame facts, and Pure-only structured display fields. The effective-style
selection SHALL bind the exact reference bytes, selection scope, acceptance receipt, and generation profile
used by the current raw work plan. The provider submitter SHALL receive and attach those same resolved immutable
reference bytes; it SHALL NOT reread `style_master.jpg`, `style_master_path`, or any compatibility payload. A
path or `style_master.jpg` file alone SHALL NOT satisfy that binding.

A nonzero page submit batch SHALL require exact current human page-raw authorization. Style Master
candidate authorization and `proceed` SHALL NOT satisfy that page-raw authorization. Preview, validation,
local composition, review, assembly, notes, and zero-submit reuse SHALL be provider-free.

Each selected-workflow raw contract (Pure and Framed) SHALL carry the resolved clause text and per-slide
scene alongside the existing digest projection:

- `provider_clauses`: the text-guard-protected resolved record. Without a relationship it SHALL contain
  exactly `recipe`, `composition`, and `motifs`; recipe and composition SHALL be non-empty strings, and motifs
  SHALL be an array of non-empty strings that MAY be empty. With a selected relationship it SHALL contain exactly
  those three fields plus a non-empty `relationship` string from that same selection. Its SHA-256 SHALL equal
  `visual_language.relationship.provider_clause_sha256`; a relationship clause SHALL be absent when the
  projection has no relationship member. No other shape is valid.
- `visual_identity_role_clause`: the resolved identity role-clause text, or `null` when no
  `VISUAL IDENTITY` is selected.
- `visual_scene`: the slide's `VISUAL SCENE` source text after passing the versioned Page Authority text
  guard, or `null` when the slide has no scene.

Before an adapter hashes a raw contract, derives an authorization scope, constructs a provider request, or
materializes a raw plan, it SHALL validate that adapter's exact canonical raw-contract shape. The Pure and
Framed validators SHALL require a resolved visual-language record and the canonical `provider_clauses` shape;
their remaining workflow-owned fields SHALL remain subject to their workflow-owned canonical-shape rules. A
missing, null, malformed, or extra-key provider-clause record SHALL hard-stop the plan checkpoint before
authorization, provider request construction, raw-plan materialization, or provider work. The input SHALL be
repaired before a later plan checkpoint can succeed, and the failure SHALL not create a waiver, retry, fallback,
or recovery route.

The provider submitter SHALL receive the full validated request, including these additive text fields, without
rereading source, registry, `style_master.jpg`, or any compatibility payload. The existing
`visual_language.projection` digest facts SHALL remain in the contract for authorization binding. The serialized
provider body SHALL carry the exact recipe, composition, ordered motif, and selected relationship clause text
from that plan-bound raw contract, not only identifiers and digests.

#### Scenario: Framed payload excludes Text Frame literals

- **WHEN** a Framed receipt contains visible Text Frame fields
- **THEN** the provider payload excludes every literal field value and carries the no-text constraints
- **AND** absent authorization stops before provider invocation

#### Scenario: Unaccepted Style Master stops page raw planning

- **WHEN** a source/state pair has no exact current accepted effective-style selection for its workflow and scope
- **THEN** page raw planning hard-stops before source/raw-plan materialization or a page provider call
- **AND** it returns the Style Master owner action rather than treating a candidate or file path as current style

#### Scenario: Style selection drift fences page raw work

- **WHEN** the accepted effective-style intent/context, bytes, scope, receipt, or generation profile no longer match a stored page raw plan
- **THEN** authorization, generation, review, acceptance, and finalization observe the dependent evidence as stale through their existing owners
- **AND** none of those commands rewrites the plan, advances source epoch solely for style drift, or silently rebinds old bytes

#### Scenario: Pre-change raw plan has no accepted-style binding

- **WHEN** an existing v2 raw plan or accepted evidence names only legacy `style_master.jpg` bytes and has no exact effective-selection receipt identity
- **THEN** current raw planning and downstream freshness evaluation treat that lineage as stale after Style Master adoption
- **AND** they require Generated Image Rebuild rather than patching the old plan or preserving its raw acceptance

#### Scenario: Compatibility payload cannot replace the selected provider reference

- **WHEN** a compatibility payload moves, drifts, or resolves to another action after an effective selection is accepted
- **THEN** page raw provider submission attaches the immutable bytes resolved by that selection and bound into the current raw plan
- **AND** it does not reopen a compatibility path or submit a reference whose digest differs from the plan's selection identity

#### Scenario: Pure payload carries canonical clause text and scene

- **WHEN** a Pure slide resolves a visual-language selection with clause text and has a valid `VISUAL SCENE`
- **THEN** its raw contract includes the canonical `provider_clauses` text record,
  `visual_identity_role_clause` (null without identity), and the normalized `visual_scene`
- **AND** a selected relationship adds its exact plan-bound clause text while a four-key source retains the
  legacy three-key clause shape
- **AND** the relationship clause's SHA-256 equals the selected projection's clause digest
- **AND** the same `visual_language.projection` digest facts remain in the contract for authorization binding

#### Scenario: Framed payload carries canonical clause text and scene

- **WHEN** a Framed slide resolves a visual-language selection and has a valid `VISUAL SCENE`
- **THEN** its raw contract includes the canonical clause text and normalized scene while preserving
  `text_free: true` and the frame facts
- **AND** the Framed canonical-shape validator accepts either closed provider-clause variant and no other

#### Scenario: Pure malformed clause shape hard-stops before provider work

- **WHEN** a Pure canonical raw contract has null, missing, an unsupported fourth key, an absent or empty
  selected relationship clause, a relationship clause whose SHA-256 differs from the selected projection,
  empty recipe/composition text, or non-string motif `provider_clauses`
- **THEN** planning hard-stops before authorization, provider request construction, raw-plan materialization, or a provider call
- **AND** it does not materialize source/raw-plan state or mutate another workflow's state

#### Scenario: Framed malformed clause shape hard-stops before provider work

- **WHEN** a Framed canonical raw contract has null, missing, an unsupported fourth key, an absent or empty
  selected relationship clause, a relationship clause whose SHA-256 differs from the selected projection,
  empty recipe/composition text, or non-string motif `provider_clauses`
- **THEN** planning hard-stops before authorization or a provider call
- **AND** the rejection does not depend on provider-side lookup of clause digests or a second workflow adapter

#### Scenario: Serialized provider body preserves plan-bound clause text

- **WHEN** an authorized current Pure or Framed raw item reaches the existing submitter
- **THEN** the serialized body prompt contains exactly that request's recipe, composition, ordered motif, and
  selected relationship clause text when present
- **AND** the raw-contract digest and authorization scope bind those same text values without submit-time registry lookup or reassembly

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

### Requirement: Framed raw plans prove the current render contract before materialization

For a current Framed source candidate, Image Generation SHALL compile source, raw contracts, provider
requests, and the complete raw plan without mutation; verify every Text Frame as one bounded browser
batch under the current render profile; and only after the whole batch succeeds materialize the source
receipt/state and exact raw plan through their existing owners. Each Framed raw contract SHALL bind the
canonical `render_profile_digest` and reserved-underlay facts.

Authorize, generate, review, and accept SHALL load and validate the already materialized plan against
the current source receipt, workflow, raw contracts, render profile, and exact plan hash. They SHALL
NOT rebuild or rewrite the plan, advance the source epoch because drift was observed, or repeat the
plan-time browser proof.

#### Scenario: Layout failure leaves no plan lineage

- **WHEN** any candidate Text Frame cannot be proved under the current render profile
- **THEN** source receipt/state and raw-plan materialization do not occur
- **AND** browser work is bounded, provider submissions are zero, and the next action is to repair source and rerun the same plan checkpoint

#### Scenario: Successful proof publishes one exact plan

- **WHEN** every candidate Text Frame passes one bounded verification batch
- **THEN** the owning writers materialize a source receipt/state and one exact raw plan bound to that receipt and render profile
- **AND** the plan becomes eligible for the existing exact authorization checkpoint

#### Scenario: Later command observes drift without rewriting

- **WHEN** authorize, generate, review, or accept finds current source, profile, contract, receipt, or stored-plan drift
- **THEN** it hard-stops before provider or review work and requires a fresh plan through the plan owner
- **AND** it does not launch the browser, rewrite the stored plan, or advance source state as a side effect

### Requirement: Raw review is Page Authority evidence

The raw-review projection SHALL cover all current raw tuples in the current raw work plan's
`ordered_slide_ids` order and bind its PNG digest, projection/capture-profile digest, source epoch,
exact ordered byte coverage, and the selected workflow's coverage-only typed review-contribution digest. Each
selected workflow adapter SHALL contribute generic identity labels separately from the coverage facts
and contribute any workflow-owned overlay/profile facts; shared raw-review mechanics SHALL verify and
render those generic primitives without interpreting workflow semantics.

Framed contributions SHALL bind the current `render_profile_digest` and reserved safe-zone guides.
Pure contributions SHALL contain no Framed Text Frame or safe-zone semantics. When available, every
page label SHALL display `position + formal slide_id + title` at projection capture while stable identity
and current position remain distinct facts. Individual label strings, including a source title, SHALL be
presentation-only: they SHALL NOT enter the workflow's typed review-contribution digest or coverage identity.
The projection/capture profile binds label format and rendering behavior, not the displayed label values.
Review coverage SHALL NOT bind `source_receipt_sha256` or a raw-work-plan hash; accepted raw evidence
owns those source-lineage bindings and the local-rebind validator separately checks the exact raw
contracts, ordered stable IDs, provider profile, and underlay bytes.

A Framed Text Frame-only local rebind SHALL retain an accepted raw-review reference and its prior
projection only when its source epoch, workflow, ordered stable IDs, raw contracts, provider profile,
exact underlay bytes, safe-zone guides, render profile, typed review-contribution digest, and
projection/capture profile remain exact. It SHALL rebind the accepted raw tuple to the changed source
without advancing the source epoch or regenerating the projection. Before it retains the reference, the
owner SHALL verify the stored review record's actual projection PNG bytes/hash and every listed coverage
binding. The retained title label is historical presentation, never current-source authority. Any change
to a listed coverage-bound fact requires a fresh projection and review.

A complete current projection without a human decision is the existing raw-quality `confirm` action.
Missing, partial, stale, mismatched, or incompletely attributable coverage is a repair `hard-stop` and
cannot be waived by a human quality decision. Finalization SHALL not publish without current accepted
raw-review evidence.

#### Scenario: A coverage-bound raw projection cannot satisfy finalization

- **WHEN** an ordered raw-byte identity, raw contract, Framed safe-zone guide, typed review contribution, render profile, or projection/capture profile changes
- **THEN** the previous review decision is stale and a fresh projection is required
- **AND** a final artifact or copied review record cannot substitute for it

#### Scenario: Framed review exposes complete generic evidence

- **WHEN** a current Framed raw projection is prepared
- **THEN** it shows each exact raw image with current position, formal ID, title, and reserved-region guides
- **AND** coverage binds both the Framed render-profile contribution and the shared projection/capture profile

#### Scenario: Text-only rebind retains underlay review evidence

- **WHEN** only Framed Text Frame literals change and every local-rebind coverage condition remains exact
- **THEN** the accepted raw evidence retains its prior raw-review reference while binding the new source receipt
- **AND** the unchanged source epoch and historical projection label do not make the underlay coverage stale

#### Scenario: Review order follows the current plan

- **WHEN** the current raw work plan presents its exact ordered stable IDs after a source reorder
- **THEN** the review projection renders those tuples in that order with their current positions
- **AND** the ordering remains bound to the exact current plan rather than lexical ID sorting

#### Scenario: Pure review stays free of Framed semantics

- **WHEN** a current Pure raw projection is prepared
- **THEN** it shows complete identity, byte, and projection-profile evidence
- **AND** shared review does not introduce Text Frame, compositor, or Framed safe-zone interpretation

#### Scenario: Human review cannot repair missing coverage

- **WHEN** raw-review coverage is partial, stale, mismatched, or missing a required contribution
- **THEN** review hard-stops with the owning projection-rebuild action before asking for a quality decision
- **AND** no `proceed` or continuation can make the evidence complete

### Requirement: Structural raw reuse is verified target materialization

Structural preview MAY classify an exact source raw tuple as
`materialize_unreviewed`; apply SHALL verify the source bytes and write only
target-owned unreviewed provenance. Any nonmatching or new item SHALL remain
`needs_raw_generation`. Structural apply SHALL make zero provider calls and SHALL
not inherit authorization, raw acceptance, final evidence, or delivery evidence.

#### Scenario: A target has reused and new raw work

- **WHEN** a confirmed structural plan retains one exact raw tuple and adds one slide
- **THEN** the target records unreviewed provenance for the retained slide and raw debt for the new slide
- **AND** no provider submission or current review acceptance is created by apply

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

### Requirement: Redundant terminal attempt history has one safe effective projection

Image Generation SHALL derive Page Authority progressive progress, grant
consumption, live claims, and the next owner action from direct immutable
attempt records. When one exact submitted attempt has exactly two direct
terminal children, one `known_failure` and one `unknown`, and both children
are otherwise valid, terminal, childless transitions for the same immutable
attempt identity, Image Generation SHALL retain both records unchanged while
using the `known_failure` child as that attempt's sole effective terminal
projection. The redundant `unknown` child SHALL not be treated as current,
live, materialized, reusable, or a reason to consume another submission.

Every other attempt branch, including a branch containing `succeeded`, a
nonterminal child, a foreign or malformed transition, a child with its own
descendant, a cycle, or more than the two defined terminal children, SHALL
remain an integrity hard-stop. It SHALL not be repaired by a CLI flag, a human
waiver, provider lookup, resubmission, attempt rewrite, or durable repair
record. The existing direct owner evaluator remains the single source for
inspection, generation preflight, reconciliation, and progress projections.

#### Scenario: A redundant unknown does not block a newer exact reconciliation

- **WHEN** historical direct records contain one valid submitted parent with
  childless `known_failure` and `unknown` terminal children, and a newer exact
  item attempt is submitted without a provable outcome
- **THEN** the owner derives the historical item as `known_failure` and exposes
  only the existing exact reconciliation action for the newer submitted attempt
- **AND** it creates no provider call, replacement grant, materialization,
  accepted evidence, or mutation of either historical terminal record

#### Scenario: Success-conflicting branch remains a hard-stop

- **WHEN** a submitted parent has a branch that contains `succeeded`, a
  nonterminal child, an additional child, a descendant, a foreign identity, or
  another malformed transition
- **THEN** the owner hard-stops on the attempt-history integrity failure before
  progress, authorization, reconciliation, or provider work can advance
- **AND** no continuation, force option, inferred terminal result, or record
  rewrite is available

#### Scenario: Existing single-terminal history remains unchanged

- **WHEN** every submitted attempt has one valid direct terminal child or one
  current unresolved submitted record
- **THEN** the owner preserves its existing terminal and reconciliation
  behavior
- **AND** it does not create an additional derived state or alternate recovery
  path

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

### Requirement: A terminal partial Pilot without coverage returns to successor planning

The raw owner SHALL prepare partial Pilot evidence only when every selected
review-sample tuple has current attributable materialization. When the latest
terminal partial Pilot has at least one missing sample tuple and residual paid
debt, it SHALL return the existing owner-derived successor Pilot planning
confirmation as the one next action. A direct Pilot-review request in that
state SHALL fail before evidence or decision publication and return the same
successor-planning action.

The predecessor batch and grant remain terminal. The successor scope SHALL be
derived from current plan debt through the existing exact-ID evaluator and
shall require its own newly disclosed exact authorization. This transition
shall not create Pilot evidence, a quality decision, accepted raw evidence,
final output, or a new retry mechanism.

#### Scenario: Missing terminal Pilot sample cannot enter review

- **WHEN** a terminal partial Pilot contains a terminal failed or unknown
  selected item with no current materialization and residual paid debt exists
- **THEN** the raw owner returns only the existing successor Pilot planning
  confirmation
- **AND** it does not offer Pilot evidence, Pilot acceptance, Expansion,
  materialization reuse, or the old grant

#### Scenario: Successor Pilot remains exact and newly authorized

- **WHEN** the user selects valid current formal IDs after an incomplete
  terminal partial Pilot
- **THEN** the owner derives one successor batch from current debt and requires
  a new exact batch authorization before another provider submission
- **AND** it does not mutate the predecessor attempt, grant, or evidence

### Requirement: Scene text passes the deterministic no-text guard before planning

A slide's `visual_scene` text SHALL be normalized through the versioned Page
Authority text guard at raw-contract compilation time. A scene that fails the
guard (non-ASCII, invalid character, forbidden token, or forbidden token pair)
SHALL fail planning with a bounded source-repair diagnostic before any provider
authorization or submission. A slide without a scene SHALL compile with
`visual_scene` `null` and SHALL NOT trigger guard validation.

#### Scenario: Guarded scene compiles

- **WHEN** a slide's `VISUAL SCENE` text contains only ASCII, guard-allowed
  characters, and no forbidden tokens
- **THEN** the normalized scene text is bound into the raw contract
- **AND** planning continues without a guard error

#### Scenario: Guarded scene fails closed

- **WHEN** a slide's `VISUAL SCENE` text contains a forbidden token (for
  example a text-bearing instruction) or an invalid character
- **THEN** planning hard-stops with the guard's bounded error
- **AND** no raw-plan materialization or provider call is made

### Requirement: Pure raw contract carries slide body text

The Pure raw contract SHALL carry the slide's `body` text (the parsed `**BODY**`
source value, or `null` when absent) alongside `display`. The provider submitter
SHALL receive the body text in the request so it can be painted into the page
alongside the display fields. Framed raw contracts SHALL NOT carry body text
(Framed slides reject BODY at parse time).

#### Scenario: Pure body reaches the request

- **WHEN** a Pure slide has a non-null `body` value
- **THEN** its raw contract includes `body` with the slide's body text
- **AND** the provider request carries that text for painting

#### Scenario: Pure body absent is null

- **WHEN** a Pure slide has no BODY field
- **THEN** its raw contract has `body` `null`
- **AND** the rest of the contract is unchanged

### Requirement: Page Authority provider requests have a current inspection projection

During provider-free Page Authority plan creation, Image Generation SHALL
materialize one deterministic local inspection projection for the exact current
selected-workflow provider request of every ordered raw-work item. The
projection SHALL bind the current progressive plan hash, source-receipt digest,
source epoch, workflow, provider-profile digest, and ordered raw-contract
tuples. Each item SHALL identify its formal slide ID, raw-contract digest,
canonical provider-request digest, and the exact prompt text that the selected
adapter would submit for that request.

The projection SHALL separately expose the non-secret transport request as
model plus `2000x1125` request size, and the selected raw profile SHALL bind a
PNG provider-media contract that requires CRC-valid bytes and positive native
dimensions. A requested size SHALL NOT be treated as evidence that returned
bytes have those dimensions, and the profile SHALL NOT assert a fixed received
width or height before provider media is inspected.

The inspection projection SHALL be a rebuildable derived artifact only. The
raw work plan and immutable progressive records remain the authority for
authorization, submission, reconciliation, materialization, and evidence; no
operation SHALL accept the inspection projection as a substitute for any of
those records. Its contents SHALL exclude credentials, authorization headers,
environment values, provider response bodies, and image data URLs. A current
plan replay MAY replace the projection deterministically, while source,
workflow, profile, or raw-contract drift SHALL replace rather than preserve a
stale current-plan projection.

#### Scenario: Provider-free planning publishes exact request inspection

- **WHEN** a current Pure or Framed Page Authority plan is created without a
  provider submission
- **THEN** the system writes one local inspection projection whose items follow
  the plan order and whose request digests match the requests later supplied to
  the selected adapter
- **AND** it does not resolve credentials, invoke a provider, create a grant,
  or materialize raw bytes

#### Scenario: Request size and native result remain distinct

- **WHEN** the projection describes a current Page Authority Image2 request
- **THEN** it reports the established `2000x1125` transport request and a PNG
  response contract with no predeclared received dimensions
- **AND** it does not infer returned media dimensions from the request size

#### Scenario: Plan drift invalidates an inspection projection

- **WHEN** a source, workflow, generation profile, or raw contract changes and
  a new current Page Authority plan is created
- **THEN** the replacement inspection projection binds the new plan and request
  digests
- **AND** the system does not describe the prior projection as current or use
  it to authorize or submit the new plan

#### Scenario: Inspection excludes transport secrets and media

- **WHEN** planning runs with configured provider credentials and selected
  image references
- **THEN** the local inspection projection contains neither the credential
  values, authorization header, environment values, provider response content,
  nor image data URLs
- **AND** the exact prompt text remains available only in that local inspection
  projection

### Requirement: Page Authority accepts only verified provider PNG media

Image Generation SHALL accept a Page Authority provider result only after the
selected adapter has verified that the returned bytes fully decode as a
CRC-valid PNG with positive native integer dimensions. The adapter SHALL
perform that verification before the progressive raw owner can materialize
bytes, create provenance, or publish a `succeeded` attempt. It SHALL retain
the exact returned bytes and actual decoded dimensions in accepted raw evidence
and provenance, and SHALL NOT resize, transcode, crop, or otherwise repair a
valid provider result solely to satisfy a request or historical native size.

An empty result, malformed or CRC-invalid PNG, or PNG with non-positive native
dimensions SHALL terminalize the already submitted item through the existing
`known_failure` lifecycle. The direct terminal outcome SHALL report only the
bounded invalid-media classification and existing next legal action. It SHALL
not expose provider response content, raw returned bytes, raw-byte digest,
prompt text, or a new retry/force route.

#### Scenario: Default-size native provider PNG materializes normally

- **WHEN** a selected Pure or Framed adapter receives a valid `2048x1136` PNG
  result for an authorized current item
- **THEN** the system follows the existing materialization, provenance, and
  `succeeded` lifecycle with those exact provider bytes
- **AND** no additional provider authorization is introduced

#### Scenario: Invalid provider PNG becomes a known failure before evidence

- **WHEN** a provider result is empty, malformed, or not a PNG
- **THEN** the system terminalizes that item as `known_failure` with bounded
  media facts
- **AND** it writes no accepted raw bytes, raw-byte provenance, or `succeeded`
  attempt for that item

#### Scenario: Non-default native provider PNG materializes normally

- **WHEN** a selected Pure or Framed adapter receives a CRC-valid PNG with
  positive native dimensions that differ from `2048x1136`
- **THEN** the system follows the existing materialization, provenance, and
  `succeeded` lifecycle with its exact provider bytes and actual dimensions
- **AND** it does not resize the media, terminalize the item, or introduce
  another provider authorization

#### Scenario: Known media failure preserves the existing successor lifecycle

- **WHEN** an authorized item terminalizes as a provider-media `known_failure`
- **THEN** later legal work is derived through the existing remaining-scope or
  successor-batch action
- **AND** the system does not reopen the old grant, infer a retry, or create a
  second recovery controller

### Requirement: Page Authority credential preflight is generate-scoped and attempt-safe

Image Generation SHALL resolve Page Authority Image2 credentials only at the
direct `image2 generate` remote boundary. Before invoking the progressive raw
owner, it SHALL load dotenv from the selected run's deck root and then the
process current working directory, preserving already-set process environment
values, and resolve one credential/base-URL pair. It SHALL pass that same
resolved pair to the original submit and any async task polling performed for
that invocation.

If the required credential or base URL is unavailable or invalid, the command
SHALL return the existing secret-safe credential failure before any new
progressive raw `claimed` or `submitted` attempt, provider request,
materialization, provenance, or replacement authorization is created. It SHALL
not load dotenv for provider-free planning, Pilot/Expansion planning,
authorization, reconciliation, review, acceptance, or delivery, and it SHALL
not write dotenv files or expose their paths or values in CLI output.

#### Scenario: Cwd dotenv enables one authorized generation

- **WHEN** a direct generate process has no Image2 credential in its inherited
  environment but its current working directory dotenv supplies the required
  pair
- **THEN** the exact authorized item may enter the existing one-submit lifecycle
- **AND** the submit and any async task poll use the same resolved pair

#### Scenario: Exported environment values retain precedence

- **WHEN** an inherited Image2 credential or base URL is already present and a
  searched dotenv contains that key
- **THEN** the direct generate operation uses the inherited value
- **AND** it does not mutate the dotenv file or expose either value

#### Scenario: Missing credentials stop before an owner attempt

- **WHEN** a direct generate operation has no resolvable Image2 credential
  pair after the scoped dotenv load
- **THEN** it returns the existing bounded credential diagnostic before calling
  the progressive raw owner
- **AND** it makes no HTTP provider request and creates no new claimed or
  submitted attempt

### Requirement: Page Authority resolves provider-accepted async image tasks

When an exact authorized Page Authority provider submit receives a successful
JSON response that contains a stable task identifier but no immediate image,
Image Generation SHALL resolve that task within the same submission. It SHALL
poll the provider task resource using the same resolved credential and base
URL, without submitting another image request, creating another grant,
changing the raw plan, or creating a background worker or durable task store.

The poll SHALL be bounded. A successful synchronous inline-image response
SHALL retain its current behavior without a task poll. Task identifiers,
provider response content, response headers, prompts, credentials, and image
data SHALL not enter CLI output, diagnostics, raw evidence, or durable state.

#### Scenario: Accepted task reaches a completed inline result

- **WHEN** a current authorized Page Authority submit returns a stable task ID
  and a later task poll reports a completed result with inline image bytes
- **THEN** the adapter uses those bytes as the result of the original
  submission
- **AND** no second provider submit, authorization, or batch is created

#### Scenario: Synchronous inline provider result remains direct

- **WHEN** a current authorized Page Authority submit returns inline image
  bytes without a task ID
- **THEN** the adapter accepts the result through the existing direct path
- **AND** it does not poll a task resource

#### Scenario: Polling cannot become an unbounded recovery path

- **WHEN** an accepted task remains incomplete beyond the bounded poll budget
  or its poll transport becomes unreadable
- **THEN** the original attempt follows the existing unresolved/unknown
  lifecycle and exact reconciliation action
- **AND** the system does not resubmit the request, create a replacement
  grant, or expose the task ID

### Requirement: Async Page Authority results retain verified-media and terminal failure semantics

Image Generation SHALL apply the existing Page Authority exact PNG validation
to a completed async task result before raw materialization, provenance, or a
`succeeded` attempt is possible. A completed task that reports failure, has an
unusable response, or lacks valid exact native `2048x1136` PNG media SHALL
follow the existing secret-safe `known_failure` outcome. A received non-success
task poll response SHALL retain its bounded HTTP failure classification.

#### Scenario: Completed async PNG follows the existing success chain

- **WHEN** a completed task result contains a valid `2048x1136` PNG
- **THEN** the original authorized attempt materializes through the existing
  raw evidence and provenance chain
- **AND** it does not create a separate async evidence format

#### Scenario: Completed task with no usable image terminalizes safely

- **WHEN** a task poll reaches a terminal result without usable image media
- **THEN** the original authorized attempt terminalizes as `known_failure`
- **AND** the CLI exposes only the existing bounded result classification and
  nearest owner action

#### Scenario: Async failure does not leak provider data

- **WHEN** task polling receives a failed task, a non-success response, or
  malformed completed response
- **THEN** CLI output and diagnostics exclude the task ID, provider response
  body, headers, prompt, credentials, image bytes, and image data URLs
- **AND** a later retry remains available only through the existing
  owner-derived successor authorization path

### Requirement: Definite Page Authority provider failures terminalize without leaking responses

For an authorized current Page Authority item, Image Generation SHALL
distinguish an unprovable provider outcome from a complete response that is
definitely unusable. A transport interruption before any response, or an
interruption while reading a successful response body, SHALL retain the
existing `unknown` and exact reconciliation lifecycle. A received non-success
HTTP response, or a successfully read success response that cannot decode as
the expected response envelope, SHALL terminalize the submitted item through
the existing `known_failure` lifecycle.

The direct known-failure fact for a received response SHALL contain only a
fixed response-failure classification and, for an HTTP response, its numeric
status. It SHALL not retain or expose response content, response headers,
prompt text, credentials, image data URLs, returned image bytes, or a raw-byte
digest. A terminal known failure continues to close its old grant and can only
be retried through the existing owner-derived successor scope and new exact
authorization.

#### Scenario: Received HTTP failure is terminally known

- **WHEN** a provider request receives a non-success HTTP response with a
  numeric status
- **THEN** the submitted item terminalizes as `known_failure` with only its
  fixed response classification and numeric status
- **AND** it creates no raw materialization, provenance, or succeeded attempt
  and does not reopen the old grant

#### Scenario: Complete malformed success response is terminally known

- **WHEN** a successful provider response body is fully received but cannot be
  decoded as the expected response envelope
- **THEN** the submitted item terminalizes as `known_failure` with only the
  fixed invalid-response classification
- **AND** no response text, prompt, credentials, raw bytes, or alternate retry
  route is exposed

#### Scenario: Unreadable response remains unresolved

- **WHEN** transport fails before a response exists or reading an otherwise
  successful response body is interrupted
- **THEN** the existing `unknown` and exact reconciliation action remain the
  only recovery
- **AND** the owner does not infer a known failure, retry, or successor batch

### Requirement: Human-facing Page Authority image projections use current ordinal names

Image Generation SHALL name every generated per-page Page Authority image that
is intended for human browsing as `NN_slideID.png`, where `NN` is that slide's
one-based current plan position padded to at least two decimal digits and
`slideID` is the stable formal `slide_id`. This applies to rebuildable raw
image projections and Pure/Framed Pilot per-page image outputs. A Pilot subset
SHALL use positions from its complete current raw plan, rather than renumbering
the subset.

Raw work plans/contracts, provider requests, authorization, CAS records,
attempts, provenance, accepted evidence, and receipt bindings SHALL continue
to use stable `slide_id` and digest facts. A stable evidence path or raw
contract SHALL NOT be treated as the human-facing projected filename.

#### Scenario: Raw and Pilot images use the full-plan ordinal

- **WHEN** a current raw plan has `DeckGo` at position 1 and `DataMap` at
  position 10, and a Pilot contains only `DataMap`
- **THEN** its raw projections are named `01_DeckGo.png` and
  `10_DataMap.png`
- **AND** the Pilot image for `DataMap` is named `10_DataMap.png`, not
  `01_DataMap.png`

#### Scenario: Ordinal width grows naturally

- **WHEN** a current Page Authority plan contains a slide at position 100
- **THEN** its human-facing image projection is named `100_slideID.png`
- **AND** no three-digit position is truncated or wrapped to two digits

#### Scenario: Reordering changes only the display projection

- **WHEN** a structural version reorders unchanged slides with stable IDs and
  unchanged raw-contract tuples
- **THEN** regenerated human-facing image filenames reflect the new positions
- **AND** the stable IDs and immutable raw authorization/provenance records are
  not renamed or replaced by the ordinal prefix
