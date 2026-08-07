# Research: Framed Hybrid Image2 页面所有权模型

> Parent plan: [`../framed-hybrid-image2-composition.md`](../framed-hybrid-image2-composition.md)
> 研究日期: 2026-08-07
> 状态: 供 Review；不授权实现

## 结论摘要

当前方向**有条件成立，但主计划还需一次关键收紧**：Framed 应是“本地固定 header + provider 生成其余图文像素”的 hybrid，Pure 应由 provider 生成全部可见像素；然而这描述的是**像素/渲染所有权**，不是内容权威。所有主张、数据和必须出现的文字仍由人和 canonical source 决定，Image2 只负责把 provider-rendered 内容与视觉一起构图，不能被授权发明或改写含义。

固定层应是协议级闭集：`kicker`、`title`、`subtitle`。`callout` 当前虽在 Text Frame 内，但它通常与正文证据/画面关系更紧，默认应迁到 provider-rendered 内容；不要提供 per-slide `fixed_fields` 逃生口，否则所有权、protected zone 和刷新判定会再次变含糊。

最大的计划修正是刷新规则：provider 需要知道页面主张以及 fixed header 的 context-only 语义，才能让画面与标题同向并避免重复。于是“所有 header 文字变化都可本地刷新”不成立。只有当**实际 provider 输入字节、protected geometry、raw contract 和 profile 全部不变**时，才可本地合成；会改变 provider context 的标题/副标题内容编辑必须重建 raw。

## Owner 澄清后的 canonical 表述

研究完成后，Owner 将初衷进一步收敛为：Pure 与 Framed 的 Image2 页面生成本质相同；Framed 只在 full-canvas Image2 页面上叠加透明、确定性的 kicker/title/subtitle。本澄清与研究证据一致，并把架构建议从“两个 workflow 的 hybrid 分工”进一步收紧为“一个 common page-image core + 两种 header rendering policy”。规范性定义见 [`canonical-page-model.md`](canonical-page-model.md)。

因此，研究中所有关于 source authority、provider-rendered content、prompt lineage、protected zone 和 raw/composite review 的结论同时适用于 Pure/Framed 的共同核心；Framed 只增加 context-not-to-render、protected geometry 和 local transparent overlay 的差异性约束。

## 研究问题与方法

问题是：目标 hybrid/Pure 划分是否正确，以及 source schema、provider contract、protected zone、失效刷新和 review 应如何设计，才能不产生新的错误心智模型。

本研究只检查一手材料：本 repo 的实现、spec、tests、charter；本地 OpenAI first-party Presentations skill；OpenAI 官方 Cookbook；Microsoft 官方 PowerPoint 文档。每项结论区分为：

- **事实**：代码/规格/官方材料直接证明。
- **工程推论**：由多个事实推出，可由实现测试证伪。
- **设计建议**：推荐选择，仍需 owner 决策。

当前 OpenAI image-generation 官方网页与文档 MCP 在本轮受到 `403`/未热加载限制；因此本文**不声称**已从当前公开文档验证 `gpt-image-2` 的精确文字保真或几何保证，也不拿二手资料补洞。OpenAI Cookbook 的 GPT Image 示例仅用于说明生成约束不是确定性排版证明，不能替代本项目自己的 acceptance。

## 证据矩阵

