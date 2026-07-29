---
playbook: restructure-slides
description: v2 Page Authority structural versioning
supported_pipelines: [page-authority-image2-v2]
includes: [classify-change]
---

# Playbook: Restructure Slides

## Nodes

### classify-change (shared)

Resolve every position/spoken selector to the current stable ID. New IDs are Agent-authored mnemonic-v1, exactly two BlockCase semantic chunks, 5-8 ASCII letters, preferably 5-6.

## v2 structural path



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
