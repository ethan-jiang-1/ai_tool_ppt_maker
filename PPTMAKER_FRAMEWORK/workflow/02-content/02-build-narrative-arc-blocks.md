---
title: 02 — Build Narrative Arcs into Blocks
stage: workflow/02-content
position: 03 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/02-content/README.md
- workflow/02-content/01-find-the-core-metaphor-and-formula.md
feeds_into:
- workflow/02-content/03-specify-slides-multi-layer.md
agent_action: ask_questions
---

# 02 — Build Narrative Arcs into Blocks

← [01](01-find-the-core-metaphor-and-formula.md) | [Next →](03-specify-slides-multi-layer.md)

## 从公式到 slide 序列

有了核心隐喻和公式之后，你需要把它们翻译成 slide 序列。但不要直接跳到 "Slide 1: X, Slide 2: Y"。中间缺了一步：**Block 设计**。

Block 是按叙事目的分组的 slide 集合。每个 Block 回答观众在这个旅程阶段的一个核心问题。Block 内部的 slide 按论证逻辑排序——通常是概念→证据的交替节奏。

## 什么是 Block（以及为什么需要它）

Block 是 deck 的叙事单元——比单张 slide 大，比整份 deck 小。一个 Block 通常包含 3-7 张 slide。

Block 的作用：
1. **给观众一个 mental checkpoint**。观众不需要记住每张 slide 的细节，只需要记住 "刚才那个部分讲的是外部压力"。
2. **让设计决策有上下文**。当你问 "这张 slide 该不该存在？"，答案取决于它服务于哪个 Block 的什么论证目的。
3. **控制叙事节奏**。Block 之间的过渡是节奏变化点——从 urgency 到 solution，从 theory 到 evidence，从 diagnosis 到 action。

### 案例：T10 项目的 Block 设计

| Block | 主题 | Slides | 回答的问题 | 论证功能 |
|-------|------|--------|-----------|---------|
| 1 | External Trigger | 01-04 | "为什么是现在？" | 建立 urgency — AI 改变了供应商选择规则 |
| 2 | Diagnosis | 05-06 | "你怎么知道这是真的？" | 外部 deadline + evidence："shift 已经在发生" |
| 3 | Data Directions | 07-13 | "数据怎么办？" | 回应公式前半段 Readable Data：三个方向 + 案例锚点 |
| 4 | Organization | 14-17 | "谁来执行？" | 回应公式后半段 Managed Agents：技能、习惯、组织变革 + 案例 |
| 5 | Risk + Close | 18-19 | "风险和下一步？" | 诚实建立信任 + 行动号召回到隐喻 |

注意这个叙事弧的 shape：不是平铺直叙的 "A→B→C→D→E"，而是 **urgency → diagnosis → solution (with evidence) → people (with evidence) → honest risk → action**。观众的情感曲线跟着叙事走：关注 → 焦虑 → 理解 → 认同 → 信任 → 行动。

## 设计 Block 的五个步骤

### Step 1：列出观众需要接受的命题

核心公式是你的结论——但你不可能在 slide 1 就抛出结论（观众还没准备好接受它）。你需要先让观众接受一系列中间命题。

以 T10 公式 "Readable Data + Managed Agents = AI Adoption" 为例。观众需要依次接受：
1. AI 不只是效率工具——它正在改变客户怎么找到和选择供应商（否则没有 urgency）
2. 这种改变不是未来的事——它现在正在发生（否则可以再等等）
3. 应对这种改变的关键是 "Readable Data"——让制造数据可被机器消费（否则不需要行动）
4. 三个方向各有成功案例——不是空想（否则不可信）
5. 但数据不够——还需要 "Managed Agents"：组织能驾驭 AI（否则只有技术没有执行）
6. 这需要组织变革——技能、习惯、治理（否则只是口号）
7. 风险真实存在——但可以管理（否则不敢行动）
8. 行动有具体起点——不需要一步到位（否则 overwhelmed）

