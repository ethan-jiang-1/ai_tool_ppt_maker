---
playbook: edit-notes
description: Page Authority notes-only refresh
supported_pipelines: [page-authority-image2-v1, page-authority-image2-v2]
includes: [classify-change]
---

# Playbook: Edit Notes

### refresh-speaker-notes
```yaml
node: refresh-speaker-notes
lifecycle_phase: 5
method_module: compatibility/current-v1-page-authority
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
method_module: compatibility/current-v1-page-authority
production_modes: [image2-page-authority]
requires: [refresh-speaker-notes]
produces: [verified-notes]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Verify the receipt-bound notes result before recording the new delivery decision.

## TARGET v2

### refresh-target-speaker-notes
```yaml
node: refresh-target-speaker-notes
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [classify-change]
produces: [target-page-authority-notes-receipt]
entry: [slide_specs_exists]
exit: [speaker_notes_injected]
```
**Step 1 — MD**: Confirm the source change is notes-only by stable slide ID. Notes-only work keeps final pixels unchanged.
**Step 2 — CLI**: Use the shared `05-delivery` notes refresh for the exact current target delivery receipt.

### verify-target-speaker-notes
```yaml
node: verify-target-speaker-notes
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [refresh-target-speaker-notes]
produces: [verified-target-notes]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — GATE**: Verify the receipt-bound shared-delivery notes result before recording the new version-scoped decision.
