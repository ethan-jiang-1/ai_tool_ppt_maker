## Context

CURRENT `page-authority-image2-v1` accepts a `page_authority_default` plus
per-slide `pure-image2` or `framed-image2` selection. A mixed deck is valid,
and the current `04-image-production/page-authority` owner combines typed raw
work, both finalization branches, final-manifest publication, PPTX assembly,
notes injection, delivery review, and part of iteration semantics.

The target approved by
[`page-authority-workflow-baseline-target-gap.md`](../../../_backlog/plans/page-authority-workflow-baseline-target-gap.md),
[`framed-image-directory-ssot.md`](../../../_backlog/plans/framed-image-directory-ssot.md),
and the active
[`page-authority-workflow-openspec-progressive-plan.md`](../../../_backlog/plans/page-authority-workflow-openspec-progressive-plan.md)
is a different authoring model, not a folder move: a version chooses Framed or
Pure once, then follows `03 XOR 04 -> 05 -> 06`. Shared mechanisms remain
shared only where they do not need workflow semantics. Existing CURRENT v1 runs
cannot be reinterpreted as a target route because source selection, receipt
meaning, and evidence freshness differ.

This is framework repository maintenance. Only `PPTMAKER_FRAMEWORK/`,
`openspec/`, `tests/`, and `tests_e2e/` are implementation scope. Run bundles
are not source fixtures and no `deck_*`, `dpt_*`, or `_generated/` bytes are
automatically migrated or hand-edited.

## Goals / Non-Goals

**Goals:**

- Make the target source/state/receipt pair mechanically distinguishable from
  CURRENT v1 before any provider work.
- Make a new version choose exactly one user-visible workflow and remove the
  TARGET per-slide authority escape hatch.
- Give Framed, Pure, shared raw mechanics, and delivery one business owner
  each, with a common bound final-slide-manifest contract.
- Preserve exact authorization, evidence, byte, lineage, review, stable-ID,
  structural-preview/hash, and recovery invariants.
- Keep CURRENT v1 mixed runs legal only through an explicit, bounded route;
  make a workflow switch a structural vNext decision.
- Activate new init only after both target workflows, delivery, state,
  controller, compatibility, and required provider-free tests are complete.

**Non-Goals:**

- Redesign Image2 provider, model, credentials, transport, or visual-quality
  policy.
- Add a third mixed TARGET workflow or a per-slide override.
- Bulk-migrate, inspect, or rewrite user production data.
- Add direct CLI verbs, flags, JSON envelopes, or diagnostics. If an
  implementation proves one is required, it must stop and add the accepted
  `cli-surface` delta before changing that producer contract.
- Change the observable `pptx-assembly` or `notes-injection` contract merely
  because their implementation owner moves.
- Introduce a feature flag, state dual-write, compatibility re-export, generic
  coordinator, or second evaluator that hides incomplete migration.

## Decisions

### 1. TARGET identity is a new source/state/receipt protocol

The target canonical source begins with this exact shape:

```yaml
production:
  pipeline: page-authority-image2-v2
  workflow: framed # or pure
```

`production.workflow` has exactly two lowercase values: `framed` and `pure`.
It is version-level, mandatory, hash-bound, and inherited by every resolved
slide. TARGET source rejects `production.page_authority_default` and all
per-slide `PAGE AUTHORITY` declarations. Conversely, CURRENT
`page-authority-image2-v1` continues to require its v1 fields and must reject
TARGET-only fields rather than tolerate a partial hybrid.

The target pair is:

| Fact | CURRENT | TARGET |
| --- | --- | --- |
| source marker | `page-authority-image2-v1` | `page-authority-image2-v2` |
| source semantics | per-slide `pure-image2` / `framed-image2` | one `framed` / `pure` workflow |
| source receipt schema | current Page Authority receipt | `page-authority-image2-source-v2` |
| state mode | `image2-page-authority` | `image2-page-authority-v2` |

The marker-first resolver accepts exactly one recognized pair: CURRENT v1,
TARGET Framed v2, TARGET Pure v2, recognized historical observation, or an
owner-issued repair/error. A marker/state mismatch, absent workflow,
unsupported workflow, or both v1 and v2 fields is a hard-stop. It must not use
field absence, directory names, artifacts, state projections, or chat context
to guess a route.

