---
title: '04 — Iteration and Debugging: From 70% to 95%'
stage: workflow/03-prompts
position: 05 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/03-prompts/README.md
- workflow/03-prompts/03-style-anchoring-in-practice.md
feeds_into:
- workflow/03-prompts/05-resolution-quality-tradeoffs.md
agent_action: ask_questions
---

# 04 — Iteration and Debugging: From 70% to 95%

← [03](03-style-anchoring-in-practice.md) | [Next →](05-resolution-quality-tradeoffs.md)

## First attempt is always 70%

第一版 prompt 生成的图片通常在 70% 左右——layout 大致对、颜色基本对、但细节有问题。这是正常的。Image prompt engineering 的核心技能不是 "一次写对"——而是 **快速诊断问题、精准修复、避免引入新问题**。

## 诊断框架：对着 checklist 逐项检查

不要 "感觉不太对"——逐项检查：

| 维度 | 检查 | 通过标准 |
|------|------|---------|
| **Layout** | 分区对了吗？左右/上下的比例对吗？ | 所有主要元素在正确的 zone 中 |
| **Color** | 颜色对吗？有没有不该出现的颜色？ | 所有颜色在定义的 palette 内，没有暖色入侵 |
| **Text** | 文字完整吗？大小对吗？位置对吗？ | 所有文字可读，没有乱码，KPI 数字足够大 |
| **Component** | 卡片/面板/箭头/图标对了吗？ | 组件样式和 style master 一致 |
| **Header zone** | 顶部 260px 干净吗？ | 深色背景，无文字，无视觉元素 |
| **Callout bar** | 底部 callout 对了吗？ | 文字正确，颜色正确，位置在 y=805-900 |

## 修复策略：改 prompt 的哪个部分

根据诊断结果，精准修复——不要改整个 prompt：

| 问题 | 修复位置 | 怎么改 |
|------|---------|--------|
| 颜色偏了 | COLOR SEMANTICS | 加强颜色描述——用 hex code + named role + "never use X" |
| 布局比例不对 | LAYOUT | 调整百分比、y 坐标范围 |
| 某个元素没出现 | ZONE DESCRIPTION | 把那个元素提到段落的更前面（更高 attention） |
| 不该出现的元素出现了 | ANTI-PATTERNS | 更明确地列出禁止项 |
| 文字乱码/缺失 | TEXT CONTENT | 检查 wording——有没有特殊字符？有没有太长的 string？ |
| Style 不一致 | ANCHORING CLAUSE | 加强——"deviate from the reference style ONLY if explicitly instructed" |

## 迭代节奏

| 轮次 | 做什么 | 预期提升 |
|------|--------|---------|
| 1st pass | 初版 prompt → 生成 | ~70% |
| 2nd pass | 对着 checklist 诊断 → 精准修复 → 重生成 | ~85% |
| 3rd pass | 微调 → 重生成 | ~92% |
| 4th pass | 如果还没到 95%，问题可能在 prompt 结构层面——重新组织而非修补 | ~95% |

**不要在 70% 的图上做微调**——先修大问题（layout 错 = 重写 LAYOUT 段落），再修小问题（某个 icon 偏了 5px = 微调 ZONE DESCRIPTION）。

## 常见 trap

1. **改太多变量**：一次改 5 个地方 → 你不知道哪个改动产生了哪个效果 → 下轮重蹈覆辙。**一次改 1-2 个变量。**
2. **追求 100%**：95% 够了。剩下 5% 的细节在 slide 实际播放时观众不会注意到。**Perfection is the enemy of done.**
3. **不看 trace**：图片有问题但你不看 `.apimart-task.json`——不知道是哪个 model、哪个 mirror、prompt 有多长。**Always check trace before debugging.**

---

> **Next**: `05-resolution-quality-tradeoffs.md`
