## ADDED Requirements

### Requirement: Page Image response-shape diagnostics remain producer-owned and secret-safe

When the existing Page Image `known_failure` result projects a provider
response fact whose classification is `invalid_json`, the CLI producer SHALL
include `response_shape` only when it is one of `empty`, `html_like`, or
`other_non_json`. The projection SHALL ignore absent, malformed, or
unrecognized response-shape values and SHALL retain compatibility with older
known-failure records that have no such field. Consumers SHALL treat the
producer-owned value as diagnostic information only and SHALL NOT use it as
authorization, retry, routing, state, or recovery authority.

The CLI success output and failure diagnostic SHALL continue to exclude
provider body text, headers, lengths, digests, task identifiers, prompts,
credentials, and provider identity. The existing next action and outcome
remain the sole owner-issued control result.

#### Scenario: A recognized Page Image shape reaches the existing projection

- **WHEN** a Page Image item terminalizes with the existing `invalid_json`
  known failure and a recognized response shape
- **THEN** its existing `provider_failure` projection includes only the
  classification and that recognized `response_shape`
- **AND** its outcome, progress, and owner-issued next action are unchanged

#### Scenario: Extra provider response fields are never forwarded

- **WHEN** a Page Image known-failure error contains a recognized response
  shape together with arbitrary provider-response fields
- **THEN** the CLI projection keeps only its closed diagnostic fields
- **AND** it does not emit the arbitrary fields or derive a different action

#### Scenario: Older and non-JSON records retain their current projection

- **WHEN** a Page Image known-failure record has no response shape or has a
  classification other than `invalid_json`
- **THEN** the CLI retains its existing bounded projection
- **AND** it does not synthesize a shape or change the existing control path
