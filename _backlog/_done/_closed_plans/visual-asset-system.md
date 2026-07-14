# Plan: Visual Asset System — 为视觉管线引入 Asset 概念

## Context

当前框架的视觉管线有一个核心洞察——**Style Anchoring**：用 `style_master.jpg` 作为全局视觉锚点传给 GPT Image 2，让每页 slide 都匹配同一套色彩/字体/布局。这个机制解决了"文字描述风格→每页漂移"的问题。

但这里有一个缺口：**style_master.jpg 只是风格锚点，不是内容资产**。当某页 slide 需要一个**特定的图、特定的 SVG diagram、特定的视觉元素**（这些东西模型自己不知道），目前没有任何机制能把它们作为附加 reference image 传入。而 GPT Image 2 是多模态模型，**它可以接收多张 reference image**。

用户的核心洞察：
> 我们可能有些图里头要特殊插入视觉的某些元素，这些东西有可能模型不知道，但是我可以在外面提供。

资产的形态：
1. **SVG 文件** — 精确的矢量图，本身就是很好的模型输入
2. **PNG/参考图** — 某个 diagram、icon set、illustration 的参考
3. **多模态描述** — 对资产内容的文字描述，帮助模型理解资产的语义
4. **视觉概念描述** — 某些抽象概念的视觉锚点（比纯文字更精确）

## 当前架构（问题所在）

```
style_master.jpg ────────────────┐
                                  │ (唯一的 reference image)
每页 IMAGE PROMPT (纯文本) ──────┼──→ GPT Image 2 ──→ slide PNG
                                  │
没有任何 per-slide 附加资产 ──────┘
```

相关现有物（都不是资产系统）：
- `04-create-content-assets.md` — 内容资产（文案、数据表达、案例锚点），全是文本，不是文件
- Micro Decoration System — 概念→视觉符号的**文字描述**映射，不是实际文件
- Concept-to-Visual mapping — 抽象概念→具象可视化的**文字**映射表
- `_manifest.json` — 已生成 image 的 provenance 指纹，只管"图是不是当前版本"，不管"图用了什么资产"

## 设计方案

### 1. 资产存在哪里（Run Bundle 目录结构）

```
2_backbone/visual-style/
  style_master.jpg          ← 现有：全局风格锚点
  visual-style.md           ← 现有：视觉系统文档
  deck_system.txt           ← 现有：文字约束
  assets/                   ← 新增：共享视觉资产目录
    asset-manifest.yaml     ← 资产目录（SSOT）
    svg/                    ← SVG 资产
      data_pipeline.svg
      ai_architecture.svg
    reference/              ← PNG 参考图
      competitor_dashboard.png
      factory_layout_ref.png
    icons/                  ← 图标集
      custom_icon_set.svg
```

版本级覆盖（如需要）：
```
3_versions/v{n}/overrides/visual-style/assets/
  asset-manifest.yaml       ← 版本级增量（只在有 override 时存在）
```

**为什么放在 `2_backbone/visual-style/` 下？**
- 资产是视觉系统的一部分，和 `style_master.jpg` 同级
- `2_backbone/` 的语义是"所有版本共享的稳定主干"，资产天然是共享的
- 符合现有梯度：共享进 backbone，版本增量进 overrides
- 对齐现有 habit：Stage 1 已经读 `--style-dir 2_backbone/visual-style/`

### 2. 资产数据模型（asset-manifest.yaml）

```yaml
# 2_backbone/visual-style/assets/asset-manifest.yaml
# 视觉资产目录 — 资产的 SSOT，定义每个资产是什么、怎么用

version: 1
assets:
  ai_arch_diagram:
    path: svg/ai_architecture.svg
    type: svg                    # svg | png | jpg
    label: "AI Architecture Diagram"
    description: >               # 多模态描述 — 告诉模型这个图里有什么
      A three-layer architecture diagram showing Data Layer (bottom),
      AI Engine Layer (middle), and Application Layer (top).
      Arrows flow upward from raw data to AI output.
      Color scheme: blues and teals matching the deck palette.
    usage_guidance: |
      This is the reference diagram for the AI system architecture.
      When this asset is referenced, the model should reproduce the
      SAME three-layer structure but may adapt the visual treatment
      to match the slide's specific content.
      DO NOT change the layer names or flow direction.
    tags: [architecture, diagram, reference]

  data_pipeline_flow:
    path: svg/data_pipeline.svg
    type: svg
    label: "Data Pipeline Flow"
    description: >
      A horizontal pipeline with 5 stages: Ingest → Clean → Transform →
      Enrich → Serve. Each stage is a rounded rectangle with an icon.
      Connecting arrows show data flow direction.
    usage_guidance: >
      Use as structural reference for any data pipeline visualization.
      The 5-stage layout and stage names must be preserved.
    tags: [data, pipeline, diagram, reference]

  factory_ref_photo:
    path: reference/factory_layout_ref.png
    type: png
    label: "Factory Floor Reference"
    description: >
      An aerial view of a modern precision manufacturing floor.
      Clean, well-lit, organized into cells. CNC machines in rows,
      digital dashboards at each station.
    usage_guidance: >
      Use as visual reference for manufacturing environment slides.
      The model should match the cleanliness level, lighting quality,
      and overall "precision" aesthetic, not the literal layout.
    tags: [manufacturing, reference, photo]
```

