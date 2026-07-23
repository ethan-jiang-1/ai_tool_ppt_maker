# Workflow Constitution

## Lifecycle

```text
0 setup      base runtime, intake, bundle identity
1 content    narrative, blocks, stable IDs, closed families, structured body
2 visual     renderer-neutral tokens, assets, fonts, recipes, real preview gate
3 production local HTML Stages 1-5, delivery contact sheet, PPTX, notes, final review
4 refinement optional authorized no-text visual-slot Image2 upgrade after HTML delivery
5 iteration  local HTML changes, structural versions, or isolated legacy maintenance
```

Phase 3 delivers a complete usable deck. Phase 4 is not a gate or required node; the optional `image2-refine` controller is entered only after current delivery review and exact human authorization.

## Ownership map

| Work | Controller | Primary paths | Remote |
|---|---|---|---|
| fresh HTML deck | create-deck / quick-preview | `_generated/html_production/` | no |
| HTML text/visual/notes/structure iteration | edit-* / iterate-style / restructure-slides | source + local HTML outputs | no |
| legacy whole-page maintenance | create-deck | legacy generated paths | explicit |
| clean legacy-to-HTML migration | migrate-import | `_scratch/html-migration/` then clean vNext | no |

## Gates and completion

HTML content/visual gates are authoritative version-scoped evidence, reset-bound and separate from legacy scalars. `html-delivery-review` is completion evidence, not a third gate. A current accepted HTML deck completes without Phase-4 debt. Any byte-identical rebuild after reset still needs fresh plan hash/review because reset ID is a separate freshness dimension.

## Version and structural discipline

`slide_id` is stable identity; `position` belongs to current snapshot. Structural Versioning Path is preview/hash -> hidden source staging -> no-replace visible vNext -> explicit target-local materialization. It never publishes renderer bytes or copies approvals. HTML reports `needs_local_materialization`; legacy may report `needs_render`.
