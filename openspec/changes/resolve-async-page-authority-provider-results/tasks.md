## 1. Async Provider Result Resolution

- [x] 1.1 Extend the selected Page Authority provider-result adapter to detect
  a stable async task identifier while preserving the synchronous inline-PNG
  path. Capability: `image-generation`.
- [x] 1.2 Implement bounded same-credential task polling and normalize the
  verified completed nested inline-byte result into the existing exact PNG
  validation path. Do not add durable task state, a CLI flag, a background
  worker, a retry path, or provider failover.
- [x] 1.3 Map terminal task failures and poll HTTP failures to existing
  secret-safe `known_failure` facts; map poll interruption and timeout to the
  existing unresolved/unknown lifecycle without exposing task or response data.

## 2. Regression Coverage

- [x] 2.1 Add focused adapter tests for nested task-ID submit, pending-to-
  completed async PNG success, and unchanged synchronous inline-PNG success.
  Capability: `image-generation`.
- [x] 2.2 Add focused negative tests for terminal async failure, missing or
  invalid completed media, poll HTTP failure, and interrupted/timeout polling;
  assert the progressive owner preserves the correct known/unknown outcome and
  does not create a replacement authorization or wrong-owner state write.
- [x] 2.3 Exercise the direct CLI surface with async fixtures and assert it
  keeps prompts, credentials, task IDs, response bodies, headers, image bytes,
  and data URLs out of normal and failure output.

## 3. Verification And Recovery

- [x] 3.1 Run the focused Page Authority and CLI suites, then `npm test`,
  `openspec validate resolve-async-page-authority-provider-results --strict`,
  and `git diff --check`.
- [ ] 3.2 After framework verification, resume the user-specified v7 only
  through its current owner-issued successor Pilot action; do not alter
  `_generated/`, state, receipts, grants, or past attempts by hand.
