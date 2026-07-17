## 1. Node and Browser Runtime Profile

- [ ] 1.1 (`html-render-runtime`, `environment-check`, `pipeline-orchestration`) Raise package/runtime declarations and executable gates to Node.js 22+, pin production `playwright` exactly to `1.61.1` in package and lock files, and add tests proving Node 20 fails while Node 22 passes.
- [ ] 1.2 (`html-render-runtime`) Add canonical `setup:chromium` and `setup:chromium:with-deps` package scripts using the pinned local Playwright CLI; document standard/custom cache and setup-only proxy/download-host behavior without adding install logic to doctor or runtime.
- [ ] 1.3 (`html-render-runtime`) Add one checked-in runtime profile and internal ESM interface that verifies Playwright 1.61.1 plus paired Chromium revision 1228/browser 149.0.7827.55, launches only Playwright Chromium, and returns normalized evidence without exposing a direct CLI.
- [ ] 1.4 (`html-render-runtime`) Add unit tests for exact version/profile comparison, standard and consistently configured custom cache discovery, missing/mismatched paired browser, and rejection of system channels or arbitrary executable overrides.

## 2. Official Font Distribution and Evidence

- [ ] 2.1 (`html-render-runtime`) Acquire Source Sans 3 variable-normal WOFF2 weights 200-900 from Adobe's official `3.052R` release and record source URL/release, original filename, measured bytes, and SHA-256.
- [ ] 2.2 (`html-render-runtime`) Snapshot the official Google Fonts Noto Sans SC 100-900 CSS response with fixed request parameters and recorded modern-browser user-agent class; commit the original response and every referenced WOFF2 shard unchanged, recording served version/path, retrieval date, URL, Unicode range, measured bytes, and SHA-256.
- [ ] 2.3 (`html-render-runtime`) Generate local relative-URL CSS plus a canonical machine-readable inventory that proves original-CSS/local-CSS/file completeness, family/style/weight/range metadata, per-file integrity, snapshot identity, and total bytes; add no third-party font package or TTF conversion toolchain.
- [ ] 2.4 (`html-render-runtime`, `framework-directory-layout`) Place binaries, original/local CSS, inventory, provenance, copyright notices, and complete OFL material under the sole canonical `PPTMAKER_FRAMEWORK/scripts/fonts/` tree; keep the five-directory framework root and the legacy Stage-3 canvas font contract unchanged.
- [ ] 2.5 (`html-render-runtime`) Add a fixed ASCII/Latin-accent/punctuation-currency/numeral/Simplified-Chinese/CJK-punctuation sentinel corpus and validation for missing files, digest drift, CSS/inventory mismatch, malformed/conflicting ranges, missing legal material, and unsupported sentinel code points.
- [ ] 2.6 (`html-render-runtime`, `framework-directory-layout`) Add directory and coherence tests proving no duplicate framework font authority, runtime font URL, run-bundle font distribution, third-party acquisition authority, or unsupported full-CJK claim exists.

## 3. Renderer-Independent Offline Smoke

- [ ] 3.1 (`html-render-runtime`) Add a checked-in static HTML fixture with its own fixed viewport, local font CSS, deterministic geometry assertions, and explicit evidence that it does not import future slide-renderer code or alter legacy `1672x941` configuration/fingerprints.
- [ ] 3.2 (`html-render-runtime`) Implement runtime smoke that launches paired headless Chromium, blocks service workers, aborts and records every HTTP/HTTPS attempt, waits for `document.fonts.ready`, verifies required local families/weights and sentinel coverage, and fails on geometry or network violations.
- [ ] 3.3 (`html-render-runtime`) Prove through unit tests that smoke/runtime never invokes a browser/font installer, downloads an asset, accepts OS-font fallback as readiness evidence, or claims actual-deck code-point/overflow coverage.
- [ ] 3.4 (`html-render-runtime`) Add an integration test that launches installed paired Chromium against the fixture and verifies zero network requests plus expected font/geometry evidence; allow skipping only through an explicit documented unavailable-browser test condition, never by treating absence as success.

## 4. Layered Environment and CLI Readiness

- [ ] 4.1 (`environment-check`) Preserve built-ins-only startup and ancestor package discovery, diagnose missing packages before dynamic import, verify exact Playwright metadata, and enter the shared runtime only after npm-backed prerequisites exist.
- [ ] 4.2 (`environment-check`) Implement deterministic modes: default base only; `--image2` base plus offline Image2 presence; existing `--smoke`/`--probe-vendors` imply Image2; live flags remain mutually exclusive and accept redundant `--image2`.
- [ ] 4.3 (`environment-check`) Add blocking base records `chromium`, `html_fonts`, and `html_runtime_smoke`; omit `api_key`, `image_base_url`, and `stage2_generator` from base output so absent Image2 configuration cannot change base READY.
- [ ] 4.4 (`environment-check`) Keep existing Image2 credential/base-URL/Stage-2 resolution rules in Image2 mode, report only a secret-safe resolved vendor count, make `--image2` network-free, and preserve exactly one submit for `--smoke` or one per resolved vendor for `--probe-vendors`.
- [ ] 4.5 (`environment-check`) Preserve `env-check-v1` JSON/check-array semantics, selected-mode exit status, human READY/NOT READY endings, live progress/summary behavior, and secret safety without introducing a second diagnostic schema.
- [ ] 4.6 (`cli-surface`) Add text-only `ppt_flow doctor --image2` delegation and help; preserve old live flags, their implied Image2 mode, mutual exclusion, top-level command inventory, and the existing delegated parent failure envelope.
- [ ] 4.7 (`environment-check`, `cli-surface`) Add tests for no-`node_modules` startup, ancestor resolution, version/browser/font failures, no-Image2 base READY, offline Image2 failure/success, safe vendor count, all live-flag combinations/submit counts, help, JSON compatibility, and secret-safe direct/delegated failures.

