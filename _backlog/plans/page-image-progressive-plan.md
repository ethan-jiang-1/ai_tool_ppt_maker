# Progressive Plan: Page Image Composition Recovery

> Type: progressive coordination plan | Updated: 2026-08-10 | Status: active

## Purpose

This is the one ordered checklist for restoring trustworthy Page Image
production. It coordinates, but does not replace, the two specialist plans:

| Work package | Owns | Must finish before |
| --- | --- | --- |
| [Page Image presentation schema recovery](page-image-presentation-schema.md) | Page Class, Page Presentation System, data exposure, bindings, and migration design | any implementation that consumes Header Profiles or per-page controller projections |
| [Framed provider protected-composition hardening](framed-provider-protected-composition.md) | Framed collision cause, provider-capability decision, protected-composition semantics, review preservation, and v3 recovery | raw generation for the repaired current v3 |

This plan is not an OpenSpec change or a second Task Mandate for
`deck_dark_factory_current/3_versions/v3`. A checked item means its named
evidence or decision exists; it does not expand the human's stated goal or
choose a genuinely new content or design direction.

The feasibility review is part of this plan's evidence, not a third work
package: [page-image-progressive-plan-feasibility-research.md](page-image-progressive-plan-feasibility-research.md).
It found a usable foundation, but also four execution corrections: restore the
stale Framed regression suite before semantic work, publish the data view from
`image2 plan` rather than from `artifact-view`, distinguish deterministic
contract proof from empirical provider evidence, and implement the Task
Mandate UX in the runtime instead of merely describing it in policy prose.

## Ordered Route

```text
0. Confirmed baseline
        |
        v
0.5 Restore Framed current-contract test baseline
        |
        +--> A. Align Task Mandate with exact-grant runtime (parallel track)
        |
        +--> P. Prepare provider capability discovery (parallel track)
        |
        v
1. Settle shared presentation schema
        |
     Guided Checkpoint A: schema design is ready for a human decision
        |
        v
2A. Land shared presentation semantics in Harness
        |
     Guided Checkpoint B1: source, resolver, and bindings are real
        |
        v
2B. Publish the Pre-Production Data View
        |
     Guided Checkpoint B: control artifacts are real and safe to inspect
        |
        v
3. Select the provider protected-composition path
        |
     Guided Checkpoint C: evidence selects an honest provider path
        |
        v
4. Land Framed protected-composition hardening
        |
     Guided Checkpoint D: deterministic tests and review contract pass
        |
        v
5. Run synthetic Framed conformance evidence
        |
     Guided Checkpoint E: conformance evidence is ready to resume v3
        |
        v
6. Repair and resume the current v3 through the normal ownership flow
```

One phase owns the next irreversible action at a time. The Agent may continue
read-only diagnosis, examples, document updates, and projection work in an
earlier phase whenever that helps a human refine the Deck; it must not advance
a downstream irreversible action before its checkpoint has enough evidence.

Tracks `A` and `P` are deliberately narrow exceptions to the serial route:
they may prepare or land their own isolated work while the main line is in
Phase 1 or 2, but neither changes Page Class semantics, authorizes an
unreviewed provider path, or lets v3 resume early. Track `A` must finish before
the first paid synthetic or v3 submission if the stated no-repeated-prompt UX
is to be true. Track `P` may prepare its fixture and provider-surface record
early, but Phase 3 alone selects the production contract.

An unchecked Guided Checkpoint is a route selector, not a dead end. The Agent
must identify the missing fact, show the smallest useful next action, and do
safe preparatory work under the Task Mandate before asking the human for a
genuinely new consequential choice. It never bypasses a missing decision by
hand-editing a generated artifact or strengthening an unverified prompt.

## Agentic Refinement Loop

The human may give ordinary PPT feedback such as "this page is not working",
"the opening needs more presence", or "all standard pages feel too dense".
They do not need to name a field, Page Class, checkpoint, or rebuild path.
The Agent translates that feedback into the smallest applicable scope and
returns with evidence, options, and the next useful action.

