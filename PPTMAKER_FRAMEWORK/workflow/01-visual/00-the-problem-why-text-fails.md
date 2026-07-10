---
title: '00 — The Problem: 为什么文字描述风格必然失败'
stage: workflow/01-visual
position: 01 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/01-visual/README.md
feeds_into:
- workflow/01-visual/01-gather-product-context-dna.md
agent_action: internalize
---

# 00 — The Problem: 为什么文字描述风格必然失败

> 起源故事。读这个来理解 WHY the style master approach exists，以及为什么创建一张 visual style guide image 的额外工作是值得的。

---

**Navigation**: ← `README.md` | Next → `01-gather-product-context-dna.md`

---

## 原始方案（以及为什么它如此痛苦）

在 Style Anchoring 出现之前，标准做法是 **text-based "style passport"（文字风格护照）**——写一段简短的文字来描述视觉风格，然后贴进每一个 page prompt。像这样（来自真实项目的例子）：

```
Use a calm pharmaceutical executive-review style: warm white canvas,
graphite text, deep teal for positive/control signals, amber for watch
items, coral red for risk. Use the same top-left kicker and large claim
headline on every slide.
```

这就是当时的 state of the art。它有时能工作——但以四种特定的、系统性的方式失败，使得制作视觉一致的 deck 极其疲惫。

## 四个失败模式

### 1. Color Names Are Ambiguous（颜色名天生模糊）

"Deep teal." "Coral red." "Amber." "Steel blue."

每个 image generation model 对这些名字的解读都不一样。一次生成的 "deep teal" 是另一次生成的 forest green。一次生成的 "coral red" 是粉色；下一次是橙色。

即使你加上 hex code（`#0d9488`），问题依然存在——模型看到 hex code 作为文字，但它没有 **看到** 这个颜色与其他 palette 颜色在上下文中的关系。一个 hex code 本身无法传达这个颜色与它的邻居如何相处。

**结果**：Palette 从一页漂移到另一页。到第 15 页，在 slide 1 上是 teal 的 accent color 已经变成了浑浊的蓝绿色。整份 deck 看起来像是从不同 presentation 拼凑出来的。

### 2. Typography Scale Is Impossible To Describe（字体层级无法用文字描述）

"Large headline." "Small label." "Oversized KPI number."

这些都是相对形容词。"Large" 相对于什么？标题占 slide 高度的 20%？30%？正文是标题的一半大，还是四分之一？

模型靠猜。有时 headline 是 body text 的 2 倍，有时是 5 倍。有时 KPI number 主宰整个 slide；有时它只比 supporting label 大一点点。

再多的文字调整也修不好这个问题，因为**文字无法编码绝对的空间关系。**

**结果**：Typography hierarchy 在 slides 之间不一致。观众潜意识里觉得 deck "乱七八糟"，即使他们说不清为什么。

### 3. Spatial Relationships Are Vague（空间关系模糊）

"KPI cards on the left." "A flow diagram in the center." "A comparison layout with two columns."

这些短语说了什么放在哪里——但对以下内容只字不提：
- Card border style（实线？发光？圆角？）
- Shadow depth（扁平？微妙？戏剧性？）
- Internal padding 和 label placement
- Column proportions（50/50？60/40？70/30？）
- Arrow style、node shape、connector thickness（对 flow diagram 而言）

模型每次都从它的 training data 中发明这些细节。两个连续 slide 都用 "KPI cards on the left"，看起来可能完全不一样。

**结果**：Component styling 是逐页的。Deck 无法形成 visual vocabulary。

### 4. Independent Generation = Inconsistent Deck（独立生成 = 不一致的 Deck）

每一次 image generation 都是模型的独立 roll。即使**完全相同的** text prompt，stochasticity 也会产生视觉上不同的页面。两个 title slide 从同一个 text prompt 生成，title positioning 可能不同，color saturation 可能不同，decorative elements 可能不同。

这不是 bug——这是 generative model 的固有特性。但这意味着 text-based style passport 永远无法产出每一页都感觉属于同一个 visual system 的 deck。

