# Glossary / Where Map

Search this file before inventing a path. Framework source lives in `workflow/`,
`scripts/`, `charter/`, `reference/`, and `playbook/`; user-owned deck data lives
inside `deck_*`.

## Where Map

| Term | Canonical path | Meaning |
| --- | --- | --- |
| run bundle | `deck_NAME/` | User project root; never create it under the framework. |
| run-bundle locator | `deck_NAME/RUN_BUNDLE.md` | Static local deck/framework locator. |
| deck guide | `deck_NAME/deck-guide.md` | In-bundle ownership and operating rules after locating the deck. |
| `--run-dir` | `deck_NAME/3_versions/vN/` | One version leaf, not the deck root. |
| `slide-specifications.md` | `<run-dir>/slide-specifications.md` | Page Authority source with stable slide IDs. |
| `_state/` | deck root `_state/` | State, history, and transaction journals; never hand-edit. |
| `_scratch/` | `<run-dir>/_scratch/` | Version-local transaction workspace. |
| `_generated/` | `<run-dir>/_generated/` | Rebuildable derived artifacts; never a source of truth. |
| Page Authority raw lineage | `<run-dir>/_generated/page_authority_image2/raw/` | Receipt-bound raw image evidence. |
| Page Authority final lineage | `<run-dir>/_generated/page_authority_image2/final/` | Final slides, projection, and manifest. |
| `slide_id` | source block heading | Stable cross-version identity. |
| `position` | current plan projection | Snapshot order only. |
| `plan_sha256` | structural preview/apply receipt | Exact confirmation binding; stale means re-preview. |
| `needs_render` | structural impact report | Raw-generation debt and cost information, never permission. |

## Current Workflow Terms

New authoring uses `page-authority-image2-v2` and records exactly one
`production.workflow: framed|pure` for the whole version. Framed assigns the
text-free underlay to Image2 and the fixed local Text Frame to final text
pixels. Pure assigns every final pixel to Image2. The selected route is
`03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`.

Use the ownership/invalidation paths `Header Text & Style Refresh`, `Generated
Image Rebuild`, `Notes-Only Refresh`, and `Structural Versioning Path`. A
Framed Text Frame-only change can use the first path only with current exact
raw evidence and preset; Pure display changes always rebuild raw work. A
non-v2 pair is byte-preserving and receives the generic unsupported-protocol
export action; it is never a current route.

## Git

Git is a user-owned source/control audit layer. Visible `vN` plus Structural
Versioning Path remains the deck version authority. There is no automatic history
reader, source replacement, or `_generated/` recovery.
