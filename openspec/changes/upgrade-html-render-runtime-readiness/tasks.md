## 1. Runtime Baseline and Dependency Profile

- [ ] 1.1 Update `package.json` and `package-lock.json` to require Node.js `>=22`, add exact production dependency `playwright@1.61.1` without a range, and add canonical `setup:chromium` plus Linux/CI `setup:chromium:with-deps` package scripts.
- [ ] 1.2 Add one checked-in HTML runtime profile/fixture that binds Playwright 1.61.1 to Chromium revision 1228 / browser version 149.0.7827.55 and fails version drift instead of selecting a system browser.
- [ ] 1.3 Extend runtime-constitution/coherence tests so Node metadata, active Node guidance, the exact Playwright dependency, paired browser identity, and no-build-step ESM contract cannot drift independently.
- [ ] 1.4 Document the supported macOS/Windows/Linux setup commands, `PLAYWRIGHT_BROWSERS_PATH` consistency rule, restricted-network install variables, offline preinstallation requirement, and CI cache-key rule without creating a repository-external CI authority.

## 2. Distributed Font Profile

- [ ] 2.1 Acquire and commit the Source Sans 3 release 3.052 variable-normal Latin WOFF2 assets required for weights 200-900, recording immutable upstream provenance and SHA-256 values.
- [ ] 2.2 Acquire and commit the complete pre-generated Noto Sans SC variable-normal WOFF2 shard set from exactly pinned `@fontsource-variable/noto-sans-sc@5.2.10`, recording package integrity, every shard SHA-256, and Simplified-Chinese (`Hans`) scope.
- [ ] 2.3 Add family copyright notices, complete OFL 1.1 license texts, provenance records, and active `scripts/fonts/README.md` guidance that separates required HTML WOFF2 assets from legacy Stage-3 OTF/TTF/system-font fallback behavior.
- [ ] 2.4 Add canonical local `@font-face` CSS and a machine-readable manifest covering family/style/weight/unicode-range/path/SHA/license/provenance, with no remote URL used by runtime CSS.
- [ ] 2.5 Add checked-in Latin, accents, punctuation/currency, numerals, common Simplified-Chinese, and CJK-punctuation sentinel corpora plus tests for missing files, digest drift, malformed/overlapping ranges, missing license material, and unsupported code points.
- [ ] 2.6 Add directory/coherence tests proving `PPTMAKER_FRAMEWORK/scripts/fonts/` is the only canonical framework distribution root, no sixth framework-root directory appears, and no font authority is placed in a run bundle.

## 3. Shared Browser and Font Runtime Seam

- [ ] 3.1 Implement one internal ESM runtime module under `PPTMAKER_FRAMEWORK/scripts/lib/` that inspects the exact profile, resolves only Playwright's paired Chromium, verifies the font manifest/licenses/digests/coverage, and returns normalized structured evidence.
- [ ] 3.2 Implement the fixed local HTML smoke fixture at a fixed viewport: block service workers and all HTTP/HTTPS requests, load only checked-in assets, await `document.fonts.ready`, verify required family/weight evidence, and assert deterministic DOM geometry.
- [ ] 3.3 Ensure the runtime seam never invokes a browser/font installer, never downloads, never accepts `channel` or arbitrary `executablePath`, and fails with setup-oriented normalized results when the matching browser/cache is absent.
- [ ] 3.4 Add unit tests for profile/version comparison, default/custom cache handling, no-system-browser fallback, network-attempt failure, coverage failure, and normalized secret-safe evidence.
- [ ] 3.5 Add an integration test that launches the installed paired Chromium against the static fixture and proves successful local geometry/font checks with zero network requests; skip only through an explicit documented test-environment condition, not by treating a missing browser as success.

## 4. Layered Environment and CLI Readiness

