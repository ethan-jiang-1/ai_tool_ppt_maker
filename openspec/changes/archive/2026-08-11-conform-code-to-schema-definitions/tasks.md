## 1. Establish The One Current Contract

- [x] 1.1 Re-derive the complete active durable-contract inventory from `ppt_maker_harness/`, `tests/`, `tests_e2e/`, and `openspec/specs/`; include schema, protocol, pipeline, mode, identity, idempotency, locator, and contract-catalog values. Exclude only archived OpenSpec changes, `_backlog/`, dependencies, and Run Bundle/research data. Classify every finding as a C1 stage, a shared contract, an implementation-only invariant, or deletion.
- [x] 1.2 Add `ppt_maker_harness/schema/serialization-contracts.yaml` with the unversioned identifier grammar, Page Image selectors, C1 stage/`artifact_role` relations, shared-contract declarations, and reviewed owner anchors. Update `META.yaml`, the schema README, and the schema-contract test to make this inventory authoritative and explanatory.
- [x] 1.3 Delete `frozen-identifiers.yaml` and every active reference, test expectation, requirement, and README claim that preserves frozen, historical, legacy, compatibility, migration, dual-format, or version-suffixed production identifiers.
- [x] 1.4 Update the `harness-directory-layout` contract delta so the accepted schema-home requirement declares the serialization inventory rather than a frozen historical inventory.

## 2. Replace Active Serialization Owners

- [x] 2.1 Replace all Page Image source/state/receipt/record/protocol/mode/identity/idempotency literals with the declared unversioned values. Every Page Image `schema` field SHALL use its C1 stage name; add a declared `artifact_role` only where it distinguishes multiple concrete shapes under that stage. Preserve existing `kind` semantics.
- [x] 2.2 Replace directly affected shared-Harness locator and catalog literals with their declared unversioned contracts, and move any residual durable selector hidden in code into the inventory or delete it. Do not create an alternate declaration home.
- [x] 2.3 Delete legacy-only readers, byte scanners, special old-protocol rejection branches, compatibility fixtures, conversion/migration paths, and dual-writer assumptions. Unknown contract values fail through the normal current owner before writes, derived-artifact reads, or provider work.
- [x] 2.4 Refactor all active Harness templates, BOOTSTRAP/charter/workflow/playbook/reference guidance and unit/integration/E2E fixtures to the one current contract. Keep the C2 delta specs synchronized with those changes; do not modify archived OpenSpec artifacts, Backlog history, Run Bundles, or research inputs.

## 3. Enforce Static Conformance Without A Runtime Controller

- [x] 3.1 Extend `scripts/contracts/harness_architecture.mjs` with a pure evaluator for declaration completeness, valid stage/role relations, shared-contract ownership, anchor presence, undeclared contract-bearing fields, and prohibited version-suffixed production literals. It accepts a plain snapshot and neither reads files nor imports `yaml`.
- [x] 3.2 Add protected-core synthetic coverage in `tests/contracts/test_harness_architecture.mjs`; prove the evaluator detects each failure mode without a transitive `yaml` import.
- [x] 3.3 Add a separate opt-in YAML/source conformance test that constructs the real snapshot and scans the declared active scope. It must fail on a stale suffix, missing/extra declaration, invalid role, missing anchor, or a hidden durable contract.
- [x] 3.4 Extend focused owner tests for source parsing, production mode/state, Progressive Raw, Style Master, delivery, locator, and CLI ownership. Prove current values are emitted and accepted, while an undeclared value halts before dependent mutation or provider initialization; do not use a historical-format fixture.
- [x] 3.5 Prove planned C3-C5 stage definitions, including Page Class defaults, remain declarative and C2 adds no implementation-only substitute, state schema, CLI command, provider behavior, or second control path.

## 4. Verify The Clean Cutover

- [x] 4.1 Run the active-source lexical scan and retain its zero-result proof for version-suffixed production identifiers and frozen/compatibility implementation paths. Its execution scope is `ppt_maker_harness/`, `tests/`, and `tests_e2e/`; review every discovered contract-bearing field against `serialization-contracts.yaml`.
- [x] 4.2 Review every C2 delta spec for the current unversioned contract. After the user directs spec sync or archive, sync these deltas into accepted specs and run the same zero-result lexical scan over `openspec/specs/`; do not claim the accepted-spec proof before that sync.
- [x] 4.3 Run targeted owner and contracts sweeps, `npm test`, `openspec validate conform-code-to-schema-definitions --strict`, `openspec validate --all --strict`, and `git diff --check`.
- [x] 4.4 Update this change's evidence summary with the inventory result, protected-core result, opt-in conformance result, owner-test result, post-sync specification result when performed, and confirmation that no Run Bundle or research path was read, written, migrated, or used as a fixture.
