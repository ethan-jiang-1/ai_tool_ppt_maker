# Plan: Framed Hybrid Image2 页面所有权纠偏

> 类型: 设计 / 分析 | 关闭: 2026-08-08 | 状态: 已由 archived `correct-framed-page-image-model` 吸收
>
> Context pack: [`README.md`](framed-hybrid-image2-composition/README.md) | 快速接棒: [`HANDOFF.md`](framed-hybrid-image2-composition/HANDOFF.md)
>
> 后续总路线图见 [`page-image-workflow-master-plan.md`](page-image-workflow-master-plan.md)。本文件是该路线图的历史设计依据；实施记录见 archived [correct-framed-page-image-model](../../../openspec/changes/archive/2026-08-08-correct-framed-page-image-model/)。

> Owner decision: 当前 `page-authority-image2-v2` 的 Framed 模型是错误的，
> 应从 active Harness 完全丢弃。它不是兼容、迁移或历史解释目标；若旧 bytes
> 仍留在磁盘，新 Harness 一律不识别也不操作它们。

## 背景 / 现状

本计划处理的是 Harness 级的页面生产模型错误，不是 `deck_dark_factory/3_versions/v3` 的单页视觉 bug。

目前 `page-authority-image2-v2` 把一次版本选择收敛为 `framed` 或 `pure`：

- `framed` 被实现为“Image2 生成全画幅、完全无可读文字的 underlay；本地 `standard-v1` Text Frame 放入 kicker、title、subtitle、callout，且 body 也不得进入图层”。
- `pure` 被实现为“Image2 拥有页面所有最终像素和所有可读文字”。

这不是用户期望的语义。`frame` 的作用应是把**位置、字体和尺寸必须稳定**的 header 锚定在本地，而不是把整页其它文字驱逐出 Image2。正文、指标、图表/流程标签、引用、图片内文字和与画面构图紧密相关的 callout，必须由 Image2 连同画面一起生成；否则页面不再是完整的 PPT 视觉组成，且图文协同效果明显变差。

这里必须区分两种权威：人和 canonical source 始终拥有主张、数据及 exact copy 的**内容权威**；Image2 只拥有正文、标签、指标等内容的**像素呈现与构图权威**，不能因此获得发明事实或静默改写文字的权限。

## 顶层定义

Pure 和 Framed 本质上使用同一个完整页面生成模型。Framed 不是弱化版 Image2、无字底图模式或“图片 + 本地正文”；它只是给 Pure-like 的完整 Image2 页面增加一层确定性的 header rendering policy：

```text
Pure    = Image2 full-page composition
Framed  = Image2 full-page composition
          + transparent deterministic header overlay
```

两种 workflow 中，Image2 都负责 full-canvas 视觉、body、labels、metrics、diagram text、quote 和 callout。差异只在 `kicker/title/subtitle`：Pure 由 Image2 一起渲染；Framed 将其作为 context-not-to-render 交给 Image2 理解，再由本地透明 overlay 以固定字体、字号、位置、换行和风格叠加到完整页面上。

Framed overlay 默认只绘制文字 glyph 和必要的最小 contrast treatment，不绘制大面积不透明 header panel。底层 Image2 页面必须连续覆盖完整画布；protected zone 只是让关键正文、标签和主体避让 header，不是裁掉这一区域、制造空白横条或禁止其它区域出现文字。完整规范见 [`canonical-page-model.md`](framed-hybrid-image2-composition/canonical-page-model.md)。

## 借鉴的 Presentation 设计纪律

本计划只借鉴 `presentations` skill 对“什么才是一页成立的 PPT”的判断，不依赖其插件、模板或生成工具。完整映射见[辅助材料](framed-hybrid-image2-composition/borrowed-presentation-principles.md)。需要进入本次设计的核心纪律是：

