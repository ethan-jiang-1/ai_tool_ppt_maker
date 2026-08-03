## ADDED Requirements

### Requirement: Page Authority plan output exposes a safe request-inspection reference

On a successful `ppt_flow image2 plan <run-dir>` operation, the CLI producer
SHALL include a `provider_request_inspection` reference for the exact current
plan. The reference SHALL contain only the run-relative inspection path, its
digest, and its matching plan hash. It SHALL be sufficient for a local operator
to intentionally open the provider-free inspection artifact, but it SHALL not
be accepted as a CLI selector, authorization assertion, or replacement plan
identity.

Normal success output, stderr, and every failure envelope SHALL exclude raw
prompt prose, credentials, authorization headers, environment values, image
data URLs, and provider response bodies. The producer retains ownership of
failure classification and the one nearest legal action; consumers SHALL not
derive a prompt-inspection or provider-retry route from prose.

#### Scenario: Plan output references the current local inspection artifact

- **WHEN** `image2 plan` successfully creates a current Page Authority plan
- **THEN** its JSON output includes a `provider_request_inspection` object with
  the run-relative path, inspection digest, and the returned plan hash
- **AND** the JSON output does not contain the prompt text itself

#### Scenario: Diagnostics remain secret-safe with an inspection artifact present

- **WHEN** a later Page Authority command fails after an inspection projection
  exists
- **THEN** its producer-owned diagnostic returns only bounded identity and next
  action facts
- **AND** it does not print raw prompt prose, credential values, image data
  URLs, or provider response content

### Requirement: Invalid provider media uses the bounded progressive outcome surface

When `ppt_flow image2 generate` receives a definite invalid Page Authority
provider-media result, the CLI SHALL return the existing direct progressive
`known_failure` outcome for the exact item. That outcome SHALL include only
bounded expected/actual media facts, derived progress, and the existing next
legal action. It SHALL not emit a raw response, raw prompt, stack trace, new
retry flag, force option, or alternate provider route.

#### Scenario: Wrong-size media returns a bounded known-failure outcome

- **WHEN** an authorized generate operation receives a PNG whose dimensions
  differ from `2000x1125`
- **THEN** the CLI reports the item as `known_failure` with expected and actual
  dimensions, derived progress, and the owner-issued next action
- **AND** it does not report raw bytes as materialized or offer a retry under
  the old grant

#### Scenario: Malformed media does not leak provider content

- **WHEN** an authorized generate operation receives an empty or malformed
  provider-media result
- **THEN** the CLI reports only the bounded invalid-media classification and
  the existing recovery action
- **AND** neither stdout nor stderr contains provider response content, prompt
  prose, credentials, or a stack trace
