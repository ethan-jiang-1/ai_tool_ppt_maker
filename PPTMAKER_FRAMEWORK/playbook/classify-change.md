---
node: classify-change
lifecycle_phase: "5"
method_module: 05-iteration
requires: []
entry: [slide_specs_exists]
exit: [evidence:change-classified]
produces: [change-classification]
shared: true
---

# Classify Change

**Step 1 — MD**: Read the exact Page Authority source/state pair and identify
the affected stable IDs. Do not classify from generated files or position.

**Step 2 — MD**: Select one smallest path: Header Text & Style Refresh,
Generated Image Rebuild, Notes-Only Refresh, or Structural Versioning Path.

**Step 3 — CLI**: Record the selected IDs and owner-valid path. Raw work stays
unauthorized until the user approves its exact generation scope.
