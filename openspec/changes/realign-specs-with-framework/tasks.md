## 1. Repair Main-Spec Structure

- [ ] 1.1 Capture the baseline `openspec validate --all` failures and map each validator requirement index to its exact main-spec heading.
- [ ] 1.2 For `framework-charter`, `node-specification`, `playbook-execution`, and `cli-surface`, replace each invalid requirement with a full-content `MODIFIED` delta/main block that preserves every existing scenario and adds the missing scenario.
- [ ] 1.3 Replace the `workflow-inspection` placeholder Purpose and complete its two invalid requirements with their existing behavior plus scenarios.
- [ ] 1.4 Review the synchronized main-spec diff to prove no unrelated requirement text or scenarios were dropped during replacement.

## 2. Bounded Terminology Audit

- [ ] 2.1 Search active new-run guidance and main requirements for claims that first-class `image2-only` work is compatibility-only; classify each hit against `production_mode.mjs` and the current controller policy.
- [ ] 2.2 Correct only proven wording drift, preserving `legacy-image2-first` wherever it names the existing normalized protocol, historical reader, source-marker behavior, receipt, or compatibility path.
- [ ] 2.3 Add or update focused documentation/contract checks for any corrected active-path wording without asserting a new persisted pipeline label.

## 4. Verify and Prepare Archive

- [ ] 4.1 Run `openspec validate --all` and `openspec validate realign-specs-with-framework --strict`.
- [ ] 4.2 Run focused repository-verification tests and `npm test`.
- [ ] 4.3 Inspect the final diff to confirm this change did not modify pipeline protocol values, source markers, run-bundle state/receipts, `deck_*`, `dpt_*`, or `_generated/` artifacts.
