## MODIFIED Requirements

### Requirement: Current raw lifecycle is immutable, scoped, and adapter-owned

After current source receipt and Style Master readiness are established, the
selected Page Image adapter SHALL publish one provider-free immutable full plan
for its exact version/workflow scope under one active Page Image Task Mandate.
The plan and each ordered stable `slide_id` item SHALL bind the selected
adapter's compiled provider-input digest, raw-contract digest, generation
profile, Style Master selection, Task Mandate reference, and policy-specific
header profile or protected geometry where applicable. A materialized provider
page becomes current only through the exact plan/batch, mandate-bound grant,
submitted terminal attempt, verified bytes, and immutable provenance chain. An
ID match, filename, task projection, copied bytes, last grant digest, or Task
Mandate alone SHALL not establish current raw evidence.

The common progressive owner SHALL consume only a validated typed plan from the
selected adapter. It SHALL retain immutable full plans, batches, grants,
attempts, provenance, and media beneath its replacement-owned append-mostly
store, with one CAS-protected current head per exact scope. A batch is an
immutable selected-ID projection of the full plan, not a partial plan or a
second authority; its generation/predecessor and paid scope are derived from
direct records. Generation SHALL claim and submit at most one eligible item per
invocation. Direct attempt transitions, unknown-submission reconciliation, and
successor planning SHALL preserve the existing exact-attempt/CAS discipline:
an uncertain submitted item consumes its exact scope and cannot be retried,
reopened, or replaced without the owner-issued reconciliation or successor
path. Staging, unreferenced history, directory order, timestamps, and derived
files are not current authority.

`pilot` creates only a provider-free exact batch projection. With a valid active
Task Mandate, routine Pilot scope selection, successor planning, and later
exact batch grant creation are Agent-run work; the grant SHALL still validate
the exact plan, batch, selected IDs, maximum submissions, and mandate binding
before generation. A partial Pilot quality decision is limited to its complete
attributable sample and may only expose the current Expansion or repair/replan
action; it cannot publish accepted raw evidence, final media, a manifest, PPTX,
notes, or delivery. When paid debt is zero or the current Pilot scope exhausts
the full debt, no synthetic partial Pilot decision is created and the owner
routes to Complete Page Review. Missing partial-Pilot coverage with residual
debt returns the owner-issued successor Pilot planning action before evidence
or decision publication.

For a complete raw review, the owner SHALL treat an immutable prepared record
as current only when its decision is unset and no validated later decision
record references that prepared record. Current lifecycle actions and evidence,
unaccepted review preparation, review acceptance, and read-only current-review
inspection SHALL apply this same relationship-aware rule. A decision-history
handoff MAY retain the immutable `repair` decision for audit, but SHALL NOT
establish current review availability or select a lifecycle action. A human
`repair` decision SHALL preserve both immutable records, expose no current
Complete Page Review, and return only the existing
`rebuild_progressive_raw_work` recovery action. It SHALL not replay the
historical prepared review, create a second decision from it, create accepted
raw evidence, or make final or delivery artifacts available.

#### Scenario: Task-Mandate-covered exact grant remains bounded

- **WHEN** a current mandate-bound plan has an owner-issued Pilot or Expansion
  batch with an exact plan hash and batch hash
- **THEN** the owner records or exact-replays one grant bound to that mandate,
  selected IDs, and maximum submissions without a new human cost decision
- **AND** generation still submits at most one owner-eligible item from that
  exact grant per invocation

#### Scenario: Missing or stale Task Mandate stops before a grant

- **WHEN** current raw work has no active mandate or its version, workflow, or
  execution binding no longer matches the plan
- **THEN** the owner returns one mandate-establishment or current-plan recovery
  action before provider initialization, grant publication, or attempt claim
- **AND** it does not infer a mandate from a task projection, prior grant, or
  historical source bytes

#### Scenario: Historical raw scope is never silently adopted

- **WHEN** a retained historical plan or grant lacks the current Task Mandate
  binding required for a new provider submission
- **THEN** inspection and reconciliation preserve its bytes and attributable
  terminal evidence
- **AND** the owner does not rewrite it, attach a mandate retroactively, or
  submit another provider item from that historical scope

#### Scenario: Pilot planning cannot submit or accept a page

- **WHEN** a current full plan receives an exact selected-ID `pilot` request
- **THEN** the owner publishes only the provider-free batch projection and its
  bounded cost/sample facts
- **AND** it creates no provider attempt, grant, accepted raw evidence, or
  Complete Page Review decision

#### Scenario: A submitted uncertain item cannot reopen its grant

- **WHEN** a current raw attempt has no provable terminal provider result
- **THEN** the owner preserves that exact submitted lineage and returns only
  the reconciliation or bounded successor action
- **AND** it does not infer a retry, resubmit the item, or use copied bytes as
  materialization

#### Scenario: A repaired Complete Page Review returns to raw rebuild

- **WHEN** a valid current Complete Page Review has a later immutable decision
  record with `repair` that references its prepared record
- **THEN** lifecycle inspection returns `rebuild_progressive_raw_work` and no
  current Complete Page Review digest
- **AND** it does not expose review acceptance, accepted evidence, final media,
  or delivery as available
- **AND** an audit-only decision handoff, if projected, identifies the review
  as decided and does not make it current

#### Scenario: Historical prepared evidence cannot be replayed or re-decided

- **WHEN** preparation or acceptance is requested after a repair decision has
  referenced the only prepared Complete Page Review for the current plan
- **THEN** the owner rejects that request with the existing bounded rebuild
  recovery action
- **AND** it writes no review, decision, accepted evidence, grant, attempt, or
  provider request
