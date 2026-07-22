---
playbook: edit-notes
description: assembly lineage 当前时执行 Notes-Only Refresh
supported_pipelines: [html-first-v1, legacy-image2-first]
includes: [classify-change]
---

# Playbook: Edit Notes

## Nodes

### classify-change (shared)

Confirm only stable-ID speaker notes changed and assembly lineage is current. Otherwise route to the owning rebuild first.

### refresh-speaker-notes

```yaml
node: refresh-speaker-notes
lifecycle_phase: 5
method_module: 05-iteration
requires: [classify-change]
produces: [updated-pptx-with-notes, notes-injection-receipt]
entry: [slide_specs_exists]
exit: [speaker_notes_injected, evidence:notes-refreshed]
```

**Step 1 — MD**: Edit the source speaker note under its stable slide block; never edit PPTX/receipt.

**Step 2 — CLI**: Run `ppt_flow refresh <run-dir> --kind notes`. HTML publishes notes-v3 bound to current assembly/reset/delivery lineage; markerless retains eligible compatibility semantics.

### verify-speaker-notes

```yaml
node: verify-speaker-notes
lifecycle_phase: 5
method_module: 05-iteration
requires: [refresh-speaker-notes]
produces: [verified-notes]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded, user_evidence:notes-verified]
```

**Step 1 — MD**: Verify Presenter View order by stable ID. HTML notes changes stale prior final delivery review, so show current delivery and record a new typed decision only through `ppt_flow state <run-dir> --record-delivery-review proceed|repair|redirect`.

**Step 2 — GATE**: Record verification only after the current notes receipt and final review are bound. Use `state --json.workflow_inspection.primary_action` for the owner repair path. `proceed --force --reason` is available only when reviewable target bytes are current and remains an evidence waiver, not an inferred approval.
