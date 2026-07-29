---
playbook: edit-visual
description: Page Authority visual-owner refresh
supported_pipelines: [page-authority-image2-v1, page-authority-image2-v2]
includes: [classify-change]
---

# Playbook: Edit Visual

### rebuild-visual-evidence
```yaml
node: rebuild-visual-evidence
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [image2-page-authority]
requires: [classify-change]
produces: [current-raw-or-frame-evidence]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — MD**: Change the registered visual language, reference material, or authority-owned source fields.
**Step 2 — CLI**: Re-enter raw planning when raw facts changed; use only the Framed-local owner for frame-only change.

### approve-visual-evidence
```yaml
node: approve-visual-evidence
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [image2-page-authority]
requires: [rebuild-visual-evidence]
produces: [reviewed-visual-evidence]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Review the current raw or final projection and record the direct owner decision.

## TARGET v2

### refresh-target-framed-visual
```yaml
node: refresh-target-framed-visual
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
requires: [classify-change]
produces: [target-framed-visual-refresh-route]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — MD**: A Framed preset, underlay, or visual-language change invalidates the exact underlay/raw tuple and returns to the Framed raw rebuild route.
**Step 2 — CLI**: Use the owner-issued Framed rebuild action, then shared delivery. Do not classify this as a text-only local compose.

### refresh-target-pure-visual
```yaml
node: refresh-target-pure-visual
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
requires: [classify-change]
produces: [target-pure-visual-refresh-route]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — MD**: A Pure display or visual change invalidates raw work and returns to the Pure rebuild route.
**Step 2 — CLI**: Use the owner-issued Pure rebuild action, then shared delivery.

### review-target-visual-delivery
```yaml
node: review-target-visual-delivery
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [refresh-target-framed-visual, refresh-target-pure-visual]
produces: [reviewed-target-visual-evidence]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Review the selected workflow's exact current delivery evidence and record the version-scoped decision.
