---
playbook: edit-notes
description: Page Authority notes-only refresh
supported_pipelines: [page-authority-image2-v1]
includes: [classify-change]
---

# Playbook: Edit Notes

### refresh-speaker-notes
```yaml
node: refresh-speaker-notes
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [image2-page-authority]
requires: [classify-change]
produces: [page-authority-notes-receipt]
entry: [slide_specs_exists]
exit: [speaker_notes_injected]
```
**Step 1 — MD**: Edit source notes by stable slide ID only.
**Step 2 — CLI**: Refresh notes against the current Page Authority assembly receipt.

### verify-speaker-notes
```yaml
node: verify-speaker-notes
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [image2-page-authority]
requires: [refresh-speaker-notes]
produces: [verified-notes]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Verify the receipt-bound notes result before recording the new delivery decision.
