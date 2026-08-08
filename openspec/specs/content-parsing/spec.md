## Purpose

Define Page Image Workflow source parsing for `slide-specifications.md`. Parsing
validates the current source marker, stable identity, one version workflow, closed
visual brief, Provider Content Schema, and Framed Header Rendering Policy receipt before any provider or derived-artifact
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
order, and position-bearing display names from expensive Page Image Workflow raw inputs.
Reordering alone SHALL leave semantic raw inputs byte-equivalent for every retained
slide.

#### Scenario: Reorder preserves raw inputs

- **WHEN** only source order and normalized heading numbers change
- **THEN** each retained ID has the same semantic raw input as before
- **AND** only order-dependent projections are rebuilt

### Requirement: Current Page Image Workflow source is a closed homogeneous protocol

Current production source parsing SHALL accept only
`production.pipeline: page-image-workflow-v1` with exactly one
`production.workflow` value, `framed` or `pure`. It SHALL bind that
version-level policy, the ordered stable slide IDs, and the canonical source
digest into a `page-image-workflow-source-v1` receipt before any raw or
provider work. Every resolved slide SHALL inherit that one policy; the parser
SHALL NOT infer it from a slide, artifact, directory, or omitted field.

`hybrid`, `PAGE AUTHORITY`, `production.page_authority_default`, a per-slide
workflow override, or an incomplete source/state protocol pair SHALL fail at
the identity boundary with the owner-issued `unsupported-protocol/export` or
source-repair action. In particular, a
`page-authority-image2-v2` source is unsupported input and SHALL NOT produce a
receipt, plan, adapter route, state repair, or source rewrite.

#### Scenario: Current Framed source emits one homogeneous receipt

- **WHEN** a source selects `page-image-workflow-v1` and `framed` with valid
  stable slide IDs
- **THEN** parsing emits one `page-image-workflow-source-v1` receipt bound to
  that source digest and workflow
- **AND** every receipt slide inherits `framed` without a per-slide authority
  member

#### Scenario: v2 source is rejected before receipt creation

- **WHEN** a source selects `page-authority-image2-v2`
- **THEN** parsing returns the bounded `unsupported-protocol/export` hard-stop before
  receipt or raw-plan creation
- **AND** it does not convert, rewrite, or infer a replacement workflow

### Requirement: Provider Content Schema is the only provider-visible source content

Each Page Image Workflow slide SHALL declare provider-rendered visible copy in
at most one `**SLIDE BODY**` YAML block. The block SHALL be a mapping with
exactly one `items` key whose value is an array of zero through eight items.
Each item SHALL have exactly `role` and `literal`, plus optional
`copy_policy`; `role` SHALL be one of `body`, `label`, `metric`,
`diagram_text`, `quote`, `callout`, or `supporting_copy`, and `literal` SHALL
be a non-empty source string of at most 240 Unicode code points.

`copy_policy` SHALL default to `exact`. The only other value is
`presentation_adaptable`, which SHALL be accepted only for an explicitly
non-factual `supporting_copy` item and for no more than two items on a slide.
All claims, facts, numbers, names, labels, headers, and unmarked literals
remain exact. The schema SHALL reject free-form `BODY`, a display `CALLOUT`,
unknown keys, coordinates, typography, provider prompt text, YAML aliases, or
an item that attempts to declare local rendering ownership.

The receipt SHALL carry this normalized Provider Content Schema separately from
visual direction and from the local header fields. It SHALL preserve each exact
literal and declared adaptation permission; parsing SHALL not shorten,
rewrite, or invent content.

#### Scenario: Framed slide carries provider-rendered callout content

- **WHEN** a Framed slide supplies a valid `SLIDE BODY` item with role
  `callout` and an exact literal
- **THEN** the receipt records it as provider-rendered content
- **AND** it does not add that callout to the local header renderer

#### Scenario: Unmarked factual copy cannot become adaptable

- **WHEN** a `metric`, `label`, or `body` item declares
  `presentation_adaptable`
- **THEN** parsing reports the offending item as a source error
- **AND** no receipt or provider input is created

#### Scenario: Free-form or layout-bearing body is rejected

- **WHEN** a slide supplies inline `BODY`, a display `CALLOUT`, a free-form
  YAML scalar, or a coordinate in `SLIDE BODY`
- **THEN** parsing returns the bounded Provider Content Schema repair action
- **AND** it does not treat the field as provider content or local frame data

### Requirement: Header Rendering Policy has a closed fixed header set

The canonical source header fields are `KICKER`, `TITLE`, and `SUBTITLE`.
For `framed`, `TITLE` and a valid Framed preset SHALL be required and the
receipt SHALL expose those exact literals only as the local header-renderer
input plus provider context not to render. For `pure`, the same header literals
are provider-visible content to render and a Framed preset SHALL be forbidden.
Neither workflow SHALL use a per-slide fixed-field list or move a body, label,
metric, quote, or callout into local rendering ownership.

#### Scenario: Framed header is closed to three literals

- **WHEN** a valid Framed slide supplies kicker, title, subtitle, and provider
  content
- **THEN** the receipt exposes only kicker, title, and subtitle to the local
  header-renderer input
- **AND** all provider-rendered content remains outside that input

#### Scenario: Pure source cannot select a Framed preset

- **WHEN** a Pure source supplies `FRAME PRESET`
- **THEN** parsing returns a field-level source repair action
- **AND** it does not produce a mixed-policy receipt

### Requirement: Page Image source retains one closed visual-language selection

Each current Page Image Workflow slide SHALL contain exactly one `VISUAL BRIEF`
mapping that selects registered recipe, composition, motifs, and negative visual
constraints, with an optional registered relationship as its final key. The
mapping SHALL remain separate from `SLIDE BODY` literals and Header Rendering
Policy: it SHALL not carry provider copy, local-rendering ownership, free
prompt prose, coordinates, typography, or a text-free-page instruction.
Unknown keys, YAML aliases or tags, unregistered IDs, an out-of-order
relationship, or a visual clause that conflicts with the closed content schema
SHALL fail before a receipt or provider input is created.

#### Scenario: Visual selection cannot become content authority

- **WHEN** a Page Image slide supplies a valid visual brief and Provider
  Content Schema items
- **THEN** the receipt records the visual selection separately from the exact
  provider-visible literals
- **AND** no visual registry clause rewrites or supplies a literal

#### Scenario: Invalid visual ingress stops before receipt creation

- **WHEN** a visual brief supplies free prose, an unregistered ID, a content
  literal, or a text-free-page instruction
- **THEN** parsing returns the field-level visual repair action
- **AND** it does not create a receipt, adapter route, or provider input
