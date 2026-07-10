---
title: '00 — The Pipeline Philosophy: Why Stage-Based Production'
stage: workflow/04-production
position: 01 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/04-production/README.md
feeds_into:
- workflow/04-production/01-stage-1-parse-content-to-specs.md
agent_action: internalize
---

# 00 — The Pipeline Philosophy: Why Stage-Based Production

← [README](README.md) | [Next →](01-stage-1-parse-content-to-specs.md)

## 管线存在的理由

你可能问：为什么不直接写一个脚本，输入 markdown，输出 PPTX？为什么要拆成五个阶段，手动跑，中间还产生那么多中间文件？

答案是：**reproducibility, auditability, selective regeneration。**

一份 slide deck 从设计到交付，会经历数十次改动。有些改动只涉及标题文字（5 分钟修好），有些涉及整张 slide 的视觉重设计（需要重新生图），有些只是改讲稿备注（30 秒）。如果你只有一个 monolithic 脚本，每次改一个字都要跑完整流程——包括重新生图（每张 20-60 秒，19 张 = 20 分钟）。

管线设计的核心原则：**让 cheap changes 走 cheap paths，让 expensive changes 走 selective paths。**

## 四个设计原则

### 原则 1：Stage Boundary — 每个阶段只做一件事

| 阶段 | 职责 | 输入格式 | 输出格式 |
|------|------|---------|---------|
| Stage 1 | 解析内容 → 机器可读的规格 | Markdown (human-authored) | JSON (machine-readable) |
| Stage 2 | 文本 → 图片 | JSON prompts + style image | PNG images |
| Stage 3 | 图片 + 标题文字 → 最终图片 | PNG + JSON plan | PNG (final) |
| Stage 4 | 图片 → PPTX | PNG files | .pptx file |
| Stage 5 | markdown speaker notes → PPTX notes | .md + .pptx | .pptx (modified) |

每个阶段有且仅有一个职责。如果 Stage 2 出了 bug（生图不对），你不需要重跑 Stage 1 来定位问题——你只需要检查 Stage 1 的产出（`page_prompts/_prompts.json`）是否合理，然后用 `--only` 重跑 Stage 2 的那一张 slide 即可。

### 原则 2：Checkpoint — 每个阶段输出可检查的文件

不写 `script.py` 把一切串在一起。而是：
- Stage 1 输出 `slide_plan.json` + `page_prompts/_prompts.json`——打开就能看
- Stage 2 输出 `_generated/page_images_full/*.png`——双击就能看
- Stage 3 输出 `_generated/header_locked/*.png`——和 Stage 2 的图对比就能看 header 对不对
- Stage 4 输出 `.pptx`——打开 PowerPoint 就能看
- Stage 5 修改 `.pptx` 的 notes 面板

**每个 checkpoint 都是人类可检查的。** 如果 Stage 3 产出的 header 位置不对，你可以直接在 Finder 里打开 Stage 2 和 Stage 3 的图片做对比，不需要重新跑任何东西。

### 原则 3：Idempotency — 同一阶段跑两次，结果相同

- Stage 1：同样的 markdown 输入 → 同样的 JSON 输出（确定性解析）
- Stage 2：生成图片是非确定性的（AI 每次输出不同），但有 **skip-if-exists** 机制——如果图片已经存在，跳过。删掉图片文件才会重新生成。
- Stage 3：同样的输入图片 + 同样的 `slide_plan.json` → 同样的输出（确定性覆盖）
- Stage 4：同样的输入图片 → 同样的 PPTX（确定性组装）
- Stage 5：**原地修改 PPTX**（唯一非幂等的阶段——需要先备份）

### 原则 4：Immutability — 产出物写一次，下游只读

Stage 的产出物在写入后不修改（Stage 5 除外）：
- Stage 1 产出 `slide_plan.json`，Stage 3 读取它来判定 header 类型
- Stage 2 产出 `.png`，Stage 3 读取它来叠加 header
- Stage 3 产出 `.png`，Stage 4 读取它来组装 PPTX

如果 Stage 3 产出的 header 不对，问题不在 Stage 3——而是 Stage 1 的 `slide_plan.json` 里 `render_mode` 字段错了。你不需要 "修复 Stage 3 的 bug"——你需要回到上游修 Stage 1 的数据。这种 upstream-downstream traceability 是管线最大的价值。

## Header-Lock：AI + Python 的分工哲学

管线中最关键的架构决策是 Header-Lock——把 slide 的标题文字从 AI image generation 中分离出来，交给 Python/Pillow 做确定性渲染。

### 为什么需要 Header-Lock

AI image model 有三个致命弱点：
1. **文字位置不可靠**：prompt 里写 "put the title at y=58"——model 没有像素级的概念，"y=58" 对它来说和 "y=80" 几乎没区别
2. **字体大小飘忽**：prompt 里写 "46px"——model 不会数字体，它生成的是 "看起来像 46px" 的视觉 approximation
3. **文字内容偶发出错**：偶尔拼错字、漏字、多字