- 先定义每页的 communication job；每页只有一个 narrative job 和一个 primary claim，title 优先表达 takeaway。
- 一页是 title、证据、文字和视觉共同完成的单一构图，不是“背景图 + 通用文字卡片”的拼装。
- provider-rendered 内容应短、结构化、面向观众；内容过载时先删减或改变构图，不能靠持续缩字解决。
- protected zone 是让 Image2 为固定 header 主动留出构图空间，不是把整张 raw image 变成 no-text 区域。
- Framed 的 raw image 与 local frame 分别合法仍不足以证明页面成立；它必须审查 full-size final composite。Pure 则以完整 provider page 审查页面成立性。
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
| 内容解析 | `page_authority_source.mjs` 拒绝 Framed 的 `BODY`，并强制 `no-readable-text`、`no-labels` | 接受显式的 provider-rendered body 语义；只限制 fixed header 的重复和锚点冲突 |
| Framed raw contract | `03-framed-image/index.mjs` 未携带 body，且固定 `framed.text_free: true` | 分离 `local_rendered_header`、`provider_rendered_content` 与非渲染 context |
| Provider request | `ppt_flow.mjs` 在 transport 层按 workflow 二次编译 prompt；inspection/attempt 只绑定未编译 request | 03/04 adapter 编译最终 provider input，并让 exact prompt digest 进入 plan、inspection、authorization、attempt 与 reconciliation |
| 本地 frame | `text_frame.mjs` 的 `standard-v1` 上部高不透明底板近似通用大卡片 | 改为保护锚点的最小化样式；是否需要面板由 preset 决定，不成为 Framed 的默认视觉语义 |
| 规格与工作流 | `content-parsing`、`image-generation`、`visual-config` 和 bootstrap/charter 把 Framed 描述为全页 text-free | 将定义改为共同 Page Image Core + header policy，并明确刷新规则与错误 v2 的拒绝边界 |

`openspec/config.yaml` 中残留的 `body+header-lock` 词汇与目标模型接近，但与现行 v2 实现不一致。它只能作为历史信号；本次不能直接把它当作既有可用协议或隐式迁移依据。

## 决策 / 方案

### 目标生产模型

```text
Common Page Image Core
  Source authority
    all claims, data, and exact required copy
  Image2 full-page layer
    背景、主体、正文、标签、数值、图表/流程文字、引用和画面内 callout
    与视觉构图共同生成

Header Rendering Policy
  pure: provider-rendered kicker + title + subtitle
  framed:
    provider context-not-to-render kicker + title + subtitle
    transparent local overlay with deterministic typography and geometry
    protected zone remains visually continuous but compositionally quiet
```

Page Image Workflow 是这两种模式的主要价值：它将 source-owned content、
visual direction 和 composition constraints 编译为 Image2 最能执行的输入。
Pure 只有一份 full-page provider input；Framed 协调一份 local header-renderer
input 与一份 provider page input。Workflow 可以改善请求和构图，但不能改变
source-owned facts 或 required copy。

这里的 exclusion zone 是给固定 header 留出的构图空间，不是“画面任何地方均不可出现可读文字”的禁令。它同时是 canonical geometry、provider constraint 和 acceptance evidence；prompt 只能表达约束，不能证明模型已经遵守。它保护可预测的局部几何，也不把 frame 变成不透明的通用 UI 卡片。当前 `standard-v1` 的高不透明 header panel 必须在新 capability 中被透明优先的 preset 替代，不能继承为 canonical Framed 外观。

### 建议的领域边界

将现有单一的 “Framed = text-free” 布尔契约替换为有明确职责的深模块接口：

