---
title: Example — Mini Page Authority Deck
stage: workflow/01-content
position: example
type: reference
summary: Three-slide Page Authority source with stable IDs, visual briefs, and notes.
depends_on:
- workflow/01-content/template-core-metaphor.md
- workflow/01-content/template-core-formula.md
- workflow/01-content/template-design-constraints.md
feeds_into: []
agent_action: reference
---

# Example — Mini Page Authority Deck

This fictional SaaS deck shows source ownership only. Validate the actual source
against the selected visual-language registry before planning raw work.

````markdown
---
identity:
  scheme: mnemonic-v1
production:
  pipeline: page-authority-image2-v1
  page_authority_default: framed-image2
---

## Block Map

| Block | Purpose | Slides |
| --- | --- | --- |
| B1: Tension | Why dashboards are insufficient | `GapNow` |
| B2: Choice | Compare the operating models | `ModeGo` |
| B3: Action | Show the accountable loop | `ActNow` |

## Slide 01: `GapNow`

**KICKER**: THE GAP
**TITLE**: Dashboards explain yesterday; teams need a decision for today
**VISUAL IDENTITY**: [SUBJECT + MOVE]
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**: Reporting latency is an operating problem, not only a data problem.

## Slide 02: `ModeGo`

**PAGE AUTHORITY**: pure-image2
**TITLE**: Domain logic changes output from chart to action
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints: [no-logo]
```

> **SPEAKER NOTE**: Compare interpretation work with a product that recommends the next action.

## Slide 03: `ActNow`

**KICKER**: THE LOOP
**TITLE**: Context becomes useful when it moves through one accountable decision loop
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**: The feedback loop keeps human judgment visible at the decision boundary.
````

Check that all IDs are mnemonic BlockCase, every visual brief is registered, and
notes remain bound to their stable IDs.
