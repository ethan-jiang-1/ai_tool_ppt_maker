## ADDED Requirements

### Requirement: Bootstrap guidance names the canonical Harness entry

Bootstrap and top-level onboarding guidance SHALL identify
`ppt_maker_harness/BOOTSTRAP.md` as the Harness startup document and
`ppt_maker_harness/scripts/ppt_flow.mjs` as the canonical production entrypoint.
It SHALL not present a retired source root as a supported startup path.

#### Scenario: An Agent begins Harness startup

- **WHEN** an Agent follows active onboarding for PPT work or local readiness
- **THEN** it enters through the Harness BOOTSTRAP document and its current CLI
  entrypoint
- **AND** it does not infer a production Run Bundle or compatibility route

### Requirement: Fix instructions are user-profile-aware

Each fix section in BOOTSTRAP.md Step 1 SHALL distinguish users with an existing coding agent from bare-metal users, but SHALL NOT assume that the coding-agent installation already provides a supported Node line. For the coding-agent profile, guidance SHALL verify the current Node major first, upgrade when it is outside `22.x`/`24.x`/`26.x`, then use repository-local `npm install` and Chromium setup commands. For bare-metal users, guidance SHALL install current LTS `24.x` plus npm before repository setup while naming `22.x` and `26.x` as the other supported lines. Image2 credential setup SHALL appear only when the user selects or reaches an Image2-dependent action.

#### Scenario: Agent user missing npm packages

- **WHEN** the user has Claude Code or Codex and doctor shows a supported Node major but missing npm packages
- **THEN** the Agent gives one repository-root `npm install` command and the explicit Chromium setup command
- **AND** does not tell the user to reinstall Node or configure Image2

#### Scenario: Coding-agent user has Node 20

- **WHEN** the user has a coding agent but doctor reports Node 20 below the required baseline
- **THEN** the Agent provides a platform-specific supported-Node upgrade path, recommending current LTS `24.x`, before npm/browser setup
- **AND** does not assume the coding agent's own runtime satisfies the Harness

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

### Requirement: External file references are for human readers only, not required for agents

BOOTSTRAP.md Step 1 MAY reference `workflow/00-setup/00-zero-to-ready.md`, `workflow/00-setup/02-nodejs-environment.md`, and `workflow/00-setup/03-runtime-and-tools.md`. These references SHALL be explicitly marked as human background reading (labeled "给人类读者的背景阅读" or similar), and the Agent SHALL NOT be required to read them to guide a user through environment repair. The BOOTSTRAP text SHALL make clear to the Agent that the inline sections are sufficient and external files are not part of the remediation path.

#### Scenario: Agent completes env fix without external files

- **WHEN** the Agent successfully guides a user through all failing doctor checks
- **THEN** the Agent has done so using only the inline sections in BOOTSTRAP.md Step 1
- **AND** has not read `00-zero-to-ready.md`, `02-nodejs-environment.md`, or `03-runtime-and-tools.md`

#### Scenario: External reference is clearly marked for humans

- **WHEN** a human reader encounters a link to `02-nodejs-environment.md` in BOOTSTRAP Step 1
- **THEN** the link is accompanied by text indicating it is background reading for humans (e.g., "给人类读者的背景阅读")
- **AND** the Agent can skip it without missing anything needed for remediation

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

The Agent and Harness SHALL NOT automatically initialize a repository, stage files, commit, push, pull, change a remote, run a Git restore/reset/checkout/clean/read-tree operation, discard working-tree changes, inspect worktree cleanliness, or require a clean worktree. After explicit user authorization for a named Git operation and user-supplied scope, an Agent MAY assist with that exact operation; it SHALL restate that operation and scope and SHALL NOT infer files, staged changes, or effect from hidden inspection. Ordinary checkpoint authorization does not authorize `git status`, `git diff`, or another inspection, each of which requires separately named user direction and scope. This change supplies no Git-history reader, automated source replacement, or default recovery protocol. Absent authorization it SHALL not mutate Git state. A user who declines Git installation, initialization, or checkpoint work SHALL continue the applicable deck workflow after existing hard gates pass.

#### Scenario: Agent recommends but does not create a checkpoint

- **WHEN** an Agent reaches a stated checkpoint opportunity and knows from the current interaction that source work has occurred
- **THEN** it may explain the value of preserving user-owned source history and ask whether the user wants a Git action
- **AND** neither doctor nor the pipeline probes worktree cleanliness, creates a repository, or creates a commit as a side effect

#### Scenario: User declines Git setup or checkpoint

- **WHEN** a user declines installation, initialization, or a checkpoint
- **THEN** the Agent continues the applicable deck workflow after existing hard gates pass
- **AND** it does not frame the decision as skipping Structural Versioning Path or source validation

### Requirement: Bootstrap exposes current Page Image Workflow readiness without false local-refresh claims

Active BOOTSTRAP and top-level onboarding SHALL describe operation-scoped
readiness only for the current `page-image-workflow` contract declared by the
schema serialization inventory. They SHALL state that ordinary foundation
checks are offline, credentials are needed only when the selected operation
submits to Image2, and live Image2 work is either `ppt_flow probe <run-dir>`
for a confirmed Call Shape or Image2 Lab for candidate discovery. They SHALL
NOT name `env-check --smoke`, `--probe-vendors`, a version-suffixed, retired,
compatibility, or alternative production contract as current live work.

#### Scenario: An Agent starts current raw-generation readiness

- **WHEN** BOOTSTRAP directs an Agent to prepare current Page Image raw work
- **THEN** it names the one schema-declared current workflow and the applicable
  operation-scoped credential check
- **AND** it does not present a historical or parallel workflow as usable input

#### Scenario: Framed local readiness is scoped correctly

- **WHEN** a user prepares only local Framed work
- **THEN** guidance distinguishes local readiness from Image2 submission readiness
- **AND** it does not imply an obsolete workflow contract

#### Scenario: Fresh onboarding selects a current policy later

- **WHEN** onboarding completes before a workflow is selected
- **THEN** it defers that choice to the current source-authoring step
- **AND** it does not preselect a historical marker

#### Scenario: Live Image2 is probe or Lab

- **WHEN** BOOTSTRAP covers Image2 connectivity or vendor-call discovery
- **THEN** it names `ppt_flow probe` or Lab rather than env-check live flags
- **AND** it states that empty `_lab/` does not block drawing

### Requirement: Public initialization guidance has one supported command entry

Active user and Agent onboarding SHALL name `ppt_flow init` as the supported
public command for creating a Run Bundle. It MAY identify
`bundle_layout.mjs --init` as the layout owner's lower-level interface, but
SHALL not present it as a competing user startup route, a different Run Bundle
contract, or an alternative workflow initializer.

#### Scenario: A new Deck Author starts a Run Bundle

- **WHEN** onboarding guidance directs a new Deck Author to create a Run Bundle
- **THEN** it presents the current `ppt_flow init` route
- **AND** any layout-owner reference preserves the same current initialization
  contract without requiring the person to choose an initializer