| 概念 | Owner | 责任 |
| --- | --- | --- |
| `content_authority` | human + canonical source | 决定全部主张、数据、exact visible literals 与是否允许改写；provider 不获得语义发明权 |
| `page_image_core` | common Page Authority domain + selected adapter | 为 Pure/Framed 提供同一套 full-page body/visual semantics、generation profile、provider-rendered content 和 baseline review contract |
| `header_rendering_policy` | version-level workflow selection | 只选择 `provider`（Pure）或 `local_transparent_overlay`（Framed）；Framed 将 exact header literals 作为 context-not-to-render 给 provider；不是两套不同的 body/image 语义 |
| `local_rendered_header` | `03-framed-image` + local renderer | 以协议闭集锁定 kicker、title、subtitle、frame preset、精确锚点和 exclusion geometry；不允许 per-slide `fixed_fields` 逃生口 |
| `provider_rendered_content` | source parser + common page-image contract | 在 Pure/Framed 中同样传递必须和画面共同渲染的 body、labels、metrics、diagram text、quote 与 callout；默认 exact literal |
| `context_not_to_render` | source + selected adapter | 让 provider 理解 primary claim 和 fixed-header 语义，同时明确禁止渲染或复写这些 header literals |
| `composition_constraints` | visual config / provider adapter | 禁止复写 fixed header、约束 protected zone、保留页面视觉语言；不禁止全页其它位置的文字 |
| `compiled_provider_input` | selected 03/04 adapter | 编译最终发送字节；Pure 为一份 full-page input，Framed 为 provider page input 并包含 exact header context-not-to-render；其 digest 绑定 plan、inspection、authorization、attempt 和 reconciliation，shared transport 不理解 workflow 语义 |
| final composition | `03-framed-image` → `05-delivery` | 将 raw 页面和本地固定 frame 合成为最终像素，并沿用现有 receipt/evidence/delivery 责任 |

Owner 已决定：所有 provider-rendered 的重要文字、数字、标签和 callout 都必须作为 canonical source 中一等的、闭合结构化内容声明；不得使用自由 `BODY` prose 或让 provider 自行补写事实。默认全部 exact；只有 source 明示的、非事实性 supporting copy 才可被 Workflow 交给 Image2 为图文一体构图进行压缩或改写。该授权绝不覆盖 claims、facts、numbers、names、labels、headers 或任何未标记文案。Workflow 的价值在于它理解 Image2，能将 source-owned content、visual direction 和 composition constraints 编译为更适合完整页面生成的 provider input；它可以优化请求与构图，但不能发明或静默改写 source-owned meaning 或 required copy。`slide_document.mjs` 已识别、但 `page_authority_source.mjs` 尚未消费的 `**SLIDE BODY**` YAML 只是候选语法 seam，不是现成领域模型。实现 change 必须先定义 closed keys、数量/长度限制、literal policy、重复/缺失诊断和 canonical hash，再决定是否采用它。无论选择哪种输入，canonical source 必须分开 narrative context、local-rendered header、provider-rendered content 与 visual direction，不能把 raw YAML 直接接进 prompt。

### 保留的不变式与刷新规则

以下能力正确且必须保留：

- 一个版本只选择一个 `framed` 或 `pure` 工作流；不得按 slide 混合 authority。
- 两种 workflow 必须共享同一个 page-image semantic core、provider-rendered body contract 和 baseline raw-quality criteria；不得再次分叉为“Pure 有图文 / Framed 无文字”两套世界。
- `slide_id` 仍是跨版本身份，`position` 仍只属于快照。
- provider work 仍经过 source receipt、typed raw plan、提交授权、Complete Page Review、final manifest 和 delivery evidence；本次不放宽远端调用授权。
- `05-delivery` 仍是 PPTX、notes 与最终交付的唯一 owner；`_generated/` 继续只能重建，不能手改。
- Framed 只保留 **provider-input-preserving local header refresh**：actual compiled provider input bytes、protected geometry、raw contract 和 profile 均不变时，固定 header 的本地排版/呈现变化才可复用 exact accepted provider-page evidence。
- title/kicker/subtitle literal 若进入 `context_not_to_render`，其内容变化会改变 provider input，默认必须 raw rebuild；不能再按“header 字段”粗略判为本地刷新。
- 任何 `provider_rendered_content`、narrative context、visual brief、protected-zone geometry、provider compiler/profile 或 Image2 composition 变更，必须走 Framed Generated Image Rebuild，并经现有 raw review/confirm 边界。
- Pure 的任意可见像素变更仍需 raw rebuild；notes-only 仍只经 `05-delivery`；增删重排或 workflow switch 仍是 preview-first Structural Versioning Path。

## 范围与非目标

本次目标是纠正 `page-authority-image2` 中 Framed 的文本所有权，而不是：

