---
title: Deck Brief — [PROJECT NAME]
stage: workflow/02-content
position: template_keynote
type: template
summary: 战略 Keynote 模板。15-20 slides。Agent 用此模板快速搭建 slide-specifications，把变量替换成用户内容。
depends_on:
- workflow/02-content/presets/metaphor-catalog.md
- workflow/02-content/presets/block-arc-catalog.md
feeds_into:
- Run bundle 3_versions/v1/slide-specifications.md
agent_action: fill_template
---

# Keynote Template

> 战略 Keynote。15-20 slides，目标：让听众理解一个重大变化、接受一个分析框架、记住一个行动方向。
> Agent：用这个模板快速搭建 slide-specifications。

---

## Section 1: Metadata

```yaml
project: deck_{SLUG}
type: keynote
audience: [AUDIENCE — e.g., 集团管理层, division GMs, functional heads]
duration: [DURATION — 通常 30-45 min presentation]
slides_language: [LANGUAGE]
speech_language: [LANGUAGE]
tier: standard
```

## Section 2: Core Metaphor

**Metaphor**: [METAPHOR_NAME]
**One-liner**: [ONE_SENTENCE_DESCRIPTION]

## Section 3: Core Formula

**[A] + [B] = [C]**

## Section 4: Block Map

| Block | Narrative Question | Slides | Argument Function |
|-------|-------------------|--------|-------------------|
| B1: External Trigger | Why now? What changed? | 3-4 | Establish urgency from outside forces |
| B2: Diagnosis | Is this real? What does it mean for us? | 2-3 | Connect external change to internal reality |
| B3: Framework | How do we think about this? | 3-4 | Give the audience a mental model |
| B4: Evidence | What does this look like in practice? | 3-4 | Case studies, data, proof points |
| B5: Organization | Who does this? How do we start? | 2-3 | Make it actionable |
| B6: Risk + Close | What's the risk? What's the first step? | 2 | Address fear, build confidence |

## Section 5: Slide Specifications

> **每页按四层规格填**（Phase 1 填 L1/L2/L4；**L3 IMAGE PROMPT 视觉锁定后再回填**——见 `AGENTS.md` §2.7 / 本框架 bug 0003）。本模板给了每页的 **L1 骨架**（VISUAL TYPE / KICKER / TITLE）和 **L4 讲稿提示**；填充时**补全缺的两处**：
> - **L1 Meta — 加显式 `RENDER MODE`**：`Title / Opener` 和 `Closer` = `full-page`（image-2 画整页含标题）；其余 = `body+header-lock`（image-2 画 body，Python 叠标题）。省略则由 VISUAL TYPE 自动映射，但写出来更清楚。
> - **L2 Concept — 每页加 `MUST communicate` / `MUST NOT` / `Bridge`**（本页在整体论证中承上启下的功能）。这是叙事弧线落到每一页的地方，**别省**——省了就退回"一堆没有论证力的 slide"。
> - **L3 IMAGE PROMPT**：Phase 1 留占位（如 `[PLACEHOLDER: 视觉锁定后填]`），Phase 2 视觉锁定后对照 `2_backbone/visual-style/` 回填。
> - **L4 Speaker Note**：已给提示，按你的内容改写。
>
> 完整的每页四层形状见 `workflow/02-content/template-slide-specifications.md`；**填好的范例**见 `example-deck-brief-mini.md`。
> **叙事弧线**：上面 §4 的 Block Map 已实例化一条为 keynote 设计的弧线（External Trigger→Diagnosis→Framework→Evidence→Organization→Risk+Close），**以它为准**；`block-arc-catalog.md` 是参考，不要另选一条冲突的弧线。

---

## Slide 01 — `k01_title`

**VISUAL TYPE**: Title / Opener
**KICKER**: [EVENT_NAME]
**TITLE**: [KEYNOTE_TITLE — the big idea in one sentence]
**SUBTITLE**: [SPEAKER_NAME] — [DATE]

**IMAGE PROMPT**: [Opener visual — dramatic, minimal, setting the tone for the entire keynote]

> **SPEAKER NOTE**: [Opening hook — 45 seconds. Set the stakes. Why are we here today?]

---

## Slide 02 — `k02_context`

