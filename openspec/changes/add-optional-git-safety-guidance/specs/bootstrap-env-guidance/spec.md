## ADDED Requirements

### Requirement: BOOTSTRAP provides optional Git startup guidance

BOOTSTRAP.md Step 1 SHALL contain a `### git` section synchronized to the `environment-check` base check name. The section SHALL say that Git is optional for producing PPTs but recommended for source history, comparison, and recovery, and that a Git-only warning permits continuing after the existing hard requirements pass.

The section SHALL include copy-pasteable installation and `git --version` verification commands for macOS, Linux, and Windows. It SHALL explain that, when Git is available but the current directory is outside a worktree, the Agent and user first identify and confirm a project root containing the desired source before any `git init`. It SHALL explicitly prohibit initialization inside `_generated/` or a single `3_versions/vN/` leaf, and SHALL say that an already detected ancestor worktree must not receive a nested initialization.

#### Scenario: Agent maps Git warning to self-contained guidance

- **WHEN** doctor reports `△ git: warn`
- **THEN** the Agent finds the matching `### git` section in BOOTSTRAP Step 1
- **AND** tells the user that work may continue while offering the appropriate install or safe-root path

#### Scenario: Beginner receives platform-specific Git setup commands

- **WHEN** a user has no usable Git executable
- **THEN** the BOOTSTRAP `git` section provides labeled macOS, Linux, and Windows installation commands plus `git --version` verification
- **AND** it does not require Node.js, Image2 credentials, or a Git remote to complete the Git setup advice

#### Scenario: Existing worktree avoids nested initialization

- **WHEN** doctor identifies the current directory as inside a worktree
- **THEN** BOOTSTRAP guidance tells the Agent not to run a nested `git init`
- **AND** does not treat the detected worktree as a requirement to create a commit before continuing

### Requirement: Git checkpoint guidance is recommendation-only

BOOTSTRAP and its Agent-facing startup guidance SHALL permit an Agent to recommend a user-owned source checkpoint after initial real source authoring, before important structural work with meaningful uncommitted source changes, after a validated vNext, or at final delivery/archival. The guidance SHALL state that recommendation is not authorization: the Agent and framework SHALL NOT automatically initialize a repository, stage files, commit, push, pull, change a remote, restore, reset, discard working-tree changes, or require a clean worktree.

#### Scenario: Agent recommends but does not create a checkpoint

- **WHEN** an Agent reaches a stated checkpoint opportunity and Git is available
- **THEN** it may explain the value of saving current source history and ask whether the user wants to perform a Git action
- **AND** neither doctor nor the pipeline creates a repository or commit as a side effect

#### Scenario: User declines Git setup or checkpoint

- **WHEN** a user declines installation, initialization, or a checkpoint
- **THEN** the Agent continues the applicable deck workflow after existing hard gates pass
- **AND** it does not frame the decision as skipping Structural Versioning Path or source validation

