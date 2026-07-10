---
title: Deck Brief — [PROJECT NAME]
stage: 02_content_design
position: template_training
type: template
summary: 培训/教学 Deck 模板。12-18 slides。Agent 用此模板快速搭建 slide-specifications，把变量替换成用户内容。
depends_on:
- 02_content_design/presets/metaphor-catalog.md
- 02_content_design/presets/block-arc-catalog.md
feeds_into:
- Run bundle 3_versions/v1/slide-specifications.md
agent_action: fill_template
---

# Training Template

> 培训/教学 Deck。12-18 slides，目标：让学员从"不知道"到"能用"。
> Agent：用这个模板快速搭建 slide-specifications。培训 deck 的节奏是 概念→示范→练习→回顾。

---

## Section 1: Metadata

```yaml
project: deck_{SLUG}
type: training
audience: [LEARNERS — role, current skill level, what they need to do after]
duration: [DURATION — 通常 45-90 min, 含练习]
slides_language: [LANGUAGE]
speech_language: [LANGUAGE]
tier: standard
```

## Section 2: Core Metaphor

**Metaphor**: [METAPHOR_NAME — a concrete image that makes the abstract skill tangible]
**Example**: "Learning [SKILL] is like [EVERYDAY_ACTIVITY]."

## Section 3: Core Formula

**Before Training: [CURRENT_CAPABILITY]**
**After Training: [TARGET_CAPABILITY]**
**Bridge: [KEY_CONCEPT] + [PRACTICE] = [COMPETENCE]**

## Section 4: Block Map

| Block | Narrative Question | Slides | Function |
|-------|-------------------|--------|----------|
| B1: Hook + Objectives | Why should I learn this? | 2 | Motivation and clear outcomes |
| B2: Core Concept | What's the big idea? | 2-3 | The mental model |
| B3: How It Works | How does it actually function? | 2-3 | Mechanism, steps, demonstration |
| B4: Practice/Application | Can I do it myself? | 2-3 | Exercises, scenarios, application |
| B5: Common Pitfalls | What will go wrong? | 1-2 | Mistakes and how to avoid them |
| B6: Recap + Next Steps | What did I learn? What now? | 2 | Summary and resources |

## Section 5: Slide Specifications

> **每页按四层规格填**（Phase 1 填 L1/L2/L4；**L3 IMAGE PROMPT 视觉锁定后再回填**——见 `AGENTS.md` §2.7 / 本框架 bug 0003）。本模板给了每页的 **L1 骨架**（VISUAL TYPE / KICKER / TITLE）和 **L4 讲稿提示**；填充时**补全缺的两处**：
> - **L1 Meta — 加显式 `RENDER MODE`**：`Title / Opener` 和 `Closer` = `full-page`；其余 = `body+header-lock`。省略则由 VISUAL TYPE 自动映射，但写出来更清楚。
> - **L2 Concept — 每页加 `MUST communicate` / `MUST NOT` / `Bridge`**（本页在整体论证中承上启下的功能）。这是叙事弧线落到每一页的地方，**别省**。
> - **L3 IMAGE PROMPT**：Phase 1 留占位，Phase 2 视觉锁定后对照 `2_backbone/visual-style/` 回填。
> - **L4 Speaker Note**：已给提示，按你的内容改写。
>
> 完整四层形状见 `02_content_design/template-slide-specifications.md`；**填好的范例**见 `example-deck-brief-mini.md`。
> **叙事弧线**：上面 §4 的 Block Map 已实例化一条为 training 设计的弧线（Hook+Objectives→Core Concept→How It Works→Practice→Common Pitfalls→Recap+Next Steps），**以它为准**；`block-arc-catalog.md` 是参考。

---

## Slide 01 — `t01_title`

