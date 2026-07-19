---
playbook: restructure-slides
description: source-only clean vNext 与 pipeline-specific materialization
supported_pipelines: [html-first-v1, legacy-image2-first]
includes: [classify-change]
---

# Playbook: Restructure Slides

## Nodes

### classify-change (shared)

Resolve every position/spoken selector to the current stable ID. New IDs are Agent-authored mnemonic-v1, exactly two BlockCase semantic chunks, 5-8 ASCII letters, preferably 5-6.

### publish-structural-version

```yaml
node: publish-structural-version
lifecycle_phase: 5
method_module: 05-iteration
requires: [classify-change]
produces: [new-version-dir, structural-edit-receipt]
entry: [run_bundle_exists]
exit: [evidence:new-version-created]
```

**Step 1 — MD**: Run `ppt_flow slides list/resolve`, then preview the exact move/delete/insert/multi-operation. Show position · ID · title before/after, warnings, pipeline-specific debt, and target version. Keep the plan hash internally; the user confirms the shown plan, not a copied hash.

**Step 2 — CLI**: Replay the exact operation with `--apply --plan-sha256 <confirmed-hash>`. Stale/drift means a new preview. Apply publishes source/control only through hidden no-replace staging and invokes no renderer/provider.

### materialize-structural-target

```yaml
node: materialize-structural-target
lifecycle_phase: 3
method_module: 03-html-production
requires: [publish-structural-version]
produces: [target-local-review-artifacts]
entry: []
exit: [evidence:target-materialized]
```

**Step 1 — CLI**: For HTML `needs_local_materialization`, explicitly run target-local materialization. It recomputes fingerprints, copies only matching immutable bytes into target-owned objects/manifests with target reset ID, composes missing bytes locally, publishes Stage 1-3 review artifacts, and stops at typed `review_required`.

**Step 2 — MD**: Stable IDs authorize byte matching only. Do not copy source reset epoch, content/visual gates, metadata mirrors, delivery review, node decisions, or cross-version paths. Reorder-only targets still need target reviews.

### review-structural-target

```yaml
node: review-structural-target
lifecycle_phase: 3
method_module: 03-html-production
requires: [materialize-structural-target]
produces: [target-content-visual-reviews]
decisions: [approve, revise, stop]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Open target ordered content plan and visual artifacts, including inserted/changed pages and recipe/page coverage.

**Step 2 — GATE**: Publish target exact plan-hash gates before continuing Stage 4/5. `revise` creates a new structural preview/version rather than patching the published target transaction.

### verify-structural-delivery

```yaml
node: verify-structural-delivery
lifecycle_phase: 5
method_module: 05-iteration
requires: [review-structural-target]
produces: [verified-structure]
decisions: [proceed, repair, redirect]
entry: [node_decision:review-structural-target:approve]
exit: [user_decision_recorded, user_evidence:structure-change-verified]
```

**Step 1 — CLI**: Continue target delivery through local contact sheet, Stage 4, Stage 5, and final review. Provider call count and Image2 write set must be zero.

**Step 2 — MD**: Verify target order/membership, notes-by-ID, receipts, target-owned manifests, and unchanged source version. Markerless legacy instead keeps `needs_render`; any Generated Image Rebuild requires separate remote authorization through legacy maintenance.

**Step 3 — GATE**: Record verification only after the target final delivery review is current.
