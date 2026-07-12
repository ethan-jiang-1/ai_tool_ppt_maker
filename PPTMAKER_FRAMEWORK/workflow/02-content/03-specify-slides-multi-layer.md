---
title: 03 — Specify Slides with Multi-Layer Precision
stage: workflow/02-content
position: 04 of 06
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/02-content/README.md
- workflow/02-content/02-build-narrative-arc-blocks.md
feeds_into:
- workflow/02-content/04-create-content-assets.md
agent_action: ask_questions
---

# 03 — Specify Slides with Multi-Layer Precision

← [02](02-build-narrative-arc-blocks.md) | [Next →](04-create-content-assets.md)

## 一张 slide 不只是 "标题 + 内容"

大多数 slide brief 长这样：

> **Slide 5: Market Trends**
> — Show AI adoption statistics
> — Mention key drivers
> — Include a chart

这个 brief 有三个问题：
1. **它没有 claim**——"Market Trends" 是 topic，不是 argument。观众不知道你这张 slide 在主张什么。
2. **它模糊得无法执行**——"Show AI adoption statistics" 可以是任何东西。AI image model 需要知道 layout、focus、color semantics、element placement。
3. **它只有一层**——只有 "内容"，没有区分认知载荷、视觉执行、演讲者叙事。这三者服务于不同的消费者，需要不同的表达。

## 多层精确规格：四个独立层

好的 slide 规格有四个独立层。它们服务于不同的消费者，但必须互相一致：

| 层 | 消费者 | 回答的问题 | 形式 |
|---|--------|-----------|------|
| **Meta** | 你自己 + pipeline 脚本 | "这是什么类型的 slide？" | VISUAL TYPE + KICKER + TITLE |
| **Concept** | 你自己 + reviewer + 演讲者 | "这张 slide 要传递什么认知？" | 结构化段落：must/must not/bridge |
| **Image Prompt** | AI image model | "这张 slide 长什么样？" | 200-500 字精确视觉描述 |
| **Speaker Note** | 演讲者 | "站在旁边该说什么？" | 叙事流 + 术语解释 + takeaway |

### 为什么需要四层

如果你试图把四层内容塞进一个维度（比如一个很长的 "slide description"），你会：
- 让 AI model 困惑（它不需要知道演讲者说什么，只需要知道画面上有什么）
- 让演讲者无从下手（他不关心画面的 y 坐标，只关心叙事流）
- 让自己在 review 时迷失（你不知道该检查 "认知正确性" 还是 "视觉执行质量"）

四层独立让每个消费者得到精确的、不被无关信息干扰的输入。

## Layer 1: Meta — 识别层

```markdown
**VISUAL TYPE**: Concept Split
**KICKER**: TWO KINDS OF AI
**TITLE**: One kind improves efficiency. One changes market access.
**SUBTITLE**: (optional, only for dividers/closers)
```

### VISUAL TYPE

VISUAL TYPE 是一个标签，告诉 pipeline 脚本这张 slide 用什么模板渲染。常见类型：

| VISUAL TYPE | 描述 | 何时使用 |
|-------------|------|---------|
| `Title / Opener` | 全屏开场页 | Slide 01 |
| `Section Divider / Bridge` | 叙事转折页 | Block 之间 |
| `Concept Split` | 左右对比两个概念/场景 | "A vs B" 论证 |
| `Direction` | 提出一个方向/策略 | "我们应该做 X" |
| `Impact / Evidence` | 数据或时间压力 | 展示 urgency |
| `Framework` | 三要素/多要素框架 | "这个系统有三个组件" |
| `Case Anchor / Evidence` | 第三方案例 | 证据锚点 |
| `Flow / Mechanism` | 流程/机制展示 | "事情是这样运作的" |
| `Risk / 2 Panels` | 风险展示 | 诚实披露 |
| `Closer` | 结束页 | 最后一张 |

VISUAL TYPE 关联到视觉系统中的 Slide Type Template（参见 [workflow/01-visual](../01-visual/)）。如果你在 01 的视觉系统中定义了 8 种 slide type template，那么每张 slide 的 VISUAL TYPE 必须对应其中之一。

### KICKER

KICKER（也叫 section label）是一行短小的全大写文字，告诉观众 "你现在在哪个部分"。它通常放在 slide 的左上角或顶部。