| Human signal | Agent first response | Human is needed only for |
| --- | --- | --- |
| One page feels wrong | Inspect its source, resolved presentation, controller projections, and latest review; propose a Page Source or existing Page Class change | Content or visual judgment when alternatives materially differ |
| A repeated page type feels wrong | Show the affected Page Class Profile and its downstream pages; propose the smallest class-level adjustment | Choosing the intended shared treatment |
| The whole Deck feels inconsistent | Compare Deck Baseline, class profiles, and representative pages; explain the impact before changing shared rules | Accepting a deck-wide design direction |
| A Framed page collides or the provider ignores a constraint | Preserve evidence, diagnose the provider/composition path, and route to the owning technical phase | A new ownership trade-off or design direction outside the Task Mandate |

The Agent should keep the human in the creative loop, not turn the human into a
schema debugger. It owns navigation, impact analysis, safe mechanical work,
and clear repair proposals; the human owns content and genuinely new design
choices, while the Task Mandate covers normal provider work and process
execution.

## Non-Negotiable Rules

- The current Work Version remains the design boundary and has exactly one
  selected workflow, `framed` or `pure`.
- `standard`, `opening`, `transition`, and `closing` are the initial closed
  Page Class catalog; a human redirects a page only through canonical source.
- Framed owns only deterministic kicker, title, and subtitle rendering. Body,
  labels, metrics, diagrams, quotes, and callouts remain provider-rendered.
- `_generated/`, receipts, review records, and state are never hand-edited.
- A provider avoidance instruction is not a collision guarantee. A provider
  capability result and Complete Page Review remain required, while their
  evidence is assembled and recorded automatically under the Task Mandate.
- A Task Mandate changes who initiates routine work, not whether exact
  plan/batch grants, hashes, attempts, costs, and provenance exist. Those are
  Harness records; they must not become repeated human chores.
- The Pre-Production Data View is derived, rebuildable, and non-authoritative.
  It is published by `image2 plan`; it must not be used as a selector, an
  authorization input, or a raw-prompt copy inside the Human Navigation Path.
- A current `page-image-workflow-v1` version may receive an explicit source and
  configuration migration. Historical v2 source/state pairs retain their
  byte-preserving `unsupported-protocol/export` boundary.
- No task may convert a target-model term or a candidate schema topology into
  an implemented fact before its owning decision/checkpoint is satisfied.

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

### 0.5 Restore Framed Current-Contract Test Baseline

**Owner:** a small, dedicated OpenSpec change before either schema or Framed
semantic implementation.
**Entry:** Phase 0 complete.
**Output:** green current-Framed regression coverage and a parsed-source to
bound-provider-input test seam; no new provider promise and no v3 mutation.

- [x] Replace retired Text Frame imports, `VISUAL SCENE`, text-free clauses,
  and invalid receipt fixtures in `tests/03-framed-image/test_framed_workflow.mjs`
  with current `page-image-workflow-v1` Framed source.
- [x] Preserve the existing current behavior in the repaired fixtures, then
  prove the path from parsed source through Core/raw contract to the exact
  adapter-compiled provider input.
- [x] Record three focused pending (`it.todo`) cases for the known omissions:
  lost `subject_restrictions`, ambiguous protected-region coordinate semantics,
  and a missing body-safe region. They define the later Framed hardening work;
  they do not silently change the current provider promise.
- [x] Run the repaired focused suite together with the existing parser,
  render-contract, review-contribution, binding, and invalidation suites.

**Exit evidence (2026-08-10):** `restore-framed-contract-baseline` restores
16 passing workflow tests and retains three explicitly named `it.todo` cases;
the parser, Framed render/review, plan-lifecycle binding, Core, and
invalidation suites pass, as do strict OpenSpec validation and `npm test`.
The old 11 stale failures are gone. The three pending cases remain owned by
the later protected-composition change rather than being treated as current
provider promises.

### Track A: Align Task Mandate With Exact-Grant Runtime

**Owner:** a separately named, narrowly scoped OpenSpec change.
**Entry:** may start after Phase 0.5; independent of Page Class topology.
**Output:** the Agent can create routine exact grants under one active
in-scope Task Mandate without asking the human to replay `plan -> authorize ->
generate` for every batch.

- [ ] Define the durable Task Mandate reference and its scope boundary in the
  owning runtime; do not put it in the Presentation Control Map or a derived
  data view.
- [ ] Retain exact `plan_hash`, `batch_hash`, selected IDs, maximum
  submissions, attempt reconciliation, cost record, and provenance binding.
  The change is who triggers the grant, not a removal of the grant.
