---
title: Designing PPT Content — The Content Architecture Method
stage: 02_content_design
position: entry
type: overview
summary: 该阶段的入口总览。Agent 读取此文件来理解本阶段的全貌和导航路径。
depends_on: []
feeds_into:
- 02_content_design/00-the-problem-why-slide-count-fails.md
agent_action: navigate
---

# Designing PPT Content — The Content Architecture Method

> **先读这个。** 3 分钟。
> 这是整套内容设计方法论的入口。读完再决定深入多少。

## 这是什么

> 本目录的所有设计工作都发生在一个 **run bundle**（文件系统实例）中——由 `00_project_setup/` 定义的文件系统架构。项目初始化时（Phase 0），agent 会为你创建这个 run bundle。你产出的 deck brief（markdown）将存放在 run bundle 的 `3_versions/v{n}/` 目录中。

一套可复用的方法论，用于将 "我需要一份关于 X 的 deck" 转化为一份**完整的、多层精确的 slide 规格文档**——其中每张 slide 都定义了它的认知载荷、视觉执行方案、和演讲者叙事路径。

它不是关于视觉风格（那是 [01_visual_style_master](../01_visual_style_master/) 的领域），也不是关于如何把规格变成 PPTX 文件（那是 [04_production_pipeline](../04_production_pipeline/) 的领域）。它聚焦于**内容架构**——在写第一个 image prompt 之前，先回答最根本的问题：这份 deck 到底要说什么，按什么顺序说，每张 slide 承载什么论证功能。

## 核心思想，一段话讲完

**Narrative-First Content Architecture（叙事优先的内容架构）。** 不要从 slide 数量开始——"我需要一份 20 页的 deck" 会让 slide 变成填格子游戏。而是从**核心隐喻**和**核心公式**开始——用一句话抓住你要讲的故事的本质，再用一个公式表达你要论证的命题。然后从隐喻和公式推导出 slide 序列，每张 slide 作为叙事弧中的一个节点，承担明确的论证功能。每张 slide 用**四层精确规格**定义：它是什么类型的页面（VISUAL TYPE）、它向观众传递什么 claim（KICKER + TITLE）、它的认知载荷是什么（CONCEPT）、它的视觉执行方案是什么（IMAGE PROMPT）、演讲者站在它旁边该说什么（SPEAKER NOTE）。

洞察：**Slides are not containers for content — they are nodes in a narrative arc.** 一张好的 slide 不应该 "包含一些信息"；它应该在论证中向前推进一步。如果你不能说出这张 slide 在叙事中承担什么功能，它就不该存在。

## 适合谁

任何需要设计 presentation 内容的人——尤其是当：
- 你不是在填空模板，而是在从头构建一个有说服力的叙事
- 你的 deck 将由 AI image model 生成视觉（需要精确的 IMAGE PROMPT 规格）
- 你需要和视觉设计师、AI 系统、演讲者多方协作
- 你要做的是 strategy deck、keynote、investor pitch、board presentation——任何"论证驱动"而非"信息罗列"的 deck

方法论与行业无关：manufacturing、SaaS、pharma、fintech、education、consumer——原则是通用的。

## 不适合谁

- 你只是在做信息汇总型 deck（季度报告、项目进度更新）——这些不需要叙事架构
- 你已经有了固定的 corporate template，只需要填内容——不需要重新设计内容架构
- 你只需要 3-5 页的快速 pitch——轻量级的 outline 就够了，不需要全套方法论

## 六个文件

| # | 文件 | 做什么 | 产出 |
|------|------|--------|------|
| 0 | `00-the-problem-why-slide-count-fails.md` | 理解为什么"先定 slide 数量"是死胡同 | Internalized rationale——你知道为什么叙事优先不是矫情 |
| 1 | `01-find-the-core-metaphor-and-formula.md` | 提炼核心隐喻和公式——叙事的两个锚点 | One metaphor + one formula + relationship paragraph |
| 2 | `02-build-narrative-arc-blocks.md` | 将 slide 按叙事目的分组为 Block，设计概念→证据的节奏 | Block map with purpose statements and slide allocation |
| 3 | `03-specify-slides-multi-layer.md` | 为每张 slide 写四层精确规格 | 完整的 slide-by-slide 设计文档 |
| 4 | `04-create-content-assets.md` | 准备内容资产：文案、视觉概念、数据表达 | 每张 slide 的可执行内容素材 |
| 5 | `05-iterate-with-version-discipline.md` | 版本化迭代：砍、加、重构、锁定 | 版本追踪的 slide 设计 |

