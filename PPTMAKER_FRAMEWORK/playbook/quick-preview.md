---
playbook: quick-preview
description: Page Authority local evidence preview
supported_pipelines: [page-authority-image2-v1]
includes: []
---

# Playbook: Quick Preview

## Nodes

### validate-preview-source

```yaml
node: validate-preview-source
lifecycle_phase: 5
method_module: compatibility/current-v1-page-authority
production_modes: [image2-page-authority]
requires: []
produces: [preview-readiness]
entry: [slide_specs_exists]
exit: [slide_specs_valid, evidence:preview-readiness-validated]
```

**Step 1 — CLI**: Run write-free `ppt_flow validate <run-dir>`. A Page Authority source must be valid before any raw or Framed evidence is prepared.

### compose-local-preview

```yaml
node: compose-local-preview
lifecycle_phase: 5
method_module: compatibility/current-v1-page-authority
production_modes: [image2-page-authority]
requires: [validate-preview-source]
produces: [page-authority-raw-projection]
entry: []
exit: [evidence:page-authority-raw-projection-current]
```

**Step 1 — CLI**: Run `ppt_flow image2 review <run-dir>` only after current raw evidence exists. Do not pass provider, browser, prompt, or artifact overrides.

### review-local-preview

```yaml
node: review-local-preview
lifecycle_phase: 5
method_module: compatibility/current-v1-page-authority
production_modes: [image2-page-authority]
requires: [compose-local-preview]
produces: [preview-decision]
decisions: [proceed, revise-content, revise-visual, stop]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Open the exact current Page Authority raw projection. Show the bound slide IDs, raw evidence, and the current review decision.

**Step 2 — GATE**: Record the routing decision. `proceed` means return to the owning controller
to consume current producer-owned `workflow_inspection.primary_action` and publish exact plan-hash gates; quick
quick preview itself never waives/approves them or treats a generated projection as approval. A hard-stop
diagnostic returns to its owner; it is not an invitation to edit state or infer a missing decision.
