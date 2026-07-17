## Context

The current startup gate has one readiness meaning: a machine is READY only when the local Node pipeline, the in-framework Image2 implementation, and Image2 credentials are all present. That coupling is incompatible with the planned HTML-first path, where every user needs a reproducible local browser/font runtime but only some users choose the paid Image2 path.

This change crosses package metadata, a zero-dependency startup checker, the public `doctor` delegation, legacy Stage-2 entry guards, BOOTSTRAP remediation, and framework-distributed assets. The new browser dependency also has an installation lifecycle distinct from ordinary npm packages. The supporting source and license investigation is recorded in [research.md](research.md).

Ownership remains split along existing boundaries:

- JS/CLI owns deterministic detection, browser launch, font integrity/coverage evidence, mode selection, exit status, and secret-safe diagnostics.
- BOOTSTRAP owns beginner-facing repair guidance and explains when Image2 setup is optional versus required by a selected legacy action.
- The user owns whether to configure or invoke Image2.
- This change does not create a renderer or a second workflow controller.

## Goals / Non-Goals

**Goals:**

- Establish Node.js 22 plus an exactly pinned Playwright/Chromium profile that later HTML rendering can reuse.
- Make browser acquisition an explicit setup operation and keep doctor/render execution offline.
- Distribute stable Latin and Simplified-Chinese web fonts with integrity, coverage, provenance, and license evidence.
- Make default doctor mean local/base readiness, with Image2 readiness selected explicitly.
- Preserve old `doctor --smoke` and `doctor --probe-vendors` invocations and keep legacy remote rendering fail-closed at its actual entry points.
- Keep the startup checker executable before `npm install` by dynamically entering npm-backed checks only after package presence is established.

**Non-Goals:**

- Structured slide source, layout families, HTML page generation, screenshot production, PPTX assembly changes, or new-deck defaults.
- Full Traditional Chinese, Japanese, or Korean font support. The bundled CJK profile in this change is explicitly Simplified Chinese (`Hans`).
- Selecting or launching a system-installed Chrome/Edge channel.
- Downloading a browser, font, CSS, image, or other remote asset during doctor, smoke, or future render execution.
- Cross-OS byte-identical screenshots. The contract is a pinned runtime and deterministic geometry/coverage inputs, not identical raster bytes across operating systems.

## Decisions

### 1. One deep runtime seam owns browser and font evidence

A new internal Node ESM module under `PPTMAKER_FRAMEWORK/scripts/lib/` will own the HTML runtime profile, browser discovery/launch smoke, font manifest verification, and normalized results. `env-check.mjs` will remain the public checker and dynamically import this module only after it has confirmed that the pinned npm dependency exists. Later renderers must consume the same seam rather than independently locating Chromium or fonts.

The module will expose structured results to callers; it will not become a new direct CLI or a workflow controller. This keeps `environment-check` responsible for readiness aggregation while `html-render-runtime` owns the reusable runtime facts.

**Alternative considered:** implement browser/font probing directly in `env-check.mjs`. Rejected because the future renderer would either duplicate those decisions or import the startup command as a library.

### 2. Node 22 and `playwright@1.61.1` form the first pinned profile

The repository engine floor becomes Node.js `>=22`. `playwright` is a production dependency pinned exactly to `1.61.1` in `package.json` and `package-lock.json`; it is not declared with `^` or `~`. That package pins `playwright-core@1.61.1`, whose browser registry identifies Chromium revision `1228`, browser version `149.0.7827.55`.

The runtime reads the browser identity from the installed pinned package and verifies it against a checked-in profile/fixture. It launches Playwright's bundled `chromium` without `channel` or caller-supplied `executablePath`. A package upgrade, browser revision change, and expected-profile update are one atomic maintenance operation.

**Alternative considered:** `playwright-core` plus a separately chosen executable. Rejected because it moves browser compatibility/version selection into this repository and permits silent system-browser drift.

### 3. Browser installation is explicit setup; execution never installs

`npm install`/`npm ci` installs the library but does not define browser readiness. Package scripts provide the canonical setup entry points:

- macOS/Windows and normal Linux user setup: `npm run setup:chromium`, which invokes the pinned local Playwright CLI for `install chromium`.
- Linux/CI images that authorize OS-package installation: `npm run setup:chromium:with-deps`, which invokes `install --with-deps chromium`.