- [ ] 4.1 Refactor `env-check.mjs` argument/mode assembly so default runs base only, `--image2` adds offline Image2 presence, and existing `--smoke`/`--probe-vendors` imply Image2 while remaining mutually exclusive with each other.
- [ ] 4.2 Preserve the built-ins-only startup path: diagnose missing npm packages before any dynamic import, add exact Playwright presence/version checking through the existing ancestor walk, and dynamically enter the shared runtime only when dependencies are available.
- [ ] 4.3 Add blocking base records `chromium`, `html_fonts`, and `html_runtime_smoke`; keep existing local/advisory checks; omit `api_key`, `image_base_url`, and `stage2_generator` entirely from base mode.
- [ ] 4.4 Move `api_key`, `image_base_url`, and in-framework Stage-2 presence into Image2 mode while preserving their current resolution rules, fix text, live-probe parsers, ordering, progress, and secret safety.
- [ ] 4.5 Preserve `env-check-v1` JSON compatibility, foundation/allPass semantics for the selected mode, direct `--json`, text READY/NOT READY endings, and the unique final failure envelope; label human output clearly as base or Image2 readiness.
- [ ] 4.6 Extend `ppt_flow doctor` with text-only `--image2` delegation, preserve old live flags and delegated parent envelopes, accept redundant `--image2` plus one live flag, and add no top-level command or doctor JSON option.
- [ ] 4.7 Update environment/CLI tests for no-node_modules startup, Node 20 failure/Node 22 pass, dependency walk-up, missing/mismatched browser, no-Image2 base READY, explicit Image2 failures, implied live modes, flag combinations, help text, command inventory, and secret-safe diagnostics.

## 5. Legacy Image2 Entry Guards

- [ ] 5.1 Inventory every current legacy remote-submit entry reached by pilot, build, visual refresh, unified Stage 2, and style-master generation; identify the existing credential, base-URL, and style-reference authorities used at each boundary.
- [ ] 5.2 Add or strengthen a shared fail-before-submit guard immediately at legacy Stage-2 orchestration boundaries so missing credentials/base URL or required style master cannot reach the provider adapter after default doctor becomes base-only.
- [ ] 5.3 Preserve local-only Stage 1/3/4/5, notes-only refresh, assembly from reviewed images, dry-run, and structural materialization behavior without acquiring Image2 prerequisites or making a remote request.
- [ ] 5.4 Add fake-adapter regression tests proving zero submit on missing credentials/style, secret-safe CLI envelopes, successful legacy submit when prerequisites exist, and zero remote calls for local/structural/dry-run paths.

## 6. BOOTSTRAP and Active Guidance Migration

- [ ] 6.1 Rewrite BOOTSTRAP Step 1 base remediation sections to cover the emitted base check names, Node 22 verification/upgrade, one consolidated `npm install`, explicit Chromium setup, font/runtime-smoke repair, and existing advisory Git guidance.
- [ ] 6.2 Move `api_key`, `image_base_url`, `stage2_generator`, and live-probe remediation into a clearly optional Image2 subsection; explain `doctor --image2` presence versus `--smoke`/`--probe-vendors` live checks and preserve self-contained first-time setup when the user chooses that path.
- [ ] 6.3 Update gate wording so foundation/base NOT READY blocks framework progress, advisory warnings remain non-blocking, and Image2 NOT READY blocks only an action about to enter the legacy remote path.
- [ ] 6.4 Update active Node/runtime/setup documents and command examples to Node 22, base-vs-Image2 readiness, explicit Chromium setup, and Simplified-Chinese font scope while avoiding any claim that HTML-first deck authoring/delivery already exists.
- [ ] 6.5 Add documentation consistency tests that compare default and Image2 check-name inventories with the correct BOOTSTRAP sections and reject stale universal-Image2, Node-18, runtime-download, full-CJK, or system-browser-fallback claims in active guidance.

## 7. Verification and Apply Completion

- [ ] 7.1 Run focused Vitest suites for environment checks, CLI delegation/error envelopes, runtime constitution, documentation consistency, pipeline orchestration, Image2 generation/style master, and structural no-remote behavior; resolve every regression.
- [ ] 7.2 Run the real paired-Chromium offline fixture smoke on the development platform and record the inspected Playwright/Chromium/font profile without local absolute paths or secrets.
- [ ] 7.3 Run full `npm test`; run relevant `tests_e2e` if the legacy pilot/build guard changes cross public workflow boundaries; document why any E2E category is not required.
- [ ] 7.4 Run `openspec validate upgrade-html-render-runtime-readiness --strict`, inspect `git diff --check`, and confirm the change has not implemented structured slide source, HTML slide rendering, new-deck defaults, or Image2 refinement UX.
- [ ] 7.5 Update this checklist as work completes and leave the change apply-complete only when all required tasks and validations pass; then update the parent four-change roadmap tracker's Apply/Validate stages through their defined completion rules.
