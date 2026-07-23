## Purpose

Define the requirement that BOOTSTRAP.md Step 1 SHALL be a self-contained environment remediation guide for the Agent. It covers base local HTML readiness through `scripts/00-setup/env-check.mjs`, optional legacy Image2 readiness, and labeled user-profile-aware remediation for every emitted check.
## Requirements
### Requirement: BOOTSTRAP presents production mode before mode-specific readiness

After foundation repair, BOOTSTRAP SHALL explain the three production modes, identify
`image2-only` as the new-deck default, and let the Agent carry an explicit user selection into
`ppt_flow init --mode`. It SHALL describe `html-only` as the local deterministic route,
`html-then-image2` as local HTML delivery plus required authorized visual-slot refinement, and
`image2-only` as first-class whole-page Image2 production. The explanation SHALL not claim that HTML
is permanently text-only or that Image2-primary is legacy maintenance.

The Agent SHALL run `doctor --mode <mode>` before init and the readiness profile protecting each later
action. Environment repair is
mechanical and SHALL proceed through the existing checker/fix/rerun path; semantic mode selection and
provider authorization remain human-owned. A mode choice SHALL not itself authorize a live probe or
production request.

#### Scenario: New user accepts the default

- **WHEN** foundation is ready and the user does not request another mode
- **THEN** BOOTSTRAP proceeds toward `init --mode image2-only` and offline Image2 readiness
- **AND** it discloses the later provider authorization boundary

#### Scenario: User chooses local HTML

- **WHEN** the user selects `html-only`
- **THEN** BOOTSTRAP requires common/HTML readiness only and does not solicit Image2 credentials

#### Scenario: User chooses HTML then refinement

- **WHEN** the user selects `html-then-image2`
- **THEN** BOOTSTRAP establishes common/HTML readiness and explains deferred Image2 readiness/authorization
### Requirement: BOOTSTRAP uses the Phase 0 environment interface

BOOTSTRAP SHALL present `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor` as the canonical normal environment command after dependencies are installed. It SHALL document `node PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs` as the registered pre-install recovery checker when Commander or another npm dependency is unavailable, then return to root doctor guidance. The old flat env-check path SHALL not appear. The relocation preserves base/Image2 modes, check names, repair guidance, gate scope, and beginner behavior.

#### Scenario: Commander is not installed yet

- **WHEN** BOOTSTRAP diagnoses a missing npm dependency before root CLI can load
- **THEN** it gives the direct Phase-0 recovery invocation and returns to root doctor after repair

### Requirement: BOOTSTRAP Step 1 covers every selected doctor-profile check

BOOTSTRAP Step 1 SHALL contain a labeled failure-to-fix section for every stable check in the common,
HTML, and Image2 profiles. Common repair covers Node/npm/common packages/framework files and advisory
checks. HTML repair covers exact `playwright@1.61.1`, exact direct `echarts@6.1.0`, paired Chromium,
bundled HTML fonts, and offline runtime smoke. Image2 repair covers credentials, endpoint, and the
in-framework whole-page generator. Each selected blocking section SHALL explain required versus found
state, provide a copy-pasteable local repair, and rerun the same profile. Exact ECharts repair SHALL
direct lockfile-aligned project-root installation and SHALL not suggest CDN/browser script use.

#### Scenario: ECharts is missing or mismatched

- **WHEN** an HTML doctor profile reports the ECharts check failed
- **THEN** BOOTSTRAP provides an exact `echarts@6.1.0` project-root/lockfile repair and rerun command
- **AND** does not route to provider credentials or remote chart loading

#### Scenario: Image2 is absent for a fresh deck

- **WHEN** common/HTML checks pass, the selected mode is `html-only`, and Image2 configuration is absent
- **THEN** BOOTSTRAP proceeds with local HTML creation without treating provider setup as a blocker

#### Scenario: Image2 is absent for the default mode

- **WHEN** common checks pass but selected/default `image2-only` lacks Image2 presence readiness
- **THEN** BOOTSTRAP gives the bounded offline credential/endpoint repair before provider production
- **AND** it does not run a live probe or claim production authorization

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

Step 1 SHALL distinguish gate scope. FOUNDATION NOT READY (Node.js or npm missing/unsupported) SHALL
block all later framework work. Common NOT READY blocks every mode; HTML NOT READY blocks only HTML
production; Image2 NOT READY blocks `image2-only` provider work and the provider-dependent portion of
`html-then-image2`. For `html-then-image2`, missing Image2 presence before HTML work is deferred guide
output rather than a current hard failure. Warnings remain non-blocking. The Agent SHALL rerun the same
profile that failed before entering its protected scope.

#### Scenario: Foundation failure still blocks

- **WHEN** base doctor reports `FOUNDATION NOT READY`
- **THEN** the Agent SHALL NOT proceed to Step 2
- **AND** SHALL present the inline Node/npm fix and require base doctor to confirm READY

#### Scenario: NOT READY blocks but offers clear path

