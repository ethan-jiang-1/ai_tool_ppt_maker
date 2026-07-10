---
title: 04 — Create Content Assets
stage: 02_content_design
position: 05 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 02_content_design/README.md
- 02_content_design/03-specify-slides-multi-layer.md
feeds_into:
- 02_content_design/05-iterate-with-version-discipline.md
agent_action: ask_questions
---

# 04 — Create Content Assets

← [03](03-specify-slides-multi-layer.md) | [Next →](05-iterate-with-version-discipline.md)

## 规格不等于内容

多层规格（03）定义了每张 slide 的**结构**——它是什么类型、要传递什么认知、视觉上长什么样。但结构需要**内容**来填充：具体的文案、视觉概念、数据表达。

本章覆盖四种内容资产类型的准备方法。

## 资产类型 1：文字内容 — 幻灯片上的每个字

### Headline/Kicker 的写法

每张 slide 的 KICKER 和 TITLE 在 03 中已经初步定义，但到了内容资产准备阶段，你需要做最后的 polish。

**TITLE 精炼检查清单**：
- [ ] 能在 5 秒内读完吗？（>15 词 = 太长）
- [ ] 能被反驳吗？（如果不能，它没有论证力）
- [ ] 包含 "and" / "but" 吗？（如果有，拆成两个更尖锐的主张试试）
- [ ] 使用了 "leverage" / "optimize" / "synergize" 吗？（jargon——换掉）
- [ ] 和前后 slide 的 TITLE 有递进关系吗？（如果交换位置不受影响，还没有递进）

**T10 案例中的 TITLE polish**：
- v2: "Growth Requires Machine-Readable Data"（声明性，但弱）
- v3: "Your relationship keeps today's customers. Your data finds tomorrow's."（对比结构，两个独立的主张，更锐利）

### 画面文字的写法

IMAGEPROMPT 中的文字（KPI 数字、卡片标签、callout 文字、流程步骤）必须精确——模型不会替你写正确的文字，它会渲染你给它的文字。

**精确文字原则**：
1. 每个文字元素在 prompt 中用引号标出：`"HOLD TODAY"` 而不是 `a label that says HOLD TODAY`
2. 不要用 "etc." 或 "and more"——列出所有文字
3. 数字用 approximate 描述：`"100,000+ SKUs"` 而不是 `"a large number"`
4. 缩写第一次出现时展开：`"AVL (Approved Vendor List)"` 在正文中，但 KICKER 保持缩写

### 底部 Callout Bar 的写法

大多数 slide 需要一个底部 callout——一句完整的话，把 slide 的 claim 翻译成对观众的意义。

规则：
- 一句话，不超过 20 个词
- 不是 slide TITLE 的重复——是 "so what"
- 用主动语态

T10 案例中的 callout：
- Slide 08 (Growth): "Most factories are optimized for HOLD — not for FIND."
- Slide 10 (Efficiency): "The best defect is the one that never happened."
- Slide 12 (CX): "Fast configuration makes price secondary."

## 资产类型 2：视觉概念 — 抽象想法的具象化

### 概念→视觉映射

每一个抽象概念必须有一个具体的视觉对应物。这是内容设计中最容易被低估的环节——你以为 "AI 搜索匹配" 是一个清晰的概念，但 image model 不知道怎么画 "匹配"。你需要告诉它画什么。

**案例：T10 项目的概念→视觉映射**：

| 抽象概念 | 视觉映射 | 为什么 |
|---------|---------|--------|
| "Growth through data discovery" | Vending machine → data stream → ERP system → AI search beam → new customer | 把抽象的 "数据驱动增长" 分解成一连串具体的物理意象 |
| "AI quality inspection" | Camera/lens array → scan beams → defect highlight → pass/fail gate | 质量检测的可感知流程 |
| "Speed as experience" | Three speedometer gauges (config speed / quote speed / delivery speed) | 用仪表盘让 "速度" 可量化比较 |
| "Two kinds of AI" | Left: magnifying glass over gear (analytic) vs Right: three interconnected autonomous nodes (agentic) | 两个可辨识、可对比的视觉符号 |
| "Risk management" | Micrometer gauge with "acceptable tolerance" zone highlighted | 用精密制造的量具隐喻表达 "风险可测量、可管理" |

### 视觉概念设计原则

