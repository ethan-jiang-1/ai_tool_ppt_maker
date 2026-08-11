---
playbook: create-deck
description: Page Image Workflow deck creation and delivery
supported_pipelines: [page-image-workflow]
supported_production_modes: [image2-page-workflow]
includes: []
---

# Playbook: Create Deck

## Discovery Handoff

For a new-deck request, the Agent establishes applicable local foundation,
initializes the exact requested run, and obtains user content plus necessary
choices before entering this Controller. The discovery catalog does not choose
a Controller node, workflow, authorization, or raw plan; this playbook and its
existing owners retain those decisions.

### checkpoint-intake
```yaml
node: checkpoint-intake
lifecycle_phase: 0
method_module: 00-setup
requires: []
produces: [deck-intake]
entry: [run_bundle_exists]
exit: [user_decision_recorded]
```
**Step 1 — MD**: Confirm the topic, audience, source truth, visual direction, and remote-cost boundary before authoring.

## Narrative Before Pages

The Deck Author first owns the shared argument and its content boundaries. The
Agent may repair those sources from supplied material, but asks for the smallest
missing content decision when a repair needs new meaning. Story Outline and
Design Constraints are never visual-language, page-class, geometry, provider,
or approval inputs.

### author-target-narrative-sources
```yaml
node: author-target-narrative-sources
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-workflow]
draft_route: true
requires: [checkpoint-intake]
produces: [story-outline, design-constraints]
entry: []
exit: []
```
**Step 1 — MD**: Write or repair the shared Story Outline and Design Constraints from the Deck Author's supplied claim, audience, evidence, and claim boundaries. Keep visual selections in Visual Language and page class, geometry, and density rules with their later owners.
**Step 2 — CLI**: Use `ppt_flow slides narrative-plan` when the sources need deterministic repair guidance. Its narrative-plan owner validates the sources together with the candidate; a malformed source is a guide when supplied content is enough to repair it, otherwise ask only for the smallest missing content decision.

## One Workflow Per Version

The TARGET controller records one human `framed` or `pure` decision only after
the narrative sources are current and before it exposes provider-facing work. It
then follows exactly one sibling path into shared delivery and iteration. The
source/state resolver remains the authority for receipt identity, workflow
binding, evidence, and recovery.

### Owner diagnostic handoff

