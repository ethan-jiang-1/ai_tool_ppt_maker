## 1. Baseline And Adapter Contracts
- [ ] 1.1 Capture the pre-move executable/import inventory, direct-output bytes/fingerprints, public CLI envelopes, and workflow-inspection owner/action fields.
- [ ] 1.2 Extend the existing `scripts/contracts/framework_coherence.mjs` exception registry and its validators with exact legacy-token entries containing token, file/path, reason, owner, public-compatibility status, and `retire_by: change:<name>|release:<version>|not-applicable:<protected-invariant>`; reject broad or malformed exceptions.
- [ ] 1.3 Add mode/dependency matrix fixtures for image2-only whole-page and html-then-image2 visual-slot entry, including proof that numeric module metadata cannot create legality.

## 2. Wire-Preserving Realignment
- [ ] 2.1 Move visual-slot and whole-page code into `04-image-production/{visual-slot,whole-page}` public adapters; update every caller to the public adapter, keep private transports/provider clients lazy and adapter-local, and remove retired paths only after parity passes.
- [ ] 2.2 Move all registered direct executable paths and executable/source-to-test inventories; retain no old-path shim and keep the `ppt_flow` grammar, envelopes, diagnostic codes, and direct-output behavior unchanged.
- [ ] 2.3 Keep provider-load isolation, receipts, provenance, markerless behavior, and whole-page direct authorization/final-review owners unchanged through the move.
- [ ] 2.4 Make controller/readers use explicit mode and dependency predicates rather than directory/module order, while preserving public workflow-inspection compatibility identifiers.

## 3. Durable State Migration
- [ ] 3.1 Add non-mutating new-first/old-fallback visual-slot reads, exact record validation, and canonical equality over run version, plan, authorization, attempts, reviews, and normalized prerequisite waiver; route `ppt_flow` status/state, workflow inspection, completion projection, and every state validator through that one reader while retaining documented public compatibility fields.
- [ ] 3.2 Audit and migrate every visual-slot state writer (generic state helper; plan/authorization/attempt/reconciliation updates; style-reference and visual-slot promotion; accept/use-html/cleanup/decline) through one expected-state/CAS path to `image-production` schema v1/`adapter: visual-slot`; delete only the old exact-version record on non-deletion mutation and delete both exact-version records on terminal decline without creating an empty replacement.
- [ ] 3.3 Bind promotion journals and recovery to complete pre/post state bytes across migration; recovery must finish only a bound transaction and never synthesize a migration.
- [ ] 3.4 Cover old-only, new-only, equal dual, conflicting/malformed dual, wrong-adapter current record, `repair_state` hard-stop with bytes preserved, active attempt, promotion journal, crash/restart, CAS conflict, terminal decline, wrong-owner no-mutation, and rollback-safe dual-reader/forward-recovery cases; prove ordinary observation leaves top-level schema v5 and state bytes unchanged.

## 4. Governance And Validation
- [ ] 4.1 Update specs, charter, workflow, playbooks, commands, CLI/direct-entry inventories, and exception list to use Image Production as the active family while retaining explicitly cataloged public compatibility fields.
- [ ] 4.2 Add and validate `tests/contracts/framework-governance-ledger-v1.json`; audit every blocking governance rule for source, protected invariant, concrete failure story, direct owner, nearest action, classification, and retain/remove/advisory disposition, then remove or demote unjustified rules.
- [ ] 4.3 Run focused adapter/state/CLI suites, static import and direct-entry audits, full `npm test`, E2E routing coverage, strict OpenSpec validation, `git diff --check`, and production-data scope audit.
