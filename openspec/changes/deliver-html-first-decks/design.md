## Context

Change 1 supplies an exact local Node/Playwright/Chromium/font runtime. Change 2 supplies an opt-in `html-first-v1` source, a complete renderer-neutral `pptmaker-html-slide-plan-v1`, ten closed layout families, immutable geometry, strict visual config, a passive local asset catalog, source/font/capacity preflight, fallback/selection resolution, and stable fingerprints. The current orchestration intentionally stops after Stage 1 and rejects every HTML-first delivery route with `html_first_delivery_unavailable`.

The repository remains MD-controller-first. Playbooks own user intent, review, gates, and route selection; JS owns deterministic source resolution, rendering, evidence, state healing, and diagnostics. The change must make the new path usable without allowing JS to become a second workflow controller, and must atomically migrate the active workflow vocabulary so new and resumed sessions do not see two contradictory lifecycles.

The single completion line is a fresh init that, with no Image2 credentials or style master, can author valid structured slides, show real local HTML previews, obtain content/visual approval, and publish a current contact sheet, PPTX, and notes. Markerless decks remain operable through an explicit legacy controller. Change 4's paid visual-slot workflow remains unavailable and unregistered.

## Goals / Non-Goals

**Goals:**

- Render every valid Change-2 family deterministically with exact geometry, local fonts/assets, actual browser measurement, and zero network.
- Publish self-contained per-slide HTML and verified PNG final slides through atomic, receipt-bound manifests.
- Make Stage 4 consume provider-neutral final-slide evidence and preserve Stage-5 stable-ID notes.
- Make HTML-first the new-deck/template default and expose complete preview/build/local refresh/structural materialization.
- Define review freshness that shows real compositor output without staling the whole deck for ordinary copy edits.
- Atomically migrate workflow directories, Phase/module enums, playbook controllers, state, guidance, links, and resume behavior.
- Preserve markerless legacy production and provide explicit, human-confirmed clean-vNext migration.

**Non-Goals:**

- Image2 visual-slot recommendation, planning, authorization, generation, candidates, promotion, cleanup, or modern `ppt_flow image2` commands.
- Whole-page Image2 changes, automatic prompt migration, provider calls from HTML rendering, or carrying legacy authorization into a migrated version.
- Arbitrary slide HTML/CSS/JavaScript, browser network access, system fonts, system browsers, or OS-independent pixel identity.
- PowerPoint-native editable text/chart objects, multiple visual slots, or changing the ten Change-2 family/source schemas.

## Decisions

### 1. One branch adapter selects a complete production implementation

`probeProductionMarker()` remains the earliest executable authority. `unified_pipeline` and `ppt_flow` select one complete branch adapter after canonical source selection:

```text
html-first-v1                     markerless legacy
Stage 1 structured plan           Stage 1 prompts/legacy plan
Stage 2 self-contained HTML       Stage 2 Image2 whole-page images
Stage 3 measured final-slide      Stage 3 header lock/passthrough
Stage 4 verified final-slide PPTX Stage 4 verified legacy final-slide PPTX
Stage 5 notes                     Stage 5 notes
```

The adapters expose the same orchestration-level operations (`validate`, `preview`, `build`, scoped rebuild, structural materialize) but keep their prerequisites and artifact paths private. HTML operations never initialize dotenv, credentials, style reference, or provider adapters. Legacy operations retain their current guards and manifests. Stage-number compatibility is retained for the unified CLI, but family/render logic lives behind the HTML adapter rather than in orchestration switches.

**Alternative:** replace legacy Stages 2/3 globally. Rejected because markerless decks still need their current renderer, review, and refresh semantics.

### 2. `composeSlide` is the deep renderer boundary

The new `html-slide-rendering` module exposes a dependency-light planning layer and one browser-backed composition operation:

```text
prepareHtmlSlide(planSlide, resolvedTheme, resolvedAssets, runtimeProfile)
  -> { compositionFingerprint, selfContainedHtml, receipts }

composeSlide(preparedSlide, pinnedRuntime)
  -> { measurements, fontEvidence, finalPng, finalSha256, manifestEntry }
```

Family components consume only the resolved plan's boxes and versioned theme tokens. They do not parse Markdown/YAML, resolve catalog paths, choose layout, or mutate source. A closed component registry covers all ten families and typed blocks; adding a family/component/version requires a later contract change.