Follow the shared [Diagnostic Recovery Handoff](../charter/AGENT_CONTRACT.md#diagnostic-recovery-handoff)
when an owner CLI exits nonzero. This Controller preserves the producer-issued
`diagnostic.category` and `diagnostic.next`; it does not recreate a category,
action, or recovery route. The shared handoff owns the user explanation and
recovery precedence. A current raw visual `proceed`, `repair`, or `redirect`
confirmation remains an owner-required stop, never a mechanical repair.

For Style Master work, project only the owner-issued current scope head, exact
plan hash, grant progress, real-byte review evidence, and next action. A
Controller node status or an OpenSpec task checkbox is a collaboration record,
not candidate authority or a resume signal. `proceed`, `repair`, and `redirect`
are Style Master visual-direction decisions; none grants page-raw cost or
acceptance.

### Progressive Page Production Resume

For a selected progressive Page Image route, first resolve the exact
run/controller identity and refresh workflow inspection before choosing any
node. The inspection's one owner-issued action selects the current checkpoint;
it is never inferred from a previously completed node, a generated file, or
conversation context. A partial Pilot `proceed` refreshes inspection and shows
only the owner-derived Expansion scope/cost checkpoint. It does not authorize
Expansion, accept full raw evidence, finalize, or deliver.

The Controller rebuilds `_state/page-production-task-projection.md` on route
entry/resume and after relevant decisions. The card contains only owner-issued
references, bounded progress, one next action, and the matching typed human
handoff plus an optional note. It is a collaboration view: its prose,
checkboxes, manual edits, stale content, or deletion cannot authorize a cost,
resume a submission, prove materialization, advance state, or become evidence.
Typed references in the card are scoped presentation labels only, never
selectors. For an operation that requires a complete digest, refresh workflow
inspection and use the current direct owner record or its existing CLI surface;
never expand or submit a card reference.

### select-target-page-image-workflow
```yaml
node: select-target-page-image-workflow
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-workflow]
draft_route: true
requires: [author-target-narrative-sources]
produces: [target-page-image-workflow-choice]
decisions: [framed, pure]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Choose one version workflow, `framed` or `pure`, based on the content and visual intent. Do not choose an authority per slide.
**Step 2 — GATE**: Record the one workflow decision before the canonical target source is authored. This decision does not waive source/state validation.

### configure-target-page-image-visual-system
```yaml
node: configure-target-page-image-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed, pure]
draft_route: true
requires: [select-target-page-image-workflow]
produces: [target-page-image-visual-language]
entry: []
exit: [visual_preset_seeded]
```
**Step 1 — MD**: Maintain the closed visual-language and reference registries before page grouping. Framed-specific Header Rendering Policy facts remain owned by the selected Framed workflow.

### author-target-page-image-content
```yaml
node: author-target-page-image-content
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-workflow]
production_workflows: [framed, pure]
draft_route: true
requires: [configure-target-page-image-visual-system]
produces: [narrative-page-grouping-candidate, narrative-page-plan, page-image-workflow-source, page-image-workflow-source-receipt, stable-slide-ids]
entry: [visual_preset_seeded]
exit: [slide_specs_exists, slide_specs_valid]
```
**Step 1 — MD**: Use the current Story Outline, Design Constraints, and Visual Language registry to make one Agent-authored page-grouping candidate. Repair malformed narrative input or candidate deterministically whenever the supplied content makes that possible.
**Step 2 — CLI**: Run `ppt_flow slides narrative-plan <run-dir> --candidate <path>` and present the returned ordered page lineage and exact plan hash in Deck Author terms. A stale plan, changed source bytes, invalid identity, or invalid target is an existing non-bypassable hard-stop: repair the direct source or candidate, then preview a new plan.
**Step 3 — GATE**: Obtain one conversational Deck Author confirmation that the displayed argument-to-page structure is right. This is a content and structure decision only; do not persist an approval, treat it as provider authorization, or create review evidence.
**Step 4 — CLI**: Materialize only the displayed exact plan with `ppt_flow slides apply-plan <run-dir> --plan <path> --apply --plan-sha256 <hash>`. The structural publisher owns current hashes, source publication, State binding, and render debt.

### inspect-target-framed-style-master
```yaml
node: inspect-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [configure-target-page-image-visual-system]
produces: [target-framed-style-master-inspection]
entry: []
exit: [evidence:target-framed-style-master-inspected]
```
**Step 1 — CLI**: Run `ppt_flow style-master inspect <run-dir>` and keep its owner-issued head, progress, and next action. This validates the Framed candidate source read-only; it does not create page source/state or raw lineage.

### plan-target-framed-style-master
```yaml
node: plan-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [inspect-target-framed-style-master]
produces: [target-framed-style-master-plan]
entry: []
exit: [evidence:target-framed-style-master-plan-current]
```
**Step 1 — MD**: Choose the disclosed number of new Framed candidates, including `0` only when the canonical local candidate is eligible.
**Step 2 — CLI**: Run `ppt_flow style-master plan <run-dir> --candidate-count <0..4>` and retain only the returned exact plan hash and owner progress.

### authorize-target-framed-style-master
```yaml
node: authorize-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [plan-target-framed-style-master]
produces: [target-framed-style-master-candidate-authorization]
decisions: [authorize, revise, decline]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Inspect the exact plan's generated-slot count and disclosed maximum submissions.
**Step 2 — GATE**: For a nonzero generated count, record `authorize`, `revise`, or `decline` against that exact cost. For a zero-generated local plan, skip this node without recording approval, credential use, or a grant.
**Step 3 — CLI**: After `authorize`, run `ppt_flow style-master authorize <run-dir> --plan-hash <sha256>` and retain the one grant digest. Do not run this command for a zero-generated local plan.

### generate-target-framed-style-master
```yaml
node: generate-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [authorize-target-framed-style-master]
produces: [target-framed-style-master-candidate-progress]
entry: [node_decision:authorize-target-framed-style-master:authorize]
exit: [evidence:target-framed-style-master-progress]
```
**Step 1 — CLI**: Run the exact `ppt_flow style-master generate <run-dir> --plan-hash <sha256>` after the owner-issued grant exists. It reports owner-derived progress and never authorizes page raw work.