This uses a new marker instead of reusing v1 because old bytes must retain
their old meaning. It uses `framed`/`pure` rather than reusing v1's
per-slide token literals so receipt and diagnostic types remain unambiguous.

### Terminology delta ledger

| Term | TARGET treatment | Reason |
| --- | --- | --- |
| Page Authority, Image2, Pure, Framed, Text Frame, stable `slide_id`, raw evidence, final manifest, PPTX assembly, notes injection | Retain | These concepts remain accurate and have existing accepted ownership. |
| `pure-image2`, `framed-image2`, `page_authority_default`, per-slide `PAGE AUTHORITY` | Retain as CURRENT v1-only terms | Their bytes and per-slide meaning must not be reinterpreted by TARGET. |
| `production.workflow: framed|pure`, `page-authority-image2-v2`, `image2-page-authority-v2` | Add as TARGET-only terms | They distinguish a homogeneous version workflow, marker, and state from v1. |
| `RawWorkPlan`, `AcceptedRawEvidence`, `FinalSlideManifest` | Use as typed interface concepts | They describe the target seams without forcing public file or function names beyond their declared schema identities. |
| `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration` | Add as Method Module ownership graph | It replaces the old generic owner without renumbering global Pipeline Stages. |
| Header Text & Style Refresh | Retain with a narrowed TARGET meaning | It is provider-free only for Framed text-only edits with current exact evidence and preset. |

### 2. CURRENT v1 has bounded compatibility; target migration is structural

The accepted compatibility decision is bounded CURRENT v1 production
compatibility. A v1 marker paired with `image2-page-authority` continues to
run its existing mixed source/resume/refresh/delivery route. It never reads a
v2 workflow field, and v2 code never treats a v1 default or per-slide override
as a target choice.

A version may enter TARGET only through an explicit homogeneous structural
vNext transaction. Preview records the chosen target workflow and exact plan
hash. Apply makes zero provider calls, creates a fresh v2 source/state pair,
and may materialize only an exact, accepted, plan-bound tuple as target-owned
unreviewed provenance. It does not inherit provider authorization, raw review,
final slides, projection, PPTX, notes, delivery review, or active execution.
All other target slides begin with raw-generation debt.

Bounded compatibility avoids forcing the Agent to infer whether an existing
mixed version should become Framed or Pure. Migration-only was rejected because
it would make legal CURRENT runs unsupported before a deployable target route
exists. Long-lived v1 re-exports are rejected: the compatibility resolver is
the sole retained v1 owner and has a documented removal direction.

### 3. Three typed artifact seams isolate business semantics

| Artifact | Schema identity | Sole writer | Allowed readers | Binding and invalidation |
| --- | --- | --- | --- | --- |
| `RawWorkPlan` | `page-authority-raw-work-plan-v2` | selected `03` or `04` adapter | shared raw owner, selected adapter | Binds v2 source-receipt digest, workflow, ordered stable IDs, typed per-slide raw-contract digests, provider profile, and authorization scope. Any source, workflow, typed-contract, or provider-profile drift invalidates it. |
| `AcceptedRawEvidence` | `page-authority-accepted-raw-evidence-v2` | shared raw owner | selected adapter, inspection, iteration | Binds one `RawWorkPlan` digest, exact raw byte hashes/paths, provider/authorization tuple, and raw-review decision. It is current only for the exact plan and evidence tuple. |
| `FinalSlideManifest` | `page-authority-final-slide-manifest-v2` | selected adapter | `05-delivery`, inspection, iteration | Binds one accepted evidence digest, v2 source receipt, ordered stable IDs/positions, final PNG byte hashes, and workflow provenance. Structural/source/raw drift deletes or rebuilds it through its owner. |

The Framed adapter composes a final PNG from accepted text-free underlay evidence
and its local Text Frame. The Pure adapter publishes accepted raw bytes as the
final PNG. Both publish the same manifest schema. Shared raw mechanics only
validate typed plans, authorize/submit, record evidence, and manage raw review;
they do not inspect Text Frame literals, no-text semantics, reserved rectangles,
or Pure display literals. Shared delivery only consumes the ordered manifest and
source-owned notes lineage; it does not branch on workflow provenance.

This is preferred over an extended generic `finalizePage` because the current
authority switch would remain a hidden third owner. No artifact may be
hand-written to bypass a missing prerequisite; derived files are rebuilt by
their owning interface.

