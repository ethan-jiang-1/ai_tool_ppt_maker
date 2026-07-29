## REMOVED Requirements

### Requirement: Legacy adoption creates no Image2 evidence or provider work
**Reason**: Legacy adoption is replaced by a bounded operator migration/export boundary and is not an active Image Generation lifecycle.
**Migration**: A necessary one-off migration preview is provider-free and is removed with its sunset artifact; active raw work uses typed v2 plans only.

## MODIFIED Requirements

### Requirement: TARGET raw mechanics consume typed workflow plans without semantic dispatch
The shared raw owner SHALL accept only a `page-authority-raw-work-plan-v2` written by the selected target workflow adapter. It SHALL use the plan's bound source receipt digest, workflow, ordered stable IDs, typed raw-contract digests, provider profile, and exact authorization scope to submit, record, and review raw work. It SHALL publish only `page-authority-accepted-raw-evidence-v2`, bound to the exact plan, raw bytes, provider/authorization tuple, and raw-review decision.

Shared raw mechanics SHALL NOT interpret Text Frame literals, reserved rectangles, no-text requirements, Pure display literals, or workflow-specific refresh policy. A source, workflow, raw-contract, provider-profile, byte, or foreign-protocol drift SHALL invalidate evidence through its owning interface before finalization.

#### Scenario: Typed target plan receives shared authorization and evidence
- **WHEN** the selected target adapter submits a valid typed raw plan with exact authorization
- **THEN** the shared raw owner records evidence bound to that plan and its raw byte hashes
- **AND** it does not branch on Framed or Pure semantic fields

#### Scenario: Foreign evidence cannot satisfy target work
- **WHEN** evidence is supplied with a different protocol or plan digest
- **THEN** the raw owner reports it as unavailable
- **AND** it does not promote the evidence, infer byte reuse, or submit a provider request automatically
