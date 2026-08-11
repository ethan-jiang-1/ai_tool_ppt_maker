## Purpose

Define Page Image Workflow source parsing for `slide-specifications.md`. Parsing
validates the current source marker, stable identity, one version workflow, closed
visual brief, Provider Content Schema, and Framed Header Rendering Policy receipt before any provider or derived-artifact
work begins.
## Requirements
### Requirement: Stage 1 emits stable identity and derived position

The source parser SHALL retain each formal `slide_id` and derive its 1-based
`position` from source order. New template and initialized sources SHALL
declare the current schema-declared `identity.scheme` value `mnemonic` without
creating a second order source. Position remains a snapshot projection and the
formal ID remains cross-version identity.

#### Scenario: A new source declares mnemonic identity

- **WHEN** initialization creates a current slide source
- **THEN** it writes `identity.scheme: mnemonic` and derives position from
source order
- **AND** it does not emit a version-suffixed identity marker

#### Scenario: Plan exposes both concepts

- **WHEN** a source block is parsed in a current source
- **THEN** its receipt exposes the formal ID and derived position separately
- **AND** the position is not part of formal identity

#### Scenario: Reorder changes projection only

- **WHEN** an unchanged slide moves in source order
- **THEN** parsing derives the new position while retaining the formal ID
- **AND** it does not alter the current identity scheme

### Requirement: Stage 1 preserves stable-ID inputs across ordering-only changes

The source parser SHALL exclude physical position, heading number, source block
order, and position-bearing display names from expensive Page Image Workflow raw inputs.
Reordering alone SHALL leave semantic raw inputs byte-equivalent for every retained
slide.

#### Scenario: Reorder preserves raw inputs

- **WHEN** only source order and normalized heading numbers change
- **THEN** each retained ID has the same semantic raw input as before
- **AND** only order-dependent projections are rebuilt

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

### Requirement: Page Source owns one closed presentation class selector

Each current Page Image Workflow page MAY declare `PAGE CLASS` exactly once with
one of `standard`, `opening`, `transition`, or `closing`. An omitted field SHALL
normalize silently to `standard` in the canonical Page Source receipt. An
unknown, repeated, malformed, or workflow-specific value SHALL fail with the
field-level source repair action before the receipt or a dependent projection
is created; parsing SHALL NOT infer a special class from page content, position,
visual selection, generated media, or prior evidence.

`PAGE CLASS` is a source-authored presentation selection, not a content,
provider-prompt, per-page workflow, geometry, or approval field. It SHALL
remain available to both current workflows for their later isolated resolution.

#### Scenario: Omitted class uses the normal treatment

- **WHEN** a valid current source page omits `PAGE CLASS`
- **THEN** its receipt records the normalized class `standard`
- **AND** parsing neither asks the author to choose a class nor blocks receipt creation

#### Scenario: Unknown class stops before a receipt

- **WHEN** a page supplies `PAGE CLASS: hero`
- **THEN** parsing returns the bounded Page Class source repair action
- **AND** it does not create a receipt, infer a replacement, or select an adapter

### Requirement: Header Rendering Policy has a closed fixed header set

The canonical source header fields are `KICKER`, `TITLE`, and `SUBTITLE`.
For `framed`, `TITLE` SHALL be required and the receipt SHALL expose those exact
literals only as potential local header-renderer input plus provider context not
to render. The selected resolved Framed Page Class profile later determines
which of those literals its local treatment permits. For `pure`, the same header
literals are provider-visible content to render. Neither workflow SHALL use a
per-slide fixed-field list or move a body, label, metric, quote, or callout into
local rendering ownership.

`FRAME PRESET` is not a current source field for either workflow. It SHALL fail
as an unsupported field before receipt creation; parsing SHALL NOT translate it
to a Page Class, infer `standard`, retain it in a receipt, or offer a legacy
reader or conversion path.

#### Scenario: Framed header is closed to three literals

- **WHEN** a valid Framed slide supplies kicker, title, subtitle, and provider
  content
- **THEN** the receipt exposes only kicker, title, and subtitle as local-header
  candidates and provider context not to render
- **AND** all provider-rendered content remains outside that input

#### Scenario: Pure source cannot select a Framed preset

- **WHEN** a Pure source supplies `FRAME PRESET`
- **THEN** parsing returns a field-level source repair action before receipt creation
- **AND** it does not create a Page Class binding or a mixed-policy receipt

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

### Requirement: Current Page Image Workflow source validates one homogeneous current contract

Current production source parsing SHALL accept only the schema-declared
`production.pipeline: page-image-workflow` and exactly one
`production.workflow` value, `framed` or `pure`. It SHALL bind that
version-level policy, ordered stable slide IDs, and canonical source digest into
a `page-source-receipt` with its declared `artifact_role` before raw or provider
work. Every resolved slide inherits that one policy; the parser SHALL NOT infer
it from a slide, artifact, directory, omitted field, or historical marker.

An undeclared pipeline, state pair, receipt selector, hybrid value, or
per-slide override SHALL fail through the current source/identity owner before
receipt creation. It SHALL not identify the value as a known legacy protocol,
rewrite it, or create a conversion path.

#### Scenario: A current Framed source emits one homogeneous receipt

- **WHEN** a source selects `page-image-workflow` and `framed` with valid
  stable slide IDs
- **THEN** parsing emits the declared `page-source-receipt` role bound to that
  source digest and workflow
- **AND** every receipt slide inherits `framed` without a per-slide authority

#### Scenario: An undeclared pipeline is rejected before receipt creation

- **WHEN** a source selects a pipeline absent from the serialization inventory
- **THEN** parsing returns the owner-issued source/identity failure before
  receipt or raw-plan creation
- **AND** it does not convert, rewrite, or classify the supplied value

#### Scenario: Current Framed source emits one homogeneous receipt

- **WHEN** a source selects `page-image-workflow` and `framed` with valid IDs
- **THEN** parsing emits the declared current page-source receipt
- **AND** every receipt slide inherits Framed policy

#### Scenario: An undeclared source is rejected before receipt creation

- **WHEN** a source carries an undeclared pipeline marker
- **THEN** parsing fails before receipt or raw-plan creation
- **AND** it does not convert or preserve a special historical path
