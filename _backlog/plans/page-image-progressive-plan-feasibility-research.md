# Research: Feasibility of the Page Image Progressive Plan

> Type: implementation-feasibility research | Updated: 2026-08-11 | Scope: current
> OpenSpec specifications, Harness source, tests, and active plans only. No production
> code, run bundle, existing plan, policy, or `CONTEXT.md` was changed.
>
> Status: **evidence retained, recommendation superseded.** The verified
> baseline, defect list, effort table, and blast-radius analysis remain
> accurate and are cited by
> [schema-first-page-image-recovery.md](schema-first-page-image-recovery.md).
> Its closing execution order is withdrawn: the owner made the schema the
> deliverable rather than an input to a presentation-system implementation.

## Conclusion

The progressive plan is technically feasible, but it is a medium-to-high change
program, not a small Framed patch. Its two core ideas are sound: keep a version
on exactly one workflow and keep Framed's local renderer limited to the fixed
header. Those boundaries already exist in the current parser, Core, and review
contracts. [content parsing spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/content-parsing/spec.md:39)
[visual config spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/visual-config/spec.md:41)

The plan should **not** be treated as one prerequisite chain in which every
schema task must finish before any provider fact can be learned. The highest
uncertainty is whether the selected provider can honor a protected region. The
existing `standard-v1` Framed preset is sufficient to design and prepare a
bounded synthetic probe now; full Page Class storage is not a technical
precondition for that learning. The final class-aware contract should still wait
for the shared schema decision. [header overlay](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/internal/header_overlay.mjs:44)
[progressive plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/page-image-progressive-plan.md:166)

The most important implementation mismatch is not the Page Class schema. The
new policies say that one Task Mandate covers normal in-scope provider work and
ordinary cost, but the running progressive owner still emits a human-required
`confirm` for each batch grant and the MD consumer is required to stop on that
flag. A sentence in the plan cannot override that behavior; accepted capability
specifications and runtime truth take precedence over policy guidance. [human-centered control policy](/Users/bowhead/ai_tool_ppt_maker/openspec/policies/human-centered-gates.md:7)
[agent assistance policy](/Users/bowhead/ai_tool_ppt_maker/openspec/policies/agent-assistance-and-control.md:20)
[progressive raw owner](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs:719)
[node specification](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/node-specification/spec.md:513)

## Verified Current Baseline

### What can be reused

- The source parser already has a strict, workflow-homogeneous receipt boundary.
  It rejects per-slide workflow fields and free-form layout ingress, so a closed
  `PAGE CLASS` field can be added without turning the source into arbitrary
  renderer configuration. [source parser](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:28)
  [content parsing spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/content-parsing/spec.md:39)

- Both adapters already compile immutable provider inputs and bind their hashes
  through raw plans. The shared runtime writes a provider-free exact-request
  inspection after planning and explicitly excludes that sidecar from
  authorization, submission, reconciliation, and materialization. This is a
  genuine foundation for the desired data exposure, rather than a second data
  path. [target runtime](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:277)
  [Framed plan publication](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/index.mjs:1151)
  [Pure plan publication](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/04-pure-image/index.mjs:840)

- Framed already derives a deterministic local header contract and self-contained
  HTML from one closed preset. The HTML is currently private to browser capture,
  so publishing a controller projection needs an intentional API and artifact
  writer, not a new renderer. [Framed render contract](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs:161)
  [Framed render contract](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs:204)

- Complete Page Review already matches the desired acceptance shape: Framed
  shows the provider page and the production-equivalent composite together; Pure
  shows only the provider page; each has one `proceed | repair` decision. It
  should be preserved, not replaced by an occupied-zone checker or a second
  approval. [image production spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-production/spec.md:64)
  [image generation spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-generation/spec.md:72)

### Confirmed defects and constraints

- Current `PAGE CLASS` does not exist. Framed source presently requires exactly
  `FRAME PRESET: standard-v1`, while Pure rejects that field. [source parser](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:626)
  [source parser](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:651)

