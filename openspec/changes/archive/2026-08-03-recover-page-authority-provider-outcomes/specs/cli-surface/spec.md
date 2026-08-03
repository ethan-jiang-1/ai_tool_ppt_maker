## ADDED Requirements

### Requirement: Page Authority received-response failures use a secret-safe known-failure outcome

When `ppt_flow image2 generate` receives a definite unusable Page Authority
provider response, the CLI SHALL return the existing direct progressive
`known_failure` outcome for the exact item. The outcome MAY include only a
fixed response-failure classification and a numeric HTTP status when one was
received, together with derived progress and the raw-owner's next legal action.
It SHALL not include a provider body, response headers, prompt prose,
credentials, authorization headers, environment values, image data URLs, raw
bytes, a stack trace, retry flag, force option, or alternate provider route.

#### Scenario: HTTP error is safe terminal output

- **WHEN** an authorized generate operation receives a non-success HTTP
  response from the Page Authority provider
- **THEN** the CLI reports the exact item as `known_failure` with only a fixed
  classification, numeric status, derived progress, and the owner-issued next
  action
- **AND** it emits no provider response content or old-grant retry route

#### Scenario: Transport uncertainty remains a diagnostic hard-stop

- **WHEN** a generate operation has no provable response outcome
- **THEN** the CLI retains the producer-owned reconciliation diagnostic and
  exact reconciliation action
- **AND** it does not relabel the outcome as known failure or emit transport
  internals

### Requirement: Incomplete Pilot review points to the exact successor gate

When `ppt_flow image2 pilot-review` encounters a terminal partial Pilot with
missing current review coverage and residual paid debt, it SHALL emit the
producer-owned bounded diagnostic whose only next owner action is current
successor Pilot planning. The response SHALL preserve exact run and plan scope
without exposing provider results or manufacturing a batch/grant. The successor
Pilot remains subject to the existing human cost confirmation and exact
authorization path.

#### Scenario: Pilot-review cannot mask missing raw coverage

- **WHEN** a terminal partial Pilot lacks current materialization for one or
  more selected review sample items
- **THEN** the CLI returns the owner-issued successor Pilot planning action
  rather than generic review readiness
- **AND** it creates no Pilot evidence, decision, final evidence, or provider
  submission
