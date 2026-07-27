## Purpose

Define the receipt-bound Page Authority raw-image lifecycle. It compiles current
Pure and Framed raw requests, requires an exact human authorization before a
nonzero provider submission, records deterministic raw evidence, and exposes a
review projection before finalization.

## Requirements

### Requirement: Page Authority raw requests are receipt-bound and authorization-scoped

Image Generation SHALL compile provider requests only from a resolved Page Authority
receipt, trusted visual-language selection, permitted identity projection,
canvas/reserved-frame facts, and Pure-only structured display fields. A nonzero
submit batch SHALL require exact current human authorization. Preview, validation,
local composition, review, assembly, notes, and zero-submit reuse SHALL be
provider-free.

#### Scenario: Framed payload excludes Text Frame literals

- **WHEN** a Framed receipt contains visible Text Frame fields
- **THEN** the provider payload excludes every literal field value and carries the no-text constraints
- **AND** absent authorization stops before provider invocation

### Requirement: Raw evidence is addressed by exact Page Authority tuples

Each current raw item SHALL bind its stable `slide_id`, raw byte digest, raw image
contract digest, generation-profile digest, registered reference eligibility, and
source epoch. Reuse and review freshness SHALL require the complete current tuple;
an ID match or a copied filename alone SHALL NOT satisfy current raw evidence.

#### Scenario: Generation profile drift invalidates review

- **WHEN** provider, model, output, style-profile, or registered reference facts change
- **THEN** raw reuse and review coverage become stale
- **AND** a new source epoch is not manufactured solely for that profile change

### Requirement: Raw review is Page Authority evidence

The raw-review projection SHALL cover one nonempty lexical order of current raw
tuples and bind its PNG digest, capture profile, source epoch, and coverage. A
complete projection without a human decision is a confirm action; missing, partial,
stale, or mismatched coverage is a repair hard-stop. Finalization SHALL not publish
without current accepted raw-review evidence.

#### Scenario: A stale raw projection cannot satisfy finalization

- **WHEN** a covered raw tuple, Framed safe-zone guide, or renderer profile changes
- **THEN** the previous review decision is stale and a fresh projection is required
- **AND** a final artifact or copied review record cannot substitute for it

### Requirement: Structural raw reuse is verified target materialization

Structural preview MAY classify an exact source raw tuple as
`materialize_unreviewed`; apply SHALL verify the source bytes and write only
target-owned unreviewed provenance. Any nonmatching or new item SHALL remain
`needs_raw_generation`. Structural apply SHALL make zero provider calls and SHALL
not inherit authorization, raw acceptance, final evidence, or delivery evidence.

#### Scenario: A target has reused and new raw work

- **WHEN** a confirmed structural plan retains one exact raw tuple and adds one slide
- **THEN** the target records unreviewed provenance for the retained slide and raw debt for the new slide
- **AND** no provider submission or current review acceptance is created by apply

### Requirement: Legacy adoption creates no Image2 evidence or provider work

Image Generation SHALL treat a published legacy-adoption target as a new Page
Authority source epoch with no inherited raw item, raw review, final evidence,
provider authorization, provider request, PPTX assembly, notes receipt, or delivery
evidence. Observation, candidate validation, preview, confirmation, staging,
publication, state handoff, and recovery SHALL make zero provider calls.

#### Scenario: Adoption publishes only raw-generation debt

- **WHEN** a confirmed legacy-adoption target is published
- **THEN** every target slide first classifies as `needs_raw_generation`
- **AND** no credential resolver, transport adapter, or provider call is invoked
