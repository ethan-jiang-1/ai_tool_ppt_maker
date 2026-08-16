---
node: classify-change
method_module: 06-iteration
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

Before selecting this node's workflow or reading dependent source content, keep
the current owner result. A present production record whose source, state, or
evidence cannot establish current identity presents the owner-issued
`production-protocol` `current-protocol-invalid` hard-stop with
`repair-current-protocol-identity` of kind `repair`; do not classify, resume,
rewrite, adopt, migrate, export, convert, or route it. An exact Harness binding
failure, declared fresh authoring draft, declared-current state defect, exact
execution-version mismatch, or attributable current delivery drift retains its
existing owner action unchanged.

**Step 1 — MD**: Read the exact source/state pair, then identify the affected
stable IDs. Read the bound Page Image Workflow; do not infer one from a
slide, generated file, or position.

**Step 2 — MD**: Route Framed Header Text & Style Refresh only after the owner
proves compiled provider input, protected composition, raw contract, and local
header profile are unchanged. Route header-literal, Provider Content Schema,
visual, geometry, and profile changes to Generated Image Rebuild; notes-only
work to Delivery; and structural or whole-workflow changes to Structural
Versioning Path. A selected `PAGE CLASS`, page-presentation default, or profile
change is a visual change and therefore rebuilds raw; a valid unselected sibling
does not change that page's binding. A malformed presentation package stops at
its named source/configuration repair and reruns this checkpoint, without a
new route or gate.

**Step 3 — CLI**: Record the selected IDs and owner-valid path. Raw work stays
unauthorized until the user approves its exact generation scope.
