# Findings

> Evidence window: current `master` on 2026-08-13. Archive was counted but not
> treated as active authority. No Run Bundle or research input was read.

## P0 - Active Authority Contradictions

### F1. OpenSpec config is a stale control plane

`openspec/config.yaml:113-125` points Agents to nine implementation files that
do not exist under the current script topology, including
`scripts/03-html-production/*` and `scripts/05-iteration/legacy-image2/*`.
Its capability registry omits seven existing main specs and registers
`header-lock`, for which no main spec exists.

The same context still teaches retired concepts at lines 142-167:

- a `Lifecycle Phase` hierarchy after the lifecycle numbering cleanup;
- `image_direct` / `normal` compatibility input;
- `Chain A/B/C` aliases and the retired `body+header-lock` framing;
- "current Phase" as the reading route.

This is the highest-noise surface because OpenSpec injects it directly into
future Agent work.

### F2. Frozen Identifier contradicts the current-only schema contract

`CONTEXT.md:167-175` says historical record schemas are read forever and claims
a frozen inventory exists in the Schema Definition Home.

That conflicts with:

- `production-schema-conformance/spec.md:28-32`, which forbids a frozen or
  replacement exception inventory;
- the same spec at lines 50-68, which forbids legacy readers, compatibility
  branches, scanners, converters, migrations, and historical fixtures;
- `schema/README.md:52-53`, which declares the definitions current-only.

With compatibility explicitly unnecessary, remove the historical-reader
concept. Preserve only genuinely current exact literals as current schema
contracts, without calling them a compatibility category.

### F3. Main specs retain retired-protocol tombstones

The active main-spec tree contains:

- the entire `html-slide-rendering/spec.md` retired-capability tombstone;
- `pipeline-orchestration/spec.md:151-163`, a v2-specific rejection;
- `image-production/spec.md:103-115`, another v2-specific rejection;
- `unsupported-protocol/export` in `commands-reference` and
  `playbook-execution`.

`v2` is also the ordinary name of a Work Version, so historical protocol prose
creates avoidable ambiguity. Current specs should state only the positive exact
current contract and generic undeclared-input behavior.

### F4. Unsupported-input recovery has multiple names and meanings

Current runtime guidance and `inspect_workflow.mjs:75-82` use
`repair-current-protocol-identity`. Main specs still require
`unsupported-protocol/export`; other paths use `repair-current-route`.

Even the same action ID has divergent `kind` values:

- `test_process_workflow_inspection.mjs:43`: `kind: export`
- `test_target_workflow_inspection.mjs:155`: `kind: repair`

Converge owner, action ID, action kind, human requirement, and byte-preservation
semantics. Do not retain a legacy action alias.

## P1 - Competing and Orphan Authority

### F5. `reference/agent-prompts.md` is an orphan competing process

The 192-line file has zero inbound filename references from active entry docs,
Controllers, implementation, specs, or tests. It tells Agents to substitute
variables and directly use six templates. That creates a prompt-driven path
beside the current narrative sources, visual registry, Controller, and compiled
provider-input owners.

Delete it. Git history is sufficient retention; current behavior already has
better owners.

### F6. Workflow inspection review prose duplicates machine authority

`reference/workflow-inspection-baseline.md` and
`reference/workflow-inspection-ledger.md` also have zero inbound filename
references. The ledger names `tests/contracts/workflow-control-ledger.json` as
machine authority, while its own prose still says "export hard-stop".

Before deletion, compare every unique invariant with the main
`workflow-inspection` spec and machine ledger. Absorb only missing current
requirements, then delete both prose records.

### F7. Intent Route Catalog is a parallel discovery authority

The static JSON catalog is elevated by `COMMANDS.md`, `AGENT_CONTRACT.md`, the
`commands-reference` spec, and the schema inventory. Its JS reader has no
production consumer: an 82-module literal-import reachability scan found 81
modules reachable from declared CLI/public/contract roots; only
`shared/workflow/intent_route_catalog.mjs` was unreachable and zero-inbound.
The reader and catalog are maintained by their own test.

This is not a one-file dead-code deletion. Review the whole capability and
prefer retiring the catalog, reader, schema declaration, test, and duplicated
guidance together if `COMMANDS.md` plus Controller/CLI routing already covers
the same first handoff.

## P1 - Guards That Cannot Support Their Claims

### F8. Docs coherence claims broader coverage than it implements

`test_process_docs_consistency.mjs:70-73` claims current guidance and all main
specs are free of retired protocol prose. `scanHarnessCoherence()` reads every
main spec into `activeSurfaceFiles`, but never evaluates that collection; it
only applies semantic checks to a small `CURRENT_CONTRACT_FILES` subset.

The focused test passes 6/6 while F1-F4 remain present. After cleanup, add
planted negative controls proving the guard catches:

- a missing/stale capability authority path;
- a retired capability tombstone;
- a named historical protocol version;
- a retired recovery action;
- a compatibility reader/alias claim in active guidance.

### F9. Controller frontmatter silently accepts stale keys

The playbook spec says `method_module` is the only lifecycle binding, but
explicitly leaves other unconsumed keys unspecified. Tests at
`test_md_controller_reader.mjs:243-271` require legacy `phase` to be silently
accepted and discarded.

For a high-signal Agent environment, silent no-op metadata is worse than a
clear failure. Make Controller and node frontmatter closed schemas, with exact
allowed-key negative controls. This is a boundary behavior change and belongs
in its own OpenSpec batch.

## P2 - Simplification Decisions, Not Yet Deletion Claims

### F10. Singleton production mode may be a redundant persisted dimension

`production_mode.mjs` exposes one legal mode (`image2-page-workflow`), one
engine, one refinement policy, one style-master policy, and one adapter, while
`production.workflow: framed|pure` is the actual version-level choice. The
mode/pipeline distinction appears across 51 active files and is consumed by
state, bundle layout, Controller reading, CLI, and tests.

It is not dead code. A separate design should determine whether removing the
singleton mode record and binding state directly to the current pipeline plus
`framed|pure` reduces more state/controller complexity than it creates. Because
compatibility is out of scope, an approved clean cutover can update all active
readers/writers/tests together without migration code or Run Bundle scanning.

### F11. Minor active residue still lowers spec and code signal

- `slide-identity-and-ordering/spec.md:4` still has an archive-generated
  `Purpose TBD`.
- `ppt_flow.mjs:15-17` comments point to nonexistent `lib/state.mjs` and
  `lib/cli_error.mjs`.
- test/test-E2E README files and architecture code still call numbered source
  owners "Phase" after the declared lifecycle cleanup. Deck-content examples
  that teach a presentation's business phases are not Harness terminology and
  must be excluded from mechanical replacement.

## Historical Search Noise

`openspec/changes/archive/` is valid frozen evidence and should remain. It has
108 changes, 1,040 files, and about 7.7 MB, versus 27 current specs at about
484 KB. Broad search therefore overweights historical vocabulary.

Do not delete the archive. Instead make active-surface search commands explicit
in Agent guidance (or adopt a repository search ignore only if OpenSpec tooling
and intentional archive research remain easy). Archive search must be opt-in,
not silently impossible.
