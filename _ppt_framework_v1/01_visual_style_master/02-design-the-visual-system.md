---
title: 02 — Design the Visual System（设计视觉系统）
stage: 01_visual_style_master
position: 03 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 01_visual_style_master/README.md
- 01_visual_style_master/01-gather-product-context-dna.md
feeds_into:
- 01_visual_style_master/03-write-the-style-master-prompt.md
agent_action: ask_questions
---

# 02 — Design the Visual System（设计视觉系统）

> 设计阶段。把 Stage 1 的研究翻译成 structured visual system specification，覆盖五个 dimension：color、typography、layout、components、micro decorations。

---

**Navigation**: ← `01-gather-product-context-dna.md` | Next → `03-write-the-style-master-prompt.md`

---

## Visual System 作为 Contract（契约）

一套 visual system 是一组 **constrained choices（被约束的选择）。** 约束创造 consistency。设计师的工作是在五个 dimension 的每一个中做出 deliberate, documented choices。Deck 中的每一页 slide 都将 conform to these constraints.

Style master image（在 Stage 3 生成）是这个 contract 的 **visual representation**。Markdown 文件（`visual-style.md`）是 **textual specification**。两者必须相互一致。Markdown 定义 rules；style master image 视觉化地展示它们。

如果你改变了对某个颜色或 layout rule 的想法：先更新 markdown，再 regenerate style master。永远不要只编辑 image 来 "fix" 东西——markdown 是 source of truth。

## Dimension 0: Medium（媒介 —— 先于颜色决定）

**这是第 0 个 dimension，必须先于 Color 决定。** 最常见的返工来自跳过它：直接选了一个色板方向（"就用 Warm Editorial 吧"）就去生成 style master，结果产出一张"色块+字体排版参考板"，而用户其实想要的是"素描画风的视觉系统"。色板只回答"用什么颜色"，medium 回答**"用什么媒介把内容画出来"**——这是更根本、且必须先定的一层。

**选择 medium（画风）：**

| Medium | 长什么样 | 最适合 |
|--------|---------|--------|
| Sketch / Etching | 手绘线条、蚀刻质感、editorial 插画 | 抽象概念、方法论、人文/思想类内容 |
| Flat Diagram | 扁平几何、图解、schematic | 流程、系统、架构、数据关系 |
| Photography | 实拍/摄影合成 | 有实体产品、品牌故事、场景感 |
| 3D Render | 三维渲染、材质光影 | 硬件、未来感、产品可视化 |
| Mixed | 上述组合（如 diagram 主体 + 摄影锚点） | 复杂 deck，不同 block 需要不同表达 |

**如何选：从 product DNA 推导（见 `01-gather-product-context-dna.md` 的 medium 线索）。** 抽象概念/没有实物 → sketch/illustration；流程/系统 → diagram；实体产品 → photography；硬件/未来感 → 3D。

**两条铁律：**
- **Medium before color.** 先定画风，**再**从画风推导色板（下面 Dimension 1）。不是先选色板再想画什么。
- **Don't ask the user to confirm what they can't see.** 让用户在**画风之间**做选择题（描述或给参考图），而不是在色板之间——他们看色板方向时分辨不出"素描 vs 矢量图解"。

**产出**：一句 medium 声明（如 "Etched line-art illustration, single-family cool palette"），写进 `visual-style.md` 顶部；它约束后面所有 dimension，也是每页 IMAGE PROMPT 的画风基准。

## Dimension 1: Color Palette（色板）

> **前提：Dimension 0 的 medium 已锁定。** 色板是从 medium 推导的——同样"蓝青色系"，在 etching 画风和 3D 渲染下是完全不同的成片。先有画风，再谈颜色。

### Single-Family vs. Multi-Family

**Single-family palette**（全 blue-cyan、全 earth tones、全 grays）：创造 visual calm 和 precision。每种颜色都是其他颜色的 relative。变化来自 brightness 和 saturation，而非 hue shifts。**最适合：** 需要感觉 cohesive、precise、restrained 的 deck。例如某精密制造企业的 deck——所有颜色都在 blue-cyan-teal spectrum 内。

**Multi-family palette**（blue + amber + green、navy + gold + coral）：创造 contrast 和 signal differentiation。每种颜色承担 distinct semantic role。变化同时来自 hue 和 brightness。**最适合：** 需要强 "this vs. that" visual signals 的 deck，或多个独立概念需要 distinct color identities 时。

**如何选择：** 看你的 product DNA。产品暗示什么 color family？PVD-coated micro fastener 暗示 blue-cyan。Copper component 暗示 warm metallics。Pharmaceutical product 可能暗示 clean whites with teal accents。让 product 引导选择。