- 为每页增加可随意选择 `framed`、`pure`、`hybrid` 的第三种 slide-level workflow；版本级选择和结构路径应保留。
- 为 Framed 建立一套独立的 text-free page generator；Framed 应复用完整页面生成核心，只在 header rendering policy 和最终合成上增加职责。
- 以本地 shape/text box 重做 provider-rendered body、callout、图表或图内标签；这些内容的价值正是与 Image2 的画面协同。
- 提供 per-slide `fixed_fields` 或继续让 callout 默认归本地 frame；若未来需要固定 footer/callout，必须新增 versioned preset/capability。
- 承诺 Image2 对长段落、密集表格或复杂图表的逐字级排版精度。source 应引导短、结构化、可读的内容，必要时改变页面叙事或选择 Pure/其它合适结构。
- 静默修改已有 deck、state、receipt、raw evidence 或 final assets。
- 仅通过扩大或加深 header 背板掩盖图文冲突。优先改善 provider 构图约束和 frame preset。

## Clean Replacement Boundary

当前 `page-authority-image2-v2` 的 Framed 模型错误地把完整页面降为无字底图。
它不是需要保留、解释或转换的协议。实施 change 必须将 v2 从 active Harness
的 marker、parser、contract、workflow、state route、spec、guidance 和测试中移除。

1. 正确模型获得一个新的 current protocol identity；它不得接受 v2 marker、
   receipt、state、raw evidence 或 delivery evidence 作为输入。
2. 不存在 v2-to-current shim、capability gate、fallback、refresh 路由或证据迁移。
   若旧 bytes 仍在磁盘，它们只会被通用 unsupported-input boundary 拒绝。
3. 新协议的每个 Deck 都从新的 canonical source、receipt、authorization、raw
   generation、review 和 delivery lineage 开始；没有任何旧产物可以证明其状态。
4. 本 change 不批量处置 deck 数据。是否另行删除旧 run bundle 或 fixture 是一个
   独立的、显式授权的数据清理动作，不属于协议设计。

## 拟议 OpenSpec 影响面

实施前应创建一个独立 OpenSpec change。预期要在 change 内同步 delta spec、实现、测试和方法论文档，至少覆盖：

| 影响面 | 预计工作 |
| --- | --- |
| `content-parsing` | 定义并校验 Provider Content Schema、literal policy、Framed 的 provider-rendered content 与 non-rendering context；移除全页 no-text/no-labels 要求，替换为 fixed-header duplicate/protected-zone 约束 |
| `visual-config` | 表达两种 workflow 共用的 page-image visual language，以及 Framed 的 transparent overlay、protected zone 和 provider-facing composition constraints |
| `image-generation` | 规定 common page-image core、header-rendering policy、adapter-owned compiled provider input、prompt digest lineage、共同 baseline review 与 Framed composite 行为 |
| `image-production` | 移除依赖 text-free 的 raw plan、evidence 和 acceptance schema，建立正确模型的新 lineage |
| `pipeline-orchestration` | shared transport 只发送已绑定 prompt bytes；将 change classifier 的最小刷新路径绑定到 compiled provider-input fingerprint；拒绝废弃 v2 输入 |
| `harness-script-layout` | 保留 03/04 sibling adapter owner，新增双方只读依赖的 common page-image semantic/compiler seam；禁止 sibling 私有模块互相导入 |
| `node-specification` | 若采用新 protocol/capability，更新 source/state identity、workflow binding、Controller handoff 和 unsupported boundary |
| `slide-identity-and-ordering` | 保留版本级 workflow 与 Structural Versioning Path，更新新 protocol/capability 下的 preview/apply 身份约束 |
| `commands-reference` | 更新 Framed/Pure 的用户可见含义和 provider-input-preserving local refresh 路由 |
| `harness-charter` 与 workflow 文档 | 更新 BOOTSTRAP、AGENT_CONTRACT、glossary/流程中的 Framed 描述，防止 Agent 再次采用错误心智模型 |
| 测试与 E2E | 覆盖 source → contract → provider request → final composition → refresh classifier 全链路 |

实现前需要先用 `openspec status` 确认没有重叠的 active change；本计划编写时该列表为空。

### 根部权威传播

