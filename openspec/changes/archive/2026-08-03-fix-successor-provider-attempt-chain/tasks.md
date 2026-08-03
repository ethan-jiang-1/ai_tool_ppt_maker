## 1. Regression Reproduction

- [x] 1.1 Add a deterministic raw-owner regression for a terminal partial
  Pilot, successor generation, and successor transport interruption; make it
  assert the exact current `reconcile_progressive_raw_attempt` action rather
  than a rebuild diagnostic.
- [x] 1.2 Extend the workflow-inspection seam only as needed to prove the same
  direct owner action is projected without provider calls or authority writes.

## 2. Direct Attempt Recovery

- [x] 2.1 Repair successor attempt identity/chain evaluation so valid
  batch-local `claimed -> submitted` records remain attributable while all
  existing plan, batch, grant, provenance, and unresolved hard-stops remain
  strict.
- [x] 2.2 Verify the corrected owner returns only reconciliation for a
  successor transport interruption and does not reopen a predecessor grant,
  create evidence, or submit a second item.

## 3. Verification And Closeout

- [x] 3.1 Run the focused raw-owner/workflow tests, repository verification,
  strict OpenSpec validation, and diff checks; then re-inspect the specified
  v7 run through the owner interface without editing its records.
- [x] 3.2 Archive this implementation-only recovery change after validation
  passes, then resume v7 only from its owner-issued current action.
