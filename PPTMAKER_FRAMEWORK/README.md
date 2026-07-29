---
title: PPTMAKER_FRAMEWORK
version: 0.23.0
---

# PPTMAKER_FRAMEWORK · v0.23.0

AI-driven presentation framework soft bundle. The Agent owns process and local
production work; the human owns content, visual acceptance, and remote-cost
authorization.

## Source Directories

```text
PPTMAKER_FRAMEWORK/
├── workflow/   setup, content, visual system, Framed/Pure, delivery, iteration
├── scripts/    Node ESM CLI and capability modules
├── charter/    directory, lifecycle, node, and state rules
├── reference/  glossary, anti-patterns, and quick start
└── playbook/   MD Controllers and controller manifest
```

`deck_*` and `dpt_*` are production data, not framework source. A run bundle is
created by `bundle_layout.mjs`; `_generated/` is always rebuildable derived data.

## Current Lifecycle

```text
0 setup and operation-scoped readiness
1 Page Authority source and stable slide identity
2 visual language, references, and Text Frame inputs
03 Framed workflow semantics and local composition
04 Pure workflow semantics and raw-to-final publication
05 shared final projection, PPTX assembly, notes, and delivery review
06 workflow-aware refresh and structural versioning
```

New decks use only `image2-page-authority-v2` / `page-authority-image2-v2` and
record exactly one version workflow, `framed` or `pure`, before provider work.
The method graph is `03-framed-image XOR 04-pure-image -> 05-delivery ->
06-iteration`. Framed supports local deterministic text composition; Pure uses
Image2 for every final pixel. Raw work is receipt-bound and requires explicit
authorization only when it submits a nonzero provider batch. The exact v1 pair
is an existing-run compatibility input, never a new-deck choice.

## Refresh Vocabulary

| Intent | Current owner path |
| --- | --- |
| Framed Text Frame-only, exact evidence + preset | `03-framed-image` Header Text & Style Refresh |
| Pure text/visual or Framed preset/underlay change | Selected workflow Generated Image Rebuild |
| Speaker notes only | `05-delivery` Notes-Only Refresh |
| Add, remove, move, reorder, or switch workflow | `06-iteration` Structural Versioning Path |

Structural preview and apply preserve stable IDs, bind an exact plan hash, and
report `needs_render` as debt rather than permission. A recognized historical
source/state pair is readable only through the observer and explicit adoption
transaction.

## Where To Start

1. Read [`BOOTSTRAP.md`](BOOTSTRAP.md) and [`charter/AGENT_CONTRACT.md`](charter/AGENT_CONTRACT.md).
2. Run `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`.
3. For a deck, locate its `RUN_BUNDLE.md`, then read its `deck-guide.md`.
4. For framework maintenance, read the active OpenSpec change and its task list.

Git is optional and user-owned. Visible `vN` plus Structural Versioning Path is
the deck version authority; do not inspect or mutate Git without explicit,
named user authorization and scope.
