# Cleanup Program

The program uses exactly three OpenSpec changes. Internal workstreams are
nested inside those changes so the program pays the OpenSpec lifecycle cost
three times, not once per finding.

The live execution view is `progress-plan.md`. This file explains why the
remaining findings fit those three change boundaries.

## Change 1 - Repair The Active Authority Map

Name: `converge-active-harness-authority`

Scope:

1. Make the config capability registry mechanically match current main specs.
2. Replace nonexistent implementation authorities with current public owners.
3. Remove stale lifecycle numbers, compatibility aliases, Chain aliases, and
   old pipeline framing from active OpenSpec context.
4. Replace frozen-identifier compatibility framing with current-contract
   terminology.
5. Add falsifiable registry and literal-path guards.

Closure: complete and archived.

## Change 2 - Retire Historical Protocol Surfaces

Name: `retire-historical-protocol-surfaces`

Scope:

1. Delete the empty `html-slide-rendering` capability after proving retained
   Framed runtime ownership.
2. Replace named historical protocol tombstones with generic current-only
   contracts.
3. Converge unsupported-input recovery on one owner-issued action taxonomy.
4. Update runtime, specs, Controller guidance, fixtures, and tests atomically.
5. Add a bounded residue guard that distinguishes protocol identity from normal
   `3_versions/vN` Work Version notation.

Closure: no retired protocol/action vocabulary remains active; invalid current
identity preserves bytes and performs no provider or mutation work.

## Change 3 - Converge Agent Control Surfaces

Name: `converge-agent-control-surfaces`

This final change combines three dependent workstreams under one terminal
invariant: guidance, Controller metadata, route discovery, and persisted
production identity expose one attributable control model with no competing or
unexplained authority.

### Workstream A - Remove Competing Routes

1. Delete the orphan prompt cookbook.
2. Absorb any unique current invariant from duplicate workflow-inspection prose
   and delete those projections.
3. Decide and remove or explicitly justify the Intent Route Catalog as one
   complete family.
4. Add falsifiable reachability/orphan controls.

### Workstream B - Close Controller Metadata

1. Define exact allowed keys for Controller, shared-node, and fenced-node
   metadata.
2. Reject stale, misspelled, duplicate, and undeclared keys.
3. Keep `method_module` as the sole lifecycle-location declaration.
4. Replace silent legacy acceptance with planted negative controls.

### Workstream C - Decide And Enforce Singleton Production Identity

1. Inventory every `production_mode` reader, writer, persisted field,
   Controller key, CLI surface, schema anchor, and test.
2. Model negative and recovery paths and compare exact concept subtraction.
3. Decide during Change 3 planning whether to collapse or deliberately retain
   the singleton layer.
4. If collapsed, perform one clean cutover with no migration or compatibility
   reader. If retained, prove its distinct invariant, owner, consumers, failure
   path, and guard.

The decision does not create a fourth OpenSpec change. Its accepted outcome is
captured in Change 3 specs/design/tasks before artifact validation.

## Guard And Verification Rule

Falsifiable drift guards are implementation tasks inside the owning change,
not a separate batch. Each change must pass focused tests, `npm test`,
`npm run test:sweep`, strict OpenSpec validation, scoped residue searches, and
`git diff --check` before archive and ordinary Git closure.

## Change-Count Rule

The total is fixed at three. A fourth change may be introduced only after an
explicit project-owner decision records a concrete ownership or safety conflict
that cannot be closed inside Change 3. Finding more files or more test work is
not by itself a reason to split the change.
