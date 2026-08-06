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

### Requirement: Authority-carrying run operations require a current Harness binding

Per `openspec/policies/human-centered-gates.md`, a missing, malformed,
conflicting, v1, or Framework-named locator is a `hard-stop` protecting the
exact Deck-to-Harness identity invariant. Per
`openspec/policies/agent-assistance-and-control.md`, its one direct source of
record is the locator itself and the diagnostic SHALL return the nearest safe
action: explicitly reconstruct a new current Bundle rather than converting the
old one. Every run-scoped operation that reads or mutates source, state, or
production authority SHALL verify the card at its derived Deck root through the
shared v2 locator evaluator before its owner logic runs. It SHALL not write a
locator, state, receipt, generated artifact, migration record, fallback root,
or compatibility projection.

`bundle_layout --check --structure-only` SHALL remain a layout-only,
non-authoritative observation. It MAY report an old or locatorless tree, but it
SHALL not select a run, read state, inspect production readiness, authorize
work, or write.

#### Scenario: A v1 Bundle is used by a run operation

- **WHEN** a run-scoped command derives a Deck root whose card uses
  `pptmaker-run-bundle-v1` or `framework_root` / `framework_relation`
- **THEN** it returns the bounded unsupported-binding hard-stop before
  production, provider, generated-artifact, or state work
- **AND** it offers neither waiver nor automatic migration

#### Scenario: A structure-only check observes an old tree

- **WHEN** `bundle_layout --check --structure-only` is given a locatorless or
  v1 Bundle
- **THEN** it may report only the Bundle's filesystem layout without mutation
- **AND** it does not establish a current binding or continuation authority