### Semantic Color Roles（颜色的语义角色）

Palette 中的每种颜色必须有**一致的 semantic role**，在所有 slides 之间永不改变。观众在潜意识中学会 "cyan means good news"，这个认知贯穿整个 presentation。

**先定义 roles，再分配 colors：**

| Role | 典型用法 | 示例（某精密制造企业） |
|------|---------|---------------------|
| Background | Every slide | Deep Navy `#0a1628` |
| Panel / card surface | Content containers | Steel Blue `#1e3a5f` |
| Positive / outcome accent | Wins, results, callout bars | Cyan `#06b6d4` |
| Emphasis / highlight | Key metrics, strengths | Electric Blue `#3b82f6` |
| Contrast / depth | Secondary analysis, differentiation | Teal `#0d9488` |
| Urgency / attention | "Pay attention here" — sparingly | Ice Blue `#bae6fd` |
| Primary text | All body text on dark backgrounds | Near White `#f0f4f8` |
| Secondary text | Supporting labels, annotations | Pale Ice `#e2e8f0` |

**四到六种颜色是 sweet spot。** 少于 4 = semantic differentiation 不足。多于 6 = 观众无法跟踪含义。某精密制造企业 deck 的 8 种颜色接近上限，且只有在所有颜色保持 single-family 时才成立。

### Color Philosophy Paragraph（色板哲学段）

写 1-2 段解释 palette 的逻辑。这帮助你（和任何协作者）理解 WHY 选这些颜色，防止后续 drift。例如某精密制造企业的 color philosophy：

> "This is a single-family palette. The colors are relatives, not strangers: Deep Navy → Steel Blue is depth and surface within the same blue. Cyan → Electric Blue is two intensities of the same energy, one calm, one bright. Teal bridges blue and green, adding subtle warmth without leaving the family. No color should feel like it jumped in from a different deck."

### 要避免什么

- **One-hue gradients**——所有 slide 都是同一个颜色加上轻微的亮度变化。视觉扁平，语义无用。
- **Colors without roles**——palette 中每种颜色必须有 specific, named job。如果你说不出 role，移除这个颜色。
- **Role conflicts**——不要在一个 slide 上把同一个颜色用作 "positive outcome"，在另一个 slide 上用作 "warning"。

## Dimension 2: Typography Scale（字体层级）

### The Hierarchy Table（层级表）

定义 5-6 个 level。Size 是**相对的**（XS 到 XXL），不是 absolute pixels——style master image 会展示实际的比例。

| Level | Size | Weight | Color | Usage |
|-------|------|--------|-------|-------|
| Kicker | XS, all caps | Medium | Accent color | Section label above title（"IMPACT 1", "SESSION 2"） |
| Title | XL | Bold/Black | Primary text | Slide 的唯一 claim——占主导地位 |
| Body | S–M | Regular | Primary text (80% opacity) | Supporting text, 每个 zone 最多 3-4 行 |
| KPI Number | XXL | Black/ExtraBold | Accent color | Dominant metric——后排可读 |
| Callout | S | Medium | Text on accent bar | Bottom insight sentence——management takeaway |
| Label | XS | Regular | Primary text (60% opacity) | Chart labels, node labels, annotations |

### Typography Rules（字体规则）

- Title 必须是仅次于 KPI numbers 的最大可读文本元素
- 同一个 hierarchy level 上不超过 2 个 font sizes
- KPI numbers 应该感觉是 body text 的 3-4 倍大
- 大多数 slides 保持在 40 words 以下，不包括 KPI labels 和 node text
- 理想密度：title/statement/KPI slides 25-35 words；evidence/framework slides 可达 50 words，但 text 必须压缩为 short labels、cards 或 nodes——never paragraphs

### 如何映射到 Style Master

Style master image 必须在**同一帧中**展示所有 size levels，这样模型才能 visual 地学习这些比例。KPI number 在 body text 旁边以实际比例大小展示，教给模型的 hierarchy 远比任何文字描述精确。

## Dimension 3: Layout Grid（布局网格）

定义 **2-3 种 layout modes**，在整个 deck 中重复使用。每一页 slide 使用其中一种 mode。重复创造 visual rhythm；少量模式防止 chaos。

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
*用于：opening statements, single powerful data points, transition slides, closing statements.*

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
*用于：data-heavy slides, competitive comparison, evidence slides, impact pages.*

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
*用于：process flows, before/after comparisons, causal chains, 3-4 pillar frameworks.*

### Mode Selection（模式选择）

- **Statement slides**（opening, closing, key claims）→ Mode A
- **Evidence slides**（data, comparison, proof）→ Mode B
- **Explanation slides**（process, framework, how-it-works）→ Mode C