**设计要点：**
- `asset-manifest.yaml` 是 SSOT，每个资产一条记录
- `description` 是多模态描述 — 告诉模型资产长什么样（人和模型都能读）
- `usage_guidance` — 什么时候用、怎么用这个资产
- `type` 字段决定 Stage 2 怎么编码传给 API（SVG→光栅化 or 直接传）
- `tags` 提供搜索/过滤能力
- 格式用 YAML 而非 JSON — 多行描述字符串写起来友好，且和项目现有 `project-metadata.yaml`、`state.yaml` 一致

**Field definitions:**
| Field | Required | Description |
|-------|----------|-------------|
| `id` (key) | Yes | kebab-case unique identifier. Used in slide specs for binding. |
| `path` | Yes | Relative path from the manifest file to the asset file. |
| `type` | Yes | `svg`, `png`, or `jpg`. Drives mime-type selection for the API. |
| `label` | Yes | Human-readable name for logging and diagnostics. |
| `description` | Yes | **Multimodal description** — detailed description of what the asset looks like visually. This is NOT injected into the prompt (the actual image file is passed as a reference); instead it serves as documentation for agents crafting IMAGE PROMPTs. |
| `usage_guidance` | Yes | When and how this asset should be bound to slides. Helps the agent decide which slides get which assets and how to reference them in prompts. |
| `tags` | No | Free-form tags for search/filter in the catalog. |

### 3. 资产如何绑定到 Slide

**方式：在 `slide-specifications.md` 中新增 `**VISUAL ASSETS**` 字段**

```markdown
## Slide 08: s08

**VISUAL TYPE**: Framework
**KICKER**: AI ARCHITECTURE
**TITLE**: Three layers turn raw data into shop-floor decisions
**VISUAL ASSETS**: ai_arch_diagram, data_pipeline_flow    ← 新增

**CONCEPT**:
- MUST communicate: ...

**IMAGE PROMPT**:
```
...existing prompt...
```
```

**设计决策：**
- 放在 L2 CONCEPT 和 L3 IMAGE PROMPT 之间（L2.5 的位置）
- 语法简单：`**VISUAL ASSETS**: id1, id2`（逗号分隔的 asset id 列表）
- 字段名用 `VISUAL ASSETS` 而非 `ASSETS` — 明确区分视觉资产和内容资产（case studies、data 等）
- 可选字段 — 不引用资产的 slide 不写这一行，行为完全不变
- Asset id 需在 `asset-manifest.yaml` 中找到 → Stage 1 验证：未知 id 发 WARNING（不阻塞管线）
- 资产信息由 Stage 1 组装进 `slide_plan.json`（`assets: [...]`）和 `_prompts.json`（`asset_ids: [...]`）
- prompt 文本本身**不修改** — 资产作为 reference image 在 API 层面附加（和 `style_master.jpg` 一样的模式）

**为什么放在 slide-specifications.md 而不是独立文件？**
- 资产绑定是 per-slide 的内容决策，应该和 slide 其他规格放在一起
- 避免"改 slide A 要同时改两个文件"的同步问题
- 和 `**RENDER MODE**` 的显式覆盖语法一致
- 符合 SSOT 原则：一个 slide 的所有规格在一个地方

### 4. Stage 1 和 Stage 2 的改动

#### Stage 1 (`stage1_build_inputs.mjs`) 改动：

1. **解析 VISUAL ASSETS 字段**：从每页 slide block 中提取 `**VISUAL ASSETS**:` 行
2. **加载 asset manifest**：读 `2_backbone/visual-style/assets/asset-manifest.yaml`（通过 `asset_manifest.mjs`）
3. **验证引用**：引用的 asset id 不在 manifest 中 → WARNING（不阻塞，graceful degradation）
4. **写入 `slide_plan.json`**：每页多一个 `assets: ["ai_arch_diagram"]` 字段
5. **写入 `_prompts.json`**：每页多一个 `asset_ids: [...]` 字段，prompt 文本不修改（资产如 style_master 一样作为 API 层面的 reference image 传入）

