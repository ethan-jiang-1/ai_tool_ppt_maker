## ADDED Requirements

### Requirement: HTML runtime uses one pinned Node Playwright Chromium profile

The framework SHALL declare a Node.js `>=22` package-engine floor, while the checked-in HTML runtime profile SHALL support only Node major lines `22.x`, `24.x`, and `26.x`. Numerically newer but undocumented majors such as 23/25 SHALL fail the runtime gate rather than inherit support from the engine floor. The framework SHALL declare exact `playwright@1.61.1` as a production dependency. The paired browser SHALL be Playwright Chromium revision `1228`, browser version `149.0.7827.55`. Runtime operations SHALL use that paired Chromium without selecting a system-browser channel or accepting an arbitrary executable override. Supported Node majors, package version, lockfile, expected browser identity, setup guidance, and profile tests SHALL be upgraded atomically.

#### Scenario: Installed profile matches

- **WHEN** a supported Node major (22, 24, or 26), exact `playwright@1.61.1`, and its paired Chromium are installed
- **THEN** runtime inspection reports the Node, Playwright, and Chromium components as matching

#### Scenario: Browser from another profile is present

- **WHEN** the exact npm package is present but its paired Chromium executable/revision is missing or mismatched
- **THEN** runtime readiness fails with installation-oriented evidence
- **AND** it does not launch system Chrome, Edge, or a caller-selected executable

### Requirement: Browser acquisition is explicit setup and never readiness or render behavior

The repository SHALL expose canonical package-script setup commands that invoke the pinned local Playwright CLI to install Chromium, including a Linux/CI variant that installs supported OS dependencies. Setup MAY use the standard Playwright cache or a consistently configured `PLAYWRIGHT_BROWSERS_PATH`, and restricted-network setup MAY use documented Playwright proxy/download-host variables. Doctor, runtime smoke, and future rendering SHALL only inspect and launch an already installed matching browser and SHALL NOT invoke an installer or download a browser.

#### Scenario: Browser is installed explicitly

- **WHEN** npm dependencies exist but paired Chromium is absent
- **THEN** normal-user guidance gives one repository package-script command to install Chromium
- **AND** Linux/CI guidance identifies the separate with-dependencies command where privilege policy permits it

#### Scenario: Offline runtime lacks paired Chromium

- **WHEN** doctor or runtime smoke runs offline without paired Chromium already installed or restored
- **THEN** it fails with setup guidance
- **AND** no installer, network download, or system-browser fallback is attempted

#### Scenario: Custom browser cache is selected

- **WHEN** setup uses `PLAYWRIGHT_BROWSERS_PATH`
- **THEN** readiness and execution use the same configured location
- **AND** fail rather than searching for an unrelated browser when that location is unavailable

### Requirement: Static runtime smoke is local, fixed, and renderer-independent

The framework SHALL include a checked-in static HTML fixture with a fixture-owned fixed viewport. Runtime smoke SHALL launch paired headless Chromium, load only local/data resources, block service workers, abort all HTTP/HTTPS requests, wait for required fonts, verify family/weight evidence, and assert deterministic DOM geometry. Any attempted network request SHALL fail the smoke. A checked-in `HTML_RUNTIME_SMOKE_TIMEOUT_MS` of 30,000 ms SHALL bound the complete launch/load/font/geometry operation; timeout evidence SHALL identify the last normalized phase, and browser/context cleanup SHALL run in `finally` on success, failure, and timeout. The fixture SHALL NOT import or emulate structured-slide or HTML-slide rendering and SHALL NOT alter legacy canvas/profile fingerprints.

#### Scenario: Static fixture succeeds offline

- **WHEN** the pinned runtime and bundled fonts are valid
- **THEN** the smoke verifies expected font and geometry evidence with zero network requests

#### Scenario: Fixture attempts remote access

- **WHEN** the fixture or one of its resources attempts HTTP or HTTPS access
- **THEN** the request is aborted and the smoke fails
- **AND** no remote response is consumed

#### Scenario: Browser smoke stalls

- **WHEN** launch, fixture load, font readiness, or geometry inspection does not complete within 30 seconds
- **THEN** runtime smoke fails with the last normalized phase and no absolute-path dump
- **AND** any created context and browser are closed before the result returns

#### Scenario: Legacy canvas remains unchanged

- **WHEN** the Change-1 fixture profile is added
- **THEN** existing legacy `1672x941` configuration and Stage-3 fingerprints remain unchanged
- **AND** no future `html-first-v1` slide viewport is declared by this capability

### Requirement: Official Latin and Simplified-Chinese WOFF2 assets are distributed immutably

The framework SHALL distribute Source Sans 3 variable normal WOFF2 weights 200-900 from Adobe release `3.052R` and Noto Sans SC variable normal WOFF2 weights 100-900 from a recorded snapshot of the official Google Fonts CSS/WOFF2 service. The Noto snapshot SHALL include the original CSS response, every referenced WOFF2 shard unchanged, locally rewritten CSS, fixed request metadata, served version/path, measured bytes, and a complete file/range inventory. Runtime SHALL use only committed local assets and SHALL NOT query Google Fonts, depend on a third-party font package, concatenate shards, convert TTF, or dynamically subset fonts.

