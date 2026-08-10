# Plan: Framed provider protected-composition hardening

> Type: investigation and design | Updated: 2026-08-11 | Status: **active**
>
> Now owned by change **C6** of
> [schema-first-page-image-recovery.md](schema-first-page-image-recovery.md).
> Its diagnosis, provider-surface findings, and repair semantics carry forward
> unchanged. Two adjustments: schema identifiers lose their `-vN` suffixes, and
> the "Page Class from the linked page-schema plan" dependency now points at
> change C4 rather than the withdrawn presentation-system phase.

> This work package owns the Framed-specific diagnosis, provider capability,
> protection semantics, and v3 repair path; it does not own shared schema design.

## Background / Current State

`deck_dark_factory_current/3_versions/v3` is a current
`page-image-workflow-v1` Framed run. Its complete-page review for raw plan
`d179342d` shows a severe header collision on all three slides. The current
review has not been accepted: its v3 state has no accepted raw evidence, final
manifest, or delivery receipt. It must not proceed to delivery.

This is a Harness-maintenance problem, not a run-bundle hand-edit problem.
`_generated/` remains rebuildable evidence and will not be repaired in place.

### Decisions settled during design grilling

1. The current Work Version, not historical or future versions, is the design
   boundary. All of its pages must use the same version-owned design system;
   another version may learn from it but is not required to inherit it.
2. Framed exists to make its header deterministic. Kicker, title, and subtitle
   occupy a Reserved Header Region that provider-rendered body text and key
   subjects must not enter. This is stronger than the current prompt-only
   `Protected Zone` term.
3. A current version needs a closed Header Profile Set rather than one
   universal profile. The initial Page Classes are `standard`, `opening`,
   `transition`, and `closing`; each class can select a different fixed
   Reserved Header Region and header treatment.
4. Page Class is a canonical, workflow-neutral source fact. It is shared by
   Framed and Pure: Framed maps it to Header Profile; Pure consumes the same
   class through its whole-page visual system. It must not be introduced as a
   Framed-only source field.
5. A human owns the choice of Page Class before provider work. A review must
   not invent an unplanned class or silently modify geometry after generation.
6. `standard` is the canonical source default. `opening`, `transition`, and
   `closing` are explicit source selections, shared unchanged by Framed and
   Pure.
7. A Framed Header Profile declares its fixed allowed set of kicker, title,
   and subtitle. A special Page Class may therefore be title-only, but a slide
   cannot add, remove, or reposition a header field ad hoc.
8. An owner may redirect a page to another existing named Page Class, but only
   by changing canonical source before provider work. That redirect recompiles
   the provider input, rebuilds raw work, and requires a new Complete Page
   Review; a reviewer cannot `proceed` the already-violating output by applying
   an after-the-fact layout override.
9. Q8 (the concrete page-definition and profile-data schema) is deliberately
   removed from this repair plan. Research established that it is a cross-
   workflow domain-model problem, not a Framed configuration detail. Its
   evidence and unresolved design choices now live in
   [`page-image-presentation-schema.md`](page-image-presentation-schema.md).
   This plan must consume the accepted outcome of that plan; it must not create
   a private `FRAME PRESET` extension or repurpose Pure configuration.
10. Before any paid production, a human must be able to inspect the resolved
    page configuration and its controller projections. Framed exposes the
    Image2 JSON projection and the deterministic local Header HTML projection;
    both derive from and bind the same canonical page facts. The linked schema
    plan owns this observability contract.

The linked schema plan contains the Q2-Q13 decision ledger and the settled
configuration tree, source path, migration, and controller-artifact contract.
This plan consumes those shared facts; it does not reinterpret them as a
provider guarantee or reopen them in a private Framed configuration path.

Still to decide here: the provider capability result and the exact compiled
protected-region semantics. The page-schema ownership decision is intentionally
deferred to the linked plan before this plan proposes protected-composition
implementation. The current-contract test-baseline repair completed as
Progressive Phase 0.5 without defining Page Class or Header Profile semantics.

### Reproduced symptom

The provider pages already contain readable typography in the rectangle used by
the deterministic local header. The complete-page compositor then correctly
draws the local header over the same pixels.

| Slide | Provider-page evidence in local header area | Complete-page result |
| --- | --- | --- |
| `DkfGo` | Repeats the title beginning with `The` | Duplicate title treatment |
| `TwoMet` | Both metrics and supporting copy begin at native y=238-436 | Header title and subtitle overlay body text |
| `PlatGo` | `Platform team`, labels, and callout occupy native y=141-447 | Header title overlays labels and callout |

