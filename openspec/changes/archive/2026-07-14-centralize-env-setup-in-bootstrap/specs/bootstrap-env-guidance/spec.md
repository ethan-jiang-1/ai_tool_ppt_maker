## ADDED Requirements

### Requirement: BOOTSTRAP Step 1 contains a failure-to-fix section for every base doctor check

BOOTSTRAP.md Step 1 SHALL contain labeled sections (using markdown headers with the check name as identifier, e.g., `### nodejs`, `### npm`, `### api_key`) for every base check performed by `env-check.mjs`. Each section SHALL provide Agent-ready remediation instructions. The Agent SHALL be able to match a failing check name from the doctor output to the corresponding section header and present the fix to the user without reading any other file. The check names covered SHALL include at minimum: `nodejs`, `npm`, `api_key`, `image_base_url`, `@napi-rs/canvas`, `pptxgenjs`, `commander`, `stage2_generator`, `fonts`, `disk_space`.

#### Scenario: Agent matches doctor failure to fix via section header

- **WHEN** `ppt_flow.mjs doctor` reports `✗ nodejs: [FOUNDATION] fail`
- **AND** the Agent reads BOOTSTRAP.md Step 1
- **THEN** the Agent finds a section headed `### nodejs` with concrete installation commands for macOS, Linux, and Windows
- **AND** the Agent presents the appropriate platform-specific commands to the user without reading any other file

#### Scenario: Multiple failures are each matched

- **WHEN** doctor reports `✗ api_key: fail` and `✗ image_base_url: fail` simultaneously
- **THEN** the Agent finds both `### api_key` and `### image_base_url` sections
- **AND** recognizes both are resolved by creating one `.env` file with both variables
- **AND** presents a single consolidated fix to the user

#### Scenario: Missing npm packages resolved by one command

- **WHEN** doctor reports `✗ @napi-rs/canvas: fail`, `✗ pptxgenjs: fail`, and `✗ commander: fail`
- **THEN** each check name has its own section, but the Agent recognizes all three resolve via a single `npm install`
- **AND** tells the user to run one command rather than three separate fixes

### Requirement: Fix instructions are user-profile-aware

Each fix section in BOOTSTRAP.md Step 1 SHALL distinguish between users who already have a coding agent installed (Claude Code / Codex — who therefore already have Node.js 18+ and npm) and users who do not (bare-metal, no Node.js). For the agent-user profile, the fix SHALL focus on `npm install` and API key setup and SHALL NOT include "install Node.js first" steps. For bare-metal users, the fix SHALL include full Node.js installation steps before any framework-specific setup.

#### Scenario: Agent user missing npm packages

- **WHEN** doctor reports `✗ @napi-rs/canvas: fail`
- **AND** the user indicates they are using Claude Code or Codex
- **THEN** the Agent tells the user to run `npm install` in the repo root (one command)
- **AND** does NOT tell them to install Node.js first

#### Scenario: Bare-metal user missing Node.js

- **WHEN** doctor reports `⛔ FOUNDATION NOT READY` (Node.js missing or too old)
- **AND** the user does not have a coding agent installed
- **THEN** the Agent provides full installation instructions per platform
- **AND** only after Node.js is confirmed, proceeds to `npm install` and API key setup

#### Scenario: User profile is unknown

- **WHEN** the Agent cannot determine whether the user has a coding agent installed
- **THEN** the Agent presents the agent-user path first ("如果你在用 Claude Code 或 Codex…")
- **AND** follows with the bare-metal path as fallback ("如果你还没有安装 AI coding agent…")

### Requirement: Fix instructions are copy-pasteable by beginners

Each fix instruction SHALL use concrete, copy-pasteable commands in fenced code blocks. It SHALL NOT use abstract descriptions like "install the required packages" without the exact command. Platform-specific alternatives SHALL be clearly labeled. Where a single command works across platforms, only one code block SHALL be shown.

#### Scenario: Beginner copies a fix command

- **WHEN** the user sees a fix instruction in the Agent's response
- **THEN** the instruction includes at least one fenced code block with the exact command to copy and paste
- **AND** multi-platform variants are labeled (e.g., "macOS / Linux:" and "Windows PowerShell:")

#### Scenario: No abstract placeholders

- **WHEN** reviewing any fix instruction in BOOTSTRAP.md Step 1
- **THEN** no fix instruction says "ensure the packages are installed" without providing the specific `npm install` command
- **AND** every required action has a corresponding executable command

### Requirement: BOOTSTRAP gate behavior is preserved

The hard gate behavior of Step 1 SHALL be preserved: FOUNDATION NOT READY (Node.js or npm missing) SHALL still block all progress into Step 2. NOT READY (deps/key/scripts missing) SHALL also block progress. Warnings (△) SHALL allow continuation with a note. The new inline guidance SHALL only change HOW the Agent guides the user through fixes — not WHEN the gate blocks.

#### Scenario: Foundation failure still blocks

