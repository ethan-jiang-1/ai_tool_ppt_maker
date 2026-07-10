---
title: GLOSSARY — 关键术语
stage: root
position: appendix
type: reference
summary: 框架中所有关键术语的定义。遇到不认识的词，先查这里。
depends_on: []
feeds_into: []
agent_action: reference
---

# GLOSSARY — 关键术语

> 框架中反复出现的术语，按概念分组。每个术语有**一句话定义** + **它在框架中为什么重要**。

## 核心概念

### Run Bundle（运行包）
你为一个具体 PPT 项目创建的文件系统实例——包含所有设计文档、图片、JSON、PPTX。它就是 `deck_{NAME}/` 这个目录。

**为什么重要**：整个框架的工作都发生在一个 run bundle 里。不需要数据库、不需要 workflow server。`ls` 看进度，`diff -r 3_versions/v1 3_versions/v2` 看差异。

### Soft Bundle（软包 / 知识包）
`PPTMAKER_FRAMEWORK/` 本身——方法论文档、模板、参考脚本。它是只读的知识库，不包含任何具体项目的内容。

**为什么重要**：Soft bundle 教你"怎么想"，run bundle 存放"你做了什么"。一个 soft bundle 可以服务无数个 run bundle。

### Source File（源文件）
你亲手写的文件——slide-specifications.md、visual-style.md。这些文件进 Git，人类编辑它们。

### Derived Artifact（派生品）
脚本生成的产物——`_generated/slide_plan.json`、`_generated/page_images_full/*.png`、`_generated/ppt/*.pptx`。全部在 `_generated/` 目录下，可以随时从源文件重新生成。**绝不要直接改派生品。**

---

## 视觉系统

### Visual Style Master（视觉风格母版）
一张参考图（`style_master.jpg`），上面展示了 color palette、typography scale、layout grid、component patterns。它的作用是作为 **visual anchor**——生成每一页 slide 时传给 AI 模型，让模型"看到"并"匹配"这套视觉系统。

**为什么重要**：这是整个框架最核心的洞察——用图片而不是文字来描述视觉风格。文字说"deep teal"每次都不一样；图片展示 exact teal swatch，每次都一样。

### Style Anchoring（风格锚定）
把 visual style master 作为 reference image 传给模型，让每一页 slide 都校准到同一个视觉参考上。

**为什么重要**：它解决了"文字描述风格 → 每页都漂移 → 死循环调整"的问题。SHOW, don't DESCRIBE.

### Anchoring Clause（锚定条款）
追加到每个 slide prompt 末尾的一段固定文字，告诉模型"严格匹配 reference image 的风格，不要偏离。" 内容大致是：

> "Use the reference image(s) as your EXACT visual style guide. Match the color palette, typography scale, layout grid... Only change the slide content, not the style."

### deck_system.txt
一份独立的文本文件，定义了全 deck 的 **textual constraints**——语言策略、禁用元素、文字密度、tone、颜色规则。它和 visual style master 互补：style master 展示视觉风格，deck_system.txt 规定文字约束。

**为什么重要**：Stage 1 脚本读取它，向每个 slide prompt 注入系统级 contract。它和 style master 共同构成 AI 模型的完整创作边界。

---

## 内容设计

### Core Metaphor（核心隐喻）
用一句具体的、可感知的话抓住你要讲的故事的本质。它不是 tagline——它是一个 conceptual anchor，帮助观众把复杂信息组织成 mental model。

**为什么重要**：隐喻是你整个 deck 的地基。如果隐喻能在 5 秒内向陌生人解释清楚，你的 deck 就有了叙事锚点。

### Core Formula（核心公式）
用一句可证伪的话表达你要论证的命题。典型形式是 A + B = C。

**为什么重要**：不可证伪的公式（"AI is important"）没有论证力。可证伪的公式（"Readable Data + Managed Agents = AI Adoption"）驱动整份 deck——每张 slide 都在论证公式的一部分。

### Block（叙事块）
按叙事目的分组的 slide 集合（通常 3-7 张）。每个 Block 回答观众在旅程中的一个核心问题。

### 四层规格（Four-Layer Slide Spec）
每张 slide 的完整设计，包含四个独立层：
- **Meta**：VISUAL TYPE、KICKER、TITLE（给 pipeline 脚本读）
- **Concept**：MUST communicate、MUST NOT、Bridge（给人类 reviewer 读）
- **Image Prompt**：精确视觉描述，200-500 字（给 AI image model 读）
- **Speaker Note**：叙事流、术语解释、takeaway（给演讲者读）

