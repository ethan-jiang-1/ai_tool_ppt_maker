## Purpose

Define Page Authority source parsing for `slide-specifications.md`. Parsing
validates the current source marker, stable identity, per-slide authority, closed
visual brief, and Framed Text Frame receipt before any provider or derived-artifact
work begins.
## Requirements
### Requirement: Stage 1 emits stable identity and derived position

The source parser SHALL retain each formal `slide_id` and derive its 1-based
`position` from source order. Position is a snapshot projection; the formal ID is
the cross-version identity. New template/init sources SHALL declare
`identity.scheme: mnemonic-v1` without creating a second order source.

#### Scenario: Plan exposes both concepts

- **WHEN** source block `UXGap` is physically the seventh slide
- **THEN** its receipt contains formal ID `UXGap` and `position: 7`
- **AND** a logical raw-image identity does not contain `07`

#### Scenario: Reorder changes projection only

- **WHEN** unchanged slide `UXGap` moves from physical position 7 to position 3
- **THEN** parsing emits `position: 3` with the same formal ID

### Requirement: Stage 1 preserves stable-ID inputs across ordering-only changes

The source parser SHALL exclude physical position, heading number, source block
order, and position-bearing display names from expensive Page Authority raw inputs.
Reordering alone SHALL leave semantic raw inputs byte-equivalent for every retained
slide.

#### Scenario: Reorder preserves raw inputs

- **WHEN** only source order and normalized heading numbers change
- **THEN** each retained ID has the same semantic raw input as before
- **AND** only order-dependent projections are rebuilt

### Requirement: Framed display fields remain local receipt data

For Framed slides, `TITLE` SHALL be required and optional kicker, subtitle, and
callout SHALL normalize into the fixed `standard-v1` Text Frame receipt. Pure
slides SHALL reject a frame preset. Identity selection and the typed visual brief
shall validate before receipt compilation.

#### Scenario: Contradictory frame or identity selection is rejected

- **WHEN** a Pure slide selects a frame preset or an identity selection violates its restriction
- **THEN** parsing returns the field-level repair diagnostic
- **AND** no raw contract is emitted

### Requirement: Page Authority source admits only a closed visual-brief selection

Every Page Authority slide SHALL contain exactly one `VISUAL BRIEF` mapping with
the registered recipe, composition, motifs, and negative constraints. Free prose,
unregistered IDs, unknown keys, aliases, anchors, tags, and contradictory
authority/text constraints SHALL fail at the source span before a receipt or raw
contract is emitted.

#### Scenario: Free visual prose cannot enter a Page Authority request

- **WHEN** a slide supplies a prose scalar, unknown visual-brief key, or unregistered ID
- **THEN** parsing returns the field-level repair diagnostic before registry compilation
- **AND** no provider payload, authorization scope, or raw contract is created

### Requirement: Current source parsing is Page Authority-only
Current production source parsing SHALL accept only the v2 Page Authority grammar and bind every slide to the version's selected Framed or Pure workflow. A non-v2 source marker or shape SHALL fail before receipt compilation and return the owner-issued unsupported-protocol hard-stop; it SHALL NOT publish a plan, adapter, receipt, or inferred workflow.

#### Scenario: Non-v2 source cannot produce a current plan
- **WHEN** a source carries a non-v2 marker or per-slide authority grammar
- **THEN** normal parsing returns the bounded unsupported-protocol action before producing a receipt or raw owner
- **AND** it does not rewrite source bytes

### Requirement: TARGET Page Authority source selects one version workflow
For `production.pipeline: page-authority-image2-v2`, the source parser SHALL require exactly one `production.workflow` value: `framed` or `pure`. It SHALL bind that value, the ordered stable slide IDs, and the canonical source digest into a `page-authority-image2-source-v2` receipt before raw or provider work. Every resolved target slide SHALL inherit the receipt workflow; the parser SHALL NOT infer a workflow from a slide, artifact, directory, or omitted field.

