---
stage: workflow/00-setup
---

# Conventions

- Canonical HTML source is exact `3_versions/vN/slide-specifications.md` with a production marker and stable mnemonic IDs.
- Backbone owns shared content/visual defaults; version overrides own only that version's delta.
- `_generated/` is rebuildable and never hand-edited. `_scratch/` holds disposable transaction-local work.
- Page position is snapshot order; `slide_id` owns notes, evidence, and reuse identity.
- Header/body/family/fallback changes use local rebuilds. Notes use Notes-Only Refresh. Insert/delete/reorder uses Structural Versioning Path and target-local materialization.
- Human review is version/reset/evidence-bound; metadata mirrors alone authorize nothing.
- Provider calls are outside ordinary HTML work. First-class `image2-only` whole-page behavior is owned by `create-deck`.
