# Image Generation Specification (delta)

## MODIFIED Requirements

### Requirement: Framed composition evidence preserves one human review decision

The existing Complete Page Review SHALL remain the only acceptance decision for
Framed provider output; its one-decision contract is owned by `image-production`
(`Complete Page Review makes one complete-page decision`), and this requirement
defines only the Framed-specific evidence contribution without restating that
contract. It SHALL continue to bind the exact provider page and
production-equivalent transparent-header composite to the composition-bound raw
lineage. Its existing Framed review contribution SHALL display exactly one
normalized `reserved_header` guide rectangle and one normalized `body_safe`
guide rectangle from that lineage. Provider-safe wording, a successful
deterministic contract check, or an observed provider result SHALL not establish
a general layout guarantee or accepted evidence without that review decision.

The review decision SHALL treat provider-generated typography, labels,
provider-rendered body content, or key visual subjects that visibly encroach on
the exact `reserved_header` as a reason to select the existing `repair`
decision rather than `proceed`. The review remains a human visual quality
decision: it SHALL not add a protected-area occupancy, collision, OCR, or other
automated observation, and it SHALL not infer a remote-layout result from the
compiled instruction alone. The two composition guides remain review context
only: they SHALL not submit provider work, set `repair` or `proceed`, create
approval or waiver state, replace Complete Page Review, or become a runtime
dependency.

#### Scenario: A header-encroaching provider page routes through repair

- **WHEN** a Framed Complete Page Review shows provider-generated typography,
  labels, provider body content, or a key subject inside the exact reserved
  header guide or obscuring the local overlay in the composite
- **THEN** the human selects the existing `repair` decision and the owner
  returns the existing raw-rebuild recovery action
- **AND** it does not publish accepted raw evidence, final media, or delivery
  evidence from that page set

#### Scenario: A compliant-looking provider page still requires review

- **WHEN** a Framed provider page appears to respect its exclusive reservation
  and composition guidance
- **THEN** the existing Complete Page Review presents the exact provider and
  composite evidence and the two exact composition guides for the human's
  `proceed` or `repair` decision
- **AND** no prompt fact, deterministic contract check, diagnostic, or probe
  sample accepts the page itself

#### Scenario: Composition guides cannot control the lifecycle

- **WHEN** a Framed Complete Page Review includes the two composition guides
- **THEN** they remain context for the existing human review and repair path
- **AND** they create no additional gate, state transition, retry, or provider
  authorization

### Requirement: Current raw lifecycle is immutable, scoped, and adapter-owned

After current source receipt and Style Master readiness are established, the
selected Page Image adapter SHALL publish one provider-free immutable full plan
for its exact version/workflow scope under one active Page Image Task Mandate.
The plan and each ordered stable `slide_id` item SHALL bind the selected
adapter's compiled provider-input digest, raw-contract digest, generation
profile, Style Master selection, Task Mandate reference, and policy-specific
header profile or protected composition where applicable. A materialized
provider page becomes current only through the exact plan/batch, mandate-bound
grant, submitted terminal attempt, verified bytes, and immutable provenance
chain. An ID match, filename, task projection, copied bytes, last grant digest,
or Task Mandate alone SHALL not establish current raw evidence.

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
reopened, or replaced without the owner-issued reconciliation or successor path.
Staging, unreferenced history, directory order, timestamps, and derived files
are not current authority.

`pilot` creates only a provider-free exact batch projection. With a valid active
Task Mandate, routine Pilot scope selection, successor planning, and later
exact batch grant creation are Agent-run work; the grant SHALL still validate
the exact plan, batch, selected IDs, maximum submissions, and mandate binding
before generation. A partial Pilot decision is limited to its complete
attributable sample and may only expose the current Expansion or repair/replan
action; it cannot publish accepted raw evidence, final media, a manifest, PPTX,
notes, or delivery. When paid debt is zero or the current Pilot scope exhausts
the full debt, no synthetic partial Pilot decision is created and the owner
routes to Complete Page Review. Missing partial-Pilot coverage with residual
debt returns the owner-issued successor Pilot planning action before evidence
or decision publication.

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
- **THEN** the owner returns the one current-plan recovery action, whose
  provider-free planning path establishes or reuses the mandate, before
  provider initialization, grant publication, or attempt claim
- **AND** it does not infer a mandate from a task projection, prior grant, or
  historical source bytes

#### Scenario: Historical raw scope is never silently adopted

- **WHEN** a retained historical plan or grant lacks the current Task Mandate
  binding required for a new provider submission
- **THEN** inspection and reconciliation preserve its bytes and attributable
  terminal evidence
- **AND** the owner does not rewrite it, attach a mandate retroactively, or
  submit another provider item from that historical scope

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

### Requirement: Current provider compilation binds one resolved Page Class projection

Before compiling a current provider input, the selected adapter SHALL receive
exactly one validated presentation projection for the source receipt page's
normalized Page Class and the version's selected workflow. The binding SHALL
retain the normalized class, selected profile identity, and inherited-value
provenance required to establish the compiled input's exact direct sources. For
Framed, every raw contract and provider-input binding SHALL use the profile and
protected composition resolved for that same stable page ID. Framed SHALL use
only its resolved local header/protected-region facts and Pure SHALL use only
its resolved whole-page Pure facts.

The adapter SHALL not accept a caller-supplied profile, reuse a projection from
another workflow or class, consult a derived file, or revive raw evidence
whose bound projection differs. This binding is part of the existing immutable
raw contract; it SHALL not create a provider call, a separate approval, or a
duplicate header-controller JSON. The exact bound projection MAY be published
only through the independent derived `page-layout` artifact for the same successful
provider-free plan.

#### Scenario: Framed compilation receives its class-bound header treatment

- **WHEN** a current Framed page with a valid resolved presentation projection
  reaches compilation
- **THEN** its provider input and local header controller bind that one
  Framed class/profile projection
- **AND** the compiler does not accept a source `FRAME PRESET` or a Pure fact

#### Scenario: Projection drift cannot reuse raw evidence

- **WHEN** a selected page's resolved class/profile or inherited default differs
  from the binding on existing raw evidence
- **THEN** the existing lifecycle routes through raw rebuild before provider submission or review
- **AND** it does not reuse the former provider page or Complete Page Review
