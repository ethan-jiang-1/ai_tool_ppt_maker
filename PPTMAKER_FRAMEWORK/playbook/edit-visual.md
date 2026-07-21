---
playbook: edit-visual
description: HTML family、fallback、asset 或 visual config 的本地重建
supported_pipelines: [html-first-v1]
includes: [classify-change]
---

# Playbook: Edit Visual

## Nodes

### classify-change (shared)

Resolve Local Slide Rebuild for family/fallback/asset/page dependency or Local Deck Rebuild for global visual config/runtime/recipe changes. No provider path is valid.

### rebuild-visual-evidence

```yaml
node: rebuild-visual-evidence
lifecycle_phase: 5
method_module: 05-iteration
requires: [classify-change]
produces: [visual-review-plan, visual-contact-sheet]
entry: [slide_specs_exists]
exit: [evidence:visual-evidence-rebuilt]
```

**Step 1 — MD**: Edit structured family/body/fallback, catalog assets, or `color_palette.json` in its owning source. Never add arbitrary HTML/CSS/coordinates or a style master.

**Step 2 — CLI**: Run scoped/full local preview. Global changes refresh recipe representatives; page-local changes refresh only affected page dependency evidence. Selected visuals must show forced fallback.

### approve-visual-evidence

```yaml
node: approve-visual-evidence
lifecycle_phase: 5
method_module: 05-iteration
requires: [rebuild-visual-evidence]
produces: [html-visual-review]
decisions: [approve, revise, waive, proceed, repair, redirect]
entry: []
exit: [user_decision_recorded, gate_approved:visual]
```

**Step 1 — MD**: Open every outstanding real artifact and explain affected coverage/scope.

**Step 2 — GATE**: Read `state <run-dir> --json` and publish the exact current visual plan hash only through its producer-owned command. A waiver needs a human reason and remains `waived` with independent `evidence_complete`; never treat the refreshed contact sheet as approval. After the gate decision, build locally and record a new final delivery review through `state --record-delivery-review`.
