## 1. Card-Scoped Display References

- [x] 1.1 [playbook-execution] Add the pure typed display-reference helper with the fixed plan (`p`), batch (`b`), evidence (`e`), review (`r`), manifest (`m`), and delivery (`d`) vocabulary; validate complete lowercase digests, deduplicate equal pairs, and emit `<prefix>-<eight lowercase hex characters>` with a one-based lexical collision rank only for same-type eight-character collisions.
- [x] 1.2 [tests] Add focused identity tests for valid and invalid input, fixed types and exact reference grammar, ordinary references, duplicate pairs, input-order invariance, cross-type separation, same-type collisions with one-based lexical ranks, and a near-complete shared-prefix pair that never yields a complete digest.

## 2. Task-Card Presentation

- [x] 2.1 [playbook-execution] At the progressive task-card renderer seam, classify and collect `references[].sha256` plus every present `human_handoffs.*.reference_sha256` once, create the card-scoped index, and render the resulting typed references without changing the full-fact projection payload or machine return values.
- [x] 2.2 [playbook-execution] Remove the projection digest from the human-facing card comment and replace each bounded, case-insensitive 64-hexadecimal handoff-note token with `[digest redacted]` only during card rendering; leave persisted Controller handoffs, refresh eligibility, atomic write behavior, and non-authority semantics unchanged.
- [x] 2.3 [playbook-execution] Update the progressive Controller playbook guidance to describe typed card-scoped references as presentation-only and direct readers to existing owner/CLI surfaces for complete-digest operations.

## 3. Regression Coverage And Validation

- [x] 3.1 [playbook-execution/run-bundle-layout] Extend task-projection tests to observe short structured references and every present typed-handoff reference, exact deterministic collision ranks, absence of complete digests across the entire card text, note-only redaction, unchanged persisted notes/full payload, and unchanged no-authority-write refresh behavior.
- [x] 3.2 [cli-surface regression] Run and, where required, extend normal state/direct exact-hash CLI coverage to prove direct JSON and paid `image2` selectors retain complete digests while card refresh stays provider-free and does not mutate owner artifacts.
- [x] 3.3 [tests_e2e regression] Run the existing mock progressive workflow journey and relevant raw-owner regressions to prove card presentation cannot change lifecycle routing, provider submission, or idempotency behavior.
- [x] 3.4 Run focused tests, the full `npm test` suite, `openspec validate short-page-production-references --strict`, and `git diff --check`; record any intentionally skipped E2E expansion with its evidence before implementation is marked complete.
