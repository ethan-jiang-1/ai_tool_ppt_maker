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

新 deck 的文档开头还有有效 YAML frontmatter：

```yaml
---
render:
  default: full-page
  header-lock: []
---
```

无 frontmatter 或无顶层 `render` 的旧 deck 合法，进入 legacy 分支。其他顶层 metadata 保留；`render` 是 closed mapping，只允许 `default` / `header-lock`，内部 typo 会 fail-loud。顶层若误写 `renders:`，Stage 1 不能 fuzzy 纠正，因为“没有 render”本身必须解释为 legacy；用 `layout_contract.render_mode_source` 排障。
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
        "render_mode": "full-page",
        "render_mode_source": "policy:default",
        "header_safe_zone": 0,
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

源 markdown 中的 IMAGE PROMPT 只描述画面和构图，不重复结构化 KICKER/TITLE/SUBTITLE 文案或 header 位置。Stage 1 根据 resolved mode 统一注入系统契约：content full-page 获得 exact text + 语义 top-left band + px geometry；hero full-page 获得 exact text，但没有固定 band；body+header-lock 只有 generic overlay-later 和硬 safe-zone，不包含 header 具体值。

**组装逻辑**（伪代码）：

```
full_prompt = assemble([
  source_image_prompt,           // 源 markdown 中的 IMAGE PROMPT
  mode_specific_header_contract,// exact text soft band, hero text, or overlay-later reserve
  system_body_text_contract,     // "All body labels ≥ 26px visual. KPIs ≥ 72px."
  system_style_contract,         // "Background: deep navy. No warm tones. No logos."
  system_anchoring_clause,       // "Use reference image as EXACT visual style guide."
])
```

系统级 style contract 从 `deck_system.txt` 读取；header geometry 从 Stage 1 与 Stage 3 共用的 visual config 读取。可选 header 字段为空、`(none)`、`(无)` 或整字段 bracket placeholder 时视为 absent，不进入 slide record 或 prompt。

### 问题 3：判定每张 slide 的 RENDER MODE

这是 Stage 1 最关键的判定——因为它直接决定 Stage 3 的行为：

```text
顶层 render 缺失
└─ legacy: explicit RENDER MODE > VISUAL TYPE derivation

顶层 render 存在
└─ policy: explicit RENDER MODE
          > render.header-lock exception
          > hero guard
          > render.default (missing => full-page)
```

hero canonical 类型是 `Title / Opener`、`Section Divider / Bridge`（含 `Section Divider` alias）、`Closer`。policy 下默认 body+header-lock 时 hero guard 仍保持 full-page，除非 explicit/exception 覆盖。policy deck 每页必须有真实 VISUAL TYPE。

`render_mode_source` 只用于追踪：`explicit`、`policy:exception`、`derived:hero_type`、`policy:default`、`derived:visual_type`。Stage 3 不按 source 分支。

## Gate Check：Stage 1 完成后必须确认什么

- [ ] `slide_plan.json` 中的 slide 数量 = 源 markdown 中的 slide 数量
- [ ] 每个 slide id 在 `slide_plan.json` 和 `page_prompts/_prompts.json` 中一致
- [ ] policy/legacy 分支与 `render_mode_source` 正确
- [ ] content full-page prompt 有统一 soft band；hero 无固定 band；body-lock prompt 不含具体 header 值
- [ ] 没有丢失任何 IMAGE PROMPT（所有 code block 都被提取）
- [ ] `render_mode` 只有 `full-page` 或 `body+header-lock`（Stage 3 依赖于此）

---

> **案例**：新初始化 deck 的 19 张 slide 默认都可为 full-page；pilot 若发现两张 content header 漂移，就把其 id 加入 `render.header-lock`。这两张的 `render_mode_source` 为 `policy:exception`，其余为 `policy:default`。full-page 的 `header_safe_zone` 恒为 0；header-lock 的硬 safe zone 来自 visual config。

> **Next**: `02-stage-2-generate-images-with-anchoring.md` — Stage 2 详解：怎么用 async API 批量生图，同时用 style master 做视觉锚定。
