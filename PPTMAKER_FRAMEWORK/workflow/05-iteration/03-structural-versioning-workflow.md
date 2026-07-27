---
stage: workflow/05-iteration
---

# Structural Versioning Workflow

Use structural versioning for additions, removals, reordering, or a change of page
authority. Preview the target first and show position, stable ID, title,
before/after effects, and exact `plan_sha256`. Apply only that confirmed hash.

The published target contains source changes and target-owned raw materialization
only where the plan permits it. It never inherits raw acceptance, provider
authorization, final manifests, assembly/notes receipts, or delivery decisions.
`needs_render` reports raw-generation debt; apply itself performs no remote work.
