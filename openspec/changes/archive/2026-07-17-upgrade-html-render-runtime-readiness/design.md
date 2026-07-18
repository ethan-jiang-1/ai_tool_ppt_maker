## Context

Today the startup checker has one readiness meaning: local Node dependencies, the in-framework Image2 implementation, Image2 credentials, and provider-facing behavior are treated as one gate. That prevents a future HTML-first user from being locally ready without configuring the optional paid renderer.

Change 1 must create a reusable browser/font foundation while leaving the current Image2-first deck workflow operational. It crosses package metadata, the built-ins-only startup checker, public doctor delegation, distributed assets, existing remote-submit boundaries, BOOTSTRAP, and one Phase-0 diagnostic playbook. Browser acquisition also has a separate lifecycle from npm package installation. Primary-source runtime and font evidence is recorded in [research.md](research.md).

Ownership remains explicit:

- JS/CLI owns deterministic runtime inspection, offline smoke, readiness records, submit-boundary guards, exit status, and secret-safe diagnostics.
- MD Controller owns whether a live provider diagnostic is proposed, its cost disclosure, and confirmation before invoking it.
- The human owns consent to any potentially billed live probe.
- Later changes own structured slide source, HTML slide composition, default workflow migration, and Image2 page-refinement authorization.

## Goals / Non-Goals

**Goals:**

- Establish a Node.js `>=22` engine floor plus one exactly pinned Playwright/Chromium profile whose supported major lines are `22.x`, `24.x`, and `26.x`, reusable by later HTML rendering.
- Make browser acquisition explicit setup while keeping doctor, smoke, and future render execution network-free.
- Distribute official Latin and Simplified-Chinese web-font assets with complete integrity, coverage, provenance, and license evidence.
- Make default doctor mean offline base readiness and expose Image2 environment readiness only when selected.
- Preserve existing live-probe commands while requiring MD-side cost disclosure and human confirmation.
- Keep current legacy Image2-first remote actions fail-closed at their actual submission boundaries.
- Keep `env-check.mjs` executable before `npm install`.

**Non-Goals:**

- `SLIDE BODY`, layout families, slide HTML generation, screenshot production, PPTX assembly changes, or new-deck defaults.
- Modern Image2 visual-slot plans, page authorization, candidate review, promotion, or Phase-4 workflow.
- Moving or renaming workflow directories, playbooks, run-bundle directories, state schemas, or legacy canvas profiles.
- Actual-deck code-point coverage or pixel-overflow validation. Change 1 has no run-dir and checks only a fixed bilingual sentinel corpus.
- Full Traditional Chinese, Japanese, or Korean support; the v1 CJK profile is Simplified Chinese (`Hans`).
- System Chrome/Edge selection or cross-OS byte-identical screenshot promises.

## Decisions

### 1. One internal runtime module owns reusable browser and font evidence

An internal Node ESM module under `PPTMAKER_FRAMEWORK/scripts/lib/` will own the checked-in runtime profile, Playwright package/browser inspection, font manifest verification, fixed sentinel coverage, and static browser smoke. It returns normalized structured evidence and has no direct CLI, workflow sequencing, or user-intent logic.

`env-check.mjs` remains the public readiness producer and retains zero static npm imports. It first completes Node/npm/package discovery with built-ins, then dynamically imports the runtime module only when the required packages are present. Package discovery returns the canonical resolved Playwright package root and version; the runtime loads Chromium through that exact root rather than performing a second bare-specifier lookup relative to its own module location. This prevents doctor from validating one installation and launching another shadow copy. Later renderers consume the same internal runtime authority rather than importing the doctor command or rediscovering Chromium/fonts.

**Alternative considered:** implement browser/font probing directly in `env-check.mjs`. Rejected because it would make the future renderer depend on a startup command or duplicate the same authority.

### 2. Supported Node major lines and exact `playwright@1.61.1` define the first profile

The repository engine floor becomes Node.js `>=22`, while the checked-in runtime profile accepts only Playwright's documented major lines `22.x`, `24.x`, and `26.x`. The engine range is a package-installation floor, not a promise that every numerically newer major is supported: doctor rejects undocumented odd lines such as 23/25. `playwright` is an exact production dependency at `1.61.1` in both package metadata and lockfile. Its exact `playwright-core@1.61.1` registry pairs Chromium revision `1228` with browser version `149.0.7827.55`.

The runtime verifies the Node major, installed package, and paired browser against checked-in profile data, then launches Playwright's `chromium` without `channel` or a caller-provided `executablePath`. Supported Node majors, package version, lockfile, expected browser identity, setup guidance, and profile tests are one atomic maintenance unit; a future Node major is unsupported until that unit is deliberately updated and verified.