- `subject_restrictions` reaches the source receipt but is discarded when Page
  Image Core normalizes a slide; Core retains only provider content, header
  policy, and visual language. It therefore cannot reach the Framed raw contract
  or compiled input today. [source parser](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:844)
  [Page Image Core](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/page-image/page_image_core.mjs:183)

- The Framed raw contract has a CSS-canvas geometry, but its compiled provider
  input sends only bare `protected_geometry`. It does not send canvas/units or a
  normalized body-safe region. This is the concrete collision-risk defect; the
  transport is intentionally opaque and submits the adapter's bound bytes.
  [Framed adapter](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/index.mjs:792)
  [Framed adapter](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/index.mjs:821)
  [image generation spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-generation/spec.md:8)

- The current HTTP body exposes only model, prompt, size, Style Master image,
  and optional reference images. It does not currently transport a mask or a
  layout/protected-region field. That does **not** prove the provider lacks such
  a primitive; it proves that an eventual native primitive would require a
  selected transport contract change as well as provider evidence. [provider submit factory](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/ppt_flow.mjs:2233)

- `pure-deck-visual-system.yaml` is deliberately Pure-only: its parser has a
  closed content-neutral shape and its loader resolves through the Pure
  override/backbone location. Framed is explicitly forbidden from consuming its
  digest. Extending that file into a Framed profile registry would violate a
  current ownership contract, not merely rename an input. [Pure visual-system loader](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/02-visual-system/internal/pure_deck_visual_system.mjs:14)
  [Pure visual-system loader](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/02-visual-system/internal/pure_deck_visual_system.mjs:306)
  [visual config spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/visual-config/spec.md:103)

## Effort and Risk by Progressive Phase

The sizes below are engineering-complexity estimates, not provider-price
quotes. `S` is a bounded change in one owner, `M` crosses a few owners, `L`
changes an adapter and its lifecycle tests, and `XL` changes common contracts,
two adapters, paths, and regression suites.

| Progressive phase | Feasibility and actual implementation surfaces | Estimate / main risk |
| --- | --- | --- |
| 0. Confirmed baseline | Already research/document work. Do not spend implementation time here beyond recording evidence. | Done. |
| 1. Settle shared schema | Feasible as design work. It must choose `PAGE CLASS` syntax, one version-owned configuration source, selected-projection digest semantics, migration, and the direct data view before code. The current schema plan correctly leaves topology open rather than pretending the sample YAML is accepted. [schema plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/page-image-presentation-schema.md:44) | `M`; high decision risk, low code risk. |
| 2. Land shared presentation system | `PAGE CLASS` must enter `page_image_source.mjs`, Core semantic facts, provider-input bindings, invalidation, both adapters, bundle seeding/paths, and tests. The existing centralized binding/invalidation seams make this feasible, but it is cross-cutting. [Page Image Core binding](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/page-image/page_image_core.mjs:290) [invalidation](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/page-image/page_image_invalidation.mjs:94) | `XL`; selected-vs-unselected invalidation and source migration are the largest risks. |
| 3. Provider capability | A small synthetic probe is technically easy to prepare with the present `standard-v1` header, but outcome risk is external and nondeterministic. If a native primitive exists, transport changes are needed because today's request body has no such field. [header overlay](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/internal/header_overlay.mjs:44) [provider submit factory](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/ppt_flow.mjs:2233) | `S-M` code, high external/product risk. |
| 4. Framed hardening | Feasible and localized relative to Phase 2: repair Core propagation for `subject_restrictions`, define normalized protected-composition facts, change the Framed raw contract/compiler, bind/invalidate them, and add transport/review tests. If the provider has no primitive, this can only deliver an explicitly best-effort contract, not a hard spatial guarantee. [Framed plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/framed-provider-protected-composition.md:254) | `L` with prompt-only best effort; `XL` if selected provider transport gains a native primitive. |
| 5. Synthetic conformance | The lifecycle already has exact batch, attempt, evidence, and Complete Page Review machinery. It is an operational evidence phase, not a reason to invent a second acceptance state. [progressive raw owner](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs:1700) [image production spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-production/spec.md:64) | `M`; provider spend and nondeterminism dominate. |
| 6. Repair current v3 | Feasible only after the selected contract is tested. Source/config changes must take the existing owner path to a new plan, new provider lineage, and one new review; old evidence cannot be patched into acceptance. [image generation spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-generation/spec.md:166) [progressive plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/page-image-progressive-plan.md:307) | `M` operationally; low architecture risk if earlier phases pass. |

