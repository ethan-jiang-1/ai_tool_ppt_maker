## Why

The framework currently treats Image2 credentials, its relay URL, and whole-page image-generation scripts as universal doctor prerequisites, so a user cannot be declared ready without configuring the expensive optional renderer. The planned HTML-first workflow needs an independently reproducible local runtime first: a supported Node baseline, pinned browser, and bundled fonts that later rendering changes can consume without downloads or silent font fallback.

This is the first change in the HTML-first progressive-rendering plan. It establishes runtime and readiness contracts only; it deliberately stops before structured slide authoring, HTML slide rendering, new-deck defaults, or visual-slot refinement.

## What Changes

- **BREAKING** Raise the repository runtime baseline from Node.js 18+ to Node.js 22 and align package metadata, CI, executable checks, and active framework guidance.
- Add a versioned local HTML runtime profile covering the Playwright library, its pinned Chromium revision, explicit install/cache behavior, offline rendering rules, and a static browser-launch smoke that does not depend on a future slide renderer.
- Bundle licensed Latin and CJK WOFF2 fonts under the framework soft bundle, include license/attribution material, and fail local runtime readiness when required font files or requested glyph coverage are unavailable.
- Split doctor into an offline base-readiness path and an explicit Image2-readiness path. Base readiness no longer requires `IMAGE2_API_KEY`, `IMAGE2_BASE_URL`, style-master assets, or a live provider.
- Add `ppt_flow doctor --image2` for Image2 presence checks while keeping all live probes explicitly opt-in and mutually exclusive. Preserve the existing text delegation and secret-safe CLI failure envelope.
- Keep legacy Image2-first decks safe by enforcing Image2 credentials and style-master prerequisites at the actual legacy pilot/build entry points after base doctor stops enforcing them globally.
- Update only environment/runtime guidance in this change. Do not announce the HTML-first deck workflow as available before the later delivery change.

## Capabilities

### New Capabilities

- `html-render-runtime`: Owns the supported Node/Playwright/Chromium/font runtime profile, explicit browser setup/cache contract, static local smoke, offline/network restrictions, and required-font coverage behavior consumed by later HTML rendering.

### Modified Capabilities

- `environment-check`: Changes the Node gate to 22, separates base and Image2 check groups, adds browser/font runtime checks, and removes credentials from the default READY verdict.
- `bootstrap-env-guidance`: Changes Step 1 remediation to match base versus explicit Image2 readiness, Node 22, Chromium setup, and bundled-font failures without presenting Image2 as a new-user prerequisite.
- `cli-surface`: Adds and constrains `doctor --image2`, preserves explicit live-probe flags and secret-safe delegation, and keeps the top-level command set unchanged.
- `pipeline-orchestration`: Changes the production runtime baseline and requires legacy Image2 pilot/build paths to enforce their own credential/style-master prerequisites without weakening structural or local no-remote paths.
- `framework-directory-layout`: Changes `scripts/fonts/` from a documentation-only placeholder into the canonical home for distributed font binaries and their license/attribution files while preserving the five-subdirectory framework root.

## Impact

- **Domain and owners:** Framework repository maintenance. JS/CLI owns deterministic runtime detection, browser/font smoke, legacy entry guards, and diagnostics; MD guidance owns remediation and progressive disclosure; the user still decides whether to configure or invoke Image2.
- **Runtime/dependencies:** `package.json`, lockfile, CI setup, Playwright/Chromium installation workflow, and framework-distributed font assets/licenses.
- **Framework code:** `env-check.mjs`, `ppt_flow.mjs`, legacy pipeline readiness call sites, and shared runtime/font helpers under `PPTMAKER_FRAMEWORK/scripts/`.
- **Framework guidance:** BOOTSTRAP and the existing setup/runtime documents only. New HTML authoring, production, and refinement workflow documentation remains out of scope.
- **Compatibility:** Running framework commands on Node 18-21 becomes unsupported. Existing Image2-first deck behavior remains available and continues to fail closed at its actual remote-render entry points when Image2 prerequisites are missing.
- **Tests:** Environment/CLI/runtime unit and integration coverage, cross-platform declared setup checks, legacy build guard regression tests, full test suite, and strict OpenSpec validation. No `deck_*` production bundle is used as a framework test fixture.
