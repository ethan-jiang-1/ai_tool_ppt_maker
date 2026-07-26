# Contract Closure Matrix

Status is intentionally conservative. A row is `closed` only when the vNext delta uses the
exact base requirement name where it changes a closed current rule, preserves valid legacy
behavior, and has a task/test obligation.

| Area | Current closed contract | VNext disposition | Status |
|---|---|---|---|
| Production policy | Three modes and legacy whole-page adapter | Add exact fourth protocol mode and distinct Page Authority adapter | In review |
| Source grammar | Two pipeline markers and legacy render modes | Add per-slide Pure/Framed authority without changing slide identity | In review |
| CLI surface | Fixed command inventory, routing, transition grammar | Add receipt-bound authorization and Page Authority review operations | In review |
| Frame pixels | Canvas header lock owns legacy body-lock headers | Confine header lock to legacy; Frame Compositor owns Framed final pixels | In review |
| Raw/final lineage | Whole-page raw/final manifest lineage | Separate composition receipt, raw evidence, and unified final manifest | In review |
| Reviews | Legacy header/final review records | Require raw acceptance coverage before final composition and a final delivery review | Open finding |
| Identity assets | HTML asset catalog and legacy scratch image | Backbone-only Image2 registry/profile with bounded projection | Open finding |
| Refinement | HTML-first visual-slot lifecycle | Reject vNext before refinement state or provider work | In review |
| Adoption | Sole outer transition plan and source-version scratch | Nest explicit Page Authority adoption matrix under outer hash | In review |

The exact closed-requirement replacements and their tests belong in the OpenSpec delta. This
matrix is a checklist for the review process, not a schema.
