## ADDED Requirements

### Requirement: HTML rendering uses one pinned Node Playwright Chromium profile

The framework SHALL support HTML rendering runtime operations on Node.js 22 or newer and SHALL declare `playwright` as an exact production dependency at version `1.61.1`. The paired Chromium SHALL be the browser owned by that Playwright package: revision `1228`, browser version `149.0.7827.55`. The runtime SHALL launch Playwright's bundled `chromium` without selecting a system browser channel or accepting an arbitrary executable override. Package version, lockfile, expected browser identity, runtime guidance, and tests SHALL change atomically when this profile is upgraded.

#### Scenario: Installed profile matches

- **WHEN** Node.js 22 or newer, `playwright@1.61.1`, and its paired Chromium revision 1228 are installed
- **THEN** runtime profile inspection reports the Node, Playwright, and Chromium components as matching

#### Scenario: Browser from another Playwright version is not accepted

- **WHEN** the npm package is present but its paired Chromium executable/revision is missing or mismatched
- **THEN** runtime readiness fails with an install-oriented diagnostic
- **AND** it does not launch a system Chrome, Edge, or caller-selected executable as fallback

### Requirement: Browser acquisition is explicit setup and never render-time behavior

The repository SHALL provide canonical package-script setup commands that invoke the pinned local Playwright CLI to install Chromium, plus a Linux/CI variant that installs Chromium with supported OS dependencies. Setup MAY use the standard Playwright cache or a consistently configured `PLAYWRIGHT_BROWSERS_PATH`; restricted-network setup MAY use documented Playwright proxy/download-host variables. Doctor, runtime smoke, and future render operations SHALL only inspect and launch an already installed matching browser and SHALL NOT execute a browser installer or download a browser.

#### Scenario: Beginner installs Chromium explicitly

- **WHEN** npm dependencies exist but the paired Chromium is absent
- **THEN** guidance gives one copy-pasteable repository package-script command for normal setup
- **AND** Linux/CI guidance identifies the separate with-dependencies command where privilege policy permits it

#### Scenario: Offline runtime has no matching browser

- **WHEN** doctor or runtime smoke runs offline without the paired Chromium already installed or restored
- **THEN** it fails with setup guidance
- **AND** no installer, network download, or system-browser fallback is attempted

#### Scenario: Custom cache location is consistent

- **WHEN** setup uses `PLAYWRIGHT_BROWSERS_PATH`
- **THEN** doctor and runtime execution use the same configured location
- **AND** readiness fails rather than silently looking for an unrelated browser when that location is unavailable

### Requirement: Local runtime smoke is fixed, offline, and renderer-independent

The framework SHALL include a checked-in static HTML runtime fixture that launches in the paired headless Chromium at a fixed viewport, loads only local/data resources, waits for bundled fonts, and verifies deterministic DOM geometry. The smoke SHALL abort every `http:` and `https:` request and SHALL block service workers. It SHALL fail if any network request is attempted. The fixture SHALL NOT import, emulate, or require the future structured-slide or HTML slide renderer.

#### Scenario: Static fixture launches offline

- **WHEN** the pinned runtime and bundled fonts are present
- **THEN** the smoke launches Chromium, renders the fixed fixture, verifies its expected geometry and font evidence, and exits successfully without network access

#### Scenario: Fixture attempts a remote request

- **WHEN** the fixture or a dependency attempts an HTTP or HTTPS request
- **THEN** the request is aborted and runtime smoke fails
- **AND** no remote response is consumed

### Requirement: Licensed Latin and Simplified-Chinese WOFF2 fonts are distributed with the framework

The framework SHALL distribute Source Sans 3 variable normal WOFF2 for Latin weights 200-900 and Noto Sans SC variable normal WOFF2 unicode-range shards for Simplified Chinese weights 100-900 under `PPTMAKER_FRAMEWORK/scripts/fonts/`. Each family SHALL include its copyright notice, complete SIL OFL 1.1 license, upstream/distribution provenance, and pinned acquisition version. The distributed Noto files SHALL be pre-generated WOFF2 shards and SHALL NOT be fetched, concatenated, converted, or dynamically subset during doctor or rendering.

#### Scenario: Framework is installed on a machine with no system fonts

- **WHEN** the distributed font tree is complete and its manifest is valid
- **THEN** HTML runtime font readiness succeeds using only framework-owned WOFF2 files
- **AND** it does not depend on an OS font directory or Google Fonts request

#### Scenario: License material is absent

- **WHEN** a required family binary is present but its declared copyright or OFL file is missing
- **THEN** font runtime readiness fails
- **AND** the family is not treated as distributable-ready

### Requirement: Font integrity and declared text coverage fail closed

A canonical font manifest SHALL record every distributed font file's family, style, supported weight range, Unicode range, relative path, SHA-256, provenance, and license path. Runtime verification SHALL fail when a required file is absent, its digest differs, range metadata is malformed, or required Latin/Simplified-Chinese sentinel text is outside the declared coverage. Browser smoke SHALL wait for `document.fonts.ready` and verify the required families/weights against checked-in Latin, punctuation/numeral, Simplified-Chinese, and CJK-punctuation corpora. System fallback SHALL NOT count as coverage evidence.

#### Scenario: Font file is corrupted

- **WHEN** a distributed WOFF2 file's bytes do not match the manifest SHA-256
- **THEN** font readiness and local runtime smoke fail before any future slide render
- **AND** the diagnostic identifies the normalized family/file role without exposing unrelated local paths

#### Scenario: Requested glyph is outside the v1 profile

- **WHEN** a runtime caller asks to render text containing a code point not covered by the declared Latin or Simplified-Chinese profile
- **THEN** coverage validation returns a blocking unsupported-glyph result
- **AND** it does not silently accept an OS fallback glyph

#### Scenario: Representative bilingual corpus is supported

- **WHEN** the checked-in English/Latin and Simplified-Chinese sentinel corpus is validated
- **THEN** every required code point maps to a manifest range and every required browser font check passes

### Requirement: Runtime evidence is reusable by later renderers

The browser/font runtime SHALL expose one internal structured inspection and smoke interface that `environment-check` and future HTML rendering consume. The interface SHALL return normalized profile, browser, font-integrity, coverage, geometry, and network-attempt evidence without defining workflow sequencing or user intent. Callers SHALL NOT independently rediscover Chromium or rebuild font CSS/coverage rules.

#### Scenario: Environment check consumes the runtime seam

- **WHEN** base doctor performs its browser and font checks after npm dependencies are present
- **THEN** it consumes the shared runtime evidence and maps it into environment check records
- **AND** no duplicate browser-selection or font-manifest implementation exists in `env-check.mjs`

#### Scenario: Future renderer consumes the same profile

- **WHEN** a later change adds HTML slide rendering
- **THEN** it uses the same installed-browser and bundled-font contract established here
- **AND** it does not introduce a second cache, executable, or font-discovery authority

### Requirement: Supported platforms share the profile but not a pixel-identity promise

The setup and diagnostic contract SHALL cover the Playwright-supported Node 22 desktop/CI platforms adopted by the repository on macOS, Windows, and Linux x86-64/arm64. The framework SHALL test stable launch, font coverage, and fixture geometry under the pinned profile. It SHALL NOT claim that independent operating systems produce byte-identical screenshot pixels.

#### Scenario: Same fixture runs on two supported operating systems

- **WHEN** the pinned runtime fixture passes on two supported operating systems
- **THEN** both runs satisfy the same viewport, font, network, and geometry assertions
- **AND** the framework does not require their raster bytes to be identical
