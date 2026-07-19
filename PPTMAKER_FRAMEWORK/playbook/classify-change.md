---
node: classify-change
shared: true
lifecycle_phase: 5
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

**Step 1 — MD**: Read `scripts/change-classifier.md`. Probe canonical `production.pipeline` first, then identify source owner, structural impact, stale evidence, and smallest valid path. Never use render mode to classify an HTML-first run.

**Step 2 — MD**: Persist `classification: {pipeline, mode: all|slides, slide_ids, change_kind, selected_playbook, structural_versioning, resolved_refresh_paths, remote_authorization_required}`. HTML paths use Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, or Structural Versioning Path. Markerless legacy may use Header Text & Style Refresh or Generated Image Rebuild.

**Step 3 — CLI**: Resolve every human position/spoken selector to current stable IDs before mutation. Record `change-classified`, `playbook-selected`, and `scope-resolved`; provider work remains false unless a legacy Generated Image Rebuild has separate explicit authorization.
