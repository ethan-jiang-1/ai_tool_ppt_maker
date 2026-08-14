## Why

The active Harness has already converged on one current production contract:
`page-image-workflow`, a version-level `framed|pure` selection, and the
existing `production-protocol` inspection boundary.  However, active
specifications, guidance, a dead CLI branch, and tests still name a retired
production protocol as `v2`, retain the competing
`unsupported-protocol/export` recovery vocabulary, and keep an empty
`html-slide-rendering` capability in the main-spec registry.  These are not
historical evidence in an archive; they are live instructions that can cause a
future Agent to invent a compatibility route or choose the wrong recovery.

The cleanup program requires a high-signal, current-only environment.  This
batch therefore removes historical protocol surfaces without attempting to
read, classify, convert, or repair historical production data.

## What Changes

- Retire the empty `html-slide-rendering` main-spec capability through the
  OpenSpec capability-retirement flow.  Its active registry row and main spec
  disappear only after the retained Framed private runtime is verified to be
  owned by `html-render-runtime` and current Page Image finalization.
- Replace protocol-specific `v2` tombstones in active specifications,
  Controller guidance, CLI projections, reference guidance, implementation,
  and tests with one generic current-contract boundary.  A normal Run Bundle
  structural snapshot name such as `3_versions/v2/` remains valid and is not
  a retired protocol reference.
- Make the existing owner-issued recovery taxonomy the only active one when a
  present source/state/evidence/delivery record is foreign, unreadable,
  incomplete, or cross-lineage and therefore cannot establish current protocol
  identity: `hard-stop`, owner `production-protocol`, root cause
  `current-protocol-invalid`, action `repair-current-protocol-identity`, action
  kind `repair`, and `requires_human: false`. Preserve the distinct current
  owners for an exact Harness locator/binding failure, a declared fresh
  authoring draft, a state-owned defect after current protocol identity is
  established (with writes limited to one-to-one fence-clear repair), an exact
  requested/active Work Version mismatch, and missing or drifted derived delivery
  output whose current lineage is attributable.
- Require the negative path to preserve source/state/evidence/delivery bytes and
  make no state/history/task-projection/generated/delivery-artifact writes or
  provider work. It does not expose export, migration, conversion, adoption,
  fallback, or compatibility reading.
- Remove unreachable retired-command handling and historical aliases/fixtures
  rather than retaining a rejection-only public shadow.  Add a scoped,
  provider-free residue guard with planted negative controls for numeric `vN`
  identities coupled to production roles, competing invalid-protocol actions,
  and affirmative invalid-input recovery claims. It scans only the declared
  active source roots and `openspec/config.yaml`, never an OpenSpec change
  (including the active change that necessarily records retired terms). The
  guard explicitly permits ordinary Run Bundle `vN` snapshot notation, exact
  execution-version mismatch coverage, JavaScript `export` syntax, unrelated
  compatibility language, and normative text forbidding migration/fallback.

The control posture follows
`openspec/policies/human-centered-gates.md`: uncertain production protocol
identity is a non-bypassable `hard-stop` protecting byte, identity, and
attributable-current-lineage invariants.  Under
`openspec/policies/agent-assistance-and-control.md`, the Agent reads the
direct source/state/evidence facts, reuses the existing inspection evaluator,
performs only legal mechanical diagnosis, and takes the one owner-issued
repair action; no new human decision is needed.  Under
`openspec/policies/simple-reliable-control.md`, the path stays
`direct facts -> existing evaluator -> earliest root cause -> owner repair ->
same checkpoint`; it removes special terminology and branches instead of
adding a validator, state record, retry, fallback, or Controller.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-inspection`: define the one generic, byte-preserving invalid
  current-protocol hard-stop projected by the existing read-only evaluator.
- `pipeline-orchestration`: require generic current-contract admission before
  routing, planning, refresh, authorization, or artifact reads.
- `image-production`: make finalization reject undeclared source/state/evidence
  through the same generic boundary before any artifact publication.
- `pptx-assembly`: reject foreign or unattributable final-manifest/delivery-media
  identity through the shared boundary while retaining delivery-owner rebuild
  only for attributable current derived-media drift.
- `node-specification`: keep Harness binding and undeclared/current-shaped-invalid
  state/source handling byte-preserving and with their declared owners.
- `playbook-execution`: make active Controller handoffs project, but never
  adopt or route around, the same owner action.
- `commands-reference`: describe one current-contract handoff without naming a
  retired protocol or a competing export action.
- `cli-surface`: project the current-contract hard-stop through direct CLI
  diagnostics, including typed finalization/delivery causes, and keep invalid
  input ineligible for task-projection updates.
- `notes-injection`: accept only declared current delivery lineage without
  naming or interpreting a historical protocol.
- `environment-check`: remove retired-protocol naming from current endpoint
  readiness guidance while preserving its existing current check.
- `harness-charter`: remove retired renderer terminology from the active
  authority hierarchy while retaining the privately owned Framed runtime.
- `harness-script-layout`: prohibit undeclared adapter/reader imports without
  encoding a retired protocol name as active architecture vocabulary.
- `production-schema-conformance`: define the active-surface residue guard and
  its structural-version exception boundary.
- `html-slide-rendering`: remove the retired capability and its requirements.

## Impact

- Harness source: current guidance under `ppt_maker_harness/`, the existing
  workflow inspection and CLI entry path, direct finalization/delivery
  consumers, and any unreachable retired protocol branch.  The retained
  `html-render-runtime` private Framed implementation is not removed or
  repurposed.
- OpenSpec: the listed delta specs, `openspec/config.yaml` capability registry,
  and normal change/archive records.  The main `html-slide-rendering` spec is
  retired through the configured OpenSpec mechanism, not deleted ad hoc.
- Tests: focused unit/integration and mock E2E coverage under `tests/` and
  `tests_e2e/` will prove the invalid-current-contract boundary, zero writes,
  zero provider calls, and guard sensitivity.  Historical protocol fixtures
  are deleted rather than translated.
- Control owner: existing direct validators own their source/state/evidence or
  delivery identity facts; the inspection and CLI producers own the canonical
  `production-protocol` action projection. MD Controllers and `COMMANDS.md` are
  consumers. No delivery module, second controller, runtime schema, or recovery
  writer duplicates that action taxonomy.
- Run-bundle contract impact: `none`.  Existing production data is neither
  read nor scanned.  There is no migration, compatibility reader, alias,
  converter, or `deck_*`/`dpt_*` fixture.
- Dependencies and public APIs: no dependency or provider change.  The public
  parser already accepts only `title`, `visual`, and `notes` refresh kinds;
  implementation will delete the unreachable retired reset branch rather than
  add or preserve a command API.