### 4. `03`, `04`, `05`, and `06` have explicit ownership and import boundaries

The target method graph and source ownership are:

```text
01-content + 02-visual-system
                 |
        source receipt (workflow once)
                 |
       +---------+---------+
       |                   |
03-framed-image       04-pure-image
       |                   |
       +---- typed raw ----+
                 |
          shared raw mechanics
                 |
       AcceptedRawEvidence
       |                   |
03 compose          04 publish
       +---- FinalSlideManifest ----+
                                  |
                             05-delivery
                                  |
                             06-iteration
```

- `03-framed-image` owns `standard-v1`, frame fit/preflight, reserved
  underlay rectangles, text-free raw contribution, capture/composition, and
  Framed-local refresh.
- `04-pure-image` owns Pure display/raw contract compilation, raw-to-final
  publication, and Pure rebuild classification.
- The raw owner owns provider authorization/submission, exact tuple evidence,
  and raw review. It accepts typed plans only.
- `05-delivery` owns manifest validation, final projection, full-page-image
  PPTX assembly, notes injection, and delivery review. It has one public
  result, not a workflow-specific delivery receipt.
- `06-iteration` reads direct source/receipt/evidence facts to select exactly
  one legal refresh or structural route. It does not reproduce `03`, `04`, or
  `05` implementation.

`03` and `04` SHALL NOT import each other or either sibling's `internal/`
module. Their only common dependencies are approved shared source/visual/raw
interfaces and the final-manifest contract. Architecture tests enforce this,
and every registered direct executable has one current owner and source-to-test
entry. This is preferable to `04` acting as a generic coordinator because
directory and import boundaries stay aligned with user-visible ownership.

### 5. New-user routing is marker-first and public CLI grammar stays stable

New init/source templates create v2 source only after activation and record the
single `framed` or `pure` choice before provider work. The MD Controller asks
for that one semantic choice and then displays only the selected workflow's
facts, gate, and nearest action. JS owns parsing, receipt creation, state,
evidence, and deterministic recovery; the controller consumes those producer
facts without copying schemas or evaluators.

Direct command verbs, flags, stdout/stderr JSON, diagnostic codes, and child
process contracts remain unchanged. Marker-first resolver output is consumed by
existing owner routes, so this change does not create a `cli-surface` delta.
An unsupported or mismatched pair is a resolver hard-stop with its owning
repair action, not a new CLI grammar.

### 6. Refresh semantics are workflow-aware and structurally bounded

| Edit | Owner and minimum legal path |
| --- | --- |
| Framed Text Frame-only change with exact accepted raw | `03` local compose -> final manifest -> `05-delivery`; zero provider work |
| Framed preset/style or underlay/visual change | `03` invalidates the affected underlay/raw tuple -> shared raw authorization/review -> compose -> delivery |
| Pure visible display or visual change | `04` invalidates raw -> shared raw authorization/review -> publish -> delivery |
| Notes-only change | `05-delivery` rebuilds notes/delivery lineage without changing pixels |
| Insert/delete/reorder | Structural Versioning Path: preview + exact hash + zero-provider apply, then target-local work |
| Framed/Pure switch | Whole-version Structural Versioning Path with a new v2 workflow receipt; no in-place mutation |

`Header Text & Style Refresh` remains valid only for a Framed text-only edit
whose exact accepted raw evidence and v2 frame preset remain current. A preset
change is not a text-only refresh; it invalidates the reserved-underlay/raw
relationship and follows the Framed rebuild route.

### 7. Gates, control, activation, and rollback use one direct truth path

| Outcome | Condition | Owner and action |
| --- | --- | --- |
| guide | canonical v2 source has a deterministic repairable formatting issue | owning parser heals through its sanctioned writer, then reruns the same resolver |
| confirm | user must choose `framed`/`pure`, authorize nonzero provider work, or make a visual/raw review decision | MD presents the single bounded choice; the owner records the decision with current identity/evidence |
| hard-stop | marker/state/receipt identity mismatch; missing/invalid workflow; authorization, evidence, byte, hash, or lineage failure | owning resolver/state/evidence interface rejects, names the protected invariant, and returns one repair-and-rerun action; no waiver/force path |

