---
playbook: edit-text
description: Page Authority text-owner refresh
supported_pipelines: [page-authority-image2-v1, page-authority-image2-v2]
includes: [classify-change]
---

# Playbook: Edit Text

### rebuild-text-slides
```yaml
node: rebuild-text-slides
lifecycle_phase: 5
method_module: compatibility/current-v1-page-authority
production_modes: [image2-page-authority]
requires: [classify-change]
produces: [updated-page-authority-source]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — MD**: Change source-owned display fields while preserving stable IDs.
**Step 2 — CLI**: A Framed text-only edit uses the local refresh owner; a Pure edit returns to raw planning.

### review-text-delivery
```yaml
node: review-text-delivery
lifecycle_phase: 5
method_module: compatibility/current-v1-page-authority
production_modes: [image2-page-authority]
requires: [rebuild-text-slides]
produces: [verified-text-change]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Review current final/PPTX/notes evidence and record the delivery decision.

## TARGET v2

### refresh-target-framed-text
```yaml
node: refresh-target-framed-text
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
requires: [classify-change]
produces: [target-framed-refresh-route]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — MD**: Consume the target refresh route. Only current exact Framed underlay evidence may use local composition; all other Framed text changes return to Framed raw rebuild.
**Step 2 — CLI**: Run the owner-issued Framed or delivery action from that route. Do not redirect this version to Pure.

### refresh-target-pure-text
```yaml
node: refresh-target-pure-text
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
requires: [classify-change]
produces: [target-pure-refresh-route]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — MD**: Consume the target refresh route. Visible Pure text always carries Pure raw rebuild debt.
**Step 2 — CLI**: Run the owner-issued Pure rebuild and then shared delivery. Do not offer a Framed local compose path.

### review-target-text-delivery
```yaml
node: review-target-text-delivery
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [refresh-target-framed-text, refresh-target-pure-text]
produces: [verified-target-text-change]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Review the selected workflow's current shared-delivery evidence and record the version-scoped decision.