- [ ] Update the progressive raw owner, workflow inspection, MD Controller,
  CLI diagnostics, and focused tests together so routine in-scope work is not
  emitted as `requires_human: true`.
- [ ] Preserve the human-owned Complete Page Review `proceed | repair`
  decision and every identity/integrity hard-stop.

**Exit evidence:** a Task-Mandate-covered routine batch produces the same
exact grant and lineage as today without a repeat approval question; a new
goal, explicit limit, or new content/design direction still surfaces one
precise question.

### Track P: Prepare Provider Capability Discovery

**Owner:** `framed-provider-protected-composition.md`, using the current
`standard-v1` Header Profile only as a synthetic fixture.
**Entry:** may start after Phase 0.5 and run beside Phase 1.
**Output:** a bounded capability record ready for Phase 3, not an inferred
provider guarantee.

- [ ] Record the current actual transport surface: it presently submits model,
  prompt, size, and image references, not a mask or region parameter.
- [ ] Prepare one synthetic Framed stress page, rubric, result template, and
  safe evidence path from current fixed header geometry; never use v3 as the
  experiment.
- [ ] Separate provider-surface discovery from a prompt-only trial. A native
  primitive is not considered available until its endpoint contract and a
  bounded result are both verified.
- [ ] Defer a paid submission until Track A has made the active Task Mandate
  executable without a repeated prompt. Keep the resulting capability record
  provisional until Phase 3 binds it to the landed Header Profile.

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
- [ ] Define the explicit, owner-issued migration for the current v3
  `page-image-workflow-v1` source/configuration pair. The migration must create
  a new canonical source/configuration snapshot for resumed work, preserve the
  old pair byte-for-byte as historical evidence, and never infer a current
  protocol from an old state file.
- [ ] Define the receipt, Page Image Core, selected projection digest, raw
  contract, and invalidation semantics for class reassignment, selected and
  unselected profile edits, and workflow transitions.
- [ ] Define the exact Pre-Production Data View, published by `image2 plan`
  after source resolution and adapter compilation but before authorization or
  submission. It uses one dedicated, non-navigation derived root with
  independent per-page `source-receipt.json`,
  `resolved-presentation.json`, `image2-controller.json`, and, for Framed,
  `framed-header.html`, plus one deck-level
  `presentation-control-map.json` index. Define its source/plan binding and
  stale/missing rebuild behavior.
- [ ] Define the Human Navigation boundary: `artifact-view` may link to or
  summarize safe published control artifacts, but it neither creates the data
  view nor copies raw Image2 prompt prose into its navigation tree. The exact
  provider-input inspection remains the audit sidecar, outside that tree.
- [ ] Decide whether a structured Framed Header Controller JSON is needed in
  addition to the required Header HTML, and record the rationale.
- [ ] Walk the model through the four required examples: standard content,
  title-only Framed opening, Pure transition, and a human reclassified closing
  page; resolve every ambiguity found by those examples.
- [ ] Update the schema work package and `CONTEXT.md` with settled terms only,
  apply the human's available design direction, and isolate only any genuinely
  new consequential choice.

### Guided Checkpoint A: Shared Schema Ready

- [ ] The schema work package has no implementation-blocking topology, field,
  migration, projection, or invalidation question left open.
- [ ] The Agent has presented the exact target model and its human-facing
  control surface in a form a human can inspect and choose.
- [ ] Any remaining consequential schema/design choice is either already
  covered by the Task Mandate or presented as one precise question.

**When not ready:** the Agent narrows the unresolved question, prepares
concrete candidate shapes and page examples, and asks only for the specific
choice that changes ownership or behavior. It may continue safe design work,
but does not open an implementation change or teach Framed a private
substitute for the shared model.

### 2A. Land Shared Presentation Semantics in Harness

**Owner:** a new dedicated OpenSpec change created only after Guided Checkpoint A.
**Entry:** Guided Checkpoint A has enough evidence to advance.
**Output:** a tested, version-resolved presentation resolver and bound semantic
facts usable by either selected Page Image workflow. This phase does not yet
make a human-facing data view a lifecycle input.

- [ ] Create the dedicated OpenSpec change through `openspec new change`; its
  proposal, delta specs, design, and tasks must preserve the accepted schema
  and existing source-of-record boundaries.
- [ ] Implement canonical `PAGE CLASS` parsing, receipt/Core propagation, and
  selected-projection bindings without introducing a per-slide workflow choice.
