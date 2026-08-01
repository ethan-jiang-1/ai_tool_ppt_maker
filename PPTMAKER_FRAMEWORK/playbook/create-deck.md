---
playbook: create-deck
description: v2 Page Authority deck creation and delivery
supported_pipelines: [page-authority-image2-v2]
supported_production_modes: [image2-page-authority-v2]
includes: []
---

# Playbook: Create Deck

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

## One Workflow Per Version



The TARGET controller records one human `framed` or `pure` decision before it
can expose provider-facing work. It then follows exactly one sibling path into
shared delivery and iteration. The source/state resolver remains the authority
for receipt identity, workflow binding, evidence, and recovery.

### Owner diagnostic handoff

When an owner CLI exits nonzero, consume only the final nonempty stderr JSON
envelope. Use the producer-issued `diagnostic.category` and `diagnostic.next`,
not explanatory prose or a locally recreated category/action table. Perform a
mechanical repair only when that owner action permits it, then rerun its named
checkpoint. This never replaces the existing raw visual `proceed`, `repair`,
or `redirect` confirmation.

For Style Master work, project only the owner-issued current scope head, exact
plan hash, grant progress, real-byte review evidence, and next action. A
Controller node status or an OpenSpec task checkbox is a collaboration record,
not candidate authority or a resume signal. `proceed`, `repair`, and `redirect`
are Style Master visual-direction decisions; none grants page-raw cost or
acceptance.

### select-target-page-authority-workflow
```yaml
node: select-target-page-authority-workflow
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-authority-v2]
draft_route: true
requires: [checkpoint-intake]
produces: [target-page-authority-workflow-choice]
decisions: [framed, pure]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Choose one version workflow, `framed` or `pure`, based on the content and visual intent. Do not choose an authority per slide.
**Step 2 — GATE**: Record the one workflow decision before the canonical target source is authored. This decision does not waive source/state validation.

### author-target-page-authority-content
```yaml
node: author-target-page-authority-content
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
draft_route: true
requires: [select-target-page-authority-workflow]
produces: [page-authority-source-v2, page-authority-source-receipt-v2, stable-slide-ids]
entry: []
exit: [slide_specs_exists, slide_specs_valid]
```
**Step 1 — MD**: Author the canonical v2 Page Authority source with the recorded version workflow. The workflow applies to every slide in the version.
**Step 2 — CLI**: Run the existing source validation action before any provider readiness or authorization.

### configure-target-page-authority-visual-system
```yaml
node: configure-target-page-authority-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
draft_route: true
requires: [author-target-page-authority-content]
produces: [target-page-authority-visual-language]
entry: []
exit: [visual_preset_seeded]
```
**Step 1 — MD**: Maintain the closed visual-language and reference registries. Framed-specific Text Frame facts remain owned by the selected Framed workflow.

### inspect-target-framed-style-master
```yaml
node: inspect-target-framed-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
draft_route: true
requires: [configure-target-page-authority-visual-system]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
draft_route: true
requires: [review-target-framed-style-master]
produces: [target-framed-style-master-acceptance]
entry: [node_decision:review-target-framed-style-master:proceed]
exit: [style_master_accepted]
```
**Step 1 — CLI**: Run `ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision proceed --candidate-id <slot-id>`. Promotion is complete only when the owner exposes the current accepted selection; a failed compatibility projection must use the producer-issued exact replay invocation.

### authorize-target-framed-raw
```yaml
node: authorize-target-framed-raw
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
draft_route: true
requires: [promote-target-framed-style-master]
produces: [target-framed-raw-authorization]
decisions: [authorize, revise, decline]
entry: [style_master_accepted]
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Use the existing owner-issued raw-plan action for the exact Framed target receipt and authorize only its disclosed scope.
**Step 2 — GATE**: Record `authorize`, `revise`, or `decline` against that exact scoped plan.

### generate-target-framed-raw
```yaml
node: generate-target-framed-raw
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
requires: [authorize-target-framed-raw]
produces: [target-framed-accepted-raw-evidence]
entry: []
exit: [evidence:target-framed-raw-current]
```
**Step 1 — CLI**: Run only the authorized Framed raw work through the shared raw owner; it records evidence for the exact target plan.