这次纠偏会改变 durable domain language，不能只落在实现和局部 spec。获 Review 后必须按 [`authority-propagation-map.md`](framed-hybrid-image2-composition/authority-propagation-map.md) 同步：

- `CONTEXT.md`：已定义 `Page Image Core`、`Header Rendering Policy`、Pure 与 Framed 的共同点/唯一差异；它记录目标领域语言，不授权操作错误 v2 runtime。
- `docs/adr/`：已新增 Proposed ADR，记录为何选择 common page-image core + transparent deterministic header overlay；不回写已有 Accepted ADR，待 Plan Review 完成后才可接受。
- `openspec/config.yaml`：替换当前含混/陈旧的 `full-page`、`body+header-lock` 语境和过宽 Header Text & Style Refresh 描述。
- `openspec/specs/`：通过一个 OpenSpec change 的 delta specs 修改，再按正常 sync/archive 流程进入 main specs；本 Plan Review 阶段不直接编辑 main specs。
- `AGENTS.md`、BOOTSTRAP、charter、workflow、reference：只在正确模型成为 current 后更新入口指导，不能提前让当前运行时与文档矛盾。

## 验收标准

### 合约与请求

- Framed source 能合法表达 provider-rendered body/labels/metrics/callout，固定字段闭合为 kicker/title/subtitle，并继续要求有效 frame preset。
- Pure 与 Framed 对 body/labels/metrics/callout 产生相同的 provider-rendered semantic contract；差异只体现在 header rendering policy、Framed protected zone 和 local overlay。
- 生成出的 raw contract 明确分开 `content_authority`、`local_rendered_header`、`provider_rendered_content`、`context_not_to_render` 和 `composition_constraints`；不再使用含混的 `text_free` 作为 Framed 总语义。
- Framed compiled provider input 包含 provider-rendered exact copy、non-rendering narrative/header context 和 protected-zone 定义；明确禁止重复 fixed header。
- actual prompt bytes/digest 被 raw plan、inspection、authorization、attempt 与 reconciliation 一致绑定；`ppt_flow.mjs` transport 不再二次理解 Framed/Pure prompt 语义。
- Pure contract 继续允许 Image2 渲染包括 header 在内的全页文本，不受 Framed exclusion 规则约束。

### 像素与刷新

- 合成后的 Framed 页面中 kicker、title、subtitle 的字体、字号、坐标和换行完全由本地 frame 控制。
- Framed final composite 的 Image2 底层必须 full-canvas 连续，header overlay 默认透明；不得出现由 frame 强加的大面积不透明卡片、空白横条或被裁切的“底图区”。
- body、图内标签和指标可由 Image2 与画面共同出现；没有重复的固定 header、无意文字覆盖、截断或与 frame 的冲突。
- 只有 compiled provider input 与 geometry/profile 不变的 local-header change 才不提交 provider 请求；会改变 provider context 的 header literal change 被判为 raw rebuild。
- provider-rendered content、narrative context 或 protected-zone/composition change 被 classifier 判为 raw rebuild，不能错误复用旧 raw evidence。
- Pure 任意可见内容变更、notes-only refresh 和 Structural Versioning Path 的既有行为回归通过。

### 验证方法

- 验收模型采用三级检查、两类主要人工决定：deterministic source/contract preflight；一次 Complete Page Review 的 `proceed / repair` 决定（Framed 并列 raw 与 production-equivalent composite；Pure 审查完整 provider page）；最终 delivery review。Pilot 只承担样本与成本控制，不新增独立语义 gate。
- 给 source parser、raw-contract validator、adapter prompt compiler、prompt-lineage validator 和 change classifier 增加定向 unit/integration tests。
- 用 mock provider 的 E2E fixture 验证 Pure/Framed 的 receipt、authorization、Complete Page Review、Framed final projection 与交付链路。
- Complete Page Review 对 Framed 每页并列展示 exact raw 与 production-equivalent composite，检查 provider-rendered literal/data 是否逐字正确、fixed header 是否缺失于 raw 且正确出现于 composite、protected zone 是否无冲突；Pure 每页审查完整 provider page，不另造 composite。
- 提供一组可检查的视觉 fixture，逐页 full-size 检查 Framed final composite 或 Pure provider page 的文字可读性、整体层级和单一构图；Framed 额外检查 fixed header 精确性、无重复 header 与 protected-zone 冲突。contact sheet 只检查 deck flow。
- visual fixture 同时检查每页是否只有一个 primary claim、title 是否表达 takeaway、provider-rendered 文字是否面向观众，以及页面是否退化为 UI card grid。
- 运行现有回归测试，并新增 Pure/Framed correct-model cases 与废弃 v2 input rejection cases，确保 active Harness 不会解释、转换或执行错误协议 bytes。

