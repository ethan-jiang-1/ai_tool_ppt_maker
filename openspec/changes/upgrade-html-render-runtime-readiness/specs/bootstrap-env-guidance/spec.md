## MODIFIED Requirements

### Requirement: BOOTSTRAP Step 1 contains a failure-to-fix section for every base doctor check

BOOTSTRAP.md Step 1 SHALL contain labeled sections using each stable base `env-check.mjs` check name as the identifier. Each section SHALL provide Agent-ready remediation instructions, and the Agent SHALL be able to map a base doctor failure to a beginner-safe fix without reading another file. The covered base names SHALL include at minimum `nodejs`, `npm`, `@napi-rs/canvas`, `pptxgenjs`, `commander`, `playwright`, `chromium`, `html_fonts`, `html_runtime_smoke`, `fonts`, `disk_space`, and `git` while those checks remain in base output.

Image2-only checks (`api_key`, `image_base_url`, `stage2_generator`, `image_smoke`, `image_probe_vendors`) SHALL be grouped in a clearly optional Image2 subsection and SHALL NOT be presented as requirements for base READY. The subsection SHALL still permit direct mapping from an explicit `doctor --image2`, `--smoke`, or `--probe-vendors` failure.

#### Scenario: Agent matches Node failure to fix via section header

- **WHEN** `ppt_flow.mjs doctor` reports `✗ nodejs: [FOUNDATION] fail`
- **AND** the Agent reads BOOTSTRAP.md Step 1
- **THEN** the Agent finds a section headed `### nodejs` with concrete Node 22 installation/upgrade commands for macOS, Linux, and Windows
- **AND** the Agent presents the appropriate platform-specific commands without reading another file

#### Scenario: Browser and font failures are separately actionable

- **WHEN** base doctor reports `✗ chromium: fail` and `✗ html_fonts: fail`
- **THEN** BOOTSTRAP provides a browser-install command under `### chromium` and framework-asset repair guidance under `### html_fonts`
- **AND** it does not tell the user to configure Image2 for either failure

#### Scenario: Multiple npm packages resolve through one install

- **WHEN** doctor reports missing `@napi-rs/canvas`, `pptxgenjs`, `commander`, and `playwright`
- **THEN** each check name has a matching section but the Agent consolidates them into one `npm install` action in the repository root

#### Scenario: Explicit Image2 failures remain discoverable

- **WHEN** `doctor --image2` reports `api_key` and `image_base_url` failures
- **THEN** the Agent finds both names in the optional Image2 subsection
- **AND** explains that they block only the selected Image2 path, not base local readiness

### Requirement: Fix instructions are user-profile-aware

Each fix section in BOOTSTRAP.md Step 1 SHALL distinguish users with an existing coding agent from bare-metal users, but SHALL NOT assume that the coding-agent installation already provides Node.js 22. For the coding-agent profile, guidance SHALL verify the current Node version first, upgrade only when below 22, then use repository-local `npm install` and Chromium setup commands. For bare-metal users, guidance SHALL include Node.js 22+ and npm installation before repository setup. Image2 credential setup SHALL appear only when the user selects or reaches an Image2-dependent action.

#### Scenario: Coding-agent user already has Node 22

- **WHEN** the user has Claude Code or Codex and doctor shows Node 22+ but missing npm packages
- **THEN** the Agent gives one repository-root `npm install` command and the explicit Chromium setup command
- **AND** does not tell the user to reinstall Node or configure Image2

#### Scenario: Coding-agent user has Node 20

- **WHEN** the user has a coding agent but doctor reports Node 20 below the required baseline
- **THEN** the Agent provides a platform-specific Node 22 upgrade path before npm/browser setup
- **AND** does not assume the coding agent's own runtime satisfies the framework

#### Scenario: Bare-metal user missing Node.js

- **WHEN** doctor reports `FOUNDATION NOT READY` and the user has no coding agent installation
- **THEN** the Agent provides full Node.js 22+ installation instructions per platform
- **AND** only after Node/npm are confirmed proceeds to `npm install` and Chromium setup

#### Scenario: User profile is unknown

- **WHEN** the Agent cannot determine whether the user has a coding agent installed
- **THEN** the Agent presents the verify-existing-Node path first
- **AND** follows with the bare-metal Node 22 installation path as fallback

### Requirement: BOOTSTRAP gate behavior is preserved

Step 1 SHALL distinguish gate scope. FOUNDATION NOT READY (Node.js or npm missing/unsupported) and a base NOT READY result SHALL block progress into later framework work until base doctor is READY. Base warnings SHALL remain non-blocking. Image2 NOT READY SHALL block only an action that will enter the legacy Image2 remote path; it SHALL NOT revoke base READY or block local-only work. The Agent SHALL re-run the same mode that failed before entering its protected scope.

#### Scenario: Foundation failure still blocks

- **WHEN** base doctor reports `FOUNDATION NOT READY`
- **THEN** the Agent SHALL NOT proceed to Step 2
- **AND** SHALL present the inline Node/npm fix and require base doctor to confirm READY

#### Scenario: Base hard failure still blocks

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

BOOTSTRAP.md Step 1 SHALL contain sufficient optional guidance for first-time Image2 credential setup when the user chooses or reaches an Image2-dependent action: what to ask for (`IMAGE2_API_KEY` and `IMAGE2_BASE_URL`), where to write it (`.env` in deck root or repo root), how to verify presence (`doctor --image2`), how to request the existing first-vendor live probe (`doctor --smoke`), and how to record non-key lessons in `_lessons/`. It SHALL explicitly say that Image2 configuration is not required for base doctor.

BOOTSTRAP SHALL NOT duplicate the full Image2 API contract (submit/poll/download protocol, vendor resolution, async task lifecycle, or full `--probe-vendors` troubleshooting), which remains in `03-tool-selection.md`. When a live probe fails, BOOTSTRAP SHALL point to that advanced reference rather than inlining it.

#### Scenario: Base setup does not solicit credentials

- **WHEN** a new user is only repairing default doctor
- **THEN** BOOTSTRAP does not ask for `IMAGE2_API_KEY` or `IMAGE2_BASE_URL`
- **AND** identifies Image2 setup as a later optional/dependency-triggered action

#### Scenario: First-time optional credential setup is self-contained

- **WHEN** the user chooses an Image2-dependent path for the first time
- **THEN** the Agent can configure `.env`, run `doctor --image2`, and optionally run `doctor --smoke` using only BOOTSTRAP Step 1

#### Scenario: Smoke failure points to advanced reference

- **WHEN** `doctor --smoke` fails after `.env` is configured
- **THEN** BOOTSTRAP points to `03-tool-selection.md` for channel probing and advanced provider troubleshooting
- **AND** does not inline the full provider protocol

#### Scenario: Agent records non-key lessons in _lessons/

- **WHEN** the Agent overcomes an Image2 environment issue through trial and error
- **THEN** the Agent records only the non-key takeaway in `deck_*/_lessons/`
- **AND** no API key is written to the lesson

### Requirement: BOOTSTRAP stays in sync with env-check check names

When `env-check.mjs` adds a stable base check name, BOOTSTRAP.md Step 1 SHALL add a corresponding labeled base section in the same change. When env-check adds an Image2-only check name, BOOTSTRAP SHALL add it to the clearly optional Image2 subsection rather than the base checklist. The base BOOTSTRAP section-name set SHALL be a superset of default env-check names, and the Image2 subsection SHALL cover names emitted only by `--image2`, `--smoke`, or `--probe-vendors`.

#### Scenario: New base item requires a base section

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
