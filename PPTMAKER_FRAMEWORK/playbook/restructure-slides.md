---
playbook: restructure-slides
description: source-only clean vNext 与 Page Authority raw materialization
supported_pipelines: [page-authority-image2-v1, page-authority-image2-v2]
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
lifecycle_phase: 5
method_module: 05-iteration
requires: [publish-structural-version]
produces: [target-local-review-artifacts]
entry: []
exit: [evidence:target-materialized]
```

**Step 1 — CLI**: Read the structural preview's per-ID raw disposition. A
`materialize_unreviewed` item may copy only hash-matching current raw bytes into the
target-owned Page Authority raw manifest; `needs_raw_generation` remains explicit
debt. Apply validates the confirmed hash, makes zero provider calls, and never
promotes copied bytes to accepted raw evidence.

**Step 2 — MD**: Stable IDs authorize byte matching only. Do not copy source reset epoch, content/visual gates, metadata mirrors, delivery review, node decisions, or cross-version paths. Reorder-only targets still need target reviews.

### review-structural-target

```yaml
node: review-structural-target
lifecycle_phase: 5
method_module: 05-iteration
requires: [materialize-structural-target]
produces: [target-content-visual-reviews]
decisions: [approve, revise, stop]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Open target ordered content plan and visual artifacts, including inserted/changed pages and recipe/page coverage.

**Step 2 — GATE**: Read target `state <run-dir> --json` and consume its producer-owned
`workflow_inspection.primary_action`: publish only the shown exact current plan-hash decision, and show
`workflow_inspection.continuation` only when the producer classifies it `confirm` and the human supplies its reason.
`revise` creates a new structural preview/version rather than patching the published target
transaction. Drift, reset, journal, and transaction conflicts are hard stops; never repair them
by hand-editing state or reusing source-version evidence.

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

**Step 1 — CLI**: Continue through Page Authority raw review, Framed/Pure
finalization, PPTX assembly, notes injection, and delivery review. Provider call
count and Image2 write set remain zero when the target has no `needs_render` debt.

**Step 2 — MD**: Verify target order/membership, notes-by-ID, receipts, target-owned manifests, and unchanged source version. Missing Page Authority raw evidence remains `needs_render`; any Generated Image Rebuild requires separate remote authorization through `create-deck`.

**Step 3 — GATE**: Record verification only after the target final delivery review is current.

## TARGET v2

### preview-target-structural-version
```yaml
node: preview-target-structural-version
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [classify-change]
produces: [target-structural-preview, target-workflow-choice]
decisions: [framed, pure]
entry: [run_bundle_exists]
exit: [user_decision_recorded]
```
**Step 1 — MD**: For insertion, deletion, reorder, or a whole-workflow switch, choose the target vNext workflow once and preview the exact structural plan. Per-slide workflow changes are not a route.
**Step 2 — GATE**: Record the selected vNext workflow only with the previewed stable-ID order and exact plan identity.

### apply-target-structural-version
```yaml
node: apply-target-structural-version
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [preview-target-structural-version]
produces: [target-vnext-source, target-vnext-raw-debt]
entry: []
exit: [evidence:target-structural-published]
```
**Step 1 — CLI**: Apply only the confirmed exact structural plan. Publication creates fresh target state and raw debt with zero provider calls and no authorization, review, final, or delivery inheritance.

### review-target-structural-route
```yaml
node: review-target-structural-route
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [apply-target-structural-version]
produces: [reviewed-target-structural-route]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Review the new vNext's workflow-bound raw debt and continue through only its selected `03` or `04` path, then shared delivery.
