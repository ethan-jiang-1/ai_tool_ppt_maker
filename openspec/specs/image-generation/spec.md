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
