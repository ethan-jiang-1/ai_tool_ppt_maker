## Context

当前视觉管线的 Style Anchoring 机制只传 `style_master.jpg` 作为唯一的 reference image。GPT Image 2 API 支持多张 reference image（`body.images` 数组），但现有代码只用单张。需要在全局风格锚点之外，引入 per-slide 的附加视觉资产绑定。

资产形态包括：SVG 文件（精确矢量图）、PNG/JPG 参考图（diagram、icon set、illustration）、以及未来可能的其他 visual reference。资产存在 `2_backbone/visual-style/assets/`（共享主干），通过版本级 `overrides/` 可覆盖。

**核心原则：placeholder on init, optional for pipeline。** `initBundle` 始终为新 deck 创建 `assets/` 骨架和 stub `asset-manifest.yaml`（`assets: {}`）——即使用户一开始不需要，目录和 manifest 也在那里作为 discoverable placeholder。当用户后来意识到需要视觉资产时，只需往里加文件、注册 manifest、在 slide-specs 里绑定即可。但 `checkBundle` 不要求 `assets/` 存在（旧 deck 无此目录仍然通过校验），Stage 1/2 也 graceful degrade（manifest 缺失 → 跳过资产解析，无报错）。

## Goals / Non-Goals

**Goals:**
- 定义资产目录结构（`assets/` 含 manifest + svg/reference/icons 子目录）
- 提供 `asset_manifest.mjs` 模块：加载/校验 YAML manifest、解析资产路径、计算 SHA-256
- Stage 1 解析 `**VISUAL ASSETS**` 字段，验证绑定，写入 `slide_plan.json` 和 `_prompts.json`
- Stage 2 接受 `assetResolver` 闭包，计算资产 SHA-256 纳入 fingerprint，传递附加 reference paths 到 API
- `generateOneImage` 支持 `additionalReferencePaths`，多 reference image 随 style_master 发送
- `generationProfile` 纳入资产 hash，资产变化 → fingerprint 变化 → 旧图 stale
- 向后兼容：不写 `**VISUAL ASSETS**` 的 slide 行为完全不变

**Non-Goals:**
- 不在此 change 中实现 SVG→PNG 光栅化（如果 API 不支持 SVG 直接上传，后续 change 处理）
- 不改变 prompt 文本（资产作为 reference image 在 API 层面附加，不注入 prompt）
- 不增加新的 CLI flag（资产指纹变化走现有 `--force-images`）
- 不在此 change 中实现 per-slide image trace 中的资产明细（当前 trace 只记录 basename 列表）
- 不生成资产内容（agent 或人手动添加资产文件到 `assets/` 目录）

## Decisions

### D1: 资产 resolver 是 orchestrator 注入的闭包

**选择**: `unified_pipeline.mjs` 导入 `resolveAssetFile` from `asset_manifest.mjs`，构造 `assetResolver = (assetId) => resolveAssetFile(runDir, manifest, assetId)` 闭包，注入 `stage2_generate_images.mjs`。

**替代方案 A**: 让 stage2 直接 import `bundle_layout.mjs` 和 `asset_manifest.mjs`，自己解析路径。

**替代方案 B**: 在闭包内手动查 manifest + 调 `resolveAssetPath` from `bundle_layout.mjs`，复制 `resolveAssetFile` 的逻辑。

**理由**: 方案 A 让 stage2 耦合到路径解析——违反现有模式（stage2 不 import bundle_layout 路径函数，`styleReference` 由 orchestrator 传入）。方案 B 造成 `resolveAssetFile` 逻辑在两处重复实现。当前选择复用 `asset_manifest.mjs` 的公开 API，闭包只做部分应用（capture `runDir` + `manifest`），保持 stage2 纯净。

### D2: 资产描述不替代 IMAGE PROMPT

**选择**: 资产的 `description` 和 `usage_guidance` 是给人（和 agent）读的文档，不自动注入 prompt。

**理由**: 资产作为 reference image 在 API 层面附加——模型看到的是实际图片文件，不需要文字描述。这和 `style_master.jpg` 的模式一致——风格通过图片传递，不通过文字描述。Agent 在写 IMAGE PROMPT 时可以参考资产描述来决定如何引用资产。

### D3: Per-slide asset profile 而非全局 aggregate

**选择**: 在 Stage 2 per-slide 循环内，根据当前 slide 的 `asset_ids` 计算该页专属的 `assetRefs`，传入 `generationProfile()` 生成 per-slide profile。不引用资产的 slide 的 profile 不含 `asset_refs` key——与现有代码输出完全一致。

**替代方案**: 在循环前计算所有 slide 引用资产的 global aggregate SHA-256，放入共享 `generationProfile`。

