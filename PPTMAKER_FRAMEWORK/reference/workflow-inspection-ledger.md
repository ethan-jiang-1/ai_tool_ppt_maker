# Workflow Inspection Ledger

This document explains the direct owners that `workflow_inspection` reads. The
machine-checkable Change-2 source of truth is
`tests/contracts/workflow-control-ledger-v2.json`; this document is review
evidence, not a runtime registry or a mutation authority.

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

Change 2 retains the execution cursor (`playbook`, `current_node`, execution
and version binding, and `waiting_for`) as direct state-owned durable context.
It retains `workflow_summary` and `suggested_next` only as display adapters of
the current inspection action. `eligible_candidates` is a diagnostic list and
cannot select an action. `html_resume_guidance` is retired; controllers consume
`workflow_inspection.primary_action` and its bounded continuation instead.

## Protected Boundaries

Inspection never writes state, journals, receipts, metadata, source, or
generated output; it never submits a provider request. State and transaction
writers revalidate their direct facts and CAS preconditions at mutation time.
