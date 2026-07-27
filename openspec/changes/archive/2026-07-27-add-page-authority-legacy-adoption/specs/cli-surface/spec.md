## MODIFIED Requirements

### Requirement: CLI exposes a closed versioned production-transition protocol
`ppt_flow state` SHALL expose mutually exclusive `--prepare-production-mode-transition <html-only|html-then-image2|image2-only>`, `--preview-production-mode-transition`, `--confirm-production-mode-transition --plan-hash <hash>`, `--apply-production-mode-transition --plan-hash <hash>`, `--confirm-production-mode-transition-recovery <owner-token>`, and `--recover-production-mode-transition [owner-token]` operations. It SHALL also expose mutually exclusive `--inspect-legacy-protocol`, `--prepare-legacy-adoption`, `--preview-legacy-adoption`, `--confirm-legacy-adoption --plan-hash <hash>`, `--apply-legacy-adoption --plan-hash <hash>`, `--confirm-legacy-adoption-recovery <owner-token>`, and `--recover-legacy-adoption [owner-token]` forms. All forms SHALL delegate to the same state-owned transition transaction and selected adapter; they SHALL not accept `--force`, caller-supplied lineage paths, old-side migration modes, `--reason`, or legacy migration fields.

`--inspect-legacy-protocol` SHALL be read-only and return exactly one observer classification: `recognized-legacy`, `current`, `current-pair-corrupt`, or `unsupported-or-corrupt`, with bounded facts and one next action. Only `recognized-legacy` may prepare adoption. The generic transition prepare form SHALL reject `image2-page-authority`; the adoption form fixes that target and accepts no target-mode argument. Normal legacy production commands that resolve a `recognized-legacy` run SHALL fail before pipeline/provider work with the producer-owned `LEGACY_PROTOCOL_ADOPTION_REQUIRED` envelope and only the provider-free adoption prepare/preview action.

Prepare and preview SHALL remain local and non-writing with respect to source state and visible versions. The named confirmation command is the first state write: an exact plan-hash transaction commit that binds the exact source execution, target mode/intake, candidate inputs, anticipated target version, plan hash, and existing target-user `transition_confirmation` decision to the `production-mode-transition/apply-production-mode-transition` execution. An adoption commit additionally binds its observer/matrix digests. It is not a quality/process-risk continuation, accepts neither `--reason` nor `--force`, and writes no `waived` decision or waiver record. Apply SHALL rederive that hash and revalidate the closed target-intake/digest/decision tuple before publication. An Image2 target reports the later normal authorization/pilot/build boundary and does not submit a provider request during transition or adoption.

Recovery SHALL operate only on the exact transition journal or one exact visible receipt. Same-host proven-dead recovery is automatic only after the existing 60000-ms floor; cross-host or otherwise uncertain recovery requires the state-owned no-active-apply fact attestation after the 300000-ms floor. That attestation is revalidated factual input to a recovery `hard-stop`, not a risk waiver or continuation, and carries no `--reason`/`--force` bypass. A live owner is non-overridable. No removed migration Controller, node, receipt, scratch owner, or command may start or finish a transition.

#### Scenario: HTML-to-Image2 preview is offline
- **WHEN** a valid HTML source previews an explicitly authored `image2-only` candidate
- **THEN** CLI returns the exact target mode, plan hash, and later Image2 authorization boundary
- **AND** it makes no provider request or target version write

#### Scenario: Image2-to-HTML selects the target mode
- **WHEN** a consistent Image2 source prepares an `html-then-image2` candidate
- **THEN** CLI preserves the source and reports the selected HTML target mode rather than silently choosing `html-only`

#### Scenario: Legacy adoption observer is provider-free
- **WHEN** a canonical legacy run invokes `state <run-dir> --inspect-legacy-protocol`
- **THEN** CLI returns its bounded classification and exact adoption action without state, source, target, credential, transport, or provider mutation

#### Scenario: Legacy production is fenced after the bridge exists
- **WHEN** a recognized legacy run invokes a normal build, refresh, pilot, provider, or legacy review command
- **THEN** CLI emits `LEGACY_PROTOCOL_ADOPTION_REQUIRED` before renderer/provider initialization
- **AND** it names only the provider-free adoption prepare or preview action

#### Scenario: Confirmation flags conflict
- **WHEN** a caller mixes transition/adoption operations, JSON, gate recovery, delivery review, or another state operation
- **THEN** CLI returns one `USAGE` envelope before source, state, candidate, or target mutation

#### Scenario: Apply lacks current confirmation
- **WHEN** transition or adoption apply receives a missing, stale, or mismatched plan hash
- **THEN** CLI hard-stops before reservation or publication and directs the Controller to the exact preview checkpoint

#### Scenario: Uncommitted transition preview is non-writing
- **WHEN** the Controller does not invoke the exact plan-hash commit after displaying an exact preview
- **THEN** the source execution, current node, and authoritative source mode remain unchanged
- **AND** no transition execution or target version is created

#### Scenario: Transition commit cannot become a waiver
- **WHEN** a caller supplies `--reason` or `--force` with any transition or adoption confirmation
- **THEN** CLI returns `USAGE` before source, state, candidate, journal, or target mutation
- **AND** it creates no waiver, continuation, or alternate transition path

#### Scenario: Recovery grammar is closed
- **WHEN** a caller combines recovery with another operation or supplies an invalid owner token
- **THEN** CLI returns one `USAGE` envelope before state, journal, staging, source, or target mutation

#### Scenario: Uncertain recovery requires durable fact attestation
- **WHEN** an old-enough uncertain journal is recovered without a current matching recovery-confirmation record
- **THEN** CLI hard-stops before takeover and names the closed fact-attestation form
- **AND** a stale attestation cannot be replayed after journal or plan drift

#### Scenario: Exact plan commit creates only the current transition record
- **WHEN** the Controller commits an exact production-mode transition or adoption preview
- **THEN** state starts `production-mode-transition/apply-production-mode-transition` with the bound source execution, target mode/version, and plan hash
- **AND** it records the target user's `proceed` decision without a risk reason, waiver, or continuation
- **AND** it creates no removed migration field or node

#### Scenario: Exact plan commit binds target intake
- **WHEN** the Controller commits a transition preview with explicit target topic, audience, and success criteria
- **THEN** the plan binds those target-intake fields, their digest, and the target-user decision before target handoff records only new target intake evidence
- **AND** a source Controller decision cannot satisfy the target intake node
