---
title: '00 — The Problem: Why Starting With Slide Count Fails'
stage: workflow/02-content
position: 01 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/02-content/README.md
feeds_into:
- workflow/02-content/01-find-the-core-metaphor-and-formula.md
agent_action: internalize
---

# 00 — The Problem: Why Starting With Slide Count Fails

← [README](README.md) | [Next →](01-find-the-core-metaphor-and-formula.md)

## 最常见的起点，也是错的

几乎所有 presentation 的起点都是这样的：

> "I need a 20-slide deck about our AI strategy."
> "We have 40 minutes. How many slides should that be?"
> "The template has 15 slides — let's fill them."

这听起来很合理。时间有限，slide 是容器，先定容器数量再填内容。问题是：**slide 不是容器。**

当你把 slide 当作容器，你会做什么？你会开始往里面塞东西。这张 slide 放"市场趋势"，那张 slide 放"我们的优势"，再来一张放"竞争对手"……很快你发现有些 slide 内容太薄（filler slides），有些 slide 内容太厚（需要拆成两张但不知道拆在哪），整体缺乏一条有说服力的论证线。

## 四个系统性失败模式

### 失败 1：Filler Slides — 为了凑数而存在的 slide

当你先定 "20 张 slide" 但只有 14 张 slide 的实质性内容时，你会怎么做？你会造出 6 张 filler slides：
- 多放几张"市场背景"（但其实 1 张就够了）
- 加一张 "Agenda"（没人会回头看它）
- 用 "About Us" 填充（audience 已经知道你是谁）

Filler slides 的问题不在于它们浪费了 2 分钟——而在于**它们稀释了论证**。每张 filler slide 都是观众注意力的一次损耗。当真正重要的 slide 到来时，观众已经习惯性走神了。

### 失败 2：No Coherence — slide 之间没有论证关系

当你逐张填充 slide 时，你不会问 "Slide 7 和 Slide 8 之间是什么论证关系？"——你只会问 "Slide 7 的内容是什么？Slide 8 的内容是什么？"

结果是：slide 是**并列的**而非**递进的**。观众看到的是 20 个独立的信息块，而不是一条完整的论证链。典型的症状：你可以任意交换 slide 9 和 slide 12 的位置，叙事不受影响——这说明没有真正的叙事结构。

### 失败 3：Orphan Slides — 不属于任何叙事组的孤页

有些 slide 单独看很好，但你不确定它该放在哪里。它似乎和几个地方都有关联，但又不完全属于任何一个 Block。于是你随便找个地方塞进去。

结果是：观众在这个 slide 上感到困惑。"为什么突然讲这个？" 他们不是不同意 slide 上的内容，而是不理解它在论证中的位置。一张 orphan slide 的破坏力超过三张无聊的 slide——它让叙事断线。

### 失败 4：No Evidence Rhythm — 只有 claim 没有 proof

如果你按 "需要覆盖的主题" 来分配 slide，你很可能得到一连串的 claim slides："AI is important" → "Data is valuable" → "We should act now"。每张 slide 都在说"是什么"，但没有一张 slide 在说"你怎么知道"。

好的叙事需要**证据节奏**：每个重要的 claim 后面跟一个 proof。这是亚里士多德在《修辞学》里就讲清楚的——logos（逻辑论证）需要 pathos（情感共鸣）和 ethos（信度背书）。在 business deck 里，case study、数据点、客户引述、行业趋势数据就是你的 ethos。

## 替代方案：叙事优先

如果你不从 slide 数量开始，你从哪里开始？

从**核心隐喻**和**核心公式**开始：

- **核心隐喻**（Core Metaphor）：用一句话让观众理解你在讲什么。它不是 tagline，而是一个 conceptual anchor——一个帮助观众把复杂信息组织起来的 mental model。
- **核心公式**（Core Formula）：用一句话表达你要论证的命题。它应该是可证伪的——如果它能被驳倒，你的 deck 就失败了。整个 deck 都是在论证这个公式成立。

有了隐喻和公式，slide 序列就自然浮现了：每一张 slide 都是论证这个公式的一个步骤。你不需要"想 20 张 slide"——你只需要问"要证明这个公式，观众需要依次接受哪几个命题？"

然后把这些 slide 按叙事目的分组为 **Block**——每个 Block 回答观众在旅程中的一个问题。Block 内部的 slide 形成**概念→证据**的交替节奏。

这就是本方法论接下来的内容：
- `01` — 怎么找到核心隐喻和公式
- `02` — 怎么构建 Block 和叙事弧
- `03` — 怎么为每张 slide 写多层精确规格
- `04` — 怎么准备内容资产（文案、视觉概念、数据）
- `05` — 怎么进行版本化迭代

## 一个案例：从 "20 slides about AI" 到叙事架构

> **「案例」**：以下是用 T10 项目（precision manufacturing AI strategy keynote）展示叙事优先方法在实际中如何运作。注意学的是**思路**——怎么从隐喻和公式推导 slide 序列——而不是这个案例的具体内容。

**错误起点**："我们有一个 40 分钟的 slot，按 2 分钟/slide 算，需要约 20 张 slide。主题是 AI + manufacturing + supply chain。"

如果用 slide-count-first 方法，你会列出一堆主题 slide：AI Overview、Industry 4.0、Digital Transformation、Data Strategy、Customer Experience、Operational Efficiency... 这些主题都对，但之间没有论证关系。观众听完会觉得 "AI 很重要" 但不知道为什么**现在**必须行动，更不知道为什么**他们**（而非别人）必须行动。

**叙事优先方法**：

1. 先找到核心隐喻：**"Two Languages"** — 物理制造语言（你说了 50 年，图纸、卡尺、经验直觉）；数据语言（客户 AI 系统在听，结构化属性、可查询 API、自动化匹配）。两者的 gap 是核心 tension。

2. 再找到核心公式：**Readable Data + Managed Agents = AI Adoption**。这个公式是可证伪的——如果有人能证明 Readable Data 不重要，或者 Managed Agents 不必要，整个论证就垮了。

3. 然后推导 slide 序列——不是"列出主题"，而是"列出观众需要接受哪些命题才能最终认同这个公式"：

   - Block 1（External Trigger）：先建立 urgency——AI 正在改变客户选择供应商的方式。没有 urgency，后面的解决方案没有动力。
   - Block 2（Diagnosis）：展示外部 deadline 和 evidence——这不是"未来趋势"，而是"现在已经在发生"。
   - Block 3（Data Directions）：回应 Readable Data 这个变量——三个方向（Growth/Efficiency/CX），每个方向都有一个 real-world case 作证据锚点。**概念→证据→概念→证据→概念→证据**的节奏。
   - Block 4（Organization）：回应 Managed Agents 这个变量——技能、习惯、组织变革。同样有 case evidence。
   - Block 5（Risk + Close）：诚实地承认风险（增强可信度），然后以行动号召收尾。

结果是 19 张 slide——不是 20 张，因为叙事推导不需要第 20 张。每一张 slide 都有明确的论证功能，没有 filler，没有 orphan，有清晰的证据节奏。

---

> **Next**: `01-find-the-core-metaphor-and-formula.md` — 怎么从一个模糊的话题中提炼出一个清晰的隐喻和一个可证伪的公式。
