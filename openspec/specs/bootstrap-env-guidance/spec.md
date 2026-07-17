## Purpose

Define the requirement that BOOTSTRAP.md Step 1 SHALL be a self-contained environment remediation guide for the Agent. It SHALL contain labeled sections for every base `env-check.mjs` check, with user-profile-aware fix instructions that are copy-pasteable by beginners. External file references SHALL be marked as human-only background reading. The BOOTSTRAP gate behavior (FOUNDATION NOT READY / NOT READY / △ warning) SHALL be preserved. Image2 first-time credential setup SHALL be self-contained in BOOTSTRAP without duplicating the full API contract from `03-tool-selection.md`. BOOTSTRAP sections SHALL stay in sync with `env-check.mjs` check names.
## Requirements
### Requirement: BOOTSTRAP Step 1 contains a failure-to-fix section for every base doctor check

BOOTSTRAP.md Step 1 SHALL contain labeled sections using each stable base `env-check.mjs` check name as the identifier. Each section SHALL provide Agent-ready remediation instructions, and the Agent SHALL be able to map a base doctor failure to a beginner-safe fix without reading another file. The covered base names SHALL include at minimum `nodejs`, `npm`, `@napi-rs/canvas`, `pptxgenjs`, `commander`, `playwright`, `chromium`, `html_fonts`, `html_runtime_smoke`, `fonts`, `disk_space`, and `git` while those checks remain in base output.

Image2-only checks (`api_key`, `image_base_url`, `stage2_generator`, `image_smoke`, `image_probe_vendors`) SHALL be grouped in a clearly optional Image2 subsection and SHALL NOT be presented as requirements for base READY. The subsection SHALL still permit direct mapping from an explicit `doctor --image2`, `--smoke`, or `--probe-vendors` failure.

#### Scenario: Agent matches doctor failure to fix via section header

- **WHEN** `ppt_flow.mjs doctor` reports `✗ nodejs: [FOUNDATION] fail`
- **AND** the Agent reads BOOTSTRAP.md Step 1
- **THEN** the Agent finds a section headed `### nodejs` with concrete supported-Node installation/upgrade commands for macOS, Linux, and Windows, naming `22.x`/`24.x`/`26.x` and recommending current LTS `24.x` for a fresh install
- **AND** the Agent presents the appropriate platform-specific commands without reading another file

#### Scenario: Multiple failures are each matched

- **WHEN** base doctor reports `✗ chromium: fail` and `✗ html_fonts: fail`
- **THEN** BOOTSTRAP provides a browser-install command under `### chromium` and framework-asset repair guidance under `### html_fonts`
- **AND** it does not tell the user to configure Image2 for either failure

#### Scenario: Missing npm packages resolved by one command

- **WHEN** doctor reports missing `@napi-rs/canvas`, `pptxgenjs`, `commander`, and `playwright`
- **THEN** each check name has a matching section but the Agent consolidates them into one `npm install` action in the repository root

#### Scenario: Explicit Image2 failures remain discoverable

- **WHEN** `doctor --image2` reports `api_key` and `image_base_url` failures
- **THEN** the Agent finds both names in the optional Image2 subsection
- **AND** explains that they block only the selected Image2 path, not base local readiness

### Requirement: Fix instructions are user-profile-aware

Each fix section in BOOTSTRAP.md Step 1 SHALL distinguish users with an existing coding agent from bare-metal users, but SHALL NOT assume that the coding-agent installation already provides a supported Node line. For the coding-agent profile, guidance SHALL verify the current Node major first, upgrade when it is outside `22.x`/`24.x`/`26.x`, then use repository-local `npm install` and Chromium setup commands. For bare-metal users, guidance SHALL install current LTS `24.x` plus npm before repository setup while naming `22.x` and `26.x` as the other supported lines. Image2 credential setup SHALL appear only when the user selects or reaches an Image2-dependent action.

#### Scenario: Agent user missing npm packages

- **WHEN** the user has Claude Code or Codex and doctor shows a supported Node major but missing npm packages
- **THEN** the Agent gives one repository-root `npm install` command and the explicit Chromium setup command
- **AND** does not tell the user to reinstall Node or configure Image2

