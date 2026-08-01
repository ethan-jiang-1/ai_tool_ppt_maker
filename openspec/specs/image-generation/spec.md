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

### Requirement: Raw evidence is addressed by exact Page Authority tuples

Each current raw item SHALL bind its stable `slide_id`, raw byte digest, raw image
contract digest, generation-profile digest, registered reference eligibility, and
source epoch. Reuse and review freshness SHALL require the complete current tuple;
an ID match or a copied filename alone SHALL NOT satisfy current raw evidence.

#### Scenario: Generation profile drift invalidates review

- **WHEN** provider, model, output, style-profile, or registered reference facts change
- **THEN** raw reuse and review coverage become stale
- **AND** a new source epoch is not manufactured solely for that profile change

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
The shared raw owner SHALL accept only a `page-authority-raw-work-plan-v2` written by the selected target workflow adapter. It SHALL use the plan's bound source receipt digest, workflow, ordered stable IDs, typed raw-contract digests, provider profile, and exact authorization scope to submit, record, and review raw work. It SHALL publish only `page-authority-accepted-raw-evidence-v2`, bound to the exact plan, raw bytes, provider/authorization tuple, and raw-review decision.

Shared raw mechanics SHALL NOT interpret Text Frame literals, reserved rectangles, no-text requirements, Pure display literals, or workflow-specific refresh policy. A source, workflow, raw-contract, provider-profile, byte, or foreign-protocol drift SHALL invalidate evidence through its owning interface before finalization.

#### Scenario: Typed target plan receives shared authorization and evidence
- **WHEN** the selected target adapter submits a valid typed raw plan with exact authorization
- **THEN** the shared raw owner records evidence bound to that plan and its raw byte hashes
- **AND** it does not branch on Framed or Pure semantic fields

#### Scenario: Foreign evidence cannot satisfy target work
- **WHEN** evidence is supplied with a different protocol or plan digest
- **THEN** the raw owner reports it as unavailable
- **AND** it does not promote the evidence, infer byte reuse, or submit a provider request automatically
