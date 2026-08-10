## Why

The Page Image path needs a single, inspectable presentation model before the
Framed header geometry and Pure deck configuration can be made coherent. It
also needs one current protocol. Keeping two protocol graphs in active source,
guidance, state, and tests makes both selection and recovery ambiguous.

The owner has selected `page-authority-image2-v2` as the only current Page
Image protocol. This change first establishes that V2-only boundary, then
introduces the Page Presentation System on that one route. Any non-V2 input is
opaque historical input: it is byte-preserved and receives the existing
`unsupported-protocol/export` hard-stop. It is never a compatibility route,
migration target, or fallback.

## What Changes

- **BREAKING:** Make `page-authority-image2-v2` with matching
  `image2-page-authority-v2` State the only active source/state protocol.
  Replace obsolete protocol markers, receipt/state modes, dispatch, guidance,
  fixtures, tests, and main-spec contracts. New bundles and structural
  successors use V2; no generic or production-data migration is introduced.
- Add the Page Image Presentation System: a version-resolved source package
  containing a closed Page Class catalog, shared Deck Baseline, Pure profiles,
  and Framed Header Profiles.
- Add optional source `PAGE CLASS`. Omission normalizes to `standard`; only
  `opening`, `transition`, and `closing` may be explicit. A class never
  changes the version's selected `framed` or `pure` workflow.
- Replace the Pure-only deck system and Framed code preset with one resolver
  that returns exactly one workflow-isolated presentation projection and digest
  for each V2 slide. A V2 source requires the new package and rejects
  `FRAME PRESET`.
- Bind Page Class provenance and the selected presentation digest through the
  V2 Source Receipt, Page Image Core, raw contracts, controller inputs, exact
  bindings, invalidation, review, finalization, and delivery lineage.
- Publish a provider-free Pre-Production Data View during `image2 plan`, with
  independent per-slide receipt, resolved presentation, Image2 controller, and
  Framed Header HTML artifacts plus a deck-level Presentation Control Map.
  It is rebuildable inspection data, never lifecycle authority or a Human
  Navigation copy of raw prompt prose.
- Keep the `image2` command forms unchanged; successful V2 `image2 plan`
  reports the canonical run-relative Data View locator.

## Capabilities

### New Capabilities

- `page-image-presentation`: Version-resolved Page Class, presentation-package,
  profile inheritance, selected projection, and controller-projection contract
  for V2 Page Image work.

### Modified Capabilities

- `bootstrap-env-guidance`: Name only V2 Page Image readiness.
- `cli-surface`: Resolve only V2 identity and report the Data View locator and
  bounded source/configuration diagnostics.
- `commands-reference`: Route requests through one V2 workflow graph.
- `content-parsing`: Parse V2 source and `PAGE CLASS`, retire `FRAME PRESET`,
  and bind class provenance into the V2 receipt.
- `harness-charter`: Make V2 the sole active protocol in Harness guidance.
- `image-generation`: Bind selected presentation semantics into V2 planning,
  evidence, and the Pre-Production Data View.
- `image-production`: Publish final artifacts through only the selected V2
  workflow owner.
- `node-specification`: Bind State and controller projections to V2 lineage.
- `pipeline-orchestration`: Dispatch one V2 workflow lifecycle only.
- `playbook-execution`: Create and resume only V2 workflow routes.
- `run-bundle-layout`: Reserve the V2 presentation package and derived Data
  View paths.
- `run-bundle-management`: Seed, validate, and version V2 topology only.
- `slide-identity-and-ordering`: Bind structural previews and clean successors
  to V2 workflow identity.
- `style-master-generation`: Scope Style Master work to V2 lineage only.
- `visual-config`: Resolve and expose only the selected V2 presentation
  projection.
- `workflow-inspection`: Perform marker-first V2 observation without mutation.

## Impact

- **Harness source:** Protocol marker/state/evaluator, Page Image adapters and
  lifecycle owners, `ppt_flow`, controller/playbook guidance, run-bundle
  layout, visual configuration, and delivery routes under `ppt_maker_harness/`.
- **Tests:** protocol fixtures and assertions across `tests/` and `tests_e2e/`
  become V2-only; add absence audits and V2 Pure/Framed journeys. No production
  `deck_*`, `dpt_*`, or `_generated/` data is read, modified, or used as a
  fixture.
- **OpenSpec:** synchronize all listed modified capabilities so active specs
  describe only V2. Archived history remains historical evidence, not an active
  contract.
- **Control ownership:** JS owns marker/state parsing, selection, receipts,
  evidence, and diagnostics. MD/Agent owns intent and consumes producer-issued
  recovery. The human still chooses `framed` or `pure` and makes content/design
  decisions; no additional runtime confirmation is introduced.
- **Run-bundle contract:** incompatible. New and structurally created versions
  are V2. Non-V2 bundles retain bytes and receive one hard-stop that protects
  identity, provenance, and recovery; an unrelated named-bundle conversion is
  outside this Harness-maintenance change.