- **WHEN** doctor reports `⛔ FOUNDATION NOT READY`
- **THEN** the Agent SHALL NOT proceed to Step 2 under any circumstances
- **AND** the Agent SHALL present the inline fix guidance from BOOTSTRAP Step 1
- **AND** SHALL require the user to re-run doctor and confirm READY before continuing

#### Scenario: Warnings allow continuation

- **WHEN** doctor reports only `△` warnings (e.g., fonts not found) and no failures
- **THEN** the Agent SHALL explain what may be affected (e.g., "Stage 3 will use a fallback sans-serif font")
- **AND** SHALL offer to continue to Step 2
- **AND** the user MAY choose to proceed or fix the warning first

#### Scenario: NOT READY blocks but offers clear path

- **WHEN** doctor reports `✗ NOT READY` (foundation OK but hard requirement failed)
- **THEN** the Agent SHALL list each failure with its fix from the corresponding section
- **AND** SHALL NOT proceed to Step 2 until all failures are resolved and doctor confirms READY

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP

BOOTSTRAP.md Step 1 SHALL contain sufficient guidance for first-time Image2 credential setup: what to ask the user (`IMAGE2_API_KEY` and `IMAGE2_BASE_URL`), where to write it (`.env` in deck root or repo root), and how to verify (`doctor --smoke`). It SHALL NOT duplicate the full Image2 API contract (submit/poll/download protocol, vendor resolution, async task lifecycle, `--probe-vendors` channel probing, `_lessons/image2-proven.yaml` recording). Those remain in `03-tool-selection.md`. When smoke fails, BOOTSTRAP SHALL point to `03-tool-selection.md` for advanced troubleshooting rather than inlining it.

#### Scenario: First-time credential setup is self-contained

- **WHEN** the Agent guides a user through setting up Image2 credentials for the first time
- **THEN** the Agent uses only the inline guidance in BOOTSTRAP.md Step 1
- **AND** does not need to open `03-tool-selection.md`

#### Scenario: Smoke failure points to advanced reference

- **WHEN** `doctor --smoke` fails after the user has configured `.env`
- **THEN** BOOTSTRAP tells the Agent to suggest swapping `--base-url` or trying alternate credentials
- **AND** points to `03-tool-selection.md` for `--probe-vendors` channel probing (not inlined)

#### Scenario: API contract reference is untouched

- **WHEN** a developer or agent reads `workflow/01-visual/README.md` and follows its link to `03-tool-selection.md` for image generation API configuration
- **THEN** the link still works
- **AND** `03-tool-selection.md` still contains the complete Image2 contract documentation

### Requirement: External file references are for human readers only, not required for agents

BOOTSTRAP.md Step 1 MAY reference `workflow/00-setup/00-zero-to-ready.md`, `workflow/00-setup/02-nodejs-environment.md`, and `workflow/00-setup/03-tool-selection.md`. These references SHALL be explicitly marked as human background reading (labeled "给人类读者的背景阅读" or similar), and the Agent SHALL NOT be required to read them to guide a user through environment repair. The BOOTSTRAP text SHALL make clear to the Agent that the inline sections are sufficient and external files are not part of the remediation path.

#### Scenario: Agent completes env fix without external files

- **WHEN** the Agent successfully guides a user through all failing doctor checks
- **THEN** the Agent has done so using only the inline sections in BOOTSTRAP.md Step 1
- **AND** has not read `00-zero-to-ready.md`, `02-nodejs-environment.md`, or `03-tool-selection.md`

#### Scenario: External reference is clearly marked for humans

- **WHEN** a human reader encounters a link to `02-nodejs-environment.md` in BOOTSTRAP Step 1
- **THEN** the link is accompanied by text indicating it is background reading for humans (e.g., "给人类读者的背景阅读：为什么需要 Node.js？")
- **AND** the Agent can skip it without missing anything needed for remediation

### Requirement: BOOTSTRAP stays in sync with env-check check names

When `env-check.mjs` adds a new base check (a new stable `check` name in the non-`--smoke`/`--probe-vendors` output), BOOTSTRAP.md Step 1 SHALL add a corresponding labeled section for that check name. This SHALL happen in the same change or an immediately following change. The set of check names covered by BOOTSTRAP sections SHALL be a superset of the check names emitted by the base env-check run.

#### Scenario: New env-check item requires BOOTSTRAP section

- **WHEN** a developer adds a new base check (e.g., `git`) to `env-check.mjs`
- **THEN** a corresponding `### git` section SHALL be added to BOOTSTRAP.md Step 1
- **AND** the section SHALL include both agent-user and bare-metal remediation paths

#### Scenario: env-check is the authority

- **WHEN** there is a discrepancy between env-check's check names and BOOTSTRAP's sections
- **THEN** env-check.mjs is the authority (it defines what gets checked)
- **AND** the fix is to update BOOTSTRAP, not to change env-check's check names to match BOOTSTRAP
