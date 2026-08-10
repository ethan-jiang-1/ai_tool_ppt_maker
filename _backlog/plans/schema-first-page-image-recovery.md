# Progressive Plan: Schema-First Page Image Recovery

> Type: progressive coordination plan | Updated: 2026-08-11 | Status: active
>
> **This is the only route document for Page Image recovery.** Three earlier
> plans were closed on 2026-08-11 as CLS-025/026/027; everything from them that
> still binds is restated below, so no downstream change needs to open a closed
> document. Two specialist plans remain active and are owned by change C6:
> [framed-provider-protected-composition.md](framed-provider-protected-composition.md)
> and
> [framed-provider-capability-discovery-research.md](framed-provider-capability-discovery-research.md).

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
no-versioning rule forbids. The protocol name question is settled below under
"The protocol name is frozen": it stays `page-image-workflow-v1`.

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

### The protocol name is frozen for the same reason, and it is not renamed

The withdrawn change proposed `page-authority-image2-v2`. Separately from the
no-versioning rule, three protocol/mode identifiers are load-bearing in
persisted data and cannot move:

| Identifier | Source files | Record files outside `_generated/` | What it is |
| --- | --- | --- | --- |
| `page-image-workflow-v1` | 58 | 31 | the pipeline/adapter route |
| `image2-page-workflow-v1` | 24 | 2 | the per-version production mode |
| `mnemonic-v1` | 33 | 3 | the slide identity scheme |

`page-image-workflow-v1` is the hardest case. It is not merely stored — it is
*computed into* the provider idempotency key:

```js
// page_image_progressive_schema.mjs:417
return `page-image-workflow-v1-${attempt_key_sha256}`;
```

and attempt validation compares the persisted key against that function for
exact equality (`:457`, `:463`). 27 attempt records in
`deck_dark_factory_current/1_upstream_raw_material/` carry keys with that
prefix. Changing the literal makes every one of them fail validation — the paid
attempt history becomes unreadable, not merely mislabelled.

It also appears in `_state/state.yaml` as `pipeline:` and in the front matter of
`slide-specifications.md` for v1, v2, and v3 — i.e. in Source Data the human
authored. Rewriting those is a source migration, not a rename.

**Decision: the protocol keeps the name `page-image-workflow-v1`.** The user's
preferred `page-image2-workflow` describes the same thing and reads better, but
it buys nothing that the schema definitions do not already deliver, and it costs
the readability of paid evidence. The `-v1` here is a frozen literal inside an
identity function, in the same category as the 15 record identifiers above — not
a version number anyone may bump. C1 records this in `frozen-identifiers.yaml`
with its reason, so the next reader does not re-propose the rename.

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
  frozen-identifiers.yaml  the 15 record schemas + 3 protocol/mode/identity
                           literals, read-only forever, each with its reason
```

Code constants become mirrors annotated `// anchor: schema/stages/<name>.yaml`.
A regression test enumerates schema constants across `.mjs` and fails on any
name with no definition. `frozen-identifiers.yaml` is the explicit exception
list. Its two entry kinds differ:

- **Frozen record schema** (the 15) — reading is permitted, writing new data
  under the identifier is not. New records use the new vocabulary.
- **Frozen literal** (`page-image-workflow-v1`, `image2-page-workflow-v1`,
  `mnemonic-v1`) — still actively written, because it identifies the live
  protocol, mode, and identity scheme. It is frozen against *renaming*, not
  against use.

Every entry carries a `reason:` naming the specific data that would become
unreadable. Without it a future reader sees only a `-v1` suffix and re-proposes
the rename this plan already rejected.

## Already Landed

Carried forward from the closed plans. These need no rework.