The direct facts are source marker/workflow, bound receipt, owner-issued
evidence, manifest bytes, and state records. Inspection and Markdown guidance
remain non-mutating projections. The same resolver/evaluator is reused by
inspection, preflight, submit, refresh, and recovery where it evaluates the
same fact. This removes per-slide dispatch and duplicate final/delivery
validators instead of adding a controller layer, feature flag, or parallel
success state.

TARGET registration is staged: first internal typed seams and provider-free
fixtures; then both workflow adapters and shared delivery; then target
state/controller/inspection plus CURRENT boundary; finally fresh init/template
registration. Rollback before fresh-init activation removes the incomplete
target branch. Rollback after activation routes v1 through bounded
compatibility and stops new v2 initialization only through an explicit release
action; it never rewrites v2 source/state to v1 or treats v2 evidence as v1.

## Risks / Trade-offs

- **CURRENT/TARGET collision** -> Marker-first parsing, exact source/state
  pair validation, and negative fixtures reject hybrid bytes before provider
  work.
- **A shared seam regains workflow semantics** -> Typed plan/evidence inputs,
  import tests, and branch-prohibition architecture tests force semantics back
  to the selected adapter.
- **A mixed v1 run is silently coerced** -> Bounded compatibility is an
  explicit resolver result; structural migration requires workflow selection,
  preview, and exact plan hash.
- **Framed content needs semantic body text** -> The Framed preflight returns
  one earliest action: rewrite the version's content or structurally switch the
  entire version to Pure. It never converts one slide implicitly.
- **Delivery forks during extraction** -> Both adapters publish the same
  manifest; `05-delivery` has the only PPTX/notes/review writer and tests both
  provenances with identical assertions.
- **Migration expands into provider redesign** -> Provider model, transport,
  and credentials remain out of scope; provider-facing work uses fixtures for
  ordinary verification.
- **Compatibility becomes permanent** -> The retained v1 resolver is one
  bounded owner with tests and a documented removal direction, not a re-export
  scattered across adapters.

## Migration Plan

1. Add v2 parser/receipt/state contracts and fixtures without registering v2
   in fresh init or public controller paths; freeze CURRENT baseline tests.
2. Introduce the three artifact seams and prove CURRENT behavior can traverse
   them without observable v1 change.
3. Build and test `03-framed-image` and `04-pure-image` behind target receipt
   fixtures, then extract authority-agnostic `05-delivery`.
4. Add v2 marker/state resolver, `06-iteration`, controller/inspection/docs,
   and the bounded v1 compatibility route. Verify direct CLI grammar remains
   unchanged.
5. Run target Framed, target Pure, and CURRENT mixed integration/E2E paths;
   only then register v2 in init/source templates and require one workflow
   choice for new versions.
6. Remove superseded generic branches, duplicate validators, old method-module
   paths, fixtures, and documentation. Retain only the declared v1 compatibility
   owner; archive after strict validation and full regression evidence.

## Verification Strategy

- **Unit:** source/state pair resolution; workflow field validation; Framed
  fit/preflight; Pure raw-plan compilation; artifact hash/invalidation;
  wrong-owner and hybrid-input rejection.
- **Architecture:** `03` and `04` cannot import each other; shared raw and
  delivery contain no workflow semantic branch; registered executable,
  directory, and source-test inventories remain complete.
- **Integration:** target Framed receipt -> accepted raw -> local compose ->
  manifest; target Pure receipt -> accepted raw -> publish -> manifest; both
  manifests -> identical `05-delivery` contract; CURRENT v1 remains bounded.
- **Controller/E2E:** one workflow choice; marker-first inspection/route; one
  nearest action; fresh Framed, fresh Pure, CURRENT mixed compatibility, the
  two workflow-specific refresh paths, notes-only, and structural workflow
  switch all have recorded outcomes.
- **Negative:** per-slide target override, invalid source/state pair, stale or
  cross-protocol evidence, wrong workflow state, partial manifest, and second
  delivery result fail closed before derived work. Ordinary tests use minimal
  provider fakes/fixtures, not production decks or live provider calls.

## Open Questions

None before apply. A future need to alter direct CLI grammar/diagnostics,
PPTX/notes observable contracts, provider architecture, or a third workflow is
outside this accepted design and requires a new or updated OpenSpec decision.
