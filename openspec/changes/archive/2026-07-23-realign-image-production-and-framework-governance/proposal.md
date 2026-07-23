## Why

The framework exposes one Image Production family through two physically and semantically split
owners: visual-slot work lives in `04-image2-refinement`, while first-class whole-page production
lives under `05-iteration/legacy-image2`. This makes directory number look like workflow order,
leaves active `image2-only` production with a legacy-looking owner, and preserves a visual-slot
state wire that cannot name its adapter.

The completed workflow-inspection and control-interface changes now provide a stable control seam.
This change can therefore realign physical ownership and terminology without recreating workflow,
mode, authorization, or recovery authority.

## What Changes

- Introduce `image-production` as the capability family with distinct `whole-page` and
  `visual-slot` adapters. `04-` is a taxonomy, not a scheduler: `image2-only` may enter
  whole-page production from visual-system work, while visual-slot work requires current HTML
  delivery.
- Move the visual-slot module and the existing whole-page implementation into the family through a
  wire-preserving realignment. `05-iteration` retains mode-aware iteration and compatibility
  routing only; no permanent old-path shim remains.
- Migrate visual-slot durable state from the historical `image2-refinement` record to a versioned
  `image-production` record with `adapter: visual-slot`, using new-first/old-fallback observation,
  conflict failure, and one CAS mutation that writes new and removes old. Whole-page authorization,
  provenance, and final review retain their existing direct owners.
- Update playbook legality, main specs, CLI/direct-entry inventory, entry guidance, tests, and an explicit
  legacy-token exception inventory. Remove blocking governance rules that have no protected
  invariant and failure story; retain import, private-boundary, provider-isolation, and production-
  data rules.

**BREAKING:** Direct imports and documented paths under `04-image2-refinement` and
`05-iteration/legacy-image2` are retired after the realignment. Public `ppt_flow` command names,
arguments, envelopes, artifact bytes/fingerprints, and protected mutation semantics remain
compatible.

## Capabilities

### New Capabilities
- `image-production`: Adapter family taxonomy and cross-adapter invariants for whole-page and
  visual-slot production.

### Modified Capabilities
- `framework-directory-layout`: Replace active Image2-refinement directory ownership with the
  Image Production family and inventory intentional compatibility tokens.
- `framework-script-layout`: Define public phase interfaces and executable inventory after moving
  whole-page and visual-slot implementations.
- `framework-charter`: Align active terminology, progressive disclosure, and governance rules with
  Image Production while retaining protected invariants.
- `cli-surface`: Preserve the public `ppt_flow` grammar and envelopes while replacing the retired
  direct Image Production executable paths and inventory entries.
- `node-specification`: Define visual-slot record migration, dual-read conflict behavior, and CAS
  ownership without changing whole-page records.
- `playbook-execution`: Make adapter entry legality explicit by production mode and dependency,
  never directory number.
- `pipeline-orchestration`: Route current mode-owned adapters without importing their private paths
  or changing public CLI behavior.
- `visual-slot-refinement`: Preserve visual-slot authorization, attempt, promotion, and recovery
  behavior under the new adapter location.
- `image-generation`: Preserve whole-page provider authorization, raw-render provenance, and byte
  behavior while transferring implementation ownership out of iteration.

## Impact

- Framework-maintenance scope only: `PPTMAKER_FRAMEWORK/`, `openspec/`, `tests/`, and
  `tests_e2e/`; no `deck_*`, `dpt_*`, or `_generated/` production data is modified.
- Primary code surfaces are the Phase-4/Phase-5 module trees, state owner, controller reader,
  production routing, CLI import inventory, and ownership tests.
- The change follows `human-centered-gates`, `agent-assistance-and-control`, and
  `simple-reliable-control`: guide/confirm/hard-stop classifications and direct mutation owners do
  not move; every retained blocking rule needs a protected invariant and real failure story.
