## Why

The current CLI envelope guarantees that MD Controllers and agents can detect hard failures, but many failures still do not explain the source data, derived artifact, slide field, or stage linkage that caused the failure. This leaves the MD side guessing at runtime, especially when Markdown source and Node pipeline stages alternate during deck production.

## What Changes

- Extend the CLI failure-envelope contract with optional diagnostic lineage fields that make failures actionable for MD Controllers and humans.
- Require slide/content/pipeline failures to name the relevant subject, source location, stage, derived artifact, and next runnable command whenever that information is known.
- Audit every externally observable CLI return path under `PPTMAKER_FRAMEWORK/scripts/`, including standalone executables, `ppt_flow` delegated children, usage failures, gate blocks, success JSON outputs, and help paths.
- Preserve the existing final-line JSON rule and single-envelope rule; lineage enriches the envelope without replacing stable `ok` / `code` / `message` / `hint` / `where`.
- Keep successful prose output human-friendly while ensuring `--json` success outputs remain parseable and do not mix diagnostics into stdout JSON.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `cli-surface`: failure envelopes and CLI-visible returns gain diagnostic-lineage requirements and inventory-wide audit coverage.
- `node-specification`: the CLI-to-MD protocol clarifies what evidence a CLI must return so an MD Controller can inspect, decide, and rerun without guessing.

## Impact

- Affected code: `PPTMAKER_FRAMEWORK/scripts/lib/cli_error.mjs`, all registered executable scripts in `PPTMAKER_FRAMEWORK/scripts/`, and delegated failure handling in `ppt_flow.mjs` / `unified_pipeline.mjs`.
- Affected tests: `tests/test_cli_error.mjs` plus focused CLI tests for Stage 1, Stage 2, gate failures, delegated child failures, and `--json` success output cleanliness.
- Affected docs/specs: `openspec/specs/cli-surface/spec.md`, `openspec/specs/node-specification/spec.md`, and related charter language if implementation updates the constitutional CLI protocol.
- No new runtime dependencies and no production path outside Node.js ESM.
