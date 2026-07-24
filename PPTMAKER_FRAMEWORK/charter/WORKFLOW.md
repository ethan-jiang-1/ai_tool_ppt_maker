# Workflow Constitution

## Lifecycle

```text
0 setup      base runtime, intake, bundle identity
1 content    narrative, blocks, stable IDs, closed families, structured body
2 visual     renderer-neutral tokens, assets, fonts, recipes, real preview gate
3 production local HTML Stages 1-5, delivery contact sheet, PPTX, notes, final review
4 image production first-class whole-page Image2 and authorized no-text visual-slot refinement
5 iteration  local changes and structural versions
```

Phase 3 delivers a complete HTML deck. Phase 4 owns first-class `image2-only` whole-page creation through `create-deck`; its optional `image2-refine` controller is entered only after current HTML delivery review and exact human authorization.

## Ownership map

| Work | Controller | Primary paths | Remote |
|---|---|---|---|
| fresh HTML deck | create-deck / quick-preview | `_generated/html_production/` | no |
| fresh Image2-only deck | create-deck | whole-page generated paths | explicit |
| HTML text/visual/notes/structure iteration | edit-* / iterate-style / restructure-slides | source + local HTML outputs | no |
| cross-pipeline page-authority change | production-mode-transition | `_scratch/production-mode-transition/` then clean vNext | no |

The exact transition plan-hash commit records the target user's `proceed` intake decision. It is not a Human-Centered Gate Policy `confirm`, carries no waiver reason, and accepts neither `--reason` nor `--force`.

## Gates and completion

HTML content/visual gates are authoritative version-scoped evidence, reset-bound and separate from whole-page evidence. `html-delivery-review` is completion evidence, not a third gate. A current accepted HTML deck completes without visual-slot debt. Any byte-identical rebuild after reset still needs fresh plan hash/review because reset ID is a separate freshness dimension.

## Version and structural discipline

`slide_id` is stable identity; `position` belongs to current snapshot. Structural Versioning Path is preview/hash -> hidden source staging -> no-replace visible vNext -> explicit target-local materialization. It never publishes renderer bytes or copies approvals. HTML reports `needs_local_materialization`; whole-page Image2 reports `needs_render`.
