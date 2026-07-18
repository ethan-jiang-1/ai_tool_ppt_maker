## ADDED Requirements

### Requirement: Environment check separates base and Image2 readiness modes

`env-check.mjs` SHALL resolve one readiness mode per invocation. An invocation without `--image2`, `--smoke`, or `--probe-vendors` SHALL run base checks only. `--image2` SHALL run base checks plus Image2 presence checks and SHALL remain offline. `--smoke` and `--probe-vendors` SHALL each imply Image2 mode and SHALL retain their live-probe behavior after presence checks pass. `--smoke` and `--probe-vendors` SHALL remain mutually exclusive; either MAY be combined with redundant `--image2`.

Base checks SHALL include the Node/npm/package foundation, existing local framework dependencies and advisory checks, the exact Playwright package, matching installed Chromium, distributed HTML-font integrity/coverage, and fixed offline runtime smoke. Base checks SHALL omit `api_key`, `image_base_url`, and `stage2_generator`. Missing Image2 configuration SHALL therefore not change base READY or its exit status.

#### Scenario: New user has no Image2 configuration

- **WHEN** all local/base requirements pass and neither `IMAGE2_API_KEY` nor `IMAGE2_BASE_URL` is set
- **AND** env-check runs without an Image2 flag
- **THEN** the report omits Image2 presence checks, ends in READY, and exits 0

#### Scenario: Explicit Image2 presence mode

- **WHEN** env-check runs with `--image2`
- **THEN** it runs all base checks plus `api_key`, `image_base_url`, and `stage2_generator`
- **AND** it reports the resolved vendor count without exposing endpoint or secret values
- **AND** it makes no Image2 network call

#### Scenario: Legacy live flag implies Image2 mode

- **WHEN** env-check runs with `--smoke` or `--probe-vendors` without `--image2`
- **THEN** it first runs the same Image2 presence checks as `--image2`
- **AND** existing invocations remain valid

### Requirement: HTML browser and font checks are blocking base checks

After npm package presence succeeds, env-check SHALL dynamically enter the runtime owned by `html-render-runtime` and emit stable base check records for `chromium`, `html_fonts`, and `html_runtime_smoke`. Missing/mismatched Chromium, absent/corrupt font, CSS, manifest, provenance, or license assets, unsupported fixed sentinel coverage, network attempts, browser-launch failure, or fixture-geometry failure SHALL be `fail` and SHALL make base readiness NOT READY. The checker SHALL NOT install/download a browser or font and SHALL NOT accept OS font fallback as readiness evidence. With no run-dir, these checks SHALL NOT claim actual deck code-point coverage or pixel-overflow validation.

#### Scenario: Chromium has not been installed

- **WHEN** the pinned Playwright package exists but its paired Chromium is absent
- **THEN** `chromium` is `fail`, base readiness is NOT READY, and fix text identifies the explicit browser setup command
- **AND** no install or download is attempted

#### Scenario: Bundled font coverage is invalid

- **WHEN** the canonical font manifest, license, digest, or sentinel coverage check fails
- **THEN** `html_fonts` is `fail` and base readiness is NOT READY
- **AND** the checker does not hide the failure behind a system-font warning

#### Scenario: Static smoke succeeds

- **WHEN** the package-paired browser and valid distributed fonts render the fixed offline fixture with expected geometry and no network attempt
- **THEN** `html_runtime_smoke` is `ok`

#### Scenario: Base doctor has no deck coverage claim

- **WHEN** base readiness succeeds without a run-dir
- **THEN** its font result is scoped to the fixed sentinel corpus
- **AND** it does not assert that arbitrary slide source will fit or has complete glyph coverage

## MODIFIED Requirements

### Requirement: Zero-dependency runtime check

`scripts/env-check.mjs` SHALL have zero static npm dependencies. It SHALL remain runnable with Node.js built-ins before `npm install` so it can diagnose the Node/npm/package foundation. It MAY dynamically import the installed `html-render-runtime` implementation only after package presence checks establish that npm dependencies exist; a missing dependency SHALL be reported as a normal check failure rather than causing module-load failure at startup.

#### Scenario: Run without node_modules

