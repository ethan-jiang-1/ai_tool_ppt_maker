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

**Step 1 — MD**: Read the exact source/state pair, then identify the affected
stable IDs. For v2, read the bound version workflow; do not infer one from a
slide, generated file, or position.

**Step 2 — MD**: For v2, route Framed exact-evidence Text Frame-only work to
Header Text & Style Refresh; Framed preset/underlay and all Pure visible changes
to Generated Image Rebuild; notes-only work to Delivery; and structural or
whole-workflow changes to Structural Versioning Path. An exact v1 pair stays on
its bounded compatibility route.

**Step 3 — CLI**: Record the selected IDs and owner-valid path. Raw work stays
unauthorized until the user approves its exact generation scope.
