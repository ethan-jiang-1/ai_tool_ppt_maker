## Purpose

Define the pre-flight environment check (`scripts/env-check.mjs`) that verifies a machine is ready to run the pipeline: a zero-dependency script (Node.js built-ins only) that gates the Node.js version (>= 18), npm and the hard-required packages (`@napi-rs/canvas`, `pptxgenjs`, `commander`), the Image2 API key (`IMAGE2_API_KEY`, with OPENAI_*/APIMART_* aliases), and a hard-required image API base URL (`IMAGE2_BASE_URL` / `IMAGE2_BASE_URLS` or aliases), then emits a structured READY / NOT READY report with a matching exit code. This capability guarantees that setup problems are diagnosed with actionable messages before the pipeline runs, and that the check itself never requires `npm install` to execute.

## Requirements

### Requirement: Zero-dependency runtime check

`scripts/env-check.mjs` SHALL have zero npm dependencies. It SHALL run on any Node.js >= 18 installation without `npm install` first, using only Node.js built-in modules (`fs`, `path`, `os`, `child_process`).

#### Scenario: Run without node_modules

- **WHEN** `node scripts/env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** script executes successfully

### Requirement: Node.js version gate

The env check SHALL verify Node.js version >= 18 at startup. If older or absent, SHALL output FOUNDATION NOT READY and exit non-zero.

#### Scenario: Version check

- **WHEN** Node.js 20.0.0 is installed → version check passes
- **WHEN** Node.js 16.0.0 is installed → report shows required vs found version, exits non-zero

### Requirement: npm and dependency check

The env check SHALL verify npm is available. It SHALL verify that the hard-required packages `@napi-rs/canvas`, `pptxgenjs`, and `commander` are each present by walking **upward from `process.cwd()`** (the same upward-search strategy used for `.env` loading) and checking for `node_modules/<package>` under each ancestor. Presence MAY be determined by filesystem checks (consistent with the current checker). The checker SHALL NOT stop at the first ancestor that merely contains a `node_modules` directory if a required package path is missing there — it SHALL continue upward (Node-like). If no ancestor yields a given required package, that check SHALL fail and instruct the user to run `npm install` in the project root (the directory that owns `package.json` / `node_modules`).

#### Scenario: Dependencies installed at project root while cwd is a deck

- **WHEN** `node_modules` with the required packages exists at a parent of `process.cwd()` (for example repo root)
- **AND** the checker is invoked with `cwd` set to a child deck directory that has no local `node_modules`
- **THEN** the dependency checks for `@napi-rs/canvas`, `pptxgenjs`, and `commander` report status `ok`

#### Scenario: Dependencies missing

- **WHEN** no ancestor of `process.cwd()` contains `node_modules/<package>` for a required package
- **THEN** that dependency check reports failure
- **AND** the fix text instructs the user to run `npm install` in the project root

#### Scenario: Dependencies at cwd still work

- **WHEN** `node_modules` with the required packages exists directly in `process.cwd()`
- **THEN** `@napi-rs/canvas`, `pptxgenjs`, and `commander` are verified as present

#### Scenario: Empty local node_modules does not block parent packages

- **WHEN** `process.cwd()` contains an empty or incomplete `node_modules`
- **AND** a parent directory contains `node_modules` with the required packages
- **THEN** the dependency checks for those packages still report status `ok`

### Requirement: API key verification

The env check SHALL verify that an image-generation API key is set and non-empty. The **canonical** name SHALL be `IMAGE2_API_KEY`. Legacy aliases `OPENAI_API_KEY` and `APIMART_API_KEY` SHALL also satisfy the check. Fix text SHALL name `IMAGE2_API_KEY`.

#### Scenario: Canonical IMAGE2 key

- **WHEN** `.env` contains non-empty `IMAGE2_API_KEY`
- **THEN** `api_key` passes and detail identifies `IMAGE2_API_KEY`

#### Scenario: Legacy alias key still works

- **WHEN** only `OPENAI_API_KEY` or only `APIMART_API_KEY` is non-empty
- **THEN** `api_key` still passes

#### Scenario: Missing key

- **WHEN** none of the three key variables is non-empty
- **THEN** `api_key` fails and fix names `IMAGE2_API_KEY`

### Requirement: Image API base URL is a hard requirement

The env check SHALL require a non-empty base URL via `IMAGE2_BASE_URL` or `IMAGE2_BASE_URLS`, or legacy `OPENAI_BASE_URL` / `APIMART_BASE_URL` / `APIMART_BASE_URLS`. When none is set, `image_base_url` SHALL be **`fail`** and overall NOT READY. The check SHALL NOT claim a silent default endpoint when URL is unset. Fix text SHALL name `IMAGE2_BASE_URL`.

#### Scenario: Canonical IMAGE2 base URL

- **WHEN** `.env` contains `IMAGE2_BASE_URL=https://example/v1`
- **THEN** `image_base_url` passes

#### Scenario: BASE_URLS alone satisfies the check

- **WHEN** `.env` has non-empty `IMAGE2_BASE_URLS` and no `IMAGE2_BASE_URL`
- **THEN** `image_base_url` passes

#### Scenario: Missing base URL fails doctor

- **WHEN** a key is present but no base URL variable is set
- **THEN** `image_base_url` is `fail` and env-check is NOT READY

### Requirement: In-framework Stage 2 scripts are a hard requirement

The env check SHALL treat missing in-framework Stage 2 modules as a hard failure
when absent — not a warning. It SHALL verify these files exist under
`PPTMAKER_FRAMEWORK/scripts/`:
`stage2_generate_images.mjs`, `make_contact_sheet.mjs`, `image_api_client.mjs`.
It SHALL NOT search `.claude/skills/` or `.agents/skills/`.

#### Scenario: Scripts present

- **WHEN** the three Stage 2 modules exist under `scripts/`
- **THEN** `stage2_generator` status is `ok` and detail mentions `in-framework`

#### Scenario: Scripts missing

- **WHEN** any of the three modules is missing
- **THEN** `stage2_generator` status is `fail`, overall verdict is NOT READY, exit non-zero

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an overall verdict. Exit 0 on READY, non-zero on NOT READY.

#### Scenario: Output format

- **WHEN** all checks pass → output ends with "READY", exit 0
- **WHEN** any check fails → output ends with "NOT READY", lists all failures, exit non-zero

### Requirement: Optional --smoke performs one live credential probe

`env-check.mjs` SHALL accept `--smoke`. When set, after presence checks for API key and base URL pass, it SHALL perform one minimal live Image2 probe: POST image generation with a tiny prompt and treat **obtaining a `task_id`** as success (full image completion NOT required). Probe failure SHALL mark the check NOT READY with actionable fix text. Without `--smoke`, env-check SHALL NOT make Image2 network calls. The script SHALL remain free of npm dependencies (Node built-ins only; may dynamic-import sibling ESM helpers).

#### Scenario: --smoke fails on bad credentials

- **WHEN** key and base URL are non-empty but the API rejects the probe
- **AND** `env-check --smoke` runs
- **THEN** overall status is NOT READY
- **AND** the report indicates the smoke/probe failed

#### Scenario: --smoke succeeds on task_id without waiting for image

- **WHEN** the API accepts submit and returns a task id
- **AND** `env-check --smoke` runs
- **THEN** the smoke check passes without waiting for image completion

#### Scenario: Default doctor stays offline

- **WHEN** `env-check` runs without `--smoke`
- **THEN** it does not perform an Image2 network probe
