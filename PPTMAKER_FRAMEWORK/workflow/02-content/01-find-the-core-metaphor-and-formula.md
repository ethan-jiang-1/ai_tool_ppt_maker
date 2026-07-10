---
title: 01 — Find the Core Metaphor and Formula
stage: workflow/02-content
position: 02 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/02-content/README.md
- workflow/02-content/00-the-problem-why-slide-count-fails.md
feeds_into:
- workflow/02-content/02-build-narrative-arc-blocks.md
agent_action: ask_questions
---

# 01 — Find the Core Metaphor and Formula

← [00](00-the-problem-why-slide-count-fails.md) | [Next →](02-build-narrative-arc-blocks.md)

## 叙事需要地基

如果你只有 30 秒向一个陌生人解释你的 deck 在讲什么，你会说什么？

你说的那两句话，就是你的**核心隐喻**和**核心公式**。它们是整份 deck 的叙事地基——一切都建立在它们之上，一切都在论证它们。

如果地基不稳，后面所有的 slide 都在松软的沙子上盖楼。

## 核心隐喻：给观众一个 mental model

### 什么是核心隐喻

核心隐喻不是 tagline，不是 slogan，不是一个 clever phrase。它是一个 **conceptual anchor**——帮助观众把复杂、抽象的信息组织起来的 mental model。

好的隐喻满足三个条件：
1. **可感知**：观众能立刻在脑子里"看到"它。不是抽象概念，而是具体意象。
2. **有 tension**：它隐含了一个 gap 或冲突——"目前的状况"和"应该的状况"之间的差距。
3. **可延展**：它足够大，能承载整个 deck 的论证。每张 slide 都在丰富这个隐喻，而不是用完就扔。

### 案例：T10 项目的 "Two Languages"

> "你的产品其实在说两种语言。一种是物理制造语言——图纸上的公差、卡尺上的读数、老师傅的手感——你说了 50 年，说得极其流利。另一种是数据结构语言——结构化属性、可查询 API、自动匹配——你的客户 AI 系统在听这种语言。大多数工厂还只会说第一种。"

这个隐喻为什么有效：
- **可感知**：你能立刻"看到"一个金属零件，旁边是一张数据卡。物理世界和数据世界的并置。
- **有 tension**：你会说的语言和别人在听的语言不一样——这是真实的沟通障碍，不是矫情的修辞。
- **可延展**：整个 deck 都在讲"怎么学会第二种语言"——Readable Data 就是词汇，Managed Agents 就是语法，AI Adoption 就是流利表达。

### 怎么找到你的核心隐喻

**Step 1：找到核心 tension。** 问三个问题：
1. 你的 audience 目前相信什么（但其实是错的或不完整的）？
2. 如果这个 belief 不改变，会发生什么（具体、可感知的后果）？
3. 改变这个 belief 需要跨越的 gap 是什么？

**Step 2：为这个 tension 找一个具体的、可感知的意象。**
- 如果 tension 是 "品牌在内部比在外部清楚"，隐喻可能是 "Jewel inside a locked box"
- 如果 tension 是 "数据很多但无法用"，隐喻可能是 "Library with no catalog"
- 如果 tension 是 "产品质量好但客户不知道"，隐喻可能是 "Whispering in a stadium"

**Step 3：测试隐喻。** 用这三个问题检验：
- 一个完全不熟悉你行业的人，能立刻在脑海里"看到"这个隐喻吗？
- 这个隐喻隐含的 gap 是否足够 urgent？(如果不是，你需要更强的 tension)
- 你能用这个隐喻来解释接下来 15-20 张 slide 的内容吗？(如果不能，隐喻不够大)

### 不同行业的隐喻类型

| 行业 | 常见 tension | 隐喻方向 | 例子 |
|------|-------------|---------|------|
| Manufacturing | 物理世界 vs 数字世界的 disconnect | 双世界并置 | "Two Languages", "The Factory Speaks, The Data Listens" |
| SaaS | 产品能力 vs 客户认知的 gap | 可见性/发现 | "Jewel in a Locked Box", "Built It, They Didn't Come" |
| Pharma/Healthcare | 科学证据 vs 市场信任的距离 | 翻译/桥接 | "From Lab to Life", "The Evidence Gap" |
| Financial Services | 复杂工具 vs 简单需求的不匹配 | 简化的力量 | "The Swiss Army Knife Problem" |
| Education | 知识存在 vs 知识传递的断裂 | 通道/管道 | "The Last Mile", "From Syllabus to Skill" |
| Consumer | 产品功能 vs 用户情感的不对称 | 故事/叙事 | "Features Tell, Stories Sell" |

### 反模式：隐喻的四种死法

1. **太 cute**："AI is like a unicorn"——听起来有趣但没有 tension，无法延展。cute wears off after slide 3。
2. **太 vague**："Digital transformation"——没有意象，只是把话题换了个词。这不是隐喻，是 jargon。
3. **太复杂**："The quantum entanglement of supply and demand in an AI-mediated procurement ecosystem"——观众在分析隐喻，而不是理解你的论点。
4. **没有 tension**："We make good products"——这不是隐喻，这是陈述事实。隐喻必须包含 gap。