| Work | Evidence |
| --- | --- |
| **Baseline confirmed** | The v3 collision is provider-page content entering the Framed local header area before local composition. Current v3 has no accepted raw evidence, final manifest, or delivery receipt, so it cannot proceed. |
| **Framed test baseline restored** | `restore-framed-contract-baseline` (2026-08-10): 16 passing workflow tests, 3 named `it.todo` cases for the known omissions — lost `subject_restrictions`, ambiguous protected-region coordinates, missing body-safe region. The old 11 stale failures are gone. Those three define C6's work. |
| **Task Mandate aligned** | `align-task-mandate-exact-grants`, committed `17bb9f5`. Routine plan/Pilot/successor/grant/generation actions are Agent-run with `requires_human: false`; exact batch/grant/attempt/provenance lineage retained; Pilot and Complete Page Review remain human decisions. Verified: State/raw-owner/workflow 52/52, CLI 4/4, Controller 9/9, mock E2E 8/8, `npm test`. |
| **Provider surface recorded** | The transport submits `model`, `prompt`, `n`, `size`, `image`, `images`, `image_urls` — no mask or region field. A synthetic stress fixture, rubric, and result template exist. No paid probe was run; that stays in C6. |
| **Glossary and decision record** | `CONTEXT.md` rewritten 2026-08-11: 11 stale "settled target" terms removed, upstream narrative and data-kind vocabulary added, `Header Overlay Preset` corrected against the implementation. [ADR 0006](../../docs/adr/0006-define-production-schemas-in-yaml.md) records the YAML-authority and no-versioning decisions. |

## Ordered Route

