## REMOVED Requirements

### Requirement: HTML content and visual approval are exact-evidence-hash bound

**Reason**: The previous contract made an incomplete or stale review plan an unconditional failure,
which prevented an explicit user waiver even when the current source/reset/version was identifiable.

**Migration**: Normal approval keeps exact current-plan hash validation. Explicit `--waive --reason`
uses the current computable projection and records a version-scoped waiver with failed checks; a
supplied mismatched hash remains a hard stop.

## ADDED Requirements

### Requirement: HTML approval and waiver expose separate human decisions

The public `approve <run-dir> content|visual` command SHALL require an exact current plan hash for
`approved`. `--waive --reason` SHALL accept a missing/incomplete quality plan only when the canonical
HTML source parses and current run version/reset identity is known. It SHALL publish through the same
gate owner/journal/CAS authority with `decision: waived`, a bounded reason, `evidence_complete: false`,
and a bounded `waived_checks` list. A caller-supplied non-matching plan hash SHALL return `CONFLICT` or
`GATE_BLOCKED` without mutation. HTML legacy gate fields SHALL remain untouched.

#### Scenario: Current plan is approved

- **WHEN** content or visual approval receives the exact current plan hash and complete evidence
- **THEN** the command records `decision: approved` and `evidence_complete: true`
- **AND** the result uses the current reset/version-bound review record

#### Scenario: Incomplete evidence is explicitly waived

- **WHEN** the source parses, current identity is known, and the user supplies `--waive --reason`
- **THEN** the command records a current version-scoped waiver with failed checks
- **AND** readiness distinguishes the waiver from complete approved evidence

#### Scenario: User supplies a wrong hash

- **WHEN** a caller passes a non-matching explicit plan hash
- **THEN** the command returns a bounded mismatch diagnostic with expected/actual lineage
- **AND** it writes no gate, mirror, or waiver record

### Requirement: CLI continuation controls are registered and auditable

`build`, `state --record-delivery-review proceed`, and `image2 plan` SHALL expose the explicitly
reasoned continuation controls defined by their owners. `--force --reason` SHALL never silently
submit to a provider, create a second state authority, or bypass active journal/reset/CAS fences.
Each successful continuation SHALL return a structured result that identifies the decision (`waived`
or evidence waiver), identity freshness, evidence completeness, and the bounded waived checks. Each
failure SHALL use the existing single stderr JSON envelope and secret-safe diagnostic contract.

#### Scenario: Build continues after a user waiver

- **WHEN** content/visual evidence is pending or stale and the user invokes `build --force --reason <text>`
- **THEN** the command publishes current gate waivers through the gate authority and continues local assembly
- **AND** it does not publish approval or evidence completeness

#### Scenario: Delivery continuation lacks reviewable artifacts

- **WHEN** delivery review has no PPTX/contact sheet that the user could inspect
- **THEN** `state --record-delivery-review proceed --force` returns a hard-stop diagnostic
- **AND** it does not create a delivery decision

#### Scenario: Image2 planning is forced without delivery proceed

- **WHEN** current HTML/final-slide/slot identity exists but delivery review is not current
- **THEN** `image2 plan --force --reason <text>` creates only an offline plan with a prerequisite waiver
- **AND** authorization and provider generation remain separate explicit steps

### Requirement: State validation is a registered read-only operation

`ppt_flow state <run-dir> --validate-state` SHALL validate the authoritative state and referenced
evidence without mutating files by default. It SHALL report unknown/missing/extra keys, canonical
version-key errors, SHA format or on-disk reference mismatches, and delivery-record field differences
with bounded expected/actual paths. It SHALL provide a producer-owned normalize/repair next action
without requiring a novice to hand-edit YAML.

#### Scenario: State contains an intuitive but noncanonical version key

- **WHEN** a record is stored under `v2` instead of `3_versions/v2`
- **THEN** validation reports the exact key and canonical replacement
- **AND** the read-only command does not silently rewrite the state

#### Scenario: Delivery record has one wrong SHA

- **WHEN** a delivery record SHA differs from the referenced file
- **THEN** validation reports the field path plus bounded expected and actual values
- **AND** normal state observation remains non-mutating
