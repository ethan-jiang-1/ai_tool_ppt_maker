## ADDED Requirements

### Requirement: HTML runtime uses one pinned Node Playwright Chromium profile

The framework SHALL support HTML-runtime operations on Node.js 22 or newer and SHALL declare exact `playwright@1.61.1` as a production dependency. The paired browser SHALL be Playwright Chromium revision `1228`, browser version `149.0.7827.55`. Runtime operations SHALL use that paired Chromium without selecting a system-browser channel or accepting an arbitrary executable override. Package version, lockfile, expected browser identity, setup guidance, and profile tests SHALL be upgraded atomically.

#### Scenario: Installed profile matches

- **WHEN** Node.js 22+, exact `playwright@1.61.1`, and its paired Chromium are installed
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

The framework SHALL include a checked-in static HTML fixture with a fixture-owned fixed viewport. Runtime smoke SHALL launch paired headless Chromium, load only local/data resources, block service workers, abort all HTTP/HTTPS requests, wait for required fonts, verify family/weight evidence, and assert deterministic DOM geometry. Any attempted network request SHALL fail the smoke. The fixture SHALL NOT import or emulate structured-slide or HTML-slide rendering and SHALL NOT alter legacy canvas/profile fingerprints.

#### Scenario: Static fixture succeeds offline

- **WHEN** the pinned runtime and bundled fonts are valid
- **THEN** the smoke verifies expected font and geometry evidence with zero network requests

#### Scenario: Fixture attempts remote access

- **WHEN** the fixture or one of its resources attempts HTTP or HTTPS access
- **THEN** the request is aborted and the smoke fails
- **AND** no remote response is consumed

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

The static browser smoke SHALL wait for `document.fonts.ready` and verify checked-in ASCII, Latin-accent, punctuation/currency, numeral, common Simplified-Chinese, and CJK-punctuation sentinels using required local families/weights. System fallback SHALL NOT count as evidence. This capability SHALL NOT claim actual deck-source coverage or pixel-overflow validation.

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

The HTML runtime SHALL expose one internal structured interface for profile inspection, font-manifest/sentinel validation, and static smoke evidence. `environment-check` and later HTML rendering SHALL consume that authority rather than independently discovering Chromium or rebuilding font CSS/coverage rules. The interface SHALL NOT own user intent, playbook transitions, slide source, or production authorization.

#### Scenario: Environment check consumes runtime evidence

- **WHEN** base doctor enters npm-backed checks after dependencies are present
- **THEN** it maps the shared runtime evidence into readiness records
- **AND** does not duplicate browser-selection or font-manifest authority

#### Scenario: Later renderer reuses the profile

- **WHEN** a later change implements HTML slide rendering
- **THEN** it consumes the same installed-browser and bundled-font profile
- **AND** does not introduce a second cache, executable, or font-distribution authority

### Requirement: Supported platforms share behavioral inputs, not a pixel-identity promise

The declared setup/diagnostic contract SHALL cover the Playwright-supported Node 22 macOS, Windows, and Linux desktop/CI platforms adopted by the repository. Platform verification SHALL test launch, local font evidence, zero-network behavior, and fixture geometry under the pinned profile. The framework SHALL NOT claim byte-identical raster output across independent operating systems.

#### Scenario: Fixture passes on two supported operating systems

- **WHEN** the pinned fixture passes on two supported operating systems
- **THEN** both satisfy the same browser/font/network/geometry contract
- **AND** raster-byte identity is not required
