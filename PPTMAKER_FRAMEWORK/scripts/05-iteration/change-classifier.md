---
title: Change Classifier
stage: automation
position: toolkit
type: reference
summary: marker-first routing from natural language change to the smallest owner and stale set.
depends_on:
- BOOTSTRAP.md
- AGENTS.md
feeds_into: []
agent_action: classify_changes
---

# Change Classifier

> 先按权威 `production_mode.by_version["3_versions/vN"].mode` 分类，再按 verified pipeline。`html-only` 现代细化（modern refinement）被禁用（typed guidance，零写入）；`html-then-image2` 细化是完成要求；`image2-only` 用 whole-page pilot/build，不走 modern visual-slot 细化，且 whole-page 工作不是 legacy-only maintenance。Structural Versioning Path 仍是增删重排的正式路径，不在这三个 refresh 路径之内。

Probe the canonical `production.pipeline` before interpreting flags, render mode, readiness, or writing. Then resolve source owner and stale evidence.

## HTML-first routes

| User change | Route | Stale set |
|---|---|---|
| header/body/family/fallback on selected IDs | Local Slide Rebuild | Stage 1-3 affected pages, content/page visual review, delivery |
| palette/typography/recipe/runtime/renderer | Local Deck Rebuild | global recipe representatives, affected pages, delivery |
| speaker notes only | Notes-Only Refresh | Stage 5 and final delivery review |
| add/delete/move/reorder | Structural Versioning Path | source-only vNext, target local materialization, target reviews |
| generated owner missing with current authority | confirmed HTML production reset | new reset epoch, all reviews/delivery |

Ordinary copy does not stale the global visual system when page dependencies are unchanged, but browser font/overflow/composition checks always rerun. Selected visual changes retain forced-fallback review. Stable IDs authorize byte matching only.

## Markerless legacy routes

Use Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, or Structural Versioning Path only under `legacy-image2-maintenance`. A legacy `needs_render` report describes remote cost; it does not authorize provider work. A new explicit generation decision must bind IDs/profile/count.

## Optional HTML-first refinement

After `html-delivery-review: proceed`, the user may explicitly select the
`image2-refine` controller. It is bounded to 2–4 stable IDs and one no-text
visual slot per page. Plan/authorize/generate/review/promotion are separate
steps; a declined refinement leaves the HTML delivery complete. This route never
uses the legacy whole-page renderer and never runs during ordinary HTML edits.

## Structural and migration rules

Display `position · slide_id · title`, bind every selector to one current snapshot, and preview before apply. Keep exact `plan_sha256`; bare/stale/hash-drift apply fails and must re-preview. Source apply is renderer-free. HTML target-local materialization copies only matching target-owned bytes and never copies reset/gate/delivery/node authority.

`migrate-html prepare -> Agent authoring -> preview -> state confirmation -> apply` is a separate hash-bound transaction. Preparation is isolated and zero-provider; a preview guide is not comparison evidence. Complete preview requires exact old-side mode/hash, the Controller-owned confirmation creates the active `migrate-import` apply execution, and apply keeps journal recovery/hidden-target rerender equality. Prompt prose is never parsed into family/layout/body.

## Communication

Tell the user which owner is stale, which local artifacts will be shown, whether remote cost is zero, and which typed human decision is needed. Never claim a page is current from metadata scalar alone. Do not hand the user an opaque internal path/token as a repair instruction; use the producer-owned diagnostic next action.
