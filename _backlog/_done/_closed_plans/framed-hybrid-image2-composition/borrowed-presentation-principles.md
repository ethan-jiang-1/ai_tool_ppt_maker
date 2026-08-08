# 辅助材料: Presentation 原则到 Harness 约束的映射

> Parent plan: [`../framed-hybrid-image2-composition.md`](../framed-hybrid-image2-composition.md) | 关闭: 2026-08-08 | 状态: 历史材料

## 目的与边界

这份材料记录可以从 OpenAI `presentations` skill 借鉴的设计思想，并把它翻译为 PPT Maker Harness 自己拥有的约束。它不是运行时依赖，也不授权复制该 skill 的工具链、模板或实现。

核心判断是：

> 一页 PPT 不是背景图和若干文字框的集合，而是一句由标题、证据、文字和视觉共同说出来的话。

因此 Framed 的本地 layer 只能锁定需要精确排版的 header；Image2 layer 必须承担其余图文表达，并与 header 在最终页面上构成一个整体。

用生产模型表达就是：Pure 与 Framed 共享同一个完整页面构图核心；Framed 只多一层透明、确定性的 header overlay。这个 overlay 保证 header consistency，但不能把一张完整页面重新切成“背景图 + UI 卡片”。

## 原则映射

| 借鉴原则 | 在 Harness 中的解释 | 对本计划的约束 | 主要验收信号 |
| --- | --- | --- | --- |
| 先定义 communication job | 先说明目标观众、页面要产生的理解/判断和中心结论，再决定布局 | `provider_rendered_content` 不只是散乱 copy；它要服务一个明确页面任务 | 看完一页能用一句话说出它要观众理解什么 |
| 一页一个 narrative job | 一页只推进一个主张；证据和视觉围绕它组织 | source authoring 应拒绝把多个平行主题塞入一页 | title、body、metrics 和视觉指向同一 primary claim |
| takeaway title | title 说出结论，不只命名话题 | Framed 虽由 local frame 渲染 title，但 title 的语义仍属于页面叙事 | title 是可直接朗读的观点，而非“现状分析”式目录词 |
| one composition | 页面应像一个完整画面，避免卡片网格和组件库式拼装 | Image2 同时拥有 body、labels、metrics 和 visuals；frame 不成为通用大卡片 | Complete Page Review 中，Framed composite 或 Pure provider page 有单一视觉重心，没有“底图 + 浮层 UI”割裂感 |
| evidence into meaning | 数字、图表和案例必须说明其意义，而不是罗列 | structured body 应能表达 claim、evidence 和 implication 的关系 | 每个关键 metric/label 都能解释为什么出现在本页 |
| shorten before shrink | 内容放不下时先改写或改变构图 | source/prompt 不鼓励长段落和密集表格；不能用微小字体掩盖过载 | 正文简短可读，没有因塞内容而形成异常小字或拥挤 |
| audience-facing copy | 页面只出现观众需要看到的语言 | 禁止 prompt、制作指令、内部字段名、talk track 泄漏到 Image2 输出 | final pixels 不含模型指令、制作说明或内部术语 |
| compose for intended placement | 生成视觉前先知道文字区和裁切关系 | protected zone 以 provider-visible composition constraint 表达 | Image2 主体主动避让 fixed header，而非最终用面板遮挡 |
| ownership at the right layer | 全局、重复和单页变化应在对应层处理 | visual language → frame preset → slide content 分层；刷新由真实 provider/local input 决定 | 不用 slide hack 修复 deck-level 风格，也不把改变 provider context 的 header edit 错判为本地刷新 |
| final render is the truth | 零件分别正确不代表最终页面正确 | Complete Page Review 必须看完整页面，之后仍有 final delivery review | full-size final 页面无重复、冲突、裁切、错误换行和层级断裂 |

## 对 Source Authoring 的启发

未来的 canonical source 不宜只提供一段无结构 `BODY`，也不宜把具体坐标和 provider prompt 暴露给作者。设计 `SLIDE BODY` 或等价结构时，建议至少能表达下列语义角色，但字段名称仍由 OpenSpec design 决定：

