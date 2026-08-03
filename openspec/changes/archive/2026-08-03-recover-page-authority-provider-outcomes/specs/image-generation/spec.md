## ADDED Requirements

### Requirement: Definite Page Authority provider failures terminalize without leaking responses

For an authorized current Page Authority item, Image Generation SHALL
distinguish an unprovable provider outcome from a complete response that is
definitely unusable. A transport interruption before any response, or an
interruption while reading a successful response body, SHALL retain the
existing `unknown` and exact reconciliation lifecycle. A received non-success
HTTP response, or a successfully read success response that cannot decode as
the expected response envelope, SHALL terminalize the submitted item through
the existing `known_failure` lifecycle.

The direct known-failure fact for a received response SHALL contain only a
fixed response-failure classification and, for an HTTP response, its numeric
status. It SHALL not retain or expose response content, response headers,
prompt text, credentials, image data URLs, returned image bytes, or a raw-byte
digest. A terminal known failure continues to close its old grant and can only
be retried through the existing owner-derived successor scope and new exact
authorization.

#### Scenario: Received HTTP failure is terminally known

- **WHEN** a provider request receives a non-success HTTP response with a
  numeric status
- **THEN** the submitted item terminalizes as `known_failure` with only its
  fixed response classification and numeric status
- **AND** it creates no raw materialization, provenance, or succeeded attempt
  and does not reopen the old grant

#### Scenario: Complete malformed success response is terminally known

- **WHEN** a successful provider response body is fully received but cannot be
  decoded as the expected response envelope
- **THEN** the submitted item terminalizes as `known_failure` with only the
  fixed invalid-response classification
- **AND** no response text, prompt, credentials, raw bytes, or alternate retry
  route is exposed

#### Scenario: Unreadable response remains unresolved

- **WHEN** transport fails before a response exists or reading an otherwise
  successful response body is interrupted
- **THEN** the existing `unknown` and exact reconciliation action remain the
  only recovery
- **AND** the owner does not infer a known failure, retry, or successor batch

### Requirement: A terminal partial Pilot without coverage returns to successor planning

The raw owner SHALL prepare partial Pilot evidence only when every selected
review-sample tuple has current attributable materialization. When the latest
terminal partial Pilot has at least one missing sample tuple and residual paid
debt, it SHALL return the existing owner-derived successor Pilot planning
confirmation as the one next action. A direct Pilot-review request in that
state SHALL fail before evidence or decision publication and return the same
successor-planning action.

The predecessor batch and grant remain terminal. The successor scope SHALL be
derived from current plan debt through the existing exact-ID evaluator and
shall require its own newly disclosed exact authorization. This transition
shall not create Pilot evidence, a quality decision, accepted raw evidence,
final output, or a new retry mechanism.

#### Scenario: Missing terminal Pilot sample cannot enter review

- **WHEN** a terminal partial Pilot contains a terminal failed or unknown
  selected item with no current materialization and residual paid debt exists
- **THEN** the raw owner returns only the existing successor Pilot planning
  confirmation
- **AND** it does not offer Pilot evidence, Pilot acceptance, Expansion,
  materialization reuse, or the old grant

#### Scenario: Successor Pilot remains exact and newly authorized

- **WHEN** the user selects valid current formal IDs after an incomplete
  terminal partial Pilot
- **THEN** the owner derives one successor batch from current debt and requires
  a new exact batch authorization before another provider submission
- **AND** it does not mutate the predecessor attempt, grant, or evidence
