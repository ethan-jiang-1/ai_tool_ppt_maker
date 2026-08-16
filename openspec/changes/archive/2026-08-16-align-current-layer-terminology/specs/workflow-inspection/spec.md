# Workflow Inspection Specification (delta)

## MODIFIED Requirements

### Requirement: Inspection projects the direct compiled-input lifecycle

For an exact current run, Inspection SHALL obtain the selected adapter's direct
facts for Style Master readiness, compiled provider-input digest, protected
composition and local profile where applicable, plan/authorization/attempt
status, Pilot scope, Complete Page Review, and delivery. Its primary action
SHALL name the earliest protected invariant or legal current step. A Framed
provider-free overlay refresh is actionable only after direct proof that
compiled provider input, protected composition, raw contract, and local profile
are unchanged; a header literal change therefore projects raw rebuild.

The review projection SHALL be one Complete Page Review action: Framed shows
the raw provider page beside its production-equivalent header composite, while
Pure shows its complete provider page. Inspection SHALL not project a second
composite approval, synthesize a Pilot, or infer acceptance from an artifact.

#### Scenario: Framed header input drift is raw work

- **WHEN** a Framed title changes and the adapter's compiled-input digest
  changes
- **THEN** inspection returns raw rebuild as the nearest action
- **AND** it does not select provider-free overlay refresh

#### Scenario: Complete Framed page review has one action

- **WHEN** all current Framed provider-page and composite evidence is ready
- **THEN** inspection returns the one Complete Page Review `proceed` or
  `repair` action
- **AND** it does not expose an additional local-composite approval
