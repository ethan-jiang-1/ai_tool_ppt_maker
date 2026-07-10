---
title: 01 — Gather Context DNA（收集上下文基因）
stage: workflow/01-visual
position: 02 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/01-visual/README.md
- workflow/01-visual/00-the-problem-why-text-fails.md
feeds_into:
- workflow/01-visual/02-design-the-visual-system.md
agent_action: ask_questions
---

# 01 — Gather Context DNA（收集上下文基因）

> 研究阶段。在做任何设计决策之前，你需要 raw visual material。这个文件教你如何收集 visual system 将要表达的四个支柱——无论你的 client 是做什么的。

---

**Navigation**: ← `00-the-problem-why-text-fails.md` | Next → `02-design-the-visual-system.md`

---

## 为什么设计之前必须先做研究

视觉风格必须对 client 和 audience 来说是 **authentic（真实的）。** 一个 generic "dark corporate" deck 对任何公司都能用——但感觉不属于任何一家。目标是创建一套 visual system，它**只能**属于 THIS client, THIS context, THIS moment.

区分一个令人无感的 deck 和一个让人共鸣的 deck 的关键区别：**the deck feels like it was made FOR the audience, not adapted FROM a template.**

下面的四个支柱是你的 raw material。它们不需要 polished——它们需要**specific（具体）**和**visual（视觉化）。**

## The Four Pillars（四个支柱）

### Pillar A: What They Make — 找到属于这个 client 的"东西"

这是整套 visual system 最硬的 anchor。每个 client 都有一个"他们做的东西"——找到它，描述它的 visual character。

**不同 client 类型，找不同的"东西"：**

| Client 类型 | 找什么 | 关注什么 |
|------------|--------|---------|
| **制造实物产品** | 产品的 physical character | Scale, material, surface finish, geometry, light behavior |
| **软件 / SaaS** | 产品的 interface character | Visual density, spatial rhythm, typography, color logic, the "feel" of using it |
| **专业服务 / 金融** | 交付物的 intellectual character | Precision, structure, clarity, authority——visual equivalents of trust |
| **医药 / 生物** | 环境和过程的 character | Cleanliness, precision instruments, data density, the laboratory or clinical aesthetic |
| **消费品 / 零售** | 产品的 emotional character | Texture, warmth, lifestyle context, human presence, aspirational quality |
| **教育 / 培训** | 学习体验的 character | Clarity, structure, accessibility, progression——visual equivalents of "I understand this" |
| **政府 / 公共** | 服务的 civic character | Trust, stability, inclusivity, transparency——visual equivalents of public good |

**场景举例**

*场景：一家精密制造企业，核心产品是微型精密螺丝。*

在 macro scale（5-10 倍实际尺寸）下描述产品：0.6mm 直径（比芝麻还小），精细螺纹只有在放大镜下才可见，表面 mirror-polished 或 PVD coated，几何完美。决定性的一句话：

> "Jewel-like, not industrial. Think Swiss watch components, not construction bolts."

这句话驱动了整个视觉方向：dark navy backgrounds（像手表展示盒）、blue-cyan PVD color family、specular highlights、geometric perfection。

*场景：一家 SaaS 公司，做开发者工具。*

它的"产品"不是实物——是 CLI 界面、代码片段、terminal 里的彩色输出。Visual character 可能来源于：dark mode terminal backgrounds、syntax highlighting 的精确颜色逻辑、monospace typography 的节奏感、简洁到近乎 brutalist 的 UI。决定性的一句话可能是：

> "Terminal-native, not enterprise dashboard. Think developer tools, not business software."

这句话驱动了完全不同的视觉方向：dark charcoal backgrounds、green-cyan accent（来自 terminal syntax highlighting）、monospace-inspired typography hierarchy、sparse UI-like layouts。

*场景：一家医药公司，做无菌注射剂。*

产品是液体药物，在玻璃瓶中，在无菌环境中生产。Visual character 来源于：laboratory 的 clean white、玻璃和 stainless steel 的 specular reflections、chromatography 数据可视化中 teal/blue 的精确渐变。决定性的一句话可能是：

> "Clinical precision with warmth. Think laboratory, not hospital."

**关键产出：** 一句决定性的话。不是 paragraph，不是 mission statement。是一句 5-15 个词的话，捕捉这个 client 的 visual essence，同时隐含排除它不是什么。这句话是你的 visual direction 的 North Star。

### Pillar B: Industry Visual Language（行业视觉语言）

每个行业都有 visual conventions。它们不是必须盲从的 rules——而是需要理解的 context。你可以在其中运作（safe, expected, professional），也可以刻意打破它们（bold, but must be intentional）。

**常见行业模式（起点，不是规则）：**

