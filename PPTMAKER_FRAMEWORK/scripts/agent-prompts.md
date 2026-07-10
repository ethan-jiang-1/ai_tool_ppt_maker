---
title: Agent Prompts
stage: automation
position: toolkit
type: reference
summary: 6 个 Agent 可复用的 prompt 模板——内容调研、隐喻生成、视觉预设描述、slide 审核、反馈翻译、deck brief 自动填充。
depends_on:
- BOOTSTRAP.md
feeds_into: []
agent_action: use_templates
---

# Agent Prompts — Reusable Prompt Templates

> 这些是 Agent 在执行 PPT 制作流程中可复用的 prompt 模板。
> 每个模板都有明确的输入变量和预期输出。Agent 将变量替换后直接使用或用作文本生成的基础。

---

## 1. Content Research Prompt

**用途**：为某个 topic 搜索关键数据、竞品、案例、市场信息。

**模板**：
```
Search for key facts, data, and context about {TOPIC}. I need:
1. Market size and growth rate (with sources)
2. 2-3 key competitors or alternatives and what they claim
3. 1-2 relevant case studies or examples of companies doing this well
4. Any significant recent developments (last 12 months)

Format: One bullet per fact, with source. Be specific — numbers over narratives.
```

**变量**：`{TOPIC}` — 用户的 topic 描述

---

## 2. Metaphor Generation Prompt

**用途**：基于用户 topic 和 "最想让人记住的一件事"，生成 2-3 个候选隐喻。参考 `workflow/02-content/presets/metaphor-catalog.md` 做模式匹配。

**模板**：
```
I need 2-3 metaphor candidates for a {DECK_TYPE} about {TOPIC}.
The one thing the audience must remember: {KEY_TAKEAWAY}.
Audience: {AUDIENCE_DESCRIPTION}.

For each candidate, provide:
1. Metaphor name (3-8 words, concrete and visualizable)
2. One-sentence description
3. The core tension: "The audience believes {WRONG_BELIEF}. In reality, {CORRECT_BELIEF}."
4. Why this metaphor fits this specific topic and audience

Constraints:
- Must be extendable across {SLIDE_COUNT} slides
- Must be visualizable (not abstract — something you can draw)
- Must create tension (not just "X is important")

Reference the metaphor catalog in PPTMAKER_FRAMEWORK/workflow/02-content/presets/metaphor-catalog.md
for patterns. Match against the user's industry and topic.
```

**变量**：`{DECK_TYPE}`, `{TOPIC}`, `{KEY_TAKEAWAY}`, `{AUDIENCE_DESCRIPTION}`, `{SLIDE_COUNT}`

---

## 3. Visual Preset Description Prompt

**用途**：为 2-3 个候选视觉预设生成生动的中文或英文描述，帮助用户选择。

**模板**：
```
Based on the user's topic ({TOPIC}), audience ({AUDIENCE}), and deck type ({DECK_TYPE}),
I recommend these 2-3 visual presets from the library:

[For each preset, describe:]
- Name
- What it looks like (3-4 sentences of visual description — colors, mood, feel)
- Why it fits this specific project
- What kind of impression it creates on the audience
- One potential downside/mismatch to be honest about

Available presets:
1. Dark Executive — deep navy, cyan/electric blue accents. Precision, modern, executive.
2. Clean Clinical — white, slate gray, teal data accents. Clean, rational, data-forward.
3. Warm Editorial — cream, charcoal, rust red/gold. Warm, human, sophisticated.
4. Tech Startup — deep purple, neon cyan/magenta accents. Bold, energetic, memorable.
5. Corporate Safe — white, corporate blue, gray. Professional, trustworthy, timeless.

Reference each preset's README in PPTMAKER_FRAMEWORK/workflow/01-visual/presets/ for full details.
```

**变量**：`{TOPIC}`, `{AUDIENCE}`, `{DECK_TYPE}`

---

## 4. Slide-by-Slide Review Prompt

**用途**：在用户审核 deck brief 时，逐页检查内容质量。

