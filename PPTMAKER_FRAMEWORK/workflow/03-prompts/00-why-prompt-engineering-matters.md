---
title: 00 — Why Image Prompt Engineering Matters
stage: workflow/03-prompts
position: 01 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/03-prompts/README.md
feeds_into:
- workflow/03-prompts/01-understanding-the-model.md
agent_action: internalize
---

# 00 — Why Image Prompt Engineering Matters

← [README](README.md) | [Next →](01-understanding-the-model.md)

## Text prompt ≠ Image prompt

如果你能写好 ChatGPT prompt，恭喜你——但这和写好 image generation prompt 是两码事。

**文本 prompt 的 challenge**：让模型理解你想要什么信息、什么格式、什么 tone。你用的是语言——模型也是用语言回应。

**图片 prompt 的 challenge**：让模型在 2D 空间里精确放置元素。你说 "a KPI card on the left"——模型要决定：左到什么程度？多大的 card？什么颜色？什么 border style？有没有 shadow？KPI 数字多大？label 放在数字上面还是下面？

你说的话和模型要做的事之间，隔着一个**从语言到空间的翻译层**。好的 prompt engineering 让这个翻译层尽可能薄。

## 四个常见失败模式

### 1. 模糊描述 → 不可预测的输出

❌ "A professional slide about AI strategy" — model 可以给你任何东西：蓝色科技感、白色极简、紫色渐变...没有两个输出是相似的。

✅ "16:9 slide. Dark navy background (#0a1628). Title 'AI Redefines the Supply Chain' in large white sans-serif at top-left. Two panels below..."

### 2. 遗漏布局信息 → 元素随机放置

❌ "Show a KPI of 100,000 SKUs, a growth arrow, and a customer logo" — model 可以把这三样东西放在任何位置：KPI 在中间 logo 在角落、或者 logo 在中间 KPI 被挤到边上...

✅ "Left panel: KPI '100,000+' at 72px visual, with 'SKUs Managed' label below. Right panel: growth arrow (cyan, upward). Bottom-right: Fastenal logo, small."

### 3. 颜色没有语义 → 混乱的视觉叙事

❌ "Use blue and green" — 每种颜色在表达什么？blue = background？blue = highlight？green = positive？model 不知道。

✅ "Cyan (#00b4d8) = positive outcomes/customer wins. Electric blue (#0077b6) = manufacturing strengths/attention. Steel blue (#6b8ca3) = structural panels/neutral information. Never use warm tones (amber, red, orange)."

### 4. 忘记说 "不要什么" → 模型填充它猜的东西

Model 会尝试 "完成" 你的画面——如果你没说不要 stock photo people，它可能加一些。如果你没说不要 logos，它可能加一个随机的。如果你没说不要 gradient orb decorations，它可能觉得 "好看" 就加上。

✅ 每个 prompt 都应该有 ANTI-PATTERNS 段落：明确列出不要渲染什么。

## 好的 image prompt 长什么样

一个生产级 image prompt 有这些段落：

1. **Layout overview** — 宏观分区，y 坐标范围
2. **Zone descriptions** — 每个区域的精确内容
3. **Color semantics** — 每个颜色的叙事含义
4. **Text content** — 画面中出现的所有文字（精确 wording）
5. **Anti-patterns** — 明确禁止

后续文件教你每个段落怎么写。

---

> **Next**: `01-understanding-the-model.md`