The read-only OCR loop was run twice against
`v3/_generated/page_image_workflow/review/complete-page/d179342d/provider-page`.
Both runs failed for all three pages. It maps the local CSS header rectangle to
the provider's native 2048x1136 result and finds high-confidence expected
provider words inside that rectangle. The loop is deterministic for captured
evidence and completes in about two seconds; it is the current red-capable
reproduction signal.

## Confirmed Findings

### 1. The collision precedes local composition

The Framed compositor places the verified provider PNG full-canvas with
`object-fit: fill`, no clipping, no transform, and then adds its transparent
three-field header overlay. The native provider page therefore reaches the
complete page intact. Local rendering is behaving as designed; it cannot
remove a provider's text without violating the transparent-overlay contract.

Relevant code:

- `ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs`
- `ppt_maker_harness/scripts/03-framed-image/internal/header_overlay.mjs`

### 2. The actual provider input is internally contradictory and underspecified

`compileFramedProviderInput` sends one JSON prompt which says to render a
"complete premium keynote provider page" and render every body item as
readable page typography. The same input merely says to avoid text and key
subjects in `protected_geometry`.

The geometry sent to the provider is `{ x: 40, y: 28, width: 920, height:
238 }`, but no canvas, unit, coordinate-space, or normalized body-safe region
is included in that compiled input. Those values are CSS coordinates in a
1000x562.5 local canvas. The local renderer maps them to approximately
`(80,56)-(1920,532)` on final 2000x1125 output, while this provider returned
2048x1136. A model cannot reliably infer that conversion from the opaque
numbers.

The compiled prompt also exposes the exact header literals as
`context_not_to_render`. `DkfGo` demonstrates that negative wording does not
prevent an image model from imitating those literals.

The shared transport submits those exact compiled bytes unchanged, as it
should. The fault is in the Framed adapter's input semantics, not transport
rewriting.

### 3. Subject restrictions disappear between receipt and provider input

The source parser records `subject_restrictions`, including
`no-generic-metal-robot`. The Framed raw contract does not retain that field,
and the compiled provider input therefore cannot send it. This directly
explains the mechanical arms in `DkfGo` and `TwoMet`, despite the source and
Style Master rejecting that imagery.

### 4. The Style Master is insufficient as a hard layout constraint

The v3 Style Master asks for a clean top band, body in the lower two-thirds,
and no robotic arms. It is supplied as an image reference. The actual text
prompt has stronger competing instructions to create a complete typographic
page and lacks the source-level subject restriction. A reference image cannot
make a prompt-only spatial promise deterministic.

### 5. The existing review route is correct, but it is deliberately human

Complete Page Review binds the raw provider page and the production-equivalent
Framed composite, and then offers `proceed` or `repair`. It validates lineage,
not visual semantics. The current OpenSpec explicitly says review must not
create a competing automatic quality evaluator. The correct current v3
decision is `repair`; no source, state, receipt, or generated file should be
hand-edited.

### 6. Baseline tests do not currently protect this behavior

The following targeted run was observed:

```sh
npx vitest run tests/03-framed-image/test_framed_workflow.mjs \
  tests/03-framed-image/test_framed_render_contract.mjs \
  tests/03-framed-image/test_framed_review_contribution.mjs \
  tests/01-content/test_page_authority_source.mjs
```

Historical result before Progressive Phase 0.5: 26 passed, 11 failed. Those
failures came from retired Text Frame / `VISUAL SCENE` APIs and old source
grammar, not the current Framed contract. The completed
`restore-framed-contract-baseline` change now restores 16 passing executable
workflow tests, keeps three named `it.todo` cases for the known semantic gaps,
and adds an exact parsed-source -> adapter request -> shared transport seam.
The pending cases deliberately do not claim that current provider input has a
normalized protected region, a body-safe region, or retained source subject
restrictions.

## Constraints From Current Specifications

- Framed has exactly one local renderer: kicker, title, and subtitle. Provider
  body/labels/metrics/callouts remain provider-rendered.
- **Target constraint, not current behavior:** Page Class belongs to canonical
  source and Page Image Core. Framed and Pure may project it differently, but
  neither workflow owns a private page-class vocabulary. Current source has no
  such field, so this constraint depends on the linked page-schema plan.
