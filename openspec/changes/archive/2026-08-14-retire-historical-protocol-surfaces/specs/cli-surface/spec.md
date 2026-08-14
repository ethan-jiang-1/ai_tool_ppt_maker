## MODIFIED Requirements

### Requirement: CLI observations retain only non-authoritative Page Image projections

`status` and `state --validate-state` SHALL remain zero-write current Page
Image Workflow observations.  Ordinary text `state` and `state --json` may
rebuild the current task projection only for the eligible active replacement
Controller route, after read-only inspection.  The projection SHALL remain a
collaboration view and shall not authorize provider cost, select a lifecycle
action, prove evidence, or resume work.  A run whose source/state/evidence
cannot establish the declared current protocol is not eligible to produce or
update it.

#### Scenario: Status does not repair Page Image state

- **WHEN** `status` observes a current repairable workflow fact
- **THEN** it returns the owner-issued action without writing source, state,
  receipt, authorization, or generated artifacts
- **AND** it does not invoke a provider or create a task card

## ADDED Requirements

### Requirement: Invalid current protocol projects the shared CLI handoff

When a run-scoped direct CLI operation cannot establish exact declared-current
source/state/evidence, finalization, or delivery identity, its producer
diagnostic SHALL project the existing `production-protocol`
`current-protocol-invalid` hard-stop and the
`repair-current-protocol-identity` repair action. Direct build and notes-refresh
consumers SHALL map the typed `current_protocol_invalid` cause through that same
producer rather than defining their own action fields. The CLI projection SHALL
be bounded and secret-safe, shall not name a retired protocol route, and shall
not write state/history/task projections/generated artifacts or initialize a
provider.

#### Scenario: CLI rejects an invalid source marker without mutation

- **WHEN** `status` or `state --json` receives a source marker outside the
  declared current contract
- **THEN** its final failure envelope projects the shared repair handoff before
  dependent work
- **AND** the source and state trees remain byte-identical with no provider
  request

#### Scenario: Delivery identity failure reuses the shared CLI handoff

- **WHEN** direct build or notes refresh encounters a present foreign or
  cross-lineage final-manifest, delivery-media, or receipt record
- **THEN** its final failure envelope projects the shared repair handoff through
  the existing producer
- **AND** it writes no delivery artifact or task projection and initializes no
  provider
