## MODIFIED Requirements

### Requirement: New slide IDs use the current spoken mnemonic identity

The Agent or MD Controller SHALL name each newly authored slide from its
durable narrative role as exactly two semantic BlockCase blocks under the
existing mnemonic syntax, uniqueness, spoken-key, reserved-word, and
near-confusion rules. Newly initialized sources SHALL declare the current
unversioned `identity.scheme: mnemonic`; its presence means every current ID in
the file has mnemonic syntax. The identity scheme is never a production
workflow, migration, or Controller-routing signal.

#### Scenario: A new source has current mnemonic identity

- **WHEN** a new source is initialized with mnemonic slide IDs
- **THEN** it declares `identity.scheme: mnemonic` and validates the existing
  two-block rules
- **AND** it does not write a version-suffixed identity marker

#### Scenario: New ID is mnemonic and Agent-owned

- **WHEN** an insertion has no valid mnemonic ID
- **THEN** deterministic validation retains the existing request for one Agent-owned mnemonic
- **AND** it does not synthesize a historical identity form

#### Scenario: An undeclared ID is rejected before receipt creation

- **WHEN** a current source contains an ID outside the mnemonic syntax
- **THEN** source validation rejects it before creating a receipt
- **AND** it does not retain, rewrite, or route the ID through another identity scheme