- The protected area is a composition constraint, not an opaque local panel or
  a generic local body renderer.
- Adapter-owned compiled bytes are immutable, bound into raw lineage, and sent
  unchanged by shared transport.
- A change to provider input, protected geometry, visual constraints, or
  header policy invalidates raw work. Existing v3 bytes cannot be re-used as
  accepted evidence.
- Complete Page Review remains one human `proceed | repair` decision. Any
  automated analysis must be advisory evidence or an owner-defined validation
  before acceptance, never a second approval state.

Primary specifications to change or reconfirm:

- `openspec/specs/image-generation/spec.md`
- `openspec/specs/content-parsing/spec.md`
- `openspec/specs/harness-charter/spec.md`
- potentially `openspec/specs/run-bundle-layout/spec.md` if review evidence
  gains a typed advisory diagnostic artifact.

## Decision Required Before Protected-Composition Semantics

The local endpoint/model is recorded as `gpt-image-2`; its documented support
for masks, layout guides, or protected regions has not been established. An
official OpenAI documentation fetch was attempted for image generation but
returned HTTP 403 in this environment, and this endpoint cannot be assumed to
implement an official OpenAI mask contract.

Track P may prepare the synthetic Framed stress page and provider-surface
record using the current `standard-v1` fixture. A paid capability probe occurs
only after Track A has aligned the Task Mandate with the exact-grant runtime:
the Agent then creates the same exact plan/batch grant, scope, cost, and
provenance records without asking the human to replay a routine approval.
Record only safe capability facts, not credentials or provider bodies.

Choose the implementation path from its result:

1. **Provider supports a real protected-region primitive (preferred):** bind a
   native or normalized region/template/mask into the Framed request. The
   provider must receive an unambiguous coordinate system and body-safe region.
   Keep the local overlay transparent.
2. **Provider does not support a real protected-region primitive:** do not
   represent prompt wording as a hard Framed guarantee. Either constrain
   Framed to an explicitly review-driven best-effort composition or design a
   new deterministic layout owner for all non-header typography. The latter is
   a larger workflow/specification change; it cannot be smuggled into the
   private header renderer.

Prompt-only strengthening may improve samples but proves only bounded empirical
best effort. It cannot guarantee placement or stop literal imitation. A native
primitive is not considered available until both the provider endpoint contract
and a bounded result are verified; because current Harness transport exposes
no mask/region field, that result also opens a narrow transport-change task.

## Proposed Protected-Composition OpenSpec Change

After the shared schema and provider-path decisions are accepted, create one
OpenSpec change named `harden-framed-provider-protected-composition`. It must
update specs before implementation and retain the current ownership boundaries.
The completed smaller current-contract baseline change is intentionally
separate.

### Progressive Phase 0.5: Completed current-test baseline and compilation seam

`restore-framed-contract-baseline` repaired current-contract coverage only; it
did not introduce Page Class, Header Profile storage, or a new provider
capability claim.

1. Replaced stale fixtures and removed API imports in
   `tests/03-framed-image/test_framed_workflow.mjs` with current
   `page-image-workflow-v1` Framed source.
2. Added a focused Framed adapter test from parsed source through the bound
   compiled provider input to shared transport; the fake provider receives the
   exact adapter-owned bytes.
3. Recorded three named pending tests for the confirmed omissions: missing
   coordinate-space/canvas facts, absence of a normalized body-safe region,
   and loss of `subject_restrictions`. They remain `it.todo` until runtime and
   specifications change; a permanently red baseline would not be useful.
4. The protected-composition change must add the actual contract-shape and
   invalidation tests: a protected-region or subject-restriction change changes
   the compiled-input digest and routes to raw rebuild, never local refresh.
5. After the linked page-schema plan has an accepted model, add only the
   Framed-specific integration coverage that proves the selected canonical
   class reaches the chosen local Header Profile. Cross-workflow source/Core
   schema tests belong to that plan's implementation change.

### Phase 2: Specify and implement selected protected-region semantics

1. Extend the Framed raw contract with one closed, typed protected-composition
   field. Express it in normalized coordinates so non-default provider image
   dimensions remain valid. Derive it from the closed header preset; do not
   accept slide-authored coordinates.
2. Compile provider-facing instructions from that field with explicit canvas
   semantics, a body-safe region, and non-overlap requirements for readable
   body text and key subjects. Preserve the existing full-canvas provider-page
   behavior and transparent overlay.