TARGET source SHALL reject `production.page_authority_default`, any per-slide `PAGE AUTHORITY` declaration, a missing workflow, an unsupported workflow, and any non-v2 source shape.

#### Scenario: Target workflow receipt is homogeneous
- **WHEN** a source has pipeline `page-authority-image2-v2`, workflow `framed`, and valid stable slides
- **THEN** parsing publishes one `page-authority-image2-source-v2` receipt with workflow `framed`
- **AND** every slide is resolved through the Framed workflow without a per-slide authority selection

#### Scenario: Non-v2 grammar fails before provider work
- **WHEN** a v2 source contains `page_authority_default` or a slide `PAGE AUTHORITY` declaration
- **THEN** parsing rejects the source with the unsupported-protocol or target-shape repair action
- **AND** no provider payload or source receipt is created

### Requirement: VISUAL SCENE is an optional single-occurrence inline source field

The v2 Page Authority source grammar SHALL recognize `**VISUAL SCENE**` as an
optional, single-occurrence, inline bold field on any slide. Its value SHALL be
one non-empty inline text value and SHALL be carried into the slide receipt as
`visual_scene` (raw text). A slide without the field SHALL have `visual_scene`
`null`. A missing value or more than one occurrence SHALL be reported as a
source error.

The field SHALL NOT be interpreted as a display field (KICKER/TITLE/SUBTITLE/
CALLOUT), a visual-identity field, or a closed `VISUAL BRIEF` selection. The
source parser SHALL NOT apply the text guard to `visual_scene`; guard
validation is owned by the workflow adapter at raw-contract compilation.

#### Scenario: Scene present

- **WHEN** a Pure or Framed slide contains exactly one `**VISUAL SCENE**` field
  with a non-empty inline value
- **THEN** the receipt slide carries that raw text as `visual_scene`
- **AND** the source validates without a scene-related error

#### Scenario: Scene absent

- **WHEN** a slide has no `**VISUAL SCENE**` field
- **THEN** the receipt slide has `visual_scene` `null`
- **AND** the rest of the source validates exactly as before

#### Scenario: Empty scene

- **WHEN** a slide contains `**VISUAL SCENE**:` with no inline value
- **THEN** the source reports an empty-page-authority-field error
- **AND** no receipt is published for that source

#### Scenario: Duplicate scene

- **WHEN** a slide contains more than one `**VISUAL SCENE**` field
- **THEN** the source reports a duplicate-page-authority-field error for each
  occurrence after the first
- **AND** no receipt is published for that source

### Requirement: BODY is an optional single-occurrence inline source field

The v2 Page Authority source grammar SHALL recognize `**BODY**` as an optional,
single-occurrence, inline bold field on any slide. Its value SHALL be one
non-empty inline text value and SHALL be carried into the slide receipt as
`body` (raw text). A slide without the field SHALL have `body` `null`. A
missing value or more than one occurrence SHALL be reported as a source error.

The field SHALL NOT be interpreted as a display field (KICKER/TITLE/SUBTITLE/
CALLOUT), a `VISUAL BRIEF` selection, or a `VISUAL SCENE`. The existing Framed
semantic check SHALL continue to reject `BODY` on Framed slides
(`framed_semantic_body_forbidden`); Pure slides SHALL carry it to the workflow
adapter.

#### Scenario: Body present on a Pure slide

- **WHEN** a Pure slide contains exactly one `**BODY**` field with a non-empty
  inline value
- **THEN** the receipt slide carries that raw text as `body`
- **AND** the source validates without a body-related error

#### Scenario: Body absent

- **WHEN** a slide has no `**BODY**` field
- **THEN** the receipt slide has `body` `null`
- **AND** the rest of the source validates exactly as before

#### Scenario: Framed BODY stays forbidden

- **WHEN** a Framed slide contains a `**BODY**` field
- **THEN** the existing `framed_semantic_body_forbidden` source error is reported
- **AND** no receipt is published for that source