## The "Tweak Loop"（死循环）

这四个失败模式组合成一个痛苦的循环：

```
1. Generate slides
2. Review: "Slide 7 的 teal 太绿了"
3. 调整文字描述: "用更蓝一点的 teal，接近 #0d9488"
4. Regenerate slide 7
5. Review: "现在 headline 太小了"
6. 调整文字描述: "Make the headline larger, dominant"
7. Regenerate slide 7
8. Review: "现在颜色对了但 layout 偏移到了左边"
9. 循环直到精疲力竭
```

这个循环每页可以消耗**数小时**，而且永远不会真正收敛，因为 text description 始终只是 visual intent 的近似。每一次修复都可能打破别的东西。

这不是假设场景。这个循环在生产中直接经历过——在 `talk_sales_office_ai_agent` 项目上，投入了大量精力通过纯文字定义 "micro-control" visual parameters，结果令人沮丧。2026 年 5 月 26 日用户的原话：

> "控制风格一致这里非常麻烦，需要反复调整。。。很累"

## 打破循环的洞察

GPT Image 2 有一个关键能力：它是 **multimodal**——可以处理 reference images 作为输入。通过 `image_urls` 传入一张图，模型**看到**这张图。它处理 visual features——颜色、空间关系、字体比例——并能在生成的输出中复现它们。

洞察：**SHOW the style, don't DESCRIBE it.**

不要写 "deep navy #0a1628, steel blue #1e3a5f, cyan accents, large bold headlines, KPI cards with dark panels and oversized numbers…" 然后祈祷模型每次都一致地解读这些文字——**创建一张图，视觉化地展示整个 style system。** 然后把这张图作为 reference 传入每一页 slide generation。

这就是 **Style Anchoring**。

## 为什么 Visual Anchoring 更好

| Aspect | Text Description | Style Master Image |
|--------|-----------------|-------------------|
| **Color** | 模型从颜色名 + hex code 猜测。没有与邻居颜色的上下文。 | 模型看到确切的 swatch、它的 hex code label，以及它与 palette 中其他颜色的关系 |
| **Typography** | 相对形容词（"large", "small"），没有绝对参考 | 模型看到 headline、subtitle、body、KPI 之间实际的大小比例——视觉化地学习 hierarchy |
| **Layout** | 抽象词汇（"KPI cards on the left"），没有空间细节 | 模型看到 card borders、shadows、corner radius、label placement、internal padding——全在一张参考图里 |
| **Components** | "Flow diagram"——无限种可能解读 | 模型看到确切的 arrow style、node shape、connector thickness、color coding |
| **Consistency** | 每一页独立解读文字——必然漂移 | 每一页校准到同一张 visual reference——收敛，而非漂移 |

## The Anchoring Clause（锚定条款）

当 Stage 2 生图脚本用 style reference 生成 slides 时，它会自动把这段话追加到每个 page prompt 中：

```
Use the reference image(s) as your EXACT visual style guide.
Match the color palette, typography scale, layout grid, component patterns,
and overall visual language precisely. The reference defines the deck's design
system — do not deviate from it. Only change the slide content, not the style.
```

这段话是关键中的关键。它告诉模型：reference image 是权威的——match what it sees, don't improvise。没有它，模型可能把 style master 当成 "inspiration" 而不是 contract。

## The Analogy（类比）

Style master 之于 slide deck，如同 **Pantone swatch book** 之于印刷厂。

印刷工人不会根据文字描述来匹配 "warm red"。他们匹配 PANTONE 186 C——一个特定的、经过校准的 visual reference。Swatch book 是一个 **visual calibration target**，消除了歧义。

Style master 对 image generation 起同样的作用。模型看到它，匹配它，每一页校准到同一个 reference。No guessing. No drift. One visual truth.

---

> **Next**: `01-gather-product-context-dna.md` — 在设计 visual system 之前，你需要 raw material。如何研究 product、audience 和 industry，构建一个感觉 authentic 的 visual vocabulary。
