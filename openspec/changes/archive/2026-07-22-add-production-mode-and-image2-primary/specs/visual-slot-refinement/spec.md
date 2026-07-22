## RENAMED Requirements

- FROM: `### Requirement: Refinement is optional, bounded, and authorization-gated`
- TO: `### Requirement: Refinement is mode-scoped, bounded, and authorization-gated`

## MODIFIED Requirements

### Requirement: Refinement is mode-scoped, bounded, and authorization-gated

Only a marked HTML-first run whose authoritative production mode is `html-then-image2` and whose
current final-slide/slot assets are identifiable SHALL be eligible for a new planning/authorization/
generation/review operation. Refinement SHALL be disabled for `html-only`, required for
`html-then-image2` completion, and not applicable to `image2-only`; whole-page Image2 production SHALL
use normal pilot/build instead. Switching from `html-then-image2` to `html-only` SHALL retain all prior
refinement records and accepted source assets but SHALL block new lifecycle work until the mode switches
back.
Normal `image2 plan` SHALL still require current `html-delivery-review: proceed` with complete evidence;
an explicit `image2 plan --force --reason` MAY record a version-scoped delivery-prerequisite waiver
when that decision is missing or incomplete; a current `repair|redirect` decision remains a hard stop
until the owning controller resolves it. State SHALL record the waiver reason and failed prerequisite
checks; the plan SHALL bind their fingerprint, remain deterministic, use exact schema
`pptmaker-image2-refinement-plan-v2`, and be stored in exact
`pptmaker-image2-refinement-state-v2`. Existing v1 plans/states SHALL remain readable and SHALL not be
rewritten by observation; every newly created plan SHALL use v2 after unresolved current attempts or
reviews have passed the existing conflict checks. Plan v2 SHALL make no provider request and SHALL
persist the exact closed provider-neutral `profile_contract`
`{schema: "pptmaker-image2-visual-slot-profile-v1", mode: "visual-slot", profile_fingerprint}`;
`profile_fingerprint` SHALL be the existing 64-hex opaque CLI/API profile identity; unknown keys and
credentials are invalid. The adapter uses fixed provider-neutral visual-slot defaults rather than
inventing omitted model/size/resolution values.

Plan v2 SHALL use `request_contract_version: pptmaker-refinement-submit-request-v1` and bind a
64-lowercase-hex SHA-256 `request_fingerprint` for each deterministic setup or slide/slot role. The
fingerprint projection SHALL include kind, slide/slot identity, visual brief/concept, geometry, profile,
and reference roles/media/SHAs; visual brief/concept/geometry are nullable only for a
`style-reference` attempt. It SHALL exclude inline bytes, random authorization/attempt IDs, plan hash,
and the fingerprint itself. References SHALL resolve only through current confined HTML
asset/style-reference owners; callers cannot inject paths or replace a bound SHA. Authorization SHALL
copy each role-bound fingerprint onto its newly allocated attempt. Before allocating authorization IDs,
`authorize` SHALL rematerialize and verify every request fingerprint against the current validated HTML
plan; drift is stale and allocates nothing. `authorize` SHALL still require an exact plan hash and
explicit human decision; `generate` SHALL still require resolvable credentials and
persist/reconcile one authorized attempt at a time. Promotion MAY proceed after a current candidate
review and exact source/plan/authorization identity even when the plan used a prerequisite waiver;
promotion SHALL stale the prior delivery review and completion SHALL require a new current final
delivery review, so the planning waiver cannot complete the deck.

State v2 `prerequisite_waiver` SHALL contain exact fields `reason`, `waived_checks`, `run_version`,
`html_production_reset_id`, `html_delivery_digest`, and `recorded_at`. `waived_checks` SHALL use the
canonical bounded audit-entry shape owned by `node-specification`. The plan SHALL not duplicate reason
text; it SHALL bind a `prerequisite_waiver_fingerprint` over normalized
reason/checks/run/reset/delivery identity. The delivery digest SHALL come from the Phase-3 public
current final-slide resolver and verified ordered manifest, never a synthetic status hash.
Authorization SHALL revalidate that authoritative waiver/fingerprint before allocating attempts.

