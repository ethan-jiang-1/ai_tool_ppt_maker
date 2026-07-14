## 1. Foundation — bundle layout + asset manifest module

- [ ] 1.1 Add `BACKBONE_ASSETS_SUBDIR`, `ASSET_MANIFEST_FILE`, `ASSET_SVG_SUBDIR`, `ASSET_REFERENCE_SUBDIR`, `ASSET_ICONS_SUBDIR` constants to `bundle_layout.mjs` (~line 136)
- [ ] 1.2 Add `assetsDir(runDir)` and `resolveAssetPath(runDir, relpath)` path resolvers to `bundle_layout.mjs` (~line 287)
- [ ] 1.3 Add `BACKBONE_ASSETS_SUBDIR` to `_ALLOWED_IN_VISUAL_STYLE`; add new `_ALLOWED_IN_ASSETS` set; update `checkBundle()` to validate `assets/` directory contents
- [ ] 1.4 Update `renderTree()` to include `assets/` subtree (svg/, reference/, icons/, asset-manifest.yaml) under `visual-style/`
- [ ] 1.5 Update `initBundle()` to create 4 assets subdirectories, write README, write stub `asset-manifest.yaml` (`version: 1\nassets: {}\n`)
- [ ] 1.6 Update `selfCheck()` to verify new constants appear in `renderTree()` and `_ALLOWED_IN_VISUAL_STYLE`
- [ ] 1.7 Create `PPTMAKER_FRAMEWORK/scripts/asset_manifest.mjs` with 5 exports: `loadAssetManifest` (empty file → empty catalog), `validateAssetManifest` (reject `..` and absolute paths in `entry.path`), `resolveAssetFile`, `sha256Asset`, `aggregateAssetSha256` (return `""` when all files missing)

**Capabilities**: `run-bundle-layout`, `run-bundle-management`, `visual-asset-management`

## 2. Stage 1 integration + provenance update

- [ ] 2.1 Add `assetManifest` optional parameter to `parseSlides()` — extract `**VISUAL ASSETS**`, validate against manifest (WARN unknown, skip), populate `assets` in slideRecord and `asset_ids` in promptEntry. Also update standalone `main()` to load manifest via `--style-dir` flag and pass to `parseSlides`.
- [ ] 2.2 Add `assetManifest` optional parameter to `validateSpecRecords()` and `validateSpecs()` — produce WARNING records for unknown asset IDs; `validateSpecs` passes through to `validateSpecRecords`
- [ ] 2.3 Update `unified_pipeline.mjs` `stage1()` — load asset manifest via `assetsDir(runDir)`, pass to `parseSlides` and `validateSpecRecords` (wrap in try/catch, manifest may not exist)
- [ ] 2.4 Add `assetRefs` optional parameter to `generationProfile()` in `image_provenance.mjs` — conditional `asset_refs` key when non-empty

**Capabilities**: `content-parsing`, `pipeline-orchestration`, `image-generation`

## 3. Stage 2 integration + multi-reference API support

- [ ] 3.1 Add `additionalReferencePaths` parameter to `generateOneImage()` in `image_api_client.mjs` — extend `fileToDataUrl()` with `.svg` → `image/svg+xml` MIME type; convert asset paths to data URLs; merge into `body.images`; keep `body.image` as style_master
- [ ] 3.2 Add `assetResolver` parameter to `generateImages()` in `stage2_generate_images.mjs` — move profile computation inside per-slide loop; for each slide, resolve `asset_ids` via `assetResolver`, compute per-slide SHA-256, build per-slide `assetRefs` map (empty `{}` for non-referencing slides), pass to `generationProfile()`; build `profiles` Map (`slideId → profile`) and return it in result (replacing the single `profile` return value)
- [ ] 3.3 In per-slide loop of `stage2_generate_images.mjs`: resolve per-slide `asset_ids` via `assetResolver`, pass as `additionalReferencePaths` to `generateOneImage()`
- [ ] 3.4 Update `unified_pipeline.mjs` `stage2()` — import `loadAssetManifest` + `resolveAssetFile` from `asset_manifest.mjs`; load manifest; construct `assetResolver = (id) => resolveAssetFile(runDir, manifest, id)` closure; pass to `generateImages()`. Replace post-generation `validateImageProvenance` call with per-slide `inspectImageProvenance` using `result.profiles.get(slideId)` — the old single-`profile` batch call is incompatible with per-slide profiles.

**Capabilities**: `image-generation`, `pipeline-orchestration`

## 4. Specs, config, templates, docs

- [ ] 4.1 Register `visual-asset-management` capability in `openspec/config.yaml` under 视觉设计 category
- [ ] 4.2 Review and finalize `openspec/specs/visual-asset-management/spec.md` — verify all requirements and scenarios match the implemented behavior
- [ ] 4.3 Review and finalize delta specs — verify `content-parsing`, `image-generation`, `run-bundle-layout`, `run-bundle-management` spec deltas match implementation
- [ ] 4.4 Insert `**VISUAL ASSETS**` field (commented-out optional) in `template-slide-specifications.md` between TITLE and CONCEPT
- [ ] 4.5 Add 3 new terms to `glossary.md`: Visual Asset, asset-manifest.yaml, VISUAL ASSETS; update Where Map
- [ ] 4.6 Add `BACKBONE_ASSETS_SUBDIR`, `ASSET_MANIFEST_FILE`, `assetsDir` to `ppt_flow.mjs` imports from `bundle_layout.mjs`

**Capabilities**: `visual-asset-management`, `content-parsing`, `image-generation`, `run-bundle-layout`, `run-bundle-management`, `cli-surface`

## 5. Tests

- [ ] 5.1 Create `tests/test_asset_manifest.mjs` — 13 test cases covering all load/validate/resolve/hash/aggregate scenarios
- [ ] 5.2 Extend `tests/test_stage1_build_inputs.mjs` — 3 test cases: VISUAL ASSETS parsing, unknown ID warning, absent field
- [ ] 5.3 Extend `tests/test_image_generation.mjs` — 4 test cases: multi-reference body, profile with/without assetRefs, fingerprint invalidation
- [ ] 5.4 Extend `tests/test_bundle_layout.mjs` — 3 test cases: renderTree includes assets, init creates skeleton, checkBundle validates assets whitelist
- [ ] 5.5 Run `npm test` — all existing tests pass (backward compat), new tests pass

**Capabilities**: `visual-asset-management`, `content-parsing`, `image-generation`, `run-bundle-layout`, `run-bundle-management`
