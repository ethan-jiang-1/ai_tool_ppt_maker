## Purpose

Define marker-first orchestration through the public Page Image Workflow lifecycle on the checked-in supported Node runtime. It owns source receipt, raw planning, authorization, generation, review, finalization, assembly, notes, delivery review, and structural routing.
## Requirements
### Requirement: Order-dependent views display position and stable identity

Status, selector diagnostics, raw-review labels, and structural impact output SHALL
present each current page as `position + formal slide_id + title` when those fields
are available. Position SHALL be treated as the current snapshot projection and
formal ID as the cross-version reference.

#### Scenario: Raw review remains easy to discuss

- **WHEN** a raw-review projection is rebuilt after reordering
- **THEN** each label shows the page's new position and unchanged formal ID
- **AND** the image artifact remains associated by ID rather than label text

### Requirement: Page Image invalidation is determined by current compiled inputs

The selected Page Image Workflow owner SHALL classify a requested change from
the direct current source receipt, normalized Page Class, selected
workflow-specific presentation projection and its provenance, compiled
provider-input digest, protected geometry, raw contract, generation profile,
local header profile, and final evidence bindings. It SHALL not classify a
change solely from a field name, task card, rendered file, conversation summary,
or an unselected class/profile source file.

Any change to Provider Content Schema, narrative context, visual direction,
generation profile, normalized Page Class, selected deck default, selected
workflow-specific profile, protected geometry, workflow, or a header literal
that is bound as Framed context not to render SHALL require raw rebuild and a
new Complete Page Review. A valid complete-package change only to an unselected
class or sibling profile SHALL leave the page's current compiled bindings and
lifecycle evidence intact. A malformed or cross-file-inconsistent sibling makes
the whole package a source/configuration hard-stop before classification or raw
planning; it SHALL preserve existing immutable evidence and SHALL NOT create a
raw rebuild, local refresh, authorization, or review. Framed local overlay
refresh is provider-free only when the compiled provider input, resolved
projection, protected geometry, raw contract, and local profile are all exactly
unchanged. Notes-only changes remain delivery-owned, and structural or
whole-workflow changes remain preview-first exact-hash versioning work.

#### Scenario: Framed title change becomes raw rebuild

- **WHEN** a Framed title literal changes
- **THEN** the classifier observes the changed compiled provider-input digest
  and selects raw rebuild
- **AND** it does not present a provider-free header refresh

#### Scenario: Selected class-profile edit becomes raw rebuild

- **WHEN** a Framed page's selected class profile changes after its raw work
  has been prepared or reviewed
- **THEN** the classifier observes the changed resolved projection and selects raw rebuild
- **AND** it does not retain the former raw contract or Complete Page Review as current

#### Scenario: Unselected sibling edit changes no page binding

- **WHEN** a page uses `standard` and only the `opening` profile is edited
- **THEN** the classifier retains the page's existing compiled bindings and lifecycle evidence
- **AND** it does not select raw rebuild, local overlay refresh, authorization, or a synthetic review

#### Scenario: A malformed unselected sibling stops package evaluation without invalidation

- **WHEN** a page uses `standard` and the `opening` profile becomes malformed
- **THEN** the source/configuration evaluator stops before change classification or raw planning
- **AND** it preserves the page's existing immutable evidence without emitting a rebuild, refresh, authorization, or review

#### Scenario: Proven local overlay refresh remains provider-free

- **WHEN** a Framed local presentation change preserves every required
  provider-input, resolved-projection, geometry, raw-contract, and profile binding
- **THEN** the classifier routes to the selected local overlay owner
- **AND** it does not create authorization, provider work, or a synthetic Pilot
  route

### Requirement: Framed composition drift follows the existing raw-rebuild path

Pipeline Orchestration SHALL treat a change to a current Framed page's parsed
source `subject_restrictions`, selected normalized protected composition, or
body-safe region as a material compiled-input and raw-contract change. It SHALL
route that page through the existing raw-rebuild and Complete Page Review path
before another provider submission or review; it SHALL not select a local
header-only refresh, reuse prior raw evidence, or infer that a prior provider
page satisfies the new binding.

An absent or invalid current composition binding is an integrity hard-stop at
the existing planning checkpoint. The owning diagnostic SHALL identify the
nearest source/configuration repair action and short-circuit authorization and
dependent lifecycle symptoms. This requirement introduces no command, approval,
state field, retry, waiver, or recovery controller; ordinary provider work
remains attributable to the existing Task Mandate.

#### Scenario: Restriction drift requires a raw rebuild

- **WHEN** a current Framed page's parsed subject restrictions change after a
  raw plan or review has been prepared
- **THEN** orchestration observes changed compiled bindings and routes to the
  existing raw rebuild before provider submission or review reuse
- **AND** it does not retain the former provider page or Complete Page Review
  as current

#### Scenario: Invalid composition short-circuits authorization

- **WHEN** the selected Framed composition cannot establish its required
  normalized body-safe binding
- **THEN** the existing planning checkpoint returns the direct repair action
  before authorization or provider initialization