#### Scenario: Coding-agent user has Node 20

- **WHEN** the user has a coding agent but doctor reports Node 20 below the required baseline
- **THEN** the Agent provides a platform-specific supported-Node upgrade path, recommending current LTS `24.x`, before npm/browser setup
- **AND** does not assume the coding agent's own runtime satisfies the framework

#### Scenario: Bare-metal user missing Node.js

- **WHEN** doctor reports `FOUNDATION NOT READY` and the user has no coding agent installation
- **THEN** the Agent provides full current-LTS Node.js `24.x` installation instructions per platform and names the supported `22.x`/`24.x`/`26.x` profile
- **AND** only after Node/npm are confirmed proceeds to `npm install` and Chromium setup

#### Scenario: User profile is unknown

- **WHEN** the Agent cannot determine whether the user has a coding agent installed
- **THEN** the Agent presents the verify-existing-Node path first
- **AND** follows with the bare-metal current-LTS Node 24 installation path as fallback while naming the supported `22.x`/`24.x`/`26.x` profile

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

Step 1 SHALL distinguish gate scope. FOUNDATION NOT READY (Node.js or npm missing/unsupported) and a base NOT READY result SHALL block progress into later framework work until base doctor is READY. Base warnings SHALL remain non-blocking. Image2 NOT READY SHALL block only an action that will enter the legacy Image2 remote path; it SHALL NOT revoke base READY or block local-only work. The Agent SHALL re-run the same mode that failed before entering its protected scope.

#### Scenario: Foundation failure still blocks

- **WHEN** base doctor reports `FOUNDATION NOT READY`
- **THEN** the Agent SHALL NOT proceed to Step 2
- **AND** SHALL present the inline Node/npm fix and require base doctor to confirm READY

#### Scenario: NOT READY blocks but offers clear path

- **WHEN** base doctor reports NOT READY because Chromium or required HTML fonts are unavailable
- **THEN** the Agent SHALL list each base failure with its inline fix
- **AND** SHALL NOT proceed until default doctor confirms READY

#### Scenario: Warnings allow continuation

- **WHEN** base doctor reports only advisory warnings and no hard failure
- **THEN** the Agent explains the affected optional behavior and MAY continue to Step 2

#### Scenario: Image2 failure has bounded scope

- **WHEN** default doctor is READY but `doctor --image2` is NOT READY
- **THEN** the Agent MAY continue local-only work
- **AND** SHALL repair and re-run Image2 readiness before a legacy remote image action

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP

BOOTSTRAP.md Step 1 SHALL contain sufficient optional guidance for first-time Image2 credential setup when the user chooses or reaches an Image2-dependent action: what to ask for (`IMAGE2_API_KEY` and `IMAGE2_BASE_URL`), where to write it (`.env` in deck root or repo root), how to verify presence offline (`doctor --image2`), how to offer the existing first-vendor live probe (`doctor --smoke`), and how to record non-key lessons in `_lessons/`. It SHALL explicitly say that Image2 configuration is not required for base doctor. Before any live flag, guidance SHALL require the Agent to disclose the expected provider-submit count and obtain human confirmation; successful channel diagnosis SHALL NOT be described as page-generation authorization.

BOOTSTRAP SHALL NOT duplicate the full Image2 API contract (submit/poll/download protocol, vendor resolution, async task lifecycle, or full `--probe-vendors` troubleshooting), which remains in `03-tool-selection.md`. When a live probe fails, BOOTSTRAP SHALL point to that advanced reference rather than inlining it.

#### Scenario: Base setup does not solicit credentials

- **WHEN** a new user is only repairing default doctor
- **THEN** BOOTSTRAP does not ask for `IMAGE2_API_KEY` or `IMAGE2_BASE_URL`
- **AND** identifies Image2 setup as a later optional/dependency-triggered action

#### Scenario: First-time credential setup is self-contained

- **WHEN** the user chooses an Image2-dependent path for the first time
- **THEN** the Agent can configure `.env` and run offline `doctor --image2` using only BOOTSTRAP Step 1
- **AND** can offer `doctor --smoke` only after disclosing its one expected submit and obtaining confirmation

