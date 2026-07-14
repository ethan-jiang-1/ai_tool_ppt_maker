## Why

当前视觉管线用 **Style Anchoring**（`style_master.jpg` 作为唯一的 reference image）保证每页 slide 色彩/字体一致性。但 GPT Image 2 支持**多张 reference image** — 当 slide 需要特定 diagram、SVG、reference photo 等模型不知道的视觉元素时，没有机制把这些资产作为附加 reference image 传入。需要在 "全局风格锚点" 之外引入 per-slide 资产绑定能力。

## What Changes

- **新增 `assets/` 目录** 于 `2_backbone/visual-style/` 下，存储 SVG/PNG/JPG 视觉资产
- **新增 `asset-manifest.yaml`** 作为资产目录 SSOT，每个资产一条记录（id, path, type, description, usage_guidance）
- **新增 `**VISUAL ASSETS**` 字段** 于 slide-specifications.md，逗号分隔的资产 ID 列表，绑定资产到 slide
- **Stage 1** 解析 VISUAL ASSETS 字段，验证引用（未知 ID → WARNING），写入 `slide_plan.json` 和 `_prompts.json`
- **Stage 2** 接受 assetResolver 闭包，计算资产 SHA-256 纳入 generation fingerprint，传递附加 reference paths 到 API
- **API client** `generateOneImage` 新增 `additionalReferencePaths` 参数，多张 reference image 随 style_master 一起发送
- **Provenance** `generationProfile` 新增 `assetRefs` 参数，资产内容变化 → fingerprint 变化 → 旧图 stale → `--force-images`
- **向后兼容** 所有新参数有默认值，不写 `**VISUAL ASSETS**` 的 slide 行为完全不变

## Capabilities

### New Capabilities
- `visual-asset-management`: 视觉资产目录管理 — asset-manifest.yaml 加载/校验、资产文件指纹计算、按 ID 解析路径

### Modified Capabilities
- `content-parsing`: Stage 1 新增 `**VISUAL ASSETS**` 字段解析，绑定验证（WARNING 级），populate `assets`/`asset_ids` 到输出
- `image-generation`: Stage 2 支持 per-slide 多 reference image（全局 style_master + per-slide assets），generation fingerprint 纳入资产 hash
- `run-bundle-layout`: 注册 `assets/` 子目录为合法产物（renderTree, whitelist, checkBundle）
- `run-bundle-management`: init 时创建 `assets/` 子目录骨架 + stub `asset-manifest.yaml`

## Impact

- **新建 2 脚本/测试**: `asset_manifest.mjs`, `test_asset_manifest.mjs`
- **修改 10 文件**: `bundle_layout.mjs`, `stage1_build_inputs.mjs`, `stage2_generate_images.mjs`, `image_api_client.mjs`, `image_provenance.mjs`, `unified_pipeline.mjs`, `ppt_flow.mjs`, `template-slide-specifications.md`, `glossary.md`, `config.yaml`
- **修改 4 现有 spec**: `content-parsing/spec.md`, `image-generation/spec.md`, `run-bundle-layout/spec.md`, `run-bundle-management/spec.md`
- **新建 1 spec**: `visual-asset-management/spec.md`
- **扩展 3 test**: `test_stage1_build_inputs.mjs`, `test_image_generation.mjs`, `test_bundle_layout.mjs`
- **无 breaking change** — 所有新参数有默认值，未使用资产功能的行为保持不变
