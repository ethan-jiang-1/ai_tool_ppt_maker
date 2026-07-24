## MODIFIED Requirements

### Requirement: Zero-dependency runtime check
`scripts/00-setup/env-check.mjs` SHALL have zero static npm dependencies. Its pre-install closure contains only Node built-ins, shared CLI bootstrap/error helpers, and the pure executable inventory; those helpers import neither a production adapter nor an npm dependency. It SHALL remain runnable before `npm install` so it can diagnose the Node/npm/package foundation. It MAY dynamically import the installed HTML runtime only after package presence checks establish npm dependencies; missing packages are normal check failures rather than load failures. `ppt_flow doctor` remains the Commander-based normal command after installation, while direct env-check is the documented recovery command.

Base runtime/font inspection is owned by the import-safe `00-setup` interface, which SHALL NOT import the whole-page implementation. The direct adapter and root doctor may lazily call the `04-image-production/whole-page` public provider diagnostic only after prerequisites pass and an Image2 mode is explicitly selected. Base mode SHALL not load HTML renderer internals or whole-page provider implementation.

#### Scenario: Run without node_modules
- **WHEN** `node scripts/00-setup/env-check.mjs` runs in a fresh directory with no `node_modules/`
- **THEN** the script executes and emits actionable missing-package results
- **AND** it does not fail during top-level module loading

#### Scenario: Base mode does not initialize the whole-page provider
- **WHEN** direct `00-setup` env-check runs without an Image2 mode
- **THEN** no whole-page provider or credential implementation is loaded while local HTML readiness remains checkable

### Requirement: In-framework Stage 2 scripts are a hard requirement
In Image2 mode, the env check SHALL treat a missing current in-framework whole-page Stage-2 module as a hard failure, not a warning. It SHALL verify `04-image-production/whole-page/stage2_generate_images.mjs`, `04-image-production/whole-page/make_contact_sheet.mjs`, and `04-image-production/whole-page/internal/image_api_client.mjs` beneath `PPTMAKER_FRAMEWORK/scripts/`. It SHALL NOT search `.claude/skills/` or `.agents/skills/`. Base mode SHALL omit `stage2_generator` because local HTML runtime readiness does not depend on the whole-page implementation.

#### Scenario: Scripts present
- **WHEN** the three current whole-page Stage-2 modules exist under `scripts/`
- **AND** Image2 mode is selected
- **THEN** `stage2_generator` status is `ok` and detail identifies the in-framework whole-page owner

#### Scenario: Scripts missing
- **WHEN** any of the three current whole-page Stage-2 modules is missing
- **AND** Image2 mode is selected
- **THEN** `stage2_generator` status is `fail`, overall verdict is NOT READY, and the process exits non-zero

#### Scenario: Base doctor does not require Stage 2
- **WHEN** whole-page Stage-2 modules are absent but all base checks pass
- **AND** env-check runs without an Image2 mode
- **THEN** no `stage2_generator` check is emitted and base readiness remains READY

### Requirement: Environment check separates production readiness profiles
`env-check.mjs` SHALL resolve exactly one production readiness profile per invocation. `--mode html-only` SHALL select common plus HTML checks; `--mode image2-only` and the documented diagnostic alias `--image2` SHALL select common plus offline whole-page Image2 presence checks; `--mode html-then-image2` SHALL select common plus blocking HTML checks and deferred/non-blocking Image2 presence guidance. `--smoke` and `--probe-vendors` SHALL imply a blocking Image2 profile when no mode is supplied, remain mutually exclusive, and retain live-probe behavior only after presence checks pass.

Common checks SHALL include Node/npm, common packages, framework files required by shared production/assembly, generic font fallback observation, disk space, and advisory Git. HTML checks SHALL add Playwright, ECharts, paired Chromium, distributed HTML-font integrity/coverage, and fixed offline browser smoke. Image2 checks SHALL add `api_key`, `image_base_url`, and `stage2_generator`. The report SHALL identify the selected profile, `current_action_ready`, and any `deferred_not_ready` checks. Deferred checks SHALL not alter current HTML exit status, but the same checks SHALL be blocking when an explicit Image2/live action is selected.

#### Scenario: New user has no Image2 configuration
- **WHEN** the selected `html-only` profile passes and no Image2 configuration exists
- **THEN** env-check ends READY and exits 0

#### Scenario: Required ECharts is missing
- **WHEN** exact local ECharts cannot be discovered for an HTML profile
- **THEN** HTML readiness ends NOT READY with a dependency repair
- **AND** no browser or renderer work is attempted with an unknown chart runtime

#### Scenario: Explicit Image2 presence mode
- **WHEN** env-check runs with `--mode image2-only` or the documented `--image2` diagnostic alias
- **THEN** it runs common checks plus `api_key`, `image_base_url`, and `stage2_generator`
- **AND** it omits HTML-only checks and makes no Image2 network call

#### Scenario: HTML-then-Image2 has deferred provider setup
- **WHEN** common/HTML checks pass and Image2 presence fails under `html-then-image2`
- **THEN** current HTML readiness exits successfully and lists the Image2 failures as deferred guidance
- **AND** a later explicit Image2 action rechecks them as blocking prerequisites
