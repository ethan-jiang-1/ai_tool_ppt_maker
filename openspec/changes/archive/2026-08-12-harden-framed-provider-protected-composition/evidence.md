# Implementation Evidence

## Scope Boundary

C6 changed only Harness source, its OpenSpec artifacts, and automated tests.
It did not read, migrate, rewrite, or use any production `deck_*` Run Bundle
or `dpt_*` input. Temporary test bundles were created under the system temp
directory and removed by their fixtures. C5 artifacts in those fixtures were
published only by the normal `image2 plan` path; no `_generated/` artifact was
manually edited.

## Provider Boundary

- The Framed request retains the existing full-canvas opaque shared transport.
  It carries normalized composition guidance in canonical adapter bytes but
  adds no provider-native `region`, `mask`, crop, or reserved-area transport
  field.
- No real provider, paid probe, credential, or external endpoint was used.
  The public-CLI journey uses a local in-process mock HTTP provider and checks
  the exact submitted prompt against the C5 inspection record.
- C6 makes no v3 repair or migration. Historical/production records remain
  outside this change's read and write scope.

## Human-Control Boundary

The implementation preserves the existing single Complete Page Review. The
two normalized guide rectangles are validated review context only: they add no
approval, waiver, retry, state, acceptance controller, occupancy, collision,
or OCR decision path. Any provider-native primitive or synthetic paid probe
remains a separate explicit human Work Request followed by a new OpenSpec
change.

## Verification

The following checks passed for this implementation:

- Focused schema, source/Core, visual-config, Framed, review, Pure,
  invalidation, derived-data, and progressive-raw Vitest suites.
- The selected public CLI mock journey:
  `tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs` with the
  `exact Framed C6 request binding` case.
- `npm test`
- `openspec validate harden-framed-provider-protected-composition --strict --no-interactive`
- `node ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs --self-check`
- `git diff --check`