这 8 个命题就是 8 个论证步骤。每个步骤可能需要 1-4 张 slide 来支撑。

### Step 2：按叙事目的分组

把这 8 个命题按 "观众在这个阶段需要什么" 分组：

- 命题 1（urgency）→ Block 1 "External Trigger"
- 命题 2（evidence of change）→ Block 2 "Diagnosis"
- 命题 3-4（data directions + cases）→ Block 3 "Data Directions"
- 命题 5-6（people and organization）→ Block 4 "Organization"
- 命题 7-8（risk and action）→ Block 5 "Risk + Close"

分组的原则：**每个 Block 内的 slide 共享同一个叙事目的。** 如果一张 slide 和同 Block 的其他 slide 叙事目的不同，它可能属于另一个 Block——或者根本就不该存在。

### Step 3：给每个 Block 一个 "叙事问题"

每个 Block 应该回答一个观众会自然问出的问题：

- Block 1 回答："Why should I care about AI now?"
- Block 2 回答："Is this really happening, or is it just hype?"
- Block 3 回答："What specifically should we do with our data?"
- Block 4 回答："Who will do this work — and how?"
- Block 5 回答："What's the risk? Where do we start?"

如果你的 Block 没有一个清晰的问题来回答，那你的 Block 可能不是真正的 Block——它只是一堆 topic-related slides。

### Step 4：在每个 Block 内设计概念→证据节奏

在 Block 内部，slides 不是并列的——它们形成 **概念→证据** 的交替：

**Block 3（Data Directions）的 slide 序列**：
```
Slide 07 (Bridge/Divider)     ← 叙事转折："Manufacturing DNA, Digitized"
Slide 08 (Concept: Growth)    ← 方向 1："Your data finds tomorrow's customers"
Slide 09 (Evidence: Fastenal) ← 案例："从 0 到 80 万 SKU 的 vending 数据"
Slide 10 (Concept: Efficiency)← 方向 2："From detect to prevent"
Slide 11 (Evidence: Foxconn)  ← 案例："AI 视觉检测 + NVIDIA Omniverse"
Slide 12 (Concept: CX)        ← 方向 3："Speed is the new quality"
Slide 13 (Evidence: MISUMI)   ← 案例："从 3 天到 3 分钟的 config-to-quote"
```

每张概念 slide 提出一个方向；每张证据 slide 用真实案例证明这个方向可行。这个节奏让观众在 "理解新概念" 和 "看到真实证据" 之间交替，保持新鲜感和可信度。

**不需要每张概念 slide 都跟证据**——但要在 Block 层面保证 evidence 的存在。你可以在一个 Block 中 2 张概念配 1 张综合证据，或者 1 张概念配 2 张多角度证据。关键是：**观众不会在听完 claim 之后没有 proof 就进入下一个 Block。**

### Step 5：利用 Block 边界设计叙事转折

Block 之间的过渡是叙事转折点。观众需要被明确告知 "我们正在换挡"。

在 T10 案例中，用 **slide type 变化** 来标记 Block 边界：
- Block 1 → Block 2：Slide 04（procurement workflow）自然过渡到 Slide 05（clock/deadlines），不显式停顿
- Block 2 → Block 3：Slide 07（full-page bridge page）——全屏视觉效果，明确宣告 "现在进入核心：Manufacturing DNA, Digitized"
- Block 3 → Block 4：Slide 14（pivot page）——从 "Data" 翻到 "People"，问 "谁来做这一切？"
- Block 4 → Block 5：Slide 18（risk page）——坦诚的 tone shift，从 "你应该行动" 变成 "你要知道风险再行动"

**Section divider slides 是值得投资的。** 不要跳过它们。它们让观众的大脑 reset——"上一部分结束了，新部分开始了"。没有 divider 的 deck 像没有标点的段落，观众会迷失在哪张 slide 属于哪个主题。

## Block 大小的经验法则

