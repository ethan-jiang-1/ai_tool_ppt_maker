---
title: Example — Mini Structured Deck
stage: workflow/01-content
position: example
type: reference
summary: 三页 HTML-first source 示例，覆盖 hero、comparison、flow 与 speaker notes。
depends_on:
- workflow/01-content/template-core-metaphor.md
- workflow/01-content/template-core-formula.md
- workflow/01-content/template-design-constraints.md
- workflow/01-content/03-specify-structured-slides.md
- workflow/01-content/04-choose-layout-families.md
feeds_into: []
agent_action: reference
---

# Example — Mini Structured Deck

主题：虚构 SaaS 公司把 analytics 从 dashboard 变成 action。示例只展示 source contract；准确 family schema 仍以 Stage 1 validator 为准。

````markdown
---
production:
  pipeline: html-first-v1
identity:
  scheme: mnemonic-v1
---

## Block Map

| Block | Purpose | Slides |
|---|---|---|
| B1: Tension | Why dashboards are insufficient | `GapNow` |
| B2: Choice | Compare the operating models | `ModeGo` |
| B3: Action | Show how the product changes work | `ActNow` |

## Slide 01: `GapNow`

**VISUAL TYPE**: Opener
**KICKER**: THE GAP
**TITLE**: Dashboards explain yesterday; teams need a decision for today

**CONCEPT**:
- **MUST communicate**: Reporting latency is an operating problem, not only a data problem.
- **MUST NOT**: Claim prediction alone creates value.
- **Bridge from previous**: N/A — opener.
- **Bridge to next**: Compare dashboard output with decision output.

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: "From rearview mirror to headlights"
supporting_text: "The useful product is the next action, not another chart."
callout: "Latency compounds every time a team waits for interpretation."
```

> **SPEAKER NOTE**
>
> **Narrative flow:** Start with a familiar frustration, then separate prediction from action.
>
> **Takeaway:** Analytics only matters when it changes the next decision.

## Slide 02: `ModeGo`

**VISUAL TYPE**: Comparison
**KICKER**: TWO MODELS
**TITLE**: Generic analytics leaves the hardest reasoning with the customer

**CONCEPT**:
- **MUST communicate**: Domain logic plus current context changes the output from chart to action.
- **MUST NOT**: Dismiss existing BI tools; show the ownership difference.
- **Bridge from previous**: Make the opening tension concrete.
- **Bridge to next**: Show the operating flow of the proposed model.

**SLIDE BODY**:
```yaml
schema_version: 1
family: comparison
left:
  heading: "Dashboard model"
  points:
    - "Shows what changed"
    - "Customer interprets the signal"
right:
  heading: "Decision model"
  points:
    - "Applies domain rules"
    - "Recommends the next action"
callout: "The moat is encoded judgment, not a prettier chart."
```

> **SPEAKER NOTE**
>
> **Narrative flow:** Respect the old tool, then show where work still sits.
>
> **Takeaway:** Product differentiation is ownership of the reasoning step.

## Slide 03: `ActNow`

**VISUAL TYPE**: Flow
**KICKER**: HOW IT WORKS
**TITLE**: Context becomes useful when it moves through one accountable decision loop

**CONCEPT**:
- **MUST communicate**: Inputs, domain logic, recommendation, and feedback form one loop.
- **MUST NOT**: Present an autonomous black box.
- **Bridge from previous**: Explain the mechanism behind the decision model.
- **Bridge to next**: N/A — close on the action loop.

**SLIDE BODY**:
```yaml
schema_version: 1
family: flow
steps:
  - title: "Observe"
    body: "Live operational context"
  - title: "Reason"
    body: "Domain constraints and priorities"
  - title: "Recommend"
    body: "One accountable next action"
  - title: "Learn"
    body: "Outcome returns to the loop"
callout: "Human judgment remains visible at the decision boundary."
```

> **SPEAKER NOTE**
>
> **Narrative flow:** Walk left to right and point out the human decision boundary.
>
> **Takeaway:** The product compounds context without hiding accountability.
````

检查点：三个 ID 都是可口述 BlockCase；source 中没有 `RENDER MODE`、`IMAGE PROMPT`、`VISUAL ASSETS`、HTML/CSS 或坐标；speaker notes 属于各自 stable ID。