**Alternative considered:** `playwright-core` plus a repository-selected or system executable. Rejected because the repository would then own browser compatibility selection and permit silent machine drift.

### 3. Browser installation is explicit setup; all readiness execution is non-installing

`npm install`/`npm ci` installs the library but does not prove browser availability. Package scripts are the canonical setup interface:

- `npm run setup:chromium` invokes the pinned local Playwright CLI to install Chromium for normal macOS, Windows, and Linux user setup.
- `npm run setup:chromium:with-deps` invokes the pinned CLI with `install --with-deps chromium` for authorized Linux/CI environments.

The standard Playwright cache is the default. A preconfigured `PLAYWRIGHT_BROWSERS_PATH` is supported only when install and execution use the same value. Proxy and custom download-host variables are documented as setup-time options. Optional CI cache keys include Playwright version, OS, and architecture; restoring browser bytes does not replace Linux dependency installation/verification.

Doctor and runtime smoke only inspect and launch the matching installed browser. They never invoke an installer, download a browser, or fall back to a system browser. An offline machine is ready only after the matching browser has been installed or restored.

**Alternative considered:** install Chromium automatically from doctor. Rejected because it would turn diagnosis into a slow, network-mutating, privilege-sensitive operation.

### 4. Change 1 owns a renderer-independent static smoke profile

The runtime smoke launches paired headless Chromium at a fixture-owned fixed viewport, loads a checked-in static HTML document and only local/data assets, blocks service workers, aborts every HTTP/HTTPS request, waits for `document.fonts.ready`, verifies required family/weight evidence, and checks a small deterministic DOM geometry result. Any attempted network request fails the smoke. A checked-in `HTML_RUNTIME_SMOKE_TIMEOUT_MS = 30_000` bounds the whole launch/load/font/geometry operation; timeout evidence names the last normalized phase, and context/browser cleanup runs in `finally` on every exit.

The fixture does not import or mimic the future structured slide renderer. Its viewport is local to the fixture and does not alter the existing legacy `1672x941` canvas, visual configuration, or fingerprints. The future `html-first-v1` 1600x900/DPR-2 rendering profile belongs to Changes 2 and 3.

**Alternative considered:** make Change 3's slide renderer the smoke target. Rejected because Change 1 must be independently implementable, testable, and archivable.

### 5. Fonts are byte-pinned official WOFF2 distributions under one soft-bundle root

`PPTMAKER_FRAMEWORK/scripts/fonts/` becomes the canonical distribution root for HTML-runtime fonts and legal/provenance evidence:

- Source Sans 3 variable normal, weights 200-900, from Adobe's official `3.052R` WOFF2 release.
- Noto Sans SC variable normal, weights 100-900, from one repository-maintenance snapshot of the official Google Fonts CSS/WOFF2 service using fixed request parameters and a recorded modern-browser user-agent class. The observed service family is v40; the committed response bytes, not a floating URL response, become the runtime authority.

Implementation commits the original CSS response, every referenced Noto WOFF2 shard unchanged, generated local CSS with relative URLs, a complete inventory of URL/path/Unicode-range/SHA-256 evidence, measured byte totals, provenance, copyright notices, and OFL 1.1 material. Runtime never queries Google Fonts. No third-party font package is treated as upstream authority, and no local TTF-to-WOFF2 conversion or Python/fonttools production dependency is introduced.

The existing `@napi-rs/canvas` Stage-3 font behavior remains separate; WOFF2 distribution does not silently change its OTF/TTF/system fallback contract.

**Alternatives considered:** a third-party Noto package was rejected because it is not the owning upstream; local TTF conversion was rejected because it creates a Modified Version plus toolchain and Reserved Font Name obligations.

### 6. Change-1 font readiness is integrity plus fixed sentinel coverage

A versioned manifest records each required family, style, weight range, relative file, Unicode range, SHA-256, source snapshot/release, CSS identity, and license path. Static verification fails on missing files, digest drift, malformed or conflicting ranges, incomplete CSS-to-file inventory, or missing legal material.

The browser fixture exercises checked-in ASCII, Latin accent, punctuation/currency, numeral, common Simplified-Chinese, and CJK-punctuation sentinels. Required families/weights must be loaded from framework assets; system fallback is not readiness evidence. CSS must contain URL-only sources with no `local()` alternative. Static manifest/CSS/file hashes prove which bytes are eligible, while Chromium font-usage inspection for dedicated Latin and Han text nodes must report the expected family as a custom web font with non-zero glyph usage. `document.fonts.ready` and `document.fonts.check(...)` are synchronization/supporting assertions, not sufficient proof by themselves. Because doctor has no run-dir, it does not claim coverage for real slide source. Change 2 owns actual-source code-point preflight and Change 3 owns page font-load and pixel-overflow checks.

