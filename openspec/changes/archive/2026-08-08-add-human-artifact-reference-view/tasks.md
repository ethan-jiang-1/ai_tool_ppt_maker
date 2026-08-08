## 1. Derived Path and Display Reference Foundation

- [x] 1.1 (`run-bundle-layout`, architecture) Add the canonical run-scoped human artifact reference path under the current Page Image `_generated/page_image_workflow/reference/` tree and register its dependency-light shared renderer in the Harness public-interface contract, with layout/architecture coverage proving it remains a derived leaf rather than an immutable-storage alias.
- [x] 1.2 (`image-generation`) Extract the existing kind-prefixed, collision-aware digest display formatter into a dependency-light pure shared helper and migrate the Page Production task projection without changing its current card-scoped display output or selector behavior.
- [x] 1.3 (`image-generation`) Add focused unit coverage for typed display references, collision suffixes, invalid inputs, and the rule that no abbreviated display reference resolves to a lifecycle selector.

## 2. Canonical Human Artifact Projection

- [x] 2.1 (`image-generation`, delivery owner) Extract a narrow public read-only current-delivery inspection seam from the existing delivery owner. It must validate the current final-manifest, assembly, notes, delivery media, receipt, and PPTX bindings without invoking notes refresh or writing any artifact/state.
- [x] 2.2 (`image-generation`) Implement the provider-free artifact-view composition in the approved `ppt_flow` cross-owner adapter. Call public Style Master, raw/review, final, and delivery owner inspectors only, pass their validated facts to the renderer, and preserve stable candidate and full-plan `NN_slideID` ordering.
- [x] 2.3 (`image-generation`) Render and atomically rebuild the canonical Markdown view with bounded kind-prefixed display labels, absolute confined locators, artifact types, and inspection purposes. Exclude prompt/provider/credential/environment content and do not read a prior view as authority.
- [x] 2.4 (`image-generation`) Implement availability semantics: unavailable later-stage artifacts appear only as unavailable; invalid identity, invalid owner records, or an escaping path short-circuit before the write through the existing owner-issued hard-stop/error boundary.
- [x] 2.5 (`image-generation`) Add focused unit/integration fixtures for Pure and Framed partial and delivered runs, stable ordering, missing optional output, deletion/rebuild, view-edit non-authority, secret-safe rendering, and rejection of stale/copied/escaping artifacts.

## 3. Explicit CLI Surface

- [x] 3.1 (`cli-surface`) Register `ppt_flow image2 artifact-view <run-dir>` in public routing and help. Reuse the current Page Image identity/error path, invoke only the derived projection writer, and return the exact run/workflow plus the generated view locator.
- [x] 3.2 (`cli-surface`) Route the command before the generic Image2 lifecycle tail so it performs no provider initialization, authorization, submission, review decision, selector translation, lifecycle mutation, or `_state/` write (including task-projection refresh); preserve existing success JSON for `status`, `state`, `style-master`, and all other Image2 commands.
- [x] 3.3 (`cli-surface`) Add process coverage for successful current Pure/Framed invocation, public help, pre-final partial output, unsupported-v2 hard-stop before artifact reads/writes, and byte-identical `_state/`/no-provider negative cases.

## 4. Agent and Generated Guidance

- [x] 4.1 (`harness-charter`) Update active Agent Contract guidance so every human Page Image inspection handoff cites the artifact view's locator, type, and purpose, and explicitly keeps locators read-only and non-authoritative.
- [x] 4.2 (`node-specification`) Update generated deck-guide content and its contract tests to direct runtime Agents to rebuild the explicit view before requesting Style Master, review, final, or delivery inspection; retain the no-hand-edit `_generated/` rule and existing diagnostic recovery guidance.
- [x] 4.3 (`harness-charter`, `node-specification`) Add documentation-focused regression coverage that rejects a bare “generated/opened” inspection handoff and confirms no display locator is described as an approval, selector, or edit permission.

## 5. Verification and Closeout

- [x] 5.1 Run the focused display/projection, run-bundle, guidance, and process CLI suites; then run the protected `npm test`, `git diff --check`, and `openspec validate add-human-artifact-reference-view --strict` checks.
- [x] 5.2 After implementation evidence is green, update this change's tasks, the progressive backlog plan, and BUG-056/062/063 with the exact resolved scope; move only fully resolved cards to `_backlog/_done/_fixed_bugs/` and update their indexes.
- [x] 5.3 Before apply completion/closeout, re-run `openspec validate --all --strict`; after the required main-spec sync and archive lifecycle, re-run the applicable strict validation and record the version-bump recommendation for explicit maintainer confirmation.