**Alternative:** one public renderer per family. Rejected because it leaks family schemas and invalidation rules into orchestration and tests.

### 3. Pages are self-contained; charts are produced as Node-side SVG

Each page is an inert HTML document with no external script, stylesheet, font, image, iframe, service worker, or network reference. The builder embeds:

- only the verified Source Sans 3 file and Noto Sans SC shards whose declared ranges cover the page's visible scalars, as WOFF2 data URLs;
- validated raster assets as data URLs and validated passive SVG assets inline;
- abstract-pattern/icon-composition output derived from versioned theme tokens;
- chart SVG generated before browser launch from exact direct dependency `echarts@6.1.0` in SSR SVG mode, with animation disabled and a closed option adapter derived only from the Change-2 chart record/theme.

The generated ECharts SVG is revalidated through a renderer-owned closed SVG-output check before embedding; source cannot supply ECharts options. The browser page contains no ECharts runtime or arbitrary JavaScript. Exact `echarts`, `zrender`, and lockfile versions plus license/audit evidence are checked during apply.

**Alternative:** load ECharts JavaScript inside Chromium. Rejected because it widens the page execution surface and makes chart readiness/animation timing part of screenshot determinism.

### 4. The screenshot profile is versioned and browser measurement is fail-closed

The v1 compositor uses the Change-2 logical canvas `1000 x 562.5` CSS units and captures an exact `2000 x 1125` PNG at device scale factor 2. Apply includes a pinned-runtime probe that proves fractional clip semantics; if the paired browser cannot produce the exact output, the profile is revised in artifacts before implementation rather than rounded silently.

Rendering launches only the paired Chromium, uses one browser/context per deck invocation and sequential pages, blocks service workers, aborts every HTTP/HTTPS request, waits for `document.fonts.ready`, disables animations/transitions/caret, and closes pages/context/browser in `finally`. A per-page 30-second timeout and bounded deck timeout report the last normalized phase.

Every visible schema field has a renderer-owned DOM marker. Before capture JS checks root/slot scroll bounds, declared family box bounds, text line boxes, chart SVG bounds, image crop/focal-point bounds, and any clipping/overlap exception against the resolved registry. CDP font inspection proves non-zero custom-font glyph use for every rendered font role/family present. A failure publishes neither HTML-current nor final-slide-current evidence.

**Alternative:** trust Change-2 grapheme capacity. Rejected because source capacity is intentionally not browser pixel proof.

### 5. HTML pages and final slides have separate atomic manifests

The canonical generated tree is:

```text
_generated/html_production/
  html_pages/<slide_id>.html
  html_pages/manifest.json
  final_slides/<slide_id>.png
  final_slides/manifest.json
  preview/contact_sheet.jpg
  preview/manifest.json
```

HTML entries bind slide ID, self-contained HTML SHA, composition fingerprint, renderer versions, runtime profile, exact input receipts, and normalized source lineage. Final-slide entries additionally bind measurement/font/network evidence, screenshot profile, HTML SHA, PNG SHA/dimensions, and `artifact_kind: final-slide`. Paths are run-dir-relative and confined by lexical/realpath checks.

Each stage builds a hidden sibling transaction directory, rechecks all receipts and realpaths, then atomically replaces only its owned manifest and current files. Failed or interrupted runs leave the prior current directory set intact and clean their own hidden staging on next invocation. Unreferenced stale files are removed only as part of a successful manifest-bound replacement.

**Alternative:** write page/final files in place and rebuild the manifest last. Rejected because a crash could expose mixed-snapshot files to Stage 4.

### 6. Per-slide composition identity excludes position; delivery identity includes order

`composition_fingerprint_v1` hashes renderer/compositor/component/chart/recipe versions, pinned runtime profile, the slide's complete renderer-consumed plan record excluding `position` and source locators, resolved theme, geometry, fallback/selection resolution, and referenced asset/font SHAs. Reorder therefore reuses unchanged HTML/final-slide bytes. Copy, geometry, visual-system, fallback, runtime, or renderer changes invalidate only affected composition entries.

`html_delivery_digest_v1` hashes physical ordered slide IDs, their current composition fingerprints/final PNG SHAs, and the Stage-1 ordered plan digest. Stage 4 binds this digest in its receipt, so reorder rebuilds contact sheet/PPTX/notes order without rerendering unchanged slides.

### 7. Visual approval uses one pipeline-specific reserved evidence record

