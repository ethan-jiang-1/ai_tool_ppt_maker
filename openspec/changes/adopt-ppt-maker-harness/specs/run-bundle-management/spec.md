## ADDED Requirements

### Requirement: Init emits only a v2 Harness-bound locator

Fresh Run Bundle initialization SHALL verify its creating local Harness root
and write only a `pptmaker-run-bundle-v2` locator with exactly `schema`,
`deck_root`, `harness_root`, and `harness_relation`. It SHALL not write
`framework_root`, `framework_relation`, `harness_id`, a version pin, or a
portable binding record.

#### Scenario: A fresh Bundle is initialized from the Harness

- **WHEN** a user initializes a new Run Bundle through the canonical Harness
  entrypoint
- **THEN** the Bundle receives one verified v2 local-Harness locator
- **AND** no legacy locator or compatibility data is created

### Requirement: Legacy locator input hard-stops without mutation

Per `openspec/policies/human-centered-gates.md`, a missing, malformed,
conflicting, v1, or Framework-named locator is a `hard-stop` protecting the
exact Deck-to-Harness identity invariant. Per
`openspec/policies/agent-assistance-and-control.md`, its one direct source of
record is the locator itself and the diagnostic SHALL return the nearest safe
action: explicitly reconstruct a new current Bundle rather than converting the
old one. The check SHALL not write a locator, state, receipt, generated
artifact, migration record, fallback root, or compatibility projection.

#### Scenario: A v1 locator is checked

- **WHEN** validation receives a locator using `pptmaker-run-bundle-v1` or
  `framework_root` / `framework_relation`
- **THEN** it returns the bounded unsupported-binding hard-stop before
  production, provider, generated-artifact, or state work
- **AND** it offers neither waiver nor automatic migration
