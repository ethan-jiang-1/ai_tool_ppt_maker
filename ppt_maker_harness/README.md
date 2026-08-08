---
title: PPT Maker Harness
version: 0.24.3
---

# PPT Maker Harness · v0.24.3

AI-driven presentation Harness soft bundle. The Agent owns process and local
production work; the human owns content, visual acceptance, and remote-cost
authorization.

## Source Directories

```text
ppt_maker_harness/
├── workflow/   setup, content, visual system, Framed/Pure, delivery, iteration
├── scripts/    Node ESM CLI and capability modules
├── charter/    directory, lifecycle, node, and state rules
├── reference/  glossary, anti-patterns, and quick start
└── playbook/   MD Controllers and controller manifest
```

`deck_*` and `dpt_*` are production data, not Harness source. A run bundle is
created by `bundle_layout.mjs`; `_generated/` is always rebuildable derived data.

## Current Lifecycle

```text
0 setup and operation-scoped readiness
1 Page Image source and stable slide identity
2 visual language, references, Provider Content Schema, and Header Rendering Policy
03 Framed workflow semantics and transparent header overlay
04 Pure workflow semantics and raw-to-final publication
05 shared final projection, PPTX assembly, notes, and delivery review
06 workflow-aware refresh and structural versioning
```

New decks use only `image2-page-workflow-v1` / `page-image-workflow-v1` and
record exactly one version workflow, `framed` or `pure`, before provider work.
The method graph is `03-framed-image XOR 04-pure-image -> 05-delivery ->
06-iteration`. Framed supports only deterministic local header overlay; both
policies use Provider-rendered body content. Raw work is receipt-bound and requires explicit
authorization only when it submits a nonzero provider batch.

## Refresh Vocabulary

| Intent | Current owner path |
| --- | --- |
| Framed exact compiled input, geometry, contract, and profile | `03-framed-image` Header Text & Style Refresh |
| Provider-visible or header-literal content, visual, geometry, or profile change | Selected workflow Generated Image Rebuild |
| Speaker notes only | `05-delivery` Notes-Only Refresh |
| Add, remove, move, reorder, or switch workflow | `06-iteration` Structural Versioning Path |

Structural preview and apply preserve stable IDs, bind an exact plan hash, and
report `needs_render` as debt rather than permission. A v2, partial,
hybrid, or mismatched source/state pair is a byte-preserving
`unsupported-protocol/export` hard-stop, not a current lifecycle branch.

## Where To Start

1. Read [`BOOTSTRAP.md`](BOOTSTRAP.md) and [`charter/AGENT_CONTRACT.md`](charter/AGENT_CONTRACT.md).
2. Run `node ppt_maker_harness/scripts/ppt_flow.mjs doctor`.
3. For a deck, locate its `RUN_BUNDLE.md`, then read its `deck-guide.md`.
4. For PPT Maker Harness maintenance, read the active OpenSpec change and its task list.

Git is optional and user-owned. Visible `vN` plus Structural Versioning Path is
the deck version authority; do not inspect or mutate Git without explicit,
named user authorization and scope.
