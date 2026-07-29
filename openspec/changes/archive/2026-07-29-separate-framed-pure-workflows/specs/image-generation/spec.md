## ADDED Requirements

### Requirement: TARGET raw mechanics consume typed workflow plans without semantic dispatch

The shared raw owner SHALL accept only a
`page-authority-raw-work-plan-v2` written by the selected target workflow
adapter. It SHALL use the plan's bound source receipt digest, workflow,
ordered stable IDs, typed raw-contract digests, provider profile, and exact
authorization scope to submit, record, and review raw work. It SHALL publish
only `page-authority-accepted-raw-evidence-v2`, bound to the exact plan, raw
bytes, provider/authorization tuple, and raw-review decision.

Shared raw mechanics SHALL NOT interpret Text Frame literals, reserved
rectangles, no-text requirements, Pure display literals, or workflow-specific
refresh policy. A source, workflow, raw-contract, provider-profile, or byte
drift SHALL invalidate evidence through its owning interface before finalization.

#### Scenario: Typed target plan receives shared authorization and evidence

- **WHEN** the selected target adapter submits a valid typed raw plan with exact authorization
- **THEN** the shared raw owner records evidence bound to that plan and its raw byte hashes
- **AND** it does not branch on Framed or Pure semantic fields

#### Scenario: Cross-protocol evidence cannot satisfy target work

- **WHEN** CURRENT v1 raw evidence or a v2 evidence record with a different plan digest is supplied for target finalization
- **THEN** the raw owner reports the stale or cross-protocol evidence as unavailable
- **AND** it does not promote the evidence, infer byte reuse, or submit a provider request automatically
