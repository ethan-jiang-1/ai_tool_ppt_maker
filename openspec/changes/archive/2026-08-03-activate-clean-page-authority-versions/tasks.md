## 1. State-owned activation

- [x] 1.1 Add a bounded state API that activates a clean selected-workflow Page Authority target draft while preserving source records and rejecting target lineage conflicts.
- [x] 1.2 Cover the activation API's clean success and fail-closed paths with focused state tests.
- [x] 1.3 Allow an explicitly selected inactive exact Page Authority source when its durable source marker and production mode agree, while retaining active-execution identity hard-stops.
- [x] 1.4 Add focused inactive-source and active-mismatch state regression coverage.

## 2. Public command integration

- [x] 2.1 Invoke the state API only after `ppt_flow new-version` creates a clean current Page Authority target, and report success only after activation completes.
- [x] 2.2 Add a public CLI regression proving validation and provider-free pre-raw routing work for the new target without inherited artifacts.
- [x] 2.3 Route inactive exact Page Authority sources through the same state-owned activation path in the public command.

## 3. Verification

- [x] 3.1 Run the focused state/CLI tests, strict OpenSpec validation, and the full test suite; repair any regression before acceptance work resumes.