### 7. Doctor mode selection is additive and backward compatible

Mode resolution is deterministic:

| Invocation | Local base checks | Image2 presence | Network submit |
|---|---:|---:|---:|
| `doctor` | yes | no | 0 |
| `doctor --image2` | yes | yes | 0 |
| `doctor --smoke` | yes | yes | exactly 1 first-vendor submit |
| `doctor --probe-vendors` | yes | yes | exactly 1 submit per resolved vendor |

`--smoke` and `--probe-vendors` remain mutually exclusive and each implies `--image2`; a redundant explicit `--image2` is accepted. Base checks include existing local hard/advisory checks plus exact Playwright, paired Chromium, font integrity/sentinel coverage, and static smoke. Base output omits `api_key`, `image_base_url`, and `stage2_generator`. Image2 presence adds those existing checks and safely reports the resolved vendor count without endpoint or secret values.

This change does not invent a new multi-vendor credential format: the current `image-generation` SSOT continues to resolve one canonical `{base_url, api_key}` entry from `IMAGE2_BASE_URL` plus `IMAGE2_API_KEY`. The legacy plural probe remains array-generic and is tested against injected multi-entry resolver output, but normal configuration still reports one until a future owning change deliberately extends the credential contract.

The existing `env-check-v1` check-array and exit semantics remain authoritative. Direct `env-check --json` remains supported in every accepted mode, including live flags: stdout contains exactly one JSON document, while live heartbeats/human summaries move to stderr or into structured check evidence so they cannot corrupt the report. `ppt_flow doctor` remains text-only and preserves the delegated parent failure-envelope contract.

**Alternative considered:** require `--image2` in addition to old live flags. Rejected because it breaks existing invocations without improving consent or safety.

### 8. Live probes require MD confirmation and create no production authorization

`probe-image-channels` remains the shared Phase-0 / `00-setup` environment diagnostic controller. Before `--smoke`, the controller states that one provider submission is expected. Before `--probe-vendors`, it obtains the locally resolved vendor count, states that one submit per vendor is expected, and names the total. It then asks for confirmation and does not invoke the live flag until confirmed.

The diagnostic submit implementation makes one POST attempt per selected resolver entry with automatic redirects disabled and no retry loop. Redirects, timeouts, and ambiguous transport failures are reported without a second attempt in the same invocation; the ordinary Image2 production client's separate retry/failover policy is not reused by doctor probes.

The same rule applies when a live probe is proposed from BOOTSTRAP or another current playbook. Entry guidance no longer uses `style-master --force --resolution 1k` as a channel-health diagnostic: that command creates a real production reference asset and remains an action with its own legacy workflow context. After a successful `--probe-vendors` report and optional configuration write, confirm-write rechecks saved presence with offline `doctor --image2`; it does not automatically spend another `--smoke` submit. A new smoke is offered only when the just-probed result does not cover the saved combination or the human explicitly asks, and it requires a fresh one-submit disclosure and confirmation. Declining a doctor probe leaves local/Image2 presence evidence unchanged and makes no call. A successful probe proves only channel health; it does not approve a legacy build, create modern page-refinement state, or authorize any later provider attempt.

**Alternative considered:** treat diagnostics as implicitly authorized because they are small. Rejected because they can be billed and the global plan requires every remote cost to have disclosed scope and consent.

### 9. Legacy Image2 actions enforce action-specific prerequisites at submit time

Default doctor can no longer serve as the legacy remote gate. A shared guard runs only after the action has established that remote work is actually required and immediately before the first current Image2 adapter submission; it evaluates action-specific requirements through existing authorities:

- Every remote Image2 submission requires resolvable credential and base URL.
- Legacy page generation for pilot/build/visual rebuild requires its current style reference.
- Style-master generation requires transport credentials but does not require a pre-existing style master.

The guard is evaluated from current state, not a remembered doctor result. Missing prerequisites fail before adapter submit through the existing secret-safe CLI diagnostic authority. A no-op style-master invocation that retains an existing output and a Stage-2 invocation whose selected images all pass current-provenance reuse do not resolve transport credentials. Structural analysis/materialization, dry runs, local Stage subsets, notes-only work, and assembly from already reviewed images likewise neither acquire Image2 prerequisites nor call a remote adapter.

### 10. BOOTSTRAP changes readiness guidance, not product availability

BOOTSTRAP Step 1 maps all default check names to beginner-safe fixes, documents supported Node lines `22.x`/`24.x`/`26.x` (recommending current LTS `24.x` for a fresh install), consolidates npm dependency repair, and makes Chromium installation explicit. Image2 credential/presence/live-probe guidance moves into an optional subsection reached only when a selected action needs Image2.

