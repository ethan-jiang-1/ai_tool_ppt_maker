## MODIFIED Requirements

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
composition. A registry without a
`relationships` section SHALL remain parseable and usable; relationship selection
is only available when the registry declares the referenced relationship.

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
