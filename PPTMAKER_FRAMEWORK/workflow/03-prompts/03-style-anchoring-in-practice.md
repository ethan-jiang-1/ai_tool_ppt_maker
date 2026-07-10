---
title: 03 — Style Anchoring in Practice
stage: workflow/03-prompts
position: 04 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/03-prompts/README.md
- workflow/03-prompts/02-prompt-structure-and-patterns.md
feeds_into:
- workflow/03-prompts/04-iteration-and-debugging.md
agent_action: internalize
---

# 03 — Style Anchoring in Practice

← [02](02-prompt-structure-and-patterns.md) | [Next →](04-iteration-and-debugging.md)

## Style Anchoring 是什么

**用一张 reference image（style master）作为视觉锚点，让 model 在生成每张新 slide 时匹配它的颜色、字体、布局和组件样式。**

不是 "用文字描述风格"——文字描述每次渲染出来都不一样。而是 **show the style**——model 看到 reference image 上的颜色、字体大小关系、卡片风格、线条粗细，然后在新的画面中匹配这些属性。

> Style master 的创建方法论在 [workflow/01-visual](../workflow/01-visual/) 中完整展开。这里聚焦于 "怎么在 prompt 中使用 anchoring"。

## Anchoring Clause

每个 slide prompt 末尾附加这段文字。框架官方路径由 Stage 1 注入并以 `--prompt-is-final` 交给 Stage 2，保证磁盘上的 prompt 就是实发 prompt；skill 独立使用时仍可自动追加：

```
Use the reference image(s) as your EXACT visual style guide.
Match the color palette, typography scale, layout grid, component patterns,
and overall visual language precisely. The reference defines the deck's
design system — do not deviate from it. Only change the slide content, not the style.
```

同时，API 调用时把 `style_master.jpg` 作为 `image_urls` 参数传入。Model 同时接收 text prompt 和 reference image——它在两个模态之间 "校准" 视觉属性。

## Anchoring 有效的前提

1. **Style master 质量要高**：如果 style master 本身模糊、颜色不准、元素混乱，anchoring 只会放大这些问题
2. **Color palette 在 style master 上可见**：颜色必须作为 swatches 展示在 style master 上——model 需要 "看到" 颜色才能匹配
3. **Typography hierarchy 在 style master 上可见**：所有字体层级（Kicker → Title → Body → KPI → Label）必须在**同一个 frame** 中展示——model 学到的是**比例关系**，不是绝对像素值
4. **Layout grid 在 style master 上可见**：2-3 种 layout mode 的 wireframe 必须在 style master 上展示——model 看到 "左右分栏 + 顶部留空" 才能在新 slide 中复现

## Anchoring 可能失败的四种情况

| 情况 | 症状 | 修复 |
|------|------|------|
| Style master 质量差 | 所有 slides 颜色/布局都不对 | 回到 01，重新做 style master 的 review-iterate-lock |
| Content prompt 和 style 冲突 | 单张 slide 偏色或布局异常 | Content prompt 可能说了和 style 矛盾的话（如 "用红色标注" 但 style 禁止暖色）→ 修改 content prompt |
| 过于 creative/artistic 的 deck | Anchoring "太紧"，每张 slide 缺乏变化 | 放松 anchoring clause——"match the color palette and typography, but vary the layout" |
| 文字密度过高（>50 words） | Model 在挤文字时忽略 style constraints | 减少文字量或把文字移到 speaker notes |

## 多 Reference Anchoring

对于大 deck（6+ pages），可以在生成后期 slides 时除了 style master 之外，再加 1-2 张 "被认可的 key slides" 作为额外 reference。这让 model 不仅看到 "style guide"，还看到 "style 应用在实际 slide 上是什么样"。

---

> **Next**: `04-iteration-and-debugging.md`
