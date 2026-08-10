## MODIFIED Requirements

### Requirement: Current Page Image source is a closed homogeneous protocol

Current source parsing SHALL accept only
`production.pipeline: page-authority-image2-v2` with exactly one
`production.workflow: framed|pure`. It SHALL bind that workflow, ordered stable
slide IDs and positions, canonical source digest, and normalized Page Class
facts into one `page-authority-image2-source-v2` receipt before raw or provider
work. Every resolved slide inherits that workflow; parsing SHALL not infer it
from a slide, artifact, directory, or omitted field.

A non-V2 marker or shape SHALL return the owner-issued
`unsupported-protocol/export` hard-stop before receipt, State, adapter, plan,
or provider work, without rewriting source bytes.

#### Scenario: A V2 workflow receipt is homogeneous

- **WHEN** source has pipeline `page-authority-image2-v2`, workflow `framed`,
  and valid stable slides
- **THEN** parsing produces one `page-authority-image2-source-v2` receipt with
  workflow `framed`
- **AND** every slide resolves through Framed without a slide-level workflow
  selection

#### Scenario: A non-V2 source cannot produce a current plan

- **WHEN** source marker or protocol shape is not V2
- **THEN** parsing returns the bounded hard-stop before source receipt or raw
  owner creation
- **AND** it does not rewrite source bytes

## ADDED Requirements

### Requirement: V2 source normalizes one workflow-neutral Page Class

Each V2 slide MAY declare one `**PAGE CLASS**` field. Omission SHALL normalize
to `standard` with defaulted provenance; only `opening`, `transition`, and
`closing` may be explicit. Parsing SHALL reject explicit `standard`, unknown,
duplicate, or malformed values, and a class that attempts to select workflow,
geometry, provider prompt, or local body renderer.

The candidate receipt SHALL carry normalized class and explicit/defaulted
provenance while preserving its V2 version workflow. It shall not read a
presentation file or decide a Header Profile.

#### Scenario: Omitted Page Class is an explicit defaulted source fact

- **WHEN** a valid V2 slide omits `PAGE CLASS`
- **THEN** its candidate receipt records `standard` with defaulted provenance
- **AND** it does not change workflow or add a slide-local renderer choice

#### Scenario: A special Page Class is a closed source selection

- **WHEN** a slide supplies `PAGE CLASS: opening`
- **THEN** its candidate receipt retains `opening` as an explicit source fact
- **AND** a Header Profile ID, coordinate, `hybrid`, or `standard` value fails
  before receipt publication

## REMOVED Requirements

### Requirement: Header Rendering Policy has a closed fixed header set

**Reason**: A code-only `FRAME PRESET` cannot express the V2
version-resolved Header Profile selected through a workflow-neutral Page Class.

**Migration**: V2 source uses the presentation package and optional Page Class;
non-V2 input retains only its generic hard-stop.

## ADDED Requirements

### Requirement: V2 Header Rendering Policy derives from selected Page Class

Canonical header fields remain `KICKER`, `TITLE`, and `SUBTITLE`. For Framed,
`TITLE` remains required. The selected Framed Header Profile determines which
supplied fields are allowed and required; a disallowed or absent required field
fails before raw planning. `FRAME PRESET` is rejected in V2 source.

For Pure, header literals remain provider-visible content. A Framed Header
Profile, Reserved Header Region, or local-header input SHALL not enter a Pure
receipt. Neither workflow may move body, labels, metrics, quotes, or callouts
into local rendering ownership.

#### Scenario: Standard Framed header resolves without a code preset

- **WHEN** V2 Framed source supplies valid header literals and omits
  `PAGE CLASS`
- **THEN** its candidate receipt records defaulted `standard` and no `FRAME
  PRESET`
- **AND** selected-presentation validation supplies the fixed standard Header
  Profile

#### Scenario: Title-only opening rejects surplus source fields

- **WHEN** a Framed `opening` resolves a title-only Header Profile and source
  supplies kicker or subtitle
- **THEN** planning reports named header/source repair before raw planning
- **AND** it does not silently omit, locally render, or provider-render the
  disallowed literal
