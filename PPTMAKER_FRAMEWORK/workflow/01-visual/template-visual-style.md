---
title: '[项目名称] — Visual Style System'
stage: workflow/01-visual
position: template
type: template
summary: 填空模板。Agent 复制到 run bundle 并引导用户逐 section 填写。
depends_on:
- workflow/01-visual/README.md
feeds_into: []
agent_action: fill_template
---

# [项目名称] — Visual Style System

> 这个文件定义了 [PPT 名称 / 场次名称] 的完整 visual system。
>
> **如何使用这个文件：**
> - 生成 `style_master.jpg` 时，使用 Section 1 的 Style Master Prompt.
> - 写 `page_prompts.json` 时，参考 Section 6 的 Slide Type Templates.
> - 改变 visual direction 时，只编辑这个文件——所有 content files 引用它.
>
> **这个文件不含什么：** slide content、headlines 或 data points. 那些存放在独立的 slides 文件中.

---

## 1. Style Master Prompt

> [INSTRUCTION: 这是生成 `style_master.jpg` 的 meta-prompt.
> 填写所有 `[...]` 占位符. 使用时参见 `workflow/01-visual/` 中的方法论文件，
> 尤其是 `03-write-the-style-master-prompt.md`.
>
> 如果 deck 向 non-expert audience 引入 abstract/technical concepts，
> 保留 Micro Decorations 部分. 否则删除.
>
> 如果 client 有 physical product 且具有 distinctive visual character，
> 保留 Product Reference 部分. 否则（services, software 等）删除.
>
> 用单图生成 skill（`image2-imagegen`）生成。参见 `03-write-the-style-master-prompt.md` 的完整命令。
> ]

```
Design a visual style guide for a PowerPoint slide deck.
This is a reference image, not a slide itself.

Show clearly:
- Color palette: [4-8] swatches with hex codes, labeled with their roles:
    [角色1 — e.g., Primary background]: [名称] #[hex]
    [角色2 — e.g., Panel / surface]: [名称] #[hex]
    [角色3 — e.g., Primary accent / positive]: [名称] #[hex]
    [角色4 — e.g., Highlight / emphasis]: [名称] #[hex]
    [角色5 — e.g., Contrast / depth]: [名称] #[hex]
    [角色6 — e.g., Urgency signal]: [名称] #[hex]
    [角色7 — e.g., Text on dark]: [名称] #[hex]
    [角色8 — e.g., Secondary text]: [名称] #[hex]

- Typography: headline size sample (very large, bold, [text-color]),
  subtitle sample (medium, [secondary-color] or [accent-color]),
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

[INSTRUCTION: 只有当你的 deck 向不熟悉这些概念的观众引入 abstract/technical
concepts 时，才保留以下 Micro Decorations 部分。否则删除整个部分。]

- Micro decoration examples (tiny, jewel-like visual mnemonics for
  [领域 — e.g., AI concepts / data concepts / technical terms]):
    Beside "[概念A]" — [视觉描述 — e.g., a tiny precision loupe]
    Beside "[概念B]" — [视觉描述 — e.g., crystalline branching nodes]
    Beside "[概念C]" — [视觉描述]
    Beside "[概念D]" — [视觉描述]
    Each mnemonic is no larger than 8% of the slide area — purely decorative,
    positioned in margins beside text.
    Same [product DNA aesthetic] — [描述词: geometric, fine lines, specular highlights].

[INSTRUCTION: 只有当 client 有 physical product 且具有 distinctive visual DNA 时，
才保留以下 Product Reference 部分。services/software/abstract 删除。]

- Product reference (bottom of style guide): small inset showing
  [在 macro scale 下的产品描述 — size, material, surface finish, key visual details].
  This is NOT [反面模式 — e.g., an industrial bolt] — it is
  [正确特征 — e.g., a micro-precision component, smaller than a match head].
  This inset sets the product DNA reference for the entire deck.

Overall style: [1-2 句 mood 描述].
[1 句关于 color family philosophy — 包含什么，排除什么].
[1-2 句关于 visual surfaces, precision, light 的描述].
Typography is bold and hierarchical — title dominates.
This is a [deck type] for [audience 描述], not a [它不是什么的描述].

No real company logo, no watermark, no page number, no draft label.
```

---

## 2. Color System — [色系名称]