## Task Mandate Versus Current Runtime

### The real mismatch

The policy direction is correct for an assistant: a clear Work Request covers
normal in-scope execution, recovery, and ordinary cost once; the Agent should
not ask again for every plan, batch, repair, review, or provider request.
[human-centered control policy](/Users/bowhead/ai_tool_ppt_maker/openspec/policies/human-centered-gates.md:7)

Current capability semantics do not implement that direction yet:

| Desired behavior | Current owner behavior | Consequence / required change |
| --- | --- | --- |
| One Task Mandate means routine provider work is Agent-run. | The progressive raw owner returns `authorize_progressive_raw_batch` as `kind: confirm`, `requires_human: true`, and describes it as confirming disclosed batch cost. [progressive raw owner](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs:719) | Add a narrowly scoped Task-Mandate/runtime alignment task. Keep exact batch grants, but let the Agent create them under an active in-scope mandate instead of treating each as a new human decision. |
| The Controller does not re-ask merely because the raw owner emitted a routine action. | Workflow inspection converts `requires_human` into `confirm`, and the MD spec says the consumer must stop on it. [workflow inspection](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs:289) [node specification](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/node-specification/spec.md:519) | Change the producer action classification and dependent Controller/test expectations together; changing only conversation guidance will not remove the repeated prompt. |
| Exact evidence remains automatic bookkeeping, not a reason to discard lineage. | Grants validate exact plan/batch IDs, items, and maximum submissions; target authorization records similarly bind source epoch, plan, profile, scope, count, execution ID, and timestamp. [progressive raw schema](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_progressive_schema.mjs:352) [state](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/state/state.mjs:2087) | Preserve these receipts and hard-stops. The change is who triggers a routine grant, not whether it is recorded or exact. |
| A quality decision remains human-centered without becoming a repeated budget prompt. | Complete Page Review still has one explicit `proceed | repair` decision and its target-runtime writer publishes accepted evidence only for `proceed`. [image production spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-production/spec.md:64) [target runtime](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:1353) | Do not auto-accept pixels or weaken review. Natural-language feedback such as “this page is not working” can support `repair`; a genuinely undecided `proceed` remains a presentation-quality choice. |

This should be a small, separately named OpenSpec slice. It needs an explicit
source/owner for the Task Mandate because current authorization and grant record
shapes contain exact execution facts but no mandate reference. Do not smuggle a
new authority field into the Presentation Control Map, which is supposed to be a
derived explanation rather than a lifecycle selector. [state authorization shape](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/state/state.mjs:652)
[schema plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/page-image-presentation-schema.md:215)

## Data Exposure: Existing Timing and a Critical Boundary

The existing provider-input inspection is generated during `image2 plan`, after
the source/raw plan and progressive plan exist, and before any authorization or
provider submission. It is therefore the correct timing anchor for the proposed
Pre-Production Data View. [Framed publication](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/index.mjs:1151)
[target runtime](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:277)

There is one design trap: the current inspection sidecar stores the canonical
request JSON under `prompt`, while the Human Navigation Path copies this file
into its browsing tree. The navigation specification prohibits raw prompt prose
in that tree. The new data view should therefore be an independent,
per-page, provider-free derived directory with direct inspectable files and a
separate control-map index. It must not be copied wholesale into the short
navigation tree or used as a selector/authorization input. [target runtime](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:326)
[artifact-view builder](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/ppt_flow.mjs:2584)
[image generation spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-generation/spec.md:455)

This is still incremental work, not a new lifecycle:

1. Reuse the current parsed receipt and exact provider request as inputs.
2. Add a resolver-owned `Resolved Page Presentation` projection plus selected
   digest.
3. Publish each page's source receipt projection, resolved projection, provider
   controller JSON, and, for Framed, a sanitized deterministic header-controller
   HTML projection.
