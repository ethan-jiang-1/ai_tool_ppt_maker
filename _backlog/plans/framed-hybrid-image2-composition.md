# Plan: Framed Hybrid Image2 页面所有权纠偏

> 类型: 设计 / 分析 | 更新: 2026-08-07 | 状态: 待 Review
>
> 辅助材料: [`framed-hybrid-image2-composition/borrowed-presentation-principles.md`](framed-hybrid-image2-composition/borrowed-presentation-principles.md)

## 背景 / 现状

本计划处理的是 Harness 级的页面生产模型错误，不是 `deck_dark_factory/3_versions/v3` 的单页视觉 bug。

目前 `page-authority-image2-v2` 把一次版本选择收敛为 `framed` 或 `pure`：

- `framed` 被实现为“Image2 生成全画幅、完全无可读文字的 underlay；本地 `standard-v1` Text Frame 放入 kicker、title、subtitle、callout，且 body 也不得进入图层”。
- `pure` 被实现为“Image2 拥有页面所有最终像素和所有可读文字”。

这不是用户期望的语义。`frame` 的作用应是把**位置、字体和尺寸必须稳定**的 header 锚定在本地，而不是把整页其它文字驱逐出 Image2。正文、指标、图表/流程标签、引用、图片内文字和与画面构图紧密相关的 callout，必须由 Image2 连同画面一起生成；否则页面不再是完整的 PPT 视觉组成，且图文协同效果明显变差。

`pure` 的语义保持不变：当连 kicker、title、subtitle 也应作为画面的一部分时，Image2 仍拥有整页。

## 借鉴的 Presentation 设计纪律

本计划只借鉴 `presentations` skill 对“什么才是一页成立的 PPT”的判断，不依赖其插件、模板或生成工具。完整映射见[辅助材料](framed-hybrid-image2-composition/borrowed-presentation-principles.md)。需要进入本次设计的核心纪律是：

- 先定义每页的 communication job；每页只有一个 narrative job 和一个 primary claim，title 优先表达 takeaway。
- 一页是 title、证据、文字和视觉共同完成的单一构图，不是“背景图 + 通用文字卡片”的拼装。
- Image2-owned 内容应短、结构化、面向观众；内容过载时先删减或改变构图，不能靠持续缩字解决。
- protected zone 是让 Image2 为固定 header 主动留出构图空间，不是把整张 raw image 变成 no-text 区域。
- raw image 与 local frame 分别合法仍不足以证明页面成立；最终验收对象必须是 full-size final composite。
- 视觉语言、frame preset、slide content 要在各自正确的所有权层修改，避免以单页 hack 覆盖全局设计问题。

这些纪律会约束 source schema、provider request 和视觉验收，但不会把 Codex Grid、`@oai/artifact-tool`、其固定字号或其它 plugin-specific rule 引入 Harness。

## 已验证的反例

以实际 v3 source 的一张 Framed 页面为基准，只在内存中加入一个 `**BODY**` 字段并使用真实 visual registry 解析，连续两次均得到：

```json
{
  "reproduced": true,
  "code": "framed_semantic_body_forbidden",
  "field": "BODY",
  "message": "TARGET Framed slides must keep semantic body text out of the underlay"
}
```

错误被多个层同时固化，故不能只修 prompt 或 Text Frame：

| 层 | 当前错误规则 | 需要改变的方向 |
| --- | --- | --- |
| 内容解析 | `page_authority_source.mjs` 拒绝 Framed 的 `BODY`，并强制 `no-readable-text`、`no-labels` | 接受显式的 Image2-owned body 语义；只限制 fixed header 的重复和锚点冲突 |
| Framed raw contract | `03-framed-image/index.mjs` 未携带 body，且固定 `framed.text_free: true` | 分离 `fixed_frame` 与 `image_owned_content`，让后者可被 provider 渲染 |
| Provider request | `ppt_flow.mjs` 只对 Pure 发出可渲染文字的明确指令 | Framed 也要传递 Image2-owned 文本及排版约束，并禁止重复固定 header |
| 本地 frame | `text_frame.mjs` 的 `standard-v1` 上部高不透明底板近似通用大卡片 | 改为保护锚点的最小化样式；是否需要面板由 preset 决定，不成为 Framed 的默认视觉语义 |
| 规格与工作流 | `content-parsing`、`image-generation`、`visual-config` 和 bootstrap/charter 把 Framed 描述为全页 text-free | 将定义改为 hybrid ownership，并明确刷新/迁移不变式 |