**模板**：
```
Review this slide specification against the design constraints:

Slide: {SLIDE_ID}
KICKER: {KICKER}
TITLE: {TITLE}
CONCEPT: {CONCEPT}

Check:
1. Is the TITLE a claim that could be argued against? (Not a topic label)
2. Does the CONCEPT specify what the audience MUST understand?
3. Is the slide's narrative function clear — why does this slide exist in the argument chain?
4. Is the IMAGE PROMPT describing a visual, not a narrative?

If any check fails, suggest a specific fix. Don't say "this is weak" — say "Try: [ALTERNATIVE_TITLE]".
```

**变量**：`{SLIDE_ID}`, `{KICKER}`, `{TITLE}`, `{CONCEPT}`

---

## 5. User Feedback Translator Prompt

**用途**：将用户模糊的反馈翻译成具体的修改指令。

**模板**：
```
The user said: "{USER_FEEDBACK}"

Translate this into specific, actionable changes:
1. What exactly needs to change? (text, visual, structure, or speaker notes)
2. Which slides are affected? (specific IDs or range)
3. Which editing chain does this map to? (A: text only, B: visual, C: notes)
4. What stages need to be rerun?
5. Estimated time to deliver the change.

If the feedback is too vague to act on, ask one clarifying question.
```

**变量**：`{USER_FEEDBACK}`

---

## 6. Deck Brief Auto-Fill Prompt

**用途**：基于用户 intake 回答和选中的模板，自动填充 deck brief 的 slide 规格。

**模板**：
```
Fill in the deck brief template for a {DECK_TYPE} about {TOPIC}.
Use the following inputs:
- Core Metaphor: {METAPHOR}
- Core Formula: {FORMULA}
- Block Map: {BLOCK_MAP_SUMMARY}
- Deck Type Template: {TEMPLATE_NAME}

For each slide in the template:
1. Fill the KICKER (short, all-caps, 2-5 words — sets the lens)
2. Fill the TITLE as a falsifiable claim (could be argued against — not a topic label)
3. Fill the CONCEPT: MUST communicate (1 sentence), MUST NOT (1 sentence), Bridge from previous slide (1 phrase)
4. Fill the IMAGE PROMPT: 150-400 words. Use the template's prompt structure. Describe layout zones, colors from the preset, exact text, anti-patterns.
5. Fill the SPEAKER NOTE: 60-90 seconds of talking points. Narrative flow, not script.

Constraints:
- Every TITLE must be debatable (could someone say "I disagree"?)
- IMAGE PROMPT: Describe the VISUAL CONTENT only — layout, colors, icons, diagrams, KPI numbers, callout text. Do NOT include header-safe-zone instructions, body text contracts, deck-wide rules, or style anchoring language. Stage 1 assembles all final text contracts once; Stage 2 receives `--prompt-is-final` and sends that audited prompt unchanged with the style reference.
- Under {MAX_WORDS} words per slide (excluding IMAGE PROMPT and SPEAKER NOTE)
- Match the visual preset's COLOR FAMILY, FORBIDDEN elements, and TONE from deck_system.txt (but reference them by describing the visual result, not by repeating the rules verbatim)

Write the complete slide-specifications.md file content. No placeholders — fill everything with concrete content based on what you know about {TOPIC}. If you need to research something (market size, competitor names, etc.), do that before filling.
```

**变量**：`{DECK_TYPE}`, `{TOPIC}`, `{METAPHOR}`, `{FORMULA}`, `{BLOCK_MAP_SUMMARY}`, `{TEMPLATE_NAME}`, `{MAX_WORDS}`

---

## 使用指南

Agent 应该在以下时机使用这些模板：

| 时机 | 使用模板 |
|------|---------|
| Intake 完成后，开始内容设计前 | Content Research + Metaphor Generation |
| 隐喻确认后，展示视觉选项时 | Visual Preset Description |
| Deck brief 草稿完成后 | Slide-by-Slide Review（逐页） |
| 用户提出修改意见时 | User Feedback Translator |
| 用户确认所有方向后 | Deck Brief Auto-Fill |