KICKER 规则：
- 全大写，3-6 个词
- 不要写完整的句子——它是一个标签，不是一个 claim
- 同一个 Block 内的 slides 可以使用相同的 KICKER（标识它们属于同一组）
- 不要每张 slide 换一个不同的 KICKER——那会让观众困惑

T10 案例的 KICKER 例子：
- `TWO KINDS OF AI`（概念对比）
- `COMPOUNDING CAPABILITIES`（能力累积）
- `ALREADY IN THE CUSTOMER WORKFLOW`（已经在流程中）
- `MAKE ME VISIBLE`（Block 3 Growth 方向）
- `MAKE ME TRUSTWORTHY`（Block 3 Efficiency 方向）
- `THE CLOCK IS TICKING`（urgency）

### TITLE/CLAIM

TITLE 是这张 slide 的核心主张。它不是 topic label（"Market Trends"），而是一个**完整的、可争论的 claim**。

对比：
- ❌ "AI Market Trends"（topic，不是 claim）
- ❌ "AI is growing fast"（vague，无法争论）
- ✅ "One kind improves efficiency. One changes market access."（具体的、可争论的区分）

TITLE 规则：
- 是一个完整的句子，可以被同意或反驳
- 不超过 15 个英文单词（观众要能在 5 秒内读完）
- 如果两张 slide 的 TITLE 可以互换位置而不影响叙事，那么至少有一张的 TITLE 不够 precise

## Layer 2: Concept — 认知载荷层

CONCEPT 层是给人类读的——你自己、reviewer、演讲者。它定义这张 slide 要传递的认知内容。

```markdown
**CONCEPT**:
- MUST communicate: [核心认知载荷——观众必须带走什么]
- MUST NOT do: [不应该产生的误解——反模式]
- Bridge from previous: [怎么从上一张 slide 过渡过来]
- Bridge to next: [怎么过渡到下一张 slide]
- Content structure: [内容的逻辑结构——对比？流程？三要素？]
```

### MUST communicate

用 2-3 句话描述这张 slide 的核心认知载荷。关键测试：如果观众只记住一件事，应该是这件事。

T10 案例（Slide 08 Growth Direction）：
> MUST communicate: Growth happens through TWO distinct mechanisms — holding today's customers (relationship-driven) vs finding tomorrow's customers (data-driven). The key insight: your existing relationship protects current revenue, but it won't get you discovered by new buyers. For that, you need machine-readable data.

### MUST NOT do

定义反模式——观众可能会产生的误解。这很重要因为在 high-stakes presentation 中，**被误解比不被理解更危险**。

> MUST NOT: Suggest that relationship is unimportant. The message is BOTH matter but for DIFFERENT purposes. Also must NOT imply this is a "marketing" function — data-driven discovery applies to procurement engineers searching for precision components, not marketers optimizing SEO.

### Bridge

每张 slide 在叙事中是一个节点——它从上一张 slide 承接 momentum，向下一张 slide 传递 momentum。

> Bridge from previous (Slide 07 Bridge): The bridge declared "Manufacturing DNA, Digitized" — now we make it concrete with the first direction: Growth.
> Bridge to next (Slide 09 Fastenal): Prove that data-driven discovery is real — a company went from 0 to 100,000+ SKUs with vending-machine captured data.

### Content structure

如果 slide 有明确的内容结构（对比、三要素、流程步骤），在这里列出来。这帮助你在写 IMAGE PROMPT 之前先想清楚内容的逻辑关系。

> Content structure: Two-panel comparison.
> — Left panel: HOLD TODAY — existing customers, relationship, AVL trust, "they already know you"
> — Right panel: FIND TOMORROW — new customers, data search, discovery, "they don't know you yet"
> — Central divider with insight: "Different mechanism. Different data requirement."

## Layer 3: Image Prompt — 视觉执行层

IMAGE PROMPT 是给 AI image model 的执行指令。它不是 "make it look nice"——而是精确的视觉描述：layout 分区、元素位置、颜色语义、文字内容和位置。

这是本方法论和接下来的 [workflow/03-prompts](../03-prompts/)（Prompt Engineering 方法论）交叉最深的层。这里聚焦于 **content-driven prompt design**——怎么把你的内容概念翻译成精确的视觉指令。

### IMAGE PROMPT 的结构

一个生产级的 IMAGE PROMPT 通常包含以下段落：