**理由（为什么不用 aggregate）**: 当前 `stage2_generate_images.mjs` 在循环外计算一个共享 `profile`（line 84），用于每页的 `inspectImageProvenance()` 和 `buildImageManifestEntry()`。如果用 global aggregate，**所有 slide 的 profile 都会包含 `asset_refs`**——包括不引用任何资产的 slide。这意味着添加一个资产到 slide 5 会导致 slide 1-4 和 6-20 的 fingerprint 也变化，全部被错误标记为 stale。这违反了 "不引用资产的 slide 行为完全不变" 的向后兼容约束。

Per-slide profile 是唯一正确的方案：不引用资产的 slide → `assetRefs = {}` → profile 不含 `asset_refs` → fingerprint 与现有代码一致 → 不会被误标 stale。引用资产的 slide → profile 含 `asset_refs` → 资产变化 → fingerprint 变化 → 精确失效。

**为什么不会破坏 batch provenance 模型**: 共享参数（`style_reference_sha256`、`resolution`、`model`、`size`）仍在循环外计算一次，仅 `assetRefs` 在循环内按 slide 计算。`_manifest.json` 本身就是 per-slide 存储（每个 slide 独立 entry），不存在"batch"约束。`generateImages` 返回 `profiles` Map（`slideId → profile`）替换原来的单一 `profile`，`unified_pipeline.mjs` 的 post-generation 验证改为对每个 slide 调用 `inspectImageProvenance` 并传入该 slide 专属的 profile。

### D4: `VISUAL ASSETS` 字段放在 slide-specifications.md 而非独立文件

**选择**: 资产绑定是 `**VISUAL ASSETS**: id1, id2` 行，放在 slide block 内（KICKER/TITLE 和 CONCEPT 之间）。

**替代方案**: 独立的 `asset-bindings.yaml` 文件，slide_id → asset_ids 映射。

**理由**: 资产绑定是 per-slide 的内容决策，应和 slide 其他规格放在一起。避免"改 slide A 要同时改两个文件"的同步问题。和 `**RENDER MODE**` 的显式覆盖语法一致。符合 SSOT 原则。

### D5: 未知 asset ID 发 WARNING，不阻塞管线

**选择**: Stage 1 验证阶段，未知 asset ID → WARNING severity validation record。`parseSlides` 中跳过未知 ID。管线继续。

**理由**: `style_master` 仍是主锚点，缺失的 supplementary reference 降级跳过（graceful degradation）。和缺失字体、磁盘空间不足等 WARNING 的处理一致。

## Risks / Trade-offs

- **[R1] API 不接受多 reference image**: 某些 relay/vendor 可能只认 `body.image`（单张）而忽略 `body.images`（数组）。Mitigation: 保持 `body.image` = style_master 作为向后兼容字段，附加资产只在 `body.images` 数组中追加。
- **[R2] SVG MIME type 支持**: `fileToDataUrl` 当前只显式处理 PNG/JPEG/WEBP/GIF，SVG 需要新增 `image/svg+xml` MIME type 映射。实现时需扩展 `fileToDataUrl` 的扩展名检测。如果 API 拒绝 SVG data URL，后续 change 可实现 SVG→PNG 光栅化。
- **[R3] 大文件 base64**: 多个 asset 的 base64 data URL 可能使请求体显著增大。Mitigation: 资产文件通常较小（SVG 矢量、参考缩略图）；如果遇到问题，后续可实现 asset 预处理/压缩。
- **[R4] 旧 run bundle 无 assets/ 目录**: `checkBundle` 只验证 `assets/` 目录内的内容（如果存在）。旧的 run bundle 没有该目录不会触发错误。`assets/` 是 optional 的——没有资产时功能退化到现有行为。

## Open Questions

- **[Q1] GPT Image 2 对多 reference image 的实际行为**: 多张 reference image 的优先级/融合方式需要实测验证。当前假设所有 reference 平等传给 API，模型自行决定如何使用。
- **[Q2] SVG reference 的 API 兼容性**: 需要冒烟测试验证 GPT Image 2 relay 是否接受 `image/svg+xml` data URL。如果不接受，后续 change 需实现 `@napi-rs/canvas` 光栅化 SVG→PNG。
- **[Q3] 非引用 slide 的 provenance 兼容性**: 旧 `_manifest.json` 中不引用资产的 slide entry，其 `generation_profile` 不含 `asset_refs`。新代码为同页面生成的 per-slide profile 也不含 `asset_refs`——fingerprint 一致。引用资产的 slide 的旧 entry（无 `asset_refs`）与新 entry（有 `asset_refs`）fingerprint 不同——正确标记 stale。需在实现时验证这两种场景。
