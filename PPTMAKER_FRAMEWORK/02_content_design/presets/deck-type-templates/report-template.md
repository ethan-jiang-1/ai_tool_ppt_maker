---
title: Deck Brief — [PROJECT NAME]
stage: 02_content_design
position: template_report
type: template
summary: 研究报告/汇报 Deck 模板。10-14 slides。Agent 用此模板快速搭建 slide-specifications，把变量替换成用户内容。
depends_on:
- 02_content_design/presets/metaphor-catalog.md
- 02_content_design/presets/block-arc-catalog.md
feeds_into:
- Run bundle 3_versions/v1/slide-specifications.md
agent_action: fill_template
---

# Report Template

> 研究报告/汇报 Deck。10-14 slides，目标：让决策者理解发现、接受建议、批准行动。
> Agent：用这个模板快速搭建 slide-specifications。报告 deck 的节奏是 发现→诊断→选项→建议→行动。

---

## Section 1: Metadata

```yaml
project: deck_{SLUG}
type: report
audience: [DECISION_MAKERS — role, authority level, what decision they need to make]
duration: [DURATION — 通常 20-30 min presentation + Q&A]
slides_language: [LANGUAGE]
speech_language: [LANGUAGE]
tier: quick
```

## Section 2: Core Metaphor

**Metaphor**: [METAPHOR_NAME — a frame for the investigation]
**Example**: "An X-ray of [TOPIC]" / "A stress test of [SYSTEM]" / "A map of [TERRITORY]"

## Section 3: Core Formula

**Finding: [WHAT_WE_FOUND]**
**Diagnosis: [WHY_IT_MATTERS]**
**Recommendation: [WHAT_TO_DO]**

## Section 4: Block Map

| Block | Narrative Question | Slides | Function |
|-------|-------------------|--------|----------|
| B1: Executive Summary | What's the bottom line? | 1-2 | Upfront conclusion for busy execs |
| B2: Context + Method | Why was this done? How? | 1-2 | Credibility and scope |
| B3: Key Findings | What did we discover? | 3-4 | Evidence, data, patterns |
| B4: Diagnosis | What does it mean? | 2 | Root causes and implications |
| B5: Options + Recommendation | What should we do? | 2-3 | Alternatives, trade-offs, recommendation |
| B6: Implementation + Risks | How do we do it? What could go wrong? | 2 | Action plan, timeline, mitigations |

## Section 5: Slide Specifications

> **每页按四层规格填**（Phase 1 填 L1/L2/L4；**L3 IMAGE PROMPT 视觉锁定后再回填**——见 `AGENTS.md` §2.7 / 本框架 bug 0003）。本模板给了每页的 **L1 骨架**（VISUAL TYPE / KICKER / TITLE）和 **L4 讲稿提示**；填充时**补全缺的两处**：
> - **L1 Meta — 加显式 `RENDER MODE`**：`Title / Opener` 和 `Closer` = `full-page`；其余 = `body+header-lock`。省略则由 VISUAL TYPE 自动映射，但写出来更清楚。
> - **L2 Concept — 每页加 `MUST communicate` / `MUST NOT` / `Bridge`**（本页在整体论证中承上启下的功能）。这是叙事弧线落到每一页的地方，**别省**。
> - **L3 IMAGE PROMPT**：Phase 1 留占位，Phase 2 视觉锁定后对照 `2_backbone/visual-style/` 回填。
> - **L4 Speaker Note**：已给提示，按你的内容改写。
>
> 完整四层形状见 `02_content_design/template-slide-specifications.md`；**填好的范例**见 `example-deck-brief-mini.md`。
> **叙事弧线**：上面 §4 的 Block Map 已实例化一条为 report 设计的弧线（Executive Summary→Context+Method→Findings→Diagnosis→Options+Recommendation→Implementation+Risks），**以它为准**；`block-arc-catalog.md` 是参考。

---

## Slide 01 — `r01_title`

**VISUAL TYPE**: Title / Opener
**KICKER**: [REPORT_TYPE — e.g., Q3 Market Analysis / Due Diligence / Strategic Review]
**TITLE**: [REPORT_TITLE — specific, descriptive]
**SUBTITLE**: Prepared for [AUDIENCE] — [DATE]

**IMAGE PROMPT**: [Opener — professional, understated. The subject matter suggested abstractly. No conclusions yet — this is the cover]

> **SPEAKER NOTE**: [Opening in 30 seconds. "Thank you for your time. We spent [DURATION] investigating [TOPIC]. Here's what we found, what it means, and what we recommend."]