### abandon-target-framed-style-master
```yaml
node: abandon-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [generate-target-framed-style-master]
produces: [target-framed-style-master-abandonment]
entry: []
exit: [evidence:target-framed-style-master-abandoned]
```
**Step 1 — GATE**: Only when inspection reports an unknown submitted candidate, obtain one bounded human reason.
**Step 2 — CLI**: Run `ppt_flow style-master abandon <run-dir> --plan-hash <sha256> --reason <text>`. Do not retry, infer an outcome, or create a successor from this node. Skip this node when no unknown attempt exists.

### review-target-framed-style-master
```yaml
node: review-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [plan-target-framed-style-master, authorize-target-framed-style-master, generate-target-framed-style-master, abandon-target-framed-style-master]
produces: [target-framed-style-master-real-byte-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Run `ppt_flow style-master review <run-dir> --plan-hash <sha256>` and present only the Framed plan's validated real candidate bytes.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` as the Style Master visual-direction decision. For `repair` or `redirect`, persist the exact owner decision and return to its next Style Master action; do not enter page raw authorization.

### promote-target-framed-style-master
```yaml
node: promote-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [review-target-framed-style-master]
produces: [target-framed-style-master-acceptance]
entry: [node_decision:review-target-framed-style-master:proceed]
exit: [style_master_accepted]
```
**Step 1 — CLI**: Run `ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision proceed --candidate-id <slot-id>`. Promotion is complete only when the owner exposes the current accepted selection; a failed presentation JPEG projection must use the producer-issued exact replay invocation.

### plan-target-framed-progressive-raw
```yaml
node: plan-target-framed-progressive-raw
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
draft_route: true
requires: [promote-target-framed-style-master]
produces: [target-framed-progressive-raw-plan]
entry: [style_master_accepted]
exit: [evidence:target-framed-progressive-raw-plan-current]
```
**Step 1 — CLI**: Run `ppt_flow image2 plan <run-dir>`. It compiles one provider-free full Framed raw plan and exposes only the owner-issued next action.

### recommend-target-framed-pilot
```yaml
node: recommend-target-framed-pilot
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [plan-target-framed-progressive-raw]
produces: [target-framed-pilot-projection]
entry: []
exit: [evidence:target-framed-pilot-projection-current]
```
**Step 1 — MD**: Recommend a risk-representative set of exact formal slide IDs only when workflow inspection requests a Pilot scope. Do not infer a partial route from card text or positions.
**Step 2 — CLI**: Run `ppt_flow image2 pilot <run-dir> --plan-hash <sha256> --slide-id <formal-id> ...` and present the returned ordered scope, display facts, paid membership, and maximum submissions.

### authorize-target-framed-pilot
```yaml
node: authorize-target-framed-pilot
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [recommend-target-framed-pilot]
produces: [target-framed-pilot-authorization]
entry: []
exit: [evidence:exact-batch-grant-recorded]
```
**Step 1 — CLI**: Run `ppt_flow image2 authorize <run-dir> --plan-hash <sha256> --batch-hash <sha256>`. For a matching current Task Mandate, the State-owned CLI handoff records the exact grant evidence and completes this node. This does not accept raw quality or authorize Expansion.

### generate-target-framed-pilot
```yaml
node: generate-target-framed-pilot
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [authorize-target-framed-pilot]
produces: [target-framed-pilot-item-progress]
entry: [node_evidence:authorize-target-framed-pilot:exact-batch-grant-recorded]
exit: [evidence:target-framed-pilot-item-progress]
```
**Step 1 — CLI**: Re-run `ppt_flow image2 generate` with the exact plan and batch hashes. Each invocation may submit and materialize at most one owner-eligible item; refresh inspection before the next call.

### review-target-framed-pilot
```yaml
node: review-target-framed-pilot
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [generate-target-framed-pilot]
produces: [target-framed-pilot-evidence]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Run `ppt_flow image2 pilot-review` for the exact partial Pilot batch and present the Framed provider page plus its production-equivalent header composite.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` for the exact Pilot evidence. A partial `proceed` only unlocks owner-derived Expansion planning.