```
1. LAYOUT OVERVIEW   — 整页的宏观分区（y 坐标范围、区域比例）
2. ZONE DESCRIPTIONS — 每个分区的具体内容（panel、card、visual）
3. COLOR SEMANTICS   — 颜色的叙事含义（cyan = positive/growth, blue = neutral/structural）
4. TEXT CONTENT      — 画面中出现的精确文字（callout、label、KPI）
5. ANTI-PATTERNS     — 明确告诉模型不要做什么
```

### 案例：一张完整 IMAGE PROMPT 长什么样

```
LAYOUT: Two-panel horizontal split. Content zone: y=290 to y=780.
Left panel (45% width): HOLD TODAY scenario.
Right panel (45% width): FIND TOMORROW scenario.
Central divider (10% width): thin vertical line, cyan #00b4d8.

LEFT PANEL:
- Semi-transparent steel blue panel background
- Top: small icon representing relationship/handshake (cyan outline)
- Title label: "HOLD TODAY" (Source Sans Pro, regular, 24px visual, steel blue #6b8ca3)
- Compact text, maximum 3-4 short lines, 18-20px visual:
  "Your existing customers" / "AVL trust" / "Relationship-driven" / "They already know you"
- Status indicator: "Current Mechanism: RELATIONSHIP" (subtle cyan tag)

RIGHT PANEL:
- Semi-transparent cyan-tinted panel background (more vibrant than left)
- Top: small icon representing search/discovery (magnifying glass over data lattice, electric blue)
- Title label: "FIND TOMORROW" (Source Sans Pro, semibold, 24px visual, cyan #00b4d8)
- Compact text, maximum 3-4 short lines:
  "New customer discovery" / "AI-powered search" / "Data-driven match" / "They find you — or don't"
- Status indicator: "Future Mechanism: DATA" (brighter cyan tag)

BOTTOM CALLOUT BAR (y=805 to y=900):
- Full width, dark panel background
- Single sentence: "Most factories are optimized for HOLD — not for FIND."
- Cyan accent line above callout text

ANTI-PATTERNS:
- Do NOT make the left panel look "bad" or "wrong" — both mechanisms are valid
- Do NOT use red/green to suggest right is "good" and left is "bad"
- Do NOT add people silhouettes or stock photography
- Do NOT add logos or watermarks
```

### IMAGE PROMPT 的原则

1. **从宏观到微观**：先讲整体 layout，再讲每个 zone，再讲每个元素。
2. **精确但不过度约束**：指定 y 坐标范围、颜色 hex、相对比例——但不要指定到单个像素。给模型留一些视觉判断空间。
3. **颜色有语义**：每个颜色必须有一个不变的叙事含义。不要在 slide 5 用 cyan 表示 "positive" 然后在 slide 9 用 cyan 表示 "background decoration"。
4. **文字内容必须明确**：画面中出现的所有文字必须在 prompt 中给出精确的 wording。不要让模型自己编——它会编出不对的东西。
5. **Anti-pattern 同样重要**：告诉模型 "NOT red/green" 比告诉它 "use blue" 更能避免最常见的失败模式。

更多关于 IMAGE PROMPT 的底层技巧，参见 [workflow/03-prompts](../03-prompts/)。

## Layer 4: Speaker Note — 叙事执行层

SPEAKER NOTE 是给演讲者的。它不是 slide 内容的重复——而是 slide 在现场的口语化叙事。

```markdown
> **SPEAKER NOTE**
>
> **Narrative flow:**
> [从上一张 slide 过渡的口头话术]
> [slide 出现后先讲什么，后讲什么]
> [手势/指向——"左边这栏是 X，右边这栏是 Y"]
> [过渡到下一张 slide 的钩子]
>
> **Terms:**
> — AVL (Approved Vendor List): 合格供应商名录
> — Discovery: 发现（潜在客户通过 AI 搜索首次意识到你的存在）
>
> **Takeaway:**
> 一句话——观众必须带走什么
```

### SPEAKER NOTE 的要点

- **不是 script**：不要写逐字稿。写关键 talking points 和过渡钩子。演讲者需要的是记忆辅助，不是提词器。
- **手势/指向提示**：slide 有两个面板时，提示演讲者 "先指左边"——这很重要但容易被忽略。
- **过渡钩子**：每张 slide 最后一句应该是一个自然的过渡，衔接到下一张 slide。

### 多语言 Deck 设计

