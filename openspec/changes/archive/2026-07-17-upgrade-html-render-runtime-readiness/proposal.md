## Why

The framework currently makes Image2 credentials and implementation presence part of universal startup readiness, while the planned HTML-first path needs a reproducible local browser/font runtime that does not depend on Image2. This first progressive-rendering change establishes that runtime and separates local readiness from optional Image2 environment and live-channel checks without prematurely introducing the HTML deck workflow.

## What Changes

- **BREAKING** Raise the repository engine floor from Node.js 18+ to `>=22`, and make the checked-in Playwright profile support only the documented Node major lines `22.x`, `24.x`, and `26.x` across executable gates, CI, tests, and active runtime guidance.
- **BREAKING** Redefine default doctor readiness to require the pinned local Chromium/font smoke even during the transitional release before HTML deck rendering ships; Image2 credentials cease to be universal while the local HTML foundation becomes universal.
- Add one pinned local HTML runtime profile: exact Playwright library and paired Chromium, explicit browser installation/cache behavior, checked-in browser/font smoke fixture, and a no-network execution contract.
- Distribute licensed Latin and Simplified-Chinese (`Hans`) WOFF2 assets from official upstream services under the framework soft bundle, with pinned local CSS, complete file inventory, SHA-256 integrity, Unicode ranges, provenance, copyright, and OFL material.
- Make default doctor an offline base-readiness check. Add `ppt_flow doctor --image2` for offline Image2 presence checks; keep `--smoke` and `--probe-vendors` as explicit, backward-compatible live probes.
- Require the MD Controller to disclose the expected Image2 submit count and obtain confirmation before either live probe. Environment or channel readiness does not create page-refinement authorization.
- Preserve legacy Image2-first behavior by checking credentials, base URL, and required style reference immediately before actual legacy remote submission rather than relying on default doctor as a global gate.
- Update only active environment/runtime/bootstrap guidance. Do not expose structured slide authoring, HTML rendering, new-deck defaults, visual-slot refinement, or the future workflow-directory migration in this change.

## Capabilities

### New Capabilities

- `html-render-runtime`: Owns the supported Node/Playwright/Chromium/font profile, explicit browser setup/cache contract, framework-distributed web-font evidence, and renderer-independent offline browser smoke reused by later HTML rendering.

### Modified Capabilities

- `environment-check`: Raises the Node gate, adds browser/font base checks, and separates default base readiness from offline Image2 presence and explicit live probes.
- `bootstrap-env-guidance`: Makes base setup beginner-complete without Image2 while retaining optional, self-contained Image2 remediation when that path is selected.
- `cli-surface`: Adds text-only `doctor --image2` delegation and preserves the existing live-probe and failure-envelope contracts.
- `pipeline-orchestration`: Raises the runtime floor and moves legacy Image2 prerequisites to the actual remote-submit boundary without burdening local, dry-run, or structural paths.
- `framework-directory-layout`: Makes `PPTMAKER_FRAMEWORK/scripts/fonts/` the canonical soft-bundle home for distributed HTML font binaries, CSS, manifest, provenance, and licenses without changing the five-directory framework root.
- `playbook-execution`: Keeps channel diagnosis in the Phase-0 `probe-image-channels` controller and requires cost disclosure and confirmation before live Image2 probes.
- `image-generation`: Makes confirmed doctor probes, rather than style-master generation, the documented channel-diagnostic path and preserves consent before retaining probe-derived configuration lessons.

## Impact

- **Domain and ownership:** Framework repository maintenance only. JS/CLI owns deterministic runtime evidence, readiness aggregation, submit-boundary guards, and secret-safe diagnostics; MD Controller owns whether and when a paid live probe is proposed and confirmed; the human owns consent. No `deck_*` is modified or used as a framework fixture.
- **Runtime and dependencies:** `package.json`, lockfile, Node/CI declarations, exact Playwright dependency, paired Chromium installation workflow, and framework-distributed WOFF2 assets/licenses.
- **Framework code:** `env-check.mjs`, `ppt_flow.mjs`, shared runtime/font helpers and fixtures under `PPTMAKER_FRAMEWORK/scripts/`, plus current legacy Image2 orchestration call sites.
- **Guidance:** BOOTSTRAP and active setup/runtime documentation only. Existing workflow/playbook topology remains in place except for the bounded live-probe confirmation rule.
- **Compatibility:** Node 18-21 and undocumented odd major lines such as 23/25 are unsupported by this profile even though package metadata can express only the `>=22` engine floor. Existing `doctor --smoke` and `doctor --probe-vendors` remain valid. Existing users must install paired Chromium to regain default doctor READY, including users who temporarily remain on the legacy Image2 path. Legacy Image2-first pilot/build remains available and fails closed only when actual remote work lacks its prerequisites.
- **Delivery boundary:** After this change, maintainers can install and diagnose a fixed local browser/font runtime, but users still cannot render a structured HTML slide deck or enter modern Image2 visual-slot refinement; those remain later changes.
