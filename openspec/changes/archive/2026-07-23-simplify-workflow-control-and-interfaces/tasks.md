## 1. Ledger And Entry Baseline

- [x] 1.1 Add canonical `tests/contracts/workflow-control-ledger-v2.json` and update `PPTMAKER_FRAMEWORK/reference/workflow-inspection-ledger.md` to explain it. Include rows for the retained execution cursor (`playbook`, `current_node`, execution/version binding, `waiting_for`), `buildResumeCard` summary/suggested-next/eligible-candidate evaluators, `workflow_summary`, `suggested_next`, and `html_resume_guidance`; record owner, writer/readers, invalidation, reconstructibility, decision, replacement tests, and exact compatibility retirement bound where applicable.
- [x] 1.2 Define and test the goal-to-entry matrix for greenfield init, exact-run resume, local refresh, structural versioning, recovery, HTML-then-Image2 refinement, Image2-only production, and markerless maintenance. Mark `init` and every mutation command as direct-owner entries; only run-scoped observation/resume may consume the inspection primary action.
- [x] 1.3 Add baseline journey fixtures for all three production modes, markerless compatibility, resume waiting, in-progress resume, local refresh, structural change, recovery, restart, and BUG-033.

## 2. Checkpointed Control Cutover

- [x] 2.1 Make `workflow_inspection` compose exactly one resume action from the retained state cursor after protected direct prerequisites, including non-mutating waiting, in-progress, and bounded controller-routing outcomes; retain direct-owner dispatch for every mutating CLI command.
- [x] 2.2 Make `state`/`status` derive public `workflow_summary` and `suggested_next` from that same inspection action; make any retained `html_resume_guidance` display-only and stop `buildResumeCard` from independently evaluating next actions. Keep `eligible_candidates` diagnostic-only.
- [x] 2.3 Retire only ledger-approved reconstructible generic writers/readers after the replacement-reader regression passes; retain direct-owner CAS/journal writes and every incomplete/uncertain ledger candidate.
- [x] 2.4 Remove reader paths with no caller. Inventory each retained read-only compatibility reader or alias with its retirement owner, removal trigger, and `retire_by: change:<name>|release:<version>`; reject missing, malformed, or expired bounds.
- [x] 2.5 Update AGENT_CONTRACT, NODE-SPEC, COMMANDS, reference ledger, and playbook guidance to consume `workflow_inspection.primary_action`/`continuation`; permit legacy projection fields only as non-authoritative display compatibility.

## 3. Guardrails And Validation

- [x] 3.1 Add a ledger-schema contract test and update `test_workflow_inspection`, `test_workflow_inspection_cli`, `test_ppt_flow`, and `test_state_yaml` for primary-action uniqueness, cursor wait/in-progress precedence, display-adapter parity, raw-state compatibility, zero-write/zero-network observation, restart equivalence, same-check rerun, and direct-command non-redirection.
- [x] 3.2 Test wrong-owner no-mutation, CAS/journal/receipt/authorization revalidation, confirm reasons, hard-stop no-bypass behavior, historical-record reads after writer retirement, and `eligible_candidates` inability to select/override a route.
- [x] 3.3 Prove Image Production graph, directories, record keys, and whole-page bytes/path behavior remain unchanged.
- [x] 3.4 Run focused suites, full `npm test`, strict OpenSpec validation, `git diff --check`, and production-data scope audit.
