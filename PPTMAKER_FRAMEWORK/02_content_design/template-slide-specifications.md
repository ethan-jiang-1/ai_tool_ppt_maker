---
title: Template — slide-specifications.md
stage: 02_content_design
position: template
type: template
summary: 复制到 deck_{NAME}/3_versions/v{n}/slide-specifications.md。下游:每页规格 + block map + 每页 render mode。管线入口(Stage 1 解析它)。
depends_on:
- 02_content_design/03-specify-slides-multi-layer.md
- 02_content_design/02-build-narrative-arc-blocks.md
feeds_into:
- 06_reference_scripts/stage1_build_inputs.mjs
agent_action: fill_template
---

# Template — slide-specifications.md

> 复制到 `deck_{NAME}/3_versions/v{n}/slide-specifications.md`。这是**下游**文件——每个版本一份,版本迭代主要就是改它(多一页、少一页、重排、改措辞)。它是**管线入口**:Stage 1 解析 `## Slide N` 块生成 JSON。
>
> **上游身份不在这里**:核心隐喻在 `2_backbone/core-metaphor.md`,公式在 `2_backbone/core-formula.md`,约束在 `2_backbone/design-constraints.md`,视觉在 `2_backbone/visual-style/`。写每页 IMAGE PROMPT 时对照那些,但**不要在这里重复它们**。
>
> **需要填好的例子?** 见 `example-deck-brief-mini.md`。删除所有 [INSTRUCTION] 注释后交付。

---

## Block Map（叙事结构）

[INSTRUCTION: Block 是叙事单元——一组共享目的的 slide。每个 Block 回答听众此刻的一个问题。这属于"结构层",会随版本调整(加/砍 Block)。方法见 02-build-narrative-arc-blocks.md。]

| Block | 目的 | 回答什么问题 | Slides | 证据? |
|-------|------|-------------|--------|-------|
| B1: [Name] | [PLACEHOLDER] | [PLACEHOLDER] | [N] | [如何] |
| B2: [Name] | [PLACEHOLDER] | [PLACEHOLDER] | [N] | [如何] |
| B3: [Name] | [PLACEHOLDER] | [PLACEHOLDER] | [N] | [如何] |

### 叙事弧线

[PLACEHOLDER: 3-5 句,描述听众走过这些 Block 的智识与情绪旅程。从哪开始?每个转折感受什么?在哪结束?]

---

## Slide Specifications（每页四层规格）

[INSTRUCTION: 这是核心。每张 slide 填四层:Meta / Concept / Image Prompt / Speaker Note。每张 slide 用一个 `## Slide N` 块——Stage 1 靠这个标记切分。方法见 03-specify-slides-multi-layer.md。]

---

## Slide 01: `slide_id`

**VISUAL TYPE**: [PLACEHOLDER: Title / Opener | Concept Split | Direction | Impact / Evidence | Framework | Case Anchor | Flow / Mechanism | Section Divider | Risk / 2 Panels | Closer]

**RENDER MODE**: [PLACEHOLDER: full-page | body+header-lock]

[INSTRUCTION: RENDER MODE 决定这页怎么生产,两选一:
- **full-page**(整页):image-2 画整页,包括标题。用于 opener / section divider / closer(约 20%)。
- **body+header-lock**(半自动):image-2 只画 body(顶部留白),Python 把 kicker+title 叠在固定像素位——标题永远精准一致。用于常规内容页(约 80%)。
VISUAL TYPE 会自动映射到 render mode(Title/Opener、Section Divider、Closer → full-page;其余 → body+header-lock),所以通常你选对 VISUAL TYPE 即可;RENDER MODE 写出来是为了让这页的生产方式一眼可见。映射定义见 stage1_build_inputs.mjs 的 FULL_PAGE_TYPES。]

**KICKER**: [PLACEHOLDER: 3-6 词全大写。区段标签,不是 claim。opener/closer 可填 "(none)"。]

**TITLE**: [PLACEHOLDER: 完整、可争论的 claim。最多 15 词。必须可证伪。]

**SUBTITLE**: [PLACEHOLDER: 可选。仅 divider/opener/closer 用。不需要就删。]

