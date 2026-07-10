---
title: The Image-Generation PPT Production Pipeline
stage: 04_production_pipeline
position: entry
type: overview
summary: 该阶段的入口总览。Agent 读取此文件来理解本阶段的全貌和导航路径。
depends_on: []
feeds_into:
- 04_production_pipeline/00-the-pipeline-philosophy.md
agent_action: navigate
---

# The Image-Generation PPT Production Pipeline

> **先读这个。** 3 分钟。
> 这是整套 PPT 生产管线方法论的入口。读完再决定深入多少。

## 这是什么

> 本管线的所有 stage 都运行在 **run bundle**（文件系统实例）内部——消费 run bundle 中的源文件（`3_versions/v1/slide-specifications.md` + `2_backbone/visual-style/`），产出 run bundle 中的派生品（全部写入 `_generated/`）。管线脚本从 `06_reference_scripts/` **就地运行**（通过 `unified_pipeline.py --run-dir`），不复制进 run bundle。

一套可复用的五阶段管线，将人类撰写的 slide 内容规格（来自 [02_content_design](../02_content_design/)）+ 一张 style master 视觉参考图（来自 [01_visual_style_master](../01_visual_style_master/)）转化为一份完成的 PPTX 文件。整个管线由 Python 脚本串联，每个阶段有明确的 input/output 契约，可以独立运行和调试。

## 核心思想，一段话讲完

**Header-Lock（标题锁定）。** AI image model（GPT Image 2 或任何支持 text-to-image 的模型）善于生成创意视觉——图表、卡片布局、图标、配色。但它在**精确文字位置**上不可靠——字体大小飘忽、间距不一致、偶尔拼错字。Python/Pillow 恰恰相反——它可以 pixel-perfect 地在固定位置渲染文字，每次一模一样。因此，把工作分开：AI 生成 slide 的 body 视觉（画面上半部留空），Python 在顶部叠加 kicker/title/subtitle 文字。这消除了 "改文字→重新生图→新文字偏了 3px→重新生图" 的死循环，同时保留了 AI 的视觉创造力。

洞察：**Split the work where each tool is strongest.** AI for creative visuals. Python for deterministic text. The style master is the visual contract between them — it ensures every page feels like the same deck, regardless of which tool rendered which part.

## 适合谁

任何需要从 slide 设计规格批量生产 PPTX 文件的人——尤其是：
- 你的 slides 是基于 AI image generation 的（不是用 PowerPoint shapes 手动搭建）
- 你需要版本化管理、选择性重新生成、可审计的 build process
- 你在 pipeline 的不同阶段和不同角色协作（content designer、visual designer、presenter）
- 你使用的 image generation API 是 async 的（submit → poll → download）

## 不适合谁

- 你用传统方式制作 PPT（手动在 PowerPoint 里拖放 shapes）——你不需要管线
- 你只做 3-5 张图，不是完整 deck——直接用 image generation skill
- 你的 image model 不支持 text-to-image 或 reference image——Header-Lock 的前提不成立

## 五阶段管线

| 阶段 | 文件 | 做什么 | 输入 | 产出 |
|------|------|--------|------|------|
| 0 | `00-the-pipeline-philosophy.md` | 理解为什么用管线、Header-Lock 原理、编辑链概念 | — | Internalized architecture rationale |
| 1 | `01-stage-1-parse-content-to-specs.md` | 把 markdown 内容规格解析为机器可读的 JSON | `*.md` (02 的产出) | `slide_plan.json` + `page_prompts/_prompts.json` |
| 2 | `02-stage-2-generate-images-with-anchoring.md` | 用 style master 批量生图，并自动生成 contact sheet | prompts + style master | 原始 PNG + `preview/contact_sheet.jpg` |
| 3 | `03-stage-3-lock-headers-deterministically.md` | Python/Pillow 叠加标题文字（Header-Lock 核心机制） | 原始 PNG + `slide_plan.json` | 最终 PNG（header 锁定） |
| 4 | `04-stage-4-build-the-pptx-container.md` | 把最终图片封装进 PPTX 容器 | 最终 PNG | `.pptx` 文件 |
| 5 | `05-stage-5-inject-speaker-notes.md` | 从源 md 提取 speaker note 注入 PPTX notes 面板 | `.pptx` + `*.md` | PPTX with notes |

## 阅读路径

- **3 分钟**：读这个 README。你会掌握管线概念和阶段地图。
- **15 分钟**：加读 `00`（philosophy）和 `03`（Header-Lock）。你会理解为什么这样设计管线，以及 Header-Lock 为什么是整个体系的基石。
- **完整方法论**：按顺序读 `00` 到 `05`。每个文件都在前一个基础上构建。
- **准备实现**：`06_reference_scripts/` —— 五个 Stage 的完整 Python 参考实现（可直接运行，按项目定制常量）。`reference-pipeline-scripts.md` 保留作为伪代码架构参考。

## 三条编辑链

不同改动走不同的阶段子集——知道你的改动在哪条链上，节省大量时间：

| 链 | 改了什么 | 走哪些 Stage | 耗时 |
|----|---------|-------------|------|
| **A** | Kicker / Title / Subtitle 文字 | 1 → 3 → 4 → 5 | ~5 min |
| **B** | Image prompt / 画面视觉 | 1 → 2 → 3 → 4 → 5 | ~5 min/page |
| **C** | Speaker notes 讲稿 | 5 | ~30 sec |

## 参考实现

`reference-pipeline-scripts.md` 提供了 6 个关键模式的注释版伪代码：
1. Markdown Parser — 从半结构化 markdown 提取结构化字段
2. Prompt Assembler — 把源 prompt 和系统级约束组合成完整生成 prompt
3. Async Image Generator — submit → poll → download → save with metadata
4. Header Overlay — Pillow 精确文字渲染
5. PPTX Builder — 图片→slide 封装
6. Notes Injector — markdown block 提取 + PPTX notes API

这些不是完整的生产脚本——它们是模式参考，让你根据自己的 vendor 和工具做适配。

## 这份指南不覆盖什么

- 怎么设计 slide 内容——在 [02_content_design](../02_content_design/) 里
- 怎么创建 style master——在 [01_visual_style_master](../01_visual_style_master/) 里
- 怎么写好 image prompt——在 [03_image_prompts](../03_image_prompts/) 里
- 特定 vendor 的 API 集成细节——在 reference-pipeline-scripts.md 里用通用模式替代

这份指南只聚焦于 **生产管线**——把设计变成可交付的 PPTX 文件。

## 真实案例

这套管线源于为一个 precision manufacturing 客户制作 19 页 AI 战略 keynote 的生产实战。该案例的核心特征：
- 5 个 Python 脚本串联的线性管线，每个阶段输出可检查的中间文件
- Header-Lock 机制：16 张 body+header-lock slides（Python 叠加标题）+ 3 张 full-page slides（AI 全页生成）
- APIMart async image API（submit→poll→download），三个 mirror 容错
- 三条编辑链：链 A 改标题 5 分钟，链 B 改画面 5 分钟/页，链 C 改讲稿 30 秒
- Canvas 尺寸 1672×941 px，16:9 PPTX 容器

该管线的版本演进（v1 26 slides → v2 20 slides → v3 19 slides）贯穿了本方法论文件中的示例。

---

> **Next**: `00-the-pipeline-philosophy.md` — 为什么用管线模式，Header-Lock 的设计原理，以及编辑链的完整概念。