- **WHEN** the selected HTML profile reports NOT READY because Chromium or HTML fonts are unavailable
- **THEN** the Agent SHALL list each HTML failure with its inline fix
- **AND** SHALL NOT enter HTML production until the same profile confirms READY

#### Scenario: Warnings allow continuation

- **WHEN** base doctor reports only advisory warnings and no hard failure
- **THEN** the Agent explains the affected optional behavior and MAY continue to Step 2

#### Scenario: Image2 failure has bounded scope

- **WHEN** common readiness is READY but offline Image2 readiness is NOT READY
- **THEN** the Agent MAY continue `html-only` or other local work
- **AND** SHALL repair and rerun Image2 readiness before whole-page generation or required refinement submit

### Requirement: Image2 first-time credential setup is self-contained in BOOTSTRAP

BOOTSTRAP Step 1 SHALL provide self-contained Image2 presence setup when the selected/default mode is
`image2-only`, when `html-then-image2` approaches required refinement, or when a user explicitly enters
historical whole-page maintenance. An `html-only` refinement request first changes mode and then uses
the required-refinement path. BOOTSTRAP SHALL give the `.env` location,
`doctor --mode image2-only` (with `doctor --image2` retained as a compatibility alias),
`IMAGE2_API_KEY`/`IMAGE2_BASE_URL` repair, and the distinction between offline
presence, disclosed live diagnostics, and exact production authorization. Init or mode selection SHALL
not count as a provider authorization.

For `html-only`, BOOTSTRAP SHALL proceed after common/HTML readiness without soliciting credentials; an
explicit later refinement request first receives the mode switch to `html-then-image2`, then the
existing exact-plan authorization explanation. For
`image2-only`, guidance SHALL describe whole-page Image2 as the primary renderer reached through normal
pilot/build, not modern visual-slot refinement. Historical explicit whole-page compatibility MAY retain its
maintenance label, but uses the same bounded credential authority.

#### Scenario: Fresh user starts an Image2-primary deck

- **WHEN** common readiness passes and the user accepts `image2-only`
- **THEN** BOOTSTRAP provides offline credential presence setup before provider-backed pilot/build
- **AND** does not perform a live request or record production authorization

#### Scenario: Fresh user starts an HTML deck

- **WHEN** common/HTML readiness passes and the user selects `html-only`
- **THEN** BOOTSTRAP proceeds without asking for Image2 credentials or live probes

#### Scenario: User elects optional refinement

- **WHEN** an `html-only` user explicitly requests refinement
- **THEN** BOOTSTRAP explains the required same-pipeline mode switch, deferred Image2 readiness, and exact authorization before submission

#### Scenario: User reaches required refinement

- **WHEN** `html-then-image2` reaches its provider-dependent refinement step
- **THEN** BOOTSTRAP/controller explains offline readiness and exact authorization before submission

#### Scenario: Legacy deck requires Image2 maintenance

- **WHEN** a historical explicit whole-page deck enters explicit compatibility maintenance
- **THEN** the Agent can discover the same scoped offline setup without relabeling the new primary flow as legacy

#### Scenario: User declines a legacy live probe

- **WHEN** the user declines the disclosed provider diagnostic submit
- **THEN** no live flag runs and offline/current-profile readiness facts remain unchanged

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

### Requirement: BOOTSTRAP stays in sync with environment readiness profiles

When `env-check.mjs` adds, moves, or changes a stable check name/profile, BOOTSTRAP Step 1 SHALL update
the matching labeled repair in the same change. Exact ECharts SHALL remain an HTML check and repair
alongside Playwright/Chromium/fonts, not an Image2-only blocker. Checks emitted only by Image2 profiles,
`--smoke`, or
`--probe-vendors` SHALL remain under Image2 readiness and SHALL be described as applicable to
`image2-only`, required refinement after the explicit mode switch, or historical maintenance rather than as
globally optional legacy checks. `env-check` remains the check-name/ownership authority; prose SHALL
match its owning readiness group.

#### Scenario: Base ECharts check is added

- **WHEN** the stable default/HTML report includes exact ECharts readiness
- **THEN** BOOTSTRAP's HTML section includes the same named check and executable remediation

#### Scenario: Image2-only check appears

- **WHEN** a check is emitted only in Image2 mode
- **THEN** it is absent from the base prerequisite list and documented under Image2 readiness
- **AND** its blocking scope is tied to the selected Image2-dependent action

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

### Requirement: BOOTSTRAP repairs the complete local HTML delivery prerequisites

BOOTSTRAP SHALL map every base doctor/package/runtime/font/browser failure, including exact ECharts, to copy-pasteable local repair guidance and SHALL explain that per-run source/config/catalog/overflow failures are repaired through `ppt_flow validate` or HTML preview diagnostics rather than environment credentials. It SHALL route the Agent from BOOTSTRAP into final `00-setup` and the pipeline-specific playbook.

#### Scenario: Runtime is ready but a slide overflows

- **WHEN** doctor passes and HTML composition reports pixel overflow
- **THEN** BOOTSTRAP/controller treats it as a run source/layout repair
- **AND** does not ask for Image2 or reinstall the browser
