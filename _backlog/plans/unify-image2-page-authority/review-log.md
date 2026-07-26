# Review Log

## Round 1: Initial Architecture Audit

Accepted direction:

- One active Page Authority protocol; Pure and Framed are per-slide ownership choices.
- Framed owns deterministic kicker/title/subtitle/callout pixels; Image2 owns a full-canvas text-free
  underlay.
- Historical output families are not Framed adapters and need explicit adoption.

## Round 2: Contract Audit

Resolved planning findings:

| Finding | Resolution |
|---|---|
| Old protocol parsing could leak adapters into current routing | Normal resolver and read-only observer have separate seams and disjoint result classes. |
| Current protocol corruption could look adoptable | `CURRENT_PROTOCOL_REPAIR_REQUIRED` is distinct from recognized legacy adoption. |
| Unsupported input could enter transition | Only two exact legacy source/state pairs can prepare adoption. |
| Source spans could make harmless reorder alter raw reuse | Spans are diagnostic-only and excluded from raw/final/authorization fingerprints. |
| Structural raw reuse had a post-apply loophole | Hash-bound materialization map is atomically applied into target raw manifest. |
| Framed free prose could request labels/signs/text | `VISUAL BRIEF` is a closed registry-selection language, not prose. |
| Pure text and no-text negative constraints could conflict | Authority-aware validation rejects contradictions. |
| Identity restriction had two source fields | `SUBJECT RESTRICTIONS` is the only identity restriction owner. |
| Doctor was source-aware only in prose | Closed unbound/run-bound/operation input contract is defined. |
| Agent model sheet could be used directly | Sheet is doctrine only; only clean registered role derivatives become payloads. |

## Round 3: Main-Spec Audit

Open planning gate:

- Rebuild and independently audit the exact Requirement ledger, including HTML source/rendering,
  bootstrap/resume/status/playbook documentation, and all legacy behavior that must be kept, replaced,
  retired, or collapsed.

## Proposal Gate

No OpenSpec change is created while the main-spec ledger remains in audit. A final re-review must find
no unresolved architecture, semantic, or exact-requirement blocker.