Each family SHALL include provenance, copyright notices, and complete SIL OFL 1.1 material. This HTML WOFF2 profile SHALL NOT silently replace the existing Stage-3 `@napi-rs/canvas` OTF/TTF/system-font contract.

#### Scenario: Machine has no usable system font

- **WHEN** the distributed font tree and manifest are valid
- **THEN** HTML runtime font readiness succeeds using only framework-owned WOFF2 assets
- **AND** it makes no remote font request

#### Scenario: Noto CSS inventory is incomplete

- **WHEN** a WOFF2 referenced by the pinned original/local CSS or manifest is missing
- **THEN** font readiness fails
- **AND** no system font or network request fills the gap

#### Scenario: Legal material is absent

- **WHEN** a required family binary exists but its declared copyright or OFL file is missing
- **THEN** font readiness fails
- **AND** the family is not treated as distribution-ready

### Requirement: Font integrity and fixed sentinel coverage fail closed

A versioned manifest SHALL record each distributed font's family, style, weight range, Unicode range, relative path, SHA-256, source snapshot/release, CSS identity, and license path. Verification SHALL fail when a required file is absent, a digest differs, CSS/inventory relations are incomplete, range metadata is malformed or conflicting, or required fixed sentinel text is outside declared coverage.

The static browser smoke SHALL wait for `document.fonts.ready` and verify checked-in ASCII, Latin-accent, punctuation/currency, numeral, common Simplified-Chinese, and CJK-punctuation sentinels using required local families/weights. Distributed CSS SHALL contain URL-only sources and no `local()` alternative. Static manifest/CSS/file integrity plus Chromium font-usage inspection SHALL prove that dedicated Latin and Han sentinel nodes use the expected custom web-font family with non-zero glyph counts; `document.fonts.check(...)` alone SHALL NOT count as proof. System fallback SHALL NOT count as evidence. This capability SHALL NOT claim actual deck-source coverage or pixel-overflow validation.

#### Scenario: Font file digest drifts

- **WHEN** a required WOFF2 file does not match its manifest SHA-256
- **THEN** font readiness and static runtime smoke fail
- **AND** evidence identifies the normalized family/file role without exposing unrelated absolute paths

#### Scenario: Fixed bilingual corpus is supported

- **WHEN** the checked-in Latin and Simplified-Chinese sentinel corpus is verified
- **THEN** every required code point maps to declared local coverage
- **AND** all required browser family/weight checks pass

#### Scenario: Real slide source is not supplied

- **WHEN** doctor runs without a run-dir
- **THEN** successful font readiness claims only the fixed sentinel corpus
- **AND** does not claim that an arbitrary deck has complete glyph coverage or no overflow

### Requirement: Runtime evidence is reusable without becoming a workflow controller

The HTML runtime SHALL expose one internal structured interface for profile inspection, font-manifest/sentinel validation, and static smoke evidence. Its package-backed operations SHALL accept and use the canonical Playwright package root/version discovered by the caller; they SHALL NOT repeat bare/module-relative resolution that could load a different installation. `environment-check` and later HTML rendering SHALL consume that authority rather than independently discovering Chromium or rebuilding font CSS/coverage rules. The interface SHALL NOT own user intent, playbook transitions, slide source, or production authorization.

#### Scenario: Environment check consumes runtime evidence

- **WHEN** base doctor enters npm-backed checks after dependencies are present
- **THEN** it maps the shared runtime evidence into readiness records
- **AND** does not duplicate browser-selection or font-manifest authority

#### Scenario: Later renderer reuses the profile

- **WHEN** a later change implements HTML slide rendering
- **THEN** it consumes the same installed-browser and bundled-font profile
- **AND** does not introduce a second cache, executable, or font-distribution authority

### Requirement: Current verification is macOS-first without cross-platform claims

This change SHALL make the current maintained macOS development environment the required execution target. Repository-executed verification SHALL test paired Chromium launch, custom local-font use, zero-network behavior, and fixture geometry on the current macOS machine with a supported Node major; the recorded evidence SHALL contain only normalized profile/font/network/geometry facts. Unsupported-major rejection for Node 22/24/26 SHALL remain profile-tested without requiring three physical Node installations. Windows/Linux setup guidance and the checked-in optional CI workflow MAY remain as future portability infrastructure, but SHALL NOT be treated as executed evidence or a blocker for this change. The framework SHALL NOT claim byte-identical raster output across operating systems.

#### Scenario: Current Mac fixture passes

- **WHEN** the pinned fixture passes on the maintained macOS development machine
- **THEN** the current runtime/font readiness contract is satisfied for this change
- **AND** no Windows/Linux execution claim is made
