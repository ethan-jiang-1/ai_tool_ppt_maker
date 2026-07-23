## Context

`npm test` currently delegates directly to Vitest's repository-wide `tests/**` include. That makes the development command's workload an accidental union of every test file: lightweight contract tests run beside browser, Canvas, PPTX, ECharts, HTML-compositor, provider-adapter, and long fixture paths. The existing worker cap limits contention but cannot make the selected workload bounded or explain a partial runner result.

This is framework repository maintenance. `framework-script-layout` already owns recursive test discovery, the test tree, static architecture verification, and source-to-test ownership; this change refines that existing owner rather than creating a second test-governance capability. The direct fact is the checked-in core-test inventory and its static import closure; a JS-owned verifier selects and executes it. No run-bundle, controller, state, provider authorization, or generated artifact is involved. An Agent selects focused or representative opt-in checks from the change's affected seam; no human decision is needed.

## Goals / Non-Goals

**Goals:**

- Make `npm test` a deterministic, pure-Node development feedback loop that terminates with one final, bounded result inside 60 seconds.
- Keep the default inventory small, explicit, and auditable against prohibited runtime dependencies.
- Keep focused tests and expensive rendering/journey sweeps available through explicit commands without weakening or deleting their assertions.
- Give every default failure one nearest action: repair the inventory/dependency admission, repair the failing core assertion, or narrow/select an opt-in test for the affected seam.

**Non-Goals:**

- Do not certify every framework capability, real browser rendering, real provider behavior, or all E2E routes on each development change.
- Do not add retries, increase workers, extend the budget, add test state/history, or use a release pipeline as a fallback for a failed core command.
- Do not alter production CLI diagnostic envelopes, run-bundle ownership, or production dependencies.

## Decisions

### 1. The default is an inventory-backed Node verifier

`npm test` will invoke `tests/contracts/run_development_verification.mjs`, a framework-script-layout-owned repository-verification tool rather than a production CLI. It reads `tests/contracts/development-verification-core-v1.json`, validates the exact `{ schema: "pptmaker-development-verification-core-v1", budget_ms: 60000, entries: [...] }` shape, audits each entry's static local import closure, then launches Vitest only for the admitted explicit paths. `entries` is a nonempty, lexically sorted array of at most 16 unique repository-relative paths; each audited file is at most 1 MiB, and the entire closure is at most 256 files and 8 MiB of source. Exceeding an admission input limit is `invalid_inventory`, while the inventory is the sole selector for the default tier and package globs, directory convention, and an Agent's command line are not parallel selectors. The runner's own contract tests remain under `tests/contracts/`; the runner filename does not match Vitest's test-entry patterns and is invoked only by package scripts or those tests.

The runner owns the final summary and exit result. Its total clock starts at runner process entry, before inventory reading, local-Vitest resolution, or dependency admission. Vitest remains the assertion executor, but its partial progress cannot be the only completion signal: the runner drains child stdout/stderr into bounded ring buffers and never forwards raw child progress to its own stdout. For every terminal outcome the verifier itself controls, its stdout is exactly one JSON line with exact keys `schema`, `tier`, `result`, `duration_ms`, `next_action`, and optional `failure_tail`; `schema` is `development-verification-v1`, `tier` is `core`, `duration_ms` is an integer from `0` through `60000`, `next_action` is one nonempty string, and the serialized UTF-8 `failure_tail` value is JSON-escaped and at most 8192 bytes. NPM's own script banner is outside the verifier stdout contract. `unavailable` covers local-Vitest resolution or owned-child startup failure, so even runner-environment failures have one definitive result rather than an uncaught process error; external termination of the verifier itself is outside that process-owned guarantee.

Alternative considered: change the default Vitest include to exclude heavy directories. Rejected because exclusion is not a durable membership authority, cannot prove transitive dependency isolation, and leaves timeout/result ownership with an opaque child process.

### 2. Core admission is conservative and static

The inventory lists repository-relative test entry paths and a single 60,000 ms budget. Admission first requires each entry to exist, match the supported test naming convention, stay under `tests/`, and not appear twice. A dedicated dependency-free conservative ESM lexer then follows supported literal static import/export edges in the entry's local `.mjs` closure. It does not reuse the framework-architecture helper because that helper intentionally ignores computed imports. The lexer tokenizes comments, strings, and template literals sufficiently to avoid treating their text as an edge while scanning `${...}` template expressions as code. It supports side-effect imports, binding imports, `export { ... } from`, `export * from`, `export * as name from`, and local/declaration exports with no source edge; it rejects every dynamic `import()`, import attribute/assertion, `require`, `createRequire`, `node:module`, or import/export syntax it cannot classify.

