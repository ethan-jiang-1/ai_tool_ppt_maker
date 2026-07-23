---
playbook: migrate-import
description: State-owned cross-pipeline production-mode transition
supported_pipelines: [html-first-v1, whole-page-image2-v1]
includes: []
---

# Playbook: Production-Mode Transition

### apply-production-mode-transition

```yaml
node: apply-production-mode-transition
lifecycle_phase: 5
method_module: 05-iteration
requires: []
produces: [versioned-production-mode-target]
entry: [transition_apply_current]
exit: [transition_publish_or_recovery_recorded]
```

**Step 1 — CLI**: Use only `state --apply-production-mode-transition --plan-hash <hash>`, `state --recover-production-mode-transition`, or the closed recovery confirmation. The source version remains unchanged while the target is published and registered.

**Step 2 — MD**: Show the target mode, exact confirmed plan hash, and resulting target continuation. Do not edit state, generated artifacts, journals, reservations, or target files by hand.
