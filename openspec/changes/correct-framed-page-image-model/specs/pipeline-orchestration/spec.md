## ADDED Requirements

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

Orchestration SHALL resolve one current `page-image-workflow-v1` policy,
`framed` or `pure`, for the entire version. Both policies SHALL use the common
Page Image Core, provider-content contract, compiled-input lineage, and shared
delivery owner. They may differ only in Header Rendering Policy, Framed
protected geometry/local overlay, and the corresponding review representation.
No path SHALL create `hybrid` as a third workflow, select local/provider
authority per slide, or let a sibling adapter become a fallback.

#### Scenario: A version cannot mix header policies

- **WHEN** a current version contains a per-slide policy override or `hybrid`
  workflow value
- **THEN** orchestration returns the source/structural repair action before
  raw planning
- **AND** it does not dispatch either adapter or provider request

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

## REMOVED Requirements

### Requirement: Page Authority has one receipt-to-delivery lifecycle

**Reason**: The lifecycle is bound to the retired v2 protocol and text-free
Framed semantics.

**Migration**: Use the replacement Page Image Workflow lifecycle; do not reuse
v2 receipt or delivery evidence.

### Requirement: Page Authority scoped selectors preserve stable-ID evidence

**Reason**: Its Page Authority ownership name is retired from active current
operation terminology.

**Migration**: Retain the same deterministic selector contract only for Page
Image Workflow operations.

### Requirement: Page Authority refresh follows final-pixel ownership

**Reason**: The old field/owner routing allows Framed text literals to bypass
provider context invalidation.

**Migration**: Current routing uses the compiled provider-input fingerprint.

### Requirement: Orchestration resolves one current Page Authority lifecycle

**Reason**: v2 is no longer current.

**Migration**: Resolve only `page-image-workflow-v1` with its matching state
pair.

### Requirement: TARGET Page Authority orchestration is an exclusive workflow trajectory

**Reason**: Its v2 target terminology and separate body semantics are retired.

**Migration**: The replacement policies share Page Image Core and differ only
at Header Rendering Policy.

### Requirement: TARGET refresh follows version workflow ownership

**Reason**: It treats Framed header fields as a broad provider-free refresh
class.

**Migration**: Current Framed local refresh requires proof of provider-input
preservation.
