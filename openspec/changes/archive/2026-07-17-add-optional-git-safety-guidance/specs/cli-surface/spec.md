## ADDED Requirements

### Requirement: Optional Git observation preserves the direct environment CLI contract

The direct `env-check.mjs` CLI SHALL append the advisory `git` record to the already-generic `env-check-v1` `checks[]` report. This is a producer-boundary change because it adds a child-process observation and public check record, but it SHALL NOT add a top-level JSON field, change the `env-check-v1` schema validator, alter READY/exit/failure-envelope semantics, or expose child output. The record SHALL use the existing `check`, `status`, `detail`, and `fix` fields only; it SHALL omit the optional `foundation` field so an advisory warning cannot affect foundation readiness.

`ppt_flow doctor` SHALL remain a text delegation of `env-check`; this change SHALL NOT add `ppt_flow doctor --json`, document that flag, or create a second JSON report route.

#### Scenario: Generic report schema accepts the advisory record

- **WHEN** direct `env-check --json` reports an advisory `git` check
- **THEN** the report validates as the existing `env-check-v1` schema
- **AND** its `git` record omits `foundation` and the report has no new top-level JSON field or Git-specific envelope schema

#### Scenario: Delegated doctor keeps its flag boundary

- **WHEN** a user runs `ppt_flow doctor --help`
- **THEN** the help does not list `--json`
- **AND** passing `--json` remains unsupported rather than silently creating a JSON delegation path