## 风险 / 取舍

- [Image2 文字保真度不足] → 将 provider-rendered 内容限定为短、结构化、可读的 page language；raw visual review 仍是接受门槛，不因 source 合法就跳过。
- [固定 header 被 Image2 重复生成] → compiled input 必须把 header/primary claim 标为 context-not-to-render 并传递几何；raw review 加入 duplicate-header 检查，失败后走 owner repair/rebuild。
- [Image2 文字碰撞 frame] → 以 provider-visible protected zone 约束构图，frame preset 给出精确几何；最终 composite 做视觉和几何 QA。
- [source schema 膨胀或把 `SLIDE BODY` 变成无结构大文本] → 先定义最小、可验证的 structured content vocabulary，拒绝无界自由格式；在 OpenSpec design 阶段决定 canonical input。
- [header-only 刷新误触发 raw rebuild，或反之] → classifier 比较 actual compiled provider-input fingerprint 与 local-composite input，而不是只看字段名；把 context-changing 与 provider-input-preserving 两类变更各自做回归案例。
- [授权绑定的 request 与实际发送 prompt 不一致] → prompt compiler 归 selected adapter，final bytes/digest 进入整条 lineage，shared transport 禁止二次编译。
- [错误 v2 bytes 被误当作正确模型输入] → active Harness 删除 v2 route；通用 unsupported-input boundary 在任何 state、receipt、evidence 或 provider work 前拒绝它们。
- [frame 又演化为通用大卡片] → 将“最小化/透明优先”的视觉目标写入 preset 约束和 visual fixture，只有明确风格需要时才使用面板。
- [Pure/Framed 再次演化成两套 page semantics] → 以 common `page_image_core` contract 和共享 baseline tests 锁定 body/visual 行为，差异测试只覆盖 header policy 与 Framed composition。

## 已确认与待定决策

### 已确认

1. `framed` 和 `pure` 保留为仅有的版本级工作流名称；`hybrid` 只描述 Framed 的页面构成，不是第三个模式或 slide-level choice。
2. Framed 将 kicker/title/subtitle 的 exact literals 作为 `context_not_to_render` 传给 provider；因此 literal change 通常改变 compiled provider input，必须 raw rebuild。
3. 默认所有 provider-rendered copy 都是 exact；只有 source 显式标记的非事实性 supporting copy 才是 Presentation-Adaptable Copy，可为图文一体构图压缩或改写。该授权不覆盖 claims、facts、numbers、names、labels、headers 或未标记文案。
4. Complete Page Review 只作一次 `proceed / repair` 决定：Framed 并列审查 raw 与 production-equivalent composite；Pure 审查完整 provider page。它不新增独立 composite gate，最终 delivery review 仍保留。

### 尚待 OpenSpec Design

1. Provider Content Schema 的具体 closed vocabulary、数量/长度限制、literal policy syntax 和 canonical input syntax 是什么？`SLIDE BODY` 只可作为候选载体，不能先当作自由 YAML。

## 落地关联

本计划获 Review 后，下一步是创建一个专门的 OpenSpec change，先完成术语、正确 protocol identity、canonical source schema、adapter-owned prompt lineage 和 provider-input fingerprint 的设计，再分阶段实现 parser、Framed/Pure owner、shared transport、classifier、review、文档与测试。

在该 change 被批准前，本计划不授权修改 `ppt_maker_harness/`、`openspec/specs/` 或任何 `deck_*` run bundle；`deck_dark_factory/3_versions/v3` 只作为已验证的反例和后续 visual acceptance fixture 的候选来源。
