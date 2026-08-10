# Progressive Plan: Page Image Composition Recovery

> Type: progressive coordination plan | Updated: 2026-08-10 | Status: active

## Purpose

This is the one ordered checklist for restoring trustworthy Page Image
production. It coordinates, but does not replace, the two specialist plans:

| Work package | Owns | Must finish before |
| --- | --- | --- |
| [Page Image presentation schema recovery](page-image-presentation-schema.md) | Page Class, Page Presentation System, data exposure, bindings, and migration design | any implementation that consumes Header Profiles or per-page controller projections |
| [Framed provider protected-composition hardening](framed-provider-protected-composition.md) | Framed collision cause, provider-capability decision, protected-composition semantics, review preservation, and v3 recovery | raw generation for the repaired current v3 |

This plan is not an OpenSpec change, provider authorization, or permission to
modify `deck_dark_factory_current/3_versions/v3`. A checked item means its
named evidence or decision exists; it does not silently authorize the next
human-owned gate.

## Ordered Route

```text
0. Confirmed baseline
        |
        v
1. Settle shared presentation schema
        |
     Gate A: human accepts the schema design
        |
        v
2. Land the shared presentation system in Harness
        |
     Gate B: source, resolver, bindings, and data view are real and tested
        |
        v
3. Probe the selected provider's protected-region capability
        |
     Gate C: native primitive / bounded best-effort / new workflow decision
        |
        v
4. Land Framed protected-composition hardening
        |
     Gate D: deterministic tests and review contract pass
        |
        v
5. Run synthetic Framed conformance evidence
        |
     Gate E: human accepts evidence to re-enter v3
        |
        v
6. Repair and resume the current v3 through normal ownership gates
```

Only one numbered phase may be active at a time. A failed gate returns to the
owning earlier phase; it never bypasses the missing decision by hand-editing a
generated artifact or strengthening an unverified prompt.

## Non-Negotiable Rules

- The current Work Version remains the design boundary and has exactly one
  selected workflow, `framed` or `pure`.
- `standard`, `opening`, `transition`, and `closing` are the initial closed
  Page Class catalog; a human redirects a page only through canonical source.
- Framed owns only deterministic kicker, title, and subtitle rendering. Body,
  labels, metrics, diagrams, quotes, and callouts remain provider-rendered.
- `_generated/`, receipts, review records, and state are never hand-edited.
- A provider avoidance instruction is not a collision guarantee. A provider
  capability result and human Complete Page Review remain required.
- No task may convert a target-model term or a candidate schema topology into
  an implemented fact before its owning decision gate is checked.

## Progress Board

### 0. Confirmed Baseline

- [x] Reproduce and explain the v3 collision as provider-page content entering
  the Framed local header area before local composition.
- [x] Establish that current v3 has no accepted raw evidence, final manifest,
  or delivery receipt and therefore cannot proceed.
- [x] Separate the cross-workflow Page Class/data-model problem from the
  Framed-specific collision repair.
- [x] Record Q2-Q13 decisions and explicit unresolved schema questions in the
  schema work package without inventing the unavailable Q1 record.
- [x] Align the durable glossary in `CONTEXT.md`, including the distinction
  among Reserved Header Region, Provider Avoidance Constraint, Header Profile,
  Controller Projection, and Compiled Provider Input.

**Exit evidence:** the two specialist plans and `CONTEXT.md` describe the
same ownership model. This phase is complete.

### 1. Settle Shared Presentation Schema

**Owner:** `page-image-presentation-schema.md`  
**Entry:** Phase 0 complete.  
**Output:** an accepted, implementation-ready schema design, not code.

- [ ] Choose and document the final version-level configuration topology,
  filename, and owned path; decide class-first versus workflow-first rather
  than leaving both as plausible examples.
- [ ] Define the exact closed fields and inheritance rules for Deck Baseline,
  Pure Page Class Profiles, Framed Page Class Profiles, and Header Profiles.
- [ ] Define canonical `PAGE CLASS` authoring syntax, normalization of the
  `standard` default, invalid source cases, and the retirement/migration rule
  for current `FRAME PRESET` and `pure-deck-visual-system.yaml` inputs.
- [ ] Define the receipt, Page Image Core, selected projection digest, raw
  contract, and invalidation semantics for class reassignment, selected and
  unselected profile edits, and workflow transitions.
