## Why

The current `page-authority-image2-v2` Framed model is wrong: it treats
Image2 as a text-free underlay and assigns callouts and other meaningful page
copy to a local Text Frame. That loses the model's integrated text-and-visual
composition ability, produces a second page-content model beside Pure, and
makes the current refresh and review semantics misleading.

This is a clean replacement, not a compatibility exercise. The active Harness
must adopt one correct Page Image Workflow model before more production work
is created on a protocol whose content, provenance, and evidence it cannot
interpret correctly.

## What Changes

- **BREAKING** Retire `page-authority-image2-v2` /
  `image2-page-authority-v2` and every active v2 parser, state, receipt,
  provider, review, refresh, and delivery route. Retained v2 bytes remain on
  disk but are unsupported input: no converter, fallback, evidence reuse,
  repair route, or automatic deck mutation is introduced.
- Establish a new current Page Image Workflow protocol with a distinct
  source/state/receipt/evidence identity and one version-level `framed` or
  `pure` Header Rendering Policy. `hybrid` describes only Framed composition;
  it is not a third workflow or a per-slide choice.
- Make Pure and Framed share one full-canvas Page Image Core. The provider
  renders visual scene plus provider-rendered body, labels, metrics, diagram
  text, quotes, callouts, and supporting copy. Framed adds only a transparent,
  deterministic local `kicker`/`title`/`subtitle` overlay; Pure has the
  provider render those fields as visible page pixels.
- Replace free-form/body-only semantics with a closed Provider Content Schema:
  canonical source remains authoritative for claims, facts, numbers, names,
  labels, and required literals. Copy is exact by default; only explicitly
  marked non-factual supporting copy may be presentation-adaptable.
- Move Page Image Workflow compilation into selected adapters and bind the
  actual provider-input bytes and digest through plan, inspection,
  authorization, attempt, provenance, reconciliation, invalidation, and
  finalization. Shared transport sends bound bytes and does not compile
  Framed/Pure prompts.
- Replace field-name refresh heuristics with provider-input-preserving
  invalidation. Framed header changes rebuild raw whenever their
  context-not-to-render input changes; local overlay refresh remains available
  only when provider input, protected geometry, raw contract, and profile are
  provably unchanged.
- Use one Complete Page Review decision: Framed presents its raw page beside a
  production-equivalent local-header composite, while Pure presents its
  complete provider page. Pilot remains a sample/cost stage; final delivery
  review remains separate and no extra composite-approval state is added.
- Update current Harness guidance, Controller language, CLI routes, and
  architecture guards to use the new model and prevent regression to a
  text-free Framed underlay.

## Capabilities

### New Capabilities

None. The change extends the existing Page Authority capability boundaries;
it does not create a second page-production family.

### Modified Capabilities

- `content-parsing`: define the new current source identity, closed
  Provider Content Schema, content authority, and homogeneous Header Rendering
  Policy input.
- `visual-config`: define common page visual inputs plus Framed's transparent
  header preset and protected-zone composition constraint without a no-text
  page rule.
- `style-master-generation`: bind current Style Master planning and selection
  to the replacement Page Image Workflow identity and common visual semantics.
- `image-generation`: compile and bind current provider inputs, raw plans,
  authorization, evidence, and review projections for the common Page Image
  Core.
- `image-production`: publish current final media and Pilot/Complete Page
  Review contributions for Pure and Framed without a second approval gate.
- `pipeline-orchestration`: route invalidation and provider-free refresh from
  the actual compiled provider-input fingerprint.
- `harness-script-layout`: preserve sibling adapter ownership while adding the
  explicit shared Page Image semantic/compiler seam and removing v2 imports.
- `run-bundle-management`: initialize and validate only the new current
  source/state protocol pair and its explicit version-level workflow choice.
- `run-bundle-layout`: assign generated artifacts and review contributions to
  the replacement protocol and reject v2 records as current authority.
- `node-specification`: bind Controller/state lifecycle facts to the new
  source/state pair and preserve its hard-stop boundary.
- `workflow-inspection`: observe the replacement lifecycle marker-first and
  return its one direct next action without interpreting v2 bytes.
- `playbook-execution`: express the correct selected-workflow creation,
  review, and recovery handoffs without duplicate review gates.
- `slide-identity-and-ordering`: bind structural preview/apply to the new
  version workflow without acceptance inheritance or per-slide authority.
- `commands-reference`: route human requests through the correct Page Image
  ownership and provider-input-preserving refresh paths.
- `harness-charter`: make the Page Image Core, Header Rendering Policy, and
  clean unsupported-input boundary current Agent guidance.
- `cli-surface`: expose only replacement-protocol operations and reject v2
  before provider initialization or mutable work.
- `bootstrap-env-guidance`: describe current Framed readiness without
  implying a text-free or provider-free full-page workflow.
- `pptx-assembly`: consume only the replacement protocol's common final-slide
  manifest while retaining workflow-neutral delivery ownership.
- `notes-injection`: bind notes only to the replacement protocol's final
  assembly lineage.

## Impact

- **Harness source:** `ppt_maker_harness/` source parsing, visual config,
  Style Master, `03-framed-image`, `04-pure-image`, shared Image2/runtime
  seams, iteration, state, run-bundle ownership, playbooks, charter, workflow,
  and reference guidance.
- **Specifications and verification:** `openspec/`, focused unit/integration
  tests under `tests/`, and mock-provider/controller journeys in `tests_e2e/`.
  No production `deck_*` directory is a source fixture or automatic target.
- **Control ownership:** MD Controller/Agent retains intent, workflow choice,
  and human review interaction; JS owns parsing, compiler bytes, deterministic
  contracts, provenance, invalidation, and diagnostics; their existing
  protocol owns handoff/state records.
- **Run-bundle contract impact:** `migration` at the contract boundary only:
  this is a breaking replacement requiring new current source/state/evidence
  lineage, with no in-place data migration, converter, or legacy evidence
  adoption. Existing v2 bytes are preserved but hard-stop as unsupported.

Per `openspec/policies/human-centered-gates.md`, deterministic source,
identity, provenance, authorization, and v2-input failures are hard-stops;
their protected invariants cannot be waived. Visual Page Review is the one
human `confirm` decision with repair recommended first, not a second
composite-approval gate. Per
`openspec/policies/agent-assistance-and-control.md`, the Agent performs legal
mechanical work after explicit decisions while the owning runtime remains the
sole evaluator and durable writer. Per
`openspec/policies/simple-reliable-control.md`, the change consolidates the
old raw/composite decision split into one direct review checkpoint, short-
circuits invalid identity before derived work, and introduces no retry,
fallback, or parallel authority path.