The existing gate names remain `content` and `visual`, but HTML evidence cannot satisfy legacy gates or vice versa. State schema v3 reserves `html-visual-review` alongside legacy `header-review`. Its versioned record contains pipeline, visual-system fingerprint, covered family/geometry keys, representative slide IDs, preview manifest/SHA evidence, and page-local `page_reviews`.

The deck-level `visual_system_fingerprint_v1` covers resolved visual config, runtime profile, family registry SHA, renderer/component/chart/recipe/compositor versions, and fallback asset SHAs used by representative pages. Copy changes do not stale it. A new family/geometry or global visual-system change requires a new representative preview and whole visual approval. Page-local family/fallback asset changes require a forced-fallback affected-page preview and update only `page_reviews[slide_id]`; if the source has a current selected asset, review still renders the fallback variant. Broken selected bytes remain source-integrity failures, not reviewable changes.

Preview emits a hash-bound review plan. `ppt_flow approve <run-dir> visual --plan-hash <sha>` records approval only when current preview bytes and receipts still match. MD Controller owns showing the artifacts and obtaining the human decision; JS owns freshness and exact evidence.

### 8. HTML maintenance paths are ownership-based and remote-free

After marker classification, the change classifier maps HTML source changes to:

- Local Slide Rebuild: selected slide source/family/fallback change -> Stage 1, affected HTML/final slides, affected review, contact sheet/PPTX/notes.
- Local Deck Rebuild: visual config/runtime/renderer change -> Stage 1, representative preview/gate, all affected HTML/final slides, delivery.
- Notes-Only Refresh: notes and Stage 5 only when assembly lineage remains current.
- Structural Versioning Path: preview/hash-bound source transaction, hidden vNext validation/publication, then target-local HTML rebuild.

No HTML path imports the provider adapter or creates Image2 state/directories. Legacy requests retain Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, and Structural Versioning Path.

### 9. Stage 4 consumes one provider-neutral final-slide contract

`render_artifacts.mjs` gains provider-neutral resolution by `{slide_id, artifact_kind: final-slide, composition_fingerprint}`. The HTML final manifest and legacy Stage-3 manifest both produce the common verified evidence shape. Stage 4 receives an explicit manifest path/branch adapter, validates exactly one current PNG per ordered plan ID, verifies SHA/dimensions, and never selects by engine, directory glob, or filename position. Its schema-vNext receipt binds the branch, plan SHA, HTML delivery digest when applicable, ordered IDs/images, and PPTX SHA. Stage 5 continues to consume the current assembly receipt and source notes contract.

### 10. New init is HTML-first; markerless legacy remains explicit

`initBundle` seeds the HTML-first marker, mnemonic identity scheme, structured authoring template, all five current preset-compatible visual tokens, and an empty v2 asset manifest/README. It does not create style master, legacy prompt outputs, Image2 refinement directories, or Image2 pending state. Intake asks content/visual questions but never asks the user to select a renderer.

Markerless sources remain `legacy-image2-first` at the adapter/controller boundary. No defaulting or state heal inserts the HTML marker into an existing source.

### 11. Legacy migration is a distinct hash-bound transaction

Migration uses a dedicated preview/apply operation, not ordinary source surgery. The Agent prepares a complete candidate source/control delta in a version-local `_scratch/html-migration/` transaction. Preview validates it as a projected HTML run, renders every page locally, and produces a source diff plus old/future contact-sheet comparison and exact plan hash. Apply requires that hash, copies the authorized delta into a hidden vNext, revalidates and rerenders the staged target, then atomically publishes the version. It carries no generated legacy images, style-master requirement, provider authorization, or prompt inference. Failure leaves the legacy version and hidden-target cleanup invariant intact.

### 12. Workflow, playbooks, enums, and state migrate atomically

Apply moves the active workflow tree to exactly `00-setup`, `01-content`, `02-visual-system`, `03-html-production`, `04-image2-refinement`, and `05-iteration`. `04-image2-refinement` contains only an unavailable README and is absent from active node/controller indexes. Legacy whole-page guidance moves to `reference/legacy-image2-first-maintenance.md`; `legacy-image2-maintenance.md` is the only controller that routes markerless production. `probe-image-channels` remains off-path Phase 0.

