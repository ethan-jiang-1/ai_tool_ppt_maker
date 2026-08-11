---
node: classify-change
lifecycle_phase: "5"
method_module: 06-iteration
production_modes: [image2-page-workflow]
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
stable IDs. Read the bound Page Image Workflow; do not infer one from a
slide, generated file, or position.

**Step 2 — MD**: Route Framed Header Text & Style Refresh only after the owner
proves compiled provider input, protected geometry, raw contract, and local
header profile are unchanged. Route header-literal, Provider Content Schema,
visual, geometry, and profile changes to Generated Image Rebuild; notes-only
work to Delivery; and structural or whole-workflow changes to Structural
Versioning Path. A selected `PAGE CLASS`, page-presentation default, or profile
change is a visual change and therefore rebuilds raw; a valid unselected sibling
does not change that page's binding. A malformed presentation package stops at
its named source/configuration repair and reruns this checkpoint, without a
new route or gate. An undeclared source/state pair remains the owner-issued
`repair-current-protocol-identity` hard-stop.

**Step 3 — CLI**: Record the selected IDs and owner-valid path. Raw work stays
unauthorized until the user approves its exact generation scope.
