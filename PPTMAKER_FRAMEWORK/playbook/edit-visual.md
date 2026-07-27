---
playbook: edit-visual
description: Page Authority visual-owner refresh
supported_pipelines: [page-authority-image2-v1]
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