### review-target-framed-raw
```yaml
node: review-target-framed-raw
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
requires: [generate-target-framed-raw]
produces: [target-framed-raw-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Review the exact Framed raw projection and its source-bound evidence.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against the current evidence only.

### publish-target-framed-final-manifest
```yaml
node: publish-target-framed-final-manifest
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
requires: [review-target-framed-raw]
produces: [target-framed-final-slide-manifest]
entry: []
exit: [evidence:target-framed-final-manifest-current]
```
**Step 1 — CLI**: Have the Framed workflow publish its common final-slide manifest from current accepted evidence. It does not assemble PPTX or notes.

### inspect-target-pure-style-master
```yaml
node: inspect-target-pure-style-master
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
draft_route: true
requires: [configure-target-page-authority-visual-system]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
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
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
draft_route: true
requires: [review-target-pure-style-master]
produces: [target-pure-style-master-acceptance]
entry: [node_decision:review-target-pure-style-master:proceed]
exit: [style_master_accepted]
```
**Step 1 — CLI**: Run `ppt_flow style-master accept <run-dir> --plan-hash <sha256> --decision proceed --candidate-id <slot-id>`. Promotion is complete only when the owner exposes the current accepted selection; a failed compatibility projection must use the producer-issued exact replay invocation.

### authorize-target-pure-raw
```yaml
node: authorize-target-pure-raw
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
draft_route: true
requires: [promote-target-pure-style-master]
produces: [target-pure-raw-authorization]
decisions: [authorize, revise, decline]
entry: [style_master_accepted]
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Use the existing owner-issued raw-plan action for the exact Pure target receipt and authorize only its disclosed scope.
**Step 2 — GATE**: Record `authorize`, `revise`, or `decline` against that exact scoped plan.

### generate-target-pure-raw
```yaml
node: generate-target-pure-raw
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
requires: [authorize-target-pure-raw]
produces: [target-pure-accepted-raw-evidence]
entry: []
exit: [evidence:target-pure-raw-current]
```
**Step 1 — CLI**: Run only the authorized Pure raw work through the shared raw owner; it records evidence for the exact target plan.

### review-target-pure-raw
```yaml
node: review-target-pure-raw
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
requires: [generate-target-pure-raw]
produces: [target-pure-raw-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Review the exact Pure raw projection and its source-bound evidence.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against the current evidence only.

### publish-target-pure-final-manifest
```yaml
node: publish-target-pure-final-manifest
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
requires: [review-target-pure-raw]
produces: [target-pure-final-slide-manifest]
entry: []
exit: [evidence:target-pure-final-manifest-current]
```
**Step 1 — CLI**: Have the Pure workflow publish its common final-slide manifest from current accepted evidence. It does not assemble PPTX or notes.

### deliver-target-page-authority
```yaml
node: deliver-target-page-authority
lifecycle_phase: 4
method_module: 05-delivery
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [publish-target-framed-final-manifest, publish-target-pure-final-manifest]
produces: [target-page-authority-pptx, target-page-authority-notes]
entry: []
exit: [pptx_generated, speaker_notes_injected]
```
**Step 1 — CLI**: Run the existing delivery action for the selected workflow's common final-slide manifest. Delivery owns final projection, PPTX assembly, and notes injection.

### review-target-page-authority-delivery
```yaml
node: review-target-page-authority-delivery
lifecycle_phase: 4
method_module: 05-delivery
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [deliver-target-page-authority]
produces: [target-page-authority-delivery-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Present the current final projection, PPTX, and notes receipt from shared delivery.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against that exact delivery lineage.

### complete-target-page-authority-iteration
```yaml
node: complete-target-page-authority-iteration
lifecycle_phase: 5
method_module: 06-iteration
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [review-target-page-authority-delivery]
produces: [delivered-target-page-authority-deck]
entry: []
exit: [evidence:target-page-authority-delivery-complete]
```
**Step 1 — MD**: Deliver the current target version. The bound workflow selects future refresh ownership; structural and whole-workflow changes create a previewed vNext.
