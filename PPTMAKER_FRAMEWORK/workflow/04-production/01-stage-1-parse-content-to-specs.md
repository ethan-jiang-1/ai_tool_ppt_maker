---
title: '01 — Stage 1: Parse Content into Machine-Readable Specs'
stage: workflow/04-production
position: 02 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/04-production/README.md
- workflow/04-production/00-the-pipeline-philosophy.md
feeds_into:
- workflow/04-production/02-stage-2-generate-images-with-anchoring.md
agent_action: execute_pipeline
---

# 01 — Stage 1: Parse Content into Machine-Readable Specs

← [00](00-the-pipeline-philosophy.md) | [Next →](02-stage-2-generate-images-with-anchoring.md)

## Stage 1 做什么

把人类写的 markdown（02 的产出）变成两个机器可读的 JSON 文件：

- **`slide_plan.json`**：每张 slide 的 metadata——id、visual type、kicker、headline、subtitle、`layout_contract.render_mode`
- **`page_prompts/_prompts.json`**：每张 slide 的完整 image generation prompt——IMAGE PROMPT 源文 + 系统级 header contract + body text contract + layout contract

Markdown 是人类创作格式。JSON 是机器执行格式。Stage 1 是它们之间的桥梁。

## 输入格式

输入是一个或多个 markdown 文件，每张 slide 的结构遵循 02 定义的多层规格：

```markdown
## Slide NN: [slide_id]

**VISUAL TYPE**: [Concept Split | Direction | Evidence | ...]
**KICKER**: [ALL CAPS LABEL]
**TITLE**: [Complete, arguable claim]
**SUBTITLE**: [Optional]

**IMAGE PROMPT**:
```
[200-500 word visual description]
```
```

## 输出格式

### slide_plan.json

```json
{
  "slides": [
    {
      "id": "s1_b1_02_two_ais",
      "session": "Keynote",
      "visual_type": "Concept Split",
      "kicker": "TWO KINDS OF AI",
      "headline": "One kind improves efficiency. One changes market access.",
      "subtitle": null,
      "layout_contract": {
        "canvas": [1672, 941],
        "render_mode": "body+header-lock",
        "render_mode_source": "derived:visual_type",
        "header_safe_zone": 260,
        "content_y_min": 290,
        "content_y_max": 780,
        "has_bottom_callout": true,
        "callout_y_min": 805,
        "callout_y_max": 900
      }
    }
  ]
}
```

### page_prompts/_prompts.json

```json
{
  "slides": [
    {
      "id": "s1_b1_02_two_ais",
      "out": "02_s1_b1_02_two_ais.png",
      "prompt": "[Complete wrapped prompt — source IMAGE PROMPT + system contracts]"
    }
  ]
}
```

## Stage 1 要解决的三个核心问题

### 问题 1：从半结构化 markdown 提取结构化字段

Markdown 的 `## Slide NN`、`**VISUAL TYPE**`、`**KICKER**`、`**TITLE**` 标记是约定，不是 schema。Stage 1 脚本需要用 regex 或逐行解析来提取它们。

**解析模式**（伪代码）：

```
for each ## Slide NN block:
  visual_type = extract_field("VISUAL TYPE")
  kicker = extract_field("KICKER")
  headline = extract_field("TITLE")
  subtitle = extract_field("SUBTITLE") or null
  image_prompt = extract_code_block("IMAGE PROMPT")
```

关键原则：**宽容解析。** 如果某张 slide 缺少 `**SUBTITLE**`，不要报错——设为 null。如果 `**KICKER**` 是 "(无)" 或 "(none)"，设为空字符串。Markdown 是人类写的——容错。

### 问题 2：把源 IMAGE PROMPT 和系统级 contract 组装成完整 prompt

源 markdown 中的 IMAGE PROMPT 只描述了画面内容。但 image model 还需要知道系统级约束——header zone 在哪里、body text 的大小下限、callout bar 的位置。这些系统级约束在每个项目中是固定的（从视觉系统文档中派生），应该由 Stage 1 统一注入，而不是让人类在每个 IMAGE PROMPT 中重复写。

**组装逻辑**（伪代码）：

```
full_prompt = assemble([
  source_image_prompt,           // 源 markdown 中的 IMAGE PROMPT
  system_header_contract,        // "Top N px is reserved. Do NOT render text there."
  system_body_text_contract,     // "All body labels ≥ 26px visual. KPIs ≥ 72px."
  system_style_contract,         // "Background: deep navy. No warm tones. No logos."
  system_anchoring_clause,       // "Use reference image as EXACT visual style guide."
])
```

系统级 contract 从 `deck_system.txt` 或视觉系统文档中读取，与具体 slide 无关。

### 问题 3：判定每张 slide 的 RENDER MODE

这是 Stage 1 最关键的判定——因为它直接决定 Stage 3 的行为：

```
# Precedence: explicit RENDER MODE field > VISUAL TYPE → FULL_PAGE_TYPES
if explicit RENDER MODE == "full-page" OR visual_type in FULL_PAGE_TYPES:
  render_mode = "full-page"
  header_safe_zone = 0        // AI 画满整个 canvas
else:
  render_mode = "body+header-lock"
  header_safe_zone = 260      // 顶部 260px 留给 Stage 3 Header-Lock
  content_y_min = 290
  content_y_max = 780
```

`FULL_PAGE_TYPES` 是 VISUAL TYPE 集合（Title / Opener、Section Divider / Bridge、Closer）。也可在每页 L1 写显式 `RENDER MODE` 覆盖。写入 `slide_plan.json` 的字段是 `layout_contract.render_mode`（不再写 `header_variant`）。

**典型分类**：

| VISUAL TYPE | RENDER MODE |
|-------------|-------------|
| Title / Opener | full-page |
| Section Divider / Bridge | full-page |
| Closer | full-page |
| Concept Split | body+header-lock |
| Direction | body+header-lock |
| Evidence / Case | body+header-lock |
| Framework | body+header-lock |
| Risk | body+header-lock |

## Gate Check：Stage 1 完成后必须确认什么

- [ ] `slide_plan.json` 中的 slide 数量 = 源 markdown 中的 slide 数量
- [ ] 每个 slide id 在 `slide_plan.json` 和 `page_prompts/_prompts.json` 中一致
- [ ] full-page 分类正确（opening/divider/closing）
- [ ] 没有丢失任何 IMAGE PROMPT（所有 code block 都被提取）
- [ ] `render_mode` 只有 `full-page` 或 `body+header-lock`（Stage 3 依赖于此）

---

> **案例**：某 19 张 slide 的 keynote，Stage 1（`stage1_build_inputs.mjs`）从其 slide-specifications.md 解析出 19 张。其中 3 张（title/bridge/closer）归为 full-page（VISUAL TYPE 映射或显式 RENDER MODE=full-page），其余 16 张为 body+header-lock。canvas 尺寸 1672×941，header_safe_zone 260px（后者可由 preset 的 color_palette.json 覆盖）。这些参数按项目/preset 定制。

> **Next**: `02-stage-2-generate-images-with-anchoring.md` — Stage 2 详解：怎么用 async API 批量生图，同时用 style master 做视觉锚定。