#### Scenario: User declines the optional live probe

- **WHEN** Image2 presence is ready but the user declines the disclosed `doctor --smoke` provider submit
- **THEN** the Agent does not invoke the live flag
- **AND** does not reinterpret the decline as base or Image2-presence failure

#### Scenario: Smoke failure points to advanced reference

- **WHEN** `doctor --smoke` fails after `.env` is configured
- **THEN** BOOTSTRAP points to `03-tool-selection.md` for channel probing and advanced provider troubleshooting
- **AND** does not inline the full provider protocol

#### Scenario: Agent records non-key lessons in _lessons/

- **WHEN** the Agent overcomes an Image2 environment issue through trial and error
- **THEN** the Agent records only the non-key takeaway in `deck_*/_lessons/`
- **AND** no API key is written to the lesson

### Requirement: External file references are for human readers only, not required for agents

BOOTSTRAP.md Step 1 MAY reference `workflow/00-setup/00-zero-to-ready.md`, `workflow/00-setup/02-nodejs-environment.md`, and `workflow/00-setup/03-tool-selection.md`. These references SHALL be explicitly marked as human background reading (labeled "给人类读者的背景阅读" or similar), and the Agent SHALL NOT be required to read them to guide a user through environment repair. The BOOTSTRAP text SHALL make clear to the Agent that the inline sections are sufficient and external files are not part of the remediation path.

#### Scenario: Agent completes env fix without external files

- **WHEN** the Agent successfully guides a user through all failing doctor checks
- **THEN** the Agent has done so using only the inline sections in BOOTSTRAP.md Step 1
- **AND** has not read `00-zero-to-ready.md`, `02-nodejs-environment.md`, or `03-tool-selection.md`

#### Scenario: External reference is clearly marked for humans

- **WHEN** a human reader encounters a link to `02-nodejs-environment.md` in BOOTSTRAP Step 1
- **THEN** the link is accompanied by text indicating it is background reading for humans (e.g., "给人类读者的背景阅读")
- **AND** the Agent can skip it without missing anything needed for remediation

### Requirement: BOOTSTRAP stays in sync with env-check check names

When `env-check.mjs` adds a stable base check name, BOOTSTRAP.md Step 1 SHALL add a corresponding labeled base section in the same change. When env-check adds an Image2-only check name, BOOTSTRAP SHALL add it to the clearly optional Image2 subsection rather than the base checklist. The base BOOTSTRAP section-name set SHALL be a superset of default env-check names, and the Image2 subsection SHALL cover names emitted only by `--image2`, `--smoke`, or `--probe-vendors`.

#### Scenario: New env-check item requires BOOTSTRAP section

- **WHEN** a developer adds a new stable default check
- **THEN** a matching base section with executable remediation is added to BOOTSTRAP Step 1 in the same change

#### Scenario: Image2-only item does not become a base prerequisite

- **WHEN** a check is emitted only in Image2 mode
- **THEN** its BOOTSTRAP section appears under optional Image2 readiness
- **AND** it is not listed as a requirement for default doctor READY

#### Scenario: env-check is the authority

- **WHEN** there is a discrepancy between env-check check names and BOOTSTRAP sections
- **THEN** env-check is the check-name authority
- **AND** BOOTSTRAP is updated in the owning readiness group rather than renaming the producer to fit prose

### Requirement: BOOTSTRAP provides optional, scope-honest Git startup guidance

BOOTSTRAP.md Step 1 SHALL contain a `### git` section synchronized to the `environment-check` base check name. The section SHALL say that Git is optional for producing PPTs but recommended for user-owned source history and comparison, and that a Git-only warning permits continuing after the existing hard requirements pass. It SHALL explain that doctor observes only the directory from which it was invoked; its result does not prove that a future or separately located deck has Git protection.

