---
title: PPT Maker Harness
---

# PPT Maker Harness

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
├── playbook/   MD Controllers and controller manifest
└── schema/     authoritative Page Image production definitions
```

`deck_*` and `dpt_*` are production data, not Harness source. The supported
public Run Bundle creation command is `ppt_flow init`; `bundle_layout.mjs --init`
is its layout owner's lower-level interface, not a second startup route.
`_generated/` is always rebuildable derived data.

## Current Method Graph

```text
00-setup: operation-scoped readiness
01-content: Page Image source and stable slide identity
02-visual-system: visual language, references, Provider Content Schema, and Header Rendering Policy
03 Framed workflow semantics and transparent header overlay
04 Pure workflow semantics and raw-to-final publication
05 shared final projection, PPTX assembly, notes, and delivery review
06 workflow-aware refresh and structural versioning
```

New decks use only `page-image-workflow`, record exactly one version workflow,
`framed` or `pure`, before provider work, and bind that source selection in
State's `production_identity.by_version` record.
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
report `needs_render` as debt rather than permission. A partial,
hybrid, or mismatched source/state pair is a byte-preserving
`repair-current-protocol-identity` hard-stop, not a current workflow branch.

## Where To Start

1. Read [`BOOTSTRAP.md`](BOOTSTRAP.md) and [`charter/AGENT_CONTRACT.md`](charter/AGENT_CONTRACT.md).
2. Run `node ppt_maker_harness/scripts/ppt_flow.mjs doctor`.
3. For a deck, locate its `RUN_BUNDLE.md`, then read its `deck-guide.md`.
4. For PPT Maker Harness maintenance, read the owning `openspec/specs/` capability,
   its active delta, and then the active change task list. `../CONTEXT.md` is the
   terminology reference, not a second behavior specification.

Git is optional and user-owned. Visible `vN` plus Structural Versioning Path is
the deck version authority; do not inspect or mutate Git without explicit,
named user authorization and scope.
