---
title: 03 — Write the Style Master Prompt（撰写风格母版 Prompt）
stage: 01_visual_style_master
position: 04 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 01_visual_style_master/README.md
- 01_visual_style_master/02-design-the-visual-system.md
feeds_into:
- 01_visual_style_master/04-iterate-review-lock.md
agent_action: ask_questions
---

# 03 — Write the Style Master Prompt（撰写风格母版 Prompt）

> 翻译阶段。把 Stage 2 的 visual system design 组装成生成 `style_master.jpg` 的 meta-prompt。这是整套方法论中操作上最关键的文件。

---

**Navigation**: ← `02-design-the-visual-system.md` | Next → `04-iterate-review-lock.md`

---

## Style Master Prompt 是什么

它是一个 **meta-prompt。** 它不描述一张 slide——它描述一张 **visual style guide image。** 输出是一张教给模型你的 visual system 的 reference image。之后每一张 slide prompt 都会 reference 这张图。

可以这样理解：slide prompt 说 "Design slide 7 about quarterly revenue, using the reference style." Style master prompt 说 "Design the reference style itself, so slide 7 knows what to match."

Style master prompt 只有一个任务：产出一张图，以足够的清晰度视觉编码你的 color palette、typography scale、layout grid 和 component patterns，让模型能够复现它们。

## Prompt 结构——逐段拆解

### Part 1: Frame The Task（框架任务）

```
Design a visual style guide for a PowerPoint slide deck.
This is a reference image, not a slide itself.
```

**为什么重要：** 没有第一句话，模型可能生成一张 generic "pretty design image"，但没有你需要的 structural elements。没有第二句话，它可能生成一张带内容的 slide 而不是 style reference。短语 "This is a reference image, not a slide itself" 是 **load-bearing**——它告诉模型这是 meta，不是 content。

### Part 2: What To Show — The Four Zones

**Zone 1 — Color Palette:**
```
Show clearly:
- Color palette: [4-8] swatches with hex codes, labeled with their roles:
    Primary background: [Name] #[hex]
    Panel / surface: [Name] #[hex]
    Primary accent / positive: [Name] #[hex]
    Highlight / emphasis: [Name] #[hex]
    ...
```

模型需要**看到** swatches 以及它们的 hex codes 和 role labels。每个 swatch 上的三条信息：颜色本身、它的名称、它的用途。模型这样学会 "Cyan #06b6d4 means positive outcome"——它看到 swatch，读到 label，将它们关联起来。

**Zone 2 — Typography:**
```
- Typography: headline size sample (very large, bold, [text-color]),
  subtitle sample (medium, [secondary-color]),
  body text sample (small, [text-color], readable),
  KPI number sample (oversized, [accent-color], dominant)
  — with visible size hierarchy between all four levels
```

**不要**用 pixel values。模型无法解读 "46px"。用相对描述——"very large," "oversized," "medium," "small"——让生成图像中的 visual proportions 做真正的工作。"Visible size hierarchy" 这条指令告诉模型，四个 samples 必须在同一帧中，大小清晰可辨。

**Zone 3 — Layout Grid:**
```
- Layout grid: a wireframe showing three zones:
    Top: Kicker label (small caps) + Title (large, full width)
    Middle: Main content zone (70% of height) — left/right split or full width
    Bottom: Insight callout bar (single sentence, full width, [accent color])
```

Wireframe 教给模型空间契约：text 在哪里、content 在哪里、callout 在哪里。百分比（70%）给模型 proportion target。Callout bar specification 告诉它这是一个 recurring structural element，不是 optional decoration。

**Zone 4 — Component Examples:**
```
- Component examples (small but readable):
    One KPI card: dark panel, oversized number in [accent], small label below
    One flow diagram: 3-4 nodes connected by arrows, [panel-color] nodes with white text
    One comparison layout: two columns, left = past/risk ([muted] tint), right = future/positive ([accent] tint)
```

这些 component examples 小而关键。每个 component example 教给模型一个 visual pattern，模型将在整个 deck 中复现它。"Small but readable" 很重要——examples 在 style master 中应该是 thumbnail 大小（不主导画面），但 detail 足够让 model 学习。

### Part 3: Micro Decorations（如需要）

只有你的 deck 引入了需要 visual mnemonics 的抽象概念时才加入这一节（参考 Stage 2, Dimension 5 的决策框架）。如果加入：

```
- Micro decoration examples (tiny, jewel-like visual mnemonics for [domain] concepts):
    Beside the word "[Concept A]" — [visual description]
    Beside "[Concept B]" — [visual description]
    Each mnemonic is no larger than 8% of the slide area — purely decorative,
    positioned in margins beside text.
    Same [product DNA aesthetic]: geometric, [descriptors], fine lines.
```

### Part 4: Product Reference Inset（如适用）

如果 client 有 physical product 且具有 distinctive visual DNA：

```
- Product reference (bottom of style guide): small inset showing the scale and finish of
  [product description at macro scale].
  This is NOT [anti-pattern] — it is [correct characterization].
  [Key details: size comparison, surface finish, light behavior].
  This inset sets the product DNA reference for the entire deck.
```

