## ADDED Requirements

### Requirement: Pure Page Authority prompts render slide text prominently

For a `pure` workflow raw request, the provider prompt SHALL present the slide's
text as an explicit top-level text-rendering contract alongside the visual
direction, so the provider renders the full slide text clearly into the raw
image. The text contract SHALL carry the slide kicker, title, subtitle (when
present), callout (when present), and body text, and SHALL instruct the provider
to render all of them as readable typography. The raw contract, request digest,
authorization scope, and idempotency contract SHALL remain unchanged.

For a `framed` workflow raw request, the provider prompt SHALL NOT present slide
text as renderable; the raw image remains a text-free underlay because the
selected workflow composites text locally.

#### Scenario: Pure prompt carries an explicit text-rendering contract

- **WHEN** a pure raw request is serialized for the provider
- **THEN** the prompt contains a top-level text section with the slide kicker,
  title, subtitle, callout, and body
- **AND** the prompt instructs the provider to render all of that text as
  readable typography in the image
- **AND** the raw contract and its digest are unchanged

#### Scenario: Framed prompt stays text-free

- **WHEN** a framed raw request is serialized for the provider
- **THEN** the prompt does not present the slide text as renderable
- **AND** the framed raw contract and its digest are unchanged