**CONCEPT**:
- **MUST communicate**: [PLACEHOLDER: 2-3 句。核心认知载荷——听众必须理解什么。]
- **MUST NOT**: [PLACEHOLDER: 1-2 句。要主动防止的误解。]
- **Bridge from previous**: [PLACEHOLDER: 怎么承接上一页。Slide 01 填 "N/A — opener"。]
- **Bridge to next**: [PLACEHOLDER: 这页制造什么问题/预期,由下一页回答。]
- **Content structure**: [PLACEHOLDER: 逻辑结构——两栏对比?三元框架?时间轴?流程图?]

**IMAGE PROMPT**:
```
[PLACEHOLDER: 视觉锁定后再填 —— 见下方"何时填"。生产就绪的视觉描述,200-500 词。

必含:
1. LAYOUT OVERVIEW — 分区、y 范围、比例
2. ZONE DESCRIPTIONS — 每区的内容:面板、图标、文字、视觉元素
3. COLOR SEMANTICS — 每个颜色在这页的语义
4. TEXT CONTENT — 每个文字元素的精确措辞(加引号)
5. CALLOUT BAR — 底部整宽句子(如适用)
6. ANTI-PATTERNS — 不要画什么

body+header-lock 模式:不要画 kicker/title(顶部留白,Python 会叠)。
full-page 模式:画整页含标题。
视觉风格(颜色/字体/组件)对照 2_backbone/visual-style/;prompt 技巧见 03_image_prompts。]
```
> **何时填 L3**：Phase 1 **留占位就好**（上面这段 `[PLACEHOLDER]` 原样保留）。L3 要"对照 `2_backbone/visual-style/`"才写得对，而那套视觉 Phase 2 才锁定——Phase 1 就写 = 拿不存在的东西做参照，多半作废。**视觉锁定后（AGENTS.md §2.7）统一回填**，再跑 `stage1_build_inputs.mjs --validate` 清 ERROR。L1 的 TITLE/VISUAL TYPE/RENDER MODE 照常在 Phase 1 写全。

> **SPEAKER NOTE**
>
> **Narrative flow:**
> [PLACEHOLDER: 讲话要点——不是逐字稿。关键转折、先说什么、指着什么、桥接下一页。]
>
> **Terms:**
> — [PLACEHOLDER: 术语]: [解释——听众说中文就用中文]
>
> **Takeaway:**
> [PLACEHOLDER: 一句话——这页听众必须记住的一件事。]

---

## Slide 02: `slide_id`

[PLACEHOLDER: 每张 slide 复制 Slide 01 的模板,替换所有 placeholder。]

---

[INSTRUCTION: 继续所有 slide。典型战略 keynote 15-21 张。每张 slide 规格应能独立看懂——新人读一张就知道它干什么、怎么执行。]

---

## Change Log（本版本）

| Date | Change Type | Slide(s) | What Changed | Why |
|------|-------------|----------|-------------|-----|
| [YYYY-MM-DD] | Initial | All | [PLACEHOLDER] | [PLACEHOLDER] |
| [YYYY-MM-DD] | [Cut / Add / Reframe / Keep] | [Slide IDs] | [描述] | [原因——最重要的一列] |

[INSTRUCTION: 记录这一版相对上一版改了什么。"Why" 列最重要。新版本用 bundle_layout.mjs --new-version 创建，只复制下游源 delta，不复制 _generated。]

---

> **完成标志**:所有 placeholder 已替换;Block Map 讲出连贯故事;每张 slide **L1 Meta + L2 Concept + L4 Speaker Note 齐全 + RENDER MODE 明确**;change log 有首条。**L3 IMAGE PROMPT 是最后一层**——Phase 1 留占位、视觉锁定后（§2.7）回填,回填完再算真正四层齐全。
>
> **下一步**:视觉在 `2_backbone/visual-style/`(全版本共享);生产跑 `unified_pipeline.mjs --run-dir deck_{NAME}/3_versions/v{n} --stage all`;写 IMAGE PROMPT 见 03_image_prompts。
