---
title: Deck Brief — [PROJECT NAME]
stage: workflow/02-content
position: template_pitch
type: template
summary: 融资 Pitch Deck 模板。10-14 slides。Agent 用此模板快速搭建 slide-specifications，把变量替换成用户内容。
depends_on:
- workflow/02-content/presets/metaphor-catalog.md
- workflow/02-content/presets/block-arc-catalog.md
feeds_into:
- Run bundle 3_versions/v1/slide-specifications.md
agent_action: fill_template
---

# Pitch Deck Template

> 融资 Pitch Deck。10-14 slides，目标：让投资人从"有点兴趣"到"我要见你"。
> Agent：用这个模板快速搭建 slide-specifications。把 [PLACEHOLDER] 替换成用户的具体内容。

---

## Section 1: Metadata

```yaml
project: deck_{SLUG}
type: pitch_deck
audience: [INVESTOR_TYPE — e.g., Seed VC, Series A, Strategic]
duration: [DURATION — 通常 12-15 min presentation + Q&A]
slides_language: [LANGUAGE]
speech_language: [LANGUAGE]
tier: quick
```

## Section 2: Core Metaphor

**Metaphor**: [METAPHOR_NAME]
**One-liner**: [ONE_SENTENCE_DESCRIPTION]

**Tension**: The audience believes [WRONG_BELIEF]. In reality, [CORRECT_BELIEF]. If they don't change their belief, [CONSEQUENCE].

## Section 3: Core Formula

**[A] + [B] = [C]**
**[C] is the outcome investors care about. [A] and [B] are what only this company brings.**

Falsifiable? If someone can prove that [A] alone achieves [C] without [B], the thesis breaks.

## Section 4: Block Map

| Block | Narrative Question | Slides | Argument Function |
|-------|-------------------|--------|-------------------|
| B1: Hook | Why should I keep listening? | 1 | Grab attention with the one thing that matters |
| B2: Problem | What's broken and who cares? | 2-3 | Define the pain, quantify the cost |
| B3: Solution | How do you fix it differently? | 2-3 | Show the product, explain the magic |
| B4: Market | Is this worth a fund-returning outcome? | 2 | Size the opportunity, show tailwinds |
| B5: Traction | Why should I believe you can execute? | 2 | Evidence, metrics, customer logos |
| B6: Team + Ask | Why you? What do you need? | 2 | Team superpower, use of funds |

## Section 5: Slide Specifications

> **每页按四层规格填**（Phase 1 填 L1/L2/L4；**L3 IMAGE PROMPT 视觉锁定后再回填**——见 `AGENTS.md` §2.7 / 本框架 bug 0003）。本模板已给每页 L1 骨架 + L2 的 `MUST communicate`/`MUST NOT` + L4 讲稿提示；填充时**补全**：
> - **L1 Meta — 加显式 `RENDER MODE`**：`Title / Opener` 和 `Closer` = `full-page`（image-direct，AI 连标题一起画）；其余 = `body+header-lock`（AI 只画 body，Stage 3 Header-Lock 叠标题）。省略则由 VISUAL TYPE 自动映射。
> - **L2 Concept — 每页补上 `Bridge`**（本页承上启下的论证功能）：模板已有 `MUST communicate`/`MUST NOT`，加一条 Bridge 让叙事弧线连贯。
> - **L3 IMAGE PROMPT — 只写"画面内容"**。不要往里写 header 安全区、body 文字契约、或 style anchoring 语句——Stage 1 组装时会自动注入这些系统契约，重复写只会干扰图像模型。用 `[方括号]` 标注要填的视觉描述；**Phase 1 留占位，视觉锁定后（§2.7）回填**。
> - **L4 Speaker Note**：已给提示，按你的内容改写。
>
> 完整四层形状见 `workflow/02-content/template-slide-specifications.md`；**填好的范例**见 `example-deck-brief-mini.md`。
> **叙事弧线**：上面 §4 的 Block Map 已实例化一条为 pitch 设计的弧线（Hook→Problem→Solution→Market→Traction→Team+Ask），**以它为准**；`block-arc-catalog.md` 是参考。

---

## Slide 01 — `p01_hook`

**VISUAL TYPE**: Title / Opener
**KICKER**: [COMPANY_NAME]
**TITLE**: [ONE_SENTENCE_HOOK — the thing investors must remember]
**SUBTITLE**: [FUNDING_ROUND] — [MONTH_YEAR]

**MUST communicate**: What this company does, in one sentence. Why now. The scale of ambition.

**MUST NOT**: Jargon. Buzzwords. "Revolutionary."

