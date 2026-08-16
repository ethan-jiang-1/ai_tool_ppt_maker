## 1. State-owned Style Master authorize handoff

- [x] 1.1 [node-specification, implementation] In `ppt_maker_harness/scripts/shared/state/state.mjs`, add `STYLE_MASTER_AUTHORIZE_CLI_EVIDENCE_KEY = "style-master-grant-recorded"` and `recordStyleMasterAuthorizeCliHandoff(deckDir, { runVersion, runDir, planHash, grantHash, expectedStateSha })`: revalidate plan/grant against the current Style Master scope/store, derive the target node from the resolved workflow, record `setNodeEvidence(..., { kind: "cli" })` + `setNodeStatus(..., "completed")`, write state, append `style_master_authorize_cli_handoff` history. Mirror the idempotency of `recordTargetProgressiveAuthorizeCliHandoff` (replay on CAS race, supersede prior CLI grant evidence, unmatched-node non-completion). Done when focused state tests cover recording, replay, supersede, and invalid plan/grant short-circuit.

- [x] 1.2 [style-master-generation routing, implementation] In `ppt_maker_harness/scripts/ppt_flow.mjs`, after `authorizeStyleMasterCandidates` succeeds in the `style-master authorize` route, call `recordStyleMasterAuthorizeCliHandoff` and inject `controller_handoff` into the output, mirroring the `image2 authorize` route. Done when `style-master authorize` returns a `controller_handoff` and completes the matching authorize node.

## 2. Controller playbook (create-deck.md)

- [x] 2.1 [playbook-execution] In `ppt_maker_harness/playbook/create-deck.md`, change `authorize-target-framed-style-master` and `authorize-target-pure-style-master`: remove `decisions: [authorize, revise, decline]`, change `exit` to `[evidence:style-master-grant-recorded]`, and replace the Step 2 GATE ("record authorize/revise/decline against that exact cost") with one CLI step: `ppt_flow style-master authorize <run-dir> --plan-hash <sha256>` and retain the grant digest. Done when both nodes carry no `decisions` and no cost GATE text.

- [x] 2.2 [playbook-execution] In the same file, change `generate-target-framed-style-master` and `generate-target-pure-style-master` `entry` from `[node_decision:authorize-target-*-style-master:authorize]` to `[node_evidence:authorize-target-*-style-master:style-master-grant-recorded]`. Done when both generate nodes' entry references the typed `node_evidence` token, mirroring the Page Image generate nodes.

- [x] 2.3 [playbook-execution] Change `checkpoint-intake` Step 1 to remove the standalone "remote-cost boundary" confirmation: keep topic/audience/source truth/visual direction, and state that ordinary in-scope cost is covered by the Task Mandate unless the human sets an explicit limit. Done when the intake step no longer asks a separate cost-boundary question.

- [x] 2.4 [playbook-execution] Confirm `controller-manifest.json` node IDs are unchanged (no edit expected) and that `review-target-*-style-master` still declares `decisions: [proceed, repair, redirect]`. Done when manifest is byte-identical and the review nodes still own the visual decision.

## 3. Spec and validation surface

- [x] 3.1 [node-specification] Run `tests/shared/state/test_md_controller_reader.mjs` and the playbook/controller validator that consumes `create-deck.md`; confirm the no-`decisions` + `exit:[evidence:...]` shape and `node_evidence` entry parse cleanly. Done when the reader/validator tests pass without editing the reader.

- [x] 3.2 [tests] Grep `tests/` and `tests_e2e/` for assertions on the Style Master authorize nodes' `decisions:[authorize,revise,decline]`, `user_decision_recorded`, or the old cost GATE; update any to the new `node_evidence` / grant shape. Extend `test_process_style_master_cli.mjs` / `test_process_style_master_lifecycle_integration.mjs` to assert the new `controller_handoff` output and node completion. Done when no stale assertion references the removed decision and the new handoff is covered.

## 4. Verification

- [x] 4.1 Run `openspec validate fold-style-master-cost-into-task-mandate --strict` and `git diff --check`; fix any strict-validation findings. Done when both pass.

- [x] 4.2 Run the repository baseline `npm test` (and the mock e2e journey if it is part of the documented baseline); confirm no regression from the playbook/spec/handoff change. Done when the baseline passes, or any unrelated pre-existing failure is reported as an external blocker without editing unrelated files.
