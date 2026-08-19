## 1. Inventory and command surface

- [x] 1.1 [cli-surface] Register `reset-unproduced-v1` in `PPT_FLOW_COMMAND_INVENTORY` (immediately after `new-version` in `ppt_flow.mjs` command order), `COMMAND_CONTRACTS`, `ppt_flow.mjs` `.command()` in that same order, `PUBLIC_SHARED_INTERFACES`, and `shared/cli` ownership. Done when help lists the command and inventory audits accept it.
- [x] 1.2 [cli-surface] Require `--confirm-abandon` and exact `v1`. Missing flag or non-v1 is `usage` with zero writes. Done when those invocations leave source/state bytes unchanged.

## 2. Owner mutation

- [x] 2.1 [run-bundle-management] Add `resetUnproducedV1Draft` that admits only unique resolvable unproduced v1, then restores exact `pageImageInitialDraftSource(deck.type)`, init authoring-draft State, wiped rebuildable `_generated`/`_scratch` (README retained), and cleared v1 scope heads. Done when a post-paginate-apply fixture without provider files returns to seed + empty identity.
- [x] 2.2 [run-bundle-management] Closed irreversible scan: successor version; identity missing/invalid/mismatch; raw authorization; Style Master grant or generated candidate media; non-null provider/raw/final/delivery digests; any attempt/grant/materialization/pilot/accepted/staging file under either iteration store; any raw/final PNG or PPTX under v1 `_generated`. Done when each fixture refuses with byte-identical trees.
- [x] 2.3 [run-bundle-management] Do not delete append-mostly `plans/` history. Append `unproduced_v1_reset`. Success receipt states irreversible records were retained.

## 3. Publication path

- [x] 3.1 [slide-identity-and-ordering] After a successful reset, `paginate plan`/`apply` of a new candidate against that v1 uses the existing initial-draft path (`target_run_version: v1`). Done when the narrative-page-plan fixture that today returns v2 returns v1 after reset.
- [x] 3.2 [slide-identity-and-ordering] Keep the ordinary vNext path when reset is refused. Done when an attempt-present fixture still previews `publication: next-version` and `target_run_version: v2`.

## 4. CLI envelope and tests

- [x] 4.1 [cli-surface] Command module: binding, confirm flag, owner call, `commandResult` success, `GATE_BLOCKED` gate envelope with next `repair_prerequisite` (vNext), never `internal` / `report_internal`.
- [x] 4.2 Tests: process/CLI success + refuse-unchanged; narrative re-materialize as v1; map the new command in `test_process_cli_error.mjs`; add `COMMANDS.md` Agent-routing row. Register the test in `source-test-ownership.json`.
- [x] 4.3 Run `openspec validate --strict --change reset-unproduced-v1` and the touched suites. Confirm no transport-vector or cursor-rewind work landed.