4. Publish a deck-level Control Map that points to those files and explains
   Deck Baseline, Page Class Profile, and Page Source impact.
5. Keep all of them derived, rebuildable, and non-authoritative.

That approach matches the schema plan's stated intent and preserves the current
rule that an inspection projection cannot authorize, select, or replace a plan.
[schema plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/page-image-presentation-schema.md:203)
[target runtime](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:277)

## Dependencies: Valid Versus Overly Rigid

### Dependencies that should stay ordered

1. **Restore the Framed workflow test baseline before semantic change.** The
   active `test_framed_workflow.mjs` still imports retired Text Frame APIs and
   creates retired `VISUAL SCENE` / text-free source fixtures, so it cannot
   protect a new protected-composition contract. [stale test](/Users/bowhead/ai_tool_ppt_maker/tests/03-framed-image/test_framed_workflow.mjs:13)
   [stale test](/Users/bowhead/ai_tool_ppt_maker/tests/03-framed-image/test_framed_workflow.mjs:104)

2. **Settle shared schema before class-aware adapter implementation.** A
   `PAGE CLASS` added only to Markdown would not survive Core or raw binding;
   the schema plan correctly requires receipt, Core, selected projection, and
   invalidation semantics. [schema plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/page-image-presentation-schema.md:81)

3. **Land the selected protected-composition contract before synthetic
   conformance, then conformance before v3.** Current review is bound to exact
   provider bytes and a deterministic Framed composite, and `repair` routes
   back to raw rebuild rather than replaying old evidence. [image generation spec](/Users/bowhead/ai_tool_ppt_maker/openspec/specs/image-generation/spec.md:137)

### Dependencies that should be relaxed

1. **Provider capability discovery need not wait for all shared schema code.**
   Prepare a synthetic test page and provider capability matrix against today's
   closed `standard-v1` header while Phase 1 resolves schema topology. Do not
   finalize or ship class-aware semantics until that result is known.

2. **Task-Mandate runtime alignment need not wait for the presentation schema.**
   It is a controller/raw-owner concern, not a Page Class concern. Separating it
   prevents the user-facing repeated-confirmation problem from being hidden
   behind a long visual-system implementation.

3. **Do not make a friendly projection a new gate.** The current inspection is
   intentionally diagnostic-only; any missing/stale data-view policy should
   publish/rebuild from the canonical inputs, not demand a new human approval
   checkpoint. [target runtime](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_target_runtime.mjs:277)
   [simple reliable control policy](/Users/bowhead/ai_tool_ppt_maker/openspec/policies/simple-reliable-control.md:69)

## Likely Migration and Test Blast Radius

Migration is substantial but bounded. It should be split into a shared
presentation-system change and a Framed hardening change, as the active plans
already propose; neither plan is itself an active change. [_backlog plan convention](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/README.md:14)

| Area | What changes | Primary regression coverage to add or repair |
| --- | --- | --- |
| Source and receipt | Add closed `PAGE CLASS`, normalize missing value to `standard`, retire/migrate Framed `FRAME PRESET` without allowing per-slide workflow. [source parser](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs:626) | `tests/01-content/test_page_authority_source.mjs`; current test only asserts the old preset. [source test](/Users/bowhead/ai_tool_ppt_maker/tests/01-content/test_page_authority_source.mjs:120) |
| Shared semantics | Carry class, selected profile digest, and subject restrictions through Core/bindings; ensure sibling workflow facts cannot leak. [Page Image Core](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/page-image/page_image_core.mjs:208) | `tests/shared/page-image/test_page_image_core.mjs`, `test_page_image_invalidation.mjs`, and focused Pure/Framed adapter tests. |
| Version configuration | Add a new shared resolver/source rather than extend Pure-only YAML; seed it and honor the normal backbone/override ownership boundary. [bundle layout](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs:225) | `tests/02-visual-system/test_pure_deck_visual_system.mjs` plus new resolver/migration tests, including unselected-profile non-invalidation. |
| Framed compilation | Replace the sole code-only preset ingress with resolved Header Profile data; normalize protected composition, retain restrictions, and make compiled input/binding drift force raw rebuild. [Framed adapter](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/index.mjs:780) | Repair `tests/03-framed-image/test_framed_workflow.mjs`, then add parsed-source-to-exact-request, coordinate semantics, restriction, and transport tests. |
| Pre-production data | Add paths/writers and a non-authoritative control map without conflating it with Human Navigation or raw-owner authority. [page image paths](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs:37) | New path/schema tests; retain `test_complete_page_review.mjs` so data publication cannot make a second acceptance state. |
| Controller policy | Align routine batch actions with a Task Mandate while retaining exact grants, attempt reconciliation, and actual quality decisions. [progressive raw owner](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs:1189) | `tests/shared/image2/test_progressive_raw_owner.mjs`, workflow-inspection/task-projection tests, CLI diagnostic tests, and mock journey coverage. |