**IMAGE PROMPT**:
```
IMAGE-DIRECT opener — the AI renders the complete slide including the text.
LAYOUT: Full-slide visual with one large central statement.
VISUAL: [DESCRIBE the one metaphor or image that captures the company's essence — the product, the problem solved, the transformation — as a dramatic single-image composition]
TEXT: Kicker (company name) small at top; Title (the hook) large and dominant, center or center-left; subtitle (round + date) small below. No body text.
```

> **SPEAKER NOTE**
> [OPENING_HOOK — 30 seconds. Set the stakes. Example: "Every year, hospitals lose $X billion to a problem that's entirely predictable. We built the prediction engine."]

---

## Slide 02 — `p02_problem`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: THE PROBLEM
**TITLE**: [PROBLEM_STATEMENT — one sentence, quantified]

**MUST communicate**: The pain is real, it's big, and it's getting worse. Who feels it. What it costs.

**MUST NOT**: Vague claims without numbers. "X is broken" without saying who breaks.

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing the problem's scale and impact.
LAYOUT: Split — left side shows the problem visually (metaphor or diagram), right side shows 1-2 large KPI numbers quantifying the cost.
LEFT: [DESCRIBE visual metaphor for the problem — e.g., a leaking pipeline, a broken bridge, a gap between expectation and reality]
RIGHT: [KPI_LABEL_1]: [LARGE_NUMBER] / [KPI_LABEL_2]: [LARGE_NUMBER]
CALLOUT: Impact statement at bottom.
```

> **SPEAKER NOTE**
> [QUANTIFY the problem in 60 seconds. Who does it affect? What does it cost them? Why hasn't it been solved? Name the incumbents or status quo.]

---

## Slide 03 — `p03_problem_why_now`

**VISUAL TYPE**: Direction
**KICKER**: WHY NOW
**TITLE**: [WHAT_CHANGED — technology, regulation, behavior, or market shift]

**MUST communicate**: Something fundamental shifted that makes this problem solvable NOW, when it wasn't 2 years ago.

**MUST NOT**: Generic "AI makes everything better." Be specific about the enabler.

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing a before/after or old/new contrast.
LAYOUT: Two-panel comparison — left "Then" (grayed out, old world), right "Now" (vibrant, new capability).
THEN panel: [DESCRIBE old constraint — e.g., "Manual review: 3 days per case"]
NOW panel: [DESCRIBE new capability — e.g., "Automated prediction: 30 seconds"]
```

> **SPEAKER NOTE**
> [THE WHY-NOW STORY in 60 seconds. What changed 12-24 months ago? Technology breakthrough? New regulation? Market shift? Customer behavior change? Be specific — name the enabler.]

---

## Slide 04 — `p04_solution_product`

**VISUAL TYPE**: Concept Split
**KICKER**: OUR SOLUTION
**TITLE**: [WHAT_YOU_BUILT — one sentence explanation]

**MUST communicate**: What the product does, for whom, and how it's different. A clear before/after of the user experience.

**MUST NOT**: Feature lists. Architecture diagrams. "Platform."

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing the product's core interaction.
LAYOUT: Concept Split — left shows the input/trigger, right shows the output/result. Center shows the transformation.
LEFT: [DESCRIBE what the user does/sees before — e.g., "Uploads discharge summary"]
CENTER: [DESCRIBE the magic — e.g., a visual representation of the prediction engine processing]
RIGHT: [DESCRIBE the output — e.g., "Risk score + intervention recommendation"]
```

> **SPEAKER NOTE**
> [PRODUCT STORY in 90 seconds. What does the user do? What happens? What do they get? Show, don't describe. If you have a demo, transition to it here. If not, paint the before/after vividly.]

---

## Slide 05 — `p05_solution_differentiation`

**VISUAL TYPE**: Direction
**KICKER**: WHY WE WIN
**TITLE**: [DIFFERENTIATION — what you do that no one else does]

**MUST communicate**: The moat. Is it data? Technology? Distribution? Team? Show the comparison.

**MUST NOT**: "We work harder." "We care more." Vague superiority claims.

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing competitive differentiation.
LAYOUT: Comparison matrix or 2x2. Your approach vs. incumbents vs. alternatives.
TOP: [YOUR_APPROACH] — labeled with the key differentiator
BOTTOM LEFT: [INCUMBENT_APPROACH] — labeled with their limitation
BOTTOM RIGHT: [ALTERNATIVE_APPROACH] — labeled with their limitation
```

> **SPEAKER NOTE**
> [DIFFERENTIATION in 60 seconds. Name the incumbents or alternatives. Be specific about their limitation. Then show your advantage. Don't trash competitors — show why the world changed and they couldn't adapt.]

