## Purpose

Define the pre-flight environment check (`scripts/env-check.mjs`) that verifies a machine is ready to run the pipeline: a zero-dependency script (Node.js built-ins only) that gates the Node.js version (>= 18), npm and the hard-required packages (`@napi-rs/canvas`, `pptxgenjs`, `commander`), and the `OPENAI_API_KEY`, then emits a structured READY / NOT READY report with a matching exit code. This capability guarantees that setup problems are diagnosed with actionable messages before the pipeline runs, and that the check itself never requires `npm install` to execute.

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

The env check SHALL verify `OPENAI_API_KEY` is set in `.env` and is non-empty.

#### Scenario: API key

- **WHEN** `.env` contains `OPENAI_API_KEY=sk-...` → check passes
- **WHEN** `.env` is absent or value is empty → report explains how to configure

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
