---
title: Renderer-Neutral Visual System
stage: workflow/02-visual-system
position: entry
type: overview
feeds_into:
  - workflow/02-visual-system/00-why-deterministic-visual-systems.md
---

# Phase 2: Renderer-Neutral Visual System

Define the deck-wide visual contract without requiring a style-master image or provider. The human-owned source is `2_backbone/visual-style/color_palette.json`; its validated `html_first` projection owns palette references, bundled typography roles, spacing, component recipes, image language, and the fixed family geometry registry.

Local assets live in the layered schema-v2 catalog under `visual-style/assets/`. Slides bind stable IDs through structured fallback or typed icon fields. Asset bytes and SHA receipts are validated before composition.

Read:

1. `00-why-deterministic-visual-systems.md`
2. `01-gather-product-context-dna.md`
3. `02-design-the-visual-system.md`
4. `03-configure-visual-tokens.md`
5. `04-validate-the-html-system.md`

Start from `template-color-palette.json` or a checked-in preset. Keep
`2_backbone/visual-style/color_palette.json` as the single human-owned visual
configuration source.

Visual approval is based on real local HTML compositor output and contact-sheet evidence. After complete HTML delivery, modern Image2 refinement is an optional separately authorized visual-slot upgrade; markerless historical style-master work uses `../../reference/legacy-image2-first-maintenance.md`.