### plan-target-framed-expansion
```yaml
node: plan-target-framed-expansion
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [review-target-framed-pilot]
produces: [target-framed-expansion-projection]
entry: [node_decision:review-target-framed-pilot:proceed]
exit: [evidence:target-framed-expansion-projection-current]
```
**Step 1 — CLI**: Run `ppt_flow image2 pilot-accept ... --decision proceed`, refresh inspection, then run `ppt_flow image2 expansion <run-dir> --plan-hash <sha256>`. The owner, not the Controller, derives the remaining paid scope.

### authorize-target-framed-expansion
```yaml
node: authorize-target-framed-expansion
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [plan-target-framed-expansion]
produces: [target-framed-expansion-authorization]
entry: []
exit: [evidence:exact-batch-grant-recorded]
```
**Step 1 — CLI**: Run `ppt_flow image2 authorize <run-dir> --plan-hash <sha256> --batch-hash <sha256>`. For a matching current Task Mandate, the State-owned CLI handoff records the exact grant evidence and completes this node.

### generate-target-framed-expansion
```yaml
node: generate-target-framed-expansion
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [authorize-target-framed-expansion]
produces: [target-framed-expansion-item-progress]
entry: [node_evidence:authorize-target-framed-expansion:exact-batch-grant-recorded]
exit: [evidence:target-framed-expansion-item-progress]
```
**Step 1 — CLI**: Re-run the exact one-item `ppt_flow image2 generate` invocation and refresh owner inspection after every result.

### review-target-framed-raw
```yaml
node: review-target-framed-raw
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [plan-target-framed-progressive-raw]
produces: [target-framed-complete-raw-review]
decisions: [proceed, repair]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Only when owner inspection requests complete review, run `ppt_flow image2 review <run-dir> --plan-hash <sha256>` and present full-plan current Framed evidence.
**Step 2 — GATE**: Record `proceed` or `repair` against the complete raw review. Small debt and zero debt arrive here without a synthetic partial Pilot decision.

### publish-target-framed-final-manifest
```yaml
node: publish-target-framed-final-manifest
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed]
requires: [review-target-framed-raw]
produces: [target-framed-final-slide-manifest]
entry: [node_decision:review-target-framed-raw:proceed]
exit: [evidence:target-framed-final-manifest-current]
```
**Step 1 — CLI**: Run `ppt_flow image2 accept <run-dir> --plan-hash <sha256> --decision proceed`, then let the Framed workflow publish its final manifest from the accepted v3 evidence. It does not assemble PPTX or notes.

### inspect-target-pure-style-master
```yaml
node: inspect-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [configure-target-page-image-visual-system]
produces: [target-pure-style-master-inspection]
entry: []
exit: [evidence:target-pure-style-master-inspected]
```
**Step 1 — CLI**: Run `ppt_flow style-master inspect <run-dir>` and keep its owner-issued head, progress, and next action. This validates the Pure candidate source read-only; it does not create page source/state or raw lineage.

### plan-target-pure-style-master
```yaml
node: plan-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [inspect-target-pure-style-master]
produces: [target-pure-style-master-plan]
entry: []
exit: [evidence:target-pure-style-master-plan-current]
```
**Step 1 — MD**: Choose the disclosed number of new Pure candidates, including `0` only when the canonical local candidate is eligible.
**Step 2 — CLI**: Run `ppt_flow style-master plan <run-dir> --candidate-count <0..4>` and retain only the returned exact plan hash and owner progress.

### authorize-target-pure-style-master
```yaml
node: authorize-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [plan-target-pure-style-master]
produces: [target-pure-style-master-candidate-authorization]
decisions: [authorize, revise, decline]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Inspect the exact plan's generated-slot count and disclosed maximum submissions.
**Step 2 — GATE**: For a nonzero generated count, record `authorize`, `revise`, or `decline` against that exact cost. For a zero-generated local plan, skip this node without recording approval, credential use, or a grant.
**Step 3 — CLI**: After `authorize`, run `ppt_flow style-master authorize <run-dir> --plan-hash <sha256>` and retain the one grant digest. Do not run this command for a zero-generated local plan.

