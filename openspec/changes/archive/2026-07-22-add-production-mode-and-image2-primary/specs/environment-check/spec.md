## RENAMED Requirements

- FROM: `### Requirement: Environment check separates base and Image2 readiness modes`
- TO: `### Requirement: Environment check separates production readiness profiles`
- FROM: `### Requirement: HTML browser and font checks are blocking base checks`
- TO: `### Requirement: HTML browser and font checks block only HTML readiness`

## MODIFIED Requirements

### Requirement: npm and dependency check

The env check SHALL verify npm is available and SHALL walk upward from `process.cwd()` through every
ancestor `node_modules` rather than stopping at the first incomplete directory. Common readiness SHALL
require `@napi-rs/canvas`, `pptxgenjs`, and `commander`. HTML readiness SHALL additionally require exact
`playwright@1.61.1` and exact direct `echarts@6.1.0`. Image2-only readiness SHALL NOT fail because
Playwright or ECharts is absent/mismatched, because neither package is in the whole-page Image2 adapter's
runtime closure. Exact versions SHALL be read from discovered package metadata and every selected hard
dependency failure SHALL provide project-root `npm install`/lockfile-alignment guidance.

When HTML readiness is selected, the discovered Playwright and ECharts package roots/versions SHALL be
passed in the validated runtime profile to `html-render-runtime` and `html-slide-rendering`. Those
modules SHALL load only the discovered installations and SHALL NOT repeat bare or module-relative
resolution. A nearer shadow copy SHALL not satisfy, replace, or influence the inspected profile.

#### Scenario: Dependencies installed at project root while cwd is a deck

- **WHEN** all dependencies selected by the active profile exist at a parent of a child deck cwd
- **THEN** every selected dependency check reports `ok`

#### Scenario: ECharts version drifts

- **WHEN** discovered ECharts is not exactly `6.1.0` under an HTML readiness profile
- **THEN** the dependency check fails and HTML readiness is NOT READY
- **AND** HTML renderer production cannot proceed with the mismatched package

#### Scenario: ECharts drifts under Image2-only

- **WHEN** common and Image2 dependencies are current but ECharts is missing or mismatched under `image2-only`
- **THEN** Image2-primary readiness is unaffected and no HTML runtime is entered

#### Scenario: Shadow ECharts exists near the renderer

- **WHEN** HTML readiness discovers exact `echarts@6.1.0` but a different copy is resolvable relative to the renderer module
- **THEN** chart generation uses only the discovered exact package root
- **AND** the shadow copy cannot satisfy or replace the inspected profile

#### Scenario: Empty local node_modules does not block parent packages

- **WHEN** the cwd has an incomplete `node_modules` and a parent has every selected required package
- **THEN** upward discovery continues and the parent packages are verified

### Requirement: Environment check separates production readiness profiles

`env-check.mjs` SHALL resolve exactly one production readiness profile per invocation. No selector SHALL
retain the existing common-plus-HTML default for compatibility. `--mode html-only` SHALL select common
plus HTML checks; `--mode image2-only` and compatibility `--image2` SHALL select common plus offline
Image2 presence checks; `--mode html-then-image2` SHALL select common plus blocking HTML checks and
deferred/non-blocking offline Image2 presence guidance. `--smoke` and `--probe-vendors` SHALL imply a
blocking Image2 profile when no mode is supplied, remain mutually exclusive, and retain live-probe
behavior only after presence checks pass.

Common checks SHALL include Node/npm, the common packages, framework files required by shared
production/assembly, generic font fallback observation, disk space, and advisory Git. HTML checks SHALL
add Playwright, ECharts, paired Chromium, distributed HTML-font integrity/coverage, and fixed offline
browser smoke. Image2 checks SHALL add `api_key`, `image_base_url`, and `stage2_generator`. The report
SHALL identify selected profile, `current_action_ready`, and any `deferred_not_ready` checks. Deferred
checks SHALL not alter current HTML exit status, but the same checks SHALL be blocking when an explicit
Image2/live action is selected.

#### Scenario: New user has no Image2 configuration

- **WHEN** the default compatibility HTML profile passes and no Image2 configuration exists
- **THEN** default env-check ends READY and exits 0

