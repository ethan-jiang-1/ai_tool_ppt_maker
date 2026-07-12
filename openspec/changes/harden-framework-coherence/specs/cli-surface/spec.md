## ADDED Requirements

### Requirement: Supported standalone CLIs obey the failure envelope constitution

Every documented standalone executable under `PPTMAKER_FRAMEWORK/scripts/` SHALL, on hard failure, exit non-zero and write exactly one machine-parseable failure envelope as the final non-empty line of its own stderr. The envelope SHALL contain `ok: false`, stable `code`, non-empty `message`, non-empty `hint`, and non-empty `where`. Human-readable diagnostics MAY precede the envelope. Library imports and successful/help paths SHALL NOT emit failure envelopes.

#### Scenario: bundle layout usage failure is machine-readable

- **WHEN** `bundle_layout.mjs` is invoked with `--structure-only` but without `--check`
- **THEN** it exits non-zero
- **AND** the final non-empty stderr line is a valid failure envelope with `code: USAGE`

#### Scenario: standalone stage usage failure is machine-readable

- **WHEN** a standalone Stage script is invoked without required arguments
- **THEN** it exits non-zero
- **AND** the final non-empty stderr line is a valid failure envelope naming that script in `where`

#### Scenario: imported module does not terminate the process

- **WHEN** a stage module is imported by a test or orchestrator
- **THEN** the shared CLI wrapper is not executed
- **AND** the module remains usable as a library

### Requirement: CLI envelope tests cover the registered executable inventory

The test suite SHALL maintain a registered inventory of supported standalone CLIs and SHALL probe at least one deterministic failure path for each executable. A new executable SHALL fail the inventory test until its failure-envelope behavior is covered.

#### Scenario: New standalone script lacks envelope coverage

- **WHEN** a new documented executable is added under `scripts/` without a registered failure probe
- **THEN** the CLI contract test fails and names the uncovered script