**VISUAL TYPE**: Title / Opener
**KICKER**: [COURSE/MODULE_NAME]
**TITLE**: [TRAINING_TITLE — what they'll be able to do]
**SUBTITLE**: [DURATION] — [INSTRUCTOR_NAME]

**IMAGE PROMPT**: [Opener — welcoming, sets the tone. The skill or outcome visualized as a desirable state]

> **SPEAKER NOTE**: [Welcome + hook in 60 seconds. "By the end of this session, you'll be able to [SPECIFIC_SKILL]. This matters because [WHY]."]

---

## Slide 02 — `t02_objectives`

**VISUAL TYPE**: Framework
**KICKER**: LEARNING OBJECTIVES
**TITLE**: By the end of this session, you will be able to:

**IMAGE PROMPT**: [3-4 learning objectives displayed as icons with one-line descriptions. Each objective is observable and testable. Not "understand X" but "do X"]

> **SPEAKER NOTE**: [Walk through objectives in 45 seconds. "We'll know this worked if you can [OBJECTIVE_1], [OBJECTIVE_2], and [OBJECTIVE_3]."]

---

## Slide 03 — `t03_why_this_matters`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: WHY THIS MATTERS
**TITLE**: [MOTIVATION_HEADLINE — the cost of not knowing / the benefit of mastery]

**IMAGE PROMPT**: [Before/after contrast. Left: without this skill (frustration, inefficiency). Right: with this skill (confidence, speed, better outcomes)]

> **SPEAKER NOTE**: [Motivation in 60 seconds. Make it personal. "Have you ever [COMMON_PAIN_POINT]? That's what happens without [SKILL]. After today, you'll [BETTER_OUTCOME] instead."]

---

## Slide 04 — `t04_core_concept`

**VISUAL TYPE**: Concept Split
**KICKER**: THE CORE IDEA
**TITLE**: [CONCEPT_NAME — the one mental model that makes everything else make sense]

**IMAGE PROMPT**: [The core concept visualized as a simple, memorable diagram or metaphor. This is the anchor for everything that follows. Make it stick]

> **SPEAKER NOTE**: [Core concept in 90 seconds. Explain it like you're talking to a smart friend who's never heard of it. Use the metaphor from Section 2. Check for understanding: "Does this make sense so far?"]

---

## Slide 05 — `t05_concept_deep_dive`

**VISUAL TYPE**: Framework
**KICKER**: HOW IT WORKS
**TITLE**: [DETAILED_EXPLANATION — the mechanism, step by step]

**IMAGE PROMPT**: [Step-by-step visual breakdown. 3-5 numbered steps with icons. Each step labeled with a verb. Flow from left to right or top to bottom]

> **SPEAKER NOTE**: [Walk through each step in 2-3 minutes. For each step: "Here's what happens, here's why it matters, here's an example." Pause between steps for questions.]

---

## Slide 06 — `t06_example_walkthrough`

**VISUAL TYPE**: Case Anchor
**KICKER**: LET'S SEE IT IN ACTION
**TITLE**: [EXAMPLE_HEADLINE — a concrete, relatable scenario]

**IMAGE PROMPT**: [Real example walkthrough. Show the scenario (input), the process applied (the skill in action), and the result (output). Make it concrete and visual]

> **SPEAKER NOTE**: [Work through the example in 3-4 minutes. Narrate each step. "Watch what happens when we apply [CONCEPT] to this real situation..." Make it interactive — ask learners to predict the next step.]

---

## Slide 07 — `t07_key_principles`

**VISUAL TYPE**: Framework
**KICKER**: KEY PRINCIPLES
**TITLE**: [PRINCIPLES_HEADLINE — 3-4 rules of thumb]

**IMAGE PROMPT**: [3-4 principle cards, each with: icon, principle name (bold, short), one-line explanation. Memorizable. Designed so learners can take a photo]

> **SPEAKER NOTE**: [Principles in 60 seconds. "When you're back at your desk and forget everything else, remember these three things: [1], [2], [3]. Write them down."]

---

## Slide 08 — `t08_practice_setup`

**VISUAL TYPE**: Direction
**KICKER**: YOUR TURN
**TITLE**: [EXERCISE_NAME — what they're about to try]

**IMAGE PROMPT**: [Exercise briefing. Clear instructions displayed: Goal, Scenario, Steps, Time limit. Leave space in the design — this is a "look at, then do" slide]

> **SPEAKER NOTE**: [Set up the exercise in 60 seconds. "Here's the scenario: [SITUATION]. Your task: [TASK]. You have [TIME] minutes. Work in [GROUPS/PAIRS/ALONE]. I'll walk around if you're stuck. Go."]

---

## Slide 09 — `t09_practice_debrief`

**VISUAL TYPE**: Concept Split
**KICKER**: WHAT DID WE LEARN?
**TITLE**: [DEBRIEF_HEADLINE — key insights from the exercise]

**IMAGE PROMPT**: [Debrief visual — left: common successful approaches, right: common mistakes. Both framed as learning, not judgment]

> **SPEAKER NOTE**: [Debrief in 2-3 minutes. "I saw a lot of you [COMMON_APPROACH]. That works because [WHY]. A few of you ran into [COMMON_MISTAKE] — that's actually great, because it teaches us [LESSON]." Celebrate attempts, not just correct answers.]

---

## Slide 10 — `t10_advanced_tips`

**VISUAL TYPE**: Direction
**KICKER**: GOING FURTHER
**TITLE**: [ADVANCED_HEADLINE — for those who want to master this]

**IMAGE PROMPT**: [2-3 advanced techniques or variations. "If you've got the basics, try this." Progressive — respects different skill levels in the room]

> **SPEAKER NOTE**: [Advanced tips in 60 seconds. "If you found that easy, here's the next level. If you're still getting comfortable with the basics, that's fine — come back to this slide later."]

---

## Slide 11 — `t11_common_mistakes`

**VISUAL TYPE**: Risk / 2 Panels
**KICKER**: WATCH OUT FOR
**TITLE**: [PITFALLS_HEADLINE — the 3 most common errors]

**IMAGE PROMPT**: [3 mistake cards: wrong way (red/crossed out) → right way (green/checked). Visual contrast. Each labeled with "Instead of [MISTAKE], try [FIX]"]

> **SPEAKER NOTE**: [Pitfalls in 60 seconds. "Everyone makes these three mistakes when starting out. When you catch yourself [MISTAKE_1], remember: [FIX_1]. Let me tell you about a time I made all three..."]

---

## Slide 12 — `t12_recap`

**VISUAL TYPE**: Framework
**KICKER**: RECAP
**TITLE**: [RECAP_HEADLINE — what we covered today]

**IMAGE PROMPT**: [Visual summary — the learning journey: Hook → Core Concept → How It Works → Practice → Pitfalls → Mastery. Each node labeled with one word or phrase. A visual "you are here"]

> **SPEAKER NOTE**: [Recap in 60 seconds. "We started with [WHY]. We learned [CORE_CONCEPT]. We practiced with [EXERCISE]. We saw that [KEY_INSIGHT]. You now have everything you need to [TARGET_CAPABILITY]."]

---

## Slide 13 — `t13_next_steps`

**VISUAL TYPE**: Direction
**KICKER**: KEEP LEARNING
**TITLE**: [NEXT_STEPS_HEADLINE — resources and practice]

**IMAGE PROMPT**: [Resources visual: 2-3 recommended next actions, each with: what to do, where to find it, how long it takes. A clear path forward — not overwhelming]

> **SPEAKER NOTE**: [Next steps in 45 seconds. "If you do one thing after today, make it [TOP_RECOMMENDATION]. For those who want more: [RESOURCE_1], [RESOURCE_2]. My email is [EMAIL] — send me your first attempt and I'll give feedback."]

---

## Slide 14 — `t14_closer`

**VISUAL TYPE**: Closer
**KICKER**: [COURSE_NAME]
**TITLE**: [CLOSING_STATEMENT — inspiring, aspirational]
**SUBTITLE**: [CONTACT_INFO / THANK_YOU]

**IMAGE PROMPT**: [IMAGE-DIRECT. Closing visual that reinforces the transformation — the learner as capable, confident, skilled. Positive, warm, motivating]

> **SPEAKER NOTE**: [Closing in 30 seconds. "You came in [BEFORE_STATE]. You're leaving with [AFTER_STATE]. Now go [VERB] something. Thank you."]

---

## Section 6: Design Constraints

- Every concept slide is followed by an example or practice
- Instructions must be clear enough to photograph
- Visuals support memory — designed for phone photos
- Under 30 words per slide
- Warm, encouraging tone — this is teaching, not selling
- Pause/check-in slides every 5-6 slides (not specified above — add if session > 45 min)

## Section 7: Change Log

| Version | Date | What Changed |
|---------|------|-------------|
| v1 | [DATE] | Initial training deck based on intake |