| Block 类型 | 建议 slide 数 | 说明 |
|-----------|-------------|------|
| Trigger/Urgency | 3-4 | 需要建立 context + 展示 tension + 给出 evidence。太短观众感受不到 urgency；太长变成恐吓 |
| Diagnosis | 2-3 | 回答 "你怎么知道"。1 张 slide 显得证据不足；3 张以上变成 data dump |
| Solution/Directions | 5-7 | 这是 deck 的主体。需要展开各个方向并配合证据。用概念→证据→概念→证据节奏 |
| People/Organization | 3-4 | 从技术转换到人。需要 show change path + 1 个组织案例。不要太长——观众是决策者，不是 HR |
| Risk + Close | 2-3 | 诚实（建立信任）+ 行动号召（给出口）。不要太短（显得草率），不要太长（消耗行动 momentum） |
| **总计** | **15-21** | 适合 35-45 分钟的 keynote |

**如果你发现一个 Block 超过 7 张 slide**：你可能把两个 Block 混在一起了。检查这个 Block 内部是否存在两个不同的叙事目的——如果有，拆成两个 Block。

**如果你发现一个 Block 只有 1 张 slide**：这张 slide 可能是一个 divider/transition，不属于独立 Block。

## 反模式

### 1. "Coverage" Block

"我们需要覆盖市场趋势、竞争格局和客户洞察"——于是你建了一个叫 "Market Context" 的 Block，塞了 8 张 slide。这不是 Block，是 category dump。每张 slide 都是一个独立的信息碎片，没有论证推力。

**修复**：问 "这些信息在论证中承担什么功能？" 如果 "市场趋势" 服务于建立 urgency，它应该在 Trigger Block 里。如果 "竞争格局" 服务于展示 gap，它应该在 Diagnosis Block 里。不要用 "topic" 作为分组依据——用 "argument function"。

### 2. "Evidence-Free" Block

你有一个叫 "Our Solution" 的 Block，讲了 5 个产品功能和 3 个优势。但一张 evidence slide 都没有。观众听完觉得 "你在推销"，而不是 "你在说服"。

**修复**：每个 solution Block 至少需要 1 张 evidence slide。它可以是客户案例、行业数据、第三方验证——任何不是你自己说的东西。记住记忆系统中的 第三方验证原则 principle：自报家门的话 weight 低，第三方独立验证才有说服力。

### 3. "Orphan at the End" 

Block 5 "Conclusion" 只有一张 "Thank You" slide。你整个 deck 的论证 ending 是一个 2 秒的 logo 页。

**修复**：Conclusion 应该是一个完整的 Block——recap key tension、acknowledge risk、给出清晰的下一步。不要用 "Thank You" 浪费 deck 中最重要的 recency effect。

### 4. "No Transition" 

Block 之间直接跳。上一个 Block 最后一张 slide 在讲数据策略，下一个 Block 第一张 slide 突然在讲员工培训。观众在困惑中度过前 30 秒。

**修复**：在 major Block 之间插入 divider/pivot slides。它们不需要很多文字——有时一段强有力的视觉 + 一句话就够了。但它们的存在让叙事呼吸。

## 产出物：Block Map

在进入下一阶段前，你应该有一个 Block Map，包含：

```
Block 1: [名称]
  叙事问题: [这个 Block 回答的问题]
  Slides: [数量]
  论证功能: [在整体叙事中的作用]

Block 2: [名称]
  ...

Block N: [名称]
  ...
```

这个 Block Map 是接下来 slide-by-slide 规格化的蓝图。值得在开始写具体 slide 之前，先检查 Block Map 的叙事完整性：
- 每个 Block 有没有清晰的问题？
- Block 之间有没有逻辑递进（不是简单的并列）？
- 有没有 Block 过于庞大或过于单薄？
- 概念和证据的分布是否平衡？

---

> **Next**: `03-specify-slides-multi-layer.md` — 有了 Block Map 之后，怎么为每张 slide 写四层精确规格。