大多数 deck 的构成：60% Mode B, 25% Mode C, 15% Mode A.

## Dimension 4: Component Patterns（组件模式）

Components 是填充每个 layout mode 的 recurring visual elements。Style master 必须展示每种 component 的小型但可读的示例。

### KPI Card

```
┌──────────────────┐
│                  │
│     ╔══════╗     │  ← dark panel (steel blue)
│     ║ 73% ║     │  ← oversized number in accent color (cyan)
│     ╚══════╝     │
│   B2B buyers     │  ← small label below
│   use AI search  │
└──────────────────┘
```

定义：card background color、border style（如有）、number color 和 relative size、label position 和 color。

### Comparison Layout（对比布局）

两列——left = past/risk（muted 或 steel blue tint）、right = future/positive（cyan tint 或 accent border）。每列有自己的 label、2-3 条 bullet lines 和 status tag。

定义：column proportions、column background tints、border treatment、status tag style。

### Flow Diagram（流程图）

3-4 个 connected nodes 和 directional arrows。Nodes 共享相同的 shape、size 和 text treatment。Arrows 共享相同的 style 和 thickness。

定义：node shape（rounded rectangle? circle? hexagon?）、node color、arrow style、connector thickness、label placement。

### The Key Insight（关键洞察）

**Components are the most important part of the style master**，因为它们是模型最频繁复现的东西。如果模型在 style master 中看到一个 KPI card 有特定的 border、shadow 和 label placement，它会在每一页 KPI slide 上复现那个确切的 pattern。如果 component example 是草率的，每一页 KPI slide 都会草率。

## Dimension 5: Micro Decorations（微装饰）— 需要时才用

### 什么时候需要

当 deck 引入**观众可能无法仅从文字理解的抽象概念**时，加入 micro decorations（小型 visual mnemonics）。例如：
- AI 术语（Analytic AI, Generative AI, AI Agents, Digital Twin）
- 技术概念（Data Pipeline, API Layer, Machine-Readable Data）
- 包含陌生术语的管理框架（Digital Counterpart, Review Boundary）

### 什么时候不需要

对于概念已经熟悉的 straightforward business decks，跳过 micro decorations：quarterly reviews、sales targets、organizational updates、project status。当概念已经理解时，decoration 变成 visual noise。

### Design Rules（设计规则）

- **Size**: Never larger than 8-10% of slide area. 这些是 decorations，不是 main visuals.
- **Position**: 在 margin 中，beside or below the relevant term. Never center-stage.
- **Style**: 与 product DNA 共享同样的 geometric precision——fine lines, specular highlights, accent-color detailing.
- **Consistency**: 同一个 concept 在所有 slides 中始终使用同一个 visual symbol. 这为观众构建 visual vocabulary.
- **Behavior**: 如果 concept 是 slide claim 的核心，同时展示 margin 中的 small mnemonic 和 main composition 中 "acting" 的 concept.

### The Concept-to-Mnemonic Map（概念→符号映射表）

创建一张表。每个 abstract term 对应一个 visual symbol。示例（来自某精密制造企业的 AI 战略 deck）：

| Concept | Visual Mnemonic |
|---------|----------------|
| Analytic AI | Precision loupe / inspection lens |
| Generative AI | Crystalline branching nodes |
| AI Agents | 3 interconnected autonomous nodes with directional arrows |
| Data / API | Fine grid with connecting data streams |
| AI Filter | Geometric aperture / precision sieve |
| Digital Twin | Overlapping translucent geometric shapes |
| Supply Chain | Fine interconnected chain links at micro scale |

### Anti-Patterns（反模式）

- 与 main visual 竞争的 large illustrations
- Clip-art style icons——必须共享 product DNA 的 geometric precision
- 同一个 concept 在不同 slides 上使用不同 symbols
- 一个 slide 上四个或更多不同的 mnemonics（除非明确是 multi-card grid）

## 产出物

一份完整的 visual system design。至少包含：
- Color palette table，带 roles、names、hex codes 和 usage
- Color philosophy paragraph
- Typography hierarchy table，带 size、weight、color 和 usage
- 2-3 种 layout modes 带 ASCII wireframes
- Component pattern definitions（KPI card、comparison、flow diagram）
- Micro decoration map（如需要）
- Typography rules 和 text density policy

这成为 Stage 3（写 style master prompt）和填充 `template-visual-style.md` 的 raw material。

---

> **Next**: `03-write-the-style-master-prompt.md` — 如何将你的 visual system design 组装成生成 `style_master.jpg` 的 meta-prompt。
