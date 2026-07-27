## ADDED Requirements

### Requirement: Page Authority raw requests are receipt-bound and authorization-scoped
Image Generation SHALL compile provider requests only from a resolved Page Authority receipt, trusted
visual-language selection, permitted identity projection, canvas/reserved-frame facts, and Pure-only
structured display fields. A nonzero submit batch SHALL require exact current human authorization.
Preview, validation, local composition, review, assembly, notes, and zero-submit reuse SHALL be
provider-free.

#### Scenario: Framed payload excludes Text Frame literals
- **WHEN** a Framed receipt contains visible Text Frame fields
- **THEN** the provider payload excludes every literal field value and carries the no-text constraints
- **AND** absent authorization stops before provider invocation

### Requirement: Raw evidence and acceptance use exact tuples
Each raw item SHALL have `{slide_id, raw_sha256, raw_image_contract_digest,
raw_generation_profile_digest}`. Reuse and review freshness SHALL require all four values to match.
Raw review `proceed` coverage is version-scoped and SHALL also bind the SHA-256 of the actual raw-review
projection PNG, its canonical projection-renderer profile digest, and source epoch. The projection is a
non-publishing visual artifact derived from one nonempty lexical order of the covered exact raw tuples:
Pure entries show their raw page; Framed entries show their raw underlay with only the fixed safe-zone
guide, never a local Text Frame literal. Its renderer profile covers the checked-in contact-sheet layout,
guide geometry, fonts/runtime, capture, and normalizer facts; a filename, metadata entry, or final
projection cannot substitute for either bound value. A changed covered tuple, guide/authority geometry,
or projection-renderer profile SHALL require a new raw-review projection and decision. Page Authority
finalization SHALL not publish on absent coverage: a complete current reviewable projection without a
decision produces the raw-review `confirm` action, while missing, partial, stale, or mismatched evidence
is a hard-stop repair action.

#### Scenario: Generation profile drift invalidates review
- **WHEN** provider/model/output/style-profile facts change while source visual semantics are unchanged
- **THEN** raw reuse and review coverage become stale
- **AND** the source epoch does not advance solely for that profile change

#### Scenario: A stale raw contact sheet cannot satisfy review
- **WHEN** a covered raw tuple, Framed safe-zone guide, or projection-renderer profile changes after a
  raw-review projection was captured
- **THEN** the previous `proceed` coverage is stale and a fresh non-publishing raw projection is required
- **AND** a final projection, filename, or copied review record cannot satisfy finalization

### Requirement: Structural raw materialization is target-owned and unreviewed
For a Page Authority structural plan, Image Generation SHALL classify a retained slide as materializable
only when its source raw bytes, exact raw tuple, and declared source lineage match the target's resolved
raw image contract and generation profile. Apply SHALL revalidate the plan-bound classification, copy
only verified bytes into the target raw manifest, and mark the target provenance `unreviewed`. It SHALL
not copy raw-review acceptance, final output, provider authorization, or a provider request; a missing or
mismatched source item SHALL remain `needs_raw_generation` for a later separately authorized operation.

#### Scenario: Materialization cannot inherit review approval
- **WHEN** a source Page Authority raw tuple is byte-verified and materialized for a structural target
- **THEN** the target records source lineage and an `unreviewed` raw item without a provider call
- **AND** the target cannot finalize until its own current raw-review `proceed` coverage exists