```text
communication_job
  audience_outcome
  primary_claim

provider_rendered_content
  evidence / metrics
  labels / diagram_text
  implication / callout

local_rendered_header
  kicker
  title
  subtitle

context_not_to_render
  primary_claim + fixed-header roles/literals needed for coherence
```

这不是要求每页把所有字段填满。原则是 source 拥有含义与 exact copy，明确“这页说什么”；Image2 只决定 provider-rendered 内容的像素呈现与图文构图，fixed frame 只决定精确 header 怎么落位。

需要防止两个极端：

- source 过于贫乏，只给主题词，迫使 provider 编造正文或逻辑。
- source 过于具体，把每个坐标、字号和装饰都写成指令，反而剥夺 Image2 的构图能力。

## 分层视觉验收

### Complete Page Review

Complete Page Review 是 deterministic preflight 后唯一的页面级 `proceed / repair` 决定，不把 raw acceptance 和 final-composite acceptance 拆成两个 gate：

- Framed 并列展示 provider raw 与 production-equivalent composite；检查 raw 中没有 fixed header 副本，并确认叠加 header 后的页面成立。
- Pure 直接展示完整 provider page，不另造 composite。
- 两种模式都检查 primary claim 所需的 body、metrics、labels 和 visual evidence 是否完整、正确、可读。
- 两种模式都检查是否泄漏 prompt、字段名、制作说明或其它非 audience-facing copy，以及是否形成一个主体明确的 composition，而不是重复卡片、按钮、badge 或 dashboard UI。
- Framed 额外检查主体是否主动避让 protected zone，header 的字体、字号、位置、换行和对齐是否满足 fixed frame contract，并且 header 不与 provider-rendered 文字、人物、图表或指标重叠、争抢焦点或产生重复。
- Framed composite 必须仍保持一个整体构图，而不是通过不透明 header card 遮住 raw image 后勉强可读。

### Final Delivery Review

Complete Page Review 后仍须检查最终 PNG、PPTX、notes 和 deck-level 节奏。contact sheet 可以评估整套 deck 的重复和视觉一致性，但不能代替逐页 full-size final review；每页仍须检查裁切、模糊、意外换行、过小文字、异常留白和视觉层级中断。

## 应进入 OpenSpec 的规则

下列内容适合成为可测试的规范性要求：

- Framed request 必须携带 provider-rendered semantic content 和 fixed-header exclusion contract。
- Image2 不得重复 fixed header，但允许并应当渲染其它 audience-facing page text。
- Complete Page Review 将 Framed raw 与 production-equivalent composite 纳入一个决定；Pure 使用完整 provider page；final delivery review 仍独立存在。
- provider-input-preserving local header change 与 provider context/content change 必须产生不同的 invalidation 结果。
- visible output 不得包含内部 prompt、source 字段名或制作说明。
- Framed final composite 与 Pure provider page 都必须检查裁切、异常换行、清晰度和整体层级；Framed 额外检查重复 fixed header、与 header 的重叠和 protected-zone 冲突。

下列内容更适合作为 authoring/review guidance，而非僵硬 schema：

- 每页一个 narrative job 和 primary claim。
- title 优先采用 takeaway 写法。
- 内容过载时优先删减或重构页面。
- 默认偏向一个完整构图，避免 UI card grid。

这种区分可避免把审美判断伪装成 parser 能完全证明的布尔值，同时仍给 Agent 和 reviewer 一套明确的判断标准。

## 明确不引入的依赖

本计划不复制或依赖：

- `@oai/artifact-tool`、其 workspace setup 或文件交付协议。
- Codex Grid、内置 layout modules 或其模板选择路由。
- 50/35/24/16pt 等默认字号作为 Harness 全局硬编码。
- “不得使用程序化绘图”等绑定特定生成工具的限制。
- `presentations` skill 的 citation syntax、临时目录约定或 Google Slides routing。

这些属于该 skill 的具体生产环境。Harness 应拥有自己的 source、receipt、provider、composition、review 和 delivery 契约，只借鉴其对叙事、构图与最终视觉质量的判断方式。
