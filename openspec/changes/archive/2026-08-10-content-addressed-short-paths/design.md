# Design — Content-addressed short on-disk paths

## Context

See proposal.md — Why. Content-addressed immutable owner storage (Style Master iteration plan roots and nested candidate data; progressive page-production plans/batches/materializations/attempts/complete-reviews/accepted-evidence), plus the generated review roots `review/complete-page/<raw-plan-hash>` and `review/pilot/<batch-hash>`, currently name physical directories and files by the full 64-hex SHA-256. Human navigation already uses 8-char short references (`_generated/nav/`). BUG-063 deliberately deferred migrating the physical dirs; BUG-065 reverses that.

Constraints from the current harness:
- Every hash directory already contains a record that embeds the full SHA-256 (`work-plan.json` / `candidate-plan.json` / `batch.json` / `attempt.json` / `provenance.json` / `review-decision.json`). So the full hash is always recoverable from inside the dir.
- State, receipts, CAS heads, and every JSON payload keep the full 64-hex SHA as identity — those values MUST NOT change.
- Append-mostly / CAS-scoped semantics: plans, grants, attempts, and bytes are immutable; current authority derives from head CAS + records, never from directory order, timestamps, or filenames.
- The path layer is shared by pure and framed (both use `page_image_progressive_store.mjs` / `style_master_store.mjs`).
- `page-image-workflow-v1` is the sole supported Page Image protocol. `page-authority-image2-v2` is historical input that must retain the existing `unsupported-protocol/export` hard-stop; this change does not add a migration route for it.

## Goals / Non-Goals

Goals:
- On-disk `<hash>` directory and file names become the first 8 hex chars of their content-address SHA-256 (short names), deterministically derivable from the full hash.
- Lookup of any artifact by its full hash still works; record verification prevents a short-name collision from returning the wrong bytes.
- Existing 64-hex physical paths in real bundles can be migrated without breaking state/receipts/evidence.

Non-Goals:
- Changing the internal identity format (state/receipts/records keep full 64-hex SHA).
- Changing `_generated/nav/` display refs (already short).
- Renaming the spec/record VALUE fields (e.g., `plan_sha256` in JSON stays full).
- Migrating, adopting, or otherwise making a historical v2 run current.

## Decisions

### D1 — Short name = `fullHash.slice(0, 8)`

The on-disk name is the first 8 hex characters of the content-address. This matches the existing nav/art convention (`page_production_display_references.mjs` uses `.slice(0, 8)`) and is deterministic: given a full hash you can always derive the path, and given a short path you can always re-derive candidates.

Alternatives considered:
- **Base32/base64 encoding** — shorter per char but not hex, diverges from existing 8-hex convention, no benefit at this scale. Rejected.
- **Short-id registry mapping short→full** — introduces mutable global state, violates append-mostly/CAS and adds a single point of failure. Rejected.

### D2 — Collision: fail loudly, never silently overwrite

8 hex chars = 32 bits; collision probability for the handful of plans/batches per deck is negligible but must be handled safely.

- **Writer**: compute `name = hash.slice(0, 8)`. If `parent/name` does not exist → create. If it exists and its record embeds the same full hash → reuse. If it exists with a different full hash (true collision) → FAIL with a clear conflict error naming the colliding hashes; never overwrite and never re-derive a non-deterministic name.
- **Lookup**: given full hash, try `parent/hash.slice(0, 8)`; read the record and verify its embedded full hash matches. If absent or mismatched, fall back to `parent/<full hash>` (legacy pre-migration layout) and verify the same way. Resolution is deterministic (two candidates, both verified); no scan.

Alternatives considered:
- **Extend to 12/16 chars on collision** — makes the on-disk name non-derivable from the hash alone (depends on sibling set), complicating lookup. Rejected; keep names deterministic and let the astronomically rare collision fail loudly.
- **Always use 12+ chars** — violates the user's "8 chars" requirement. Rejected.
- **Append numeric suffix on collision** — non-derivable. Rejected.

### D3 — Centralize short-name logic in one shared module