### generate-target-pure-style-master
```yaml
node: generate-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [authorize-target-pure-style-master]
produces: [target-pure-style-master-candidate-progress]
entry: [node_decision:authorize-target-pure-style-master:authorize]
exit: [evidence:target-pure-style-master-progress]
```
**Step 1 — CLI**: Run the exact `ppt_flow style-master generate <run-dir> --plan-hash <sha256>` after the owner-issued grant exists. It reports owner-derived progress and never authorizes page raw work.

### abandon-target-pure-style-master
```yaml
node: abandon-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [generate-target-pure-style-master]
produces: [target-pure-style-master-abandonment]
entry: []
exit: [evidence:target-pure-style-master-abandoned]
```
**Step 1 — GATE**: Only when inspection reports an unknown submitted candidate, obtain one bounded human reason.
**Step 2 — CLI**: Run `ppt_flow style-master abandon <run-dir> --plan-hash <sha256> --reason <text>`. Do not retry, infer an outcome, or create a successor from this node. Skip this node when no unknown attempt exists.

### review-target-pure-style-master
```yaml
node: review-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [plan-target-pure-style-master, authorize-target-pure-style-master, generate-target-pure-style-master, abandon-target-pure-style-master]
produces: [target-pure-style-master-real-byte-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Run `ppt_flow style-master review <run-dir> --plan-hash <sha256>` and present only the Pure plan's validated real candidate bytes.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` as the Style Master visual-direction decision. For `repair` or `redirect`, persist the exact owner decision and return to its next Style Master action; do not enter page raw authorization.

### promote-target-pure-style-master
```yaml
node: promote-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [review-target-pure-style-master]
produces: [target-pure-style-master-acceptance]
entry: [node_decision:review-target-pure-style-master:proceed]
exit: [style_master_accepted]
```
**Step 1 — CLI**: Run `ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision proceed --candidate-id <slot-id>`. Promotion is complete only when the owner exposes the current accepted selection; a failed presentation JPEG projection must use the producer-issued exact replay invocation.

### plan-target-pure-progressive-raw
```yaml
node: plan-target-pure-progressive-raw
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
draft_route: true
requires: [promote-target-pure-style-master]
produces: [target-pure-progressive-raw-plan]
entry: [style_master_accepted]
exit: [evidence:target-pure-progressive-raw-plan-current]
```
**Step 1 — CLI**: Run `ppt_flow image2 plan <run-dir>`. It compiles one provider-free full Pure raw plan and exposes only the owner-issued next action.

### recommend-target-pure-pilot
```yaml
node: recommend-target-pure-pilot
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [plan-target-pure-progressive-raw]
produces: [target-pure-pilot-projection]
entry: []
exit: [evidence:target-pure-pilot-projection-current]
```
**Step 1 — MD**: Recommend a risk-representative set of exact formal slide IDs only when workflow inspection requests a Pilot scope. Do not infer a partial route from card text or positions.
**Step 2 — CLI**: Run `ppt_flow image2 pilot <run-dir> --plan-hash <sha256> --slide-id <formal-id> ...` and present the returned ordered scope, display facts, paid membership, and maximum submissions.

### authorize-target-pure-pilot
```yaml
node: authorize-target-pure-pilot
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [recommend-target-pure-pilot]
produces: [target-pure-pilot-authorization]
entry: []
exit: [evidence:exact-batch-grant-recorded]
```
**Step 1 — CLI**: Run `ppt_flow image2 authorize <run-dir> --plan-hash <sha256> --batch-hash <sha256>`. For a matching current Task Mandate, the State-owned CLI handoff records the exact grant evidence and completes this node. This does not accept raw quality or authorize Expansion.

### generate-target-pure-pilot
```yaml
node: generate-target-pure-pilot
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [authorize-target-pure-pilot]
produces: [target-pure-pilot-item-progress]
entry: [node_evidence:authorize-target-pure-pilot:exact-batch-grant-recorded]
exit: [evidence:target-pure-pilot-item-progress]
```
**Step 1 — CLI**: Re-run `ppt_flow image2 generate` with the exact plan and batch hashes. Each invocation may submit and materialize at most one owner-eligible item; refresh inspection before the next call.

