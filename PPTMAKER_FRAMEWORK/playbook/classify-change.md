---
node: classify-change
shared: true
lifecycle_phase: 4
method_module: 05-iteration
requires: []
entry: []
exit:
  - evidence:change-classified
  - evidence:playbook-selected
  - evidence:scope-resolved
produces: [change-classification, execution-scope]
---

# Shared Node: Classify Change

**Step 1 — MD**: Read `scripts/change-classifier.md`; classify the request and select the smallest valid controller/chain.

**Step 2 — MD**: Persist `classification: {mode: all|slides, slide_ids: [...], change_kind, selected_playbook}` on this node. `mode: slides` requires at least one canonical slide ID; a mixed render-mode title request without resolved IDs remains blocked.

**Step 3 — CLI**: Record agent evidence `change-classified`, `playbook-selected`, and `scope-resolved`, then persist with `writeState`.
