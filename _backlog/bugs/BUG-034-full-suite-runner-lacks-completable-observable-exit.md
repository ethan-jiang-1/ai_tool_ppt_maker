# BUG-034: Full test suite lacks a completable, observable exit contract

> Severity: P1 | Found: 2026-07-23 | Status: Active

## Symptom

During framework-maintenance verification, `npm test -- --reporter=dot --silent` starts but its foreground execution session ends after partial dot output, without Vitest's final summary or a usable exit result. Redirected and detached attempts likewise leave a partial log without a durable exit-code file. This prevents an Agent from distinguishing a pass, a failure, a timeout, and a runner teardown.

The E2E command completes and reports `10 passed / 45 passed`; the default unit/integration command is the affected surface. No live Vitest, `npm test`, or `ppt_flow` child process remains after the interrupted attempts.

## Reproduction

1. Run `npm test -- --reporter=dot --silent` from the repository root in the maintenance execution environment.
2. Observe partial progress dots with no Vitest summary/exit result.
3. Run the same command redirected or detached with a persisted exit-code file.
4. Observe a partial log with neither a final summary nor the expected exit-code file.

## Current Evidence

- `vitest.config.mjs` already limits the default suite to `minWorkers: 1`, `maxWorkers: 2` because Canvas/Chromium/PPTX work competes for resources.
- The affected run has no surviving `vitest`, `npm test`, or `ppt_flow` process after teardown.
- Focused suites and full E2E complete, so the immediate missing contract is full unit/integration runner completion/observability rather than a known Image Production functional failure.

## Hypotheses To Test

1. The maintenance executor terminates a foreground process at a short session boundary before Vitest can flush/report completion.
2. A unit/integration test starts a detached or inherited-handle child process that prevents Vitest from reaching its completion phase under the default worker pool.
3. `maxWorkers: 2` is still too high for a particular Canvas/PPTX/CLI combination, producing a runner-level stall rather than a normal test timeout.

## Required Fix Shape

Provide a deterministic maintenance-facing full-suite entry that:

- runs to a durable pass/fail exit code;
- writes a bounded final summary even on timeout or interrupted child process;
- identifies the last running test file/child process when it cannot finish;
- retains a focused fast path and does not weaken existing test assertions.

## Related Work

This was found while applying `realign-image-production-and-framework-governance`. It blocks only that change's final full-suite verification; focused adapter/state/CLI coverage and full E2E remain independently recorded.
