## ADDED Requirements

### Requirement: Current state contains one Page Authority evidence graph
Current state SHALL record Page Authority source epochs, raw authorization/review, final delivery, and
bounded legacy observation/adoption facts only. It SHALL NOT validate or publish HTML review,
Header-Lock, whole-page, or visual-slot completion state.

#### Scenario: A current state is inspected
- **WHEN** state is read for a current Page Authority run
- **THEN** its next action derives from Page Authority evidence without a retired gate or mode branch

### Requirement: Legacy observations remain non-authoritative
The state owner SHALL retain the read-only legacy observer and adoption transaction. Neither outcome
shall revive a legacy production adapter, evidence record, or completion state.

#### Scenario: A recognized historical pair is read
- **WHEN** state/inspection encounters an intact legacy source/state pair
- **THEN** it returns only the adoption action and makes no production-state mutation

