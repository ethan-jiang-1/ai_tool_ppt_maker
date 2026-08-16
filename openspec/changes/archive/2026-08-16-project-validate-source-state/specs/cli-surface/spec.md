# CLI Surface Specification (delta)

## ADDED Requirements

### Requirement: Validate projects source validity separately from state binding

`ppt_flow validate <run-dir>` SHALL first complete a source-only candidate
parse of the selected workflow's canonical Page Image source (provider-free,
zero state/evidence writes) and SHALL then evaluate the current source/state
identity binding as a separate second stage.

When the source-only parse fails, the failure SHALL project the
producer-issued source problem through the existing `source_validation` /
`edit_source` envelope (Change 1 contract): exact owner/locator facts, exit 1,
empty stdout, one final envelope, and it SHALL NOT be overridden or
reclassified by a state identity result.

When the source parses and the source/state identity binding is stale
(`target_source_state_identity_mismatch`), the command SHALL exit non-zero
with the state owner's bounded hard-stop: `reason.kind` exactly
`target_source_state_identity_mismatch`, one exact owner-owned rebind `next`
(rerun the owner's plan/rebind checkpoint), and a machine-consumable
`source_valid: true` observation in the same final envelope. The
`source_valid` field is a bounded additive boolean: it SHALL be projected
only as `true` when the source-only parse succeeded, SHALL be omitted in
every other envelope, and SHALL NOT authorize raw planning, provider work,
state rebinding, or any bypass of the stale-identity hard-stop. Consumers
SHALL treat it as a non-authoritative observation and SHALL use
`category`/`reason`/`next` as the control authority.

When the source parses and the binding is current, the command SHALL exit 0
with the existing human success text; no additive observation is emitted.

#### Scenario: Invalid source wins over state staleness

- **WHEN** `validate` runs on a run whose source fails parsing while its
  state binding is also stale
- **THEN** the final envelope is the `source_validation`/`edit_source` source
  problem with the exact owner/locator
- **AND** it does not report `target_source_state_identity_mismatch` or any
  state observation

#### Scenario: Valid source with stale binding separates the facts

- **WHEN** `validate` runs on a run whose source parses but whose
  source/state identity is stale
- **THEN** the final envelope carries reason
  `target_source_state_identity_mismatch`, the owner-owned rebind next, and
  `source_valid: true`
- **AND** it writes no state/receipt/plan/generated artifact and initializes
  no provider

#### Scenario: Valid source with current binding succeeds

- **WHEN** `validate` runs on a run whose source parses and whose
  source/state identity is current
- **THEN** it exits 0 with the existing human receipt-validated text
- **AND** it emits no `source_valid` observation and performs no writes