#### Stage 2 (`stage2_generate_images.mjs`) 改动：

1. **接收 `assetResolver` 函数**：由 `unified_pipeline.mjs` 注入，封装 backbone vs override 的路径解析逻辑
2. **计算资产 SHA-256**：所有引用的资产文件 hash 汇总进 `generationProfile.asset_references`
3. **传给 `generateOneImage`**：通过新的 `additionalReferencePaths` 参数，和 `style_master.jpg` 一起传入
4. **更新 generation fingerprint**：`image_provenance.mjs` 的 `generationProfile()` 新增 `assetRefs` 参数 → 资产文件内容变化 → fingerprint 变化 → 要求 `--force-images`
5. **错误处理**：资产文件缺失 → log warning + skip（不阻塞管线，style_master 仍是主锚点）

### 5. Capability 注册

**新增 capability: `visual-asset-management`**

在 `config.yaml` 的 capability 注册表中新增：

```
### 视觉资产

| Capability | 做什么 | 关键脚本 |
|-----------|--------|---------|
| `visual-asset-management` | 管理视觉资产目录：asset-manifest.yaml 加载与校验、资产文件指纹、按 ID 解析路径 | `asset_manifest.mjs` |
```

**扩展现有 capability:**
- `image-generation` — 支持 per-slide 多 reference image（全局 style_master + per-slide assets），generation fingerprint 纳入资产 hash
- `content-parsing` — 解析 `**VISUAL ASSETS**` 字段，验证资产引用（WARNING 级）
- `run-bundle-layout` — 注册 `assets/` 子目录为合法产物
- `run-bundle-management` — init 时创建 `assets/` + stub `asset-manifest.yaml`

### 6. 受影响的 Spec 和文件

| 文件 | 改动类型 | 改什么 |
|------|---------|--------|
| `openspec/config.yaml` | 修改 | 新增 `visual-asset-management` capability |
| `openspec/specs/visual-asset-management/spec.md` | **新建** | 资产系统的完整规范 |
| `openspec/specs/image-generation/spec.md` | 修改 | Stage 2 支持 per-slide 多 reference image |
| `openspec/specs/content-parsing/spec.md` | 修改 | 解析 `**VISUAL ASSETS**` 字段，绑定验证（WARNING 级） |
| `openspec/specs/run-bundle-layout/spec.md` | 修改 | 注册 `assets/` 目录为合法产物 |
| `PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs` | 修改 | 新增 assets 目录常量 + `initBundle` 创建骨架 + `checkBundle` 校验 + `resolveAssetPath()` |
| `PPTMAKER_FRAMEWORK/scripts/asset_manifest.mjs` | **新建** | `loadAssetManifest()`, `validateAssetManifest()`, `resolveAssetPath()`, `sha256Asset()` |
| `PPTMAKER_FRAMEWORK/scripts/stage1_build_inputs.mjs` | 修改 | 解析 VISUAL ASSETS + 加载 manifest + 写入 slide_plan / _prompts |
| `PPTMAKER_FRAMEWORK/scripts/stage2_generate_images.mjs` | 修改 | 接受 `assetResolver` 函数 + 计算 asset hash → generationProfile |
| `PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs` | 修改 | `generateOneImage` 新增 `additionalReferencePaths` 参数 |
| `PPTMAKER_FRAMEWORK/scripts/unified_pipeline.mjs` | 修改 | 构造 assetResolver 闭包，传入 Stage 2 |
| `PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs` | 修改 | `generationProfile()` 新增 `assetRefs` 参数 |
| `PPTMAKER_FRAMEWORK/workflow/02-content/template-slide-specifications.md` | 修改 | 模板新增 `**VISUAL ASSETS**` 字段 |
| `PPTMAKER_FRAMEWORK/reference/glossary.md` | 修改 | 新增 Asset / asset-manifest.yaml / VISUAL ASSETS 术语定义 |

### 7. 实现任务（按依赖顺序，5 个 Phase）

**Phase 1: Foundation — 目录 + manifest 解析器 (2 files)**
- Task 1.1: `bundle_layout.mjs` — 新增 `BACKBONE_ASSETS_SUBDIR`、`ASSET_MANIFEST_FILE` 常量；更新 `_ALLOWED_IN_VISUAL_STYLE`、`renderTree()`、`checkBundle()`、`initBundle()`
- Task 1.2: `asset_manifest.mjs` — 新建：`loadAssetManifest()`, `validateAssetManifest()`, `resolveAssetPath()`, `sha256Asset()`

