# CLI Surface Specification (delta)

## ADDED Requirements

### Requirement: Run-bound readiness and live probing are separate commands

The direct CLI SHALL expose exact-run readiness and live provider probing
through separate `preflight` and `probe` commands, distinct from the offline
`doctor`. `preflight <run-dir> --operation <op>` SHALL evaluate exact-run
readiness with zero network and zero write for one declared operation
(`framed-local-refresh`, `raw-generation`, or `full-build`). `probe <run-dir>
[--smoke|--vendors]` SHALL run a live connectivity probe bound to the exact run.

`doctor` SHALL remain the global offline check with no `--run-dir`,
`--operation`, `--smoke`, or `--probe-vendors` flags. A retired
`doctor --run-dir ...` form SHALL return an owner-issued exact replacement
(`preflight` or `probe`), not unknown-command prose.

#### Scenario: A retired doctor form names its replacement

- **WHEN** a caller invokes `doctor --run-dir <run-dir> --operation <op>` or
  `doctor --run-dir <run-dir> --smoke|--probe-vendors`
- **THEN** it returns the exact `preflight <run-dir> --operation <op>` or
  `probe <run-dir> [--smoke|--vendors]` invocation
- **AND** it does not run a partial or ambiguous check

#### Scenario: Preflight does not become a second readiness authority

- **WHEN** `preflight` evaluates an exact run's operation readiness
- **THEN** it reuses the existing identity/readiness evaluator with zero
  network and zero write
- **AND** it does not invent a new readiness or authorization surface