The standard Playwright cache is the default. A preconfigured `PLAYWRIGHT_BROWSERS_PATH` is supported only when the same value is used for install and execution. Restricted networks may configure the documented Playwright download-host/proxy variables during setup. CI caching is optional; any cache key must include Playwright version, OS, and architecture, and Linux still installs/verifies system dependencies.

Doctor and runtime smoke only inspect and launch the matching installed browser. They never run `playwright install`, never fall back to a system browser, and never download on failure. An offline machine is ready only if the matching browser was installed or restored before it went offline.

**Alternative considered:** automatically install a missing browser from doctor. Rejected because doctor would become slow, network-mutating, privilege-sensitive, and surprising to beginners.

### 4. The smoke is a fixed local fixture with network denial

The runtime smoke launches headless Chromium with a fixed viewport, opens a checked-in static HTML fixture/local data payload, loads only bundled fonts, waits for `document.fonts.ready`, performs required family/weight checks, and verifies a small deterministic DOM geometry result. All `http:` and `https:` requests are aborted; service workers are blocked. Any attempted network request fails the smoke.

This fixture proves that the runtime can launch, load the distributed fonts, and execute layout. It does not import or simulate the Change-3 slide renderer.

**Alternative considered:** use a future slide renderer as the smoke target. Rejected because it would make Change 1 impossible to validate or archive independently.

### 5. Fonts are checked-in WOFF2 assets with a canonical manifest

`PPTMAKER_FRAMEWORK/scripts/fonts/` becomes the canonical distribution root for HTML fonts and their legal/provenance material. The initial profile is:

- Latin: Source Sans 3 variable normal, weights 200-900, from Adobe Source Sans release `3.052` WOFF2 artifacts.
- Simplified Chinese: Noto Sans SC variable normal, weights 100-900, using the complete set of pre-generated WOFF2 unicode-range shards from the exactly pinned `@fontsource-variable/noto-sans-sc@5.2.10` package. The acquisition package is a repository-maintenance input only, not a runtime dependency.

Bundling upstream/pre-generated WOFF2 avoids a runtime Google Fonts request and avoids creating a locally converted OFL Modified Version. The Noto set remains sharded; local CSS/manifest references every required shard by relative path. No shard is concatenated or generated per deck.

A checked-in manifest records family, style, weight range, Unicode ranges, local file, SHA-256, upstream/distribution version, package/archive integrity, and license path. Copyright notices and the complete OFL 1.1 text are distributed beside each family. The existing Stage-3 canvas fallback contract remains separate: these WOFF2 assets establish the HTML runtime and do not silently change `@napi-rs/canvas` font loading.

**Alternative considered:** convert the 17+ MB Noto variable TTF into one WOFF2. Rejected for v1 because format conversion creates an OFL Modified Version, introduces a build-tool/provenance pipeline, and may require renaming around Reserved Font Names.

### 6. Coverage is fail-closed and manifest-driven

Static verification checks that every manifest file exists and matches its SHA-256 and that Unicode ranges are non-overlapping/parseable as declared. Browser smoke loads Latin and Simplified-Chinese sentinel corpora covering ASCII, Latin accents, punctuation/currency, numerals, common Simplified Chinese, and CJK punctuation. Future callers may ask the runtime seam to verify text coverage before render; any code point outside the declared profile is a blocking coverage result rather than an OS-font fallback.

CSS uses Source Sans 3 for Latin and explicitly selects Noto Sans SC for Han content. System fallback is not readiness evidence. Full Japanese/Korean/Traditional-Chinese claims require a future capability and additional bundled families/corpora.

### 7. Doctor has base and Image2 modes without changing its top-level shape

Mode resolution is deterministic:

- no Image2 flag: base mode only;
- `--image2`: base checks plus Image2 presence checks;
- `--smoke` or `--probe-vendors`: imply Image2 mode and then run their existing live probe after Image2 presence passes;
- `--smoke` and `--probe-vendors` remain mutually exclusive; either may be combined with the redundant `--image2` flag.

Base hard checks include the Node/npm/package floor, pinned Playwright package, matching installed Chromium, bundled font integrity/coverage, fixed local smoke, existing local framework dependencies/assets, and existing advisory checks. Base mode omits `api_key`, `image_base_url`, and `stage2_generator`; therefore missing Image2 configuration does not affect base READY.

Image2 mode adds the existing `api_key`, `image_base_url`, and in-framework Stage-2 presence checks. Live probes stay opt-in. The existing generic `env-check-v1` JSON check-array and text-only `ppt_flow doctor` delegation remain; mode-specific check presence carries the distinction, so this change does not invent a duplicate diagnostic schema.

