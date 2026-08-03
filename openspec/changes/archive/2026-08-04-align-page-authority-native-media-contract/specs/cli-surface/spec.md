## MODIFIED Requirements

### Requirement: Invalid provider media uses the bounded progressive outcome surface

When `ppt_flow image2 generate` receives a definite invalid Page Authority
provider-media result, the CLI SHALL return the existing direct progressive
`known_failure` outcome for the exact item. That outcome SHALL include only
bounded expected/actual media facts from the selected native provider-response
contract, derived progress, and the existing next legal action. It SHALL not
emit a raw response, raw prompt, stack trace, new retry flag, force option, or
alternate provider route. The historically proven HTTP `2000x1125` request
parameter SHALL NOT be reported as evidence that returned PNG bytes must have
those dimensions.

#### Scenario: Wrong-size media returns a bounded known-failure outcome

- **WHEN** an authorized generate operation receives a PNG whose dimensions
  differ from the exact native `2048x1136` response contract
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
