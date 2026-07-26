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
Raw review `proceed` coverage SHALL also bind the projection SHA, renderer profile digest, and source
epoch; Stage 3 SHALL hard-stop on missing, partial, stale, or mismatched coverage.

#### Scenario: Generation profile drift invalidates review
- **WHEN** provider/model/output/style-profile facts change while source visual semantics are unchanged
- **THEN** raw reuse and review coverage become stale
- **AND** the source epoch does not advance solely for that profile change

