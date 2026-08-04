## MODIFIED Requirements

### Requirement: Page Authority raw requests are receipt-bound and authorization-scoped

Image Generation SHALL compile page provider requests only from a resolved Page Authority receipt,
trusted visual-language selection, a current accepted effective-style selection, permitted identity
projection, canvas/reserved-frame facts, and Pure-only structured display fields. The effective-style
selection SHALL bind the exact reference bytes, selection scope, acceptance receipt, and generation profile
used by the current raw work plan. The provider submitter SHALL receive and attach those same resolved immutable
reference bytes; it SHALL NOT reread `style_master.jpg`, `style_master_path`, or any compatibility payload. A
path or `style_master.jpg` file alone SHALL NOT satisfy that binding.

A nonzero page submit batch SHALL require exact current human page-raw authorization. Style Master
candidate authorization and `proceed` SHALL NOT satisfy that page-raw authorization. Preview, validation,
local composition, review, assembly, notes, and zero-submit reuse SHALL be provider-free.

Each selected-workflow raw contract (Pure and Framed) SHALL carry the resolved clause text and per-slide
scene alongside the existing digest projection:

- `provider_clauses`: the text-guard-protected resolved record. Without a relationship it SHALL contain
  exactly `recipe`, `composition`, and `motifs`; recipe and composition SHALL be non-empty strings, and motifs
  SHALL be an array of non-empty strings that MAY be empty. With a selected relationship it SHALL contain exactly
  those three fields plus a non-empty `relationship` string from that same selection. Its SHA-256 SHALL equal
  `visual_language.relationship.provider_clause_sha256`; a relationship clause SHALL be absent when the
  projection has no relationship member. No other shape is valid.
- `visual_identity_role_clause`: the resolved identity role-clause text, or `null` when no
  `VISUAL IDENTITY` is selected.
- `visual_scene`: the slide's `VISUAL SCENE` source text after passing the versioned Page Authority text
  guard, or `null` when the slide has no scene.

Before an adapter hashes a raw contract, derives an authorization scope, constructs a provider request, or
materializes a raw plan, it SHALL validate that adapter's exact canonical raw-contract shape. The Pure and
Framed validators SHALL require a resolved visual-language record and the canonical `provider_clauses` shape;
their remaining workflow-owned fields SHALL remain subject to their workflow-owned canonical-shape rules. A
missing, null, malformed, or extra-key provider-clause record SHALL hard-stop the plan checkpoint before
authorization, provider request construction, raw-plan materialization, or provider work. The input SHALL be
repaired before a later plan checkpoint can succeed, and the failure SHALL not create a waiver, retry, fallback,
or recovery route.

The provider submitter SHALL receive the full validated request, including these additive text fields, without
rereading source, registry, `style_master.jpg`, or any compatibility payload. The existing
`visual_language.projection` digest facts SHALL remain in the contract for authorization binding. The serialized
provider body SHALL carry the exact recipe, composition, ordered motif, and selected relationship clause text
from that plan-bound raw contract, not only identifiers and digests.

#### Scenario: Framed payload excludes Text Frame literals

- **WHEN** a Framed receipt contains visible Text Frame fields
- **THEN** the provider payload excludes every literal field value and carries the no-text constraints
- **AND** absent authorization stops before provider invocation

#### Scenario: Unaccepted Style Master stops page raw planning

- **WHEN** a source/state pair has no exact current accepted effective-style selection for its workflow and scope
- **THEN** page raw planning hard-stops before source/raw-plan materialization or a page provider call
- **AND** it returns the Style Master owner action rather than treating a candidate or file path as current style

#### Scenario: Style selection drift fences page raw work

- **WHEN** the accepted effective-style intent/context, bytes, scope, receipt, or generation profile no longer match a stored page raw plan
- **THEN** authorization, generation, review, acceptance, and finalization observe the dependent evidence as stale through their existing owners
- **AND** none of those commands rewrites the plan, advances source epoch solely for style drift, or silently rebinds old bytes

#### Scenario: Pre-change raw plan has no accepted-style binding

- **WHEN** an existing v2 raw plan or accepted evidence names only legacy `style_master.jpg` bytes and has no exact effective-selection receipt identity
- **THEN** current raw planning and downstream freshness evaluation treat that lineage as stale after Style Master adoption
- **AND** they require Generated Image Rebuild rather than patching the old plan or preserving its raw acceptance

#### Scenario: Compatibility payload cannot replace the selected provider reference

- **WHEN** a compatibility payload moves, drifts, or resolves to another action after an effective selection is accepted
- **THEN** page raw provider submission attaches the immutable bytes resolved by that selection and bound into the current raw plan
- **AND** it does not reopen a compatibility path or submit a reference whose digest differs from the plan's selection identity

#### Scenario: Pure payload carries canonical clause text and scene

- **WHEN** a Pure slide resolves a visual-language selection with clause text and has a valid `VISUAL SCENE`
- **THEN** its raw contract includes the canonical `provider_clauses` text record,
  `visual_identity_role_clause` (null without identity), and the normalized `visual_scene`
- **AND** a selected relationship adds its exact plan-bound clause text while a four-key source retains the
  legacy three-key clause shape
- **AND** the relationship clause's SHA-256 equals the selected projection's clause digest
- **AND** the same `visual_language.projection` digest facts remain in the contract for authorization binding

#### Scenario: Framed payload carries canonical clause text and scene

- **WHEN** a Framed slide resolves a visual-language selection and has a valid `VISUAL SCENE`
- **THEN** its raw contract includes the canonical clause text and normalized scene while preserving
  `text_free: true` and the frame facts
- **AND** the Framed canonical-shape validator accepts either closed provider-clause variant and no other

#### Scenario: Pure malformed clause shape hard-stops before provider work

- **WHEN** a Pure canonical raw contract has null, missing, an unsupported fourth key, an absent or empty
  selected relationship clause, a relationship clause whose SHA-256 differs from the selected projection,
  empty recipe/composition text, or non-string motif `provider_clauses`
- **THEN** planning hard-stops before authorization, provider request construction, raw-plan materialization, or a provider call
- **AND** it does not materialize source/raw-plan state or mutate another workflow's state

#### Scenario: Framed malformed clause shape hard-stops before provider work

- **WHEN** a Framed canonical raw contract has null, missing, an unsupported fourth key, an absent or empty
  selected relationship clause, a relationship clause whose SHA-256 differs from the selected projection,
  empty recipe/composition text, or non-string motif `provider_clauses`
- **THEN** planning hard-stops before authorization or a provider call
- **AND** the rejection does not depend on provider-side lookup of clause digests or a second workflow adapter

#### Scenario: Serialized provider body preserves plan-bound clause text

- **WHEN** an authorized current Pure or Framed raw item reaches the existing submitter
- **THEN** the serialized body prompt contains exactly that request's recipe, composition, ordered motif, and
  selected relationship clause text when present
- **AND** the raw-contract digest and authorization scope bind those same text values without submit-time
  registry lookup or reassembly