这使整个 visual system 扎根于 client 制造的东西的 physical reality。它不是 decoration——它是 visual anchor，说的是 "this is what precision means in this deck."

### Part 5: Style / Mood Description（风格 / 情绪描述）

```
Overall style: [1-2 sentence mood description].
[1 sentence about color family philosophy — what's included, what's excluded].
[1-2 sentences about visual surfaces, precision, light].
Typography is bold and hierarchical — title dominates.
This is a [deck type] for [audience], not a [what it's not].
```

**保持简短。** 最多 3-5 句。这是唯一用文字描述 visual character 的地方。其他一切都是 shown, not told. 过长的 mood description 增加误读概率——模型试图满足所有形容词，结果是混乱的。

### Part 6: Exclusions（排除清单）

```
No real company logo, no watermark, no page number, no draft label.
```

**这不是可选的。** 没有 explicit negative instructions，模型可能添加 decorative elements，然后传播到每一页 slide。常见的 hallucinated 添加物：watermarks、page numbers、"CONFIDENTIAL" stamps、decorative corner marks、source notes。在这里和 `deck_system.txt` 中都明确排除它们。

**大多数 deck 的扩展排除清单：**
```
No real company logo, no watermark, no page number, no draft label,
no source notes, no "CONFIDENTIAL" stamps, no footer text,
no decorative corner marks, no gradient orbs, no clip art,
no stock photo people, no photo backgrounds.
```

## 完整模板

```
Design a visual style guide for a PowerPoint slide deck.
This is a reference image, not a slide itself.

Show clearly:
- Color palette: [4-8] swatches with hex codes, labeled with their roles:
    [Role 1]: [Name] #[hex]
    [Role 2]: [Name] #[hex]
    [Role 3]: [Name] #[hex]
    [Role 4]: [Name] #[hex]
    [Role 5]: [Name] #[hex]
    [Role 6]: [Name] #[hex]
    [...]

- Typography: headline size sample (very large, bold, [text-color]),
  subtitle sample (medium, [secondary-color]),
  body text sample (small, [text-color], readable),
  KPI number sample (oversized, [accent-color], dominant)
  — with visible size hierarchy between all four levels

- Layout grid: a wireframe showing three zones:
    Top: Kicker label (small caps) + Title (large, full width)
    Middle: Main content zone (70% of height) — left/right split or full width
    Bottom: Insight callout bar (single sentence, full width, [accent-color])

- Component examples (small but readable):
    One KPI card: dark panel, oversized number in [accent], small label below
    One flow diagram: 3-4 nodes connected by arrows, [panel-color] nodes with white text
    One comparison layout: two columns, left = past/risk ([muted] tint), right = future/positive ([accent] tint)

[OPTIONAL — Micro decorations:]
- Micro decoration examples (tiny, jewel-like visual mnemonics):
    Beside "[Concept A]" — [visual description]
    Beside "[Concept B]" — [visual description]
    Each no larger than 8% of slide area, positioned in margins beside text.

[OPTIONAL — Product reference:]
- Product reference (bottom of style guide): small inset showing [product description].
  This is NOT [anti-pattern] — it is [correct characterization].
  This inset sets the product DNA reference for the entire deck.

Overall style: [1-2 sentence mood description].
[1 sentence about palette philosophy — what's included, what's excluded].
[1-2 sentences about visual surfaces, precision, light].
Typography is bold and hierarchical — title dominates.
This is a [deck type] for [audience], not a [what it's not].

No real company logo, no watermark, no page number, no draft label.
```

## 行业适配速查

上面的模板是通用的。如何填充取决于你的行业。以下是起点（不是处方——根据你的特定 product DNA 调整）：