The only supported non-local specifiers are `node:` built-ins outside the prohibited process/network set and exact `vitest`, which is the already-selected assertion runtime and is not traversed as test-source code. Every other bare/package specifier is invalid. A local specifier must be a relative `.mjs` path that resolves without package resolution to a regular repository file beneath `tests/contracts/`, `PPTMAKER_FRAMEWORK/scripts/contracts/`, or `PPTMAKER_FRAMEWORK/scripts/shared/cli/`; absolute paths, `file:` URLs, extension probing, and every other local root are invalid for core rather than inferred safe. Within those roots it rejects a closure that reaches `@napi-rs/canvas`, `playwright`, `pptxgenjs`, `echarts`, a provider transport/client, HTML composition/rendering, browser runtime, `node:child_process`, or network primitives (`fetch`, `WebSocket`, and Node HTTP/DNS/socket modules). This keeps an admitted test from starting an unowned descendant that could survive the verifier's bounded shutdown. This fixed grammar and root boundary is not a per-inventory exception or fallback allowlist: a default-core closure must be directly auditable with Node built-ins.

Admission has one fixed prerequisite order: exact inventory shape and limits; entry path/name/existence; local file/closure input limits; lexical import resolution and dependency prohibition; then installed-local-Vitest resolution and owned-child startup. It stops at the first failed prerequisite and reports exactly that root cause and its one repair action. It never starts Vitest or resolves later implications after an inventory/admission failure.

This is a `hard-stop`: an unauditable default test cannot claim dependency-free core verification. It protects the bounded, attributable feedback invariant and has one repair action: move the test to an opt-in tier or refactor the tested seam behind an already dependency-free public interface. It is not waivable and has no retry branch.

Alternative considered: run tests and inspect loaded packages at runtime. Rejected because it permits initialization of the dependencies that the default tier must avoid, is environment-dependent, and makes the failure later and less explainable.

### 3. The budget is owned outside Vitest

The core budget is a fixed 60,000-ms total from runner process entry through summary/exit. The runner reserves fixed consecutive windows: a 5,000-ms preflight deadline for inventory/admission/local-Vitest resolution, at most 50,000 ms for owned child execution, and the remaining 5,000 ms for complete graceful/forced child shutdown. The bounded entry/file/closure limits and linear lexer prevent preflight from expanding into an unbounded scan; an input-limit breach is `invalid_inventory`, while a completed preflight that exceeds its deadline returns `timed_out` without starting a child. A child timeout starts owned termination. The shutdown window is part of, not in addition to, the total budget. Normal child success/failure similarly maps to one final summary and the corresponding process exit. The runner does not retry, increase workers, detach, or launch another tier. Its test-only mock harness (for example `test_mock_core_timeout.mjs`) can inject proportionally millisecond-scale preflight/execution/grace deadlines to prove these branches; the user-facing core command cannot override any budget constant.

This gives the default checkpoint a short direct loop: inventory -> admission -> one child -> one result. It replaces the former broad wildcard plus partial progress ambiguity, rather than adding a validator on top of the same sweep. A core assertion failure is also a `hard-stop` only for claiming the core result; the closest action is the failing test path already reported by Vitest. A nonselected opt-in tier is `guide`, not a failed approval or waived gate.

### 4. Architecture core eligibility requires a static-only closure

`test_framework_architecture.mjs` currently combines static repository checks with subprocess load-closure probes, and `framework_architecture.mjs` reaches `framework_coherence.mjs`, which imports `node:child_process` for documentation-command auditing. That closure is correctly inadmissible under the core rule. This change SHALL factor the legacy-token registry/validator used by architecture into a static-only contract module, retain subprocess documentation-command auditing in a separate opt-in module, and update `framework_architecture.mjs` to import only the static helper. It SHALL also move the base/HTML-local/markerless load-closure assertions from `test_framework_architecture.mjs` into one focused-only test entry.

The architecture core test then proves only deterministic tree/import/ownership/legacy-token facts. The focused diagnostics retain every real subprocess and sentinel assertion, but are never selected by the core inventory. This changes physical module placement only to preserve the existing direct fact owner; it creates no duplicate legacy-token registry, no transition mode, and no weakened architecture rule.

### 5. Expensive coverage is explicit and change-scoped

Package scripts will distinguish:

| Tier | Owner and use | Default behavior |
| --- | --- | --- |
| `core` | inventory-backed pure Node contracts and static architecture check | `npm test`; required development feedback |
| `focused` | Agent-selected affected test file/seam | explicit invocation; no inferred expansion |
| `render` | Canvas/Chromium/HTML/PPTX/visual engine diagnostics | explicit selected test only |
| `journey` | one pure-Node mocked representative public route | explicit selected route only |
| `sweep` | broad existing unit/integration sampling | explicit maintenance diagnostic |

