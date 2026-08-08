## 1. Current-review ownership

- [x] 1.1 In the `image-generation` progressive raw owner, add one internal
  relation-aware selector for the sole current undecided Complete Page Review
  and reuse it for lifecycle action, current evidence, and the read-only
  current-review reader, while retaining decision-history handoffs as
  non-selecting audit projections.
- [x] 1.2 Route unaccepted review preparation and review acceptance through
  the same selector and current owner action, so a repaired review rejects
  before publisher/validator execution or any owner write and names the
  existing raw rebuild action; retain the existing accepted-review replay.

## 2. Regression coverage

- [x] 2.1 Extend the focused progressive raw-owner fixture through `repair` to
  assert that lifecycle inspection exposes `rebuild_progressive_raw_work`, no
  current review digest, and no acceptance/finalization route, while its
  decision-history handoff remains audit-only and the normal prepared-review /
  `proceed` path remains valid.
- [x] 2.2 Add negative owner-operation coverage showing that `prepare` and
  `accept` cannot replay or re-decide a prepared review referenced by repair;
  assert the bounded rebuild next action, no publisher/validator call, and no
  direct-record mutation.
- [x] 2.3 Cover the existing accepted-review replay after `proceed` so the
  repair guard cannot block deterministic reconstruction of accepted review
  projection.

## 3. Validation

- [x] 3.1 Run `npx vitest run
  tests/shared/image2/test_progressive_raw_owner.mjs` as the smallest required
  visual-engine owner diagnostic, then the protected Harness baseline
  (`npm test`); record any unrelated pre-existing failures separately.
- [x] 3.2 Run `openspec validate restore-repair-raw-rebuild-routing --strict`,
  `openspec validate --all --strict`, and `git diff --check`.
