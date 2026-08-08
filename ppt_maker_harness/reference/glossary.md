# Glossary / Where Map

Search this file before inventing a path. PPT Maker Harness source lives in `workflow/`,
`scripts/`, `charter/`, `reference/`, and `playbook/`; user-owned deck data lives
inside `deck_*`.

## Where Map

| Term | Canonical path | Meaning |
| --- | --- | --- |
| run bundle | `deck_NAME/` | User project root; never create it under the Harness. |
| run-bundle locator | `deck_NAME/RUN_BUNDLE.md` | Static local Deck-to-Harness binding card. |
| deck guide | `deck_NAME/deck-guide.md` | In-bundle ownership and operating rules after locating the deck. |
| `--run-dir` | `deck_NAME/3_versions/vN/` | One version leaf, not the deck root. |
| `slide-specifications.md` | `<run-dir>/slide-specifications.md` | Page Image source with stable slide IDs. |
| `_state/` | deck root `_state/` | State, history, and transaction journals; never hand-edit. |
| `_scratch/` | `<run-dir>/_scratch/` | Version-local transaction workspace. |
| `_generated/` | `<run-dir>/_generated/` | Rebuildable derived artifacts; never a source of truth. |
| Style Master history | `deck_NAME/1_upstream_raw_material/style-master-iterations/` | Append-mostly candidate plans, immutable bytes/provenance, and grants; directory order never selects a style. |
| Style Master staging | `.../style-master-iterations/_staging/plan-<unique>/` | Incomplete owner-only publication workspace; never authority and cleanup stays below `_staging/`. |
| Style Master scope head | `.../style-master-iterations/scopes/vN/{framed,pure}/head.json` | The sole mutable current candidate-plan pointer for one version/workflow scope. |
| accepted Style Master selection | `_state/state.yaml` `page_image_style_master.by_version["3_versions/vN"]` | Optional acceptance record and raw-profile authority; first vNext has no inherited target record. |
| `style_master.jpg` | `<run-dir>/overrides/visual-style/` if present, otherwise `2_backbone/visual-style/` | Format-correct JPEG compatibility projection after acceptance; not selection or raw-provider authority. |
| Page Image raw lineage | `<run-dir>/_generated/page_image_workflow/raw/` | Receipt-bound raw image evidence. |
| Page Image final lineage | `<run-dir>/_generated/page_image_workflow/final/` | Final slides, projection, and manifest. |
| `slide_id` | source block heading | Stable cross-version identity. |
| `position` | current plan projection | Snapshot order only. |
| `plan_sha256` | structural preview/apply receipt | Exact confirmation binding; stale means re-preview. |
| `needs_render` | structural impact report | Raw-generation debt and cost information, never permission. |

## Current Workflow Terms

New authoring uses `page-image-workflow-v1` and records exactly one
`production.workflow: framed|pure` for the whole version. Framed assigns the
Provider-rendered body to the Page Image Core and uses a fixed transparent local
header overlay only for kicker, title, and subtitle. Pure assigns every final
pixel to the Provider. The selected route is
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`.

Use the ownership/invalidation paths `Header Text & Style Refresh`, `Generated
Image Rebuild`, `Notes-Only Refresh`, and `Structural Versioning Path`. A
Framed header-overlay change can use the first path only with exact compiled
provider input, protected geometry, raw contract, and local profile; all other
pixel-relevant changes rebuild raw work. A v2 pair is byte-preserving and receives the generic unsupported-protocol
export action; it is never a current route.

Style Master candidate work is scoped to one `vN + framed|pure` tuple. A
selection is authoritative only after the state acceptance record and its
immutable candidate chain revalidate. A compatibility payload can be absent or
drift without changing that selection; it is rebuilt from the selected bytes.
Selection/intent/context/profile/byte drift and retired raw lineage without the
selection binding are `Generated Image Rebuild` debt, never a source-epoch
rewrite or an inferred cross-version selection.

## Git

Git is a user-owned source/control audit layer. Visible `vN` plus Structural
Versioning Path remains the deck version authority. There is no automatic history
reader, source replacement, or `_generated/` recovery.