| Industry | Typical palette | Typical mood | Visual cues |
|----------|----------------|-------------|-------------|
| Precision manufacturing | Dark blues, metallics, cool accents | Swiss precision, jewel-like, clean | Macro product shots, geometric edges, specular highlights |
| Pharma / biotech | Whites, teals, clean blue-greens | Clinical but warm, data-forward | Clean typography, data visualizations, subtle warmth |
| Heavy industry / construction | Dark grays, safety yellows, muted | Grounded, solid, durable | Large-scale product, structural weight, no decorative fluff |
| Tech / SaaS | Dark mode + vibrant accents | Futuristic but not sci-fi | Geometric abstractions, gradient accents, crisp UI-like layouts |
| Financial / professional | Navy + gold + white | Conservative, trust-signaling | Structured grids, minimal decoration, data-forward |
| Consumer / retail | Warm, approachable | Lifestyle, emotional | Lifestyle photography, warm lighting, human presence |
| Education / training | Clean light or soft dark | Structured, clear, not intimidating | Learning artifacts, clear diagrams, accessible hierarchy |

**关键洞察：** 在 precision manufacturing 案例中，blue-cyan-teal single-family palette 不是随意做的审美选择。它来源于产品——PVD-coated micro fasteners with subtle blue-cyan iridescence。产品决定色板。但同样的逻辑适用于任何行业：SaaS 开发者工具的 green-cyan accent 来源于 terminal syntax highlighting；医药公司的 teal accent 来源于 chromatography 数据可视化。

让 product 引导 palette，而不是反过来。

**从 DNA 推 medium（画风）——先于颜色的那一步。** 上表的 "Visual cues" 列其实指向一个比色板更根本的决定：**用什么媒介把内容画出来**。把这些线索抽象成一个明确的 medium 选择，它会成为 `02-design-the-visual-system.md` 的 **Dimension 0** 和每页 IMAGE PROMPT 的画风基准：

| Product DNA 信号 | 倾向的 medium |
|------------------|--------------|
| 抽象概念 / 方法论 / 没有实物产品 | Sketch / etching / editorial 插画 |
| 流程 / 系统 / 架构 / 数据关系 | Flat diagram / schematic |
| 实体产品 / 品牌 / 场景 | Photography（实拍或合成） |
| 硬件 / 未来感 / 需要材质光影 | 3D render |
| 复杂 deck，不同 block 需要不同表达 | Mixed（如 diagram 主体 + 摄影锚点） |

**两条铁律**：**Medium before color**（先定画风再配色，不是反过来）；**Don't ask the user to confirm what they can't see**（让用户在画风之间做选择题，不是在色板之间——他们看色板时分不出"素描 vs 矢量图解"）。medium 决策的完整方法见 `02-design-the-visual-system.md` 的 Dimension 0，Phase 2 的执行次序见 `AGENTS.md` §2.1a。

### Pillar C: Audience Expectations（听众预期）

谁在看这个 deck，他们期望什么样的 visual density？

**Executive audience**（常见于 keynote decks）：
- Sparse, confident slides——每页一个 claim
- Large numbers, minimal text
- Visual proof objects 锚定 claim
- 他们在扫描 judgment，不是 learning

**Technical audience**（常见于 deep-dive 或 training decks）：
- Denser, data-rich slides——evidence matters
- 更多文字可以接受，前提是 structured（cards, labels, callouts, never paragraphs）
- Diagrams 和 frameworks 承载论证

**Mixed audience**（很多 real-world decks）：
- Executive summary up front（sparse, confident claims）
- Evidence appendix or backup slides（denser, data-rich）
- 或者：每页一个 bold claim + 少量 supporting evidence cards

**需要考虑的文化信号：**
- Color meanings 在不同地区有差异
- Typographic density 偏好因语言而异
- Formal vs. informal tone 因行业和地区而异

**要回答的问题：** 当这个 deck 打开时，观众期望看到什么？什么会让他们说 "this doesn't feel right"？

### Pillar D: Reference Imagery（参考图像）

如果 client 有 physical product 且具有 distinctive visual character，在 style master 底部放一个小型的 **product reference inset**——不是 product photo，而是一个 visual DNA sample，展示 scale、surface finish、material 和 light behavior。面积不超过 style master 的 5-8%。

如果 client 没有 physical product（software、services 等），可以替换为：
- 一个 abstract visual marker，体现 brand character（如 geometric precision、data density、warmth）
- 或者直接省略——product reference inset 是完全可选的

如何获取或生成 reference image：
1. 从 client 网站、investor materials 或 technical documentation 找 reference
2. 或者：用 image generation model 基于 Pillar A 的 notes 生成 macro-scale rendering
3. 描述这个 inset 在 style master prompt 中应该 show 什么——scale、finish、light、what it is NOT

## 产出物

一份 research notes 文件。可以是非正式的。应该捕捉四个 pillars。不需要 structured 或 polished——需要**specific 和 visual.**

## 这个阶段的 Anti-Patterns（反模式）

- **在理解 client 之前就设计 palette。** 颜色会感觉 arbitrary，因为它们就是 arbitrary——不是从任何真实事物中推导出来的。
- **在没有 grounding 的情况下复制 generic 外观。** 会看起来像 template。
- **跳过 research 因为"这只是一份 slide deck"。** 这个阶段的工作是 visual differentiator。它让 deck 感觉 custom。跳过它短期零成本，长期付出全部 impact 代价。
- **把 logo colors 当作整个 palette。** Logos 是为 recognition 设计的，不是为 immersive visual environments 设计的。

---

> **Next**: `02-design-the-visual-system.md` — 现在你有了 raw material，如何设计 color palette、typography scale、layout grid、component patterns 和 micro decorations。