Local verification during this research:

- `tests/01-content/test_page_authority_source.mjs`: 10 passed.
- `tests/shared/page-image/test_page_image_core.mjs`,
  `test_page_image_invalidation.mjs`,
  `tests/02-visual-system/test_pure_deck_visual_system.mjs`,
  `tests/03-framed-image/test_framed_render_contract.mjs`,
  `test_framed_review_contribution.mjs`, and
  `tests/shared/image2/test_complete_page_review.mjs`: 32 passed.
- `tests/shared/image2/test_progressive_raw_owner.mjs`: 28 passed.
- `tests/03-framed-image/test_framed_workflow.mjs`: 5 passed, 11 failed. The
  failure is pre-existing stale fixture/API debt, visible in its retired imports
  and source grammar above; it is not evidence against the proposed design.

## Minimum Viable First Delivery

Do this before building the full Page Presentation System. It materially lowers
v3 collision risk without pretending that Page Class topology is already known:

1. Create an OpenSpec change for **Framed protected-composition baseline**.
   First repair the stale `test_framed_workflow.mjs` fixtures and restore its
   green baseline.
2. Add red/green tests from parsed current Framed source to exact compiled
   input: `subject_restrictions` survives; protected composition has normalized
   geometry, named coordinate semantics, and a body-safe region; changing any
   one changes the bound input and requires raw rebuild.
3. Implement only those facts using the existing `standard-v1` profile. Do not
   add `PAGE CLASS`, title-only profiles, a universal layout tree, or a second
   renderer in this delivery.
4. Prepare and run a bounded synthetic probe against the selected provider using
   that exact contract. Record whether it has a real primitive or only
   best-effort compliance. The result selects the honest Framed promise.
5. Preserve the existing single Complete Page Review and route the current v3
   to `repair` only through canonical source/rebuild lineage after the probe is
   understood.

This delivery does not promise that prompt wording alone prevents all overlap.
It removes the current known data-loss and ambiguous-coordinate defects, makes
the request inspectable, and turns the provider limitation into evidence before
the larger Page Class migration begins. The present Framed plan already names
the same semantic seam and correctly keeps local body rendering out of scope.
[Framed plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/framed-provider-protected-composition.md:254)

## Recommendation

Proceed, but revise the execution order before opening implementation changes:

```text
0.5 Restore Framed workflow baseline and add current-contract red tests
      |\
      | \-- P: prepare/provider-capability probe with existing standard-v1
      v
1. Settle shared Page Presentation schema and data-view topology
      |\
      | \-- A: align Task Mandate policy with raw-owner/Controller runtime
      v
2. Land the shared presentation resolver, selected projections, and data view
      v
3. Land the provider-selected Framed hardening contract
      v
4. Synthetic conformance, then canonical v3 repair/rebuild/review
```

Keep the plan's hard boundaries: exact version identity, immutable submitted
bytes, owner-written state/evidence, no hand edits under `_generated/`, and one
Complete Page Review. Relax only the *conversation-level repetition* around
normal work covered by a Task Mandate. This yields the flexible human refinement
loop the plan wants while preserving the evidence and recovery mechanisms that
make a repaired v3 trustworthy. [progressive plan](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/page-image-progressive-plan.md:54)
[human-centered control policy](/Users/bowhead/ai_tool_ppt_maker/openspec/policies/human-centered-gates.md:28)
