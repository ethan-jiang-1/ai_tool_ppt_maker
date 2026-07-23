# Structural Versioning Workflow

Preview insert/delete/move/multi-operation against the current source and exact plan hash. Confirmed apply publishes one clean source-only vNext through hidden staging and no-replace rename. It never renders, calls a provider, or copies generated/reset/review authority.

For HTML-first, the receipt reports `needs_local_materialization`. Explicit target-local materialization recomputes fingerprints, copies only verified matching bytes into target-owned objects, locally rebuilds Stage 1-3 review evidence, and stops at `review_required`. Target approvals are mandatory before its Stage 4/5 delivery.

Explicit whole-page legacy retains `needs_render` and separately authorized remote rebuild semantics.
