---
playbook: edit-text
description: v2 Page Authority text refresh
supported_pipelines: [page-authority-image2-v2]
includes: [classify-change]
---

# Playbook: Edit Text

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
**Step 1 — CLI**: Use Framed local text refresh only when accepted raw evidence and the frame preset remain current.

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
**Step 1 — CLI**: Pure visible-text work follows the selected Pure raw rebuild route and scoped authorization.

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
**Step 1 — MD**: Inspect the selected workflow's updated delivery evidence.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against that exact lineage.