The guidance distinguishes base NOT READY (blocks framework work), advisory warnings (non-blocking), and Image2 NOT READY (blocks only an Image2 action). This deliberately makes installed Chromium/fonts a universal transitional startup prerequisite before HTML deck authoring/rendering is exposed; the compatibility cost and explicit setup path are stated rather than hidden. It does not claim that HTML deck authoring/rendering or modern Image2 refinement is available; those product changes remain later.

### 11. Verification separates deterministic contracts from platform execution

- Unit tests cover mode resolution, ancestor dependency lookup, exact versions/profile, manifest/CSS/inventory coherence, sentinel coverage, no-install/no-system-fallback behavior, submit guards, and live-probe confirmation rules.
- Integration tests launch installed paired Chromium against the fixed fixture, assert exact custom-web-font usage, zero network requests, bounded timeout/cleanup behavior, exercise direct JSON output and delegated doctor envelopes, and use fake Image2 adapters to prove submit counts, lazy prerequisite acquisition, and fail-before-submit behavior.
- Active-doc consistency tests compare emitted check-name groups with BOOTSTRAP sections and reject stale Node-18, universal-Image2, runtime-download, full-CJK, or system-browser-fallback claims.
- The current acceptance target is the maintained macOS development machine. Its paired-browser fixture evidence covers launch, custom local-font use, zero-network behavior, geometry, and normalized profile facts; unit/profile tests cover rejection semantics for unsupported majors. Windows/Linux setup guidance and the checked-in CI workflow remain optional portability infrastructure and are not represented as executed evidence or a Change-1 completion gate.
- Full `npm test`, relevant E2E only where public legacy workflow boundaries change, and strict OpenSpec validation are completion gates. No production `deck_*` is a framework fixture.

## Risks / Trade-offs

- **[Playwright/Chromium materially increases installation size]** -> Install only Chromium, keep installation explicit, and diagnose missing package versus missing browser separately.
- **[Browser cache restoration can be incomplete or garbage-collected]** -> Verify the paired executable every run; bind optional cache keys to Playwright version/OS/architecture; never accept another executable.
- **[Noto's official web distribution contains many shards]** -> Commit one immutable CSS/file inventory and validate it mechanically; accept file-count overhead to avoid runtime network, third-party authority, and conversion risk.
- **[The official CSS service is mutable]** -> Pin retrieved bytes, request metadata, served path/version, every file hash, and local rewritten CSS; upgrades are explicit atomic maintenance.
- **[Sentinel checks may be mistaken for full deck coverage]** -> Name the boundary in diagnostics/docs and defer actual source/pixel checks to Changes 2/3.
- **[Base READY may be mistaken for Image2 or cost authorization]** -> Label modes, require current submit-boundary guards, and keep MD confirmation/production authorization separate.
- **[The transitional release makes Chromium/fonts universal before HTML deck rendering is exposed]** -> Mark the doctor behavior as breaking, provide explicit setup/remediation, and keep rollback atomic.
- **[The supported Node profile drops Node 18-21 and rejects undocumented odd majors]** -> Keep the `>=22` engine floor distinct from the checked-in `22.x`/`24.x`/`26.x` support set, and migrate checker, docs, CI, and tests together with direct platform upgrade guidance.
- **[Cross-platform raster pixels may differ]** -> Promise pinned inputs and tested geometry/font behavior, not byte identity across operating systems.

## Migration Plan

1. Raise the Node floor and add exact Playwright/package-lock/profile/setup-script changes with profile tests.
2. Acquire and commit official Source Sans/Noto assets, CSS, inventory, hashes, provenance, licenses, and the fixed fixture; validate all evidence before wiring readiness.
3. Implement the internal runtime module and real offline Chromium fixture smoke while preserving built-ins-only `env-check` startup.
4. Inventory and protect every current remote Image2 submit boundary before removing Image2 checks from default readiness.
5. Add base/Image2/live mode resolution and `doctor --image2` delegation without changing existing JSON/envelope authorities.
6. Update `probe-image-channels`, BOOTSTRAP, and active environment/runtime guidance, then run terminology/check-name consistency scans.
7. Run focused tests, real local paired-browser smoke, full tests, relevant E2E, and strict OpenSpec validation.

Rollback is atomic: revert package/lock/profile/font/checker/guard/guidance changes together. No run-bundle source, state, or generated-artifact migration is required because Change 1 changes environment and current legacy submit preconditions only.

## Open Questions

None for apply. Exact committed font filenames, byte totals, and SHA-256 values are generated and reviewed during the vendoring task from the locked official sources; they become runtime authority in the committed manifest rather than being guessed in planning prose.