Add the short-name derivation + collision-aware resolution to `scripts/shared/image2/content_address_store.mjs` (new leaf, mirroring `page_image_paths.mjs`'s dependency-free style):

- `shortName(fullHash, prefixLen = 8)` → `fullHash.slice(0, prefixLen)`.
- `resolveStorePath(parentDir, fullHash, { recordHashReader })` → returns the on-disk path by trying the 8-character name and then the legacy full name, reading the record to verify either result; it never scans siblings or chooses an extended name.
- `planStoreDirName(parentDir, fullHash, { recordHashReader })` → the write-time name (existing matching record → reuse; different record under the same 8-character name → conflict).

Both `page_image_progressive_store.mjs` and `style_master_store.mjs` call this instead of `join(parent, fullHash)`. `recordHashReader` is the store-specific function that extracts the full hash from a dir's canonical record (`work-plan.json` / `candidate-plan.json` / `batch.json` / `attempt.json` / `provenance.json`).

Alternatives considered:
- **Duplicate the logic in each store** — divergence risk. Rejected; one leaf, two callers.

### D4 — Lock files share the short form

Only a lock whose name is derived from a content address changes: `.${plan_sha256}.lock` / `.${provenance.sha256}.lock` become `.${shortName}.lock` using the same derivation. Fixed semantic lock names such as `.head.lock`, `.attempt.lock`, and `.image.lock` are not hash-derived and remain unchanged. Lock identity is per-parent, so an 8-char name is sufficient and collision handling is identical to D2.

### D5 — Enumeration reads records, not names

Code that enumerates `plans_root` by `readdir` (e.g., progressive store list/head scan, style master scope scans) already reads records to identify plans. With short names, those readers MUST key on the record's full hash, never the directory name. Most already do; audit every `readdirSync(...plans_root...)` site to confirm it derives identity from the record, not the dirname.

### D6 — Lookup back-compat during migration

During/after migration, a parent may hold a mix of old 64-hex dirs and new short dirs. `resolveStorePath` therefore: try `parent/shortName` → if absent, try `parent/fullHash` (legacy) → in both cases verify the record's full hash. This makes reads work on migrated and unmigrated trees, so the migration tool can run per-bundle without breaking in-flight work.

### D7 — Migration is an exact-run, coordinated owner operation

`migrateCurrentRunContentAddresses({ runDir })` is the sole sanctioned non-public owner operation. It accepts only one exact version directory, runs `inspectWorkflow({ runDir })` before reading any owner artifact, and continues only when that inspection establishes one current `page-image-workflow-v1` Pure or Framed source/state pair. An unsupported or unresolved result returns its bounded owner-issued action without scanning `3_versions/`, selecting another version, or reading legacy artifacts. A deck with multiple current v1 versions is migrated through separately explicit invocations.

For the selected `runDir`, the owner walks only records whose bound `run_version` equals that directory's version name, plus that exact run's generated `review/complete-page/<hash>/` and `review/pilot/<hash>/` roots. It first acquires one short-lived, deck-root `.content-address-migration.lock` directory; a second migration therefore fails before writes. It then recursively scans every affected container for an existing owner resource lock. Any such lock is a hard-stop with no renames, because it represents a live or unproven concurrent mutation; the nearest recovery is to wait for that owner to finish and rerun the migration. It does not skip, rename, or remove locks.

Every affected Style Master, progressive raw, and complete-page/pilot review writer SHALL participate in the same protocol: acquire its existing resource lock (or add the missing resource lock for a publisher that has none), then check the deck-root migration lock before it reads or writes the addressed location. If it finds the migration lock, it releases its resource lock and fails with the owner-issued migration-in-progress diagnostic. This ordering closes both races: a migration sees a writer already in flight through its resource lock; a writer arriving after migration acquisition sees the deck lock before it mutates.

Before the first rename, it constructs one complete child-first rename plan. The plan uses the normal canonical record parser and typed validator for each owner record, confirms the full hash and exact run binding, verifies every derived-review evidence binding, rejects a symbolic link or an unexpected noncanonical container, and proves every short target is absent and unique within its parent. A collision, malformed record, unexpected entry, or failed preflight leaves the physical tree unchanged.

It then executes that plan child-first. After every rename it rereads the canonical record/evidence through its new path and verifies the same full identity and byte hash. An ordinary execution error rolls already-completed renames back in reverse order while the migration lock remains held. If process interruption or an unrecoverable rollback leaves a mixed tree, no state or record bytes have changed; the verified short-first/full-name fallback keeps it readable, and the owner reports `migration_recovery_required` with the one legal action to rerun only after the lock condition is resolved.

It never touches state, receipts, or record bytes; it only renames physical paths. It is idempotent: already-short names are verified and skipped.

### D8 — Migration stays an Agent-owned private owner API

The operation is exported by `scripts/shared/image2/content_address_migrate.mjs` as `migrateCurrentRunContentAddresses({ runDir })`. The Agent invokes that exported operation only after it has selected the exact run; callers do not supply a workflow, hash, physical path, or mutation override. Its only result is a bounded structured owner report (`run_version`, `workflow`, renamed/skipped counts) or a typed bounded failure (`unsupported-protocol/export`, `migration_locked`, `migration_collision`, `migration_record_mismatch`, `migration_layout_invalid`, or `migration_recovery_required`). It performs no provider work and writes no state/receipt/evidence bytes.

No public `ppt_flow` grammar, CLI stdout envelope, `image2` / `style-master` flag, or new `cli-surface` delta is introduced. This keeps the one-off physical-layout repair out of normal public lifecycle commands while retaining a named, testable, owner-controlled invocation rather than an ad-hoc filesystem script.

## Risks / Trade-offs

- [8-char collision during migration] → fail before overwriting either record, name both full hashes, and leave the parent unchanged. The nearest recovery is to preserve the existing bundle and create a new collision-policy change if the product later requires more than eight characters.
- [Migration overlaps an owner mutation] → the deck-root coordination lock plus each writer's resource lock makes the overlap visible before either mutation can proceed; the Agent waits for owner completion and reruns the same migration checkpoint.
- [A malformed, noncanonical, symlinked, or colliding entry appears late in a large tree] → construct and validate the complete rename map before the first rename; report the first direct failure with zero path changes.
- [Filesystem failure occurs while executing a validated rename map] → reverse completed moves while the deck lock is still held; an interruption or failed reversal preserves full-hash identity and has one recovery path: resolve the lock condition and rerun the owner operation against the mixed but readable tree.
- [Lookup misses if a record is temporarily absent (partial write)] → writers publish atomically (already the contract); lookup treats a missing/unverifiable record as not-found, never guessing.
- [Existing tests assert full-64-hex paths] → update store unit tests to assert exact `slice(0,8)` names, collision failure, and legacy fallback; add migration tests on a fixture bundle.
- [Nav/art copies reference short names already; physical short names must match] → artifact-view already copies to `_generated/nav/` by short ref; verify a migrated bundle still rebuilds the nav with the same short refs (the refs are derived from the same full hashes).

## Migration Plan

1. Land the shared module (D3) + store changes (D1/D2/D4/D5) with back-compat lookup (D6). Existing bundles keep working (old dirs found via legacy fallback).
2. Add the exact-run private owner API (D8), the deck-root migration-lock protocol, and the complete preflight/rollback behavior with the required `run-bundle-layout` delta and tests on a copy of a supported current v1 bundle.
3. Run `npm test` (regression) + migrate that copy, then `validate`/`build`/`artifact-view` for both current Pure and Framed scopes to confirm receipt chains and nav still resolve.
4. After explicit user confirmation, invoke the owner operation once for each intended exact current v1 run in the real bundle; it never selects a sibling version itself.
5. Rollback: migration is a rename; reverting means renaming back (or re-cloning the bundle). State/receipts are untouched, so any read path is safe before/after.

## Decision Status

The migration invocation is deliberately settled by D8. No public CLI route is added, so the current accepted `image2` and `style-master` command-family boundary remains unchanged.
