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
It should read `ppt_maker_harness/BOOTSTRAP.md`, establish local readiness, then
help turn the idea into a clear narrative and stable Page Authority slide IDs.

```text
I want to make a presentation. Read ppt_maker_harness/BOOTSTRAP.md and guide me.

- Topic: [topic]
- Audience: [who will see it]
- Duration and setting: [context]
- Language: [slide / spoken language]
- Image2: [not needed yet / credentials available / need setup help]
```

New work begins with local readiness and source authoring. Provider credentials
are needed only when a selected raw-generation operation will submit work. Before
that work, choose one version workflow: `framed` for local Text Frame titles or
`pure` when Image2 must own readable display content. The choice covers the
whole version, never an individual slide.

## What The Agent Does

| You decide | The Agent does |
| --- | --- |
| Claim, audience, examples, and visual direction | Creates the run bundle and Page Authority source |
| Whether raw and delivery evidence are acceptable | Plans, authorizes, generates, reviews, finalizes, and assembles as authorized |
| What should change | Selects the smallest ownership/invalidation path |

Framed uses a deterministic local Text Frame for final text. Pure uses Image2
for all final pixels. The Agent records the required human decisions at raw
review and delivery review through `03-framed-image XOR 04-pure-image ->
05-delivery -> 06-iteration`.

## Continue A Deck

The deck root contains `RUN_BUNDLE.md`. Give that file to an Agent that can access
the declared local paths and state the desired change. It locates the deck and
the Harness first, then reads the deck guide and state. The generic remote-chat
attachment integration is not supported.

## Useful References

- `workflow/01-content/` for narrative and source authoring
- `workflow/02-visual-system/` for visual language and references
- `workflow/03-framed-image/` or `workflow/04-pure-image/` for the selected production workflow
- `workflow/05-delivery/` for final projection, PPTX, notes, and delivery review
- `workflow/06-iteration/` for refresh and structural changes
- `charter/CONSTITUTION.md` for run-bundle ownership
