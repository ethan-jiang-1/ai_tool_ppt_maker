## ADDED Requirements

### Requirement: Fully received invalid JSON has a closed response-shape fact

For a current authorized Page Image provider response that was fully read after
an HTTP-success result but cannot be parsed as JSON, the owner SHALL
terminalize the submitted item through the existing `invalid_json` known-
failure outcome and attach exactly one `response_shape` value: `empty`,
`html_like`, or `other_non_json`. Whitespace-only content is `empty`; content
whose leading whitespace is followed, case-insensitively, by `<!doctype html`
or an opening `<html` tag with a tag/doctype boundary is `html_like`; every
other such parse failure is `other_non_json`. The fact SHALL contain neither
response content nor any additional content-derived metadata.

The owner SHALL omit `response_shape` from valid JSON, HTTP failures,
unreadable or lost responses, invalid media, and every other known-failure
classification. An unreadable or lost response SHALL retain its existing
uncertain reconciliation outcome rather than being classified from absent
content.

#### Scenario: An empty successful response terminalizes with its bounded shape

- **WHEN** a current authorized Page Image provider response is HTTP-success,
  fully read, whitespace-only, and not valid JSON
- **THEN** the owner terminalizes the submitted item as the existing
  `invalid_json` known failure with `response_shape: empty`
- **AND** it does not publish response text, headers, size, digest, task
  identifier, raw bytes, retry, or alternate recovery action

#### Scenario: A received HTML document does not expose its contents

- **WHEN** a current authorized Page Image provider response is HTTP-success,
  fully read, begins with an HTML document marker, and is not valid JSON
- **THEN** its existing `invalid_json` known failure carries only
  `response_shape: html_like`
- **AND** media and provenance remain unpublished and the known-failure
  terminal path remains unchanged

#### Scenario: A non-JSON response outside the named shapes remains bounded

- **WHEN** a current authorized Page Image provider response is HTTP-success,
  fully read, nonempty, not an HTML document, and not valid JSON
- **THEN** its existing `invalid_json` known failure carries only
  `response_shape: other_non_json`
- **AND** no provider request, authorization, submission, or reconciliation
  behavior changes

#### Scenario: A response that is not fully available is not shape-classified

- **WHEN** a current authorized Page Image provider response body cannot be
  read or transport is lost before a terminal result is established
- **THEN** the owner retains the existing uncertain exact-reconciliation path
- **AND** it attaches no `response_shape` fact or content-derived diagnostic