| Industry | Background | Accent family | Mood keywords | Product reference |
|----------|-----------|---------------|---------------|-------------------|
| Precision manufacturing | Deep navy | Blue-cyan-teal | Swiss precision, jewel-like, specular | 微型精密零部件 at macro scale |
| Pharma / biotech | Clean white or warm off-white | Teal, blue-green | Clinical but warm, data-forward, clean | Lab glassware, molecular structure |
| Heavy industry | Dark charcoal | Safety amber, muted blue | Grounded, solid, structural | Large-scale component, material texture |
| Tech / SaaS | Dark mode (#0f172a) | Vibrant cyan, electric purple | Futuristic, geometric, crisp | Abstract data viz, UI-inspired |
| Financial / professional | Deep navy or charcoal | Gold, muted teal | Conservative, structured, authoritative | Clean geometric forms, minimal ornament |
| Consumer / lifestyle | Warm neutral | Warm coral, soft amber | Approachable, human, emotional | Lifestyle product in natural light |
| Education / training | Clean light or soft dark | Accessible blue, warm accent | Structured, clear, not intimidating | Learning artifacts, clear diagrams |

## Style Master Prompt 里不要放什么

- **Slide content**——headlines, specific data points, narrative elements. Style master is style only.
- **References to specific slides**——"for slide 7, make the KPI card blue." 这属于 per-slide prompt.
- **关于 industry 或 company 的长篇 prose**——模型不需要 business case. 1-2 句 mood 足够了.
- **Requests for photo-realistic product photography**——style master 是 design reference, 不是 product catalog. Product reference inset 是小型的、示意性的.
- **Pixel values 或 absolute measurements**——模型无法解读 "46px at 1672x941 canvas." 用相对描述.
- **Requests for specific fonts by name**——"Source Sans Pro Black" 对 image model 没有意义. 描述 weight 和 character: "very bold, geometric sans-serif."

## 案例：某精密制造企业的 Style Master Prompt（带注释）

这是为一个 precision manufacturing client 生成 style master 的完整 prompt，带注释说明每部分的作用：

```
Design a visual style guide for a PowerPoint slide deck.
This is a reference image, not a slide itself.
[← Frame: meta, not content]

Show clearly:
- Color palette: 6 swatches with hex codes, labeled with their roles:
    Primary background: Deep Navy #0a1628
    Panel / surface: Steel Blue #1e3a5f
    Primary accent / positive: Cyan #06b6d4
    Highlight / emphasis: Electric Blue #3b82f6
    Contrast / depth: Teal #0d9488
    Text on dark: Near White #f0f4f8
    Secondary text: Pale Ice #e2e8f0
[← 7 swatches, all in blue-cyan-teal family. Every color has a role.]

- Typography: headline size sample (very large, bold, near-white),
  subtitle sample (medium, pale ice or cyan),
  body text sample (small, near-white, readable),
  KPI number sample (oversized, cyan or electric blue, dominant)
  — with visible size hierarchy between all four levels
[← Four samples must be in same frame. Sizes are relative, not pixel values.]

- Layout grid: a wireframe showing three zones:
    Top: Kicker label (small caps) + Title (large, full width)
    Middle: Main content zone (70% of height)
    Bottom: Insight callout bar (full width, cyan or electric blue)
[← Three zones with visual separation. Callout bar is a recurring element.]

- Component examples (small but readable):
    One KPI card: dark panel, oversized number in cyan, small label below
    One flow diagram: 3-4 nodes connected by arrows, navy nodes with white text
    One comparison layout: two columns, left = past/risk (steel blue tint),
      right = future/positive (cyan tint)
[← Three component patterns. Each teaches a visual pattern the model will reuse.]

- Micro decoration examples (tiny, jewel-like visual mnemonics for AI concepts):
    Beside "Analytic AI" — a tiny precision loupe/inspection lens
    Beside "Generative AI" — crystalline branching nodes
    Beside "AI Agents" — 3 interconnected autonomous nodes
    Beside "Data / API" — a fine semiconductor-like grid with data streams
    Each mnemonic is no larger than 8% of the slide area.
    Same Swiss precision aesthetic: geometric, jewel-like, fine lines.
[← Micro decorations because the deck introduces AI terms to manufacturing execs.]

- Product reference (bottom of style guide): small inset showing
  a precision micro fastener — jewel-like screw with mirror-polished surface,
  PVD-coated with subtle cyan-blue iridescence, rendered at macro scale.
  This is NOT an industrial bolt — it is a micro-precision component,
  smaller than a match head, capturing specular light like a watch component.
  This inset sets the product DNA reference for the entire deck.
[← Product DNA grounds the visual system in the client's physical reality.]

Overall style: Dark executive manufacturing. Deep navy background throughout.
Clean, confident, precision aesthetic — Swiss watchmaking meets semiconductor fabrication.
All colors stay within the blue-cyan-teal family. No warm tones.
Visual surfaces are jewel-like: mirror-polished, specular highlights, PVD color precision.
Typography is bold and hierarchical — title dominates.
This is a keynote for senior manufacturing executives, not a consumer product deck.
[← Mood: 4 sentences. Short. Specific. Includes what's excluded.]

No real company logo, no watermark, no page number, no draft label.
[← Exclusions: minimal but explicit.]
```

## 生成命令

> **prompt 是源文件,不是一次性输入。** 先把 style master 的 prompt 存成
> `2_backbone/visual-style/style-master-prompt.md`(和它生成的 `style_master.jpg` 放一起),
> 而不是塞进 `/tmp` 用完就丢。style_master 是 image-2 画出来的,它的 prompt 和每页 slide 的
> prompt 一样重要——画歪了要能回溯"当初拿什么 prompt 画的"。

Prompt 存好后，用框架统一 wrapper 生成 style master。它负责读取 prompt、加载 `.env`、桥接凭据变量并保存 trace：

```bash
uv run python _ppt_framework_v1/06_reference_scripts/generate_style_master.py \
  --run-dir deck_{NAME}/3_versions/v1 --resolution 2k
```

Style master 用 `2k` resolution——它是其他一切所 reference 的基础图像,quality matters。脚本自动处理 API submission、polling、downloading 和保存 trace file(`.apimart-task.json`)。生成后 `2_backbone/visual-style/` 里同时有:`style-master-prompt.md`(源 prompt)+ `style_master.jpg`(图)+ trace。

---

> **Next**: `04-iterate-review-lock.md` — 第一版 style master 很少是完美的。如何系统性审查、识别需要修复的问题、迭代直到值得 trust 到锚定整个 deck。
