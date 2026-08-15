## ADDED Requirements

### Requirement: Page Image provider inputs bind one optional shared Page Design System

For each current Page Image Workflow scope, Page Image Core and the selected
Pure or Framed adapter SHALL bind one resolved optional Page Design System to
every current page. The binding SHALL have the exact nullable raw-contract
shape `page_design_system: { text, sha256 }`: `text` is either the exact
non-empty source UTF-8 text or `null`; `sha256` is either the lowercase SHA-256
of that exact text or `null`; and the two values SHALL be null together or
present together. Core, ordinary raw-plan items, progressive raw-plan items,
and derived request inspection SHALL retain the matching nullable
`page_design_system_sha256` binding. The authorization-scope hash SHALL bind
the complete per-page provider-input binding map, including that nullable
digest; authorization SHALL NOT add a second explicit Page Design System field
or lifecycle copy.

Each adapter-owned canonical provider input SHALL contain exactly one top-level
`design_system` field with the bound text or `null`. It SHALL not expose a
physical path, source origin, SHA-256, lifecycle state, plan identifier, or
other lineage-only fact. The current Pure input remains limited to its Pure
projection and the current Framed input retains its exact exclusive-header-
reservation instruction, protected composition, and local-header boundary;
the shared design-system text SHALL not move a local header into provider
content or weaken any Framed constraint. The complete canonical provider input
for either workflow SHALL not exceed 32,768 UTF-8 bytes.

Before raw-plan publication, authorization, provider initialization, or
submission, the selected adapter SHALL validate the binding's exact shape,
null symmetry, text digest, plan digest, and canonical input size. A missing,
extra, forged, asymmetric, or digest-mismatched design-system fact, a
provider-facing lineage field, or an oversized input is a non-bypassable
integrity `hard-stop`: the owner SHALL preserve existing evidence, report the
direct source/configuration or adapter repair action, and create no partial
plan, grant, attempt, or provider request. The selected adapter and current
raw-plan schema remain the current-admission evaluators; the bounded historical
cutover validator cannot admit provider work. No controller state, approval,
retry, or fallback source is introduced.

The runtime and submitter SHALL transport the adapter's already bound canonical
UTF-8 bytes unchanged. They SHALL not reread the Page Design System source,
construct a replacement field, or add/remove/rewrite its text during
inspection, authorization, or submission. Deterministic binding proves only
the submitted input; Complete Page Review remains the authority for visual
acceptance of provider pixels.

#### Scenario: Both workflow adapters receive the same selected text

- **WHEN** a current Pure page and a current Framed page plan from the same
  non-empty resolved Page Design System
- **THEN** each raw contract contains the same exact `page_design_system` text
  and digest and each canonical provider input contains the same top-level
  `design_system` text
- **AND** neither provider-facing input contains the source path, digest, or
  origin and each retains only its own workflow-specific facts

#### Scenario: An absent design system stays explicitly null

- **WHEN** a current source resolves no Page Design System text
- **THEN** both adapters retain `page_design_system.text: null` and
  `page_design_system.sha256: null` and compile a present
  `design_system: null` field
- **AND** the absence does not cause an inferred default, a Pure-only source,
  a Framed header profile, or a provider call

#### Scenario: A Framed request retains its exact local-header boundary

- **WHEN** a current Framed page with a non-empty Page Design System compiles a
  provider input
- **THEN** the design-system field is separate from and does not alter the
  existing exact exclusive-header-reservation instruction
- **AND** local header literals and header-derived context remain absent from
  the provider request under the existing Framed contract

#### Scenario: A malformed binding stops before provider work

- **WHEN** a current raw contract omits `page_design_system`, contains a
  mismatched text/digest pair, has a plan digest different from its raw
  contract, or produces a provider input larger than 32,768 UTF-8 bytes
- **THEN** provider-free planning hard-stops at the existing owning repair
  checkpoint before publication, authorization, provider initialization, or
  submission
- **AND** it does not substitute prior text, truncate text, create a waiver,
  or mutate historical evidence

#### Scenario: The canonical input byte boundary is exact

- **WHEN** a selected adapter compiles one final canonical provider input of
  exactly 32,768 UTF-8 bytes and an otherwise equivalent input of 32,769 bytes
- **THEN** the exact-boundary input remains valid and the one-byte-over input
  hard-stops before raw-plan publication
- **AND** the adapter measures the final canonical serialization rather than
  source character count, design-system character count, or an intermediate
  object estimate

### Requirement: Page Design System drift invalidates exact Page Image work

Current Page Image planning SHALL resolve the Page Design System before it
publishes a source epoch, raw plan, batch, grant, attempt, provider request, or
derived current request chain. A transition between `null` and non-null text,
or any change to selected non-null source bytes, SHALL change the bound
digest, raw-contract identity, and adapter-owned compiled provider-input
digest. The existing invalidation owner SHALL classify that difference as a
Generated Image Rebuild and require the existing fresh plan and exact
authorization path.

If a stored current adapter plan projection, authorization request, or generation request no
longer binds the currently resolved design-system digest or canonical input,
its preflight SHALL stop before a provider call. It SHALL retain immutable
progressive/lifecycle plans, grants, attempts, reviews, accepted raw media,
final media, delivery, and inspection history as audit evidence and SHALL not
patch those bytes, attach a new digest, or treat former provider work as
current. The stale adapter plan projection SHALL not receive a field-level
patch; its owner MAY replace the complete current projection only by publishing
a newly compiled plan through the existing rebuild route. An unselected
backbone source change SHALL not invalidate a current non-empty version
override.

