---
title: Example — Mini Deck Brief（3 张 Slide 完整示例）
stage: 02_content_design
position: example
type: reference
summary: 一份只有 3 张 slide 的完整 deck brief，展示四层规格填好后长什么样。对照 template-slide-specifications.md 看。
depends_on:
- 02_content_design/template-core-metaphor.md
- 02_content_design/template-core-formula.md
- 02_content_design/template-design-constraints.md
- 02_content_design/template-slide-specifications.md
feeds_into: []
agent_action: reference
---

# Example — Mini Deck Brief

> **注意**：在新的 run-bundle 结构里，一份 deck brief 的内容按变更频率拆分存放——核心隐喻、核心公式、设计约束进入 `2_backbone/`（分别是 `core-metaphor.md` / `core-formula.md` / `design-constraints.md`），Block map + 每张 slide 的四层规格进入 `3_versions/v{n}/slide-specifications.md`。本示例为便于对照，仍把这几部分放在一个文件里连续展示。
>
> 这是一份**填好的** deck brief，只含 3 张 slide。对照 `template-slide-specifications.md` 的空模板看——模板里每个待填占位符，在这里都换成了真实内容。
>
> **Slide 规格的标题格式就是 stage1 解析器认的格式**：`## Slide NN: \`slug\``（两个 `#`、冒号、再跟反引号包住的 slug）。把下面 Section 5 的 slide 块直接拷进 `3_versions/v{n}/slide-specifications.md` 就能跑管线。
>
> 主题：一家虚构的 SaaS 公司向投资人做 pitch。你可以把它替换成你的行业——**学的是结构和深度，不是这个具体内容。**

---

## Section 1: Metadata

```yaml
Deck Name: "Acme Analytics — Series A Pitch"
Audience:
  - Role: VC partners and analysts
  - AI literacy: High — they see AI pitches daily
  - Cultural context: Silicon Valley, English native
  - What they want: "Why this team, why now, and what's the moat?"
  
Duration:
  - Pitch: 15 min presentation + 15 min Q&A
  
Language Policy:
  - On slides: English only
  - In speech: English
  
Design Constraints:
  - No customer names without permission
  - No specific revenue numbers from beta (use orders of magnitude)
  - No competitor bashing by name
```

---

## Section 2: Core Metaphor

```
Most analytics tools are rearview mirrors. They tell you what happened yesterday.
We're building headlights. We tell you what's about to happen — and what to do about it.
```

### Why this metaphor?

Every VC has seen 20 "AI analytics" decks this month. The rearview mirror vs. headlight distinction is visceral — you can see it immediately. It captures the tension between descriptive (what happened) and prescriptive (what to do), which is the entire thesis.

### What this metaphor is NOT

It's not about "prediction is better than reporting." Prediction without action is just a more expensive rearview mirror. The headlight illuminates the road AND shows you where to steer.

---

## Section 3: Core Formula

```
Embedded Domain Logic + Real-Time Context = Decisions, Not Dashboards
```

| Variable | Definition | Why Necessary |
|----------|-----------|---------------|
| Embedded Domain Logic | Industry-specific rules and workflows encoded in the product, not configured by the user | Without it, you're just another dashboard builder — the customer does all the hard work |
| Real-Time Context | Live data from the customer's stack + external signals (market, weather, supply chain) | Without it, you're fast but blind — speed doesn't help if you're answering yesterday's question |
| Decisions, Not Dashboards | The product outputs recommended actions, not charts | This is what separates us from Looker/Tableau — they show you what happened, we tell you what to do |

### How to falsify this formula

If you could build the same product by slapping GPT on top of a Snowflake instance — and users would pay the same amount — our formula is false.

---

## Section 4: Block Map

| Block | Purpose | Question Answered | Slides | Evidence? |
|-------|---------|-------------------|--------|-----------|
| B1: The Problem | Establish why dashboards fail | "I already have analytics. Why isn't it enough?" | 2 | Industry data on decision latency |
| B2: The Solution | Show HOW we're different | "What makes your approach work?" | 3 | Architecture diagram + customer beta result |
| B3: The Moat | Prove it's defensible | "Why can't Google copy this in 6 months?" | 2 | Domain logic depth + data network effects |

### Narrative arc

Start with frustration they already feel (dashboards everywhere, decisions still slow). Show that the bottleneck isn't data volume — it's the translation step from "what the data says" to "what I should do." Reveal our architecture as the missing translator. Close with the moat: domain models that get smarter with every customer.

---

## Section 5: Slide Specifications

---

## Slide 01: `s01_title_opener`

**VISUAL TYPE**: Title / Opener

**KICKER**: (none)

**TITLE**: We built headlights. Everyone else is selling rearview mirrors.

**SUBTITLE**: Acme Analytics — Series A

