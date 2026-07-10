---
title: Image Prompt Builder — Template
stage: workflow/03-prompts
position: template
type: template
summary: 填空模板。Agent 复制到 run bundle 并引导用户逐 section 填写。
depends_on:
- workflow/03-prompts/README.md
feeds_into: []
agent_action: fill_template
---

# Image Prompt Builder — Template

> [INSTRUCTION: 填空模板——写 IMAGE PROMPT 时用它确保不漏维度。复制下面结构，替换所有 [PLACEHOLDER]。]

---

```
LAYOUT: [PLACEHOLDER: 16:9 canvas (e.g., 1672x941). Background color + hex.]

CONTENT ZONE: [PLACEHOLDER: y=NNN to y=NNN. Describe the macro layout — how many panels? what proportions? any divider?]

---

ZONE 1: [PLACEHOLDER: Name + position]
- [Background panel — color, opacity]
- [Icon — what, color, size]
- [Label text — font weight, size, color, exact wording in quotes]
- [Body text — 2-4 short lines, size, color, exact wording]
- [Any tags/badges — color, wording]

ZONE 2: [PLACEHOLDER: Same structure as Zone 1]

[PLACEHOLDER: Add more zones as needed]

---

CALLOUT BAR: [PLACEHOLDER: y=805 to y=900 if applicable]
- Full width, dark panel
- Single sentence: "[EXACT TEXT IN QUOTES]"
- Accent line above/below text

---

COLOR MEANINGS (consistent across all slides):
- [COLOR 1 + hex]: [what it means — e.g., "customer outcomes, positive signals"]
- [COLOR 2 + hex]: [what it means]
- [COLOR 3 + hex]: [what it means]
- NEVER use: [warm tones / red / orange / etc. — list forbidden colors]

---

TEXT ON THIS SLIDE:
- "[EXACT TEXT 1]"
- "[EXACT TEXT 2]"
- ...

---

DO NOT RENDER:
- No [logos / watermarks / page numbers / stock photos / clip art]
- No [CJK characters / warm tones / gradient orbs / fotos of people]
- No text in header zone (y=0 to y=[HEADER_SAFE_ZONE])
- No [other deck-specific prohibitions]
```

[INSTRUCTION: 写完 IMAGE PROMPT 后，用这个 checklist 自查：
- [ ] 有没有定义 layout zone 的 y 坐标范围？
- [ ] 每个 zone 的元素是否都描述了位置、颜色、大小？
- [ ] 所有颜色是否都有 hex code + 语义角色？
- [ ] 所有文字是否都出现在 TEXT CONTENT 段落（精确 wording）？
- [ ] ANTI-PATTERNS 段落是否覆盖了该 deck 的特定禁止项？
- [ ] Header zone 是否明确告诉 model 留空？
- [ ] Prompt 长度是否在 200-500 words（标准 slide）/ 100-200（简单 slide）？]
