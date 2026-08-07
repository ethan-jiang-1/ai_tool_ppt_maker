## ADDED Requirements

### Requirement: Inspection observes current Page Image Workflow marker-first

Workflow Inspection SHALL remain read-only and resolve a current Page Image
Workflow from its exact `page-image-workflow-v1` source,
`image2-page-workflow-v1` state, selected version-level policy, and direct
replacement lineage records. It SHALL report the selected `framed` or `pure`
workflow and one owner-issued nearest action without inferring a policy from
Markdown prose, deck files, artifact names, or conversation context. It SHALL
not initialize a receipt, mutate state, submit a provider request, or create a
compatibility projection merely to observe status.

#### Scenario: Current Framed status is projected from direct markers

- **WHEN** inspection reads a valid current Framed source/state pair
- **THEN** it reports Framed and the direct prerequisite from its owning
  lifecycle
- **AND** it does not select Pure or construct a per-slide authority view

### Requirement: Inspection rejects v2 before lifecycle interpretation

Inspection SHALL return the bounded `unsupported-protocol/export` hard-stop for v2
Page Authority source, state, receipt, plan, provider media, review, or
delivery evidence before parsing those records into a lifecycle projection. It
SHALL preserve supplied bytes and SHALL not decode, convert, reuse, heal, or
report them as current workflow progress.

#### Scenario: A v2 status request remains non-mutating

- **WHEN** `status` or state observation encounters a v2 receipt
- **THEN** it reports the `unsupported-protocol/export` action before raw or review
  inspection
- **AND** it does not write a receipt, state repair, or task projection

### Requirement: Inspection projects the direct compiled-input lifecycle

For an exact current run, Inspection SHALL obtain the selected adapter's direct
facts for Style Master readiness, compiled provider-input digest, protected
geometry and local profile where applicable, plan/authorization/attempt
status, Pilot scope, Complete Page Review, and delivery. Its primary action
SHALL name the earliest protected invariant or legal current step. A Framed
provider-free overlay refresh is actionable only after direct proof that
compiled provider input, protected geometry, raw contract, and local profile
are unchanged; a header literal change therefore projects raw rebuild.

The review projection SHALL be one Complete Page Review action: Framed shows
the raw provider page beside its production-equivalent header composite, while
Pure shows its complete provider page. Inspection SHALL not project a second
composite approval, synthesize a Pilot, or infer acceptance from an artifact.

#### Scenario: Framed header input drift is raw work

- **WHEN** a Framed title changes and the adapter's compiled-input digest
  changes
- **THEN** inspection returns raw rebuild as the nearest action
- **AND** it does not select provider-free overlay refresh

#### Scenario: Complete Framed page review has one action

- **WHEN** all current Framed provider-page and composite evidence is ready
- **THEN** inspection returns the one Complete Page Review `proceed` or
  `repair` action
- **AND** it does not expose an additional local-composite approval

## REMOVED Requirements

### Requirement: Inspection is observation-only and not an authority

**Reason**: Its unsupported-input boundary and lifecycle terms are defined
against v2.

**Migration**: Use the replacement marker-first observation contract.

### Requirement: Inspection projects TARGET workflow prerequisites marker-first

**Reason**: Its target identity is an exact v2 source/state pair.

**Migration**: Inspect only the current Page Image Workflow source/state pair.

### Requirement: Inspection projects progressive raw lifecycle from direct records

**Reason**: Its Page Authority raw lifecycle and local-rebind semantics are
retired.

**Migration**: Project current adapter facts using the compiled-input
invalidation contract.

### Requirement: Inspection avoids an unreviewable terminal partial Pilot

**Reason**: It is coupled to the retired Page Authority Pilot/evidence model.

**Migration**: Current Pilot remains a preview/cost stage under the replacement
Complete Page Review model.