The section SHALL include copy-pasteable installation and `git --version` verification commands for macOS, Linux, and Windows. It SHALL distinguish the existing coding-agent path (verify first; an absent Git executable is an optional install) from the bare-metal path (platform installation guidance), consistent with the general BOOTSTRAP profile contract. It SHALL explain that, when a user wants Git protection for a deck, the Agent and user first identify and explicitly confirm a project root containing the desired source before any user-chosen `git init`. If the Agent needs to inspect whether that target root is already inside a worktree, it SHALL obtain separate explicit authorization for that named inspection and scope; doctor does not answer it. It SHALL explicitly prohibit initialization inside `_generated/` or a single `3_versions/vN/` leaf, and SHALL say that an existing ancestor worktree must not receive a nested initialization. An unconfirmed-worktree or no-verifiable-history warning SHALL be explained as non-blocking; a first checkpoint is a user choice, not a doctor repair step. The section SHALL not direct a user to run `git status` as an environment-repair diagnostic.

#### Scenario: Agent maps Git warning to self-contained guidance

- **WHEN** doctor reports `△ git: warn`
- **THEN** the Agent finds the matching `### git` section in BOOTSTRAP Step 1
- **AND** tells the user that work may continue while offering the applicable install, current-directory, or safe-root explanation

#### Scenario: Beginner receives platform-specific Git setup commands

- **WHEN** a user has no usable Git executable
- **THEN** the BOOTSTRAP `git` section provides labeled macOS, Linux, and Windows installation commands plus `git --version` verification
- **AND** it does not require Node.js, Image2 credentials, a Git remote, or a commit to complete the Git setup advice

#### Scenario: Current worktree is not confused with deck protection

- **WHEN** doctor identifies its current invocation directory as inside a worktree
- **THEN** BOOTSTRAP guidance tells the Agent not to infer that a later or separately located deck is tracked
- **AND** it requires a user-confirmed project root before recommending a user-run initialization for that deck

#### Scenario: Existing worktree avoids nested initialization

- **WHEN** the user has confirmed that the intended project root is already inside an existing worktree
- **THEN** BOOTSTRAP guidance tells the Agent not to run a nested `git init`
- **AND** does not treat the detected worktree or a first commit as a requirement to create or continue a deck

### Requirement: Git checkpoint guidance is recommendation-only and context-bounded

BOOTSTRAP and its Agent-facing startup guidance SHALL permit an Agent to make at most one concise, user-owned source-checkpoint recommendation per continuous source-work episode after initial real source authoring, before an important structural change when the Agent knows from current interaction that it edited meaningful source, after a validated vNext, or at final delivery/archival. The guidance SHALL define an episode as the current interaction's continuous substantive source work for one deck; a decline or deferral suppresses every further reminder until that episode ends, and a later interaction or different deck begins a new episode. The guidance SHALL state that this recommendation is not authorization and does not require hidden working-tree inspection.

The Agent and framework SHALL NOT automatically initialize a repository, stage files, commit, push, pull, change a remote, run a Git restore/reset/checkout/clean/read-tree operation, discard working-tree changes, inspect worktree cleanliness, or require a clean worktree. After explicit user authorization for a named Git operation and user-supplied scope, an Agent MAY assist with that exact operation; it SHALL restate that operation and scope and SHALL NOT infer files, staged changes, or effect from hidden inspection. Ordinary checkpoint authorization does not authorize `git status`, `git diff`, or another inspection, each of which requires separately named user direction and scope. This change supplies no Git-history reader, automated source replacement, or default recovery protocol. Absent authorization it SHALL not mutate Git state. A user who declines Git installation, initialization, or checkpoint work SHALL continue the applicable deck workflow after existing hard gates pass.

#### Scenario: Agent recommends but does not create a checkpoint

- **WHEN** an Agent reaches a stated checkpoint opportunity and knows from the current interaction that source work has occurred
- **THEN** it may explain the value of preserving user-owned source history and ask whether the user wants a Git action
- **AND** neither doctor nor the pipeline probes worktree cleanliness, creates a repository, or creates a commit as a side effect

#### Scenario: User declines Git setup or checkpoint

- **WHEN** a user declines installation, initialization, or a checkpoint
- **THEN** the Agent continues the applicable deck workflow after existing hard gates pass
- **AND** it does not frame the decision as skipping Structural Versioning Path or source validation