- **AND** it does not create a composition-specific confirmation, fallback, or control
  record

### Requirement: Current Page Image lifecycle has one policy per version

Orchestration SHALL resolve one current schema-declared `page-image-workflow`
policy, `framed` or `pure`, for the entire version. Both policies retain the
common Page Image Core, provider-content contract, compiled-input lineage, and
shared delivery ownership. An undeclared policy or marker SHALL fail before
orchestration selects an adapter, creates a state transition, or reaches
provider work; it SHALL not be treated as an alternate current workflow.

#### Scenario: A version resolves one current policy

- **WHEN** orchestration evaluates a valid current version source
- **THEN** it resolves exactly `framed` or `pure` under the declared pipeline
- **AND** no historical or per-slide policy is selectable

#### Scenario: A version cannot mix header policies

- **WHEN** a current version attempts mixed Framed/Pure header policy
- **THEN** orchestration retains the existing single-policy rejection
- **AND** it does not choose an alternate contract

### Requirement: Page Image scoped selectors preserve stable-ID evidence

Every scoped Page Image Workflow operation SHALL resolve selectors through the
shared stable-identity contract: exact formal ID, exact spoken key, explicit
current position, unique title fragment, then the bounded retained-ID fallback.
It SHALL resolve all tokens against one source snapshot and preserve the formal
`slide_id`, current `position`, and match basis for each result. Ambiguous or
unknown selectors SHALL fail before an adapter, provider request, or mutation
is selected.

#### Scenario: A scoped Page Image operation preserves stable identity

- **WHEN** a user supplies an unambiguous spoken ID or current position for a
  selected Page Image operation
- **THEN** the operation resolves one formal slide ID from the current snapshot
- **AND** it does not use an ordinal filename, task card, or approximate match
  as authority

### Requirement: Undeclared production input is excluded from current lifecycle routing

Before route selection, orchestration SHALL require exact declared-current
source/state identity and current evidence lineage whenever a production record
is present. A foreign, unreadable, incomplete, or cross-lineage record that
cannot establish that identity SHALL return the owner-issued
`production-protocol` `current-protocol-invalid` hard-stop with the
`repair-current-protocol-identity` action of kind `repair`. It SHALL not acquire
a current lifecycle, refresh route, plan, authorization, generated-artifact
reader, recovery branch, export, conversion, adoption, fallback, or
compatibility reader.

This boundary SHALL not recategorize an exact Harness locator/binding failure, a
declared fresh authoring draft, a state-owned defect after current protocol
identity is established, an exact requested/active Work Version mismatch, or
attributable current delivery drift. Those facts SHALL continue to route to
their existing Harness-binding, narrative/workflow-selection, state,
execution-version, or delivery owner respectively. Only a one-to-one,
fence-clear current state repair may write.

#### Scenario: Invalid evidence cannot select a local route

- **WHEN** a refresh request names source, state, or evidence that cannot
  establish the exact current protocol
- **THEN** orchestration stops at the protocol boundary before change
  classification with the owner-issued repair action
- **AND** it does not attempt a local rebind, raw rebuild, or data conversion

#### Scenario: Declared fresh draft remains authoring work

- **WHEN** a target is a declared fresh authoring draft and has not yet acquired
  production identity
- **THEN** orchestration returns the existing narrative/workflow-selection owner
- **AND** it does not invent an invalid-protocol record or repair action

#### Scenario: Exact execution version mismatch retains its owner

- **WHEN** the requested Work Version differs from the exact active execution
  version of an otherwise declared-current run
- **THEN** orchestration returns the existing execution-version owner action
- **AND** it does not replace that action with protocol repair

### Requirement: Image2 planning has one provider-free derived-data publication checkpoint

For a valid current Page Image Workflow candidate, `image2 plan` SHALL compile
the exact selected-workflow raw-plan candidate, publish its complete derived
derived-data chain, and only then expose the existing next action for
authorization or review. The publisher is deterministic JS work owned by the
existing planning route; the MD Controller continues to own intent and
conversation, and no separate command, approval, state field, gate, retry, or
recovery controller is introduced.

The publication checkpoint is a guide-only inspection result under the existing
plan path, not a confirm or approval. Its failure is an integrity hard-stop for
that plan materialization only: the existing owning diagnostic SHALL name the
nearest source/configuration/publication repair action, and planning SHALL not
continue to authorization, provider initialization, or a second acceptance
surface.

#### Scenario: Planning publishes before existing authorization

- **WHEN** `image2 plan` compiles a valid current Framed or Pure candidate
- **THEN** the complete derived-data chain is available before the route exposes
  its existing authorization next action
- **AND** no provider request, grant, attempt, review decision, or extra human
  confirmation is created

#### Scenario: Publication failure leaves no alternate control path

- **WHEN** the derived-data chain cannot be fully materialized for a candidate
- **THEN** the route returns the existing owner-issued direct repair action and
  exposes neither authorization nor a partial plan as current
- **AND** it does not add a waiver, a retry state, or a publication-specific review