`openspec/config.yaml` 中残留的 `body+header-lock` 词汇与目标模型接近，但与现行 v2 实现不一致。它只能作为历史信号；本次不能直接把它当作既有可用协议或隐式迁移依据。

## 决策 / 方案

### 目标生产模型

```text
Framed / hybrid
  Local fixed-frame layer
    kicker + title + subtitle（及经明确列入固定层的元素）
    固定字体、字号、坐标、换行及可测试几何
  Image2 page layer
    背景、主体、正文、标签、数值、图表/流程文字、引用和画面内 callout
    与视觉构图共同生成
  Composition rule
    Image2 不生成 fixed-frame 文字；在其 exclusion zone 保持构图安静

Pure
  Image2 owns every final pixel, including the header typography
```

这里的 exclusion zone 是给固定 header 留出的构图空间，不是“画面任何地方均不可出现可读文字”的禁令。它保护可预测的局部几何，也不把 frame 变成不透明的通用 UI 卡片。

### 建议的领域边界

将现有单一的 “Framed = text-free” 布尔契约替换为有明确职责的深模块接口：

| 概念 | Owner | 责任 |
| --- | --- | --- |
| `fixed_frame` | `03-framed-image` + local renderer | 列出本地锁定字段、frame preset、精确锚点和 exclusion geometry；最终合成本地文字 |
| `image_owned_content` | source parser + `03-framed-image` raw contract | 列出必须和画面共同渲染的语义内容及紧凑结构；传递给 Image2 |
| `composition_constraints` | visual config / provider adapter | 禁止复写 fixed header、约束 protected zone、保留页面视觉语言；不禁止全页其它位置的文字 |
| final composition | `03-framed-image` → `05-delivery` | 将 raw 页面和本地固定 frame 合成为最终像素，并沿用现有 receipt/evidence/delivery 责任 |

字段的最终 schema 不在本计划中提前拍板。实现 change 要先审计 `slide_document.mjs` 已识别、但 `page_authority_source.mjs` 尚未消费的 `**SLIDE BODY**` YAML seam：它可能比继续扩展单行 `**BODY**` 更适合表达 metrics、labels、diagram text 和受控的紧凑正文。无论选择哪种输入，canonical source 必须区分固定 header 与 image-owned 内容，不能靠 prompt 推断。

### 保留的不变式与刷新规则

以下能力正确且必须保留：

- 一个版本只选择一个 `framed` 或 `pure` 工作流；不得按 slide 混合 authority。
- `slide_id` 仍是跨版本身份，`position` 仍只属于快照。
- provider work 仍经过 source receipt、typed raw plan、提交授权、raw acceptance、final manifest 和 delivery evidence；本次不放宽远端调用授权。
- `05-delivery` 仍是 PPTX、notes 与最终交付的唯一 owner；`_generated/` 继续只能重建，不能手改。
- Framed 的**固定 header 内容或 frame 样式**变更，在 exact accepted raw evidence 和 current preset 仍成立时，继续允许本地 Header Text & Style Refresh。
- 任何 `image_owned_content`、visual brief、protected-zone geometry 或 Image2 composition 变更，必须走 Framed Generated Image Rebuild，并经现有 raw review/confirm 边界。
- Pure 的任意可见像素变更仍需 raw rebuild；notes-only 仍只经 `05-delivery`；增删重排或 workflow switch 仍是 preview-first Structural Versioning Path。

## 范围与非目标

本次目标是纠正 `page-authority-image2` 中 Framed 的文本所有权，而不是：

