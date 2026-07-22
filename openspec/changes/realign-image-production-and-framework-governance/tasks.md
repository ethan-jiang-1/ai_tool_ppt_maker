## 1. Baseline And Adapter Contracts
- [ ] 1.1 Capture the pre-move executable/import inventory, direct-output bytes/fingerprints, public CLI envelopes, and workflow-inspection owner/action fields.
- [ ] 1.2 Define and validate the legacy-token exception inventory with token/path, reason, owner, public-compatibility status, and removal trigger.
- [ ] 1.3 Add mode/dependency matrix fixtures for image2-only whole-page and html-then-image2 visual-slot entry, including proof that numeric module metadata cannot create legality.

## 2. Wire-Preserving Realignment
- [ ] 2.1 Move visual-slot and whole-page code into `04-image-production/{visual-slot,whole-page}` public adapters; update public imports and remove retired paths only after parity passes.
- [ ] 2.2 Move all registered direct executable paths and executable/source-to-test inventories; retain no old-path shim and keep the `ppt_flow` grammar, envelopes, diagnostic codes, and direct-output behavior unchanged.
- [ ] 2.3 Keep provider-load isolation, receipts, provenance, markerless behavior, and whole-page direct authorization/final-review owners unchanged through the move.
- [ ] 2.4 Make controller/readers use explicit mode and dependency predicates rather than directory/module order, while preserving public workflow-inspection compatibility identifiers.

## 3. Durable State Migration
- [ ] 3.1 Add non-mutating new-first/old-fallback visual-slot reads, exact record validation, and canonical equality over run version, plan, authorization, attempts, reviews, and normalized prerequisite waiver.
- [ ] 3.2 Migrate the first non-deletion visual-slot state mutation through one expected-state/CAS write to `image-production` schema v1/`adapter: visual-slot`, deleting only the old exact-version record; make terminal decline delete both exact-version records without creating an empty replacement.
- [ ] 3.3 Bind promotion journals and recovery to complete pre/post state bytes across migration; recovery must finish only a bound transaction and never synthesize a migration.
- [ ] 3.4 Cover old-only, new-only, equal dual, conflicting/malformed dual, wrong-adapter current record, active attempt, promotion journal, crash/restart, CAS conflict, terminal decline, and wrong-owner no-mutation cases.

## 4. Governance And Validation
- [ ] 4.1 Update specs, charter, workflow, playbooks, commands, CLI/direct-entry inventories, and exception list to use Image Production as the active family while retaining explicitly cataloged public compatibility fields.
- [ ] 4.2 Add and validate `tests/contracts/framework-governance-ledger-v1.json`; audit every blocking governance rule for source, protected invariant, concrete failure story, direct owner, nearest action, classification, and retain/remove/advisory disposition, then remove or demote unjustified rules.
- [ ] 4.3 Run focused adapter/state/CLI suites, static import and direct-entry audits, full `npm test`, E2E routing coverage, strict OpenSpec validation, `git diff --check`, and production-data scope audit.
