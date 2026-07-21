---
playbook: quick-preview
description: HTML-first production-equivalent local preview without gate waiver
supported_pipelines: [html-first-v1]
includes: []
---

# Playbook: Quick Preview

## Nodes

### validate-preview-source

```yaml
node: validate-preview-source
lifecycle_phase: 3
method_module: 03-html-production
requires: []
produces: [preview-readiness]
entry: [slide_specs_exists]
exit: [slide_specs_valid, evidence:preview-readiness-validated]
```

**Step 1 — CLI**: Run write-free `ppt_flow validate <run-dir>`. HTML preview needs base local runtime/source readiness, not gates, style master, or provider credentials.

### compose-local-preview

```yaml
node: compose-local-preview
lifecycle_phase: 3
method_module: 03-html-production
requires: [validate-preview-source]
produces: [content-review-plan, visual-review-plan, visual-contact-sheet]
entry: []
exit: [evidence:pilot-generated]
```

**Step 1 — CLI**: Run `ppt_flow pilot <run-dir>` with the requested HTML slide scope. Do not pass `--force-images`, resolution, provider, or browser overrides.

### review-local-preview

```yaml
node: review-local-preview
lifecycle_phase: 3
method_module: 03-html-production
requires: [compose-local-preview]
produces: [preview-decision]
decisions: [proceed, revise-content, revise-visual, stop]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Open the exact content projection and real visual contact sheet. Show outstanding recipe keys/pages and effective/forced fallback evidence.

**Step 2 — GATE**: Record the routing decision. `proceed` means return to the owning controller
to consume current producer-owned `html_resume_guidance` and publish exact plan-hash gates; quick
preview itself never waives/approves them or treats successful rendering as approval. A hard-stop
diagnostic returns to its owner; it is not an invitation to edit state or infer a missing decision.