The Agent SHALL select 2-4 slides when the current deck has at least two eligible slides; a one-slide
deck SHALL select its one eligible slide rather than become impossible to complete. Each selected slide
retains one named no-text visual slot. The Agent SHALL show the setup/page attempt count and obtain exact
plan-hash authorization. Authorization SHALL allocate
single-use random IDs without changing the deterministic plan hash. Scope expansion, retry, stale
request/profile/binding, or new version SHALL require a fresh plan and authorization. Changing from
`html-then-image2` to `html-only` SHALL retain every existing plan, attempt, candidate, review, promoted
source asset, and provenance while removing only the completion obligation; changing back SHALL
revalidate freshness before using that work.

#### Scenario: User ends after HTML delivery

- **WHEN** an `html-only` user ends after current HTML delivery
- **THEN** the HTML delivery remains complete and no refinement plan, authorization, pending node, or lazy derived directory is created

#### Scenario: HTML-only requests new refinement

- **WHEN** an `html-only` run invokes modern refinement planning
- **THEN** the operation returns typed mode-disabled guidance to switch to `html-then-image2`
- **AND** it creates no plan, authorization, provider attempt, or derived directory

#### Scenario: Required refinement has one eligible slide

- **WHEN** a one-slide `html-then-image2` deck has one valid no-text visual slot
- **THEN** planning selects that one slide and retains all exact authorization/review boundaries
- **AND** completion does not require inventing a second slide

#### Scenario: Required mode has no refinement

- **WHEN** `html-then-image2` has current HTML delivery but no current refinement result
- **THEN** refinement status reports incomplete with the next planning/review action
- **AND** no provider work starts without exact authorization

#### Scenario: Whole-page mode requests refinement

- **WHEN** an `image2-only` run invokes modern refinement planning
- **THEN** the operation is not applicable and directs production to normal pilot/build
- **AND** no refinement state or provider attempt is created

#### Scenario: Offline plan continues after waived delivery evidence

- **WHEN** current HTML final-slide/slot identity is valid and the user supplies a bounded force reason
- **THEN** `image2 plan` creates a deterministic plan with a prerequisite waiver
- **AND** no provider, authorization, candidate, or promotion bytes are created

#### Scenario: Planning force is unnecessary

- **WHEN** current delivery proceed evidence is complete and the user invokes `image2 plan --force --reason`
- **THEN** Phase 4 creates an ordinary offline plan and reports `force_not_needed`
- **AND** it stores no prerequisite waiver or provider bytes

#### Scenario: Authorization still requires exact plan identity

- **WHEN** a user authorizes a plan whose hash or waiver-bound inputs are stale
- **THEN** authorization fails without allocating attempts
- **AND** the user is directed to create a fresh plan

#### Scenario: Request fingerprint changes

- **WHEN** current visual brief, concept, geometry, style contract, or reference bytes differ from the authorized plan
- **THEN** generation fails stale before provider submission
- **AND** a new plan and authorization are required

#### Scenario: Random authorization IDs do not change the plan

- **WHEN** authorization allocates new authorization and attempt IDs for an unchanged exact plan
- **THEN** those IDs are excluded from request-material fingerprints and the deterministic plan hash
- **AND** each allocated attempt still copies the exact role-bound fingerprint it is authorized to submit

#### Scenario: Promotion cannot inherit the planning waiver

- **WHEN** a candidate is accepted after a prerequisite-waived plan
- **THEN** promotion invalidates prior delivery review and requires current final review
- **AND** the waiver does not report the deck complete

#### Scenario: Same-pipeline mode is relaxed

- **WHEN** a version with current or partial refinement changes to `html-only`
- **THEN** all attributable refinement work remains available while status removes required-refinement debt
- **AND** no new refinement operation is eligible until the mode changes back
