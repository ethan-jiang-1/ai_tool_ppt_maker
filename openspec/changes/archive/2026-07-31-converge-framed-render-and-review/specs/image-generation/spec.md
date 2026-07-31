## ADDED Requirements

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

## MODIFIED Requirements

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
