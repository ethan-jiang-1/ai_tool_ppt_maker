## MODIFIED Requirements

### Requirement: Invalid provider media uses the bounded progressive outcome surface

When `ppt_flow image2 generate` receives a definite invalid Page Authority
provider-media result, the CLI SHALL return the existing direct progressive
`known_failure` outcome for the exact item. That outcome SHALL include only
the bounded invalid-media classification, derived progress, and the existing
next legal action. A valid CRC-checked PNG with positive native dimensions
SHALL remain on the existing success surface regardless of whether its
dimensions match the historical `2048x1136` result. The CLI SHALL not emit a
raw response, raw prompt, stack trace, new retry flag, force option, or
alternate provider route. The historically proven HTTP `2000x1125` request
parameter SHALL NOT be reported as evidence that returned PNG bytes must have
those dimensions.

#### Scenario: Non-default native media follows the success surface

- **WHEN** an authorized generate operation receives a CRC-valid PNG with positive dimensions that differ from `2048x1136`
- **THEN** the CLI reports the existing successful progressive outcome with the item's normal derived progress
- **AND** it does not emit a wrong-size `known_failure` or offer another operation for the already accepted media

#### Scenario: Malformed media does not leak provider content

- **WHEN** an authorized generate operation receives an empty, malformed, or CRC-invalid provider-media result
- **THEN** the CLI reports only the bounded invalid-media classification and the existing recovery action
- **AND** neither stdout nor stderr contains provider response content, prompt
  prose, credentials, or a stack trace
