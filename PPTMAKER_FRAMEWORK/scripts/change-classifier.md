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

## Structural and migration rules

Display `position · slide_id · title`, bind every selector to one current snapshot, and preview before apply. Keep exact `plan_sha256`; bare/stale/hash-drift apply fails and must re-preview. Source apply is renderer-free. HTML target-local materialization copies only matching target-owned bytes and never copies reset/gate/delivery/node authority.

`migrate-html preview/apply` is a separate hash-bound transaction. It requires complete Agent-authored structured source, exact old-side mode/hash, active `migrate-import` execution, journal recovery rules, hidden-target rerender equality, and zero provider calls. Prompt prose is never parsed into family/layout/body.

## Communication

Tell the user which owner is stale, which local artifacts will be shown, whether remote cost is zero, and which typed human decision is needed. Never claim a page is current from metadata scalar alone. Do not hand the user an opaque internal path/token as a repair instruction; use the producer-owned diagnostic next action.
