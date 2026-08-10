## 1. State Execution Boundary

- [x] 1.1 (`node-specification`) Refactor `readState` so requested-run mismatch diagnostics are not merged into durable state-shaped results; add one immutable exact execution-resolution result and migrate `inspectRunProductionMode`, target-evidence contexts, and every `runVersion`/`runDir` State mutation caller to consume it before cloning or mutating state.
- [x] 1.2 (`node-specification`) Require successful execution resolution at all Page Image state-owner mutation boundaries, including progressive raw-plan, review, final-manifest, and delivery handoffs; preserve requested/active versions in the bounded hard-stop and retain write-time CAS revalidation.
- [x] 1.3 (`node-specification`) Make `writeState` validate the prepared complete candidate grammar and semantic identity before directory hints, temporary-file creation, history append, or rename; retain only documented ephemeral-field removal and reject unknown top-level fields without silently cleaning them.

## 2. Exact Recovery And CLI Routing

- [x] 2.1 (`node-specification`) Implement the State-owned BUG-066 repair predicate and operation: selected run must equal active execution, the exact three-key mismatch signature must agree with it, the stripped candidate must completely validate, and source identity, journal, and CAS fences must pass; atomically persist only the stripped candidate, append one typed history event, and make successful reruns idempotent.
- [x] 2.2 (`cli-surface`) Add `ppt_flow state <active-run> --repair-known-execution-mismatch` as a mutually exclusive, secret-safe CLI operation that delegates only to the State owner and emits the registered bounded success/failure result; reject `--json` or `--validate-state` combinations before binding/state inspection, and do not add generic repair, force, compatibility, or raw-edit options.
- [x] 2.3 (`cli-surface`) Inventory the Pure/Framed operation-map and exported APIs as read-only or side-effecting. Preflight every side-effecting Page Image entry (plan, pilot/batch, authorization, generation, review, acceptance, reconciliation, finalization, delivery, and refresh) with the shared exact execution resolver before adapter dispatch, writes, or provider calls. Translate a mismatch through the registered `FAILED`/`gate` envelope with `execution_run_version_mismatch`, requested/active reason fields, and the active-run zero-write `inspect` action rather than `unsupported-protocol/export`.

## 3. Regression Coverage

- [x] 3.1 (`node-specification`) Add State unit coverage for separated mismatch results, grammar-preserving reads, unknown-key writer rejection before temporary writes, exact active-signature repair, idempotent rerun/history behavior, and hard-stops for inactive, partial, extra-key, version-disagreed, source, journal, and CAS cases.
- [x] 3.2 (`node-specification`, `cli-surface`) Add a test-side inventory/contract that exercises every side-effecting Pure/Framed public operation with active `v2` / requested `v1` work and proves preflight before source, `_generated`, state, history, or provider writes. Add representative plan-side and delivery-side fixture journeys for both workflows, plus a successful active-run control case.
- [x] 3.3 (`cli-surface`) Add `tests_e2e/shared/state/test_mock_inactive_run_state_writes.mjs` as a zero-submission subprocess journey. Verify inactive `build` returns the bounded `FAILED`/`gate` envelope with requested/active reason fields, active-run `inspect` action, and byte-identical state; exercise successful, no-repair-needed, and rejected `state --repair-known-execution-mismatch` forms plus mixed observation flags, without provider credentials or production `deck_*` fixtures.

## 4. Verification

- [x] 4.1 Run direct focused Vitest coverage for the changed State, Pure, Framed, and CLI process suites; verify normal active delivery plus all inactive/repair negative paths.
- [x] 4.2 Run `npm test`, the documented protected core verifier for every normal Harness change, and resolve any affected-core failure.
- [x] 4.3 Run `npm run test:mock-e2e -- tests_e2e/shared/state/test_mock_inactive_run_state_writes.mjs`, the selected public-journey check required by the repository README.
- [x] 4.4 Run `openspec validate harden-inactive-run-state-writes --strict`, `openspec validate --all --strict`, and `git diff --check`; fix change-owned failures before requesting implementation review.