**Phase 2: Stage 1 集成 (2 files)**
- Task 2.1: `stage1_build_inputs.mjs` — 解析 `**VISUAL ASSETS**`；populate `assets` 到 `slide_plan.json`、`asset_ids` 到 `_prompts.json`；未知 id → WARNING
- Task 2.2: `image_provenance.mjs` — `generationProfile()` 新增 `assetRefs` 参数（默认 `{}`，向后兼容）

**Phase 3: Stage 2 集成 (3 files)**
- Task 3.1: `image_api_client.mjs` — `generateOneImage` 新增 `additionalReferencePaths` 参数
- Task 3.2: `stage2_generate_images.mjs` — 接受 `assetResolver` 函数；计算 asset SHA-256 → generationProfile
- Task 3.3: `unified_pipeline.mjs` — 构造 assetResolver 闭包，传入 Stage 2

**Phase 4: Spec + 模板 (4 files)**
- Task 4.1: `openspec/config.yaml` — 注册 `visual-asset-management` capability
- Task 4.2: `openspec/specs/visual-asset-management/spec.md` — 新建
- Task 4.3: `openspec/specs/content-parsing/spec.md` + `image-generation/spec.md` + `run-bundle-layout/spec.md` — 修改
- Task 4.4: `template-slide-specifications.md` + `glossary.md` — 文档更新

**Phase 5: 测试**
- Task 5.1: `tests/test_asset_manifest.mjs` — manifest 加载/校验/解析 单元测试
- Task 5.2: `tests/test_stage1_build_inputs.mjs` — `**VISUAL ASSETS**` 解析测试
- Task 5.3: `tests/test_image_generation.mjs` — multi-reference + asset-fingerprint 场景
- Task 5.4: `npm test` 全量回归 — 无资产时行为不变

### 8. 关键设计决策和讨论点

**Q1: 资产是全局的还是 per-slide 的？**
A: 两种都要支持。资产存在 `2_backbone/` 下是全局共享的，但通过 `**VISUAL ASSETS**` 绑定是 per-slide 的。版本级 override 在 `overrides/` 下。

**Q2: SVG 怎么传给 GPT Image 2？**
A: 两种方式：a) 光栅化为 PNG data URL 传给 API；b) 如果 API 支持 SVG 直接上传，直接传。需要测试 GPT Image 2 API 对 SVG 的支持情况。如果不支持，需要加一个 SVG→PNG 的光栅化步骤（可以在 asset loader 中做）。

**Q3: 资产描述 vs IMAGE PROMPT 的关系？**
A: 资产描述（multimodal description）不替代 IMAGE PROMPT。它和 anchoring clause 的角色类似——告诉模型这个资产是什么、怎么用。IMAGE PROMPT 仍然定义 slide 的完整视觉意图。资产作为 reference image 在 API 层面附加。

**Q4: `--force-images` 的语义？**
A: 资产文件内容变化 → generation fingerprint 变化 → 现有 skip-if-exists 机制能把旧图标记为 stale → 要求 `--force-images` 重生。不需要新增 CLI flag。

**Q5: 未知 asset id 的处理？**
A: Stage 1 发 WARNING，不阻塞管线。style_master 仍是主锚点，缺失的 supplementary reference 降级跳过（graceful degradation）。

**Q6: 为什么用 aggregate asset SHA-256 而非 per-slide profile？**
A: 当前 `generationProfile` 被所有 slides 共享（因为 `style_reference_sha256` 是单值）。计算 per-slide profile 会破坏现有 batch provenance 模型。作为起步，所有资产 hash 汇总进共享 profile——任一资产变化，所有引用资产的 slides 都标记为 stale。未来可扩展为 per-slide profile 以获得更精确的失效范围。

## Verification

1. **创建 test asset**：在 test deck 的 `2_backbone/visual-style/assets/` 下放置一个测试 SVG 和对应的 manifest entry
2. **写 test slide**：在 `slide-specifications.md` 中加 `**VISUAL ASSETS**: test_svg`
3. **跑 Stage 1**：验证 asset 引用被正确解析，`slide_plan.json` 中有 `assets` 字段，`_prompts.json` 中有 `asset_ids`
4. **跑 Stage 2**：验证资产文件作为附加 reference image 被传入 `generateOneImage` 的 `additionalReferencePaths`
5. **验证 provenance**：改 asset 文件内容 → fingerprint 变化 → 旧图被标记为 stale → 要求 `--force-images`
6. **验证无资产时兼容**：不写 `**VISUAL ASSETS**` 的 slide 行为完全不变
7. **验证缺失资产降级**：引用不存在的 asset id → WARNING + 继续生成
8. **跑现有测试**：`npm test` 全部通过
