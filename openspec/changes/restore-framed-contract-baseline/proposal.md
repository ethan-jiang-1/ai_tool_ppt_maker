## Why

`tests/03-framed-image/test_framed_workflow.mjs` no longer exercises the
current `page-image-workflow-v1` Framed path. Eleven cases depend on retired
Text Frame APIs, `VISUAL SCENE`, text-free grammar, or invalid source receipts.
Until that suite is restored, the known protected-composition defects cannot be
changed with credible regression coverage.

This is deliberately a baseline-recovery change. It makes the current contract
observable without claiming that the current prompt-only protected region is a
collision guarantee or altering a production run.

## What Changes

- Replace obsolete Framed source and receipt fixtures with valid current
  `page-image-workflow-v1` Framed fixtures.
- Add a focused parsed-source to bound compiled-provider-input regression seam
  that proves the adapter owns the exact request submitted by shared transport.
- Characterize the three known semantic gaps -- dropped `subject_restrictions`,
  unqualified protected-region coordinates, and no body-safe region -- as
  explicit pending/red work for the later protected-composition change without
  changing current runtime behavior.
- Run the repaired Framed workflow suite with the existing parser,
  render-contract, review-contribution, binding, and invalidation coverage.

This change does not add `PAGE CLASS`, Header Profiles, a provider transport
field, an automatic quality decision, or a v3 migration. It does not modify a
run bundle, generated artifact, Task Mandate, exact grant, cost record, or
Complete Page Review ownership.

## Capabilities

### New Capabilities

None. This change restores tests and test observability only.

### Modified Capabilities

None. No externally observable Harness requirement changes; the later Framed
hardening change will carry the relevant capability deltas.

## Impact

- Affected source: narrowly scoped test helpers or test-only exports if needed
  under `ppt_maker_harness/`, plus `tests/03-framed-image/`.
- Affected checks: current Framed source parsing, compiler/binding observation,
  render contract, review contribution, and invalidation regression tests.
- Control owner: JS test coverage only; the MD Controller and CLI contract are
  unchanged.
- Run-bundle contract: none. `deck_dark_factory_current/3_versions/v3` remains
  production evidence and is not a fixture or migration target.
- Control policy: `human-centered-gates.md`,
  `agent-assistance-and-control.md`, and `simple-reliable-control.md` remain
  unchanged. The repair adds no gate, retry, grant, or confirmation; it makes
  later deterministic diagnosis smaller and safer.
