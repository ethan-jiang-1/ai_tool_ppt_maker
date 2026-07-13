## ADDED Requirements

### Requirement: Failure envelopes include diagnostic lineage when context is known

Any CLI hard failure that has structured knowledge of the failing source, subject, stage, artifact, or recovery action SHALL include an optional `diagnostic` object in the final failure envelope. The required top-level envelope fields (`ok`, `code`, `message`, `hint`, `where`) SHALL remain unchanged and SHALL remain sufficient for legacy consumers. The `diagnostic` object SHALL be JSON-serializable, bounded, secret-safe, and MAY contain `subject`, `source`, `stage`, `artifacts`, `lineage`, and `md_next` fields. A CLI SHALL omit unknown diagnostic properties rather than guess ambiguous slide IDs, line numbers, paths, or commands.

For slide-related failures, when the script knows the slide id and source field, `diagnostic.subject` SHALL include at least `{ "kind": "slide", "id": <slide-id> }` and SHOULD include `field`. When a failure originates from an editable source file, `diagnostic.source.path` SHALL point to that source rather than only to a derived artifact. When a failure is caused by a derived artifact, `diagnostic.lineage` SHALL connect the derived artifact back to the editable source whenever the linkage is known.

#### Scenario: Stage 1 reports invalid slide source

- **WHEN** Stage 1 rejects a known slide field in `slide-specifications.md`
- **THEN** the final stderr envelope includes the existing top-level failure fields
- **AND** `diagnostic.subject.kind` is `slide`
- **AND** `diagnostic.subject.id` names the slide when known
- **AND** `diagnostic.source.path` points to `slide-specifications.md`
- **AND** `diagnostic.md_next` tells the MD Controller what to inspect and what command to rerun

#### Scenario: Unknown context is not fabricated

- **WHEN** a CLI fails before it can identify a slide, field, line, or source path
- **THEN** the final stderr envelope remains valid with the required top-level fields
- **AND** it omits unknown diagnostic properties rather than inventing placeholder lineage

#### Scenario: Diagnostics are secret-safe

- **WHEN** an image API request fails after credentials have been loaded
- **THEN** the failure envelope MAY include vendor role, endpoint host, stage, slide id, and artifact paths
- **AND** it SHALL NOT include API key values, raw `.env` contents, or unbounded external response bodies

### Requirement: Delegated failures preserve child diagnostics through the parent envelope

When `ppt_flow.mjs` or another CLI wrapper delegates to a compliant child CLI that exits with a failure envelope containing `diagnostic`, the wrapper SHALL continue to expose exactly one final parent envelope and SHALL preserve safe child diagnostic context in that parent envelope. The wrapper SHALL NOT leak the child's final JSON line as a second visible envelope. Parent-level `where` and `code` mapping SHALL remain authoritative, while child `message`, `hint`, and `diagnostic` SHALL remain available either directly or under a child diagnostic field.

#### Scenario: Child stage returns lineage to ppt_flow

- **WHEN** a delegated Stage script exits non-zero with a final envelope containing slide lineage
- **THEN** `ppt_flow` consumes the child JSON line
- **AND** emits exactly one final parent envelope
- **AND** the parent envelope preserves the child diagnostic subject/source/lineage that lets MD inspect the original source

#### Scenario: Prose-only child still gets fallback diagnostics

- **WHEN** a delegated child exits non-zero without a valid final envelope
- **THEN** the parent relays child prose diagnostics
- **AND** emits one fallback parent envelope
- **AND** the fallback diagnostic identifies the delegated command and bounded final child diagnostic text when available

### Requirement: CLI return audit covers every externally observable return category

The test suite SHALL audit every registered standalone executable under `PPTMAKER_FRAMEWORK/scripts/` for externally observable CLI return behavior. The audit SHALL cover, at minimum: help output, deterministic usage failure, one contextual hard failure where the executable has known source/subject context, delegated child failure handling where applicable, success prose output, and documented `--json` success output. A new executable or documented JSON-returning command SHALL fail the audit until its return behavior is registered and tested.

For commands that intentionally return machine JSON on stdout, stdout SHALL contain parseable JSON without human prose preamble or trailer. Human diagnostics for those commands SHALL go to stderr or be represented as JSON fields. A status-style command that exits non-zero to report a not-ready condition via stdout JSON SHALL NOT be treated as a hard failure envelope unless the command itself failed.

#### Scenario: Registered executable has return audit coverage

- **WHEN** the executable inventory is compared with return-audit cases
- **THEN** every registered executable has help and deterministic failure coverage
- **AND** every executable with a known contextual failure path has a diagnostic-lineage assertion
- **AND** any uncovered registered executable is named by the failing test

#### Scenario: JSON success output is clean

- **WHEN** a documented CLI command is invoked with `--json` and completes its command semantics
- **THEN** stdout is parseable JSON
- **AND** stdout contains no human prose before or after the JSON value
- **AND** stderr does not end with an `ok:false` failure envelope

#### Scenario: Human success output does not mimic failure envelope

- **WHEN** a CLI command completes successfully in prose mode
- **THEN** it exits zero
- **AND** it does not emit a final stderr line that parses as an `ok:false` failure envelope