| 结论 | 一手证据 | 类型 | 对设计的含义 |
| --- | --- | --- | --- |
| 当前 Framed 被系统性定义为全页 text-free | parser 强制 `no-readable-text`/`no-labels` 并拒绝 `BODY`：[`page_authority_source.mjs`](../../../ppt_maker_harness/scripts/01-content/internal/page_authority_source.mjs#L420-L448)；raw contract 固定 `text_free: true`：[`03-framed-image/index.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/index.mjs#L570-L600)；规格同样禁止 Framed body：[`content-parsing/spec.md`](../../../openspec/specs/content-parsing/spec.md#L151-L182) | 事实 | 这是跨层领域模型错误，不是 prompt 单点 bug。 |
| 当前本地 frame 实际拥有四个字段，且 callout 额外占据底部安全区 | `FIELD_ORDER` 含 `callout`，callout variant 额外保留底部 `96px`：[`text_frame.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/internal/text_frame.mjs#L16-L53)；render contract 也固定四字段：[`framed_render_contract.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs#L25-L26) | 事实 | 主计划“及经明确列入固定层的元素”过宽；应明确 callout 的迁移和固定字段闭集。 |
| `SLIDE BODY` 目前只是被扫描，不是已定义的 canonical body schema | parser 只保存 raw YAML/range：[`slide_document.mjs`](../../../ppt_maker_harness/scripts/01-content/internal/slide_document.mjs#L202-L229)，并把它挂在 `structured_body_fields`：[`slide_document.mjs`](../../../ppt_maker_harness/scripts/01-content/internal/slide_document.mjs#L277-L325)；Page Authority receipt 仍只消费 inline `BODY`：[`page_authority_source.mjs`](../../../ppt_maker_harness/scripts/01-content/internal/page_authority_source.mjs#L615-L647) | 事实 | 这是可利用的语法 seam，不是可直接复用的领域模型；需先设计 schema 和验证。 |
| 当前 prompt 编译越过 adapter 边界，并且 inspection/attempt hash 绑定的不是实际发送 prompt | shared runtime 声称只包装 adapter-owned opaque raw contract：[`page_authority_target_runtime.mjs`](../../../ppt_maker_harness/scripts/shared/image2/page_authority_target_runtime.mjs#L630-L642)；但 `ppt_flow.mjs` 按 workflow 二次生成 Pure prompt：[`ppt_flow.mjs`](../../../ppt_maker_harness/scripts/ppt_flow.mjs#L2041-L2076)，发送时才调用：[`ppt_flow.mjs`](../../../ppt_maker_harness/scripts/ppt_flow.mjs#L2133-L2144)；inspection 保存的是 `JSON.stringify(request)`：[`page_authority_target_runtime.mjs`](../../../ppt_maker_harness/scripts/shared/image2/page_authority_target_runtime.mjs#L247-L265)；attempt hash 也哈希 request wrapper：[`page_authority_progressive_raw_owner.mjs`](../../../ppt_maker_harness/scripts/shared/image2/page_authority_progressive_raw_owner.mjs#L1293-L1313) | 事实 | prompt compiler 必须回到 03/04 adapter，实际 prompt bytes/digest 必须进入 plan、inspection、authorization 和 attempt lineage。 |
| 当前“Text Frame literal 均可本地刷新”只因 underlay signature 故意排除了文字 | `underlaySignature` 只含 visual/frame facts，不含 literals：[`03-framed-image/index.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/index.mjs#L239-L258)；因此 classifier 在 raw contract 相同后允许 local compose：[`03-framed-image/index.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/index.mjs#L282-L349)；测试把 title 内容变化断言为 provider-free：[`test_target_refresh_routing.mjs`](../../../tests/06-iteration/test_target_refresh_routing.mjs#L62-L79) | 事实 | hybrid 中一旦 header 语义进入 provider context，这一旧不变式必须改成 provider-input fingerprint 判定。 |
| protected zone 当前是 deterministic guide/overlay，不是 provider 遵守证明 | frame 将 safe zones 投影为 review rectangles：[`03-framed-image/index.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/index.mjs#L446-L466)；规格要求 review 展示 raw + guide：[`image-generation/spec.md`](../../../openspec/specs/image-generation/spec.md#L192-L235) | 事实 | zone 应同时是 provider constraint、review overlay 和 final collision check；不能仅靠 prompt 当作保证。 |
| 当前已有“样本 composite”与“全量 raw review”两个不同表面 | Framed Pilot 明确复用 production-equivalent compositor：[`image-production/spec.md`](../../../openspec/specs/image-production/spec.md#L105-L124)；complete raw review 则覆盖全 plan 和 provenance：[`image-generation/spec.md`](../../../openspec/specs/image-generation/spec.md#L489-L519) | 事实 | 不宜盲加第三个人工 gate；应让全量 review 同时展示 raw 与 production-equivalent composite，Pilot 只保留成本/样本职责。 |
| final pixels 才能证明页面成立 | Presentations skill 要求逐页全尺寸检查，contact sheet 只看 deck flow：[`SKILL.md`](/Users/bowhead/.codex/plugins/cache/openai-primary-runtime/presentations/26.731.11130/skills/presentations/SKILL.md#L104-L112)；style guide 要求 one claim/one composition：[`style_guidelines.md`](/Users/bowhead/.codex/plugins/cache/openai-primary-runtime/presentations/26.731.11130/skills/presentations/style_guidelines.md#L33-L45)、[`style_guidelines.md`](/Users/bowhead/.codex/plugins/cache/openai-primary-runtime/presentations/26.731.11130/skills/presentations/style_guidelines.md#L65-L84) | 事实 | raw 合法不等于 slide 合格；final composite/delivery review 不可省。 |
| 固定 header 与 layout 层是合理的演示文稿模型 | Microsoft 说明 master/layout 控制共享字体、图片、placeholder 类型和位置，并由 slide 应用布局：[What is a slide master in PowerPoint?](https://support.microsoft.com/en-us/office/what-is-a-slide-master-b9abb2a0-7aef-4257-a14e-4329c904da54) | 事实 | 本地精确 header 是 layout-style concern；它不意味着整页 body 必须脱离视觉层。 |
| 生成约束不能当成像素级证明 | OpenAI 官方 Cookbook 说明 GPT Image 擅长详细 instruction following，但 mask 编辑仍“可能编辑 mask 内部”，且 prompt 要描述完整结果：[Generate and edit images with GPT Image](https://github.com/openai/openai-cookbook/blob/main/examples/Generate_Images_With_GPT_Image.ipynb) | 事实（GPT Image 示例，不外推为 gpt-image-2 SLA） | protected zone、文字逐字正确和不重复必须由 review/eval 验证，不能只由 prompt 声明。 |

## 对当前方向的支持、修正与反对

### 支持

1. Framed 保留本地固定 header、Image2 生成其余图文像素，能同时保留 header 的确定性排版与 body/labels/metrics 的整体构图。
2. Pure 保持 provider 生成全部可见像素是清晰的另一种 render authority。
3. 版本级只选一个 workflow、稳定 `slide_id`、exact receipt/authorization/evidence、旧 bytes 不静默重解释，这些边界应保留。
4. protected zone 应从“全页禁止文字”纠正为“为固定 header 留构图空间”。

### 必须修正

1. 把 `image_owned_content` 改名为 `provider_rendered_content`（或 `provider_pixel_owned`）。Image2 拥有 render/composition，不拥有事实、主张或 exact copy。
2. 固定字段只允许协议声明的 `kicker/title/subtitle`。`callout` 默认归 provider-rendered；未来若需固定 footer/callout，应新增 versioned preset/capability，不允许 source 任意列 `fixed_fields`。
3. provider 必须拿到非渲染的 narrative/header context，否则图与标题可能各说各话；但 context 一旦变化，raw 就可能失效。
4. “Header Text & Style Refresh”不能再按字段名判断；只在 compiled provider input digest 与 protected geometry 不变时 local compose。
5. prompt 是 adapter 语义的一部分，不能在 `ppt_flow.mjs` transport 层按 workflow 临时分支。

### 反对的替代方案

- **反对**“Image2 是内容作者”：这会允许模型发明或改写 PPT 主张。
- **反对**“固定 header 完全不进 provider context”：这会削弱页面叙事与构图一致性。
- **反对**“protected rectangle = 确定不会碰撞”：生成模型约束需要像素验收。
- **反对**“把 `SLIDE BODY` 原样接进 prompt”：它目前没有领域 schema、literal 规则或 content authority 验证。
- **反对**为审美指导建立无法客观证明的 parser 布尔值，例如 `one_composition: true`。

## 推荐领域模型

```text
Human + canonical source
  semantic/content authority
    communication job / primary claim
    facts, metrics, labels, exact visible literals

Framed adapter
  local_rendered_header (closed set)
    kicker + title + subtitle
    exact local typography and geometry
  provider_rendered_content
    body + metrics + labels + diagram text + quote + callout
  provider_context (render=false)
    primary claim + fixed-header roles/literals needed for coherence/duplicate avoidance
  composition_constraints
    protected geometry + do-not-render fixed header + visual language

Pure adapter
  same source content authority
  provider renders every visible pixel, including header
```

关键不变式应写成：

> Source owns meaning and exact required copy. The selected workflow owns rendering. Provider ownership never grants semantic invention or silent paraphrase.

## Source 与 Prompt 边界

建议 source 至少分开四种东西，而不是一个大 `BODY`：

| 类别 | 是否期望出现在像素中 | 变化是否影响 raw | 例子 |
| --- | --- | --- | --- |
| `narrative_context` | 否 | 是，只要进入 provider context | communication job、primary claim、audience outcome |
| `local_rendered_header` | 是，由本地渲染 | 取决于是否改变 provider input；不能一概 local | kicker/title/subtitle exact literals |
| `provider_rendered_content` | 是，由 provider 渲染 | 是 | exact body、metric、label、diagram text、callout |
| `visual_direction` | 否，是生成指令 | 是 | scene、composition、motifs、style relationship |

`provider_rendered_content` 应默认要求 exact literal；需要允许改写时必须由 source 显式表达，而不能由模型自己判断。结构化字段应能表达 role、exact text/data、与 primary claim 的关系，但不暴露自由坐标和 transport prompt。

`SLIDE BODY` 可以作为承载结构的候选语法，但实施前必须定义 closed keys、长度/数量限制、exact-literal 规则、重复/缺失诊断和 canonical hash。不能把当前的 raw YAML scan 当成已存在能力。

每个 adapter 应编译一个可审计的 provider payload：

```text
compiled_provider_input
  content_to_render
  context_not_to_render
  visual_direction
  composition_constraints
  generation_profile
```

其 exact bytes/digest 必须进入 provider request inspection、raw plan/authorization scope、attempt provenance 和 reconciliation；shared transport 只发送已绑定 bytes，不理解 Framed/Pure 语义。

## Protected Zone

protected zone 应同时存在于三个层面：

1. **Canonical geometry**：由 frame preset 编译，进入 raw contract/hash。
2. **Provider constraint**：要求该区构图安静、不放 provider-rendered text/关键主体，并明确不生成 fixed header。
3. **Acceptance evidence**：raw review 叠加 guide；composite review 检查与本地 header 的实际重叠、焦点竞争和重复。

它不是“大面积空白区”或“不透明 header card”的同义词。当前 `standard-v1` 的 `0.96` panel opacity 和 `286px` 顶部保留区（[`text_frame.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/internal/text_frame.mjs#L7-L15)、[`text_frame.mjs`](../../../ppt_maker_harness/scripts/03-framed-image/internal/text_frame.mjs#L32-L53)）应在后续视觉设计中单独 review，而不是作为 hybrid 语义本身。

## 刷新与失效

刷新分类应比较**实际像素 owner 输入**，而不是字段名：

| 变化 | 推荐路径 |
| --- | --- |
| provider-rendered literal/data、narrative context、visual direction | raw rebuild |
| protected geometry、frame preset、provider/compiler/profile | raw rebuild |
| fixed header literal，且该 literal/context 进入 compiled provider input | raw rebuild |
| fixed header local style/literal，且可证明 compiled provider input bytes、geometry、raw contract/profile 均不变 | local compose |
| notes only | delivery refresh |
| 增删重排/workflow switch | structural versioning |

因此主计划不能承诺“固定 header 内容变化继续本地刷新”。应改为：**provider-input-preserving local header refresh**。若 owner 决定把 exact header literals 全部作为 `render=false` context 发送给 provider，则任何 literal 改动都自然改变 prompt digest并重建 raw；这是获得更强叙事一致性的明确代价。

## 验收模型

建议是“三层检查、两类主要人工决定”，避免新增无谓 gate：

1. **Deterministic preflight（机器）**：source schema、exact literals、frame fit、geometry、contract/prompt digest、coverage。
2. **Raw-quality acceptance（人）**：沿用 Pilot/complete lifecycle。Pilot 仍是样本/成本 gate；complete review 应为每页同时提供 exact raw 与 production-equivalent composite，而非只看 underlay + guide。检查必需文字逐字正确、数据正确、无 fixed header 重复、protected-zone 避让和整体构图。
3. **Delivery/final review（人）**：检查最终 PNG/contact sheet/PPTX/notes，逐页 full-size 验证 wrapping、清晰度、裁切、层级和 deck-level 节奏。contact sheet 不能替代逐页检查。

如果 complete raw review 已展示 production-equivalent composite，就不需要再新增一个独立“composite approval”状态；delivery review仍绑定最终交付 lineage。

## 兼容迁移

1. 保留现有 `page-authority-image2-v2` bytes 的历史解释；旧 Framed evidence 仍代表 text-free underlay。
2. 新语义应使用新 protocol/capability 或同等强度的 explicit compatibility gate；不能原地改变旧 `text_free: true` 的含义。
3. 迁移到 hybrid 时，provider contract/prompt、protected geometry 和 review contribution 都改变，必须产生新 raw debt 和 owner-authorized rebuild。
4. 不批量迁移 deck，不继承旧 raw acceptance/delivery decision。
5. prompt compiler ownership 修复也应视为 lineage 变化；不能在保持旧 plan hash 的同时改变实际发送 prompt。

## 应更新主计划的事项

1. 将所有 `image_owned_content` 改为 `provider_rendered_content`，新增“content authority vs render authority”不变式。
2. 把 fixed frame 从“kicker/title/subtitle（及明确列入的元素）”收紧为协议闭集 `kicker/title/subtitle`；明确 callout 默认 provider-rendered，删除任意扩展逃生口。
3. 将“Image2 不生成 fixed header”补全为：接收 `context_not_to_render`，理解 primary claim/fixed header，但不得渲染或复写它。
4. 把 broad header-only local refresh 改成 provider-input-preserving refresh；标题语义变化默认 raw rebuild。
5. 在 OpenSpec 影响面加入 provider prompt compiler/lineage 修复：adapter 编译，实际 prompt digest 进入 inspection、authorization、attempt/reconciliation。
6. 把两级视觉验收细化为 deterministic preflight + raw/composite multi-view acceptance + final delivery review；Pilot 是样本成本阶段，不是第三套语义 acceptance。
7. 把 `SLIDE BODY` 从“可能成为 canonical input”改为“候选语法 seam；需先定义领域 schema，不能直接接线”。

## 仍需 Owner 决策

1. 新语义是否使用 `page-authority-image2-v3`，还是给 v2 增加不可混淆的 capability version？研究建议新协议/versioned capability。
2. provider context 是否包含 fixed header 的 exact literals，还是只包含稳定 primary claim + fixed roles？前者更利于重复控制，但会让任意 header literal edit 重建 raw。
3. 哪些 provider-rendered 内容必须逐字 exact，是否允许某些 explanatory copy 显式 `paraphrase_allowed`？建议默认全部 exact，例外需显式且受 review。
4. complete raw review 是否升级为 raw/composite side-by-side，同时保留一个 complete-review decision？研究建议是。
研究完成后的 Owner 澄清已经决定：Framed overlay 默认透明，只允许最小 contrast treatment，不保留大面积不透明 header card。具体 protected geometry 是否缩小仍由后续 preset design 和 visual fixtures 决定。