- 为每页增加可随意选择 `framed`、`pure`、`hybrid` 的第三种 slide-level workflow；版本级选择和结构路径应保留。
- 以本地 shape/text box 重做 Image2-owned body、图表或图内标签；这些内容的价值正是与 Image2 的画面协同。
- 承诺 Image2 对长段落、密集表格或复杂图表的逐字级排版精度。source 应引导短、结构化、可读的内容，必要时改变页面叙事或选择 Pure/其它合适结构。
- 静默修改已有 deck、state、receipt、raw evidence 或 final assets。
- 仅通过扩大或加深 header 背板掩盖图文冲突。优先改善 provider 构图约束和 frame preset。

## 兼容与迁移策略

当前 v2 Framed 的 raw evidence 是按“全页 text-free”语义生成和验收的，不能被新代码静默解释为 hybrid 页面。

1. 现有 `page-authority-image2-v2` source/state bytes 保持原样，仍以其已记录的语义和 owner-issued hard-stop/refresh 路径处理。
2. 实现 change 必须定义新协议/能力版本或同等强度的明确 compatibility gate；在没有人类确认和新 source receipt 前，不得复用旧 Framed raw evidence 作为 image-owned 文本页面。
3. 选择 hybrid 语义的目标版本必须使图像层进入 `needs_raw_generation`，获得范围明确的 provider authorization 后重建并完成 raw visual review。
4. 不进行批量 deck migration。单个 deck 是否采用新模型，应由用户选择 Structural Versioning Path 或 owner-issued migration/rebuild action。

此策略的代价是不会“自动修好”已有 Framed 页面，但能防止旧证据链在语义变更后被错误复用。

## 拟议 OpenSpec 影响面

实施前应创建一个独立 OpenSpec change。预期要在 change 内同步 delta spec、实现、测试和方法论文档，至少覆盖：

| 影响面 | 预计工作 |
| --- | --- |
| `content-parsing` | 接受并校验 Framed 的 image-owned content；移除全页 no-text/no-labels 要求，替换为 fixed-header duplicate/protected-zone 约束 |
| `visual-config` | 表达 fixed frame、protected zone 和 provider-facing composition constraints，保持 deck-level visual language 的权威性 |
| `image-generation` | 规定 Framed hybrid raw contract、prompt/request 内容、raw review 项和 final composition 行为 |
| `image-production` | 若其 raw plan、evidence 或 acceptance schema 依赖 text-free 含义，升级其 lineage/compatibility 规则 |
| `pipeline-orchestration` | 将 change classifier 的最小刷新路径绑定到实际 pixel owner，新增 migration/rebuild gate |
| `harness-charter` 与 workflow 文档 | 更新 BOOTSTRAP、AGENT_CONTRACT、glossary/流程中的 Framed 描述，防止 Agent 再次采用错误心智模型 |
| 测试与 E2E | 覆盖 source → contract → provider request → final composition → refresh classifier 全链路 |

实现前需要先用 `openspec status` 确认没有重叠的 active change；本计划编写时该列表为空。

## 验收标准

### 合约与请求

- Framed source 能合法表达 image-owned body/labels/metrics，且仍要求所选 fixed header 字段和有效 frame preset。
- 生成出的 raw contract 明确分开 `fixed_frame`、`image_owned_content` 和 `composition_constraints`；不再使用含混的 `text_free` 作为 Framed 总语义。
- Framed provider request 包含 image-owned 内容和“不要重复 fixed header”的指令，并包含可审计的 protected-zone 定义。
- Pure contract 继续允许 Image2 渲染包括 header 在内的全页文本，不受 Framed exclusion 规则约束。

### 像素与刷新

- 合成后的 Framed 页面中 kicker、title、subtitle 的字体、字号、坐标和换行完全由本地 frame 控制。
- body、图内标签和指标可由 Image2 与画面共同出现；没有重复的固定 header、无意文字覆盖、截断或与 frame 的冲突。
- Header-only change 不提交 provider 请求，能基于 exact current raw evidence 得到本地刷新。
- image-owned content 或 protected-zone/composition change 被 classifier 判为 raw rebuild，不能错误复用旧 raw evidence。
- Pure 任意可见内容变更、notes-only refresh 和 Structural Versioning Path 的既有行为回归通过。