- **WHEN** `node scripts/env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** the script executes and emits actionable missing-package results
- **AND** it does not fail during top-level module loading

### Requirement: Node.js version gate

The env check SHALL verify at startup that Node.js belongs to the checked-in supported major set `22.x`, `24.x`, or `26.x`. If absent, older, or on an undocumented major such as 23/25, it SHALL output FOUNDATION NOT READY and exit non-zero. The `package.json` `>=22` engine range SHALL be treated only as the package floor, not as the executable support set.

#### Scenario: Version check

- **WHEN** Node.js 22.0.0 is installed → version check passes
- **WHEN** Node.js 24.x or 26.x is installed → version check passes
- **WHEN** Node.js 20.0.0 is installed → report shows required vs found version, exits non-zero
- **WHEN** Node.js 23.x or 25.x is installed → report shows the supported major lines vs found version, exits non-zero

### Requirement: npm and dependency check

The env check SHALL verify npm is available. It SHALL verify that the hard-required packages `@napi-rs/canvas`, `pptxgenjs`, `commander`, and exact `playwright@1.61.1` are each present by walking **upward from `process.cwd()`** (the same upward-search strategy used for `.env` loading) and checking for `node_modules/<package>` under each ancestor. Presence MAY be determined by filesystem checks, but Playwright version verification SHALL use installed package metadata after its path is found. The resolved Playwright package root/version SHALL be passed into `html-render-runtime`, which SHALL load that exact installation rather than repeating a bare/module-relative package lookup. The checker SHALL NOT stop at the first ancestor that merely contains a `node_modules` directory if a required package path is missing there — it SHALL continue upward (Node-like). If no ancestor yields a required package, that check SHALL fail and instruct the user to run `npm install` in the project root (the directory that owns `package.json` / `node_modules`). A present but non-matching Playwright version SHALL fail with lockfile-alignment guidance.

#### Scenario: Dependencies installed at project root while cwd is a deck

- **WHEN** `node_modules` with the required packages exists at a parent of `process.cwd()` (for example repo root)
- **AND** the checker is invoked with `cwd` set to a child deck directory that has no local `node_modules`
- **THEN** the dependency checks for `@napi-rs/canvas`, `pptxgenjs`, `commander`, and `playwright` report status `ok`

#### Scenario: Dependencies missing

- **WHEN** no ancestor of `process.cwd()` contains `node_modules/<package>` for a required package
- **THEN** that dependency check reports failure
- **AND** the fix text instructs the user to run `npm install` in the project root

#### Scenario: Dependencies at cwd still work

- **WHEN** `node_modules` with the required packages exists directly in `process.cwd()`
- **THEN** `@napi-rs/canvas`, `pptxgenjs`, `commander`, and exact `playwright@1.61.1` are verified as present

#### Scenario: Empty local node_modules does not block parent packages

- **WHEN** `process.cwd()` contains an empty or incomplete `node_modules`
- **AND** a parent directory contains `node_modules` with the required packages
- **THEN** the dependency checks for those packages still report status `ok`

#### Scenario: Playwright version drifts from the runtime profile

- **WHEN** a `playwright` package is found but its version is not `1.61.1`
- **THEN** the `playwright` check fails
- **AND** the checker does not continue with an unpaired browser profile

#### Scenario: A shadow Playwright copy exists near the runtime module

- **WHEN** cwd ancestor discovery selects exact `playwright@1.61.1` but a different Playwright copy is resolvable relative to the framework runtime module
- **THEN** runtime inspection and launch use only the discovered exact package root
- **AND** the shadow copy cannot satisfy or replace the inspected profile

### Requirement: API key verification

In Image2 mode, the env check SHALL verify that image-generation credentials can resolve at least one usable API key, consistent with `resolveVendors` / Image2 contract:

- **Shared key path:** non-empty `IMAGE2_API_KEY`.

When no shared key is available, `api_key` SHALL fail the Image2-mode verdict. Fix text SHALL name `IMAGE2_API_KEY`. Base mode SHALL omit this check and SHALL not load or require the key for readiness.

#### Scenario: Canonical IMAGE2 key

- **WHEN** `.env` contains non-empty `IMAGE2_API_KEY`
- **AND** Image2 mode is selected
- **THEN** `api_key` passes and detail identifies `IMAGE2_API_KEY`

#### Scenario: Missing key

- **WHEN** no `IMAGE2_API_KEY` is set
- **AND** Image2 mode is selected
- **THEN** `api_key` fails and fix names `IMAGE2_API_KEY`

#### Scenario: Missing key does not affect base mode

- **WHEN** no `IMAGE2_API_KEY` is set and env-check runs in base mode
- **THEN** no `api_key` check is emitted
- **AND** the missing key does not affect base READY

### Requirement: Image API base URL is a hard requirement

In Image2 mode, the env check SHALL require a resolvable image API endpoint configuration via:

- non-empty `IMAGE2_BASE_URL`.

When none is set, `image_base_url` SHALL be **`fail`** and the Image2-mode verdict SHALL be NOT READY. The check SHALL NOT claim a silent default endpoint when URL is unset. Fix text SHALL name `IMAGE2_BASE_URL`. Base mode SHALL omit this check.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **AND** Image2 mode is selected
- **THEN** `image_base_url` passes

#### Scenario: Missing base URL fails doctor

- **WHEN** a shared key is present but no base URL variable is set
- **AND** Image2 mode is selected
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

#### Scenario: Missing base URL does not affect base mode

- **WHEN** no base URL is set and env-check runs in base mode
- **THEN** no `image_base_url` check is emitted

### Requirement: In-framework Stage 2 scripts are a hard requirement

In Image2 mode, the env check SHALL treat missing in-framework Stage 2 modules as a hard failure, not a warning. It SHALL verify these files exist under `PPTMAKER_FRAMEWORK/scripts/`: `stage2_generate_images.mjs`, `make_contact_sheet.mjs`, `image_api_client.mjs`. It SHALL NOT search `.claude/skills/` or `.agents/skills/`. Base mode SHALL omit `stage2_generator` because local HTML runtime readiness does not depend on the Image2 implementation.

#### Scenario: Scripts present

- **WHEN** the three Stage 2 modules exist under `scripts/`
- **AND** Image2 mode is selected
- **THEN** `stage2_generator` status is `ok` and detail mentions `in-framework`

#### Scenario: Scripts missing

- **WHEN** any of the three modules is missing
- **AND** Image2 mode is selected
- **THEN** `stage2_generator` status is `fail`, overall verdict is NOT READY, and the process exits non-zero

#### Scenario: Base doctor does not require Stage 2

- **WHEN** Stage 2 modules are absent but all base checks pass
- **AND** env-check runs without an Image2 flag
- **THEN** no `stage2_generator` check is emitted and base readiness remains READY

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an overall verdict for the selected mode. Exit 0 on READY and non-zero on NOT READY. The direct `--json` form SHALL retain the existing `env-check-v1` top-level booleans and generic check-array contract; it SHALL not expose secrets or add a second incompatible report schema. Every accepted JSON combination, including `--image2`, `--smoke`, and `--probe-vendors`, SHALL emit exactly one parseable JSON document on stdout. Live heartbeat, progress, and human Summary text SHALL be sent to stderr or represented inside structured check evidence, never prepended/appended to stdout JSON. Human text SHALL make clear whether it reports base readiness or Image2 readiness.

#### Scenario: Output format

- **WHEN** all checks selected by the invocation pass → output ends with "READY", exit 0
- **WHEN** any selected hard check fails → output ends with "NOT READY", lists all failures, exit non-zero

#### Scenario: JSON compatibility is preserved

- **WHEN** direct `env-check --json` runs in base or Image2 mode
- **THEN** the report remains valid under `env-check-v1`
- **AND** mode-specific behavior is represented by the checks included and existing `smoke`/`probeVendors` booleans rather than a duplicate diagnostic schema

#### Scenario: Live JSON stdout remains parseable

- **WHEN** direct `env-check --json --smoke` or `env-check --json --probe-vendors` runs
- **THEN** stdout parses as exactly one `env-check-v1` JSON document
- **AND** live progress or human summary lines do not appear outside that document on stdout

### Requirement: Optional --smoke performs one live credential probe

`env-check.mjs` SHALL accept `--smoke`. `--smoke` SHALL imply Image2 mode. After base and Image2 presence checks pass, it SHALL perform exactly one minimal live Image2 POST attempt against the **first** vendor from `resolveVendors`. The diagnostic request SHALL disable automatic redirect following and SHALL NOT retry a redirect, transient response, timeout, or ambiguous network failure. Success SHALL be an extractable image ref **or** a task id, using the same exported extract helpers as the client (no forked parser). Full async image completion is NOT required. Without `--smoke` and without `--probe-vendors`, env-check SHALL NOT make Image2 network calls. The zero-static-dependency startup contract remains; dynamic-importing sibling ESM after prerequisites pass is allowed.

#### Scenario: --smoke fails on bad credentials

- **WHEN** credentials resolve but the API rejects the probe
- **AND** `env-check --smoke` runs
- **THEN** overall status is NOT READY
- **AND** the report indicates the smoke/probe failed

#### Scenario: --smoke succeeds on task_id without waiting for image

- **WHEN** the API accepts submit and returns a task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes without waiting for image completion

#### Scenario: --smoke succeeds on sync image without task_id

- **WHEN** the API accepts submit and returns an extractable image ref with no task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes

#### Scenario: Default doctor stays offline

- **WHEN** `env-check` runs without `--smoke` and without `--probe-vendors`
- **THEN** it does not perform an Image2 network probe
- **AND** the base browser smoke remains local-only

#### Scenario: --smoke remains backward compatible

- **WHEN** `env-check --smoke` runs without an explicit `--image2`
- **THEN** Image2 presence checks and the first-vendor live probe still run
- **AND** exactly one provider submit is attempted

#### Scenario: --smoke redirect or ambiguous failure is not retried

- **WHEN** the diagnostic POST receives a 307/308 redirect, times out, or fails with an ambiguous network error
- **THEN** the smoke check fails without following the redirect
- **AND** no second POST attempt occurs in that invocation

### Requirement: Optional --probe-vendors reports every Image2 channel

`env-check.mjs` SHALL accept `--probe-vendors`, which SHALL imply Image2 mode. After base and Image2 presence checks pass, it SHALL make exactly one live POST attempt to **each** entry returned by `resolveVendors` in order (same success rule as `--smoke`: image ref or task id; no forked parser). Each diagnostic request SHALL disable automatic redirect following and SHALL NOT retry a redirect, transient response, timeout, or ambiguous network failure. The current `image-generation` SSOT continues to produce one canonical entry from `IMAGE2_API_KEY` plus `IMAGE2_BASE_URL`; this change SHALL NOT add an alternate multi-vendor credential schema. The loop SHALL nevertheless remain array-generic and be testable with injected multi-entry resolver output. It SHALL log `probing i/N` progress and per-vendor submit heartbeats consistent with the image client's wait contract. For each vendor it SHALL print `base_url`, `ok|fail`, `mode` (`sync`|`async`|`unknown`), `elapsed_s`, and a short `error` on failure — never API key values. After all probes it SHALL print a Summary (OK vs FAIL) with working vendors first sorted by ascending elapsed time; failed vendors appended in original relative order. Exit 0 if at least one vendor is OK; otherwise non-zero with an actionable failure path. It SHALL NOT write `.env` or `_lessons/`. If both `--smoke` and `--probe-vendors` are passed, the tool SHALL fail with a clear usage error. `--image2` MAY accompany either live flag without changing behavior.

#### Scenario: --probe-vendors lists per-vendor outcomes

- **WHEN** the probe receives three ordered entries from the shared resolver (for example through the injected regression seam) and `--probe-vendors` runs
- **THEN** output includes a result line for each vendor
- **AND** exactly three provider submits are attempted
- **AND** no API key values appear in the output

#### Scenario: --probe-vendors exits non-zero when all fail

- **WHEN** every vendor probe fails
- **AND** `--probe-vendors` runs
- **THEN** the process exits non-zero

#### Scenario: --smoke and --probe-vendors together are rejected

- **WHEN** both `--smoke` and `--probe-vendors` are passed
- **THEN** the process exits non-zero with a usage/mutual-exclusion error

#### Scenario: --probe-vendors remains backward compatible

- **WHEN** `env-check --probe-vendors` runs without explicit `--image2`
- **THEN** Image2 presence checks and all-vendor probing still run

#### Scenario: Probe does not retry a vendor

- **WHEN** one resolver entry redirects, returns a transient 5xx, times out, or has an ambiguous network failure
- **THEN** that entry is recorded as failed or unknown after one POST attempt
- **AND** probing continues to the next resolver entry without retrying the failed entry
