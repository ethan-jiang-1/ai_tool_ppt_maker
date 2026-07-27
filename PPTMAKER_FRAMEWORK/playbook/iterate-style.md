---
playbook: iterate-style
description: Page Authority visual-system iteration
supported_pipelines: [page-authority-image2-v1]
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

**Step 1 — MD**: Open current Page Authority raw or final projections and identify 1-3 concrete problems in visual language, Framed typography, spacing, density, recipe, image language, or reference policy.

**Step 2 — GATE**: Confirm goals and affected scope. Keep provider work limited to the Page Authority raw lifecycle.

### update-visual-system

```yaml
node: update-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
requires: [define-style-change]
produces: [updated-page-authority-visual-language]
entry: []
exit: [evidence:visual-system-updated]
```

**Step 1 — MD**: Edit the canonical Page Authority visual-language and reference registries; preserve their closed schemas and asset integrity.

**Step 2 — CLI**: Validate the changed source, then use the owning Page Authority raw or Framed refresh path for the affected evidence.

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

**Step 1 — MD**: Open all affected current raw or final projections; never approve from registry prose alone.

**Step 2 — GATE**: Read `state <run-dir> --json`; its `workflow_inspection.primary_action` supplies the current Page Authority action and `workflow_inspection.continuation` supplies any bounded reasoned continuation. `approve` records the current evidence decision; `retry` returns to update; `reject` returns to visual-language selection. A continuation stays `waived` and reports completeness separately. Current delivery must then be rebuilt and reviewed through the Page Authority delivery decision.
