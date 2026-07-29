## Why

The current `page-authority-image2-v1` protocol allows `pure-image2` and
`framed-image2` to be selected per slide in one mixed deck lifecycle. That
model leaves Framed ownership split across shared modules, makes new-user
routing expose an implementation distinction repeatedly, and gives delivery
and iteration more than one potential business owner.

This change introduces a version-separated target protocol in which a new deck
version chooses one workflow once: Framed or Pure. The choice must be
mechanically recorded before provider work, while existing mixed v1 runs retain
an explicit bounded route rather than being silently reinterpreted.

## Planning Inputs

This change captures the already-aligned target and execution sequencing in
[`page-authority-workflow-baseline-target-gap.md`](../../../_backlog/plans/page-authority-workflow-baseline-target-gap.md),
[`framed-image-directory-ssot.md`](../../../_backlog/plans/framed-image-directory-ssot.md),
and the active delivery checklist
[`page-authority-workflow-openspec-progressive-plan.md`](../../../_backlog/plans/page-authority-workflow-openspec-progressive-plan.md).
Those plans establish the CURRENT facts, target ownership model, and one-change
boundary; this proposal, its delta specs, design, and tasks are the executable
OpenSpec record. If a planning input conflicts with an accepted spec, the
accepted spec remains authoritative until this change is applied.

## What Changes

- Add a versioned TARGET production identity, version-level workflow receipt,
  and marker-first resolution that distinguish Framed and Pure authoring from
  CURRENT `page-authority-image2-v1` bytes.
- Replace TARGET per-slide authority dispatch with exclusive sibling workflows:
  `03-framed-image` or `04-pure-image`, each producing the same ordered
  final-slide manifest before shared `05-delivery` and workflow-aware
  `06-iteration`.
- Establish typed `RawWorkPlan`, `AcceptedRawEvidence`, and
  `FinalSlideManifest` seams so shared raw mechanics own only provider,
  authorization, evidence, and review mechanics; workflow adapters own their
  semantic rules and final publication.
- Define the CURRENT mixed-run boundary, evidence invalidation, structural
  workflow-switch behavior, activation order, rollback route, and provider-free
  verification fixtures. New init creates only the TARGET model after both
  workflow paths and shared delivery are complete.
- Move Framed/Pure/Delivery/Iteration ownership into the framework source,
  controller, inspection, workflow guidance, directory contract, and
  architecture tests; remove superseded generic branches without retaining
  undocumented shims.

**BREAKING**: New authoring no longer permits a per-slide Pure/Framed override.
A whole-version workflow switch uses the Structural Versioning Path. Existing
CURRENT v1 mixed runs remain bounded compatibility inputs or use an explicitly
specified migration route; no production `deck_*` data is auto-migrated.

### Policy Application

- `human-centered-gates.md`: the one workflow choice is a source-owned
  semantic decision; provider authorization and visual review remain human
  confirms; identity, schema, authorization, evidence, bytes, and lineage
  mismatches remain non-waivable hard-stops with an owning recovery route.
- `agent-assistance-and-control.md`: humans choose workflow, content, and
  visual judgment; the Agent and JS perform deterministic routing, receipt
  writing, validation, rebuild, and recovery without the MD Controller
  duplicating evaluators or runtime schemas.
- `simple-reliable-control.md`: the target removes per-slide dispatch and
  duplicate production owners in favor of one marker-first resolver, one
  workflow receipt, one raw evaluator, one delivery truth, and one nearest
  legal action per failure.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-parsing`: change TARGET source parsing from per-slide authority
  resolution to an exclusive version workflow while retaining the CURRENT v1
  parse boundary.
- `image-production`: replace the generic Pure/Framed finalizer contract with
  sibling workflow adapters and one final-manifest interface.
- `image-generation`: consume adapter-owned typed raw plans while preserving
  authorization and raw-evidence ownership.
- `pipeline-orchestration`: express `03 XOR 04 -> 05 -> 06`, late delivery
  merge, and workflow-aware refresh.
- `visual-config`: retain shared visual language while moving Framed preset,
  fit, and reserved-underlay ownership to the Framed workflow.
- `node-specification`: model version workflow receipts, state/evidence graph,
  controller consumption, repair, and CURRENT/TARGET distinction.
- `playbook-execution`: route new decks through one selected workflow instead
  of exposing per-slide authority dispatch.
- `workflow-inspection`: project marker-first workflow prerequisites and one
  nearest actionable route.
- `run-bundle-management`: initialize and validate TARGET identity/workflow
  while recognizing CURRENT compatibility or explicit migration.
- `slide-identity-and-ordering`: bind structural vNext work to a version
  workflow and prevent workflow switches from inheriting acceptance.
- `commands-reference`: route requests by version workflow and ownership, and
  update iteration guidance to its `06` owner.
- `framework-charter`: describe sibling workflows, shared delivery, and the
  once-per-version workflow decision.
- `framework-directory-layout`: define `03`/`04`/`05`/`06` workflow ownership
  with no second production owner.
- `framework-script-layout`: define sibling adapter, private-boundary, shared
  mechanics, delivery, and executable/import ownership.

## Impact

- **Framework source:** `PPTMAKER_FRAMEWORK/` workflow guidance, playbooks,
  charter material, production scripts, state/inspection controls, and their
  directory/import contracts.
- **Specs and tests:** `openspec/`, `tests/`, and `tests_e2e/` gain the target
  requirements, architecture checks, provider-free integration fixtures, and
  CURRENT-boundary coverage.
- **Control ownership:** MD owns user-facing workflow selection and route
  presentation; JS owns canonical parsing, receipts, state, validators,
  evidence, and deterministic recovery. The MD Controller consumes producer
  facts and does not duplicate CLI or state schemas.
- **Run-bundle contract:** migration. New init/source templates create a
  versioned TARGET workflow choice only after activation; existing mixed v1
  runs stay on an explicit compatibility route or an accepted structural
  migration. No `deck_*`, `dpt_*`, or `_generated/` production data is read,
  used as a fixture, or automatically rewritten by this change.
- **Public CLI and delivery contracts:** no direct CLI grammar, diagnostic
  envelope, PPTX assembly, or notes-injection requirement change is assumed.
  A delta for those capabilities is added only if design proves an observable
  contract must change.