**VISUAL TYPE**: Direction
**KICKER**: [CONTEXT_KICKER]
**TITLE**: [THE_EXTERNAL_SHIFT — what's happening in the world that demands attention]

**IMAGE PROMPT**: [Show the external force — market data, technology shift, competitive dynamics — visually impactful]

> **SPEAKER NOTE**: [The big picture in 90 seconds. What changed in the outside world? Why can't we just keep doing what we're doing?]

---

## Slide 03 — `k03_evidence_of_change`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: [EVIDENCE_KICKER]
**TITLE**: [EVIDENCE_HEADLINE — data that proves the shift is real]

**IMAGE PROMPT**: [2-3 large KPI numbers or a striking data visualization showing the magnitude of change]

> **SPEAKER NOTE**: [The proof in 60 seconds. These are the numbers that should make us uncomfortable. Source each.]

---

## Slide 04 — `k04_stakes`

**VISUAL TYPE**: Risk / 2 Panels
**KICKER**: [STAKES_KICKER]
**TITLE**: [WHAT'S_AT_STAKE — opportunity cost of inaction]

**IMAGE PROMPT**: [Two-panel: left "if we act" (positive scenario), right "if we don't" (negative scenario)]

> **SPEAKER NOTE**: [The stakes in 60 seconds. This is not fear-mongering — it's a clear-eyed assessment of two paths.]

---

## Slide 05 — `k05_diagnosis`

**VISUAL TYPE**: Concept Split
**KICKER**: [DIAGNOSIS_KICKER]
**TITLE**: [DIAGNOSIS_HEADLINE — connecting external change to our reality]

**IMAGE PROMPT**: [Gap analysis — where we are vs. where we need to be. Visual bridge between current state and required state]

> **SPEAKER NOTE**: [Diagnosis in 90 seconds. "We're good at [X]. The world now demands [Y]. The gap is [Z]." Be honest — sugarcoating loses credibility.]

---

## Slide 06 — `k06_current_reality`

**VISUAL TYPE**: Case Anchor
**KICKER**: [CURRENT_STATE_KICKER]
**TITLE**: [HONEST_ASSESSMENT — where we stand today]

**IMAGE PROMPT**: [Current state visualized — process maps, maturity model, capability gaps. Not to shame, to baseline]

> **SPEAKER NOTE**: [Current reality in 60 seconds. Acknowledge strengths first, then gaps. "We're world-class at [X]. We have work to do on [Y]."]

---

## Slide 07 — `k07_framework_intro`

**VISUAL TYPE**: Framework
**KICKER**: [FRAMEWORK_KICKER]
**TITLE**: [FRAMEWORK_NAME — the mental model for thinking about this]

**IMAGE PROMPT**: [The framework — a clear visual model with 3-4 components. This will be referenced throughout the rest of the keynote. Make it memorable and clean]

> **SPEAKER NOTE**: [Framework introduction in 90 seconds. "Here's how to think about this. Three things matter: [A], [B], [C]. The rest of this talk is about each one."]

---

## Slide 08 — `k08_fw_component_1`

**VISUAL TYPE**: Direction
**KICKER**: [COMPONENT_1_KICKER]
**TITLE**: [COMPONENT_1_TITLE — first pillar of the framework]

**MUST communicate**: What this component is. Why it matters. The concrete thing the audience should understand about it.
**MUST NOT**: Abstract theory without examples. "X is important" without saying why.

**IMAGE PROMPT**:
```
[Each slide dives deep into one component of the framework. Concrete, visual, with data and examples. First component — usually the foundation or data layer.]
```

> **SPEAKER NOTE**: [2-3 minutes. Show the first component. Use specific examples relevant to this audience. Connect to the metaphor.]

---

## Slide 09 — `k09_fw_component_2`

**VISUAL TYPE**: Direction
**KICKER**: [COMPONENT_2_KICKER]
**TITLE**: [COMPONENT_2_TITLE — second pillar of the framework]

**MUST communicate**: How this component builds on the first. The new capability it enables.
**MUST NOT**: Redundant with component 1. Standalone without connecting to the framework.

**IMAGE PROMPT**:
```
[Second component — usually the process or people layer. Show how it connects to and depends on component 1.]
```

> **SPEAKER NOTE**: [2-3 minutes. Show the second component. "Now that we have [COMPONENT_1], we can add [COMPONENT_2] which enables [CAPABILITY]."]

---

## Slide 10 — `k10_fw_component_3`

**VISUAL TYPE**: Direction
**KICKER**: [COMPONENT_3_KICKER]
**TITLE**: [COMPONENT_3_TITLE — third pillar of the framework]

**MUST communicate**: How this component completes the system. The outcome when all three work together.
**MUST NOT**: Disconnected from components 1 and 2. "And also..." without integration.

**IMAGE PROMPT**:
```
[Third component — usually the intelligence or outcome layer. Show the complete framework: all three components working together to produce the result.]
```

> **SPEAKER NOTE**: [2-3 minutes. Show the third component and the complete system. "With [C1], [C2], and [C3] together, we get [OUTCOME]. That's the system."]

---

## Slide 11 — `k11_case_study_1`

**VISUAL TYPE**: Case Anchor
**KICKER**: [CASE_KICKER]
**TITLE**: [CASE_HEADLINE — a real example of this in action]

**IMAGE PROMPT**: [Case study visual — company logo (if permitted), before/after metrics, key lesson. Not a testimonial, an evidence point]

> **SPEAKER NOTE**: [Case study in 90 seconds. "When [COMPANY] faced [CHALLENGE], they [ACTION] and got [RESULT]. The lesson for us: [TAKEAWAY]."]

---

## Slide 12 — `k12_case_study_2`

**VISUAL TYPE**: Case Anchor
**KICKER**: [CASE_KICKER_2]
**TITLE**: [CASE_HEADLINE_2 — second example, different angle]

**IMAGE PROMPT**: [Second case study, different industry or context. Shows the framework applies broadly]

> **SPEAKER NOTE**: [Second case in 60 seconds. Show the pattern isn't a one-off. Different industry, same principles, similar results.]

---

## Slide 13 — `k13_implications`

**VISUAL TYPE**: Direction
**KICKER**: WHAT THIS MEANS FOR US
**TITLE**: [IMPLICATIONS_HEADLINE — from framework and evidence to our reality]

**IMAGE PROMPT**: [Bridge from "what others did" to "what we should do." Visual prioritizing — what's most important, what's first]

> **SPEAKER NOTE**: [Implications in 90 seconds. "Here's what the framework + evidence means for our specific situation. Three priorities emerge: [1], [2], [3]."]

---

## Slide 14 — `k14_organization`

**VISUAL TYPE**: Framework
**KICKER**: MAKING IT HAPPEN
**TITLE**: [ORG_HEADLINE — who does what, starting when]

**IMAGE PROMPT**: [Organization and accountability. Timeline, owner names/roles, phasing. This makes it real]

> **SPEAKER NOTE**: [Organization in 60 seconds. "This is not a strategy document that sits on a shelf. [PERSON/GROUP] owns [INITIATIVE], starting [WHEN]. First milestone: [DATE]."]

---

## Slide 15 — `k15_first_steps`

**VISUAL TYPE**: Flow / Mechanism
**KICKER**: FIRST STEPS
**TITLE**: [FIRST_STEPS_HEADLINE — concrete 90-day actions]

**IMAGE PROMPT**: [Simple 3-4 step flow showing the first 90 days. Each step: action, owner, outcome. Visual momentum — this is the beginning of movement]

> **SPEAKER NOTE**: [First steps in 60 seconds. "When you leave today, here's what happens: [STEP_1] this week, [STEP_2] this month, [STEP_3] this quarter. By [DATE], we'll know if we're on track."]

---

## Slide 16 — `k16_risks`

**VISUAL TYPE**: Risk / 2 Panels
**KICKER**: RISKS WE FACE
**TITLE**: [RISK_HEADLINE — honest about what could go wrong]

**IMAGE PROMPT**: [Risk matrix or two-panel: what we control vs. what we don't. Mitigations for each. Not scary — responsible]

> **SPEAKER NOTE**: [Risks in 45 seconds. Name 2-3 real risks and how we mitigate each. "The biggest risk is [X]. Here's how we handle it: [Y]." Honesty builds trust.]

---

## Slide 17 — `k17_call_to_action`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: THE MOMENT IS NOW
**TITLE**: [CTA_HEADLINE — what you're asking the audience to do]

**IMAGE PROMPT**: [Bold, simple, memorable. The one action. Not a summary — a call forward]

> **SPEAKER NOTE**: [Call to action in 30 seconds. Clarity over cleverness. "Here's what I'm asking of you today: [SPECIFIC_REQUEST]. The cost of waiting is [COST]. The opportunity is [OPPORTUNITY]."]

---

## Slide 18 — `k18_closer`

**VISUAL TYPE**: Closer
**KICKER**: [COMPANY/EVENT_NAME]
**TITLE**: [CLOSING_STATEMENT — the vision, the transformation, the one thing]
**SUBTITLE**: [CONTACT_INFO / THANK_YOU]

**IMAGE PROMPT**: [IMAGE-DIRECT. Emotional closing visual — the future state if this succeeds. Aspirational, powerful, simple]

> **SPEAKER NOTE**: [Closing in 30 seconds. Circle back to the opening metaphor. "We started with [METAPHOR]. The [METAPHOR_ELEMENT] is in our hands. Let's build [FUTURE_STATE]. Thank you."]

---

## Section 6: Design Constraints

- No filler slides — every slide earns its place in the argument
- Framework must be referenced consistently throughout
- Evidence slides (cases, data) alternate with concept slides (framework, implications)
- Under 35 words per slide
- Every slide has a "management implication" visible on the slide

## Section 7: Change Log

| Version | Date | What Changed |
|---------|------|-------------|
| v1 | [DATE] | Initial keynote based on intake |