- [ ] Define the exact Pre-Production Data View: independent per-page source,
  Resolved Page Presentation, Image2 JSON, and Framed Header HTML artifacts,
  plus the deck-level Presentation Control Map and its stale/missing behavior.
- [ ] Decide whether a structured Framed Header Controller JSON is needed in
  addition to the required Header HTML, and record the rationale.
- [ ] Walk the model through the four required examples: standard content,
  title-only Framed opening, Pure transition, and a human reclassified closing
  page; resolve every ambiguity found by those examples.
- [ ] Update the schema work package and `CONTEXT.md` with settled terms only,
  then obtain explicit human acceptance of the design.

### Gate A: Shared Schema Accepted

- [ ] The schema work package has no implementation-blocking topology, field,
  migration, projection, or invalidation question left open.
- [ ] A human has accepted the exact target model and its human-facing control
  surface.

**Failure route:** stay in Phase 1. Do not open an implementation change or
teach Framed a private substitute for the shared model.

### 2. Land the Shared Presentation System in Harness

**Owner:** a new dedicated OpenSpec change created only after Gate A.  
**Entry:** Gate A checked.  
**Output:** a tested, version-resolved presentation system usable by either
selected Page Image workflow.

- [ ] Create the dedicated OpenSpec change through `openspec new change`; its
  proposal, delta specs, design, and tasks must preserve the accepted schema
  and existing source-of-record boundaries.
- [ ] Implement canonical `PAGE CLASS` parsing, receipt/Core propagation, and
  selected-projection bindings without introducing a per-slide workflow choice.
- [ ] Implement the version-resolved presentation-system resolver with strict
  Pure/Framed projection isolation and selected-profile digest invalidation.
- [ ] Replace the current Framed-only preset ingress through the accepted
  migration path; retain explicit hard-stop behavior for unsupported legacy
  source/state pairs.
- [ ] Publish the Pre-Production Data View and Presentation Control Map from
  canonical source, resolved presentation, and adapter compilers only.
- [ ] Add focused unit, integration, and appropriate end-to-end coverage for
  source normalization, profile isolation, inheritance, data exposure, and
  selected-versus-unselected invalidation.
- [ ] Run the change's validation and repository regression suite, resolve
  failures, and archive the OpenSpec change only after its tasks are complete.

### Gate B: Shared Control Surface Is Real

- [ ] A current Framed or Pure version can expose its page class, resolved
  selected projection, and renderer controller inputs before authorization.
- [ ] A page cannot acquire a sibling-workflow fact, an arbitrary layout
  coordinate, or an unbound class/profile change.
- [ ] The changed Harness behavior is specified, tested, and landed rather than
  existing only in a plan or glossary.

**Failure route:** return to the owning OpenSpec task in Phase 2.

### 3. Establish Provider Protected-Region Capability

**Owner:** `framed-provider-protected-composition.md`  
**Entry:** Gate B checked.  
**Output:** an evidence-backed provider capability decision, not a prompt
assumption.

- [ ] Define one synthetic Framed stress page from the landed Header Profile
  and normalized Reserved Header Region, including the exact success rubric.
- [ ] Present the provider submission count and cost boundary, then obtain an
  explicit human authorization for the bounded capability probe.
- [ ] Execute only the authorized probe, retain safe capability facts and
  evidence, and do not expose credentials or provider bodies.
- [ ] Record one selected result: a verified protected-region primitive,
  explicitly bounded best-effort composition, or the need for a separate
  deterministic body-layout workflow decision.
- [ ] Update the Framed work package with the result and the path it enables;
  do not describe prompt wording as a hard spatial guarantee.

### Gate C: Provider Path Chosen

- [ ] The provider mechanism and its known limits are recorded from evidence.
- [ ] The selected path has a compatible ownership model: transparent Framed
  header remains local, while provider body rendering remains provider-owned.

**Failure route:** if no sufficient provider primitive exists and bounded
best-effort Framed is not acceptable, open a separate workflow-design plan;
do not continue by adding local body rendering inside Framed.

### 4. Land Framed Protected-Composition Hardening

