---
title: Quick Start
stage: root
position: quickstart
type: guide
summary: First-time user entry for Page Authority deck production.
depends_on:
- README.md
feeds_into:
- AGENTS.md
agent_action: navigate
---

# Quick Start — First-Time Users

You decide what the deck should say and whether it is acceptable. The Agent
guides the process, builds the source, and runs the authorized production work.

## Start A Deck

Give the Agent the topic, audience, duration, language, and any source material.
It should read `PPTMAKER_FRAMEWORK/BOOTSTRAP.md`, establish local readiness, then
help turn the idea into a clear narrative and stable Page Authority slide IDs.

```text
I want to make a presentation. Read PPTMAKER_FRAMEWORK/BOOTSTRAP.md and guide me.

- Topic: [topic]
- Audience: [who will see it]
- Duration and setting: [context]
- Language: [slide / spoken language]
- Image2: [not needed yet / credentials available / need setup help]
```

New work begins with local readiness and source authoring. Provider credentials
are needed only when a selected raw-generation operation will submit work.

## What The Agent Does

| You decide | The Agent does |
| --- | --- |
| Claim, audience, examples, and visual direction | Creates the run bundle and Page Authority source |
| Whether raw and delivery evidence are acceptable | Plans, authorizes, generates, reviews, finalizes, and assembles as authorized |
| What should change | Selects the smallest ownership/invalidation path |

`framed-image2` uses a deterministic local Text Frame for final text. `pure-image2`
uses Image2 for all final pixels. The Agent records the required human decisions at
raw review and delivery review.

## Continue A Deck

The deck root contains `RUN_BUNDLE.md`. Give that file to an Agent that can access
the declared local paths and state the desired change. It locates the deck and
framework first, then reads the deck guide and state. The generic remote-chat
attachment integration is not supported.

## Useful References

- `workflow/01-content/` for narrative and source authoring
- `workflow/02-visual-system/` for visual language and references
- `workflow/04-image-production/` for Page Authority production
- `workflow/05-iteration/` for refresh and structural changes
- `charter/CONSTITUTION.md` for run-bundle ownership