```text
Landed
  Confirmed baseline
  Framed current-contract test baseline restored
  Task Mandate aligned with exact-grant runtime
  Provider capability surface recorded
  CONTEXT.md rewritten + ADR 0006          <- 2026-08-11
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
| **C2** Conform code to definitions | Rename constants, add anchors, add the drift test, enforce `frozen-identifiers.yaml` | Touches nearly every `.mjs` but changes no behaviour. A pure-rename change is reviewable by diff; bundling semantics into it is not. |
| **C3** Upstream gap | `story-outline`, `design-constraints`, pagination | New capability territory. Independent of Page Class. |
| **C4** Page Class + layout config | Parser, Core, resolver, both adapters, invalidation | The `XL` change. Needs C1/C2 vocabulary settled first or it re-scatters the schema. |
| **C5** Per-page derived data on disk | `image2 plan` writer, path layout | Depends on C4's resolver existing. Provider-free, so it can land and be inspected before any spend. |
| **C6** Framed hardening | `subject_restrictions` propagation, normalized geometry, body-safe region | Carries external provider risk. Must not block C1–C5. |
| **C7** v3 repair | Production data path only | Not Harness maintenance. Runs under the Task Mandate, not OpenSpec. |

C1 and C2 are the new work. C3–C7 absorb the earlier plans' Phases 1–6 with
their evidence intact.

## Absorbed Design Decisions

The two superseded plans are closed. Everything from them that still binds is
restated here, so no downstream change needs to read a closed document.

### From the schema plan (Q2–Q13, settled 2026-08-10)

| # | Decision | Owner |
| --- | --- | --- |
| Q2 | The current Work Version is the design boundary. Other versions may learn from it but never inherit automatically. | C4 |
| Q3 | Flexibility for opening/transition/closing pages is source-authored class selection, never a post-generation layout override. | C4 |
| Q4 | The closed class set is `standard`, `opening`, `transition`, `closing`. | C4 |
| Q5 | `standard` is the default; every special class is explicit in source. | C4 |
| Q6 | A framed header treatment owns its allowed kicker/title/subtitle set; a special class may be title-only. | C4 |
| Q7 | A human may redirect a page only to an existing named class, through source. That invalidates raw work and requires a new review. | C4 |
| Q8 | Page-definition schema and profile ownership are a cross-workflow problem. Pure's configuration cannot be repurposed to hold Framed facts. | C4 |
| Q9 | One version-level config resolves a class into strictly isolated Pure and Framed projections. Not one cross-workflow YAML. | C4 |
| Q10 | Before production each page exposes its source, resolved config, and generation spec; Framed also exposes its deterministic header HTML. No duplicate header-controller JSON. | C5 |
| Q11 | Those layers publish as independent per-page files with an index, not one giant document. | C5 |
| Q12 | A deck-level index explains purpose, adjustment scope, downstream controllers, and rebuild impact. | C5 |
| Q13 | Class profiles inherit deck-wide defaults and declare only typed differences; the resolved view shows the inherited result. | C4 |

**Config file layout** (C4). Four documents under
`visual-style/page-image-presentation/`, resolved by the normal
override-first/backbone-default path and validated as one closed package:

| Document | Owns | Must not contain |
| --- | --- | --- |
| class catalog | closed class set, default, class→profile identifiers | slide literals, geometry, provider prose |
| deck defaults | workflow-neutral typography, colour roles, density | per-slide facts, renderer geometry, prompts |
| pure profiles | Pure-only full-page treatment per class | framed header facts |
| framed header profiles | allowed fields, Reserved Header Region, local type/colour/spacing | Pure zones, provider prose, slide overrides |

A malformed, missing, or cross-file-inconsistent document stops planning; the
resolver never falls back to an earlier generated projection. The source-facing
counterpart is one closed field, `**PAGE CLASS**: opening`, whose omission
normalizes to `standard`.

**Invalidation** (C4). A class reassignment, a deck-default edit, or a
*selected* profile edit changes the page's resolved presentation and forces raw
rebuild plus a new Complete Page Review. An *unselected* class or sibling
profile edit invalidates nothing. A workflow transition resolves a fresh
projection and never reuses an old raw contract.

**Framed publishes header HTML only** (C5). The resolved page layout already
carries the structured header facts, and the HTML is the exact deterministic
local controller. A sibling JSON copy would add a duplicate with no decision
value.

### From the feasibility research (2026-08-10)

Effort, in the research's own scale — `S` bounded to one owner, `M` crosses a
few, `L` changes an adapter and its lifecycle tests, `XL` changes common
contracts, both adapters, paths, and regression suites:

| Change | Estimate | Dominant risk |
| --- | --- | --- |
| C1 | `S` | none — documentation only |
| C2 | `M` | wide diff; the 15 frozen record identifiers must survive |
| C3 | `M` | new territory, low coupling |
| C4 | `XL` | selected-vs-unselected invalidation, and source migration |
| C5 | `M` | must not become a second authority or a navigation copy |
| C6 | `L` prompt-only, `XL` if a native primitive appears | external provider behaviour |
| C7 | `M` operationally | low architecture risk if C1–C6 pass |

Regression blast radius, by area:

| Area | Coverage to add or repair |
| --- | --- |
| source and receipt | `tests/01-content/test_page_authority_source.mjs` — currently asserts only the old preset |
| shared semantics | `test_page_image_core.mjs`, `test_page_image_invalidation.mjs`, both adapter suites |
| version config | `test_pure_deck_visual_system.mjs` plus new resolver/migration tests including unselected-profile non-invalidation |
| framed compilation | `test_framed_workflow.mjs`, then parsed-source-to-exact-request, coordinate-semantics, restriction, transport tests |
| per-page derived data | new path/schema tests; keep `test_complete_page_review.mjs` so publication cannot create a second acceptance state |

The research's three relaxation findings still hold: provider capability
discovery does not wait for schema code; Task-Mandate runtime alignment was
independent (and has landed); and a friendly projection must never become a new
gate.

### Version succession, not protocol migration

The superseded schema plan specified a `v3 -> v4` migration. Its **mechanism**
survives; its **framing as a protocol change** does not — there is one
protocol.

What survives: `--new-version` already copies only `slide-specifications.md`
and `overrides/` while resetting `_generated/`. A successor version therefore
gets a clean source snapshot and the new config package before any raw plan is
built, and the predecessor stays byte-preserved with its evidence intact. The
successor receives no raw evidence, grant, review decision, or final media.
Verified against the current v3: all three pages (`DkfGo`, `TwoMet`, `PlatGo`)
normalize to `standard`, so succession makes no content or special-class
judgment. Owned by C7.

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
- Record Data is append-only. The 15 frozen record schemas are read forever and
  never rewritten.
- No *new* schema identifier gains a `-vN` suffix. If the charter changes,
  everything changes together. The existing frozen literals keep theirs because
  persisted identity keys depend on the exact string.
- A derived value without provenance is a defect: the Agent could not then state
  a change's blast radius, and the human could not check the claim.

## Update Protocol

Check a task only when its named evidence exists. When a change lands, record
its exit evidence here and in the owning specialist plan. If a decision changes
the ordering or the ownership of a boundary, revise this plan before starting
the affected downstream change.
