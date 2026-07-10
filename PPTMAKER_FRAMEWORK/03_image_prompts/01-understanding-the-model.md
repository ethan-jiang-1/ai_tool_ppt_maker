---
title: 01 — Understanding the Multimodal Image Model
stage: 03_image_prompts
position: 02 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 03_image_prompts/README.md
- 03_image_prompts/00-why-prompt-engineering-matters.md
feeds_into:
- 03_image_prompts/02-prompt-structure-and-patterns.md
agent_action: internalize
---

# 01 — Understanding the Multimodal Image Model

← [00](00-why-prompt-engineering-matters.md) | [Next →](02-prompt-structure-and-patterns.md)

## Model 能做什么

**强项**：
- **色彩和氛围**：理解 color palette、mood、材质感。你说 "Swiss watch precision aesthetic"——它知道那意味着 clean lines, dark backgrounds, metallic accents, fine detail
- **构图**：理解基本布局——左右分栏、上下分区、居中对称
- **Style matching**：如果给了 reference image，能较好地匹配颜色和整体风格
- **视觉隐喻**：能把抽象概念翻译成视觉符号（"growth" → 上箭头/上升曲线，"connection" → 节点网络）

**弱项**：
- **精确文字**：字体会飘、大小不准、偶尔拼错。**永远不要依赖 model 渲染精确的标题文字——用 Header-Lock（03 pipeline）替代**
- **精确位置**："y=290" 对 model 是大概的——可能偏 10-20px。用 y 坐标范围而非精确值
- **一致性**：同一份 prompt 跑两次，输出不完全相同。用 style anchoring + anti-patterns 减少 variance

## 核心概念：从语言到空间的翻译

Model 看到一个 prompt 时，它不 "读" prompt——它把文字翻译成视觉特征向量，然后在 latent space 中找到一个匹配的画面。这个翻译过程有 information loss——你写的细节越多，loss 越少；你写的越模糊，model 越自由发挥。

**Prompt density 原则**：不是越长越好——是越**精确**越好。200 个精确的词比 500 个模糊的词好。

## 分辨率、画质、速度的三角

| 分辨率 | 画质 | 速度 | 适合场景 |
|--------|------|------|---------|
| 1K | Good | ~15-25s | Pilot/测试——检查 layout 和颜色是否正确 |
| 2K | Great | ~30-60s | 最终生产——细节锐利，全屏 16:9 |
| 4K | Excellent | ~60-120s | 超大屏幕/印刷——通常不需要 |

建议：永远用 1K 做 pilot（省时间、省 quota），确认 design 后用 2K 跑 final。

## Model 不知道的事

- **你的品牌**：除非你给了 style master 作为 reference，model 不知道你的 brand colors
- **你的行业术语**："CNC controller interface"——model 可能见过也可能没见过。如果是一个 niche 概念，给 visual reference
- **你的 audience**：model 不知道观众是 executive 还是 engineer——文字密度和视觉复杂度由你控制

---

> **Next**: `02-prompt-structure-and-patterns.md`
