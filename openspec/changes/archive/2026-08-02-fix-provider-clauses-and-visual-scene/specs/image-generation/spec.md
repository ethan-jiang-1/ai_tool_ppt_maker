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

- `provider_clauses`: the resolved recipe/composition/motif clause text object from the visual-language
  selection, or `null`.
- `visual_identity_role_clause`: the resolved identity role-clause text, or `null` when no
  `VISUAL IDENTITY` is selected.
- `visual_scene`: the slide's `VISUAL SCENE` source text after passing the versioned Page Authority text
  guard, or `null` when the slide has no scene.

The provider submitter SHALL receive the full request, including these additive text fields, without
rereading source, `style_master.jpg`, or any compatibility payload. The existing
`visual_language.projection` digest facts SHALL remain in the contract for authorization binding.

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

#### Scenario: Pure payload carries clause text and scene

- **WHEN** a Pure slide resolves a visual-language selection with clause text and has a valid `VISUAL SCENE`
- **THEN** its raw contract includes `provider_clauses` clause text,
  `visual_identity_role_clause` (null without identity), and the normalized `visual_scene`
- **AND** the same `visual_language.projection` digest facts remain in the contract for authorization binding

#### Scenario: Framed payload carries clause text and scene

- **WHEN** a Framed slide resolves a visual-language selection and has a valid `VISUAL SCENE`
- **THEN** its raw contract includes the clause text and normalized scene while preserving
  `text_free: true` and the frame facts
- **AND** the Framed canonical-shape validator accepts the additive fields

## ADDED Requirements

### Requirement: Scene text passes the deterministic no-text guard before planning

A slide's `visual_scene` text SHALL be normalized through the versioned Page
Authority text guard at raw-contract compilation time. A scene that fails the
guard (non-ASCII, invalid character, forbidden token, or forbidden token pair)
SHALL fail planning with a bounded source-repair diagnostic before any provider
authorization or submission. A slide without a scene SHALL compile with
`visual_scene` `null` and SHALL NOT trigger guard validation.

#### Scenario: Guarded scene compiles

- **WHEN** a slide's `VISUAL SCENE` text contains only ASCII, guard-allowed
  characters, and no forbidden tokens
- **THEN** the normalized scene text is bound into the raw contract
- **AND** planning continues without a guard error

#### Scenario: Guarded scene fails closed

- **WHEN** a slide's `VISUAL SCENE` text contains a forbidden token (for
  example a text-bearing instruction) or an invalid character
- **THEN** planning hard-stops with the guard's bounded error
- **AND** no raw-plan materialization or provider call is made
