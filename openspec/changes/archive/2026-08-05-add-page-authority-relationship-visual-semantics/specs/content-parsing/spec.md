## MODIFIED Requirements

### Requirement: Page Authority source admits only a closed visual-brief selection

Every Page Authority slide SHALL contain exactly one `VISUAL BRIEF` mapping with
the registered recipe, composition, motifs, and negative constraints. It MAY add
one optional lower-kebab plain-string relationship id only as the fifth and final key, after
`negative_constraints`. Free prose, unregistered IDs, unknown keys, aliases,
anchors, tags, an out-of-order relationship key, and contradictory authority/text
constraints SHALL fail at the source span before a receipt or raw contract is
emitted.

When no relationship key is declared, the parser SHALL preserve the exact
pre-change four-key visual-brief receipt object. When the key is declared, the
parser SHALL carry only its lower-kebab plain id to the visual-language resolver; it SHALL NOT
accept source-owned reading order, primitive, bounds, clause text, or geometry.

#### Scenario: Free visual prose cannot enter a Page Authority request

- **WHEN** a slide supplies a prose scalar, unknown visual-brief key, or unregistered ID
- **THEN** parsing returns the field-level repair diagnostic before registry compilation
- **AND** no provider payload, authorization scope, or raw contract is created

#### Scenario: Optional relationship is position-bound

- **WHEN** a VISUAL BRIEF supplies a registered relationship id as its fifth key
- **THEN** the parser carries only that id to visual-language selection
- **AND** a relationship key in any other position, a non-plain or non-lower-kebab id, or an extra sixth key
  fails before receipt compilation

#### Scenario: Four-key source preserves its receipt semantics

- **WHEN** a valid existing VISUAL BRIEF declares only recipe, composition, motifs, and
  negative_constraints in their original order
- **THEN** the parsed visual-brief receipt object is byte-equivalent to the pre-change
  four-key object
- **AND** it carries no relationship member
