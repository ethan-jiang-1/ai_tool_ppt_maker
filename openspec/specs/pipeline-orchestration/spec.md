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
the direct current source receipt, compiled provider-input digest, protected
geometry, raw contract, generation profile, local header profile, and final
evidence bindings. It SHALL not classify a change solely from a field name,
task card, rendered file, or conversation summary.

Any change to Provider Content Schema, narrative context, visual direction,
generation profile, protected geometry, workflow, or a header literal that is
bound as Framed context not to render SHALL require raw rebuild. Framed local
overlay refresh is provider-free only when the compiled provider input,
protected geometry, raw contract, and local profile are all exactly unchanged.
Notes-only changes remain delivery-owned, and structural or whole-workflow
changes remain preview-first exact-hash versioning work.

#### Scenario: Framed title change becomes raw rebuild

- **WHEN** a Framed title literal changes
- **THEN** the classifier observes the changed compiled provider-input digest
  and selects raw rebuild
- **AND** it does not present a provider-free header refresh

#### Scenario: Proven local overlay refresh remains provider-free

- **WHEN** a Framed local presentation change preserves every required
  provider-input, geometry, raw-contract, and profile binding
- **THEN** the classifier routes to the selected local overlay owner
- **AND** it does not create authorization, provider work, or a synthetic Pilot
  route

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

### Requirement: v2 input is excluded from current lifecycle routing

Before route selection, orchestration SHALL require the exact current
source/state pair and current evidence lineage. A v2 marker, state, receipt,
plan, or evidence record SHALL return the owner-issued `unsupported-protocol/export`
hard-stop and SHALL not acquire a current lifecycle, refresh route, plan,
authorization, generated-artifact reader, or recovery branch.

#### Scenario: v2 refresh request cannot select a local route

- **WHEN** a refresh request names v2 source/state or evidence
- **THEN** orchestration stops at the protocol boundary before change
  classification
- **AND** it does not attempt a local rebind, raw rebuild, or data conversion
