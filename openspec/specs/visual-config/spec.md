## Purpose

Define the Page Authority visual-language registry and fixed Framed Text Frame
inputs. The registry is the current source of visual selection and frame data.
## Requirements
### Requirement: Page Authority visual language is a closed registry selection

Visual Config SHALL own
`2_backbone/visual-style/page-authority-visual-language.yaml`. It SHALL validate
registered recipes, compositions, motifs, compatibility, and authority eligibility,
then compile only selected canonical clauses. Unregistered IDs, generated copies,
free provider prose, and caller-owned path overrides SHALL be rejected.

The registry SHALL optionally declare a `relationships` section. Each registered
relationship record SHALL carry a text-guard-protected `provider_clause`, its
`authorities` eligibility, the `recipe_ids` / `composition_ids` it is compatible
with, and a `reading_order` projection restricted to `bottom-to-top` or
`left-to-right`. Each compatibility id SHALL reference a registered recipe or
composition. A registry without a `relationships` section SHALL remain parseable
and usable; relationship selection is only available when the registry declares
the referenced relationship.

A source `VISUAL BRIEF` SHALL be able to declare an optional `relationship` type
(e.g. `layer-stack` or `causal-flow`). When declared, selection SHALL validate that
the relationship is registered, eligible for the selected authority, and compatible
with the selected recipe and composition; an unregistered, ineligible, or
incompatible relationship SHALL be rejected before receipt compilation. When
declared and valid, the relationship SHALL enter the semantic and projection
digests and the compiled provider clauses deterministically, so the raw image
contract digest changes with the relationship while the stable `slide_id` lineage
is preserved. When not declared, the relationship members SHALL be omitted from
the selected semantic, projection, and provider-clause objects; consumers SHALL
treat their absence as no relationship, and existing behavior SHALL be unchanged.

#### Scenario: Selected registry facts have local invalidation

- **WHEN** a registry change affects only an unselected record
- **THEN** the unchanged slide's selected-language digest remains unchanged
- **AND** its raw image contract is not invalidated for that reason

#### Scenario: Relationship selection changes the digest deterministically

- **WHEN** a source selects a registered and compatible relationship (for example
  `layer-stack`) for a slide
- **THEN** the selection includes the relationship's provider clause and reading-order
  projection
- **AND** the slide's semantic digest, projection digest, and raw contract digest
  differ deterministically from the same slide without the relationship
- **AND** the slide_id lineage is unchanged

#### Scenario: Unregistered relationship is rejected before receipt compilation

- **WHEN** a source selects a relationship type the registry does not declare, or a
  relationship incompatible with the selected recipe or composition, or one not
  eligible for the selected authority
- **THEN** receipt compilation hard-stops with the bounded registry error
- **AND** no provider request is authored

#### Scenario: Registry without relationships keeps working

- **WHEN** a deck registry declares no `relationships` section and a source declares
  no relationship
- **THEN** the source parses and the visual-language selection resolves exactly as
  before this requirement
- **AND** the selected semantic, projection, and provider-clause objects contain no
  relationship key and retain their pre-change digests

#### Scenario: Relationship record has only registered compatible facts

- **WHEN** a relationship record contains an unknown recipe/composition id or a
  reading order outside `bottom-to-top` / `left-to-right`
- **THEN** registry parsing rejects that record before any source selection
- **AND** no receipt or raw contract is compiled

### Requirement: Visual language and roles pass a deterministic no-text guard

Every provider clause and selected role clause SHALL pass the versioned Page
Authority text guard. The guard SHALL reject text-bearing instructions, unregistered
free prose, and invalid character or token forms before receipt compilation.

In addition, the per-slide `VISUAL SCENE` source text SHALL pass the same guard
before it is bound into a raw contract. The guard boundary SHALL be owned by
the workflow adapters: the source parser stores the scene as raw text, and each
adapter normalizes it at raw-contract compilation time using the shared
`normalizePageAuthorityTextGuard` routine. This preserves the `01-content` to
`02-visual-system` import boundary.

#### Scenario: Text-bearing registry instruction is rejected

- **WHEN** a clause includes a forbidden text-bearing instruction or invalid form
- **THEN** validation hard-stops before receipt compilation
- **AND** it reports the violated guard rule

#### Scenario: Text-bearing scene instruction is rejected

- **WHEN** a slide's `VISUAL SCENE` includes a forbidden text-bearing token
  (for example `caption`, `title`, `label`, or `letter`)
- **THEN** raw planning hard-stops with the guard's bounded error
- **AND** it reports the violated guard rule and does not author a provider call

