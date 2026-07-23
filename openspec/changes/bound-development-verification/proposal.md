## Why

BUG-034 shows that `npm test` currently means an unbounded unit/integration sweep: it can load
Canvas, Chromium, PPTX, ECharts, HTML composition, and long fixture chains before producing a
result. In a development change this increases wait time and unrelated failure surface, and the
maintenance runner can end with partial dots rather than a trustworthy completion result.

The framework is still in active development. Its default verification needs a short, deterministic
feedback loop that proves core repository contracts, while render-engine and end-to-end checks remain
explicit, narrowly selected evidence rather than a blanket daily gate.

## What Changes

- Modify the existing framework-script-layout test-discovery and architecture-verification contract so
  the default core command has an explicit versioned inventory, no network/provider/browser/render-engine
  dependencies, a 60-second total wall-clock budget beginning at runner startup and including admission,
  owned shutdown, one bounded machine-readable
  summary, and definitive exit status.
- Make dependency admission auditable: a default-core test may not directly or transitively load
  Canvas, Chromium/Playwright, PPTX generation, ECharts, HTML composition, provider transport, or a
  network primitive. The sole non-local test-runtime import is exact `vitest`; all other bare imports
  are rejected and local imports are confined to the fixed contract-safe roots. An invalid
  inventory/dependency audit, unavailable local runner, or budget expiry fails before/with a
  bounded diagnostic; it is not retried or made parallel to hide the condition.
- Separate focused change-owned tests and render/PPTX/browser diagnostics into explicit single-path
  commands. The Agent chooses only the affected focused seam and, when cross-boundary evidence is
  needed, at most one pure-Node mocked representative E2E route; no default command silently loads
  those tiers or expands to an all-E2E run.
- Update development guidance so `npm test` is the core feedback loop, not a release-certification
  claim. Heavy validation remains useful for diagnosis or deliberate release sampling, but is not a
  development completion gate by default.
- Require every new test entry, fixture, or harness whose primary evidence simulates a dependency, child,
  renderer, provider, network boundary, or journey to include `mock` as a standalone filename token (for
  example `test_mock_core_timeout.mjs`), so mock evidence is visually distinct from real-path tests.
- **BREAKING (developer tooling):** replace the no-argument broad `test:e2e` package-script behavior
  with an exact-one-path mocked journey command and remove the existing broad `test:watch` shortcut.
  Broad unit/integration discovery remains available only through an explicit `test:sweep` command.

Validation follows `openspec/policies/human-centered-gates.md`: a failed core assertion, invalid
inventory, or expired 60-second budget is a non-waivable `hard-stop` for claiming that core check,
protecting deterministic and attributable verification; a skipped opt-in tier is `guide`, not missing
approval. No human content, quality, cost, or authority decision is created. Under
`agent-assistance-and-control.md`, the inventory and result come from one JS-owned evaluator, while
the Agent mechanically selects change-owned opt-in evidence. Under `simple-reliable-control.md`, this
replaces the broad default sweep with one short direct loop and an explicit nearest action, without
adding state, retry, fallback, or a second pass/fail projection.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `framework-script-layout`: changes default test discovery and repository verification from a recursive
  all-suite command to a bounded core tier, while retaining recursive discovery and heavy architecture
  load probes under explicit test tiers.

## Impact

- Framework maintenance only; no `deck_*`, `dpt_*`, production pipeline, run-bundle state, provider
  authorization, or generated artifact contract changes.
- Expected implementation surface: `package.json`, the framework-script-layout-owned core and selected-path
  verification runners plus checked-in core inventory, a split between pure static coherence/architecture
  helpers and subprocess documentation/load-closure diagnostics, focused-only load-closure tests under
  `tests/`, and `PPTMAKER_FRAMEWORK/scripts/README.md` guidance.
- Existing `npm test` behavior changes intentionally: it becomes the bounded core tier. Existing
  unit/integration coverage is retained under `test:sweep`; a developer must select one mocked journey
  rather than invoke a broad E2E package script, and `test:watch` is no longer a second broad entry.
