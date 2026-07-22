# Workflow Inspection Ledger

This ledger records the direct owners that `workflow_inspection` reads during
Change 1. It is review evidence for control simplification, not a runtime
registry or a mutation authority.

| Fact / durable field | Direct owner | Writer | Readers | Freshness / invalidation | Reconstructible | Change 2 removal path |
| --- | --- | --- | --- | --- | --- | --- |
| run bundle layout and canonical source path | `bundle_layout.mjs` | `initBundle`, structural publication | status, inspection, CLI preflight | source/layout tree changes | yes | retain as layout authority |
| production mode by version | `state.mjs` `production_mode.by_version` | state transition/registration owner | adapter routing, inspection | exact run version/source marker changes | no | retain direct state record |
| source pipeline marker | `slide-specifications.md` + production marker parser | authoring/structural source owner | mode inspection, adapters | source bytes change | yes from source | retain direct source authority |
| execution/playbook/node records | `state.mjs` `nodes`, playbook fields | controller/state writer | resume card, inspection | state CAS write/execution change | partly | reader/writer ledger decides per record |
| HTML review and delivery records | HTML review evidence owner | gate/delivery publication owner | build, status, inspection | source/config/artifact/reset identity changes | no | retain review owner |
| Image2 refinement record | refinement state owner `nodes.image2-refinement` | refinement operations | refinement adapter, inspection | plan/auth/attempt/review changes | no | frozen through Change 1/2; Change 3 owns wire migration |
| provider authorization | mode/refinement authorization owner | explicit authorization operation | submit owner, inspection when applicable | operation/scope/profile/execution changes | no | retain authorization owner |
| receipt and provenance | stage/adapter owner | canonical stage publication | assembly/review/inspection summary | source/artifact byte change | no | retain source owner |
| gate/reset/promotion journals | respective transaction owner | journal owner under CAS | recovery, inspection | owner/byte/age changes | no | retain recovery authority |
| metadata mirrors | owner-specific mirror publisher | gate/mode owner | compatibility/status only | authoritative record changes | yes | do not promote to authority |
| `workflow_inspection` | shared read-only workflow module | none | status, state, MD guidance | direct checkpoint identity changes | yes | replace compatibility readers only after ledger proof |

## Compatibility Adapters

Only these Change-1 adapters remain: `html_resume_guidance`,
`workflow_summary`, `suggested_next`, and `eligible_candidates`. They are
derived from inspection/direct owner evidence. Their supported readers are
status/state human and JSON output plus current playbook guidance; Change 2
may retire a reader only after this ledger has a direct replacement and no
supported caller relies on the adapter.

## Protected Boundaries

Inspection never writes state, journals, receipts, metadata, source, or
generated output; it never submits a provider request. State and transaction
writers revalidate their direct facts and CAS preconditions at mutation time.