A stored adapter plan produced by a former provider-input compiler that lacks
this binding SHALL be treated as stale at the same preflight checkpoint. The
selected adapter SHALL return the existing stale-plan/rebuild recovery result
even when current exact-shape validation detects the absent field before a
typed plan-hash comparison. That diagnostic classification SHALL not become a
current compatibility reader, converter, record mutation, or historical-plan
submission path.

That compiler-cutover classification SHALL be narrow: after the existing
receipt, workflow, and outer-plan checks, it applies only when the stored plan
and item shapes are exact, every stored provider-input binding has the former
exact key set (the current key set minus `page_design_system_sha256`), and every
retained field passes its current value validation. An extra, forged,
malformed, mixed-shape, or unrelated missing stored-plan fact SHALL retain its
existing invalid-plan hard-stop and SHALL NOT be labeled
`target_raw_plan_stale`. The narrow detector may identify the absent field for
diagnosis, but SHALL NOT construct a legacy plan model, add or infer the missing
value, compute a current typed-plan hash, or make the record eligible for
authorization or submission. The ordinary raw-plan schema owner SHALL own the
exact current/former binding-key and retained-value classification; shared
runtime SHALL consume that result rather than declare another binding schema.

When the progressive current head names an immutable full plan with that same
exact former binding omission, the progressive owner SHALL recognize it only
through a bounded historical cutover validator. The validator SHALL verify the
former plan's exact outer/item/binding shapes, retained value types, canonical
bytes and content address, current scope head, and direct lifecycle lineage. It
SHALL NOT expose the former plan as a normal current typed plan or permit a new
batch, grant, attempt claim, provider submission, review, accepted evidence,
finalization, or delivery from it. The progressive schema owner SHALL own the
former plan/direct-record validation, the store SHALL own canonical bytes and
content-address checks, and the lifecycle owner SHALL own recovery selection.

If that exact former lineage contains an unresolved submitted attempt, the
existing exact no-resubmit reconciliation action SHALL precede compiler-cutover
rebuild and successor publication. Otherwise the owner MAY publish the newly
compiled current progressive plan and CAS-advance the head with the former plan
hash as predecessor. The successor SHALL NOT reuse former materializations or
retain former review evidence because its canonical provider input differs even
when the resolved design system is null. Current cross-plan reuse lookup SHALL
exclude an exact former plan container as a candidate without allowing a mixed,
malformed, noncanonical, or otherwise unrelated invalid container to disappear
as historical compatibility.

#### Scenario: Selected text drift routes to a fresh raw plan

- **WHEN** a current accepted Pure or Framed scope is replanned after the
  selected Page Design System text changes while its source receipt and Style
  Master selection remain otherwise unchanged
- **THEN** the new raw-plan bindings and compiled provider-input digest differ
  and the owner returns the existing Generated Image Rebuild route
- **AND** it does not reuse the old provider page, review decision, or final
  media as current

#### Scenario: Null transitions are real input drift

- **WHEN** the selected Page Design System changes from null to text, or from
  text to null
- **THEN** current planning treats the resulting nullable digest change as raw
  input drift before authorization or provider work
- **AND** it does not regard an empty field as equivalent to a former
  non-empty request

#### Scenario: A stale stored plan cannot submit after cutover

- **WHEN** authorization or generation is requested for a stored plan whose
  persisted provider-input binding lacks the Page Design System digest required
  by the current compiler
- **THEN** current-plan preflight rejects it before a grant, attempt, or
  provider request
- **AND** it preserves retained immutable lifecycle records for audit, does not
  patch the stale adapter projection, and returns the existing fresh-plan and
  Generated Image Rebuild route

#### Scenario: Unrelated stored-plan corruption is not a compiler-cutover recovery

- **WHEN** a stored plan has an extra, forged, malformed, or unrelated missing
  fact instead of only the former compiler's absent Page Design System binding
- **THEN** current-plan preflight retains its existing invalid-plan hard-stop
  before a grant, attempt, or provider request
- **AND** it does not normalize that record, relabel it `target_raw_plan_stale`,
  or mutate retained evidence

#### Scenario: Exact former progressive head advances without evidence reuse

- **WHEN** the progressive current head names an exact former-binding plan with
  no unresolved submitted attempt
- **THEN** the owner permits only fresh current-plan publication and CAS head
  advancement with the former plan hash retained as predecessor
- **AND** it preserves all former bytes, does not reuse former materialization
  or review evidence, and does not authorize or submit from the former plan

#### Scenario: Former submitted outcome retains reconciliation precedence

- **WHEN** an exact former progressive plan contains a persisted submitted
  attempt whose terminal provider outcome is unresolved
- **THEN** inspection and planning return the existing exact reconciliation
  action before successor publication
- **AND** reconciliation never resubmits, and only after its terminal append may
  the owner advance to a freshly compiled current plan

#### Scenario: Former history cannot poison or enter current reuse

- **WHEN** a later current plan performs a cross-plan materialization or retained
  review lookup while an exact former plan container remains in immutable history
- **THEN** the former container is excluded from current reuse candidates
- **AND** mixed-key, malformed, noncanonical, address-mismatched, or otherwise
  unrecognized containers still fail closed instead of being skipped

#### Scenario: Transport does not reread after successful current-plan preflight

- **WHEN** a generation invocation has successfully re-resolved current Page
  Design System source, compared the exact current plan, and bound its request,
  and the source changes only after that preflight but before the submitter
  consumes the request
- **THEN** the submitted request is byte-for-byte the adapter's bound canonical
  provider input
- **AND** the shared submit path does not reread or rewrite the source, while a
  later generation invocation detects the drift at its own selected-adapter
  preflight