- [ ] Implement the version-resolved presentation-system resolver with strict
  Pure/Framed projection isolation and selected-profile digest invalidation.
- [ ] Implement the accepted current-v3 source/configuration migration path.
  It must create the new canonical snapshot and preserve the original
  `page-image-workflow-v1` source/state pair as unsupported historical
  evidence; it must not silently mutate or reinterpret it.
- [ ] Replace the current Framed-only preset ingress through the accepted
  migration path, while retaining the explicit hard-stop for unsupported
  legacy source/state pairs.
- [ ] Add focused unit, integration, and appropriate end-to-end coverage for
  source normalization, profile isolation, inheritance, migration, and
  selected-versus-unselected invalidation.
- [ ] Run the semantic resolver, parser, binding, and invalidation suites
  before starting data-view publication work.

### Guided Checkpoint B1: Bound Presentation Semantics Are Real

- [ ] A current Framed or Pure version resolves exactly one selected
  workflow projection per page, and the selected digest reaches raw semantics
  and exact adapter input bindings.
- [ ] Current-v3 migration produces a new canonical source/configuration
  snapshot without modifying historical source, state, receipt, or generated
  evidence.
- [ ] A selected Page Class/Profile change invalidates the affected page;
  unselected sibling profile changes do not.

**When not ready:** repair the earliest parser, resolver, migration, binding,
or invalidation failure before publishing presentation artifacts. Do not use a
friendly view to hide an unbound semantic fact.

### 2B. Publish the Pre-Production Data View

**Owner:** the same shared presentation-system OpenSpec change, with the
relevant `cli-surface` and `node-specification` deltas if `image2 plan` or its
consumer receipts change.
**Entry:** Guided Checkpoint B1 has enough evidence to advance.
**Output:** independently readable, rebuildable control artifacts for every
page and a deck-level map, without creating a second source of authority.

- [ ] Extend `image2 plan`, at its existing pre-submit planning point, to
  publish the dedicated non-navigation root selected in Phase 1. The writer
  consumes canonical source, resolved selected presentation, and immutable
  adapter compiler outputs; it does not reconstruct an Image2 request in the
  CLI or navigation layer.
- [ ] Publish the independent per-page artifacts and deck-level Presentation
  Control Map with schema identifiers, source/plan bindings, selected-profile
  digest, and direct paths to each controller projection.
- [ ] Publish Framed Header HTML through a deliberate deterministic projection
  API rather than copying browser-capture internals. Exclude credentials and
  other non-page secrets from every control artifact.
- [ ] Keep the exact provider-input inspection sidecar as audit evidence.
  `artifact-view` may add safe links or summaries only; it must not wholesale
  copy the raw controller JSON/prompt into Human Navigation or use it to
  select, authorize, submit, reconcile, or review work.
- [ ] Add path, schema, stale/missing publication, source/plan binding, and
  navigation-boundary tests. Prove that a data view rebuild has no provider
  call and cannot create a second approval state.
- [ ] Run the change's validation and repository regression suite, resolve
  failures, and archive the OpenSpec change only after its tasks are complete.

### Guided Checkpoint B: Shared Control Surface Is Real

- [ ] A current Framed or Pure version can expose its page class, resolved
  selected projection, and independent renderer controller inputs after
  `image2 plan` and before provider submission.
- [ ] The deck-level Presentation Control Map points to per-page source,
  resolved-presentation, and controller artifacts without becoming one giant
  configuration document or a navigation copy of raw prompt prose.
- [ ] A page cannot acquire a sibling-workflow fact, an arbitrary layout
  coordinate, or an unbound class/profile change.
- [ ] The changed Harness behavior is specified, tested, and landed rather than
  existing only in a plan or glossary.

**When not ready:** the Agent locates the earliest failing source, resolver,
binding, projection, or test task; it repairs and rechecks that task rather
than asking the human to diagnose implementation details.

### 3. Establish Provider Protected-Region Capability

**Owner:** `framed-provider-protected-composition.md`
**Entry:** Guided Checkpoint B and Track P's capability record have enough
evidence to advance.
**Output:** an evidence-backed provider capability decision, not a prompt
assumption.

- [ ] Complete Track P's provider-surface record and define one synthetic
  Framed stress page from the landed Header Profile and normalized Reserved
  Header Region, including the exact empirical rubric.
