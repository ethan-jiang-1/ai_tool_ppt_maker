# Progressive Plan: Schema-First Page Image Recovery

> Type: progressive coordination plan | Updated: 2026-08-11 | Status: active
>
> Supersedes the route in `page-image-progressive-plan.md`. That plan's Phases
> 0, 0.5, Track A, and Track P are landed and carried forward here unchanged;
> its Phases 1–6 are re-derived below because the schema decision changed.

## What Changed And Why This Plan Exists

The previous route treated the schema as one input to a presentation-system
implementation. The owner's decision reverses that: **the schema is the
deliverable, and the code changes because the data flow changed.** The
existing pipeline structure is sound and stays; what was wrong is that the
schema was scattered, invisible, and named inconsistently.

Three founding rules now constrain every phase:

1. **No schema versioning.** The root `VERSION` is the only version number and
   it is the charter. Schema identifiers carry no `-vN` suffix. Recorded in
   [ADR 0006](../../docs/adr/0006-define-production-schemas-in-yaml.md).
2. **Names are 2–3 words and obvious at a glance.** No abbreviation, nothing
   the reader has to guess.
3. **All refinement after the first generation is conversational.** The human
   never hand-writes a source file again. The design criterion for derived data
   is therefore Agent traceability, not human writability.

The withdrawn OpenSpec change `introduce-page-image-presentation-system` is
deleted (recoverable at `c05a502`). It proposed renaming the protocol to
`page-authority-image2-v2` — a third simultaneous protocol name — which the
no-versioning rule forbids.

## The Constraint That Shapes Everything: Records Cannot Be Renamed

Evidence gathered 2026-08-11 from the production bundles:

| Where | Distinct schema IDs | Renamable? |
| --- | --- | --- |
| Harness code (`scripts/`) | 81 | yes, code is source |
| `deck_dark_factory_current/` outside `_generated/` | **15** | **no — these are Record Data** |
| `deck_dark_factory_current/_generated/` | 10 | yes, rebuildable |
| All four decks combined | 54 | 15 are records |

The 15 protected identifiers are paid grants, provider attempts, materialization
provenance, complete-review decisions, and Style Master candidate lineage:

```text
page-image-progressive-accepted-raw-evidence-v1
page-image-progressive-raw-batch-grant-v1
page-image-progressive-raw-batch-projection-v1
page-image-progressive-raw-complete-review-v1
page-image-progressive-raw-item-attempt-v1
page-image-progressive-raw-materialization-provenance-v1
page-image-progressive-raw-scope-head-v1
page-image-progressive-raw-work-plan-v1
page-image-style-master-candidate-attempt-v1
page-image-style-master-candidate-grant-v1
page-image-style-master-generated-provenance-v1
page-image-style-master-head-v1
page-image-style-master-local-provenance-v1
page-image-style-master-plan-identity-v1
page-image-style-master-review-decision-v1
```

Renaming a Record Data schema destroys the ability to read evidence of money
already spent. **Records are read under their historical identifier forever;
only newly written records use the new vocabulary.** This constraint was absent
from every earlier plan and is the single largest reason the work must split
into more than one change.

## Target: 19 Schemas

Counted after the Q13 addition (`page-artifact-index`) and the Q14 split
(`layout-config` + `page-layout`). Earlier rounds said 17; 19 is correct.

### Deck level — Source

| Schema | Answers |
| --- | --- |
| `story-outline` | What is the argument, in what order, on what evidence |
| `visual-language` | What the deck looks like: type, colour roles, imagery register |
| `design-constraints` | Audience, tone, forbidden claims, required terminology |

### Version level — Source

| Schema | Answers |
| --- | --- |
| `layout-config` | Page Class catalog and the profiles each class resolves to |
| `page-source` | One page's exact content, visual selection, and class |

### Per page — Derived

| Schema | Answers |
| --- | --- |
| `page-source-receipt` | What the parser understood from this page's source |
| `page-layout` | The geometry and treatment this page resolved to, with provenance |
| `page-render-model` | What this page will look like — the complete human-reviewable page |
| `page-generation-spec` | What the provider is being asked to generate |
| `image2-request` | The exact bytes going to image2 |
| `framed-header-html` | The local overlay, when the workflow is framed (`format: html`) |
| `page-artifact-index` | Where this page's artifacts are and what state they are in |

`page-render-model` and `page-generation-spec` are the pair most easily
confused. The first is what a human reviews; the second is a machine
instruction. Their definitions must each carry an explicit "does not contain"
clause naming the other.

### Production

| Schema | Kind | Answers |
| --- | --- | --- |
| `image-generation-plan` | derived | What will be generated, at what scope |
| `image-generation-record` | **record** | What was actually generated, at what cost |
| `page-review-decision` | **record** | The human `proceed \| repair` outcome |
| `final-page-list` | derived | Which image is final for each page |
| `delivery-package` | derived | The PPTX, notes, and delivery receipts |

### Infrastructure

| Schema | Kind | Answers |
| --- | --- | --- |
| `visual-style-candidates` | **record** | Style Master candidate lineage and decisions |
| `production-progress-state` | **record** | Where this version is in the pipeline |

Renamed from the earlier round for the 2–3-word rule: `style-master` →
`visual-style-candidates`, `workflow-state` → `production-progress-state`,
`page-links` → `page-artifact-index`, `source-receipt` → `page-source-receipt`.

## Definition Home