---

## Slide 06 — `p06_market_size`

**VISUAL TYPE**: Framework
**KICKER**: MARKET OPPORTUNITY
**TITLE**: [TAM_SAM_SOM_SUMMARY]

**MUST communicate**: The market is big, growing, and has a clear beachhead. Show TAM → SAM → SOM with growth rate.

**MUST NOT**: "We'll capture 1% of a $100B market." Show the path from SOM to TAM.

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing market size and growth.
LAYOUT: Three concentric circles or stacked bars — TAM (outer/largest), SAM (middle), SOM (inner/smallest). Each labeled with dollar amount and growth rate.
TAM: [TOTAL_ADDRESSABLE_MARKET — $XXB, Y% CAGR]
SAM: [SERVICEABLE_ADDRESSABLE_MARKET — $XXB]
SOM: [SERVICEABLE_OBTAINABLE_MARKET — $XXB, Year 3 target]
Visual: An arrow showing expansion path from SOM outward.
```

> **SPEAKER NOTE**
> [MARKET STORY in 60 seconds. Define TAM top-down or bottom-up — pick the more impressive number. Show expansion path: "We start with [SOM], then expand to [SAM] by [mechanism], and [TAM] is the endgame." Cite sources.]

---

## Slide 07 — `p07_traction_metrics`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: TRACTION
**TITLE**: [TRACTION_HEADLINE — the one number that proves product-market fit]

**MUST communicate**: Real evidence of demand and execution. Revenue, users, growth rate, retention, unit economics — pick the 2-3 strongest.

**MUST NOT**: Vanity metrics. "Registered users." "Social media followers."

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing key traction metrics.
LAYOUT: 2-3 large KPI cards arranged horizontally with a growth chart below.
KPI CARD 1: [METRIC_1_LABEL] — [LARGE_NUMBER] (with growth arrow and rate)
KPI CARD 2: [METRIC_2_LABEL] — [LARGE_NUMBER] (with growth arrow and rate)
KPI CARD 3 (optional): [METRIC_3_LABEL] — [LARGE_NUMBER]
CHART (below cards): Revenue or user growth line chart, up-and-to-the-right, labeled with timeframe.
```

> **SPEAKER NOTE**
> [TRACTION STORY in 60 seconds. Lead with the strongest number. Explain what it means: "This tells us [insight about product-market fit, customer love, or unit economics]." If early stage without revenue, use LOIs, pilot results, waitlist, or design partner commitments. Be honest about stage.]

---

## Slide 08 — `p08_traction_customers`

