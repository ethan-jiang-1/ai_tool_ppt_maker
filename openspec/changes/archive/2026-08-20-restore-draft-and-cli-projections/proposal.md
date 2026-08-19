## Why

Five defects on a first Pure run make the Agent-facing machine surface tell a
second story. `--check` on a Deck root walks `deckRoot()` off the bundle and
reports `harness_binding_invalid` although CONSTITUTION already requires
`--check <3_versions/vN>`. A source that has selected `framed|pure` with no
`production_identity` for that version is the declared fresh authoring draft in
`workflow-inspection` and `pipeline-orchestration`, yet inspection and
`state --json` emit `current-protocol-invalid`. `ppt_flow init` and
`bundle_layout --init` print different Next lines. `status` invents a
build/refresh list instead of consuming `workflow_inspection.primary_action`.
`style-master inspect` dumps JSON and rejects `--json`, against the registered
success-report contract.

These are implementation drifts, not new product behavior. Maintainer 2026-08-20
kept the CLI as an Agent machine surface and locked this change to those five
bugs only.

## What Changes

- `--check` admits only an exact `3_versions/vN` run-dir before binding. A Deck
  root or other non-run-dir is existing `usage` that names `3_versions/vN`. A
  genuine run-dir whose locator fails remains the binding hard-stop.
- Source `production.workflow ∈ {framed,pure}` with no
  `production_identity.by_version` entry for that version is a declared fresh
  authoring draft when the existing draft resolver accepts the pair. Inspection
  and `state` keep the narrative / paginate-apply owner action. They do not
  recategorize that pair as protocol repair. If the draft resolver returns
  null, the existing protocol hard-stop remains. This change does not add an
  unproduced-v1 reset.
- `ppt_flow init` and `bundle_layout --init` emit the same Next sentence already
  used by init: `Next: ppt_flow.mjs status <v1Path>`.
- Human `status` prints Next from `workflow_inspection.primary_action` the same
  way `state` already does. `status --json` additively includes
  `workflow_inspection`. They do not keep a parallel build/refresh table.
  `build` success copy is unchanged.
- `style-master inspect` registers `--json`. Default remains JSON. `--json` is
  the JSON renderer of the same owner result, not USAGE.

Not in this change: cursor rewind (`project-cursor-to-owner-checkpoint`),
unproduced v1 reset (`reset-unproduced-v1`), Image2 transport capability
(`bind-image2-transport-capability-vector`), Gate glosses, prices, PAGE CLASS
body closed-set, `known_failure` exit-code change, teaching `--check` to accept
a Deck root.

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `run-bundle-management`: `--check` validates run-dir target shape before
  Harness-binding diagnosis; `bundle_layout --init` Next matches `ppt_flow init`.
- `workflow-inspection`: a selected `framed|pure` source with no identity record
  for that version remains a declared fresh authoring draft.
- `cli-surface`: init Next is one sentence; `status` Next is
  `workflow_inspection.primary_action`; `style-master inspect` accepts `--json`.

## Impact

- Harness source: `ppt_maker_harness/scripts/shared/run-bundle/bundle_layout.mjs`
  (`--check` target shape, `--init` Next),
  `scripts/shared/cli/commands/init.mjs` (keep the existing Next sentence as the
  single source), `scripts/shared/cli/command_support.mjs` (`printStatus` /
  status JSON `workflow_inspection`), `scripts/shared/cli/commands/style-master.mjs` and
  `scripts/ppt_flow.mjs` (`style-master inspect --json`),
  `scripts/shared/workflow/inspect_workflow.mjs` and
  `scripts/shared/state/target_authoring_draft_route.mjs` (draft route after
  workflow selection). Optional CONSTITUTION/`COMMANDS.md` only if they still
  document the old `--init` Next.
- Control owner: JS owns target-shape diagnosis, draft-route classification,
  and CLI renderers. MD Controller node graph is unchanged. Agent still
  translates Purpose/Outcome/Next (`harness-charter`).
- Run-bundle contract: `none`. No `deck_*` migration. Existing v1 with identity
  behaves as today.
- Policies: `openspec/policies/human-centered-gates.md` — wrong `--check`
  target is `guide` (usage); real binding failure stays `hard-stop` protecting
  Deck-to-Harness identity; selected-workflow draft is `guide`/`confirm` on the
  existing narrative/workflow owners, not protocol `hard-stop`.
  `openspec/policies/agent-assistance-and-control.md` — inspection remains the
  one owner action; Agent does not hand-edit state.
  `openspec/policies/simple-reliable-control.md` — status Next reuses
  inspection instead of a second step list; `--check` fails at target shape
  before a competing binding projection.
- Tests: focused `tests/` for `--check` target shape, selected-workflow draft
  inspection/`state`, style-master `--json`, init Next identity, and status Next
  from `primary_action`. No production `deck_*` fixtures. `tests_e2e/` only if
  an existing fixture already covers the observation path.
- Verification: `openspec validate --strict --change restore-draft-and-cli-projections`
  and the touched `tests/` suites.