### 验证方法

- 给 source parser、raw-contract validator、request builder 和 change classifier 增加定向 unit/integration tests。
- 用 mock provider 的 E2E fixture 验证 Framed hybrid 的 receipt、authorization、raw acceptance、final projection 与交付链路。
- 提供一组可检查的视觉 fixture，逐页检查 final composite，而不只看 raw asset：文字可读性、fixed header 精确性、无重复 header、protected zone 无冲突、整体层级和单一构图是否成立。
- visual fixture 同时检查每页是否只有一个 primary claim、title 是否表达 takeaway、Image2-owned 文字是否面向观众，以及页面是否退化为 UI card grid。
- 运行现有回归测试，并新增 pure/legacy Framed compatibility cases，确保没有隐式重解释已存在的 bytes。

## 风险 / 取舍

- [Image2 文字保真度不足] → 将 image-owned 内容限定为短、结构化、可读的 page language；raw visual review 仍是接受门槛，不因 source 合法就跳过。
- [固定 header 被 Image2 重复生成] → request 必须传递 header 排除语义和几何；raw review 加入 duplicate-header 检查，失败后走 owner repair/rebuild。
- [Image2 文字碰撞 frame] → 以 provider-visible protected zone 约束构图，frame preset 给出精确几何；最终 composite 做视觉和几何 QA。
- [source schema 膨胀或把 `SLIDE BODY` 变成无结构大文本] → 先定义最小、可验证的 structured content vocabulary，拒绝无界自由格式；在 OpenSpec design 阶段决定 canonical input。
- [header-only 刷新误触发 raw rebuild，或反之] → classifier 比较明确的 pixel-owning semantic hash，而不是只看字段名；把两类变更各自做回归案例。
- [协议升级破坏历史 deck] → 以显式 protocol gate、versioned receipt 和 per-deck 人类确认隔离，不批量改写 source/state/evidence。
- [frame 又演化为通用大卡片] → 将“最小化/透明优先”的视觉目标写入 preset 约束和 visual fixture，只有明确风格需要时才使用面板。

## 待确认决策

1. `framed` 是否保留为名称，而在文档内称其为 “Framed / hybrid”；还是为新的协议能力引入显式 `hybrid` 名称？建议保留版本级工作流名称 `framed`，在其契约内明确 hybrid ownership，避免增加第三个容易被误用的选择。
2. 现有 `page-authority-image2-v2` 的 Framed 语义是否永久保持，仅以 v3/new capability 启用新模型？建议保留 v2 bytes 的历史解释，并通过新协议或强 compatibility gate 启用，不能原地改变 v2 已验收 artifact 的含义。
3. `**SLIDE BODY**` YAML 是否立即成为 image-owned content 的 canonical source，还是先支持受限的 `**BODY**` 再演进？建议在 OpenSpec design 阶段以真实 body/metric/diagram fixtures 评估；不要让单行 `BODY` 代替结构化页面语义。
4. `standard-v1` 是否应默认透明/极轻的 header treatment，以及由哪一层选择更强的面板？建议将视觉选择置于 deck-level visual config 与 frame preset，让 frame 保护排版而非预设一张通用卡片。

## 落地关联

本计划获 Review 后，下一步是创建一个专门的 OpenSpec change，先完成术语、协议版本/compatibility gate、canonical source schema 和刷新 hash 的设计，再分阶段实现 parser、Framed owner、provider request、classifier、文档与测试。

在该 change 被批准前，本计划不授权修改 `ppt_maker_harness/`、`openspec/specs/` 或任何 `deck_*` run bundle；`deck_dark_factory/3_versions/v3` 只作为已验证的反例和后续 visual acceptance fixture 的候选来源。