**Alternative considered:** make `--image2` mandatory before `--smoke`/`--probe-vendors`. Rejected because it would break existing commands without adding safety.

### 8. Legacy remote paths own their prerequisites

Because default doctor no longer globally blocks on Image2, every existing legacy path that is about to submit remote image work must fail before submit unless credentials/base URL resolve and the required style reference exists. The guard sits immediately before the Stage-2/style-generation adapter boundary and uses existing credential/style authorities; it is not inferred from a prior doctor run.

Local-only Stage subsets, structural materialization, dry runs, notes refresh, and assembly from already reviewed images do not acquire Image2 prerequisites and do not make remote calls. Failures use the existing CLI envelope authority and never include key values or provider bodies.

### 9. BOOTSTRAP explains progressive readiness without announcing HTML delivery

BOOTSTRAP Step 1 maps every base check name to a beginner-copyable fix, updates Node guidance to 22, and explains the explicit Chromium setup. It defines base READY as local framework/runtime readiness. It introduces `doctor --image2` only as the prerequisite check when a selected legacy action needs Image2; first-time credentials are no longer presented as universal startup work.

The text must not claim users can already author or deliver HTML-first decks. That product switch belongs to Change 3.

### 10. Verification is layered

- Unit tests cover mode resolution, dependency walk-up, version/profile comparisons, manifest integrity/coverage decisions, no-install behavior, and legacy guard decisions with fake adapters/processes.
- Integration tests launch the installed Chromium against the fixed local fixture, assert zero network requests, exercise direct `env-check --json`, and verify `ppt_flow doctor` flag delegation and failure envelopes.
- Existing legacy pilot/build tests prove missing credentials/style fail before provider submit while local/structural paths remain remote-free.
- Declared macOS/Windows/Linux setup commands and support text are coherence-tested. This repository does not currently own a CI workflow outside its four source domains, so the change defines CI commands but does not create a second CI authority.
- Full `npm test` and strict OpenSpec validation remain completion gates. No `deck_*` production directory becomes a test fixture.

## Risks / Trade-offs

- **[Playwright and Chromium increase install size]** → Install only Chromium, keep acquisition explicit, and report missing browser separately from missing npm packages.
- **[Playwright cache can be garbage-collected or restored incorrectly]** → Verify the package-paired executable every doctor run; require cache keys to include Playwright version/OS/architecture; never fall back to another executable.
- **[101 Simplified-Chinese shards add file-count overhead]** → Keep one generated local CSS/manifest and validate it mechanically; accept the file count to avoid runtime network and OFL conversion/renaming risk.
- **[A manifest can overclaim glyph coverage]** → Pin source integrity and per-file SHA-256, validate ranges, and exercise representative browser corpora; unsupported code points fail before render.
- **[Base READY may be mistaken for legacy Image2 readiness]** → Label the report/guidance clearly and require an actual-entry guard; `doctor --image2` is the explicit preflight for users who choose that path.
- **[Node 22 drops Node 18-21 users]** → Treat package metadata, checker, docs, and tests as one atomic breaking migration with direct upgrade commands.
- **[Cross-platform raster output still differs]** → Promise only the pinned inputs and tested geometry/coverage behavior, not cross-OS pixel identity.

## Migration Plan

1. Add the exact Playwright dependency, Node engine floor, setup scripts, runtime profile/helper, fixtures, and tests.
2. Vendor the pinned font assets, license/copyright files, generated CSS, and integrity/coverage manifest; verify every checksum in tests.
3. Change `env-check` mode assembly while retaining its built-ins-only startup path and existing JSON/envelope formats.
4. Add `doctor --image2` delegation and preserve the old live-probe invocations.
5. Add/strengthen legacy remote-entry guards before removing Image2 from default readiness.
6. Update BOOTSTRAP and active Node/runtime setup guidance in the same commit set; scan for stale Node-18 and universal-Image2-readiness claims.
7. Run targeted tests, Chromium integration smoke, full tests, and strict OpenSpec validation.

Rollback is atomic: revert package/lock/profile/font/checker/guidance changes together. Existing deck files and `_generated/` artifacts require no migration because this change changes environment contracts only and does not alter run-bundle source or generated-artifact formats.

## Open Questions

None for apply. Full Traditional Chinese, Japanese, and Korean support is intentionally deferred and must not be inferred from the Simplified-Chinese runtime profile.
