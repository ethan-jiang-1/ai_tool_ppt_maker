---
playbook: edit-visual
description: Page Image Workflow visual refresh
supported_pipelines: [page-image-workflow]
includes: [classify-change]
---

# Playbook: Edit Visual

### refresh-target-framed-visual
```yaml
node: refresh-target-framed-visual
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [classify-change]
produces: [target-framed-visual-refresh-route]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — CLI**: Framed visual, protected-geometry, or header-profile changes use the selected Framed raw rebuild route.

### refresh-target-pure-visual
```yaml
node: refresh-target-pure-visual
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [classify-change]
produces: [target-pure-visual-refresh-route]
entry: [slide_specs_exists]
exit: [slide_specs_valid]
```
**Step 1 — CLI**: Pure visual changes use the selected Pure raw rebuild route and scoped authorization.

### review-target-visual-delivery
```yaml
node: review-target-visual-delivery
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-workflow]
production_workflows: [framed, pure]
requires: [refresh-target-framed-visual, refresh-target-pure-visual]
produces: [reviewed-target-visual-evidence]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Inspect the selected workflow's updated visual and delivery evidence.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against that exact lineage.
