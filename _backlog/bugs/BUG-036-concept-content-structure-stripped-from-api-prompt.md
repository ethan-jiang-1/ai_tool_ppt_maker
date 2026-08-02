# BUG-036: CONCEPT 的 Content structure/MUST communicate 在 Page Authority 解析阶段被丢弃

> 严重级别: P1 | 发现: 2026-07-30 | 状态: 待真实 run 验收（source 迁移完成：2026-08-03）

## 当前复核

当前 parser 仍刻意不把自由 `CONCEPT` prose 送入 provider；已归档的
`fix-provider-clauses-and-visual-scene` 以受 guard 的显式 `VISUAL SCENE` 承载每页
要画的关系和布局。2026-08-03 对指定的
`deck_ai_sdlc_keynote/3_versions/v7` 执行官方 validation，结构化 receipt 为 25/25 页
记录了非空 `VISUAL SCENE` 与 `BODY`，逐页复核也确认 scene 是页面内容结构而非通用风格
标签。

这证明 source-to-contract 的内容迁移已经完成；尚未提交 provider request 或生成最终图像，
故仍需第 9 步的授权真实 run 来确认场景确实被模型表达。BUG-015 仍是更广泛关系型视觉
词汇的独立设计缺口。

## 历史记录

### 症状

`slide-specifications.md` 中每页 CONCEPT 节包含最核心的视觉内容结构指令（场景描述、隐喻、布局），但这些信息**从未到达 Image2 API**。recipe/composition/motif 三个抽象 ID 及其 provider clauses 无法表达 slide-specific 的场景要求。

对比示例：

| Slide | CONCEPT 要求 | API 实际收到的视觉描述 |
|-------|-------------|----------------------|
| 01 GoRev | 极简封面。大量留白。一条极淡的手绘横线 + 一个小琥珀点作锚 | `centered focal form with balanced negative space` |
| 06 OldMap | 墙上挂着三张褪色的旧地图（瀑布、V模型、敏捷）。人站在墙前，旁边是 AI 伙伴，一起面向前方大片留白画布，上面只有试探性线条和一个问号 | `clear left to right movement` + `layered pathways with gentle directional energy` |
| 11 RevGap | 大漏斗——顶部密集代码涌入，底部单滴流出（10:1 比例），出口的小人被淹没 | `centered focal form with balanced negative space` + `layered pathways` |

API 能生成正确的暖编辑风格（来自 style_master.jpg），但**完全没有**每页独特的场景结构信息。

### 根因

`page_authority_source.mjs` 的 `PAGE_AUTHORITY_FIELDS`（第 17-25 行）不包含 CONCEPT：

```js
const PAGE_AUTHORITY_FIELDS = Object.freeze([
    ...DISPLAY_FIELDS,           // KICKER, TITLE, SUBTITLE, CALLOUT
    "BODY",
    "FRAME PRESET",
    "VISUAL BRIEF",              // → recipe/composition/motif
    "VISUAL IDENTITY",           // → reference PNG
    "IDENTITY SUBJECT COUNT",
    "SUBJECT RESTRICTIONS",
]);
```

CONCEPT 被当作"人类文档"在解析时忽略。它包含的 `MUST communicate` 和 `Content structure` 是每页最精确的视觉指令，但没有任何机制将它们编码到 Image2 prompt 中。

设计层面的根因：recipe/composition/motif 是一个封闭的视觉词汇表，适用于建立**统一风格基调**，但不适用于表达**slide-specific 场景内容**。25 页共用 2 个 recipe、3 个 composition、4 个 motif——所有独特的内容结构信息都丢失了。

### 历史复现

取任意 slide-specifications.md 中的 slide，追踪其完整数据流：

```bash
node -e "
// 解析并打印 slide 01 的 visual_language.provider_clauses
// 对比 slide-specifications.md 中 Slide 01 的 CONCEPT 节
// 两者完全不重叠
"
```

### 当时修复方向

需要在管线中新增一个字段，将 CONCEPT 中的视觉结构指令传递给 Image2 API。几种可能路径：

1. **扩展 VISUAL BRIEF schema**：新增 `scene_description` 或 `content_structure` 字段，将 CONCEPT 的 Content structure 文本经过 text guard 规范化后纳入 provider clauses
2. **新增 PAGE AUTHORITY 字段**：如 `**VISUAL SCENE**`，显式区分"风格系统选择"（VISUAL BRIEF）和"本页场景描述"（VISUAL SCENE）
3. **让 Image2 API prompt 包含 CONCEPT 文本**：在 `async-generate.mjs` 中直接读取原始 slide source，提取 CONCEPT 文本作为 prompt 的附加字段

路径 (1) 最优雅——扩展 registry 而不破坏现有契约。路径 (2) 最显式——source 层面清晰分离关注点。路径 (3) 最快但不治本。

需配合 BUG-035 修复后一起验证——provider_clauses 和 scene/ concept 描述需要**同时**到达 API 才有效果。

### 非目标

- 不改动 text guard 的 forbidden tokens 约束（scene 描述仍需遵守 no-readable-text/no-labels）
- 不把 CONCEPT 的 Speaker Note/Narrative flow 发给 API（那是给人看的）
- 不要求 recipe/composition/motif 体系废弃——它仍然负责统一的风格基调

### 关联

- BUG-035（provider_clauses 丢失）— 两个 bug 共同导致 API 缺乏视觉文本指导
- 待定 OpenSpec change
