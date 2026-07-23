## Implementation Log
> Last updated: 2026-07-23. Checkbox completion requires the complete task statement and its focused verification; the log records partial work so progress is visible without claiming an incomplete task is done.
>
> Completed in the current implementation pass:
> - Relocated Phase-4 source, workflow, unit, and E2E trees into `04-image-production/{whole-page,visual-slot}` and added the family public interface.
> - Updated executable inventory, source-to-test ownership inventory, and Phase-5 public forwarding; removed the physical retired trees without adding a shim.
> - Added the `image-production` visual-slot outer-record reader and state-owner mutation helpers; promotion and terminal decline now use them rather than mutating the legacy container directly.
> - Added an architecture rule for cross-adapter private imports and corrected the relocated load-closure expectations.
>
> Verified in this pass:
> - `npx vitest run tests/contracts/test_framework_architecture.mjs tests/contracts/test_docs_consistency.mjs --reporter=dot --silent` passed: 19/19.
> - `npx vitest run tests/shared/state/test_md_controller_reader.mjs --reporter=verbose` passed: 4/4.
> - `npx vitest run tests/05-iteration/test_generate_style_master.mjs tests/05-iteration/test_image_generation.mjs tests/05-iteration/test_stage3_lock_headers.mjs --reporter=verbose --silent` passed: 36/36.
> - `npx vitest run tests/contracts/test_image_production_relocation_baseline.mjs tests/contracts/test_framework_architecture.mjs --reporter=dot --silent` passed: 11/11.
> - Focused `ppt_flow`, state/refinement, and `vitest.e2e.config.mjs` Image Production runs completed without failures after the final state-report fix.
>
> In progress:
> - Apply is complete. BUG-034 remains separately tracked as a test-runner optimization item.

## 1. Baseline And Adapter Contracts
> Implementation status: complete. The pre-move commit/blob inventory and direct executable replacements are recorded in `tests/contracts/image-production-relocation-baseline-v1.json`.
- [x] 1.1 Capture the pre-move executable/import inventory, direct-output bytes/fingerprints, public CLI envelopes, and workflow-inspection owner/action fields.
- [x] 1.2 Extend the existing `scripts/contracts/framework_coherence.mjs` exception registry and its validators with exact legacy-token entries containing token, file/path, reason, owner, public-compatibility status, and `retire_by: change:<name>|release:<version>|not-applicable:<protected-invariant>`; reject broad or malformed exceptions.
- [x] 1.3 Add mode/dependency matrix fixtures for image2-only whole-page and html-then-image2 visual-slot entry, including proof that numeric module metadata cannot create legality.

## 2. Wire-Preserving Realignment
> Implementation status: complete. Relocation, public-interface routing, direct executable inventory, and mode-aware reader behavior passed focused adapter/CLI/E2E verification.
- [x] 2.1 Move visual-slot and whole-page code into `04-image-production/{visual-slot,whole-page}` public adapters; update every caller to the public adapter, keep private transports/provider clients lazy and adapter-local, and remove retired paths only after parity passes.
- [x] 2.2 Move all registered direct executable paths and executable/source-to-test inventories; retain no old-path shim and keep the `ppt_flow` grammar, envelopes, diagnostic codes, and direct-output behavior unchanged.
- [x] 2.3 Keep provider-load isolation, receipts, provenance, markerless behavior, and whole-page direct authorization/final-review owners unchanged through the move.
- [x] 2.4 Make controller/readers use explicit mode and dependency predicates rather than directory/module order, while preserving public workflow-inspection compatibility identifiers.

## 3. Durable State Migration
> Implementation status: reader, writer, promotion, and terminal-decline migration are complete; the remaining task is explicit edge-case coverage.
- [x] 3.1 Add non-mutating new-first/old-fallback visual-slot reads, exact record validation, and canonical equality over run version, plan, authorization, attempts, reviews, and normalized prerequisite waiver; route `ppt_flow` status/state, workflow inspection, completion projection, and every state validator through that one reader while retaining documented public compatibility fields.
- [x] 3.2 Audit and migrate every visual-slot state writer (generic state helper; plan/authorization/attempt/reconciliation updates; style-reference and visual-slot promotion; accept/use-html/cleanup/decline) through one expected-state/CAS path to `image-production` schema v1/`adapter: visual-slot`; delete only the old exact-version record on non-deletion mutation and delete both exact-version records on terminal decline without creating an empty replacement.
- [x] 3.3 Bind promotion journals and recovery to complete pre/post state bytes across migration; recovery must finish only a bound transaction and never synthesize a migration.
- [x] 3.4 Cover old-only, new-only, equal dual, conflicting/malformed dual, wrong-adapter current record, `repair_state` hard-stop with bytes preserved, active attempt, promotion journal, crash/restart, CAS conflict, terminal decline, wrong-owner no-mutation, and rollback-safe dual-reader/forward-recovery cases; prove ordinary observation leaves top-level schema v5 and state bytes unchanged.

## 4. Governance And Validation
> Implementation status: complete. Full E2E and all change-owned focused validation are green; BUG-034 is a separately tracked maintenance-runner defect and does not block this change.
>
> 4.3 verification ledger:
> - PASS: focused architecture/docs/governance/state/adapter/CLI suites, Image Production E2E, and full E2E (`10 files / 45 tests`).
> - PASS: strict OpenSpec validation, `git diff --check`, source-to-test inventory, direct-entry inventory, retired-path audit outside the exact legacy-token registry, and production-data scope audit.
> - EXCEPTION RECORDED: default `npm test` has no final summary or durable exit code in the maintenance runner. BUG-034 owns that runner defect; it does not block this change because all change-owned focused suites and the full E2E suite are green.
- [x] 4.1 Update specs, charter, workflow, playbooks, commands, CLI/direct-entry inventories, and exception list to use Image Production as the active family while retaining explicitly cataloged public compatibility fields.
- [x] 4.2 Add and validate `tests/contracts/framework-governance-ledger-v1.json`; audit every blocking governance rule for source, protected invariant, concrete failure story, direct owner, nearest action, classification, and retain/remove/advisory disposition, then remove or demote unjustified rules.
- [x] 4.3 Run focused adapter/state/CLI suites, static import and direct-entry audits, full `npm test`, E2E routing coverage, strict OpenSpec validation, `git diff --check`, and production-data scope audit.
