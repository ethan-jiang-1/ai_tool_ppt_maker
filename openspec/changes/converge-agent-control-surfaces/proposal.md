## Why

The active Harness still exposes several historical or competing Agent control
surfaces: an unconsumed prompt cookbook, duplicate workflow-inspection prose,
and an Intent Route Catalog whose reader is only exercised by its own contract
test. Controller metadata also accepts undeclared keys silently, while the
singleton `production_mode` stores a fixed mode literal beside the state facts
that actually establish a version's identity and invalidation epoch.

This final cleanup change makes every surviving control surface attributable to
one current owner. It removes a fixed-value state dialect without weakening the
source/state identity hard-stop, gives Controller metadata a closed grammar,
and leaves one direct route from human intent to its owning Controller or CLI.

## What Changes

- **BREAKING** Remove the orphan Agent prompt cookbook, duplicate
  workflow-inspection prose projections, and the Intent Route Catalog family
  (JSON, reader, schema declaration, tests, and competing guidance). Preserve
  their unique current invariants in the owning Controller, command, inspection,
  and machine-ledger surfaces before deletion.
- **BREAKING** Make Controller, shared-node, and fenced-node frontmatter closed
  grammars. Reject undeclared, stale, misspelled, duplicate, or ambiguous
  metadata before an index, draft route, or Controller handoff is produced.
  `method_module` remains the sole lifecycle-location declaration.
- **BREAKING** Replace persisted `production_mode.by_version` records with the
  state-owned `production_identity.by_version` record
  `{ workflow, source_epoch }`. The Page Image source remains the authority for
  `production.pipeline` and `production.workflow`; the identity record is the
  state-owned, per-version workflow agreement and invalidation fence. No
  compatibility reader, conversion, or Run Bundle scan is introduced.
- Update direct CLI/status, Controller metadata, schema inventory, active
  guidance, state readers/writers, and tests as one clean cutover. Add bounded
  reachability, metadata, route-residue, and identity negative controls rooted
  only in active Harness maintenance surfaces.

The control path follows `openspec/policies/human-centered-gates.md`: malformed
Controller declarations and source/state identity disagreement remain existing
integrity hard-stops with one owner-issued repair path; this change adds no
confirmation, waiver, or human decision. Per
`agent-assistance-and-control.md` and `simple-reliable-control.md`, the Agent
continues deterministic parsing and diagnosis while the direct owners decide
state and lifecycle facts; deleting competing projections and a fixed singleton
is the net simplification.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cli-surface`: status and state CLI projections use the current
  production-identity contract and do not expose a retired mode dialect.
- `commands-reference`: discovery guidance routes directly to owning current
  Controllers and CLI without a parallel catalog.
- `harness-charter`: active Agent guidance names only current control owners and
  the source/state production-identity boundary.
- `node-specification`: Controller parsing has closed metadata grammars and
  State persists the minimal version identity fence.
- `playbook-execution`: Controller metadata and entry routing have one
  attributable current control model.
- `production-schema-conformance`: the serialization inventory and static
  guards reject removed control surfaces and stale state grammar.
- `run-bundle-management`: new current run state is seeded and validated using
  the production-identity record rather than a singleton mode.
- `workflow-inspection`: read-only inspection resolves the current source/state
  identity record without recreating a mode or using duplicate prose authority.

## Impact

Affected Harness source is limited to `ppt_maker_harness/`, `openspec/`,
`tests/`, `tests_e2e/`, root active guidance, and the authorized cleanup-plan
package. The MD-to-JS protocol changes only in its persisted current state and
CLI projection; no provider API or dependency changes are required. The
run-bundle impact is a deliberate clean break (`migration: none`): existing
production `deck_*` and research `dpt_*` data are neither read, treated as
fixtures, modified, nor migrated.
