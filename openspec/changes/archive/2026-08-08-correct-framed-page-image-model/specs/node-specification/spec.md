## ADDED Requirements

### Requirement: Controller state binds one current Page Image Workflow lineage

For production work, Node/State SHALL bind one exact
`page-image-workflow-v1` source and `image2-page-workflow-v1` state pair,
one version-level `framed` or `pure` workflow, and the corresponding
`page-image-workflow-source-v1` receipt when materialized. The Controller may
project lifecycle facts, but it SHALL not duplicate provider input, review
authority, or final acceptance as a second state-owned evaluator. `hybrid`, a
per-slide workflow, an omitted policy, or a mismatched pair SHALL fail closed
with the source/identity owner's nearest action.

#### Scenario: State does not invent a per-slide policy

- **WHEN** state contains a current Framed workflow but a slide-level policy
  override is supplied
- **THEN** validation returns the source/structural repair action before a
  Controller route is selected
- **AND** it does not record mixed workflow state

### Requirement: Current state preserves the unsupported v2 boundary

State validation, Controller resume, mutation, and diagnostic consumption
SHALL reject any v2 Page Authority source/state/receipt/evidence lineage before
provider work, generated-artifact reads, state repair, or state mutation. The
failure SHALL preserve those bytes and cite the owner-issued
`unsupported-protocol/export` action; it SHALL not normalize, migrate,
reinterpret, or use them as a basis for replacement workflow facts.

#### Scenario: Resume cannot repair a v2 state record

- **WHEN** a Controller resume encounters `image2-page-authority-v2`
- **THEN** it returns the `unsupported-protocol/export` hard-stop before node
  projection or state healing
- **AND** it does not write replacement state or a continuation target

### Requirement: Fresh target versions do not inherit Page Image Workflow acceptance

On first structural publication or `new-version` target activation, State SHALL
retain source-version records but create a fresh selected-workflow draft with
no replacement receipt, Style Master acceptance, raw authorization/evidence,
Complete Page Review, final manifest, assembly, notes, or delivery receipt.
Target readiness SHALL be evaluated only from target-owned current facts. An
exact replay may preserve later target-owned facts after revalidation, but it
SHALL never copy or rebind source-version acceptance.

#### Scenario: A same-policy target still starts unaccepted

- **WHEN** a current Pure source version produces a new Pure target version
- **THEN** the target begins with no Style Master or page-production acceptance
- **AND** state does not inherit source raw or delivery evidence

### Requirement: State atomically activates a clean current target authoring draft

After an exact `new-version` or structural publication creates a clean target
with an explicit current `framed` or `pure` source selection, the State owner
SHALL atomically create one `create-deck` execution bound to that exact target
version and its controller-manifest-validated selected-workflow draft-route
node. Its continuation target, when recorded, SHALL identify that same target.
An explicit completed or inactive source is eligible when its current source
selection and durable facts agree; the caller-supplied source version remains
the only source identity.

Activation may retain the target's copied canonical source selection, but it
SHALL NOT materialize a target source receipt or production-mode record, or
create Style Master acceptance, raw plan/authorization/evidence, Complete Page
Review, final manifest, assembly, notes, delivery, provider grant, or provider
attempt. It SHALL preserve source-version records as source facts and shall not
infer a continuation, receipt, or acceptance from them. A malformed current
selection, target conflict, or active execution for another version SHALL
hard-stop before State mutation or provider work.

#### Scenario: A clean target receives its own current draft execution

- **WHEN** an exact current Framed source is copied into a clean target
- **THEN** the target receives a `create-deck` execution for its Framed draft
  route and no materialized page-production lineage
- **AND** the source execution and its receipt/evidence remain unchanged

#### Scenario: Target activation fails before a competing continuation is written

- **WHEN** target cleanliness or an active execution binding is inconsistent
- **THEN** State returns the owning repair action before writing a target
  execution or continuation pointer
- **AND** it does not reinterpret source evidence as target evidence or invoke
  a provider

### Requirement: Style Master readiness is replacement-protocol scoped

The `style_master_accepted` Controller prerequisite SHALL consult only the
current Style Master acceptance for the exact Page Image Workflow version,
workflow, source/visual scope, and selected bytes. File presence, task cards,
v2 candidates, a v2 acceptance record, or a sibling workflow selection SHALL
not satisfy the condition. The Boolean remains read-only; the Style Master
owner supplies its detailed repair action.

#### Scenario: A v2 style asset does not pass current readiness

- **WHEN** an otherwise current Framed version has only a v2 Style Master
  selection or `style_master.jpg` file
- **THEN** `style_master_accepted` is false and inspection points to the
  current Style Master owner
- **AND** state does not seed a replacement acceptance record

## REMOVED Requirements

### Requirement: TARGET Page Authority state is bound to one version workflow

**Reason**: It binds Controller state to the retired v2 Page Authority pair.

**Migration**: Bind state to the replacement Page Image Workflow source/state
pair.

### Requirement: Progressive Controller handoffs remain evidence references

**Reason**: Its progressive evidence model is v2-specific.

**Migration**: Project only replacement workflow facts from their owning
interfaces.

### Requirement: TARGET structural versions begin with fresh workflow evidence

**Reason**: It names the retired target workflow lineage.

**Migration**: New targets start with fresh Page Image Workflow evidence.

### Requirement: State owns clean Page Authority target-draft activation

**Reason**: It validates v2 source/state identity when activating a target.

**Migration**: Activate only a clean replacement-protocol authoring draft.

### Requirement: Style Master readiness consumes one canonical effective selection

**Reason**: The current acceptance record is scoped to v2 Page Authority.

**Migration**: Evaluate only the exact current Page Image Workflow selection.

### Requirement: Schema-v5 state carries optional Style Master acceptance evidence

**Reason**: Its Page Authority-specific state map cannot represent the new
lineage as current evidence.

**Migration**: Persist replacement-protocol Style Master evidence under the
current State contract without translating v2 records.
