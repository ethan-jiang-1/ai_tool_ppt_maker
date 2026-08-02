## ADDED Requirements

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
