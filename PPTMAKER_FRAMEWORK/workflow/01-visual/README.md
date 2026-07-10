---
title: Making a Visual Style Master — 图片型 PPT 的视觉一致性方案
stage: workflow/01-visual
position: entry
type: overview
summary: 该阶段的入口总览。Agent 读取此文件来理解本阶段的全貌和导航路径。
depends_on: []
feeds_into:
- workflow/01-visual/00-the-problem-why-text-fails.md
agent_action: navigate
---

# Making a Visual Style Master — 图片型 PPT 的视觉一致性方案

> **先读这个。**
> 这是整套方法论的入口。读完再决定深入多少。

## 这是什么

> 本目录的所有设计工作都发生在一个 **run bundle** 中。共享视觉主干存放在 `2_backbone/visual-style/`；某个版本的局部视觉差异存放在 `3_versions/v{n}/overrides/visual-style/`。

一份可复用的流程，用于创建 **visual style master**（视觉风格母版）——一张参考图，用以锚定整份 PPT 每一页的视觉一致性。

## 核心思想，一段话讲完

**Style Anchoring（风格锚定）。** 不要用文字描述视觉风格——"deep teal" 每次渲染出来都不一样，"large headline" 没有绝对尺度——而是创建一张参考图，**展示** color palette、typography scale、layout grid 和 component patterns。生成每一页 slide 时，把这张图作为 reference image 传入。模型 **sees** 和 **matches** 确切的风格，而不是 interpreting ambiguous words。这从根本上消除了"改文字 prompt → 调颜色 → 再生成"的死循环。

洞察：**Visual style lives in pixels, not words.** Style master 是你和模型之间的 visual contract。值得投入精力把它做好，因为下游每一页都继承自它。

## 适合谁

任何用 GPT Image 2（或类似 multimodal image model）制作多页视觉一致性 PPT 的人。方法论与行业无关：manufacturing、pharma、fintech、SaaS、education、consumer——原则是通用的。

## 不适合谁

- 你用的是 text-only image model，不能接收 reference image（anchoring 机制需要 multimodal input）
- 你只做单张图，不是一套 deck（直接用 GPT Image 2 API 生成单张图即可）
- 你需要 editable slide objects 或 native PowerPoint shapes（用传统 presentation workflow）

## 六个文件

| 阶段 | 文件 | 做什么 | 产出 |
|------|------|--------|------|
| 0 | `00-the-problem-why-text-fails.md` | 理解为什么 text-based style descriptions 必然失败 | Internalized rationale——你知道为什么这些额外工作是值得的 |
| 1 | `01-gather-product-context-dna.md` | 研究 product、context、industry 和 audience | Visual vocabulary、product DNA notes、audience profile |
| 2 | `02-design-the-visual-system.md` | 设计 color palette、typography、layout grid、components、micro decorations | 一套结构化的 visual system design |
| 3 | `03-write-the-style-master-prompt.md` | 组装生成 style master 的 meta-prompt | 产出 `style_master.jpg` 的那段 prompt |
| 4 | `04-iterate-review-lock.md` | 对着 checklist 审查，迭代，锁定 | 一张锁定好的 style master——整份 deck 的 visual contract |
| 5 | `05-use-the-style-master-for-slides.md` | 每一页 slide 都 anchor 到 style master | 视觉一致的 slides |

## 阅读路径

- 读这个 README。你会掌握概念和文件地图。
- 加读 `00`（the problem）和 `03`（the prompt）。你会理解为什么这个做法有效，以及怎么写那段关键的 meta-prompt。
- **完整方法论**：按顺序读 `00` 到 `05`。每个文件都在前一个基础上构建。
- **准备执行**：拿 `template-visual-style.md`，复制到你的项目，用方法论文件做指南填空。

## 模板

`template-visual-style.md` 是一个填空模板。它完整镜像了一份 visual system document 的 8-section 结构（style master prompt、color system、typography scale、layout grid、micro decorations、slide type templates、deck-wide constraints、change log），所有 project-specific 内容替换为 `[PLACEHOLDER]` 标记，并内嵌 `[INSTRUCTION: ...]` 注释解释每一段放什么、为什么。

复制它。填空。然后用 Section 1 生成你的 `style_master.jpg`。

## 这份指南不覆盖什么

- 完整 deck production pipeline——在 `workflow/04-production/` 和 `scripts/` 里
- 如何安装或配置 image generation scripts——在 skill 的 script usage 里
- 怎么做 contact sheet 或封装 PPTX——那是 skill workflow 的 Phase 3

这份指南只聚焦于 **Visual Style Master**——一切视觉一致性的基础。

## 真实案例

这套方法论的提出，源于为一个 precision manufacturing 客户制作 AI 战略 keynote deck 的实战。该案例的核心产出：
- 一份完整的 `visual-style.md`（8-section 结构：style master prompt、color system、typography scale、layout grid、micro decorations、slide type templates、deck-wide constraints、change log）
- 一张 `style_master.jpg`——视觉参考图，dark navy 背景、single-family blue-cyan-teal palette、Swiss precision aesthetic

该案例的 visual direction 演变过程（从 multi-color Amber/Emerald/Red/Gold → single-family blue-cyan-teal，从粗糙工业螺栓 → "Jewel-like, not industrial. Think Swiss watch components, not construction bolts"）贯穿了本方法论文件中的示例。

这套方法论的执行依赖 `unified_pipeline.mjs`（Stage 2 走 image2-ppt skill）和 `scripts/` 中的后续管线脚本。

---

> **Next**: `00-the-problem-why-text-fails.md` — 为什么这套方法论存在，为什么 text-based style descriptions 是死胡同。