3. Propagate source `subject_restrictions` through Page Image Core/Framed raw
   contract into the selected provider request. Validate the closed enum at
   every boundary.
4. Consume the closed, workflow-neutral Page Class fact and Framed Header
   Profile projection defined by the linked page-schema plan. Do not define
   those source fields or their shared configuration root in this change.
5. Update the Header Rendering Policy specification for whatever replaces or
   narrows exact literal `context_not_to_render`. Do not leave literal header
   exposure as an untested negative prompt requirement.
6. Keep all provider prompt semantics in the Framed adapter; shared transport
   remains opaque and unchanged unless Phase 3 selected a verified native
   primitive. In that case, implement only its narrowly specified transport
   extension and prove the adapter's bound exact bytes reach it unchanged.

### Phase 3: Deterministic contract proof and empirical quality evidence

1. Preserve the existing single Complete Page Review decision and its exact
   raw/composite binding.
2. Add a non-authoritative review diagnostic only if it can be deterministic,
   provider-free, and has a defined false-positive policy. It may flag a
   suspected occupied protected area, but must not silently decide `repair` or
   create another acceptance state.
3. Do not make OCR a mandatory Harness production dependency until its fonts,
   language support, deterministic output, and false-positive behavior are
   specified. The captured v3 OCR loop is diagnostic evidence, not yet a
   portable product validator.
4. Retain human inspection of both raw and composite pages, especially for
   provider compliance that raster-only code cannot prove.
5. Keep deterministic proof separate from empirical evidence: tests can prove
   Header Profile geometry, normalized body-safe instructions, exact bindings,
   and local composition, but not where a provider placed rasterized text.

### Phase 4: Verification and controlled production restart

1. Run focused adapter/parser/review tests, architecture validation, then the
   complete repository regression suite.
2. After Track A is landed, run the synthetic Framed stress-page probe at least
   three times under the active Task Mandate. Each submission retains its exact
   grant, scope, cost, and lineage automatically. The empirical rubric is: no
   header literal or readable provider body text in the normalized protected
   area; no forbidden subject; source body is wholly in the defined body-safe
   region; and the local composite remains legible.
3. Only after this conformance check passes, record `repair` for v3's current
   Complete Page Review through its owner-issued action, replan from current
   source/Style Master, and seek a new authorization for v3 raw generation.
4. Inspect the new v3 provider and complete pages before `proceed`. No prior
   raw page, authorization, or acceptance may be copied forward.

## Risks / Trade-offs

- **Image models may not honor text prompts as spatial constraints** -> do not
  claim a hard guarantee without a verified provider primitive; retain review
  and use the capability gate.
- **A fixed 2000x1125 coordinate system will fail for valid non-default media**
  -> use normalized geometry and convert only at the provider-specific edge.
- **Removing header literals from model context changes existing Framed
  invalidation semantics** -> make this an explicit OpenSpec decision and bind
  the replacement semantic field into raw-plan digests.
- **Automated OCR can be noisy and host-dependent** -> keep it advisory until a
  deterministic, maintained implementation is proven.
- **Repairing stale workflow tests expands scope** -> treat baseline restoration
  as a prerequisite, not an unrelated cleanup; the new behavior otherwise has
  no credible regression coverage.
- **Provider capability probing costs money and produces nondeterministic
  output** -> cap it to the stated synthetic sample count and require Track A's
  Task-Mandate runtime alignment before the first paid submission.

## Out of Scope

- Hand-editing v3 `_generated/`, state, receipts, or review records.
- Accepting the current v3 Complete Page Review or producing PPTX/delivery
  from it.
- Adding a local body/callout renderer without a separate explicit workflow
  design decision.
- Assuming masks or an official provider capability without a successful
  provider-specific probe.
- Designing, naming, or placing the shared Page Class and presentation-system
  schema; that is the explicit predecessor plan.

## Landing Association

This plan is not an active change. Its current-contract baseline repair is
complete as the small Progressive Phase 0.5 OpenSpec change; its
protected-composition implementation cannot begin until the shared
presentation-system change has landed the source/Core/config ownership it
consumes and its provider capability gate is answered. The now-settled schema
plan is the design input for
`openspec/changes/harden-framed-provider-protected-composition/`. The plan is
closed only after that change has landed, the conformance evidence is recorded,
and the v3 repair path has completed a new human review.
