## REMOVED Requirements

### Requirement: Gates are enforced at node boundaries

**Reason**: The previous wording made every incomplete quality gate an absolute stop and did not
describe the human-confirmed continuation path required by the framework charter.

**Migration**: Node completion still requires its exit conditions. Human quality evidence may be
explicitly waived through the owning CLI/state operation; identity, integrity, authorization, and
recoverability conditions remain non-overridable.

## ADDED Requirements

### Requirement: Controllers guide quality gates and preserve explicit user choice

At a gate boundary, the MD Controller SHALL show what is missing/stale, the recommended repair command,
and the explicit continuation command when the risk is reversible. It SHALL consume producer-owned CLI
diagnostics rather than parse prose or edit state. A continuation SHALL persist a bounded human reason
and remain visibly `waived`/incomplete; it SHALL not infer approval from successful rendering. Hard-stop
conditions SHALL explain the protected invariant and the safe recovery route.

#### Scenario: Content evidence is stale

- **WHEN** a build observes stale content or visual evidence with valid source and version identity
- **THEN** the Controller presents the recommended preview/approve route and a reasoned force route
- **AND** it does not silently choose either path for the user

#### Scenario: User chooses the recommended repair

- **WHEN** the user follows the displayed preview and approval action
- **THEN** the Controller rechecks the exact current plan and continues when approved
- **AND** no conversation-only decision is treated as state evidence

#### Scenario: User chooses explicit continuation

- **WHEN** the user supplies the declared waiver/force reason
- **THEN** the Controller invokes the owning public CLI operation
- **AND** status reports waived decision and incomplete evidence separately from approved readiness

#### Scenario: Hard-stop transaction conflict

- **WHEN** an active journal, reset fence, mismatched plan identity, or corrupted state is reported
- **THEN** the Controller explains the protected invariant and recovery action
- **AND** does not offer a force path that could overwrite or guess ownership
