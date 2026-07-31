## MODIFIED Requirements

### Requirement: Diagnostics remain producer-owned

Every CLI hard failure SHALL use the registered producer-owned diagnostic envelope. Consumers MAY use
its bounded category and next action but SHALL NOT parse prose, copy the producer schema, or infer a
different recovery route.

For Framed render-contract and raw-review operations, the producer SHALL classify the earliest
independent root as `source_validation`, `environment`, `internal`, or the existing owning stale
artifact/evidence category, and SHALL emit one secret-safe nearest legal action per root. Earlier
source identity/schema or environment failures SHALL short-circuit dependent browser, provider, and
artifact symptoms. A provider call SHALL NOT be blamed for a failure that occurred before provider
submission.

#### Scenario: Invalid current request fails before work

- **WHEN** a command receives an invalid source, state, plan hash, render profile, or authorization scope
- **THEN** it emits one bounded producer diagnostic before provider or artifact work

#### Scenario: Text fit failure belongs to source validation

- **WHEN** Framed planning proves that a current Text Frame cannot fit the canonical render profile
- **THEN** the producer reports a bounded `source_validation` hard-stop and one source-repair action
- **AND** it does not expose browser internals, offer a force option, or classify the failure as provider-related

#### Scenario: Runtime readiness failure belongs to environment

- **WHEN** the pinned browser or required checked-in font is unavailable before layout proof
- **THEN** the producer reports a bounded `environment` hard-stop and one environment-repair action
- **AND** it does not ask the user to edit source or retry a provider

#### Scenario: Browser proof timeout belongs to environment

- **WHEN** the pinned browser cannot complete a page or finite batch proof before its owned deadline
- **THEN** the producer reports a bounded `environment` hard-stop and one runtime-repair action
- **AND** it does not attribute unknown runtime behavior to source, retry a provider, or publish an artifact

#### Scenario: Contract contradiction belongs to the framework

- **WHEN** canonical preset, compiler, safe-zone, or capture assertions contradict one another
- **THEN** the producer reports a bounded `internal` hard-stop and the framework-repair action
- **AND** no source, provider, review, or generated artifact is mutated
