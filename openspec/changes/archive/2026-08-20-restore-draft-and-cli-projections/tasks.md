## 1. Target shape and init Next

- [x] 1.1 [run-bundle-management] Run existing `isVersionDir` before `verifyCurrentBindingForCli` on `--check`. A non-run-dir is existing `usage` naming `3_versions/vN`. Done when `--check <deck-root>` is not `harness_binding_invalid` and `--check <v1>` still uses the existing binding hard-stop.
- [x] 1.2 [run-bundle-management] Point successful `bundle_layout --init` Next at `Next: ppt_flow.mjs status <v1Path>`, matching `ppt_flow init`. Done when both successful scaffolds emit that sentence and `--init` no longer tells the Agent to fill backbone first.
- [x] 1.3 [cli-surface] Keep `ppt_flow init` Next as `Next: ppt_flow.mjs status <v1Path>` (already the public sentence). Done when a focused test asserts both entries emit the same line for the same created v1 path.
- [x] 1.4 [run-bundle-management] Add a focused test that `--check` on a fixture Deck root is usage, and `--check` on that fixture's `v1` still verifies binding.

## 2. Authoring draft with selected workflow

- [x] 2.1 [workflow-inspection] Route source `production.workflow` `framed|pure` with no `production_identity.by_version` entry onto the existing draft / narrative-plan / paginate-apply owner action. Done when `state --json` and inspection on that pair are not `current-protocol-invalid`.
- [x] 2.2 [workflow-inspection] When identity is missing and `resolveTargetAuthoringDraftRoute` returns null, keep `repair-current-protocol-identity`. Done when a focused negative fixture still hard-stops.
- [x] 2.3 [workflow-inspection] Add tests for pending workflow, selected-workflow-without-identity, identity-bound current run, and a pair the draft resolver rejects.

## 3. Status Next and Style Master JSON

- [x] 3.1 [cli-surface] Drive human `status` Next from `workflow_inspection.primary_action` using the same projection `state` already prints, and add `workflow_inspection` to `status --json`. Include Style Master and Image2. Done when a fixture past Style Master ready no longer goes silent until `build`.
- [x] 3.2 [cli-surface] Register `--json` on `style-master inspect` as a renderer of the same owner result. Default remains JSON. Done when `style-master inspect <run-dir> --json` is not USAGE.
- [x] 3.3 [cli-surface] Add direct CLI tests for status Next from inspection and style-master `--json`.

## 4. Validation

- [x] 4.1 Run `openspec validate --strict --change restore-draft-and-cli-projections` and the touched `tests/` suites. Done when both pass.
- [x] 4.2 Confirm no `deck_*` production tree was used as a Harness fixture and no cursor/v1-reset/capability-vector/Gate-gloss work landed in this change.
