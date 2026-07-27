---
playbook: production-mode-transition
description: State-owned cross-pipeline transition and explicit legacy adoption
supported_pipelines: [html-first-v1, whole-page-image2-v1, page-authority-image2-v1]
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

**Step 1 — CLI**: Use only `state --apply-production-mode-transition --plan-hash <hash>`, `state --recover-production-mode-transition`, or the closed recovery confirmation. The source version remains unchanged while the target is published and registered. This generic form never accepts `image2-page-authority` as its target.

**Step 2 — MD**: Show the target mode, exact confirmed plan hash, and resulting target continuation. The confirmation records the target user's `proceed` intake decision; it is an exact transaction commit, not a risk-waiver `confirm`, and accepts neither `--reason` nor `--force`. Do not edit state, generated artifacts, journals, reservations, or target files by hand.

**Legacy adoption**: For a specifically targeted historical run, use only `state --inspect-legacy-protocol`, `state --prepare-legacy-adoption`, `state --preview-legacy-adoption`, `state --confirm-legacy-adoption --plan-hash <hash>`, `state --apply-legacy-adoption --plan-hash <hash>`, and the matching closed recovery forms. Only the observer's exact `recognized-legacy` result may prepare this fixed `image2-page-authority` target. The Agent prepares the confined candidate shell. The human authors Page Authority source, target intake, and one exact adoption-matrix row for every legacy and target stable ID; preview all per-slide dispositions and the exact hash before confirmation. Adoption is provider-free and copies no legacy prompt, pixel, review, provider, raw/final, PPTX, notes, or delivery material. A published target starts at `authorize-page-authority-raw` with `source_epoch: 1` and `needs_raw_generation` for every target slide; Image2 quality review is a later, separate human decision.
