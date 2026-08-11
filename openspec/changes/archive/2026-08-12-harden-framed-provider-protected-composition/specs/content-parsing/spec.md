## MODIFIED Requirements

### Requirement: Header Rendering Policy has a closed fixed header set

The canonical source header fields are `KICKER`, `TITLE`, and `SUBTITLE`.
For `framed`, `TITLE` SHALL be required and the receipt SHALL expose those exact
literals only as potential deterministic local header-renderer input. The
selected resolved Framed Page Class profile later determines which of those
literals its local treatment permits and supplies non-text protected-composition
guidance to the selected adapter. A Framed receipt SHALL NOT derive an exact
header-literal provider context, `context_not_to_render` field, or other
provider-visible copy from these local fields. For `pure`, the same header
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
  candidates and no exact header-literal provider context
- **AND** all provider-rendered content remains outside that local input

#### Scenario: Pure source cannot select a Framed preset

- **WHEN** a Pure source supplies `FRAME PRESET`
- **THEN** parsing returns a field-level source repair action before receipt creation
- **AND** it does not create a Page Class binding or a mixed-policy receipt

## ADDED Requirements

### Requirement: Page Source retains one closed subject-restriction fact

Each current Page Image Workflow page MAY declare `SUBJECT RESTRICTIONS` once
with one of `none`, `no-generic-metal-robot`, or `no-identity-subject`. An
omitted field SHALL normalize to `none` in the canonical Page Source receipt.
The normalized value is a source-owned visual constraint that remains separate
from provider-rendered content, Header Rendering Policy, page geometry,
provider prompt prose, review, authorization, and lifecycle state.

An unknown, repeated, malformed, or workflow-specific restriction SHALL fail
through the field-level source repair action before receipt creation. Parsing
SHALL not infer a restriction from a rendered page, Style Master, prior request,
or derived C5 artifact.

#### Scenario: An omitted restriction is retained as none

- **WHEN** a valid current page omits `SUBJECT RESTRICTIONS`
- **THEN** its canonical source receipt records the normalized `none` value
- **AND** parsing does not ask the author to supply a restriction or create a
  provider instruction

#### Scenario: An invalid restriction stops before a receipt

- **WHEN** a page supplies `SUBJECT RESTRICTIONS: no-robot`
- **THEN** parsing returns the field-level source repair action before receipt
  creation
- **AND** it does not infer a supported value or publish a dependent plan
