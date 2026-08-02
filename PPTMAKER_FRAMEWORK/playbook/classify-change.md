---
node: classify-change
lifecycle_phase: "5"
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: []
entry: [slide_specs_exists]
exit: [evidence:change-classified]
produces: [change-classification]
shared: true
---

# Classify Change

This shared node is entered only for an explicit requested change on a known
exact run. It follows discovery's `work-change` handoff; a passive resume keeps
the separate inspection action, and a missing run returns to the supported
`RUN_BUNDLE.md` / exact-path locator without scanning `deck_*`.

**Step 1 — MD**: Read the exact source/state pair, then identify the affected
stable IDs. For v2, read the bound version workflow; do not infer one from a
slide, generated file, or position.

**Step 2 — MD**: For v2, route Framed exact-evidence Text Frame-only work to
Header Text & Style Refresh; Framed preset/underlay and all Pure visible changes
to Generated Image Rebuild; notes-only work to Delivery; and structural or
whole-workflow changes to Structural Versioning Path. A non-v2 source/state
pair remains the owner-issued unsupported-protocol/export hard-stop.

**Step 3 — CLI**: Record the selected IDs and owner-valid path. Raw work stays
unauthorized until the user approves its exact generation scope.
