## ADDED Requirements

### Requirement: Zero-dependency runtime check

`00-env-check.mjs` SHALL have zero npm dependencies. It SHALL run on any Node.js >= 18 installation without `npm install` first, using only Node.js built-in modules (`fs`, `path`, `os`, `child_process`).

#### Scenario: Run without node_modules

- **WHEN** `node workflow/00-setup/00-env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** script executes successfully

### Requirement: Node.js version gate

The env check SHALL verify Node.js version >= 18 at startup. If older or absent, SHALL output FOUNDATION NOT READY and exit non-zero.

#### Scenario: Version check

- **WHEN** Node.js 20.0.0 is installed → version check passes
- **WHEN** Node.js 16.0.0 is installed → report shows required vs found version, exits non-zero

### Requirement: npm and dependency check

The env check SHALL verify npm is available. If `package.json` exists, SHALL verify all listed dependencies are importable.

#### Scenario: Dependencies

- **WHEN** `npm install` has been run → `@napi-rs/canvas`, `pptxgenjs`, `commander` verified
- **WHEN** `node_modules/` is missing → report instructs user to run `npm install`

### Requirement: API key verification

The env check SHALL verify `OPENAI_API_KEY` is set in `.env` and is non-empty.

#### Scenario: API key

- **WHEN** `.env` contains `OPENAI_API_KEY=sk-...` → check passes
- **WHEN** `.env` is absent or value is empty → report explains how to configure

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an overall verdict. Exit 0 on READY, non-zero on NOT READY.

#### Scenario: Output format

- **WHEN** all checks pass → output ends with "READY", exit 0
- **WHEN** any check fails → output ends with "NOT READY", lists all failures, exit non-zero
