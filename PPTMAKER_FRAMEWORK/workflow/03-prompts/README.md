---
title: Image Prompts for PPT Generation
stage: workflow/03-prompts
position: entry
type: overview
summary: 该阶段的入口总览。Agent 读取此文件来理解本阶段的全貌和导航路径。
depends_on: []
feeds_into:
- workflow/03-prompts/00-why-prompt-engineering-matters.md
agent_action: navigate
---

# Image Prompts for PPT Generation

> **先读这个。**

## 这是什么

> 本模块是**能力层**——它不产出文件，而是赋能 [01 Visual Style Master](../01-visual/) 和 [02 Content Design](../02-content/) 中的 IMAGE PROMPT 写作。所有 IMAGE PROMPT 最终都写入 run bundle 的源文件中。

一份方法论，教你为 **GPT Image 2** 写出高质量、可复现的 image generation prompt。

**本框架只用 GPT Image 2。** 它是目前做 image-based PPT 效果最好的模型——style anchoring 机制、文字渲染质量、色彩一致性都最优。方法论原则（五段式 prompt 结构、空间关系描述、颜色语义、anti-patterns）是通用的，但具体 prompt 参数基于 GPT Image 2 设计和验证。如果你用其他模型，原则仍然适用，但可能需要调整参数。

## 核心思想

**Text-to-image is not text-to-text.** 描述一个画面和描述一个想法是两种完全不同的技能。模型需要知道**空间关系**（左/右/上/下/y 坐标）、**颜色语义**（什么颜色代表什么意思）、**元素层级**（什么在最前面，什么在背景）。好的 image prompt 不是文学描写——它是精确的视觉执行指令。

## 六个文件

| 阶段 | 文件 | 做什么 |
|------|------|--------|
| 0 | `00-why-prompt-engineering-matters.md` | 理解为什么图片 prompt 和文本 prompt 是天壤之别 |
| 1 | `01-understanding-the-model.md` | 理解 multimodal image model 能做什么、不能做什么 |
| 2 | `02-prompt-structure-and-patterns.md` | Prompt 的结构化写法：从模糊到精确的层级 |
| 3 | `03-style-anchoring-in-practice.md` | Style Anchoring：用 reference image 锁定视觉一致性 |
| 4 | `04-iteration-and-debugging.md` | 迭代调优：怎么从 70% 到 95% |
| 5 | `05-resolution-quality-tradeoffs.md` | 分辨率、画质、速度的三角权衡 |

## 模板

`template-image-prompt-builder.md` — 填空模板，帮助你在写 IMAGE PROMPT 时不漏掉关键维度。

## 工具

Image generation 的官方路径是框架内 `unified_pipeline.mjs` → `stage2_generate_images.mjs` → `image_api_client.mjs`。它不依赖外部 agent skill；API 配置见 `workflow/00-setup/03-tool-selection.md`。

> **模型说明**：本框架基于 GPT Image 2 设计和验证。它是目前做 image-based PPT 效果最好的模型——style anchoring 机制、文字渲染质量、色彩一致性都最优。如果你用其他模型，方法论原则仍然适用，但具体 prompt 结构和参数可能需要调整。

---

> **Next**: `00-why-prompt-engineering-matters.md`
