## Purpose

Define the pre-flight environment check (`scripts/env-check.mjs`) that verifies a machine is ready to run the pipeline: a zero-dependency script (Node.js built-ins only) that gates the Node.js version (>= 18), npm and all declared dependencies, and the `OPENAI_API_KEY`, then emits a structured READY / NOT READY report with a matching exit code. This capability guarantees that setup problems are diagnosed with actionable messages before the pipeline runs, and that the check itself never requires `npm install` to execute.

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

The env check SHALL verify npm is available. If `package.json` exists, SHALL verify all listed dependencies are importable.

#### Scenario: Dependencies

- **WHEN** `npm install` has been run → `@napi-rs/canvas`, `pptxgenjs`, `commander` verified
- **WHEN** `node_modules/` is missing → report instructs user to run `npm install`

### Requirement: API key verification

The env check SHALL verify `OPENAI_API_KEY` is set in `.env` and is non-empty.

#### Scenario: API key

- **WHEN** `.env` contains `OPENAI_API_KEY=sk-...` → check passes
- **WHEN** `.env` is absent or value is empty → report explains how to configure

### Requirement: image2-ppt skill is a hard requirement

The env check SHALL treat the Stage-2 generator skill (`image2-ppt/scripts/generate_full_page_images.py`) as a hard failure when missing — not a warning. Discovery SHALL search `.claude/skills/` and `.agents/skills/` under cwd parents and the user home directory.

#### Scenario: Skill missing

- **WHEN** the skill script is not found in any skills directory
- **THEN** `stage2_generator` status is `fail`, overall verdict is NOT READY, exit non-zero

#### Scenario: Skill present

- **WHEN** the skill script exists under `.claude/skills/image2-ppt/` (or `.agents/skills/`)
- **THEN** `stage2_generator` status is `ok`

### Requirement: Structured READY/NOT READY output

The env check SHALL output a structured report with per-check status and an overall verdict. Exit 0 on READY, non-zero on NOT READY.

#### Scenario: Output format

- **WHEN** all checks pass → output ends with "READY", exit 0
- **WHEN** any check fails → output ends with "NOT READY", lists all failures, exit non-zero
