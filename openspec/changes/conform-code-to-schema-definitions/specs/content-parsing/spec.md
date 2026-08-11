## MODIFIED Requirements

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

### Requirement: Current Page Image Workflow source is a closed homogeneous protocol

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

#### Scenario: v2 source is rejected before receipt creation

- **WHEN** a source carries an undeclared pipeline marker
- **THEN** parsing fails before receipt or raw-plan creation
- **AND** it does not convert or preserve a special historical path
