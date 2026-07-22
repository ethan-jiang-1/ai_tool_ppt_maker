---
playbook: iterate-style
description: renderer-neutral visual system 的 Local Deck Rebuild
supported_pipelines: [html-first-v1]
includes: []
---

# Playbook: Iterate Style

## Nodes

### define-style-change

```yaml
node: define-style-change
lifecycle_phase: 2
method_module: 02-visual-system
requires: []
produces: [style-iteration-goals]
entry: []
exit: [user_evidence:iteration-goals-confirmed]
```

**Step 1 — MD**: Open current real HTML representative pages and identify 1-3 concrete problems in palette, typography roles, spacing, density, recipe, image language, or asset policy.

**Step 2 — GATE**: Confirm goals and affected scope. Do not offer style-master generation or modern Image2 refinement.

### update-visual-system

```yaml
node: update-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
requires: [define-style-change]
produces: [updated-visual-config]
entry: []
exit: [evidence:visual-system-updated]
```

**Step 1 — MD**: Edit the single structured visual config and natural-language constraints; preserve schema and asset integrity.

**Step 2 — CLI**: Validate, run Local Deck Rebuild, and publish a complete current visual review plan/contact sheet.

### review-style-system

```yaml
node: review-style-system
lifecycle_phase: 2
method_module: 02-visual-system
requires: [update-visual-system]
produces: [visual-system-decision]
decisions: [approve, retry, reject]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Open all required representatives and forced fallbacks; never approve from token prose alone.

**Step 2 — GATE**: Read `state <run-dir> --json`; its `workflow_inspection.primary_action` supplies the exact current visual approval command and `workflow_inspection.continuation` supplies any bounded reasoned continuation. `approve` publishes the exact visual plan hash; `retry` returns to update; `reject` returns to DNA/preset selection. A continuation stays `waived` and reports completeness separately. Current delivery must then be rebuilt and re-reviewed through the public final-review state command.