```text
ppt_maker_harness/schema/
  README.md          authority boundary: YAML authoritative, code is mirror
  META.yaml          how to write one definition + naming rules
  flow.yaml          the dataflow: each transformation, owner, invalidation
  stages/            19 field-level definitions, one file each
  legacy-records.yaml  the 15 frozen record identifiers, read-only forever
```

Code constants become mirrors annotated `// anchor: schema/stages/<name>.yaml`.
A regression test enumerates schema constants across `.mjs` and fails on any
name with no definition. `legacy-records.yaml` is the explicit exception list:
reading those identifiers is permitted, writing new data under them is not.

## Ordered Route

```text
Landed (carried forward from the previous plan)
  0    Confirmed baseline
  0.5  Framed current-contract test baseline restored
  A    Task Mandate aligned with exact-grant runtime
  P    Provider capability surface recorded
       |
       v
CONTEXT.md rewritten + ADR 0006          <- landed 2026-08-11
       |
       v
 C1  Publish the schema definitions                    (no runtime change)
       |
     Checkpoint 1: the data flow is visible and agreed
       |
       v
 C2  Make code conform to the definitions              (rename + mirror + test)
       |
     Checkpoint 2: one vocabulary, records still readable
       |
       v
 C3  Close the upstream gap: story, constraints, pagination
       |
     Checkpoint 3: the flow starts at the story, not at the page
       |
       v
 C4  Land Page Class and the layout config             (the presentation system)
       |
     Checkpoint 4: a page resolves one workflow projection
       |
       v
 C5  Publish per-page derived data on disk
       |
     Checkpoint 5: every intermediate step is inspectable
       |
       v
 C6  Framed protected-composition hardening
       |
     Checkpoint 6: the provider promise is honest
       |
       v
 C7  Repair and resume current v3
```

## Why Seven Changes, Not One

Each boundary below is a place where the work would otherwise become
unreviewable or unsafe to land partially.

| Change | Scope | Why it cannot merge with its neighbour |
| --- | --- | --- |
| **C1** Publish schema definitions | `ppt_maker_harness/schema/` only; zero runtime behaviour | This is the artifact the owner reviews. Mixing it with code changes makes the review impossible. Landing it alone is risk-free. |
| **C2** Conform code to definitions | Rename constants, add anchors, add the drift test, freeze the 15 records | Touches nearly every `.mjs` but changes no behaviour. A pure-rename change is reviewable by diff; bundling semantics into it is not. |
| **C3** Upstream gap | `story-outline`, `design-constraints`, pagination | New capability territory. Independent of Page Class. |
| **C4** Page Class + layout config | Parser, Core, resolver, both adapters, invalidation | The `XL` change. Needs C1/C2 vocabulary settled first or it re-scatters the schema. |
| **C5** Per-page derived data on disk | `image2 plan` writer, path layout | Depends on C4's resolver existing. Provider-free, so it can land and be inspected before any spend. |
| **C6** Framed hardening | `subject_restrictions` propagation, normalized geometry, body-safe region | Carries external provider risk. Must not block C1–C5. |
| **C7** v3 repair | Production data path only | Not Harness maintenance. Runs under the Task Mandate, not OpenSpec. |

C1 and C2 are the new work. C3–C7 absorb the earlier plans' Phases 1–6 with
their evidence intact.

## Carried-Forward Findings

These survive from the earlier plans and must not be re-litigated:

- **`subject_restrictions` is dropped by Page Image Core** before adapter
  compilation (`page_image_core.mjs:183`). This is the forbidden-subject defect.
  Owned by C6.
- **Framed sends bare `protected_geometry`** with no canvas or unit semantics
  (`03-framed-image/index.mjs:821`). This is the collision defect. Owned by C6.
- **The transport has no mask or region field** — only `model`, `prompt`, `n`,
  `size`, `image`, `images`, `image_urls`. A native primitive would need a
  separate transport change. Owned by C6.
- **`pure-deck-visual-system.yaml` is deliberately Pure-only** and its digest is
  forbidden for Framed. It cannot be extended into a shared profile registry.
  Owned by C4.
- **`image2 plan` is the correct publication timing** — after the plan exists,
  before authorization. Owned by C5.
- **The inspection sidecar stores request JSON under `prompt`** and Human
  Navigation forbids raw prompt prose in its tree. The new per-page data must be
  an independent directory, not a navigation copy. Owned by C5.
- **`FRAMED_HEADER_OVERLAY_PRESET = "standard-v1"` is hardcoded and singular**
  (`header_overlay.mjs:6,64`); a caller supplying its own is rejected. The
  earlier plans' "Header Profile Set" does not exist. `CONTEXT.md` now calls the
  real thing **Header Overlay Preset**. Owned by C4.

## Non-Negotiable Rules

- A Work Version has exactly one workflow, `framed` or `pure`, chosen once.
- Framed renders only kicker, title, and subtitle locally. Everything else is
  provider-rendered.
- `_generated/`, receipts, review records, and state are never hand-edited.
- A provider avoidance instruction is not a collision guarantee.
- Record Data is append-only. The 15 frozen identifiers are read forever and
  never rewritten.
- No schema identifier gains a `-vN` suffix. If the charter changes, everything
  changes together.
- A derived value without provenance is a defect: the Agent could not then state
  a change's blast radius, and the human could not check the claim.

## Update Protocol

Check a task only when its named evidence exists. When a change lands, record
its exit evidence here and in the owning specialist plan. If a decision changes
the ordering or the ownership of a boundary, revise this plan before starting
the affected downstream change.
