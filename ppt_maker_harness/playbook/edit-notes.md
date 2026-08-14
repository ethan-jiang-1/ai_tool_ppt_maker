---
playbook: edit-notes
description: Page Image Workflow notes-only refresh
supported_pipelines: [page-image-workflow]
includes: [classify-change]
---

# Playbook: Edit Notes

### refresh-target-speaker-notes
```yaml
node: refresh-target-speaker-notes
method_module: 06-iteration
production_workflows: [framed, pure]
requires: [classify-change]
produces: [target-page-image-notes-receipt]
entry: [slide_specs_exists]
exit: [speaker_notes_injected]
```
**Step 1 — CLI**: Refresh notes only from the current Page Image final manifest and matching delivery lineage.

### verify-target-speaker-notes
```yaml
node: verify-target-speaker-notes
method_module: 06-iteration
production_workflows: [framed, pure]
requires: [refresh-target-speaker-notes]
produces: [verified-target-notes]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Inspect the updated notes receipt and delivery lineage.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against the current notes evidence.