Node metadata becomes lifecycle `0|1|2|3|4|5` and method modules matching the six directory names. State schema v3 uses a checked-in migration map keyed by old playbook/node plus detected pipeline. Known mappings preserve execution identity, completed/skipped evidence, waits, gates, reserved records, and stack frames. Markerless in-progress create/edit flows migrate to legacy maintenance; HTML-marked flows migrate to the new controllers. Missing source, conflicting marker, or one-to-many semantic mapping returns a typed human replacement/restart action and does not rewrite state.

**Alternative:** keep alias directories and old enums indefinitely. Rejected because two active method trees make ownership and resume semantics ambiguous.

### 13. Verification is layered around the product completion line

- Unit: family/component HTML snapshots, escaping, ECharts adapter, fingerprints, overflow/font/network normalization, manifest/receipt validation, state mapping, classifier, and directory/link rules.
- Integration/golden: all 68 geometry variants, every family min/max/bilingual/callout/fallback/selected/stale case, exact output envelopes, atomic drift/failure, page-local review freshness, provider-neutral Stage 4, and legacy isolation.
- E2E: fresh init -> HTML preview/content+visual gates -> contact sheet/PPTX/notes with provider adapter trap and no Image2 paths; local text/visual/notes edits; reorder/delete/insert target rebuild; legacy build unchanged; legacy migration comparison/confirm; state resume across old/current schemas.
- Full: CLI executable/return audits, bundle self-check, docs/link/frontmatter coherence, dependency/license/audit, `npm test`, relevant `tests_e2e`, and strict OpenSpec.

No `deck_*` or `dpt_*` production data becomes a fixture.

## Risks / Trade-offs

- **[Change 3 is intentionally broad]** → Keep one vertical completion assertion and deep module seams; tasks are grouped by renderer, artifacts/delivery, workflow/state, migration, and verification rather than by file count.
- **[HTML embedding can create large page files]** → Embed only page-used font shards/assets, cap page bytes, record benchmark evidence, and keep HTML generated/rebuildable.
- **[Browser measurements can drift]** → Pin runtime/profile, version all rendering inputs, use exact screenshot goldens on the maintained Mac, and make cross-OS guidance non-normative.
- **[ECharts SVG may change across releases]** → Exact-pin `echarts@6.1.0`, disable animation, own a closed adapter/goldens, and include its version/output in fingerprints.
- **[State migration can misclassify old work]** → Inspect source marker before mapping, use a checked-in one-to-one map, preserve raw state on ambiguity, and require explicit human replacement.
- **[Default switch can strand newly initialized decks]** → Do not change init/template until renderer, assembly, gates, docs, and fresh E2E are passing together; commit the switch atomically.
- **[Legacy and modern manifests can cross]** → Branch-specific stage adapters produce one common final-slide evidence shape; tests trap cross-branch directories and provider calls.
- **[Visual gate can become too broad or too weak]** → Separate deck visual-system fingerprint from page review evidence and force fallback review even when a selected asset is current.

## Migration Plan

1. Add the renderer/component/chart/fingerprint modules and non-default fixtures while Change-2 delivery guards remain active.
2. Add HTML page/final-slide manifests, Stage-2/3 branch adapter, provider-neutral Stage 4, local preview/build, and verification.
3. Add HTML gate evidence, local rebuilds, structural target materialization, and legacy migration transaction.
4. Prepare the final workflow/playbook/docs tree and state-v3 mapping in tests; validate every link/node/old-state fixture.
5. Atomically switch init/templates/default guidance, workflow directories/enums, public orchestration, and state heal; run fresh and legacy E2E before considering the change complete.
6. Rollback restores the previous workflow/default and HTML delivery guard while leaving structured source valid. Generated HTML artifacts are deletable; markerless legacy source/state remains usable. A deck explicitly created/migrated as HTML-first is not silently converted back—rollback guidance preserves it for a forward repair or explicit legacy export decision.

## Open Questions

- The temporary pinned-runtime probe has confirmed ECharts 6.1.0 SSR SVG creation without DOM. Apply must still inspect its emitted SVG vocabulary and define the closed renderer-output sanitizer/golden before accepting it.
- Apply must prove the exact fractional CSS clip/device-scale screenshot profile on paired Chromium. If it cannot produce `2000 x 1125` deterministically, update the profile/specs before implementing rather than rounding at runtime.
- The full old-node-to-new-node/state-stack migration table must be enumerated from the final rewritten playbooks before the default switch. Ambiguous cases are already fail-closed; no product choice remains open.
