# Tasks — Content-addressed short on-disk paths

## 1. Shared short-name module

- [x] 1.1 Create `scripts/shared/image2/content_address_store.mjs` with `shortName(fullHash)`, a write-time resolver that exact-replays a matching record or fails on an occupied short name, and a read-time resolver that verifies the short result before falling back to the legacy full name. Export for both stores; do not scan siblings or create extended names.
- [x] 1.2 Add unit tests for the module: exact 8-character name, occupied-prefix collision failure without overwrite, record-verified short resolution, and legacy 64-hex fallback.

## 2. Progressive raw store

- [x] 2.1 In `scripts/shared/image2/page_image_progressive_store.mjs`, route plan/batch/materialization dirs and attempt/accepted-evidence/complete-review file names through the short-name module instead of `join(parent, fullHash)`.
- [x] 2.2 Change only content-address-derived `.lock` names (such as `.${plan_sha256}.lock` and `.${provenance_sha256}.lock`) to the short form; retain fixed semantic locks such as scope-head/CAS locks unchanged.
- [x] 2.3 Audit every `readdirSync(...plans_root...)` / plans_root enumeration site: derive plan identity from the record's full hash, never the directory name.
- [x] 2.4 Make every affected progressive writer acquire its resource lock and then fail before addressed reads/writes when the deck-root `.content-address-migration.lock` exists; retain its existing resource-lock behavior otherwise.

## 3. Style master store

- [x] 3.1 In `scripts/shared/image2/style_master_store.mjs`, route the SHA-named plan root through the short-name module. Keep `candidates/<candidate_id>` unchanged because `candidate_id` is the bounded `candidate-NNN` or `local-existing` identifier, not a content address.
- [x] 3.2 Verify fixed Style Master scope/attempt/image lock names are not content-address-derived and remain unchanged; add/adjust a focused regression assertion where the store tests cover lock behavior.
- [x] 3.3 Audit scope/plan enumeration sites to key on the record's full hash.
- [x] 3.4 Make every affected Style Master writer acquire its resource lock and then fail before addressed reads/writes when the deck-root `.content-address-migration.lock` exists; add a resource lock for staged plan publication if it has none.

## 4. Complete-page review derived paths

- [x] 4.1 Route both `_generated/page_image_workflow/review/complete-page/<raw-plan-hash>/` and `review/pilot/<batch-hash>/` through the short-name module in `page_image_complete_page_review.mjs`. Keep their `provider-page/`, `complete-page/`, and slide-ID children unchanged because they are not content-address names.
- [x] 4.2 Confirm `_generated/nav/` short references still resolve to the (now short-named) immutable sources via `artifact-view`.
- [x] 4.3 Add a resource lock around each complete-page/pilot review publisher and make it check the deck-root migration lock before writes.

## 5. Migration tool

- [x] 5.1 Add `migrateCurrentRunContentAddresses({ runDir })` in `scripts/shared/image2/content_address_migrate.mjs`. Before any owner-artifact read, use `inspectWorkflow({ runDir })` to require one exact supported current v1 Pure/Framed run; never scan `3_versions/` or select a sibling. Migrate only records bound to that exact version plus its complete-page/pilot review roots.
- [x] 5.2 Have that owner acquire deck-root `.content-address-migration.lock`, recursively preflight all affected containers for owner resource locks/symlinks/unexpected entries, and construct a complete child-first rename map with typed canonical-record/evidence validation and every target collision check before the first rename. No failed preflight may rename an entry.
- [x] 5.3 Execute the verified map child-first, reread and byte/identity-verify every renamed result, reverse completed renames on an ordinary execution failure, and return a typed `migration_recovery_required` outcome for interruption or failed rollback. It never writes state, receipts, or evidence records.
- [x] 5.4 Keep invocation private and Agent-owned: export the named owner API with bounded report/failure results, do not add a `ppt_flow` command or a migration flag to `image2` / `style-master`, and update only the `run-bundle-layout` contract for this owner behavior.
- [x] 5.5 Add migration tests on a supported-v1 fixture bundle: exact-run selection with no sibling scan, v2 early hard-stop without owner-artifact reads, byte-identical rename, record/evidence verification, idempotent rerun, collision failure without overwrite, recursive owner-lock preflight failure without mutation, writer/migration interleaving in both lock acquisition orders, and execution rollback/recovery behavior.

## 6. Regression and verification

- [x] 6.1 Update any existing store tests that assert full-64-hex physical paths.
- [x] 6.2 Run `npm test` (full regression) and fix fallout.
- [x] 6.3 On a copy of a supported current-v1 bundle for each selected Pure and Framed scope, invoke `migrateCurrentRunContentAddresses({ runDir })`, then run `ppt_flow validate` + `build` and `image2 artifact-view`; confirm receipt chains, delivery, and nav resolve with short names. Confirm a v2 input retains `unsupported-protocol/export` without migration and no sibling version was selected.
- [ ] 6.4 Report results; on user confirmation, run the migration on the real `deck_dark_factory_current`.

## 7. Archive and versioning

- [x] 7.1 After merge/verification, archive BUG-065 per `_backlog/bugs/README.md` and update `_done/_fixed_bugs/README.md` (Next available bug ID) plus `_backlog/_done/README.md` counts.
- [x] 7.2 Run `openspec archive` for this change and, per CLAUDE.md version rules, propose a version bump (MINOR/PATCH) for the user to confirm.