The package surface is exact: `npm test` runs core; `npm run test:sweep` runs the recursive unit/integration sweep; `npm run test:focused -- <tests/.../test_*.mjs>` and `npm run test:render -- <tests/.../test_*.mjs>` dispatch one selected unit/integration path; and the retained `npm run test:e2e -- <tests_e2e/.../test_mock_*.mjs>` name now dispatches one mocked journey, rather than a broad E2E sweep. The existing `test:watch` script is removed; it cannot remain as a second broad discovery entry. The documented npm invocation uses `--` to pass its one path. `test:focused`, `test:render`, and `test:e2e` invoke one repository-owned `tests/contracts/run_selected_verification.mjs` dispatcher with their fixed tier; the dispatcher accepts exactly one path argument and no additional Vitest selector or flag. It invokes the already-installed local Vitest entry with `vitest.config.mjs` for focused/render and `vitest.e2e.config.mjs` for journey, so the selected path retains its owning test configuration without expanding discovery. Missing, multiple, escaping, unsupported-name, or tier-incompatible scope is a usage failure before a child starts. `focused` and `render` accept only a suite under `tests/`; a visual-engine closure means a closure reaching Canvas, Chromium/Playwright, PPTX, ECharts, or HTML compositor/runtime. `render` requires that boundary and `focused` rejects it. The current recursive Vitest discovery remains the membership rule for an explicit unit/integration `sweep`, not for `npm test`. `tests_e2e/` has no broad package-script sweep in this change: `test:e2e` accepts only one `tests_e2e/**/test_mock_*.mjs` journey that uses mock boundaries and initializes neither browser/HTML compositor/Canvas/PPTX/ECharts nor a real provider/network client. It tests one public control route, not pixels or third-party runtime. The static architecture checker remains core-eligible, but its HTML-local and markerless-provider subprocess load-closure probes become explicit focused diagnostics so core never loads those branches. The scripts do not claim that any tier is a substitute for another. Documentation tells Agents to run core plus the minimum number of individually selected affected seams (`focused` and/or `render`); use at most one mocked journey when it proves a cross-boundary behavior. A selected load-closure diagnostic uses only command help and forbidden-module sentinels, never a browser, compositor, Canvas/PPTX/ECharts, or real provider. Render and sweep commands are intentionally never chained from `npm test`.

Alternative considered: remove heavy tests. Rejected because they remain useful diagnostic and release evidence; the problem is accidental default admission, not their existence.

## Risks / Trade-offs

- [A useful core test imports a heavy implementation transitively] -> reject it from core and either test a dependency-free public seam or keep it focused/opt-in; do not weaken the audit.
- [The static resolver misses a syntax form] -> use the dedicated conservative lexer, reject unknown/nonliteral resolution, and add filename-explicit mock fixtures for comments/strings, static import/export, and forbidden dynamic syntax before allowing a new form.
- [The static architecture test is inadmissible through a hidden helper] -> split the helper at the existing static/subprocess boundary and prove the core closure has no `node:child_process`; do not waive or special-case that test.
- [A fast core tier gives a false sense of full release coverage] -> final summary and documentation name the exact `core` tier; no command reports it as a full sweep or release certification.
- [Child termination leaves a process] -> core admission rejects `node:child_process`; the runner records only bounded child identity/status, awaits a short owned termination path, and tests timeout behavior with a local inert fixture; it never scans or kills unrelated processes.
- [The 60-second budget becomes unrealistic] -> optimize or demote the offending core entry; changing the declared budget requires a new requirement change, not an ad-hoc timeout increase.
- [Mock evidence is confused with a real dependency/journey] -> every new simulated test entry, fixture, or harness has a standalone `mock` filename token, and tests assert the verifier mock artifacts follow that convention.

## Migration Plan

1. Add the inventory, verifier, package scripts, and tests while retaining recursive unit/integration discovery only as an explicitly named sweep command; replace the no-argument broad E2E script with an exact-one-path mocked journey command.
2. Switch `npm test` to the new core command and update maintenance documentation in the same change.
3. Run the core verifier repeatedly, its filename-explicit mock negative-admission/short-timeout fixtures, and one explicitly selected mocked representative route. Do not run an all-render/all-E2E sweep as the migration gate.
4. Rollback is a package-script/config restoration only; no persistent state or production artifact migration exists. It restores the prior developer script configuration as a whole and does not preserve a second broad-E2E command in the target state.

## Open Questions

- None. The exact initial inventory is an implementation admission decision: it must satisfy the static audit and the 60-second budget, and any uncertain test belongs to an opt-in tier.