Python/Pillow 恰恰相反——它可以在精确的像素位置、用精确的字体大小、渲染精确的文字内容。每次都一样。

因此：**AI 负责 "画面"（body visual）——图表、卡片、图标、色彩。Python 负责 "文字"（header text）——kicker、title、subtitle。**

### 两种 RENDER MODE（唯一词汇）

| RENDER MODE | 数量（典型） | AI 负责 | Python 负责 |
|-------------|------------|---------|------------|
| **`body+header-lock`** | ~80% | 生成 body 画面，顶部 260px 留空 | 在顶部叠加 kicker + title + subtitle |
| **`full-page`** | ~20% | 生成完整画面，包括标题 | 什么都不做（pass-through） |

`full-page` 用于 opening、section divider、closing 等 "全页视觉效果" 的 slide——这些 slide 的标题是画面构图的一部分，需要 AI 生成完整画面。但它们只占少数——通常是 3-5 张。

**如何判定**：问——"这张 slide 的标题位置是否固定、可预测？" 如果是（= 大部分 slide），用 `body+header-lock`。如果不是（= 标题在画面中间、偏右、或其他非固定位置），用 `full-page`。

> 旧词 `normal` / `image_direct` 已废弃。`slide_plan.json` 写 `layout_contract.render_mode`；Stage 3 读它（旧 plan 的 `header_variant` 仍可映射）。

## 三条编辑链：让 cheap changes 走 cheap paths

管线设计中最实用的概念是 "编辑链"——不同类型的改动走不同的阶段子集。

| 链 | 改了什么 | 影响范围 | 走哪些 Stage | 耗时 |
|----|---------|---------|-------------|------|
| **A** | Kicker / Title / Subtitle 的文字 | 单张或多张 slide 的标题 | 1 → 3 → 4 → 5 | ~5 min |
| **B** | Image prompt / 画面视觉设计 | 单张 slide 的画面 | 1 → 2 → 3 → 4 → 5 | ~5 min/page |
| **C** | Speaker notes 讲稿 | 演讲者备注 | 5 | ~30 sec |

### 编辑链的实践意义

**场景 1**：客户说 "Slide 8 的标题不够有冲击力"。你需要改 2 个词。
- 链 A：改 markdown → Stage 1（重新解析标题）→ Stage 3（重新画 header）→ Stage 4（重新打包 PPTX）→ Stage 5（重新注入 notes）。5 分钟。**不要跑 Stage 2**——画面没变，不需要重新生图。

**场景 2**：客户说 "Slide 12 的视觉太拥挤，换一种布局"。你需要重写 IMAGE PROMPT。
- 链 B：改 markdown → Stage 1 → Stage 2（重新生这张图）→ Stage 3 → Stage 4 → Stage 5。但 Stage 2 用 `--only slide_12` 只生这一张——其他 18 张跳过。

**场景 3**：演讲者说 "Slide 5 的 takeaway 改一下"。只需要改 markdown 里的 SPEAKER NOTE。
- 链 C：只跑 Stage 5。30 秒。

**关键纪律**：知道你的改动在哪条链上。不要在链 A 场景下跑 Stage 2——那会浪费 20 分钟在不需要重新生图上，而且新生成的图可能和上一版不一样（AI 的非确定性），引入你不需要的视觉变化。

## 管线参数化：为不同项目定制

虽然管线模式是通用的，但每个项目需要定制以下参数：

| 参数 | 含义 | 从哪里来 |
|------|------|---------|
| Canvas 尺寸 | 16:9 的像素尺寸（如 1672×941） | 视觉系统的 typography scale |
| Header safe zone | 顶部留空高度（如 260px） | 视觉系统的 layout grid |
| RENDER MODE / VISUAL TYPE 映射 | 哪些 slide 是 full-page | 内容设计——每张 slide 的 VISUAL TYPE 或显式 RENDER MODE |
| API endpoint + model | 用哪个 image generation API | 你的 tooling 选择 |
| Font 路径 + 大小 | header 用什么字体 | 视觉系统的 typography scale |

v1 的 canvas 固定为 1672×941；颜色、header 字号和 safe zone 从 `color_palette.json` 读取。不要复制管线脚本进 run bundle。未来若开放 canvas/layout 参数，应继续放进共享配置并由 Stage 1/3 共同读取。

---

> **案例**：T10 项目（precision manufacturing AI strategy keynote）的管线实现了这里描述的所有模式——5 个 Python 脚本，16 张 body+header-lock + 3 张 full-page slides，三条编辑链，1672×941 canvas，260px header zone，Source Sans Pro 字体。后续各文件中的具体数值和实现细节来自这个案例——但管线架构本身是 industry-agnostic 的。

> **Next**: `01-stage-1-parse-content-to-specs.md` — Stage 1 详解：怎么把人类写的 markdown 变成机器可读的 JSON。
