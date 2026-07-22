# Glossary / Where Map

Search this file before inventing a path. Framework source remains the five directories `workflow/`, `scripts/`, `charter/`, `reference/`, `playbook/`; generated run data remains inside a user-owned `deck_*`.

## Where Map

| Term | Canonical path | Meaning / do not |
|---|---|---|
| run bundle | `deck_NAME/` | user project root; do not create under framework |
| run-bundle locator | `deck_NAME/RUN_BUNDLE.md` | portable static local deck/framework locator; state/status owns current workflow |
| deck guide | `deck_NAME/deck-guide.md` | in-bundle source ownership and operating rules; not a locator or current-status record |
| `--run-dir` | `deck_NAME/3_versions/vN/` | version leaf, not deck root |
| `slide-specifications.md` | `<run-dir>/slide-specifications.md` | structured source; exact visible body lives in `SLIDE BODY` |
| `_state/` | deck root `_state/` | state.yaml, history, gate journal; do not hand-edit |
| `_scratch/` | `<run-dir>/_scratch/` | transaction workspace; migration scratch is `_scratch/html-migration/` |
| `_generated/` | `<run-dir>/_generated/` | rebuildable derived artifacts; never source or manual edit |
| `html_production` | `<run-dir>/_generated/html_production/` | HTML pages/final slides/preview objects, plans, manifests |
| `contact_sheet` | HTML: `html_production/preview/`; legacy: `_generated/preview/` | real visual evidence; inspect before approval |
| `style_master.jpg` | markerless legacy compatibility only | not a new HTML prerequisite |
| `legacy-image2-first-maintenance` | framework `reference/` + `playbook/` | isolated markerless whole-page maintenance |
| Image2 refinement | lazy source/derived/scratch partitions owned by Phase 4 | optional after current HTML delivery and exact authorization; never create for ordinary HTML work |
| `needs_local_materialization` | HTML structural receipt | target-local work, zero remote |
| `needs_render` | markerless structural receipt | remote cost report only, not authorization |
| `slide_id` | source block heading / plan | stable cross-version identity |
| `position` | current plan projection | current order only; never artifact identity |
| `plan_sha256` | `_scratch` preview/apply receipt | exact structural confirmation; stale means re-preview |

## Pipeline terms

`html-first-v1` means local structured HTML production. `legacy-image2-first` means markerless compatibility. They do not share gates, manifests, reset epochs, receipts, or node decisions.

`Header Text & Style Refresh`, `Generated Image Rebuild`, `Notes-Only Refresh`, and `Structural Versioning Path` are controlled refresh vocabulary. HTML uses the first only as a conceptual legacy mapping; actual HTML routes are Local Slide Rebuild, Local Deck Rebuild, Notes-Only Refresh, and Structural Versioning Path.

## Git

Git is a user-owned source/control audit layer. Visible `vN` plus Structural Versioning Path remains the deck version authority. No automatic history reader, source replacement, `git checkout`, `git restore`, or `_generated/` recovery exists.
