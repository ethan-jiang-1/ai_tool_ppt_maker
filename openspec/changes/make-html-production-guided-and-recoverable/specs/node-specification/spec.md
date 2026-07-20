## REMOVED Requirements

### Requirement: HTML content and visual gate evidence is versioned and pipeline-specific

**Reason**: The existing requirement made every waiver depend on a complete current review plan and
did not expose evidence completeness separately from identity freshness.

**Migration**: Keep the existing reserved IDs, version key, reset fences, exact journal recovery, and
gate-owned evidence. Add explicit waiver audit fields and allow a reasoned waiver to bind a current
computable projection when quality evidence is incomplete.

### Requirement: State and status expose complete delivery without optional-refinement debt

**Reason**: Delivery status needs to distinguish a current user decision from complete delivery evidence
when the user intentionally continues after a reversible receipt problem.

**Migration**: Preserve the existing `html-delivery-review` owner and typed decisions. Add evidence
completeness and waived-check reporting; do not add a third pipeline gate or a top-level override store.

## ADDED Requirements

### Requirement: HTML gate records distinguish approval, waiver, and evidence completeness

The reserved `html-content-review` and `html-visual-review` records SHALL remain version-scoped under
`nodes[reserved_id].by_version["3_versions/<vN>"]` and SHALL retain their existing schema, reset,
journal, and gate-owned evidence fields. A record SHALL additionally expose bounded `evidence_complete`
and `waived_checks` fields when `status: waived`; `approved` SHALL require `evidence_complete: true`,
while `waived` SHALL require a normalized non-empty `waiver_reason` and may bind a current computable
content/visual projection even when the review plan is missing or incomplete. Current identity freshness
and evidence completeness SHALL be reported separately. A supplied stale/mismatched plan hash,
ambiguous version/reset, active journal, or corrupted state SHALL remain a hard stop.

#### Scenario: Current waiver is visible but not approval

- **WHEN** a user waives incomplete visual evidence for the current reset/version
- **THEN** state reports `status: waived`, `evidence_complete: false`, and the bounded `waived_checks`
- **AND** it does not report the record as an approved complete review

#### Scenario: Notes-only change preserves content evidence

- **WHEN** only speaker-note text changes
- **THEN** the content projection and content approval remain current
- **AND** notes/delivery ownership becomes the only stale owner requiring refresh

#### Scenario: Reset or version identity changes

- **WHEN** a waiver is read under a different reset ID or run version
- **THEN** the record is stale and cannot satisfy HTML readiness
- **AND** no force flag reuses it

### Requirement: Delivery review reports decision, identity freshness, and evidence completeness

The version-scoped `html-delivery-review` record SHALL retain its exact current artifact bindings and
typed `proceed|repair|redirect` decision. A forced proceed MAY bind reviewable current PPTX/contact
sheet artifacts while recording `evidence_complete: false` and bounded `waived_checks`; it SHALL not
invent missing artifact paths or hashes. Status/resume SHALL expose decision, identity freshness,
evidence completeness, and waived checks separately. The record remains final-review evidence and never
becomes a third Stage-4 gate.

#### Scenario: User continues with an incomplete lineage receipt

- **WHEN** current reviewable artifacts exist but one lineage receipt is missing or stale
- **THEN** explicit `--force --reason` records proceed with an evidence waiver
- **AND** status remains transparent that evidence is incomplete

#### Scenario: No reviewable artifacts exist

- **WHEN** PPTX/contact sheet cannot be shown for the target version
- **THEN** delivery proceed remains blocked despite `--force`
- **AND** the diagnostic recommends producing/reviewing the target artifacts

### Requirement: State validation is non-mutating by default

The public state interface SHALL provide a read-only validation mode that checks canonical state shape,
reserved version keys, SHA/path references, exact delivery keys, and waiver/approval field invariants.
Validation SHALL return bounded field-level diagnostics and SHALL not heal, rewrite, or seed state unless
a separate explicit repair operation is invoked.

#### Scenario: Validation finds extra delivery fields

- **WHEN** a delivery record contains an undeclared key
- **THEN** validation identifies the extra field and expected key set
- **AND** it leaves the original state bytes unchanged
