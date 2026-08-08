## ADDED Requirements

### Requirement: Style Master shares bounded invalid-JSON classification without new lifecycle state

When a current authorized Style Master provider response is fully read after
an HTTP-success result but cannot be parsed as JSON, the common provider
boundary SHALL classify its existing `invalid_json` known-failure error with
exactly one `response_shape` value: `empty`, `html_like`, or `other_non_json`.
Whitespace-only content is `empty`; leading-whitespace-prefixed, case-
insensitive `<!doctype html` or opening `<html` document markers with a
tag/doctype boundary are `html_like`; all other parse failures are
`other_non_json`. The classification SHALL use the same closed meanings as
Page Image and SHALL not contain response content or any additional
content-derived metadata.

The Style Master lifecycle SHALL consume that error through its existing
terminal known-failure path. It SHALL not persist a response-shape field,
add a CLI result field, change replay behavior, create a recovery route, or
alter authorization, submission, retry, or cost control.

#### Scenario: Style Master terminalizes a classified invalid-JSON response

- **WHEN** a current authorized Style Master provider response is HTTP-success,
  fully read, and not valid JSON
- **THEN** the common boundary supplies the existing `invalid_json`
  known-failure error with exactly one closed response shape
- **AND** the Style Master lifecycle records only its existing terminal failure
  outcome

#### Scenario: Style Master does not turn the fact into new state or control

- **WHEN** Style Master consumes a known-failure error with a response shape
- **THEN** replay, authorization, submission count, and next action retain
  their existing semantics
- **AND** no response-shape record, provider content, or alternate retry path
  is published
