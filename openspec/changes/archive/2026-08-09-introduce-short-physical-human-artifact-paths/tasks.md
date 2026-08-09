## 1. Path Contract And Navigation Module

- [x] 1.1 [`run-bundle-layout`] Add `_generated/nav/`, `nav/index.md`, and `nav/art/` to the Page Image path SSOT and rendered layout; retire the long human-reference leaf as the canonical human entry point while retaining only the narrow derived-leaf cleanup path needed for migration.
- [x] 1.2 [`image-generation`] Refactor the existing owner-fact renderer into the Human Navigation Path Module with one writer Interface that validates current inputs, reuses typed collision-aware display references, assigns 1-24-character short names, and renders a relative-path index without a full SHA, original locator, or source filename.
- [x] 1.3 [`image-generation`] Implement confined regular-copy materialization and staged root replacement for the navigation tree. Reject escaping source locators, symbolic-link roots, unsafe components, copy failures, and incomplete replacement before mutating the current tree; preserve/restores the prior derived tree on failure and never rename, hardlink, or rewrite immutable owners.
- [x] 1.4 [`harness-script-layout`] Update the Harness architecture contract for the navigation Module if its public file/interface changes, preserving the current dependency direction and keeping lifecycle ownership outside the Module.

## 2. Artifact-View And Guidance Integration

- [x] 2.1 [`image-generation`, `cli-surface`] Route all current and pending-successor artifact-view branches through the new navigation writer; retain current owner ordering, availability, bounded failures, and `next_action`, but return the short index as `artifact_view` plus `human_navigation_root` without original canonical artifact locators.
- [x] 2.2 [`cli-surface`] Update Image2 help and direct artifact-view contract behavior so it remains provider-free, performs no `_state`/task-projection write, accepts no navigation selector, preserves exact owner hash grammar for control operations, and keeps unsupported-v2 runs before any navigation write.
- [x] 2.3 [`harness-charter`, `node-specification`] Update `AGENT_CONTRACT.md`, generated deck-guide wording, and MD consumer guidance so human inspection handoffs cite only Human Navigation Paths as read targets, never SHA storage locators; preserve the existing human review/authorization gates and no-edit boundary.

## 3. Focused Regression Coverage

- [x] 3.1 [`image-generation`] Extend the navigation Module unit suite for deterministic short component names, typed-reference collisions, byte-equal regular copies, no full SHA/original locator in the index, edited-copy rebuild, and current page/candidate ordering.
- [x] 3.2 [`image-generation`] Add negative coverage for source confinement, symbolic-link/unsafe navigation roots, invalid extensions or component bounds, copy/replacement failure with prior-tree preservation, and proof that original owner bytes and lifecycle facts remain unchanged.
- [x] 3.3 [`cli-surface`] Update direct artifact-view fixture coverage for Pure, Framed, and pending Style Master successor states: assert the index/root payload, short-only human paths, unchanged `_state`/grants/attempts/owner records, no provider work, no selector translation, and the existing unsupported-v2 hard-stop.
- [x] 3.4 [`run-bundle-layout`, `harness-charter`, `node-specification`] Update path/layout and generated-guidance tests to cover the new canonical `nav/` tree, removal of the long human entry surface, and short-path-only inspection handoffs.

## 4. Validation And Handoff

- [x] 4.1 Run focused navigation Module, artifact-view CLI, run-bundle layout, Charter, and MD guidance suites; record that no provider request or production-deck mutation occurred.
- [x] 4.2 Run protected `npm test`, `openspec validate introduce-short-physical-human-artifact-paths --strict`, `openspec validate --all --strict`, and `git diff --check`; update task checkboxes only after the corresponding work passes.
- [x] 4.3 Update the progressive Page Image backlog plan with the proposal/apply status and migration boundary, then request explicit apply authorization; do not archive, sync, or commit before implementation and validation complete.