## 5. Legacy Image2 Submit-Boundary Guards

- [ ] 5.1 (`pipeline-orchestration`) Inventory every current remote Image2 submit reached by style-master generation, pilot, build, visual rebuild, and unified Stage 2, recording the existing credential/base-URL and style-reference authorities used at each boundary.
- [ ] 5.2 (`pipeline-orchestration`) Add or strengthen one shared fail-before-submit guard: all remote submits require transport prerequisites; legacy page generation additionally requires current style reference; style-master generation does not require a pre-existing style master.
- [ ] 5.3 (`pipeline-orchestration`, `cli-surface`) Route missing prerequisites through the existing secret-safe diagnostic authority before provider-adapter invocation, without relying on a previous doctor result or emitting key/provider payload data.
- [ ] 5.4 (`pipeline-orchestration`) Preserve local Stage subsets, notes-only work, assembly from reviewed images, dry runs, and Structural Versioning analysis/materialization with no Image2 prerequisite acquisition or remote call.
- [ ] 5.5 (`pipeline-orchestration`) Add fake-adapter regressions proving zero submit for missing credential/base URL/page style reference, permitted style-master submit with valid transport and no prior style master, successful guarded page submit, and zero remote calls on local/dry-run/structural paths.

## 6. BOOTSTRAP and Phase-0 Diagnostic UX

- [ ] 6.1 (`playbook-execution`) Update `probe-image-channels` in its existing Phase-0 / `00-setup` role to resolve vendor count offline, disclose one submit per vendor, obtain confirmation before `--probe-vendors`, relay progress, and keep report-only intent separate from optional configuration writes.
- [ ] 6.2 (`playbook-execution`, `bootstrap-env-guidance`, `image-generation`) Require any current playbook/entry-doc offer of `doctor --smoke` to disclose exactly one expected submit and obtain confirmation; remove style-master generation as a channel-diagnostic substitute, ensure decline makes zero calls, and ensure success creates no build approval or page-refinement authorization/state.
- [ ] 6.3 (`bootstrap-env-guidance`) Rewrite BOOTSTRAP Step 1 base remediation for Node 22, one consolidated npm install, explicit Chromium setup, HTML font/runtime-smoke failures, current local/advisory checks, and beginner-copyable macOS/Windows/Linux paths.
- [ ] 6.4 (`bootstrap-env-guidance`) Move `api_key`, `image_base_url`, `stage2_generator`, and live-probe remediation into a clearly optional Image2 subsection; distinguish offline `doctor --image2` from confirmed live flags and scope Image2 NOT READY only to an Image2 action.
- [ ] 6.5 (`bootstrap-env-guidance`) Update active setup/runtime guidance to the new environment facts while retaining the current workflow topology and avoiding claims that structured HTML deck rendering, new-deck HTML defaults, modern Phase-4 refinement, or full CJK support already exists.
- [ ] 6.6 (`bootstrap-env-guidance`, `playbook-execution`, `image-generation`) Add consistency tests comparing emitted base/Image2/live check names to the owning guidance sections and rejecting stale Node-18, universal-Image2 prerequisite, unconfirmed-live-probe, style-master-as-diagnostic, runtime-download, system-browser-fallback, and premature HTML-product claims.

## 7. Apply Verification and Boundary Audit

- [ ] 7.1 Run focused Vitest suites for runtime profile/fonts/smoke, environment modes, doctor delegation/envelopes, legacy submit guards, playbook confirmation, and documentation/layout coherence; resolve every regression.
- [ ] 7.2 Run the real paired-Chromium offline fixture smoke on the development platform and record only normalized profile/font evidence, with no local absolute paths or secrets; verify declared macOS/Windows/Linux/CI setup commands structurally.
- [ ] 7.3 Run full `npm test` and relevant `tests_e2e` when legacy public pilot/build behavior crosses an E2E boundary; record a concrete reason for any E2E category not required.
- [ ] 7.4 Run `openspec validate upgrade-html-render-runtime-readiness --strict` and `git diff --check`; verify proposal capability names exactly match all eight delta-spec directories.
- [ ] 7.5 Audit the final diff for scope: no structured slide source, actual slide HTML renderer, future 1600x900/DPR-2 profile activation, PPTX/default-workflow change, workflow-directory migration, run-bundle/state schema change, or modern Image2 refinement transaction may be implemented.
- [ ] 7.6 Keep this checklist current during apply and mark the parent roadmap Apply/Validate stages only after their defined tests pass; do not use OpenSpec artifact status or chat progress as implementation evidence.