**CONCEPT**:
- **MUST communicate**: The core metaphor in one visual instant. This is the only slide where the metaphor appears in full visual form. After this, it echoes through Block names and callout bars.
- **MUST NOT**: Over-explain the metaphor. Don't show literal car parts. The visual is a suggestion, not a diagram.
- **Bridge from previous**: N/A — this is the opener.
- **Bridge to next**: The headlight image should leave a question hanging: "OK, but what's wrong with my current analytics?" Slide 02 answers it.
- **Content structure**: Single dominant visual (the headlight metaphor) + title + subtitle. Cinematic, not dense.

**IMAGE PROMPT**:
```
LAYOUT: Full-canvas title slide, no header zones needed (full-page).
Canvas: 1672x941.

BACKGROUND: Deep charcoal (#1a1a2e) fading to near-black at edges. NOT pure black — subtle depth.

CENTER: A single beam of light cutting diagonally from bottom-left to upper-right,
illuminating a path forward. The beam is warm white at source, transitioning to
cool cyan (#00b4d8) at the leading edge. The illuminated area shows a hint of
terrain — abstract geometric shapes suggesting roads, intersections, choices.
The unilluminated area (bottom-right) is dark, featureless — the past.

TEXT: Title centered in the upper-middle, large bold white sans-serif.
Subtitle below in smaller cyan (#00b4d8).

COLOR SEMANTICS:
- Warm-to-cool beam transition = from data (warm, human-generated) to insight (cool, precise)
- Dark unilluminated area = what you can't see without headlights

ANTI-PATTERNS:
- No literal car or vehicle imagery
- No stock photography
- No gradient orbs or "tech" blobs
- No logos, watermarks, page numbers
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> "Every VC has seen 20 analytics decks this month. So let me start with what makes us different. [click] Most analytics tools are rearview mirrors. They show you what happened yesterday, in beautiful detail. We built headlights. We show you what's about to happen — and what to do about it. I'm going to spend the next 15 minutes proving that sentence."
>
> **Takeaway:**
> This isn't another dashboard company. This is a decision company that happens to use AI.

---

## Slide 02: `s02_concept_split`

**VISUAL TYPE**: Concept Split

**KICKER**: THE PROBLEM

**TITLE**: Dashboards show you the traffic jam. Decisions tell you to take Exit 47 — now.

**CONCEPT**:
- **MUST communicate**: The gap between information and action. Left side = the world of dashboards (data-rich, answer-poor). Right side = what's missing (the translation layer that converts data into recommended actions).
- **MUST NOT**: Make dashboards look stupid or obsolete. They're necessary infrastructure — just insufficient on their own. The message is "yes, and" not "no, instead."
- **Bridge from previous**: Slide 01 planted the headlight metaphor. This slide grounds it: here's the specific problem the headlight solves.
- **Bridge to next**: The right panel should create curiosity: "OK, but HOW do you build that translation layer?" Slide 03 (architecture) answers.
- **Content structure**: Two-panel horizontal comparison. Left = Current State (dashboard world). Right = Missing Layer (decision world). Center divider with insight.

**IMAGE PROMPT**:
```
LAYOUT: Two-panel horizontal split across main content zone (y=290 to y=780).
Left panel (45% width, steel-blue tinted background #1e3a5f at 60% opacity).
Right panel (45% width, cyan-tinted background #00b4d8 at 15% opacity).
Center divider (10% width): thin vertical cyan line (#00b4d8, 1.5px).

LEFT PANEL (Current State):
- Top icon: small dashboard screen showing 3 charts (bar, line, pie) in muted steel blue
- Label: "TODAY: DATA-RICH" (semibold, white, 24px visual)
- Body (3 lines, 18-20px visual, readable steel blue #6b8ca3):
  "Real-time pipelines" / "Beautiful visualizations" / "Self-serve exploration"
- Bottom tag: "Result: YOU figure out what to do" (subtle, amber #f59e0b)
  The amber signals "caution — this is the bottleneck"

RIGHT PANEL (What's Missing):
- Top icon: a single arrow piercing through a node — direction emerging from data
- Label: "MISSING: DECISION LAYER" (semibold, white, 24px visual)
- Body (3 lines):
  "Domain rules encoded" / "Context-aware recommendations" / "Action, not another chart"
- Bottom tag: "Result: The system tells YOU" (bright cyan #00b4d8)

CENTER DIVIDER:
- Vertical label "VS" at middle (subtle, steel blue, 16px visual)

BOTTOM CALLOUT BAR (y=805 to y=900, full width, dark panel):
- "The bottleneck isn't data volume. It's the translation step."
- Cyan accent line above the callout text

ANTI-PATTERNS:
- Do NOT make the left panel look "bad" — it's necessary infrastructure
- Do NOT use red/green (implies wrong/right when both have value)
- No people silhouettes, no stock photography
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> "Here's the problem every analytics buyer feels but can't name. [gesture left] This is the state of the art. Real-time data, beautiful dashboards, self-serve exploration. The industry has spent 20 years perfecting this. And it's genuinely impressive. [pause] But here's what's missing. [gesture right] The translation layer. The step between 'here's what the data says' and 'here's what you should do.' That step is still 100% human. And humans are the bottleneck."
>
> **Terms:**
> — Decision layer: 决策层（从数据到行动的翻译步骤，目前完全依赖人）
>
> **Takeaway:**
> The industry solved data access. It didn't solve decision speed.

---

## Slide 03: `s03_framework`

**VISUAL TYPE**: Framework

**KICKER**: HOW IT WORKS

**TITLE**: Domain logic + real-time context, processed through the decision engine.

**CONCEPT**:
- **MUST communicate**: Three components working as a system. The domain logic is the moat — it's what makes us different from a thin GPT wrapper. The context layer makes it real-time. The decision engine combines them.
- **MUST NOT**: Make it look like a generic "AI pipeline" diagram. The domain logic component should feel dense, specific, grounded — like a library of industry rules, not a black box labeled "AI."
- **Bridge from previous**: Slide 02 identified the missing translation layer. This slide shows it: here's what the translation layer actually looks like.
- **Bridge to next**: The "Domain Logic" component should raise the question: "How deep is this logic, really?" Next slide (customer evidence) proves depth with a real beta result.
- **Content structure**: Three interconnected nodes arranged horizontally, flowing left to right. Each node has an icon, label, and one-line description.

**IMAGE PROMPT**:
```
LAYOUT: Three-pillar horizontal framework in main content zone (y=290 to y=780).

NODE 1 — LEFT (Domain Logic):
- Dark panel background (#1e3a5f at 80% opacity)
- Top icon: a dense, structured grid — like a circuit board but organic,
  suggesting encoded rules (electric blue #0077b6, geometric)
- Label: "1. DOMAIN LOGIC" (semibold, white, 22px visual)
- Description (2 lines, 18px visual, steel blue):
  "Industry rules encoded" / "Gets smarter with every customer"
- This is the MOAT — visual should feel substantial, built, not lightweight

NODE 2 — CENTER (Real-Time Context):
- Dark panel background (same style as Node 1)
- Top icon: multiple data streams converging into a single point
  (cyan #00b4d8 lines flowing inward)
- Label: "2. REAL-TIME CONTEXT" (semibold, white, 22px visual)
- Description (2 lines):
  "Live data from your stack" / "External signals: market, supply chain, weather"

NODE 3 — RIGHT (Decision Engine):
- Dark panel background, slightly more prominent (cyan-tinted border)
- Top icon: a single arrow emerging from a convergence of inputs,
  pointing decisively right (bright cyan #06b6d4, bold)
- Label: "3. DECISION ENGINE" (semibold, white, 22px visual)
- Description (2 lines):
  "Logic + Context → Action" / "Not a chart. A recommendation."

CONNECTORS:
- Thin cyan arrows (#00b4d8, 1px) flowing from Node 1 → Node 2 → Node 3
- Arrow labels (tiny, 14px visual): between 1→2: "rules applied", between 2→3: "action generated"

BOTTOM CALLOUT BAR (y=805 to y=900, full width, dark panel):
- "The domain logic is the moat. It's what makes this un-copyable in 6 months."
- Cyan accent line above callout text

COLOR SEMANTICS:
- Electric blue = domain logic (depth, substance, IP)
- Cyan = data flow, context, connection
- Bright cyan = output, action, decision

ANTI-PATTERNS:
- Do NOT use a generic "AI brain" or "neural network" visual
- Do NOT make this look like a marketing slide — it should feel technical and specific
- No glowing orbs, no "AI magic" aesthetic
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> "Here's the architecture. Three components. [point left] Domain logic — this is our IP. Industry-specific rules, encoded in the product. Every customer that joins makes this smarter for everyone. [point center] Real-time context — live data from your stack, plus external signals your team doesn't have time to monitor. [point right] Decision engine — combines them and outputs a recommended action. Not 'traffic is up 12%.' More like 'redirect your SEM budget to these 3 keywords in the next 2 hours, here's why, here's the expected lift.'"
>
> **Terms:**
> — Domain logic: 领域逻辑（编码到产品中的行业规则和流程，不是用户配置的）
> — Moat: 护城河（竞争对手难以复制的壁垒）
>
> **Takeaway:**
> The moat isn't AI — everyone has AI. The moat is the domain logic that gets deeper every time a customer uses it.

---

## Section 6: Design Constraints Reference

### Language
- English only on all slides

### Forbidden Content Types
- No customer names without written permission
- No specific beta revenue numbers (use "XX% lift" or "Nx improvement")
- No competitor names — describe functionally ("legacy dashboard vendors")
- No stock photography people or clip art
- Logos only for publicly known partners with permission

### Text Density
- Most slides: 25-35 words max on the visual
- Framework slides: 35-50 words max
- Opener/closer: 5-15 words max

### Tone
- Confident but not arrogant
- Technical but not academic
- Specific, not hand-wavy — every claim has a number or a name attached

---

## Section 7: Change Log

| Date | Version | Change Type | Slide(s) | What Changed | Why |
|------|---------|-------------|----------|-------------|-----|
| 2026-07-08 | v1 | Initial | All | First draft | Team offsite prep |
