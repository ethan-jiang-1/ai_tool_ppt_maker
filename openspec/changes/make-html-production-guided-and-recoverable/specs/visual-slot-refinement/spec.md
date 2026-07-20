## REMOVED Requirements

### Requirement: Refinement is optional, bounded, and authorization-gated

**Reason**: The previous eligibility rule required current delivery proceed even for an explicitly
waived reversible delivery-evidence risk, making offline planning unreachable. Authorization and
chargeable generation must remain gated even when planning is continued.

**Migration**: Permit a current, auditable prerequisite waiver for offline plan creation only. Keep
the bounded slide/slot scope, exact plan hash, explicit authorization, single-use attempts, and
current delivery review requirement for promotion/completion.

## ADDED Requirements

### Requirement: Refinement planning may use a narrow prerequisite waiver

Only a marked HTML-first run with identifiable current final-slide/slot assets and a version-scoped
delivery prerequisite waiver SHALL be eligible for `image2 plan --force --reason`. The plan SHALL record
the waiver reason and failed prerequisite checks, remain deterministic, and make no provider request.
`authorize` SHALL still require an exact plan hash and explicit human decision; `generate` SHALL still
require resolvable credentials and persist/reconcile one authorized attempt at a time. Promotion and
completion SHALL require a current final delivery review, so a planning waiver cannot complete the deck.

#### Scenario: Offline plan continues after waived delivery evidence

- **WHEN** current HTML final-slide/slot identity is valid and the user supplies a bounded force reason
- **THEN** `image2 plan` creates a deterministic plan with a prerequisite waiver
- **AND** no provider, authorization, candidate, or promotion bytes are created

#### Scenario: Authorization still requires exact plan identity

- **WHEN** a user authorizes a plan whose hash or waiver-bound inputs are stale
- **THEN** authorization fails without allocating attempts
- **AND** the user is directed to create a fresh plan

#### Scenario: Promotion cannot inherit the planning waiver

- **WHEN** a candidate is accepted after a prerequisite-waived plan
- **THEN** promotion invalidates prior delivery review and requires current final review
- **AND** the waiver does not report the deck complete