#### Scenario: Required ECharts is missing

- **WHEN** exact local ECharts cannot be discovered for an HTML profile
- **THEN** HTML readiness ends NOT READY with a dependency repair
- **AND** no browser or renderer work is attempted with an unknown chart runtime

#### Scenario: Explicit Image2 presence mode

- **WHEN** env-check runs with `--mode image2-only` or compatibility `--image2`
- **THEN** it runs common checks plus `api_key`, `image_base_url`, and `stage2_generator`
- **AND** it omits HTML-only checks and makes no Image2 network call

#### Scenario: HTML-then-Image2 has deferred provider setup

- **WHEN** common/HTML checks pass and Image2 presence fails under `html-then-image2`
- **THEN** current HTML readiness exits successfully and lists the Image2 failures as deferred guidance
- **AND** a later explicit Image2 action rechecks them as blocking prerequisites

### Requirement: HTML browser and font checks block only HTML readiness

After common package presence succeeds and an HTML profile is selected, env-check SHALL dynamically
enter the runtime owned by `html-render-runtime` and emit stable records for `chromium`, `html_fonts`,
and `html_runtime_smoke`. Missing/mismatched Chromium, absent/corrupt font, CSS, manifest, provenance,
or license assets, unsupported fixed sentinel coverage, network attempts, browser-launch failure, or
fixture-geometry failure SHALL be `fail` and SHALL make HTML readiness NOT READY. The checker SHALL NOT
install/download a browser or font and SHALL NOT accept OS font fallback as HTML readiness evidence.
With no run-dir, these checks SHALL NOT claim actual deck code-point coverage or pixel-overflow
validation. They SHALL not be loaded or emitted for `image2-only`.

#### Scenario: Chromium has not been installed

- **WHEN** an HTML profile selects the pinned Playwright package but paired Chromium is absent
- **THEN** `chromium` is `fail`, HTML readiness is NOT READY, and fix text identifies the explicit browser setup command
- **AND** no install or download is attempted

#### Scenario: Bundled font coverage is invalid

- **WHEN** the canonical HTML font manifest, license, digest, or sentinel coverage check fails under an HTML profile
- **THEN** `html_fonts` is `fail` and HTML readiness is NOT READY
- **AND** the checker does not hide the failure behind a system-font warning

#### Scenario: Static smoke succeeds

- **WHEN** the package-paired browser and valid distributed fonts render the fixed offline fixture with expected geometry and no network attempt
- **THEN** `html_runtime_smoke` is `ok`

#### Scenario: Base doctor has no deck coverage claim

- **WHEN** HTML readiness succeeds without a run-dir
- **THEN** its font result is scoped to the fixed sentinel corpus
- **AND** it does not assert that arbitrary slide source will fit or has complete glyph coverage

#### Scenario: Image2-only avoids the HTML runtime

- **WHEN** `image2-only` readiness is selected
- **THEN** Playwright, ECharts, Chromium, HTML fonts, and browser smoke are neither loaded nor blocking

## ADDED Requirements

### Requirement: Doctor derives readiness guidance from production mode

Root doctor SHALL pass the selected explicit mode, or the exact authoritative mode resolved from a
run, into the profile evaluator above. It SHALL NOT reimplement package/check classification. Missing
deferred readiness is a `guide` until the protected action; a selected provider submit with missing
credentials/endpoint/generator is a non-waivable authorization/security hard stop. Live `--smoke` or
`--probe-vendors` still requires disclosed selection and SHALL not authorize production generation.

#### Scenario: HTML-only doctor omits Image2 requirements

- **WHEN** run-aware doctor targets `html-only`
- **THEN** it runs common/HTML readiness and missing Image2 configuration does not block the run

#### Scenario: Image2-primary doctor checks provider presence

- **WHEN** doctor targets `image2-only` without a live flag
- **THEN** it includes offline Image2 presence checks, omits HTML-only checks, and reports bounded repair
- **AND** it makes no network request

#### Scenario: Required refinement is not silently probed

- **WHEN** doctor targets `html-then-image2` without live flags
- **THEN** it reports blocking HTML readiness plus deferred Image2 presence guidance
- **AND** it does not perform a smoke or vendor request
