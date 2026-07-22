## Context

Image Production has two adapters but three incompatible control shapes: visual-slot code and
state use `image2-refinement`, whole-page code lives beneath iteration, and mode legality is partly
encoded by directory/module names. The prior control change is now the only caller-facing
observation seam; this change must preserve its action, diagnostic, and mutation contracts.

## Goals / Non-Goals

**Goals:**
- Make `04-image-production/{whole-page,visual-slot}` the physical and terminology owner.
- Preserve public CLI, bytes, provenance, authorization, CAS/journal/recovery, and markerless behavior.
- Migrate only visual-slot durable state with an atomic, fail-closed compatibility path.

**Non-Goals:**
- Change `image2-only` semantics, provider scope, final-page authority, or delivery review.
- Add a new workflow cache, generic Image Production state, path shim, or production-data migration.

## Decisions

### D1 - Two adapters, one taxonomy
**Owner: framework layout and adapter interfaces.** `04-image-production` contains separate public
whole-page and visual-slot adapters. Numeric module identity never determines legality: explicit
mode and current-delivery predicates do. Whole-page may start from visual system for `image2-only`;
visual-slot requires `html-then-image2` plus current HTML delivery.

### D2 - Move first, then remove old paths
**Owner: JS module boundary.** Wire-preserving moves retain public `ppt_flow` routing and observable
output while imports change only through public adapter interfaces. Tests prove direct executable
inventory, output bytes/fingerprints, provider-load isolation, receipts, and recovery before old
paths are deleted. No compatibility import shim survives the change.

### D3 - Visual-slot record is an atomic state migration
**Owner: state.** Observation is new-first/old-fallback and never writes. For one exact version, a
legacy v1 record normalizes its omitted `prerequisite_waiver` to `null`; both legacy v1/v2 records
normalize to `{run_version, plan, authorization, attempts, reviews, prerequisite_waiver}`. A current
record must additionally have `adapter: visual-slot`. Both records may coexist only when that complete
canonical projection is equal; malformed records or a difference hard-stop with state repair.

The first non-deletion state-owner mutation writes `nodes.image-production.by_version` with schema
`pptmaker-image-production-state-v1` and `adapter: visual-slot`, then removes the old exact-version
record in the same expected-state/CAS write, preserving all other versions. A terminal decline removes
both exact-version records in its one CAS write and does not create an empty replacement. Promotion
journals bind the complete pre/post state bytes: recovery completes only the already-bound new record,
never performs a fresh compatibility migration. Active attempts, promotion recovery, provenance, and
final review remain governed by their existing direct owners.

### D4 - Governance needs a failure story
**Owner: framework charter.** The canonical `tests/contracts/framework-governance-ledger-v1.json`
records every audited blocking framework rule with source, protected invariant, concrete failure story,
direct owner, nearest recovery action, classification, and retain/remove/advisory disposition. Each
remaining blocking architecture rule states its protected invariant and nearest owner action. Rules
without one are removed or advisory. Import direction, private-boundary, provider-isolation, and
production-data rules remain blocking.

## Risks / Trade-offs

- [Move misses a private import] -> executable inventory and import-boundary tests fail before deletion.
- [Dual state diverges] -> observe fails closed; no caller chooses a record.
- [Terminology migration changes whole-page semantics] -> mode/adaptor matrix tests isolate authority.
- [Governance cleanup weakens safety] -> every retained rule has a focused negative failure test.
- [Taxonomy rename leaks into callers] -> public `ppt_flow` grammar, envelopes, diagnostic codes, and
  existing workflow-inspection owner/action identifiers remain compatibility projections; their legacy
  spellings are recorded exceptions until a separately scoped public-contract change retires them.

## Migration Plan

1. Capture current routes, bytes, public control fields, records, and legacy-token exceptions.
2. Land adapter relocation with public behavior parity, then remove old paths.
3. Add dual-read/CAS visual-slot record migration and compatibility fixtures.
4. Update docs/specs/governance only after behavior passes focused and full regression.
5. Rollback restores the prior implementation; no user state is hand-edited or migrated backward.