### review-target-pure-pilot
```yaml
node: review-target-pure-pilot
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [generate-target-pure-pilot]
produces: [target-pure-pilot-evidence]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Run `ppt_flow image2 pilot-review` for the exact partial Pilot batch and present only the exact Pure raw page bytes plus their current bindings.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` for the exact Pilot evidence. A partial `proceed` only unlocks owner-derived Expansion planning.

### plan-target-pure-expansion
```yaml
node: plan-target-pure-expansion
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [review-target-pure-pilot]
produces: [target-pure-expansion-projection]
entry: [node_decision:review-target-pure-pilot:proceed]
exit: [evidence:target-pure-expansion-projection-current]
```
**Step 1 — CLI**: Run `ppt_flow image2 pilot-accept ... --decision proceed`, refresh inspection, then run `ppt_flow image2 expansion <run-dir> --plan-hash <sha256>`. The owner, not the Controller, derives the remaining paid scope.

### authorize-target-pure-expansion
```yaml
node: authorize-target-pure-expansion
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [plan-target-pure-expansion]
produces: [target-pure-expansion-authorization]
entry: []
exit: [evidence:exact-batch-grant-recorded]
```
**Step 1 — CLI**: Run `ppt_flow image2 authorize <run-dir> --plan-hash <sha256> --batch-hash <sha256>`. For a matching current Task Mandate, the State-owned CLI handoff records the exact grant evidence and completes this node.

### generate-target-pure-expansion
```yaml
node: generate-target-pure-expansion
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [authorize-target-pure-expansion]
produces: [target-pure-expansion-item-progress]
entry: [node_evidence:authorize-target-pure-expansion:exact-batch-grant-recorded]
exit: [evidence:target-pure-expansion-item-progress]
```
**Step 1 — CLI**: Re-run the exact one-item `ppt_flow image2 generate` invocation and refresh owner inspection after every result.

### review-target-pure-raw
```yaml
node: review-target-pure-raw
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [plan-target-pure-progressive-raw]
produces: [target-pure-complete-raw-review]
decisions: [proceed, repair]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Only when owner inspection requests complete review, run `ppt_flow image2 review <run-dir> --plan-hash <sha256>` and present full-plan current Pure evidence.
**Step 2 — GATE**: Record `proceed` or `repair` against the complete raw review. Small debt and zero debt arrive here without a synthetic partial Pilot decision.

### publish-target-pure-final-manifest
```yaml
node: publish-target-pure-final-manifest
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [pure]
requires: [review-target-pure-raw]
produces: [target-pure-final-slide-manifest]
entry: [node_decision:review-target-pure-raw:proceed]
exit: [evidence:target-pure-final-manifest-current]
```
**Step 1 — CLI**: Run `ppt_flow image2 accept <run-dir> --plan-hash <sha256> --decision proceed`, then let the Pure workflow publish its final manifest from the accepted v3 evidence. It does not assemble PPTX or notes.

### deliver-target-page-image
```yaml
node: deliver-target-page-image
lifecycle_phase: 4
method_module: 05-delivery
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed, pure]
requires: [publish-target-framed-final-manifest, publish-target-pure-final-manifest]
produces: [target-page-image-pptx, target-page-image-notes]
entry: []
exit: [pptx_generated, speaker_notes_injected]
```
**Step 1 — CLI**: Run the existing delivery action for the selected workflow's common final-slide manifest. Delivery owns final projection, PPTX assembly, and notes injection.

### review-target-page-image-delivery
```yaml
node: review-target-page-image-delivery
lifecycle_phase: 4
method_module: 05-delivery
adapter: page-image-workflow
production_modes: [image2-page-workflow]
production_workflows: [framed, pure]
requires: [deliver-target-page-image]
produces: [target-page-image-delivery-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Present the current final projection, PPTX, and notes receipt from shared delivery.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against that exact delivery lineage.

### complete-target-page-image-iteration
```yaml
node: complete-target-page-image-iteration
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-workflow]
production_workflows: [framed, pure]
requires: [review-target-page-image-delivery]
produces: [delivered-target-page-image-deck]
entry: []
exit: [evidence:target-page-image-delivery-complete]
```
**Step 1 — MD**: Deliver the current target version. The bound workflow selects future refresh ownership; structural and whole-workflow changes create a previewed vNext.
