# CLI Surface Specification

## Purpose

Define every registered direct Node CLI and the fixed 14-command unified entry
point. The CLI producer owns its JSON diagnostics, current Page Authority routing,
and bounded historical adoption/repair responses; Controller consumers do not copy
that schema.

## Requirements

### Requirement: Public CLI exposes only Page Authority production operations
The public CLI SHALL expose v2 Page Authority source validation, raw planning, authorization, generation, review, final delivery, Framed local refresh, notes refresh, and structural versioning. It SHALL NOT expose another-protocol observation, adoption, migration, production commands, flags, or approval gates.

#### Scenario: Help has no other-protocol choice
- **WHEN** a user requests public CLI help
- **THEN** every production operation is v2 Page Authority-owned
- **AND** no historical, adoption, compatibility, or migration route is listed

### Requirement: --only accepts friendly slide selectors

Commands accepting `--only` SHALL resolve friendly selectors through the shared
stable-identity owner and reject ambiguous or unknown values before work begins.

#### Scenario: Spoken selector resolves

- **WHEN** a unique spoken stable ID identifies one current slide
- **THEN** the command resolves that slide without inferring another ID

### Requirement: CLI observation does not mutate or invoke providers

Plain status and state observation SHALL consume the read-only inspection path.
They SHALL not write source, state, history, journals, metadata, receipts, or
generated artifacts, and shall not invoke a provider.

#### Scenario: Observation sees a repairable fact

- **WHEN** status observes a repairable current fact
- **THEN** it returns the owner-issued action without mutation

### Requirement: CLI routing does not duplicate workflow evaluation

Shared command routing SHALL consume the state/workflow owner result rather than
reconstructing mode, gate, authorization, recovery, or completion rules from CLI
arguments, rendered output, or metadata.

#### Scenario: CLI consumes one inspection action

- **WHEN** a current command needs its next action
- **THEN** it uses the owner-issued inspection result
- **AND** it does not synthesize a parallel route

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

### Requirement: Non-v2 CLI requests fail before execution
When a command receives a non-v2 source/state pair, the CLI producer SHALL emit the one bounded unsupported-protocol diagnostic before provider initialization, generated-artifact reads, review publication, or state mutation.

#### Scenario: Non-v2 build is fenced
- **WHEN** a non-v2 run requests build, refresh, review, or raw generation
- **THEN** the CLI returns only the unsupported-protocol next action
- **AND** it does not invoke a decoder, migration operation, or provider
