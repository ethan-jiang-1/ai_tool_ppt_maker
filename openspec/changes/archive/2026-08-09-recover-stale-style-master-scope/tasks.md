## 1. Provider-free Style Master Scope Recovery

- [x] 1.1 Update `style-master-generation` scope evaluation so a selected workflow's current validated candidate can establish a replacement candidate-plan scope only after the existing evaluator classifies source identity/receipt drift, while retaining state-initialization, integrity, unsupported-lineage, and cross-workflow hard-stops.
- [x] 1.2 Preserve the existing immutable Style Master lifecycle when publishing that replacement: require the existing terminal or canonical-input-stale predecessor condition, block unresolved submissions, bind new candidate facts, preserve CAS/idempotence, and forbid grant, attempt, review, selection, or Page Image authority reuse while revalidating any local-existing candidate as a new snapshot.

## 2. Raw And CLI Handoff

- [x] 2.1 Update Pure and Framed raw-plan readiness to route a stale required Style Master with a valid current candidate to the owner-issued replacement planning action before any source-epoch, raw-plan, grant, attempt, provider, or evidence mutation.
- [x] 2.2 Make direct `style-master inspect` return its normal owner projection and `style-master plan` accept the same recovery scope for the provider-free successor; retain the registered CLI diagnostic producer only for the preceding raw-plan hard-stop.

## 3. Focused Regression Coverage

- [x] 3.1 Add Style Master scope/lifecycle tests for classified visual or source drift that prove a replacement plan can be published from a validated current candidate, historical grants/attempts/reviews/selections remain audit-only, any local-existing media is revalidated as a new snapshot, and unrelated state failures remain hard-stops.
- [x] 3.2 Add Pure and Framed raw-plan regression tests that prove the stale-selection route short-circuits before state/source epoch, raw lifecycle records, authorization, and provider submission mutation, then returns to the existing checkpoint after replacement selection.
- [x] 3.3 Add direct CLI regression coverage for stale-scope `inspect` and `plan`, asserting successful owner projection/successor planning with one forward action; cover the preceding raw-plan diagnostic separately and reject internal-failure or self-referential actions.

## 4. Verification And Handoff

- [x] 4.1 Run the focused Style Master, Pure, Framed, and CLI suites; run the protected `npm test` baseline and record that no real provider or production-deck mutation occurred.
- [x] 4.2 Run `openspec validate recover-stale-style-master-scope --strict`, `openspec validate --all --strict`, and `git diff --check`; update this change's tasks with completed items before requesting spec sync/archive.
