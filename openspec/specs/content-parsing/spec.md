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

### Requirement: Page Authority source resolves one authority per slide

For `production.pipeline: page-authority-image2-v1`, parsing SHALL accept only
the current production mapping and a per-slide `PAGE AUTHORITY` override of
`pure-image2` or `framed-image2`. The receipt SHALL record one authority for each
stable slide ID and reject unrecognized production or free-form provider input
before derived-artifact or provider work.

#### Scenario: Source default and slide override resolve

- **WHEN** a valid source defaults to `framed-image2` and one slide overrides it with `pure-image2`
- **THEN** the receipt records the correct authority for each stable slide ID
- **AND** metadata, filenames, and generated artifacts do not affect resolution

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

Current production source parsing SHALL accept only the Page Authority grammar and
bind each slide to its resolved Pure or Framed authority. Historical source parsing
is confined to the read-only observer and SHALL NOT publish a current plan or
adapter.

#### Scenario: Historical source cannot produce a current plan

- **WHEN** a source carries a recognized historical marker
- **THEN** normal production parsing returns the adoption boundary before producing a receipt or raw owner

### Requirement: TARGET Page Authority source selects one version workflow

For `production.pipeline: page-authority-image2-v2`, the source parser SHALL
require exactly one `production.workflow` value: `framed` or `pure`. It SHALL
bind that value, the ordered stable slide IDs, and the canonical source digest
into a `page-authority-image2-source-v2` receipt before raw or provider work.
Every resolved target slide SHALL inherit the receipt workflow; the parser
SHALL NOT infer a workflow from a slide, artifact, directory, or omitted field.

TARGET source SHALL reject `production.page_authority_default`, any per-slide
`PAGE AUTHORITY` declaration, a missing workflow, an unsupported workflow, and
any hybrid v1/v2 source shape. `page-authority-image2-v1` parsing remains the
sole owner of the CURRENT default and per-slide authority grammar.

#### Scenario: Target workflow receipt is homogeneous

- **WHEN** a source has pipeline `page-authority-image2-v2`, workflow `framed`, and valid stable slides
- **THEN** parsing publishes one `page-authority-image2-source-v2` receipt with workflow `framed`
- **AND** every slide is resolved through the Framed workflow without a per-slide authority selection

#### Scenario: Hybrid source fails before provider work

- **WHEN** a v2 source contains `page_authority_default` or a slide `PAGE AUTHORITY` declaration
- **THEN** parsing rejects the source as an invalid target workflow shape
- **AND** it does not publish a receipt, raw plan, authorization scope, or provider request