> [INSTRUCTION: 定义 4-8 种颜色。每种颜色需要：a role（它做什么）、
> 一个人类可读的名称、一个 hex code、一个 usage description（在哪里出现）。
>
> 颜色应该感觉彼此归属。Single-family palettes
> （全 blues、全 earth tones、全 grays）更安全、更 cohesive。
> Multi-family palettes（blue + amber + green）需要 strong semantic role
> differentiation 才能感觉 intentional.
>
> 详细指导参见 `02-design-the-visual-system.md` Dimension 1.]

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现——要具体] |
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现] |
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现] |
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现] |
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现] |
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现] |
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现] |
| **[角色]** | [名称] | `#[hex]` | [这种颜色在哪里出现] |

### Color Philosophy（色板哲学）

[1-2 段解释 palette 的逻辑：

- 这是 single-family 还是 multi-family palette？为什么？
- 颜色逻辑——来源于 product DNA？Industry convention？Audience expectation？
- 哪些颜色被刻意排除，为什么？
- 颜色在一起应该感觉如何？Relatives？Contrasts？Complements？

示例（来自一个 precision manufacturing deck 的实际写法）：
"This is a single-family palette. The colors are relatives, not strangers.
Deep Navy → Steel Blue is depth and surface within the same blue.
Cyan → Electric Blue is two intensities of the same energy.
No color should feel like it jumped in from a different deck."]

### Color Roles in the Narrative（叙事中的颜色角色）

> [INSTRUCTION: 把每种颜色映射到它的 SEMANTIC meaning. 观众潜意识中学会
> 这些关联——"cyan = good news"——含义必须在所有 slides 中保持一致.
> 这是让 deck legible 的核心.]

- **[颜色名] + [文字颜色]** — [角色：neutral background + text，始终存在]
- **[颜色名]** — [角色：e.g., 公司现有的 strengths, physical assets]
- **[颜色名]** — [角色：e.g., customer outcomes, positive results, "if we do this"]
- **[颜色名]** — [角色：e.g., data layer, analysis zone, 正在被评估的东西]
- **[颜色名]** — [角色：e.g., critical attention points, "don't miss this" — 少量使用]
- **[颜色名]** — [角色：e.g., structural surfaces, cards, containers]

---

## 3. Typography Scale（字体层级）

| Level | Size (relative) | Weight | Color | Usage |
|-------|----------------|--------|-------|-------|
| **Kicker** | XS, all caps | Medium | [Accent color] | [Title 上方的 section label — e.g., "IMPACT 1", "SESSION 2"] |
| **Title** | XL | Bold/Black | [Primary text] | [Slide 的唯一 claim——占主导地位，占据上方 20%] |
| **Body** | S–M | Regular | [Primary text, ~80% opacity] | [Supporting text, 每个 zone 最多 3-4 行] |
| **KPI Number** | XXL | Black/ExtraBold | [Accent color] | [Dominant metric——后排可读] |
| **Callout** | S | Medium | [Text on accent bar] | [Bottom insight sentence——management takeaway] |
| **Label** | XS | Regular | [Primary text, ~60% opacity] | [Chart labels, node labels, annotations] |

### Typography Rules（字体规则）

- [规则1: e.g., Title 必须是仅次于 KPI numbers 的最大可读文本元素]
- [规则2: e.g., 同一个 hierarchy level 上不超过 2 个 font sizes]
- [规则3: e.g., KPI numbers 应该感觉是 body text 的 3-4 倍大]
- [规则4: e.g., 大多数 slides 保持在 40 words 以下，不包括 KPI labels 和 node text]
- [规则5: e.g., title/statement/KPI slides 理想密度 25-35 words]
- [规则6: e.g., evidence/framework slides 可达 50 words，但只能是 labels/cards/nodes——never paragraphs]

---

## 4. Layout Grid（布局网格）

每一页 slide 使用 2-3 种 layout modes 之一：

### Mode A: Full-Width Statement（全宽陈述）

```
┌─────────────────────────────────────────┐
│ KICKER LABEL                            │
│ Title: The main claim of this slide     │
├─────────────────────────────────────────┤
│                                         │
│   Main visual / diagram / big number    │
│   (full width, ~60% of slide height)    │
│                                         │
├─────────────────────────────────────────┤
│ Bottom callout: Management implication  │
└─────────────────────────────────────────┘
```
*用于：[什么时候用 — e.g., opening statements, single data points, transition slides]*

### Mode B: Left Data / Right Visual（左数据 / 右视觉）

```
┌──────────────────┬──────────────────────┐
│ KICKER LABEL     │                      │
│ Title (full      │  Supporting visual   │
│ width, top)      │  or diagram          │
├────────┬─────────┤  (right 45%)         │
│ KPI 1  │ KPI 2   │                      │
│ KPI 3  │ KPI 4   │                      │
├────────┴─────────┴──────────────────────┤
│ Bottom callout                          │
└─────────────────────────────────────────┘
```
*用于：[什么时候用 — e.g., data-heavy slides, competitive comparison, evidence slides]*

### Mode C: Flow / Framework（流程 / 框架）

```
┌─────────────────────────────────────────┐
│ KICKER LABEL                            │
│ Title: Framework or process claim       │
├─────────────────────────────────────────┤
│                                         │
│  [Node A] ──→ [Node B] ──→ [Node C]    │
│     ↓              ↓            ↓       │
│  [label]        [label]     [label]     │
│                                         │
├─────────────────────────────────────────┤
│ Bottom callout                          │
└─────────────────────────────────────────┘
```
*用于：[什么时候用 — e.g., process flows, before/after, causal chains, frameworks]*

---

## 5. [可选] Micro Decoration System — [领域] Concept Mnemonics

> [INSTRUCTION: 只有当 deck 引入观众可能无法仅从文字理解的 abstract/technical
> concepts 时，才保留整个这一节. 例如：AI 术语、technical architecture、
> 包含陌生术语的 management frameworks.
> 对于 standard business decks（quarterly reviews, sales updates,
> project status），**删除整个这一节.**
>
> 详见 `02-design-the-visual-system.md` Dimension 5 的完整决策框架.]

### Design Rules（设计规则）

- **Size**: Never larger than 8-10% of slide area. 这些是 decorations，不是 main visuals.
- **Position**: 在 margin 中，beside or below the relevant term. Never center-stage.
- **Style**: 与 product DNA 共享同样的 [aesthetic]——[geometric, fine lines, specular highlights, accent-color detailing].
- **Consistency**: 同一个 concept 在所有 slides 中始终使用同一个 visual symbol. 这为观众构建 visual vocabulary.
- **Behavior**: 如果 concept 是 slide claim 的核心，同时展示 margin 中的 small mnemonic 和 main composition 中 "acting" 的 concept.

### Concept → Visual Mnemonic Map（概念→视觉符号映射表）

| Concept | Visual Mnemonic | Rendering Description |
|---------|----------------|----------------------|
| **[概念1]** | [符号名称] | [如何渲染 — materials, colors, key visual details] |
| **[概念2]** | [符号名称] | [如何渲染] |
| **[概念3]** | [符号名称] | [如何渲染] |
| **[概念4]** | [符号名称] | [如何渲染] |
| **[概念5]** | [符号名称] | [如何渲染] |
| **[概念6]** | [符号名称] | [如何渲染] |
| ... | ... | ... |

### When To Use（何时使用）

- **Always**: 任何 [领域] term 在 deck 中第一次出现时
- **Always**: 在 comparison layouts 中的 abstract concepts 旁
- **Always**: 在代表 [领域] capabilities 的 framework nodes 旁
- **Optional**: 在 concept 已在前面介绍过的 data-heavy slides 上
- **Never**: 一个 slide 上四个或更多 different mnemonics（除非明确是 multi-card grid）

### Anti-Patterns（反模式）

- 与 main visual 竞争的 large illustrations
- Clip-art style icons——必须共享 product DNA 的 geometric precision
- 同一个 concept 在不同 slides 上使用不同 symbols
- Mnemonics 放在 center-stage 或覆盖 main KPI/framework

### Deck-Specific First-Exposure Checklist

> [INSTRUCTION: 列出第一次出现时 **必须** 有 visual mnemonic 的 concepts.
> 这些是你的观众从先前上下文中不会知道的术语.]

- **[Session/Section 1]**: [概念A], [概念B], [概念C]
- **[Session/Section 2]**: [概念D], [概念E], [概念F]

---

## 6. Slide Type Templates（页面类型模板）

> [INSTRUCTION: 定义 6-10 种 recurring slide types. 每个 type template 是一个 prompt
> fragment，在构建 page_prompts.json 时与 slide-specific content 合并.
> 每个 template 必须包含 "Use the reference style master exactly" 和
> layout mode specification.]

### Type Crosswalk（类型对照）

> [INSTRUCTION: 如果你的 slide content files 使用的标签与下面模板不同，
> 在这里创建映射表.]

| Slide file label | Base template |
|-----------------|---------------|
| [标签] | [模板名] |
| [标签] | [模板名] |

---

### TYPE: Title / Section Divider（标题 / 章节分隔）

```
Design a finished 16:9 [aspect ratio] [deck type] slide image.

Use the reference style master exactly — [background color], [text color] typography, [accent] accents.
Kicker: [SESSION LABEL]
Title: [主标题]
Subtitle: [一句话定位]

Main visual anchor: [描述强化主题的 abstract or concrete visual].
Composition: title dominant, visual anchor fills [left/right/center],
generous safe margins.

No logos, watermarks, page numbers, source notes, draft labels.
```

### TYPE: Anchor / Framing（锚点 / 破题）

```
Design a finished 16:9 [deck type] slide image.

Use the reference style master exactly.
Kicker: [KICKER]
Title: [the framing question or anchor statement]

Main layout: Mode A (full-width statement).
Center of slide: one dominant visual metaphor — [描述视觉].
Below or beside: one bold statement line in oversized [text color] text:
"[exact quote or statement]"

Bottom callout bar ([accent]): [management implication sentence]

No logos, watermarks, page numbers, source notes.
```

### TYPE: Concept Split（概念对比 — Left vs Right）

```
Design a finished 16:9 [deck type] slide image.

Use the reference style master exactly.
Kicker: [KICKER]
Title: [comparison claim]

Main layout: two-column comparison.
Left column ([muted panel color], label: "[LEFT LABEL]"):
  - Icon or small visual: [描述]
  - 2-3 bullet lines: [exact text]
  - Status tag: "[tag text]" in [color]

Right column ([accent border or tint], label: "[RIGHT LABEL]"):
  - Icon or small visual: [描述]
  - 2-3 bullet lines: [exact text]
  - Status tag: "[tag text]" in [color]

Bottom callout bar ([color]): [一句话总结关键区别]

No logos, watermarks, page numbers, source notes.
```

### TYPE: Impact / Evidence（影响 / 证据 — 数据密集型）

```
Design a finished 16:9 [deck type] slide image.

Use the reference style master exactly.
Kicker: [KICKER]
Title: [impact claim]

Main layout: Mode B (left data, right visual).
Left side — KPI cards (dark panels):
  Card 1: oversized number "[stat]" in [accent], label "[label]", note "[context]"
  Card 2: oversized number "[stat]" in [secondary color], label "[label]", note "[context]"
  Card 3 (optional): "[stat]", label "[label]"

Right side: [描述 supporting visual — diagram, comparison, flow]

Bottom callout bar ([根据信息性质选颜色 — threat vs. opportunity]):
  [one sentence implication]

No logos, watermarks, page numbers, source notes.
```

### TYPE: Framework（框架 — 3 或 4 个支柱）

```
Design a finished 16:9 [deck type] slide image.

Use the reference style master exactly.
Kicker: [KICKER]
Title: [framework claim]

Main layout: Mode C (flow/framework).
Show [3 or 4] pillars or nodes arranged [horizontally / as a pyramid / as interconnected circles]:
  Node 1 ([color] panel): "[label]" — "[1-line description]"
  Node 2 ([color] panel): "[label]" — "[1-line description]"
  Node 3 ([color] panel): "[label]" — "[1-line description]"
  Node 4 ([color] panel, if present): "[label]" — "[1-line description]"

Connecting element: [arrows / flow lines / foundation bar]

Bottom callout bar ([color]): [the integrated message]

No logos, watermarks, page numbers, source notes.
```

### TYPE: Competitor / External Threat（竞争 / 外部威胁）

```
Design a finished 16:9 [deck type] slide image.

Use the reference style master exactly.
Kicker: [KICKER — e.g., "COMPETITORS ARE MOVING"]
Title: [threat claim]

Main layout: Mode B or stacked cards.
Show 2-3 competitor cards ([panel color] with [accent] border):
  Company 1 — "[name]": [key data point] | [what it means]
  Company 2 — "[name]": [key data point] | [what it means]
  Company 3 (optional) — "[name]": [key data point] | [what it means]

Urgency element: [urgency signal — e.g., countdown clock, timeline]
with label "[time constraint]"

Bottom callout bar ([urgency color]): [一句话总结竞争风险]

No real company logos. Use stylized name labels only. No watermarks, page numbers, source notes.
```

### TYPE: Clock / Deadline（倒计时 / 截止日期）

```
Design a finished 16:9 [deck type] slide image.

Use the reference style master exactly.
Kicker: THE CLOCK IS TICKING
Title: [urgency claim]

Main layout: Mode A or timeline.
Visual anchor: a bold timeline running left (past) to right (future),
with 3-4 milestone markers in [accent]:
  "[date]: [event]" — style each milestone as a bold vertical tick with label

Below timeline or beside it: one dominant statement in oversized [text color]:
"[exact deadline consequence sentence]"

Bottom callout bar ([urgency color]): [不作为的代价]

No logos, watermarks, page numbers, source notes.
```

### TYPE: Closing / Transition（收束 / 过渡）

```
Design a finished 16:9 [deck type] slide image.

Use the reference style master exactly.
Kicker: [CLOSE LABEL]
Title: [closing statement or bridge question]

Main visual: [描述 visual metaphor — 常见的是 product DNA + data/insight overlay].
Below title: one or two lines of large [text color] text:
"[memorable closing line]"
"[bridge to next session or section]"

Bottom callout bar ([accent]): [the call to action]

No logos, watermarks, page numbers, source notes.
```

---

## 7. Deck-Wide Constraints — `deck_system.txt`

> [INSTRUCTION: 这一节的内容成为 `deck_system.txt` 的实际内容，
> 由 Stage 1 读取并整体组装进每页最终 prompt。System text 处理
> TEXTUAL constraints（language, forbidden elements, tone），
> 而 style master 处理 VISUAL constraints（colors, typography, layout）.
> 两者协同工作.]

```
LANGUAGE: [语言政策 — e.g., "English only. No Chinese text on slides."]
DECK TYPE: [描述 — e.g., "Dark executive keynote for senior manufacturing management."]
BACKGROUND: [颜色和规则 — e.g., "Deep navy #0a1628 on every slide, no exceptions."]
COLOR FAMILY: [哪些颜色允许，哪些 FORBIDDEN.
  e.g., "Blue-cyan-teal only. No warm tones: no amber, orange, red, coral, gold, yellow."]
TEXT DENSITY: [字数规则.
  e.g., "Most slides stay under 35 readable body words.
  Complex evidence/framework slides may reach 50 words only as short labels/cards/nodes.
  Never use paragraphs on generated slide images."]
FORBIDDEN: [全面清单.
  e.g., "Company logos, watermarks, page numbers, source notes, draft labels,
  stock photo people, clip art, decorative warm colors, gradient orbs,
  large rough industrial [反面产品意象]."]
TONE: [描述.
  e.g., "Confident, precise, industrial. Think [product DNA aesthetic].
  Not [相邻但错误的 aesthetic — e.g., not heavy industry, not construction, not consumer]."]
PRODUCT DNA: [如适用——products 出现时应该是什么样.
  e.g., "When showing parts, use [scale]-scale [aesthetic]: [specific products],
  [surface finish], [scale cues]. Never show [反面产品意象]."]
CONSISTENCY: [consistency 对这个 deck 意味着什么.
  e.g., "Every slide must feel like it belongs to the same visual system as the style master.
  Color roles must stay consistent: [color] = [semantic meaning],
  [color] = [semantic meaning], etc."]
KPI NUMBERS: [如何处理 metrics.
  e.g., "When a slide has a dominant metric, make it oversized (3-4x body text)
  and color it [accent] (positive outcome) or [highlight] (attention)."]
CALLOUT BAR: [callout bar 规则.
  e.g., "Every slide must end with a full-width bottom callout bar
  containing one management implication sentence.
  Use [accent colors] depending on semantic role."]
NUMBERS: [取整策略.
  e.g., "Use order-of-magnitude precision. Round numbers so they feel credible.
  Never use decimal places on percentages."]
```

---

## 8. Change Log（变更日志）

| Date | Change | Reason |
|------|--------|--------|
| [日期] | Initial version | [项目上下文——这套 visual system 是为哪个 deck 创建的] |

> 改变 visual direction：编辑 Sections 1-7，regenerate `style_master.jpg`，
> 如果变化显著，在 change log 中添加一行.
> Content files（slides）不需要改变，除非 visual rules 影响了它们的
> layout 或 color assignments.
