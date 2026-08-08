# Master Plan: Page Image Workflow Transition

> Closed: 2026-08-08 | Status: implementation milestones complete

This is the strategic map for the Page Image Workflow transition. It explains
why the work exists, which artifact currently controls it, and what may follow.
It does not authorize runtime behavior, code changes, production deck mutation,
or a protocol migration. Those remain controlled by the active OpenSpec change
and the current capability specs.

## Authority And Lineage

The work has one direct lineage:

1. [Framed Hybrid Image2 composition plan](framed-hybrid-image2-composition.md)
   recorded the domain correction: Pure and Framed share a full-page Image2
   model; Framed adds only a deterministic transparent three-field header
   overlay.
2. The plan explicitly called for a dedicated OpenSpec change after Owner
   review. Its older handoff says that no change existed because it is a
   pre-creation snapshot, not current status.
3. [correct-framed-page-image-model](../../../openspec/changes/archive/2026-08-08-correct-framed-page-image-model/)
   implemented the replacement and is archived with all 49 tasks complete.
4. The change passed validation, synced delta specs, and was archived. Main
   specs are now the current behavior authority.

When sources disagree, use this order:

1. Main OpenSpec capability specs for current shipped behavior.
2. This closed master plan for roadmap and decision context.
4. The original Framed Hybrid plan for its historical rationale and evidence.

## Outcome

The target is one `page-image-workflow-v1` protocol with one version-level
policy, `framed` or `pure`. Both use a common Page Image Core and the same
source, provider-input, review, final-manifest, assembly, notes, and delivery
lineage. The retired Page Authority v2 protocol remains byte-preserved but is
an `unsupported-protocol/export` hard-stop; it is never converted, adopted, or
used as evidence for current work.

## Milestone 1: Correct The Model

**Archived change:** `2026-08-08-correct-framed-page-image-model`

This milestone is the implementation of the parent plan, not a preliminary
spike. Its task groups form the execution sequence:

| Workstream | Change task group | Completion meaning |
| --- | --- | --- |
| Protocol boundary | 1 | Replacement identity is current and v2 stops before work. |
| Canonical content | 2 | Source owns closed provider-rendered content and one workflow choice. |
| Core and adapters | 3 | Framed and Pure share semantic facts but compile only their own provider input. |
| Provider lifecycle | 4 | Bound request bytes, cost authorization, evidence, and Style Master history are current. |
| Review and delivery | 5 | One Complete Page Review produces final media, PPTX, notes, and delivery lineage. |
| Refresh and state | 6 | Invalidation uses exact bound facts; targets start fresh. |
| Public handoffs | 7 | CLI, Controller, and inspection expose only legal current paths. |
| Active guidance | 8 | Charter, workflow, references, and playbooks describe the corrected model. |
| Regression protection | 9 | Fixtures, unit/integration tests, E2E, and architecture guards prevent regression. |
| Closeout proof | 10 | Strict validation and the required test suites pass before archive. |

All ten task groups completed; their detailed evidence remains with the archived
change rather than being duplicated in this document.

## Milestone 2: Close And Ship The Change

Completed on 2026-08-08: focused, integration, mock E2E, coherence, strict
OpenSpec, and format checks passed; the delta specs were synced and the change
was archived. Project versioning remains a separate user-confirmed decision.

No existing v2 production deck is automatically migrated during this milestone.
Its retained bytes remain exportable only through the owner-issued hard-stop.

## Future Work Candidates

There is no approved successor change yet. The following are deliberately
gated candidates, not commitments:

| Candidate | Trigger | Required separate decision/change |
| --- | --- | --- |
| Legacy deck re-authoring support | A user needs a v2 deck to continue production work. | Define an owner-mediated export and fresh source authoring flow; no converter or evidence reuse. |
| First production rollout | A user explicitly names a new or freshly re-authored run bundle. | Use the current protocol with normal human visual and cost gates; do not use a production deck as a Harness fixture. |
| Page-quality/schema evolution | Repeated review evidence shows a closed content role or constraint is insufficient. | Propose the smallest schema or adapter change with examples and regression coverage. |
| Operations hardening | Real usage exposes a bounded reliability, diagnostic, or recovery gap. | Diagnose first, then propose a scoped change without reopening v2 compatibility. |

## Decision Gates

Before opening a successor change, answer these questions explicitly:

1. Is the need current-protocol behavior, legacy export/re-authoring, or a
   production-deck request?
2. Which owner and capability spec control the desired behavior?
3. Can the request be solved without converting v2 bytes or reusing v2
   evidence?
4. What observable acceptance evidence will prove the new behavior?

If the answer is unclear, update this roadmap or explore the domain first;
do not add a compatibility path inside the active replacement protocol.
