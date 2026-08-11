## Why

`image2 plan` 已能在不触发 provider 的情况下编译当前页面的 source、presentation 与请求输入，但这些中间事实主要留在内存、raw plan 或面向 Human Navigation 的受限投影中。Agent 和 Deck Author 因此无法在花费前逐页追溯“源内容如何成为要发送的精确请求”，也无法在不运行管线的情况下指出哪一层需要修正。

C1--C4 已经建立当前 schema、稳定页面身份、上游叙事来源与单一 Page Class projection。现在应在同一个 provider-free 计划结点把这些已编译的事实发布为独立的、带来源和失效条件的页面工件；这让后续 C6 的 provider 保护工作以可检查的输入为基础，而不改变现有授权或 Complete Page Review 的唯一控制面。

## What Changes

- At `image2 plan`, publish one independent per-page derived-data directory for
  each selected current page before authorization or any provider initialization.
  It contains `page-source-receipt`, `page-layout`, `page-render-model`,
  `page-generation-spec`, `image2-request`, and `page-artifact-index`; Framed
  pages additionally publish `framed-header-html` as HTML only, with no sibling
  JSON controller.
- Define a deck-level derived-data index that locates current per-page indexes
  by stable `slide_id`, current position, and publication lineage. Each
  independently published artifact identifies its producer, canonical source
  bindings/digests, and the inputs whose drift makes it non-current.
- Add the independent derived-data directory as the canonical per-page
  publication for raw provider prose and exact request bytes. The existing
  aggregate provider-input inspection remains outside this change's data model;
  it is neither a C5 input nor a Human Navigation copy. Human Navigation remains
  a read-only, author-safe navigation projection and SHALL not copy C5 payloads
  into its tree.
- Materialize the previously planned `page-render-model` and
  `page-artifact-index` schema stages, and serialize the other C5 stages from
  their existing typed owners without creating a second source, lifecycle
  record, authorization, acceptance decision, or review gate.
- Enforce the new derived-data paths as regenerable run-bundle outputs. Normal
  source/configuration or raw-plan invalidation makes stale publications
  unavailable for current use; they are regenerated only through the existing
  `image2 plan` path, never hand-edited or migrated from historical protocols.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-parsing`: publish the normalized current Page Source receipt in the
  provider-free per-page derived-data chain.
- `visual-config`: materialize the workflow-isolated resolved Page Layout and
  the reviewable Page Render Model with complete provenance.
- `image-generation`: publish exact adapter-owned `image2-request` bytes and
  bind all per-page publications to the existing immutable raw plan without
  changing authorization or generation semantics.
- `pipeline-orchestration`: make publication part of `image2 plan` after
  current compilation and before the existing authorization decision.
- `run-bundle-layout`: define the confined, regenerable per-page and deck-level
  derived-data paths outside Human Navigation.
- `production-schema-conformance`: require every C5 serialized artifact to
  conform to its declared stage schema, producer, provenance, and
  materialization inventory.

## Impact

- **Harness source:** `ppt_maker_harness/scripts/01-content/`,
  `02-visual-system/`, `03-framed-image/`, `04-pure-image/`,
  `shared/image2/`, `shared/run-bundle/`, and the public `ppt_flow` planning
  route; the new publication protocol crosses MD-to-JS only as an existing
  deterministic `image2 plan` output. JS owns serialization and validation;
  the MD Controller retains routing and the one existing human decision path.
- **Harness contracts:** `ppt_maker_harness/schema/stages/`, run-bundle layout
  documentation, and focused unit/integration/E2E coverage in `tests/` and
  `tests_e2e/`.
- **Run-bundle contract:** current plans gain one generated directory. No
  compatibility reader, migration, historical selector, or production `deck_*`
  fixture is introduced. Existing historical evidence remains immutable but
  cannot be treated as a current C5 publication.
- **Controls:** per `openspec/policies/human-centered-gates.md`, publication is
  guide-only inspection evidence, not a new confirm or hard-stop. Per
  `openspec/policies/agent-assistance-and-control.md`, the Agent can run the
  deterministic publisher and explain its output; the human's only relevant
  decision remains the owner-issued Complete Page Review. Per
  `openspec/policies/simple-reliable-control.md`, the shortest correct loop is
  compile once, validate that one publication, then reuse the existing
  authorization/review controls; no new state, gate, retry, fallback, or
  recovery branch is introduced.
