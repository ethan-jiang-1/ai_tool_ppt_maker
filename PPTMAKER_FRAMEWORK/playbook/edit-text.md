---
playbook: edit-text
description: Page Authority text-owner refresh
supported_pipelines: [page-authority-image2-v1]
includes: [classify-change]
---

# Playbook: Edit Text

### rebuild-text-slides
```yaml
node: rebuild-text-slides
lifecycle_phase: 5
method_module: 05-iteration
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
method_module: 05-iteration
production_modes: [image2-page-authority]
requires: [rebuild-text-slides]
produces: [verified-text-change]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Review current final/PPTX/notes evidence and record the delivery decision.