**好隐喻的试金石**：你能用它来回答 "Why should I care?" 吗？如果能，你有了一个隐喻。如果不能，你只有一句口号。

## 核心公式：表达你的可证伪命题

### 什么是核心公式

核心公式是一句话，表达了你的 deck 要论证的核心命题。它必须是**可证伪的**——如果有人能证明它错了，你的 deck 就失去了存在理由。

公式通常涉及 2-3 个变量，表达它们之间的因果关系。形式是：

> **Variable A + Variable B = Outcome C**

或者更复杂的变体：
> **Without X, Y cannot happen — regardless of Z**

### 案例：T10 项目的公式

> **Readable Data + Managed Agents = AI Adoption**

- Readable Data：你的制造数据能不能被机器消费？（结构化属性、可查询 API、标准化格式）
- Managed Agents：你的组织能不能驾驭 AI 代理？（技能、习惯、治理、信任）
- AI Adoption：客户能不能在你的数据中找到你、信任你、与你交易？

这个公式是可证伪的。如果有人能证明：(a) 即使数据不可读也能实现 AI 采购匹配，或者 (b) 即使没有 AI 也能获得下一代采购商的青睐，或者 (c) Readable Data 和 Managed Agents 不是 AI Adoption 的充分条件——那么整个 deck 的论证就失败了。

正因为它是可证伪的，它才有论证力。一个不可证伪的公式（"AI is important for business"）不是公式，是废话。

### 怎么推导你的核心公式

**Step 1：识别 outcome。** 你的 audience 最终想要什么？用具体、可衡量的词表达。
- Bad: "Success" (太 vague)
- Good: "AI Adoption" (可以被观察)
- Better: "Being discoverable, evaluable, and selectable by AI-powered procurement systems" (可以被验证)

**Step 2：分解 contributing factors。** 如果要达到这个 outcome，哪 2-3 个条件是必要且充分的？
- 必要条件：没有它 outcome 就达不到
- 充分条件：有了这些条件 outcome 就能达到

**Step 3：写成等式。** 用 + 连接必要条件，用 = 连接 outcome。如果逻辑更复杂，可以用 if/then 或 without/then not 的结构。

**Step 4：测试公式。** 
- 能证伪吗？(想象一个场景让公式不成立——如果能想象到，说明公式是可证伪的)
- 观众能在 5 秒内理解吗？(如果不行，公式太复杂)
- 能在每张 slide 中追溯到这个公式吗？(每张 slide 都在论证公式的一部分)

### 不同场景的公式类型

| 场景 | 公式结构 | 例子 |
|------|---------|------|
| 战略建议 | A + B = C | "Readable Data + Managed Agents = AI Adoption" |
| 产品 launch | Without X, Y cannot Z | "Without embedded intelligence, sensors cannot prevent failures — they can only report them" |
| 投资论证 | X > Y → Z | "When switching cost > integration cost, platform plays win" |
| 组织变革 | Old → New, via X | "From tribal knowledge → codified intelligence, via AI-assisted documentation" |
| 竞争定位 | They do X, we do Y → different outcome | "They optimize for cost; we optimize for discoverability — and discoverability is the new cost" |

### 反模式：公式的三种死法

1. **不可证伪**："Innovation drives growth"——这永远是 true，也永远 useless。它不帮你决定什么要做、什么不要做。
2. **变量太多**："A + B + C + D + E + F = G"——观众记不住三个以上的变量。如果你的公式有五个加号，你其实还没有想清楚。
3. **变量不是独立的**："Data + Information + Insights = Value"——Data、Information、Insights 是同一个东西的不同层级，不是独立变量。公式变成同义反复。

## 隐喻和公式的关系

隐喻是 **what it feels like**（让观众感知到问题）。
公式是 **what it means**（让观众理解答案）。

隐喻让公式有情感 force。公式让隐喻有逻辑 rigor。

在 T10 案例中：
- "Two Languages" 隐喻让观众**感受到**那种"你在说一种语言，客户在听另一种"的焦虑和 urgency。
- "Readable Data + Managed Agents = AI Adoption" 公式让观众**理解到**这不是一个 vague 的 "embrace AI" 呼吁，而是一个具体的、可操作的诊断框架。

两者合在一起，决定了整个 deck 的叙事结构：
- Block 1-2 展开隐喻（建立 tension）
- Block 3 论证公式的后半段（Readable Data → 三个方向 + 案例）
- Block 4 论证公式的后半段（Managed Agents → 技能、习惯、组织 + 案例）
- Block 5 回到隐喻（"他们开始了——从一个起点"），用行动号召收尾

## 产出物

在进入下一阶段前，你应该有：
1. **一句核心隐喻**（5-25 字）：一个具体的、可感知的意象，暗示核心 tension
2. **一句核心公式**（A + B = C 结构）：可证伪的命题
3. **一段关系陈述**（3-5 句）：解释隐喻和公式如何一起工作

这三个元素是接下来所有内容的锚点。如果隐喻或公式变了，整份 deck 都要跟着变——所以值得花时间把它们做对。

---

> **Next**: `02-build-narrative-arc-blocks.md` — 有了地基之后，怎么把 slide 组织成有论证力的叙事弧和 Block 结构。