- [ ] Run the bounded prompt-only probe only after Track A has made the active
  Task Mandate executable in the runtime. The Agent creates the same exact
  plan/batch grant and cost record as today; the grant is automatic
  bookkeeping, not a repeat human question.
- [ ] Treat a prompt-only result as empirical best-effort evidence only. A
  protected-region primitive is verified only when both its provider endpoint
  contract and a bounded result are recorded; it also requires a narrow,
  separately specified transport extension because the current transport has
  no native region/mask field.
- [ ] Record exactly one selected path: explicitly bounded prompt-only
  composition, a verified native primitive plus its transport-change scope, or
  a separate deterministic body-layout workflow-design decision. Do not turn
  an unsupported provider field or prompt wording into a collision guarantee.
- [ ] Update the Framed work package with the result and the path it enables;
  do not describe prompt wording as a hard spatial guarantee.

### Guided Checkpoint C: Provider Path Chosen

- [ ] The provider mechanism and its known limits are recorded from evidence.
- [ ] The selected path has a compatible ownership model: transparent Framed
  header remains local, while provider body rendering remains provider-owned.
- [ ] Any native primitive has an approved transport contract; any path that
  would make local code own provider body layout is explicitly routed to a
  separate workflow-design plan.

**When not ready:** the Agent explains the observed limitation in page terms,
shows the bounded best-effort and new-workflow options with their impact, and
asks for a decision only if the result changes ownership or needs a design
direction beyond the Task Mandate. If no sufficient primitive exists and
bounded best-effort Framed is not
acceptable, it opens a separate workflow-design plan; it does not add local
body rendering inside Framed.

### 4. Land Framed Protected-Composition Hardening

**Owner:** a new `harden-framed-provider-protected-composition` OpenSpec
change, refined by Guided Checkpoints A-C.
**Entry:** Guided Checkpoints A, B, and C have enough evidence to advance.
**Output:** a tested Framed adapter with one selected, honest
protected-composition contract.

- [ ] Create the OpenSpec change and write its proposal, affected capability
  deltas, design, migration/invalidation treatment, and executable task list.
- [ ] Implement the selected normalized protected-composition contract with
  explicit normalized coordinate/canvas semantics, one defined body-safe
  region, and no slide-authored geometry.
- [ ] Preserve `subject_restrictions` through Source Receipt, Page Image Core,
  Framed raw contract, and compiled provider input; validate its closed form at
  each boundary.
- [ ] Consume the landed Page Class and Header Profile projection without
  creating a private `FRAME PRESET` extension or leaking Framed geometry into
  Pure.
- [ ] If and only if Phase 3 selected a verified native primitive, implement
  its narrow transport extension and prove the Framed adapter's bound exact
  bytes reach it unchanged. Otherwise keep shared transport opaque and make
  the prompt-only contract's best-effort limit explicit.
- [ ] Preserve exactly one Complete Page Review decision; any occupied-region
  diagnostic is provider-free, advisory, deterministic, and never a competing
  acceptance state.
- [ ] Add contract, binding, invalidation, review, and transport tests proving
  that changed provider semantics force raw rebuild and exact adapter bytes
  reach the shared transport unchanged.
- [ ] Validate and archive the change only when all approved tasks and the
  repository regression suite pass.

### Guided Checkpoint D: Framed Contract Is Ready for Conformance Evidence

- [ ] The selected provider path is fully specified and implemented without a
  false collision guarantee.
- [ ] The complete-page raw/composite review contract and Content Authority
  boundaries remain intact.
- [ ] Focused and full regression evidence is current.

**When not ready:** the Agent uses the failing contract or regression evidence
to identify the smallest Phase 4 repair and preserves v3 as a production
subject, not the first experiment.

### 5A. Prove Deterministic Framed Contract Conformance

**Owner:** the landed Harness and its regression suite.
**Entry:** Guided Checkpoint D has enough evidence to advance.
**Output:** deterministic evidence that the selected contract, bindings, and
local composition are internally coherent before any external sample is
interpreted.

- [ ] Re-run the parser, Core, resolver, Framed adapter, binding,
  invalidation, transport, render-contract, and Complete Page Review suites.
  Prove normalized protected-composition facts, body-safe instructions,
  subject restrictions, Header Profile geometry, and exact adapter bytes bind
  into raw lineage and force rebuild when changed.