---

## Slide 02 — `r02_executive_summary`

**VISUAL TYPE**: Framework
**KICKER**: EXECUTIVE SUMMARY
**TITLE**: [BOTTOM_LINE — the answer upfront, for busy executives]

**IMAGE PROMPT**: [3 key findings displayed as a hierarchical visual: top finding (largest), 2 supporting findings (smaller). Each with one sentence and one number. Bottom: the recommendation in one sentence]

> **SPEAKER NOTE**: [Executive summary in 90 seconds. "If you remember three things: [FINDING_1], [FINDING_2], [FINDING_3]. Our recommendation: [RECOMMENDATION]. The rest of this presentation is the evidence behind these conclusions."]

---

## Slide 03 — `r03_context`

**VISUAL TYPE**: Direction
**KICKER**: CONTEXT
**TITLE**: [WHY_THIS_INVESTIGATION — the question we were asked to answer]

**IMAGE PROMPT**: [Context visual — the landscape, the question, the scope. Simple diagram showing what's in scope and what's out. Timeline of the investigation]

> **SPEAKER NOTE**: [Context in 45 seconds. "We were asked to answer: [RESEARCH_QUESTION]. Our scope: [WHAT_WE_LOOKED_AT]. What's not covered: [WHAT_WE_DIDNT]. Methodology: [HOW_WE_DID_IT]. Sources available in appendix."]

---

## Slide 04 — `r04_finding_1`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: FINDING 1
**TITLE**: [FINDING_1_HEADLINE — a claim supported by evidence]

**IMAGE PROMPT**: [Evidence visual — data chart, KPI numbers, or comparative table. The finding is the headline, the visual is the proof. One finding per slide]

> **SPEAKER NOTE**: [Finding 1 in 90 seconds. "Here's what we found: [HEADLINE]. The evidence: [DATA_POINT_1], [DATA_POINT_2]. This matters because [IMPLICATION]. Our confidence in this finding: [HIGH/MEDIUM], based on [SOURCES]."]

---

## Slide 05 — `r05_finding_2`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: FINDING 2
**TITLE**: [FINDING_2_HEADLINE]

**IMAGE PROMPT**: [See pattern from Finding 1]

> **SPEAKER NOTE**: [Finding 2 in 60-90 seconds. Same structure as Finding 1.]

---

## Slide 06 — `r06_finding_3`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: FINDING 3
**TITLE**: [FINDING_3_HEADLINE]

**IMAGE PROMPT**: [See pattern from Finding 1]

> **SPEAKER NOTE**: [Finding 3 in 60-90 seconds. Same structure.]

---

## Slide 07 — `r07_patterns`

**VISUAL TYPE**: Framework
**KICKER**: CONNECTING THE DOTS
**TITLE**: [PATTERN_HEADLINE — what the findings mean when seen together]

**IMAGE PROMPT**: [Synthesis visual — the 3 findings connected by arrows or overlapping circles, revealing the larger pattern. This is where "what we found" becomes "what it means"]

> **SPEAKER NOTE**: [Pattern recognition in 90 seconds. "Taken together, these three findings tell a story: [NARRATIVE]. The common thread is [THEME]. This isn't three separate problems — it's one problem manifesting in three ways."]

---

## Slide 08 — `r08_root_causes`

**VISUAL TYPE**: Flow / Mechanism
**KICKER**: ROOT CAUSES
**TITLE**: [ROOT_CAUSE_HEADLINE — why this is happening]

**IMAGE PROMPT**: [Root cause diagram — fishbone, 5-whys tree, or causal chain. Shows symptoms → immediate causes → root causes. Visual distinction between surface and depth]

> **SPEAKER NOTE**: [Root causes in 60 seconds. "The symptoms are [SYMPTOMS]. The immediate causes are [PROXIMATE_CAUSES]. But the root cause is [ROOT_CAUSE]. Until we address [ROOT_CAUSE], we'll keep seeing [SYMPTOMS] no matter what else we fix."]

---

## Slide 09 — `r09_options`

**VISUAL TYPE**: Framework
**KICKER**: OPTIONS
**TITLE**: [OPTIONS_HEADLINE — the paths we can take]

**IMAGE PROMPT**: [2-3 option cards arranged for comparison. Each card: Option name, one-line description, 2-3 pros, 2-3 cons, rough cost/timeline indicator. Visual balance — no option visually preferred (yet)]