## 阅读路径

- **3 分钟**：读这个 README。你会掌握概念和阶段地图。
- **15 分钟**：加读 `00`（the problem）和 `02`（narrative arcs and blocks）。你会理解为什么这个做法有效，以及怎么把一堆想法组织成有论证力的 slide 序列。
- **完整方法论**：按顺序读 `00` 到 `05`。每个文件都在前一个基础上构建。
- **准备执行**：拿四份模板（`template-core-metaphor.md`、`template-core-formula.md`、`template-design-constraints.md`、`template-slide-specifications.md`），复制到你的项目，用方法论文件做指南填空。

## 模板

内容现在按**变更频率**拆分成两个层级：稳定的骨架内容放在 `2_backbone/`，逐版本变化的 slide 规格放在 `3_versions/v{n}/slide-specifications.md`。对应四份填空模板：

- `template-core-metaphor.md` → `2_backbone/core-metaphor.md`（核心隐喻）
- `template-core-formula.md` → `2_backbone/core-formula.md`（核心公式）
- `template-design-constraints.md` → `2_backbone/design-constraints.md`（设计约束）
- `template-slide-specifications.md` → `3_versions/v{n}/slide-specifications.md`（Block map + 每张 slide 的四层规格 + 变更记录）

每份模板都把 project-specific 内容替换为 `[PLACEHOLDER]` 标记，并内嵌 `[INSTRUCTION: ...]` 注释解释每一段放什么、为什么。

复制它们。填空。然后用 [01_visual_style_master](../01_visual_style_master/) 设计视觉系统，用 [04_production_pipeline](../04_production_pipeline/) 把它变成 PPTX。

## 这份指南不覆盖什么

- 视觉风格设计（color palette、typography、layout grid、components）——在 [01_visual_style_master](../01_visual_style_master/) 里
- PPT 生产 pipeline（image generation、header lock、PPTX assembly）——在 [04_production_pipeline](../04_production_pipeline/) 里
- Image prompt 的底层写作技巧（prompt engineering for image models）——在 [03_image_prompts](../03_image_prompts/) 里
- 演讲技巧、舞台表现、观众互动——不在本知识库范围内

这份指南只聚焦于 **内容架构**——在视觉和执行之前，先回答 "what to say and in what order"。

## 参考案例

> **说明**：本方法论各文件中出现的 T10 项目案例，都标注为 **「案例」** 或 **「Example」**。它是一个 precision manufacturing AI strategy keynote 的实战——用它来 **展示方法论在真实项目中长什么样**，但方法论本身是 industry-agnostic 的。学习时请汲取思路和精神，不要照搬具体 slide 内容。
>
> 该案例的核心特征：
> - 一个核心隐喻（"Two Languages" — 物理制造语言 vs 数据语言）和一个核心公式（"Readable Data + Managed Agents = AI Adoption"）
> - 一份 19-slide 的四层规格文档（每张 slide 包含 VISUAL TYPE、KICKER、TITLE、CONCEPT、IMAGE PROMPT、SPEAKER NOTE）
> - 5 个 Block 的叙事弧（External Trigger → Diagnosis → Data Directions + Cases → Organization + Case → Risk + Close）
> - 概念→证据交替节奏（每张 direction slide 紧接一张 case anchor slide）
> - v2→v3 迭代：砍 2 张、加 1 张、重构 5 张

---

> **Next**: `00-the-problem-why-slide-count-fails.md` — 为什么这套方法论存在，为什么"先想好多少页"是错的。
