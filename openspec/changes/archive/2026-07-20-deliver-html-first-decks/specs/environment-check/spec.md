## MODIFIED Requirements

### Requirement: npm and dependency check

The env check SHALL verify npm is available. It SHALL verify that hard-required packages `@napi-rs/canvas`, `pptxgenjs`, `commander`, exact `playwright@1.61.1`, and exact direct `echarts@6.1.0` are each present by walking upward from `process.cwd()` and checking `node_modules/<package>` under every ancestor until found. It SHALL NOT stop at the first incomplete `node_modules`. Exact versions SHALL be read from the discovered package metadata. A missing package or version mismatch SHALL fail with project-root `npm install`/lockfile-alignment guidance.

The discovered Playwright and ECharts package roots/versions SHALL be passed in the validated runtime profile to `html-render-runtime` and `html-slide-rendering`. Those modules SHALL load the exact discovered installations and SHALL NOT repeat bare or module-relative resolution. A nearer shadow copy SHALL not satisfy, replace, or influence the inspected profile.

#### Scenario: Dependencies installed at project root while cwd is a deck

- **WHEN** all required packages exist at a parent of a child deck cwd
- **THEN** every dependency check, including exact Playwright and ECharts, reports `ok`

#### Scenario: ECharts version drifts

- **WHEN** discovered ECharts is not exactly `6.1.0`
- **THEN** the dependency check fails and base readiness is NOT READY
- **AND** renderer production cannot proceed with the mismatched package

#### Scenario: Shadow ECharts exists near the renderer

- **WHEN** cwd discovery selects exact `echarts@6.1.0` but a different copy is resolvable relative to the renderer module
- **THEN** chart generation uses only the discovered exact package root
- **AND** the shadow copy cannot satisfy or replace the inspected profile

#### Scenario: Empty local node_modules does not block parent packages

- **WHEN** the cwd has an incomplete `node_modules` and a parent has every required package
- **THEN** upward discovery continues and the parent packages are verified

### Requirement: Environment check separates base and Image2 readiness modes

`env-check.mjs` SHALL resolve one readiness mode per invocation. An invocation without `--image2`, `--smoke`, or `--probe-vendors` SHALL run base checks only. `--image2` SHALL run base checks plus Image2 presence checks and remain offline. `--smoke` and `--probe-vendors` SHALL imply Image2 mode, remain mutually exclusive, and retain their live-probe behavior after presence checks pass.

Base checks SHALL include Node/npm, required local framework packages including exact `playwright@1.61.1` and exact direct `echarts@6.1.0`, matching installed Chromium, distributed HTML-font integrity/coverage, fixed offline browser smoke, and advisory checks. Base checks SHALL omit `api_key`, `image_base_url`, and `stage2_generator`. Missing or mismatched ECharts SHALL make base readiness NOT READY; missing Image2 configuration SHALL not.

#### Scenario: New user has no Image2 configuration

- **WHEN** all local/base requirements including exact ECharts pass and no Image2 configuration exists
- **THEN** default env-check ends READY and exits 0

#### Scenario: Required ECharts is missing

- **WHEN** exact local ECharts cannot be discovered
- **THEN** default env-check ends NOT READY with a base dependency repair
- **AND** no browser or renderer work is attempted with an unknown chart runtime

#### Scenario: Explicit Image2 presence mode

- **WHEN** env-check runs with `--image2`
- **THEN** it runs all base checks plus `api_key`, `image_base_url`, and `stage2_generator`
- **AND** makes no Image2 network call

