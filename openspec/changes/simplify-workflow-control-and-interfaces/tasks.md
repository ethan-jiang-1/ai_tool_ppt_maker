## 1. Ledger And Entry Baseline

- [ ] 1.1 Record the Change-1 durable-field ledger decisions for each generic control candidate and supported journey.
- [ ] 1.2 Define and test the goal-to-single-entry table plus deletion test; reject shallow entries.
- [ ] 1.3 Add baseline journey fixtures for create, resume, refresh, structural change, recovery, restart, and BUG-033.

## 2. Checkpointed Control Cutover

- [ ] 2.1 Route controller and CLI guidance through `workflow_inspection` without changing existing generic writers.
- [ ] 2.2 Retire only ledger-approved reconstructible generic writers; retain direct-owner CAS/journal writes.
- [ ] 2.3 Remove reader paths with no caller or document bounded read-only compatibility readers and retirement owner.

## 3. Guardrails And Validation

- [ ] 3.1 Test inspection primary-action uniqueness, raw-state compatibility, zero-write/zero-network observation, restart equivalence, and same-check rerun.
- [ ] 3.2 Test wrong-owner no-mutation, CAS/journal/receipt/authorization revalidation, confirm reasons, and hard-stop no-bypass behavior.
- [ ] 3.3 Prove Image Production graph, directories, record keys, and whole-page bytes/path behavior remain unchanged.
- [ ] 3.4 Run focused suites, full `npm test`, strict OpenSpec validation, `git diff --check`, and production-data scope audit.