**Owner:** a new `harden-framed-provider-protected-composition` OpenSpec
change, refined by Gates A-C.  
**Entry:** Gates A, B, and C checked.  
**Output:** a tested Framed adapter with one selected, honest
protected-composition contract.

- [ ] Create the OpenSpec change and write its proposal, affected capability
  deltas, design, migration/invalidation treatment, and executable task list.
- [ ] Restore the stale Framed workflow test baseline and add a parsed-source
  to bound-provider-input compilation seam before changing semantics.
- [ ] Implement the selected normalized protected-composition contract with
  explicit coordinate/canvas semantics and a defined body-safe region.
- [ ] Preserve `subject_restrictions` through Source Receipt, Page Image Core,
  Framed raw contract, and compiled provider input; validate its closed form at
  each boundary.
- [ ] Consume the landed Page Class and Header Profile projection without
  creating a private `FRAME PRESET` extension or leaking Framed geometry into
  Pure.
- [ ] Preserve exactly one Complete Page Review decision; any occupied-region
  diagnostic is provider-free, advisory, deterministic, and never a competing
  acceptance state.
- [ ] Add contract, binding, invalidation, review, and transport tests proving
  that changed provider semantics force raw rebuild and exact adapter bytes
  reach the shared transport unchanged.
- [ ] Validate and archive the change only when all approved tasks and the
  repository regression suite pass.

### Gate D: Framed Contract Is Ready for Conformance Evidence

- [ ] The selected provider path is fully specified and implemented without a
  false collision guarantee.
- [ ] The complete-page raw/composite review contract and Content Authority
  boundaries remain intact.
- [ ] Focused and full regression evidence is current.

**Failure route:** return to Phase 4. Do not use v3 as the first experiment.

### 5. Produce Synthetic Conformance Evidence

**Owner:** human authorization plus the landed Harness.  
**Entry:** Gate D checked.  
**Output:** controlled evidence that the new Framed contract works before it
touches the current Deck.

- [ ] Disclose a fresh, bounded cost and obtain explicit human authorization
  for at least three synthetic Framed stress-page submissions.
- [ ] Generate the authorized samples through the normal compiled-input and
  evidence path.
- [ ] Inspect provider pages and Production-Equivalent Composites against the
  accepted rubric: no header literal or readable provider body text in the
  protected region, no forbidden subject, source body in the body-safe region,
  and a legible composite.
- [ ] Record the evidence and human conclusion. A failure routes to Phase 4;
  it is not repaired by silently lowering the rubric.

### Gate E: v3 Re-entry Authorized

- [ ] A human accepts the synthetic conformance evidence as sufficient to use
  the repaired Harness for the current v3.

**Failure route:** Phase 4 or, if the provider limitation changes ownership,
a separately approved workflow-design plan.

### 6. Repair and Resume Current v3

**Owner:** current v3's human/Agent/Harness ownership path.  
**Entry:** Gate E checked.  
**Output:** a new, reviewable v3 raw lineage; never a patched copy of the old
one.

- [ ] Record `repair` for the current Complete Page Review through its
  owner-issued action, preserving historical evidence without accepting it.
- [ ] Update only canonical v3 source and accepted version configuration,
  including any human Page Class selection; do not edit `_generated/` data,
  receipts, state, or review artifacts.
- [ ] Re-establish the current source, Style Master, resolved presentation,
  controller projections, and exact raw plan through the normal pipeline.
- [ ] Obtain a new explicit provider authorization for the exact rebuilt v3
  plan, then generate only within that authorization's scope.
- [ ] Inspect the new provider page and Production-Equivalent Composite in one
  Complete Page Review, then record the human `proceed` or `repair` decision.
- [ ] Continue to final/delivery work only after `proceed`; a v3-specific
  repair returns to this phase, while an invariant failure returns to Phase 4.

## Definition of Done

This progressive plan is complete only when the shared presentation-system
change and the Framed hardening change are both landed, synthetic conformance
evidence has passed human review, and current v3 has a new exact Complete Page
Review decision from rebuilt lineage. It does not require a delivery receipt;
delivery remains its own downstream ownership path after `proceed`.

## Update Protocol

When work advances, check only the task with its evidence available, update the
owning specialist plan with the detailed finding, and then update this plan's
gate status. If a new decision changes ordering or ownership, revise this
master plan before starting the affected downstream task.