**VISUAL TYPE**: Case Anchor
**KICKER**: CUSTOMER EVIDENCE
**TITLE**: [CUSTOMER_HEADLINE — who's using it and what they get]

**MUST communicate**: Real customers, real results. Logos, quotes, or case metrics. Social proof.

**MUST NOT**: "Fortune 500 company in discussions." Only show signed/committed.

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing customer evidence.
LAYOUT: Left side — 3-4 customer logo cards (simple, monochrome in preset style) with one-sentence result below each. Right side — one expanded case study card with quote and metric.
EXPANDED CASE: "[CUSTOMER_NAME]" — [ONE_SENTENCE_RESULT] — "[SHORT_QUOTE]" — [KEY_METRIC]
```

> **SPEAKER NOTE**
> [CUSTOMER STORY in 90 seconds. Highlight one customer in detail: "When [CUSTOMER] started with us, they were [BEFORE_STATE]. After [TIMEFRAME], they achieved [AFTER_STATE]. The key metric: [NUMBER]." Then mention 2-3 other logos briefly for breadth.]

---

## Slide 09 — `p09_business_model`

**VISUAL TYPE**: Flow / Mechanism
**KICKER**: BUSINESS MODEL
**TITLE**: [HOW_YOU_MAKE_MONEY — one sentence]

**MUST communicate**: Pricing model, ACV/LTV, sales motion. How money flows.

**MUST NOT**: Overly complex. "We have 7 revenue streams."

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing the business model.
LAYOUT: Flow diagram — left "Customer Acquisition" → center "Product Delivery" → right "Revenue/Capture."
ACQUISITION: [SALES_MOTION — e.g., "Inbound + Outbound Enterprise, 45-day sales cycle"]
DELIVERY: [PRICING_MODEL — e.g., "Per-bed-per-year SaaS, $XXk ACV"]
UNIT ECONOMICS: Show LTV:CAC ratio visually (large number). [LTV_NUMBER] : [CAC_NUMBER]
```

> **SPEAKER NOTE**
> [BUSINESS MODEL in 60 seconds. How do you charge? How much? Who buys (economic buyer)? How do you reach them? What's the LTV/CAC ratio or unit economics? If pre-revenue, share pricing hypothesis and comparable benchmarks.]

---

## Slide 10 — `p10_team`

**VISUAL TYPE**: Concept Split
**KICKER**: FOUNDING TEAM
**TITLE**: [WHY_THIS_TEAM — the unique combination of skills that makes this possible]

**MUST communicate**: Why this team, for this problem, right now. Relevant experience, not full CVs.

**MUST NOT**: Every job everyone ever had. "Combined 50 years of experience."

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing founding team and key advisors.
LAYOUT: 2-3 founder cards (headshot silhouette or initials placeholder if no photo), each with: Name, Role, One-line "superpower" (the relevant credential).
FOUNDER 1: [NAME], [ROLE] — [ONE_SUPERPOWER_SENTENCE]
FOUNDER 2: [NAME], [ROLE] — [ONE_SUPERPOWER_SENTENCE]
FOUNDER 3 (optional): [NAME], [ROLE] — [ONE_SUPERPOWER_SENTENCE]
Below or right: Key advisors/logos (if impressive).
```

> **SPEAKER NOTE**
> [TEAM STORY in 45 seconds. For each founder: "Before [COMPANY], [NAME] was at [RELEVANT_EXPERIENCE] where they [SPECIFIC_ACHIEVEMENT]. That's how they discovered [KEY_INSIGHT]." Show domain expertise + founder-market fit. If you have a notable advisor/investor, mention them.]

---

## Slide 11 — `p11_ask`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: THE ASK
**TITLE**: [FUNDING_ASK — "$X million [ROUND_TYPE] to achieve [MILESTONE]"]

**MUST communicate**: How much, what for, what milestone it buys. Use of funds.

**MUST NOT**: "We'll figure it out." "Growth." Be specific about allocation and milestones.

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck slide image showing the funding ask and use of funds.
LAYOUT: Left — large ask amount ($XM) with round label. Right — use-of-funds breakdown (3-4 categories with percentages, shown as horizontal bars or simple pie segments).
USE OF FUNDS:
- [CATEGORY_1]: [XX]% — [WHAT_IT_BUYS]
- [CATEGORY_2]: [XX]% — [WHAT_IT_BUYS]
- [CATEGORY_3]: [XX]% — [WHAT_IT_BUYS]
MILESTONE (bottom/callout): "This gets us to [SPECIFIC_MILESTONE] by [DATE]"
```

> **SPEAKER NOTE**
> [THE ASK in 45 seconds. "$X million gets us to [MILESTONE]. At that point, we'll have [SPECIFIC_METRICS] and be ready to raise [NEXT_ROUND] from [TYPE_OF_INVESTOR]. The money goes primarily to [TOP_2_CATEGORIES]." Be precise. Investors want to know the plan is specific and achievable.]

---

## Slide 12 — `p12_closer`

**VISUAL TYPE**: Closer
**KICKER**: [COMPANY_NAME]
**TITLE**: [CLOSING_STATEMENT — the one thing to remember]
**SUBTITLE**: [CONTACT_INFO] — [EMAIL]

**MUST communicate**: This is the ending. Leave them with the core vision + contact info.

**MUST NOT**: "Thank you" as the main message. "Questions?" as the only text.

**IMAGE PROMPT**:
```
Design a finished 16:9 pitch deck closer slide image.
LAYOUT: IMAGE-DIRECT — full slide visual with dominant closing statement. This is a visual pause, not a content slide.
TEXT CONTENT: Large closing statement centered or center-left. Contact info small at bottom.
VISUAL: [DESCRIBE the emotional closing image — the vision of the future if this company succeeds. Aspirational, not tactical.]
This is an IMAGE-DIRECT slide — the AI renders the complete slide including all text.
```

> **SPEAKER NOTE**
> [CLOSING in 30 seconds. Restate the vision. "We're building [FUTURE_STATE] where [TRANSFORMATION]. We have the [TEAM/PRODUCT/TRACTION] to make it happen. We're raising $X million to [KEY_MILESTONE]. Let's talk: [EMAIL]."]

---

## Section 6: Design Constraints

- No filler slides — every slide earns its place in the argument
- Every claim backed by data or customer evidence
- No jargon, no buzzwords, no "revolutionary" or "game-changing"
- Under 30 words per slide (excluding speaker notes)
- One clear takeaway per slide — the "so what" for an investor
- Numbers are specific and sourced (no "50%+" without basis)

## Section 7: Change Log

| Version | Date | What Changed |
|---------|------|-------------|
| v1 | [DATE] | Initial pitch deck based on intake |