1. **从具体到抽象，不要反过来**。不要说 "show innovation"——说 "show a precision component under a digital scanner, with data streams branching off to different systems"。
2. **用熟悉的物体做锚点**。对于 manufacturing audience，用 caliper、micrometer、vending machine、CNC controller——这些是他们每天看到的东西。对于 pharma audience，用 microscope、assay plate、regulatory stamp。
3. **一个概念 = 一个视觉符号**。不要在 slide 上出现两个不同的符号代表同一个概念——这会混淆观众和 model 双方。视觉符号系统应该在你的 deck 中保持一致（更多内容参见 01 中的 Micro Decoration System）。
4. **视觉概念不是 decoration**。不要在 slide 角落加一个齿轮图标 "因为我们是制造业"——这是 decoration，不是 communication。每个视觉元素必须承担叙事功能。

## 资产类型 3：数据表达 — 没有具体数字时怎么办

战略 keynote 的一个常见约束：你不能使用具体的内部数字（演讲者不熟悉数据、数据保密、或者数字还在变动中）。但你仍然需要让观众感受到 magnitude 和 direction。

### 用 magnitude 替代 decimals

| ❌ 不要用 | ✅ 用 |
|----------|------|
| "Revenue increased 17.3% YoY" | "Revenue growth accelerated — from single-digit to double-digit in 18 months" |
| "We have 847,293 SKUs" | "SKU count: crossing 100,000" |
| "Market share at 23.7%" | "Market share: top 3, approaching #2" |

### 用 relative comparison 替代 absolute numbers

- "Larger than the next three competitors combined"
- "Faster than the industry average by 40%"
- "从 manual quote (3 days) 到 automated quote (3 minutes)——速度提升 1,000x"

### 用 visual structure 替代 data charts

当你不能显示真实数据图表时，用视觉结构来表达 magnitude：
- **Bar/scale**：用相对长度表达 "more than" / "less than"，不标具体刻度
- **Timeline**：用时间轴上的位置表达 "before" / "now" / "deadline"，不写具体月份
- **Comparison panels**：用左右对比表达 "this vs that"，用视觉密度表达 "heavy vs light"

T10 案例——Slide 03 (能力累积曲线) 使用了 "TEXT→MULTIMODAL→REASONING→ACTION" 的指数曲线，但没有标任何具体的时间戳或 benchmark 数据。曲线形状本身传达了 "加速" 的信息。

## 资产类型 4：案例锚点 — 第三方证据的内容准备

案例锚点（Case Anchor）是 deck 中最有力的证据。但它们有三个特殊要求：

### 案例选择的三个标准

1. **第三方验证**（参见 第三方验证原则）：案例的真实性和可信度来自独立的第三方验证。公司自报的 claims 不构成有效证据。
2. **可感知的具体性**：案例必须有具体的、可感知的细节。不是 "Company X improved efficiency" 而是 "NVIDIA Omniverse + Foxconn：数字孪生将产线调试从数周压缩到数天"。
3. **与 claim 的直接关联**：案例必须精确对应它要支撑的那张 concept slide。如果 concept 讲 "discovery-driven growth"，案例必须展示 "discovery → growth" 的因果链。

### 案例锚点的内容卡片

为每个案例准备一张简短的内容卡片：

```markdown
**Company**: [Name]
**What they do**: [One sentence]
**Key number**: [One memorable magnitude]
**Why it matters**: [Connection to our formula]
**Source**: [Where this information comes from]
```

T10 四个案例的内容准备：
- **Fastenal**：Vending machine data → 80 万+ SKUs → "embedded physical presence = data moat"
- **Foxconn**：NVIDIA Omniverse + AI vision → defect prevention → "AI turns inspection into prevention"
- **MISUMI**：Config-to-quote from 3 days to 3 minutes → "speed makes price secondary"
- **Jabil**：Internal AI upskilling program → "从 200 到 2,000 AI-literate employees"

### 案例在 slide 上的最少信息量

案例 slide 不是 deep dive——它是 evidence anchor。一张案例 slide 只需要：
1. Company logo 或 name
2. 一个核心数字/幅度
3. 一个因果箭头（他们做了什么 → 产生了什么结果）
4. 一句 "why it matters"（用我们的公式框架解释）

不要讲公司历史、产品线、组织架构——那些是 Wikipedia 的内容，不是 evidence 的内容。

---

> **Next**: `05-iterate-with-version-discipline.md` — 所有内容准备好了之后，怎么进行版本化迭代：什么时候砍、什么时候加、什么时候重构。