### VISUAL TYPE（页面视觉类型）
一张 slide 的布局标签——Title / Opener、Concept Split、Direction、Evidence、Framework、Section Divider、Closer 等。这个标签告诉 pipeline：默认映射到哪个 RENDER MODE（Title/Opener、Section Divider、Closer → `full-page`；其余 → `body+header-lock`）。也可在 L1 显式写 `RENDER MODE` 覆盖。

### KICKER
一行短小的全大写文字（3-6 词），放在 slide 左上角，告诉观众"你现在在哪个部分"。它是标签，不是 claim。如 `THE PROBLEM`、`HOW IT WORKS`。

### TITLE / CLAIM
这张 slide 的核心主张。必须是一个完整的、可争论的句子。不是 topic label（"Market Trends"），而是 claim（"Dashboards show you the traffic jam. Decisions tell you to take Exit 47."）。

---

## 生产管线

### Header-Lock（标题锁定）
把 slide 的标题文字从 AI image generation 中分离出来，交给 Python/Pillow 做确定性渲染。AI 负责 body visual（图表、卡片、颜色），Python 负责 header text（kicker + title + subtitle），在精确的像素位置，用精确的字体大小。

**为什么重要**：AI 在文字位置、字体大小、拼写上不可靠。Python 在精确渲染上 100% 可靠。**Split the work where each tool is strongest.**

### RENDER MODE（唯一对外词汇）
每张 slide 的生产方式，**只使用这两个词**（写在 slide-specifications.md，也写入 `slide_plan.json` 的 `layout_contract.render_mode`）：

| RENDER MODE | 含义 | 典型页 |
|-------------|------|--------|
| **`body+header-lock`** | AI 只画 body（顶部留白），Python 叠 kicker+title | 常规内容页 ~80% |
| **`full-page`** | AI 画整页（含标题），Python 不叠字 | opener / divider / closer ~20% |

旧词 `normal` / `image_direct` 仅作输入别名兼容，**文档与新产出禁止再用**。Stage 3 读 `render_mode`；若遇到旧 `slide_plan.json` 里的 `header_variant`，会自动映射。

### 编辑链（Editing Chain）
不同类型改动走不同的管线阶段子集：
- **链 A**：改标题文字 → Stage 1 → 3 → 4 → 5（~5 分钟）
- **链 B**：改画面/IMAGE PROMPT → Stage 1 → 2 → 3 → 4 → 5（~5 分钟/页）
- **链 C**：改 speaker notes → Stage 5 only（~30 秒）

### Gate Check（闸门检查）
每个 Phase 和 Stage 结束时的强制检查点。Agent 停下来等用户确认后才能继续。**跳过闸门 = 下游改动成本指数增长。**

### Stage（管线阶段）
生产管线的 5 个步骤：Stage 1（markdown→JSON）、Stage 2（text→images）、Stage 3（Header-Lock）、Stage 4（build PPTX）、Stage 5（inject notes）。每个 Stage 有明确的输入/输出，可以独立运行和 debug。

---

## 迭代

### 结构化迭代（Structured Iteration）
把"反复改、来回调"变成有纪律的流程：明确要改什么和为什么 → 审核影响范围 → 实施变更 → 记录归档。不管用什么工具（Claude Code 的 OpenSpec、changelog + git、issue tracker），核心纪律不变。

### 版本快照（Version Snapshot）
`bundle_layout.mjs --new-version deck_X/3_versions/v{n}`——只复制下游源 delta，并创建干净 `_generated/`。适用于砍/加/重排 slide 等下游结构改动；隐喻/公式/共享视觉属于 backbone，不应借开版本逃避共享语义。

---

## API & 工具

### GPT Image 2
本框架唯一使用的 image generation model。支持 reference image 作为输入（style anchoring 的前提），文字渲染质量和色彩一致性在目前所有模型中最好。通过 OpenAI 兼容 API 访问——可以直接连 OpenAI，也可以通过中转服务。

### Async API Pattern（异步 API 模式）
Image generation 的调用模式：submit（提交 prompt）→ poll（轮询任务状态）→ download（下载生成的图片）。不是"发请求 → 等图片"，而是"发请求 → 拿到 task_id → 过几秒问一次做好了没 → 做好了再下载"。

---

> 有术语缺失？先查 [charter/AGENT_CONTRACT.md](charter/AGENT_CONTRACT.md)，或在 AGENTS.md 的快速查阅表中搜索。
