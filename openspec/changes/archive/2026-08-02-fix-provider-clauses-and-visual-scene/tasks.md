## 1. Lock The New Source And Contract Behavior With Focused Tests

- [x] 1.1 Add source-parser unit tests proving `VISUAL SCENE` parses as an
  optional inline field, defaults to `null` when absent, and errors on empty or
  duplicate occurrences.
- [x] 1.2 Add Pure integration coverage proving the raw contract carries
  `provider_clauses` text, `visual_identity_role_clause`, the guarded
  `visual_scene`, and the unchanged projection digest facts.
- [x] 1.3 Add Pure negative coverage proving a guard-violating `VISUAL SCENE`
  hard-stops raw planning before any provider submission.
- [x] 1.4 Add Framed integration coverage proving the raw contract carries the
  same additive fields, `text_free: true` is preserved, and the Framed
  exact-key validator accepts the new fields.
- [x] 1.5 Confirm the existing framed `canonicalJsonSha256(storedPlan.raw_work_plan)`
  equality still holds with the additive fields (deterministic serialization).

## 2. Implement The Semantic-Chain Fix

- [x] 2.1 Add `"VISUAL SCENE"` to `PAGE_AUTHORITY_FIELDS` in
  `page_authority_source.mjs`, parse it as a single optional inline field, and
  carry it into the slide receipt as `visual_scene` (raw text, no guard).
- [x] 2.2 Add `provider_clauses`, `visual_identity_role_clause`, and a
  text-guard-normalized `visual_scene` to `pureRawContract` in
  `04-pure-image/index.mjs`.
- [x] 2.3 Mirror the same three fields in `framedRawContract` in
  `03-framed-image/index.mjs`, and extend `FRAMED_RAW_CONTRACT_KEYS` plus the
  canonical-shape validator with type checks for the new fields.
- [x] 2.4 Do not modify the provider submit factory, request envelope, state
  schema, evidence records, or any production `deck_*` bundle.

## 3. Verify Without Widening The Control Surface

- [x] 3.1 Run the focused `01-content`, `04-pure-image`, and `03-framed-image`
  suites; verify scene parse, clause/scene presence, guard normalization, guard
  fail-closed, and unchanged hash binding remain provider-free.
- [x] 3.2 Run `npm test` as the core tier. Do not run mock or real E2E; a
  changed public executable journey does not warrant it and real-provider work
  remains unauthorized.
- [x] 3.3 Run `openspec validate fix-provider-clauses-and-visual-scene --strict`,
  `openspec validate --all --strict`, and `git diff --check`. Confirm all delta
  requirements have an observable test result and that cli-surface grammar and
  durable authority files remain unchanged.