#### Scenario: ASCII scene normalizes deterministically

- **WHEN** a slide's `VISUAL SCENE` text is guard-clean ASCII
- **THEN** the adapter binds the lowercase-normalized, whitespace-collapsed
  scene text into the raw contract
- **AND** the same input yields the same normalized output across compilations

### Requirement: Framed Text Frame has one deterministic preset

Visual Config SHALL resolve `standard-v1` to one normalized set of canvas, capture, panel, field,
typography, palette, line-limit, and reserved-underlay facts. The normalized preset SHALL exclude
duplicate or unconsumed facts and SHALL be the only source from which Framed raw geometry and final
frame pixels are compiled. Caller-owned geometry, fonts, colors, markup, or capture options SHALL be
rejected.

Fit before provider authorization SHALL be established by the current Framed browser evaluator using
the same normalized preset and render profile used for final composition. A width estimate, caller
assertion, or previously supplied preflight object SHALL NOT authorize raw work.

#### Scenario: Text overflow stops raw work

- **WHEN** the current Framed browser evaluator cannot prove that resolved Frame text fits `standard-v1`
- **THEN** planning returns the source-repair hard-stop before provider authorization or raw-plan materialization
- **AND** no estimated-width result or caller assertion may override it

#### Scenario: Preset facts compile to one visual frame

- **WHEN** the same normalized `standard-v1` facts are used for raw planning and final composition
- **THEN** both operations resolve the same panel, field, typography, palette, and safe-zone geometry
- **AND** no second hard-coded frame style participates in either result

### Requirement: Framed render profile has one canonical identity

The Framed owner SHALL construct one canonical render-profile identity from the normalized preset,
versioned layout compiler, checked-in font render inventory, font-selection algorithm, pinned browser
runtime, and capture profile. The identity SHALL exclude source Text Frame literals, page measurements,
the per-page selected font subset, underlay bytes, host paths, and temporary runtime values.

Every Framed raw contract SHALL bind the resulting `render_profile_digest`. A pixel-relevant profile
change SHALL make dependent raw and final evidence stale through its owning interface; a Text
Frame-only edit SHALL NOT change the profile or create provider debt by itself.

#### Scenario: Canonical profile is host-independent

- **WHEN** equivalent render-profile facts are constructed with different object insertion order or host paths
- **THEN** they produce the same canonical render-profile digest

#### Scenario: Pixel-relevant profile drift invalidates evidence

- **WHEN** the normalized preset, compiler, font render inventory, font selection, pinned runtime, or capture identity changes
- **THEN** the render-profile digest changes and dependent Framed evidence becomes stale
- **AND** the runtime does not silently rebind previously accepted underlay bytes

#### Scenario: Text-only edit preserves provider-free eligibility

- **WHEN** only current Text Frame literals change and all raw-contract and render-profile facts remain current
- **THEN** the render-profile digest remains unchanged
- **AND** the edit remains eligible for the owning provider-free local refresh path

### Requirement: Visual configuration owns current Page Authority tokens

Visual configuration SHALL retain only the tokens and frame data consumed by Page
Authority and SHALL NOT retain retired production semantics.

#### Scenario: A Framed page is finalized

- **WHEN** a current Framed Page Authority slide is composed
- **THEN** its frame inputs come from current Page Authority visual configuration

### Requirement: TARGET Framed visual semantics have one Framed workflow owner

Shared visual language and closed registry selection SHALL remain available to
both target workflows. For workflow `framed`, the Framed adapter SHALL be the
sole owner of `standard-v1`, deterministic fit preflight, reserved underlay
rectangles, text-free raw constraints, and local Text Frame composition inputs.
For workflow `pure`, those Framed-specific facts SHALL NOT be added to the Pure
raw plan or shared raw mechanics.

A Framed fit or no-text violation SHALL be detected before provider work and
return the owning deterministic repair action. A frame preset change SHALL
invalidate the related underlay/raw tuple; it SHALL NOT be classified as a
text-only local refresh.

#### Scenario: Framed preflight blocks invalid content early

- **WHEN** a target Framed source exceeds deterministic Text Frame fit or requires semantic body text
- **THEN** the Framed owner rejects it before raw authorization with one repair-or-whole-version-switch action
- **AND** it does not silently change the slide or version to Pure

#### Scenario: Pure target plan has no Framed runtime semantics

- **WHEN** a valid target Pure source is compiled into a raw plan
- **THEN** the plan carries Pure display/raw contract facts and no Text Frame preset or reserved-underlay requirement
- **AND** shared raw mechanics can consume it without a Framed branch
