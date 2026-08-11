## ADDED Requirements

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

## MODIFIED Requirements

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