- [ ] Render deterministic local Framed composites from synthetic fixtures and
  prove header geometry, field policy, and local legibility. These checks do
  not claim to determine where a provider placed rasterized body text.
- [ ] Record the resulting local evidence beside the synthetic fixture and
  route any contract failure to Phase 4.

### 5B. Produce Empirical Provider Conformance Evidence

**Owner:** Agent under the active Task Mandate plus the landed Harness.
**Entry:** Phase 5A passes and Track A has landed before the first paid
submission.
**Output:** controlled external evidence that the selected provider path is
good enough to consider current v3 repair.

- [ ] Run at least three bounded synthetic Framed stress-page submissions under
  the active Task Mandate, recording exact count and cost in the normal
  compiled-input and evidence path without another permission prompt.
- [ ] Inspect provider pages and Production-Equivalent Composites against the
  accepted rubric: no header literal or readable provider body text in the
  protected region, no forbidden subject, source body in the body-safe region,
  and a legible composite. This is empirical provider evidence, not a claim
  that the Harness can prove raster semantics deterministically.
- [ ] Record Agent visual analysis, the resulting Complete Page Review
  recommendation, and any human refinement feedback. OCR may be captured as
  optional advisory evidence with its false-positive limitations recorded; it
  is neither a required production dependency nor an automatic acceptance
  gate. A failure routes to Phase 4; it is not repaired by silently lowering
  the rubric.

### Guided Checkpoint E: v3 Re-entry Ready

- [ ] Both deterministic contract conformance and empirical provider evidence
  satisfy the accepted rubric, and the Task Mandate contains no explicit review
  hold before v3 re-entry.

**When not ready:** the Agent distinguishes a provider/Harness invariant
failure from a page-specific content or composition problem, then routes to
Phase 4 or the relevant v3 repair loop with a concrete explanation. A provider
limitation that changes ownership becomes a separately approved workflow-design
plan.

### 6. Repair and Resume Current v3

**Owner:** current v3's human/Agent/Harness ownership path.
**Entry:** Guided Checkpoint E has enough evidence to advance.
**Output:** a new, reviewable v3 raw lineage; never a patched copy of the old
one.

- [ ] Record `repair` for the current Complete Page Review through its
  owner-issued action, preserving historical evidence without accepting it.
- [ ] Apply the explicit current-v3 source/configuration migration from Phase
  2A, then update only the new canonical source and accepted version
  configuration, including any human Page Class selection. Do not edit the
  historical pair, `_generated/` data, receipts, state, or review artifacts.
- [ ] Re-establish the current source, Style Master, resolved presentation,
  controller projections, and exact raw plan through the normal pipeline.
- [ ] Only after Track A is landed, use the Task Mandate to create the exact
  rebuilt-v3 grant and generate within that bound scope. The Harness records
  plan/batch hashes, cost, attempts, and evidence without another human
  question; it does not skip any exact integrity check.
- [ ] Inspect the new provider page and Production-Equivalent Composite in one
  Complete Page Review, then record the requested `proceed` or `repair`
  outcome; ask only if the current human instruction leaves that new quality
  direction genuinely undecided.
- [ ] Continue to final/delivery work only after `proceed`; a v3-specific
  repair returns to this phase, while an invariant failure returns to Phase 4.

## Definition of Done

This progressive plan is complete only when Track A is landed if the
no-repeated-prompt UX is enabled, the shared presentation-system change
(including its independent data view) and Framed hardening change are both
landed, deterministic and empirical synthetic conformance evidence satisfy
their separate rubrics, and current v3 has a new exact Complete Page Review
outcome from rebuilt lineage. It does not require a delivery receipt; delivery
remains its own downstream ownership path after `proceed`.

## Update Protocol

When work advances, check only the task with its evidence available, update the
owning specialist plan with the detailed finding, and then update this plan's
checkpoint status. The Agent continues all normal in-scope diagnosis,
preparation, implementation, rebuild, and exact-grant bookkeeping under an
active Task Mandate; it asks only when a new goal, explicit limit, or genuinely
new content/design direction changes the work. Until Track A is implemented,
the current runtime's exact-grant confirmation remains a known technical
constraint and must not be misrepresented as solved. If a new decision changes
ordering or ownership, revise this master plan before starting the affected
downstream task.