幻灯片上的语言和演讲者的语言是两个独立决策——两者可以不同，且在亚洲商业场景中经常不同（如英文 slides + 中文演讲）。在 Phase 0 就明确语言策略，不要到生产阶段才发现模型不能渲染中文。

**核心原则**：
- **Slide 语言**（视觉元素）：受 image model 限制。GPT Image 2 在英文文字渲染上最稳定。如果你需要 slides 上有中文，在 pilot 阶段（生成前 3-4 张代表性 slides）就测试中文字符的渲染质量。
- **演讲语言**（speaker note）：独立于 slide 语言。在 SPEAKER NOTE 的 **Terms** 区域提供双语术语解释——专业术语的翻译能避免 80% 的误解。
- **字体选择**：如果你的 slides 需要中文字符，确保 Header-Lock（Stage 3）使用的字体文件支持 CJK 字符。Source Sans Pro 不支持中文——需要换用 Noto Sans CJK 或类似的字体。

**术语 glossary 模式**：在每张 slide 的 SPEAKER NOTE 中：

```
**Terms:**
— AVL (Approved Vendor List): 合格供应商名录
— Discovery: 发现（潜在客户通过 AI 搜索首次意识到你的存在）
```

## 完整的 Slide 规格模板

把四层合在一起，一个完整的 slide 规格看起来是这样的：

```markdown
## Slide NN: [slide_id]

**VISUAL TYPE**: [from list]
**KICKER**: [3-6 words, ALL CAPS]
**TITLE**: [Complete, arguable claim — max 15 words]
**SUBTITLE**: [Optional — only for dividers/closers]

**CONCEPT**:
- MUST communicate: [Core cognitive payload]
- MUST NOT: [Misunderstandings to avoid]
- Bridge from: [How we got here]
- Bridge to: [Where we go next]
- Content structure: [Logical structure — comparison/framework/flow]

**IMAGE PROMPT**:
```
[LAYOUT OVERVIEW: y ranges, zone proportions]
[ZONE 1 DESCRIPTION: panels, icons, text, colors]
[ZONE 2 DESCRIPTION: ...]
[COLOR SEMANTICS: what each color means]
[BOTTOM CALLOUT: full-width sentence]
[ANTI-PATTERNS: what NOT to render]
```

> **SPEAKER NOTE**
>
> **Narrative flow:** [Talking points and transitions]
>
> **Terms:**
> — Term: [explanation in Chinese if needed]
>
> **Takeaway:** [One sentence the audience keeps]
```

## 反模式

### 1. 把认知解释写进 Image Prompt

❌ IMAGE PROMPT 里写："This slide shows the fundamental tension between relationship-driven retention and data-driven acquisition..."

这是 CONCEPT 层的内容。Image model 不需要知道 "fundamental tension"——它需要知道 left panel 的 y 坐标和颜色。把认知解释放进 prompt 只会稀释真正重要的视觉指令。

**分离原则**：CONCEPT 层写 "what it means"，IMAGE PROMPT 层写 "what it looks like"。

### 2. 把视觉细节写进 Speaker Note

❌ SPEAKER NOTE 里写："The right panel has a cyan-tinted background with a magnifying glass icon..."

演讲者不需要知道画面的视觉细节——他需要知道该说什么。视觉细节会干扰他快速找到 talking points。

### 3. KICKER 太像 TITLE

❌ KICKER: "Data-Driven Growth Is The Future Of Manufacturing"
❌ TITLE: "Data-driven growth will be the future of manufacturing"

KICKER 是标签，TITLE 是主张。如果它们几乎一样，你浪费了一次对观众的双重传递机会。KICKER 给 context（"你在哪个部分"），TITLE 给 claim（"这个部分的具体论点是"）。

### 4. TITLE 无法被争论

❌ TITLE: "Our AI Strategy"（无法争论——这是你的 deck 的标题，不是 slide 的 claim）
❌ TITLE: "Key Takeaways"（无法争论——谁的 takeaways？关于什么的 takeaways？）
✅ TITLE: "Your relationship keeps today's customers. Your data finds tomorrow's."（可争论——你可以反对说 "data alone isn't enough" 或 "relationship is enough"）

测试：如果有人不同意你的 TITLE，他们能说出具体的反对意见吗？如果不能，你的 TITLE 太 vague。

---

> **Next**: `04-create-content-assets.md` — 有了多层规格之后，怎么准备每张 slide 所需的内容资产：文案、视觉概念、数据表达。