> **SPEAKER NOTE**: [Options in 2-3 minutes. For each option: "Option [A]: [DESCRIPTION]. Pros: [PROS]. Cons: [CONS]. Rough cost: [COST], timeline: [TIMELINE]." Don't reveal your preference yet. Let the audience form their own view first.]

---

## Slide 10 — `r10_recommendation`

**VISUAL TYPE**: Direction
**KICKER**: RECOMMENDATION
**TITLE**: [RECOMMENDATION_HEADLINE — which option and why]

**IMAGE PROMPT**: [The recommended option elevated visually — larger, highlighted, with the key reason for choosing it displayed prominently. The other options shown smaller or faded for reference]

> **SPEAKER NOTE**: [Recommendation in 60 seconds. "We recommend Option [X]. Here's why: [KEY_REASON]. Compared to Option [Y], it [ADVANTAGE]. Compared to Option [Z], it [ADVANTAGE]. The decisive factor was [DECISIVE_FACTOR]." Be clear about trade-offs — no option is perfect.]

---

## Slide 11 — `r11_implementation`

**VISUAL TYPE**: Flow / Mechanism
**KICKER**: IMPLEMENTATION
**TITLE**: [IMPLEMENTATION_HEADLINE — how we execute the recommendation]

**IMAGE PROMPT**: [Timeline with 3-4 phases. Each phase: milestone, owner, date, key deliverable. Simple Gantt-like visual showing sequence and dependencies. Clear "start" and "first review" markers]

> **SPEAKER NOTE**: [Implementation in 60 seconds. "Phase 1: [WHAT], owned by [WHO], by [WHEN]. Phase 2: [WHAT], owned by [WHO], by [WHEN]. We'll know we're on track if [SUCCESS_METRIC] by [DATE]. First checkpoint: [DATE]."]

---

## Slide 12 — `r12_risks_mitigations`

**VISUAL TYPE**: Risk / 2 Panels
**KICKER**: RISKS AND MITIGATIONS
**TITLE**: [RISK_HEADLINE — what could go wrong and how we handle it]

**IMAGE PROMPT**: [Risk table or matrix. Left column: 3-4 key risks. Right column: mitigation for each. Risk severity indicated by visual weight (not color — don't go red/green). Bottom: "Biggest risk we're accepting: [RISK] because [RATIONALE]"]

> **SPEAKER NOTE**: [Risks in 45 seconds. "Three things to watch: [RISK_1] — mitigated by [ACTION_1]. [RISK_2] — mitigated by [ACTION_2]. The risk we're accepting is [RISK_3] — the cost of fully mitigating it exceeds the potential impact. We monitor it at [FREQUENCY]."]

---

## Slide 13 — `r13_next_steps`

**VISUAL TYPE**: Direction
**KICKER**: NEXT STEPS
**TITLE**: [NEXT_STEPS_HEADLINE — what we need from you today]

**IMAGE PROMPT**: [Clean, clear ask. One primary decision requested. 2-3 immediate next actions with owners. Visual simplicity — this slide should be unmistakable in its ask]

> **SPEAKER NOTE**: [Next steps in 30 seconds. "Here's what we need from you today: [DECISION_NEEDED]. If approved, [FIRST_ACTION] begins [WHEN]. [OWNER] will send [DELIVERABLE] by [DATE]. Any questions?"]

---

## Slide 14 — `r14_closer`

**VISUAL TYPE**: Closer
**KICKER**: [REPORT_NAME]
**TITLE**: [CLOSING_STATEMENT]
**SUBTITLE**: [CONTACT_INFO] / Appendix available on request

**IMAGE PROMPT**: [IMAGE-DIRECT. Professional closing. The key finding or recommendation restated as a memorable statement. Clean, confident, final]

> **SPEAKER NOTE**: [Closing in 15 seconds. "To summarize: [ONE_SENTENCE_SUMMARY]. Our recommendation: [ONE_SENTENCE_RECOMMENDATION]. Thank you. I'm happy to take questions or dive deeper into any section."]

---

## Section 6: Design Constraints

- Executive summary comes first — busy readers may not read past slide 2
- Every finding has a confidence level and sources
- Options are presented neutrally before recommendation
- Numbers are precise, not rounded ("$3.7M" not "~$4M")
- Data sources cited (can be small/muted text)
- No cheerleading — let evidence speak

## Section 7: Change Log

| Version | Date | What Changed |
|---------|------|-------------|
| v1 | [DATE] | Initial report deck based on intake |
