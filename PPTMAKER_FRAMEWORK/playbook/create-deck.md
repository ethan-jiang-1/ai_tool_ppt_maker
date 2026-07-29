---
playbook: create-deck
description: Page Authority deck creation and delivery
supported_pipelines: [page-authority-image2-v1, page-authority-image2-v2]
supported_production_modes: [image2-page-authority, image2-page-authority-v2]
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

### author-page-authority-content
```yaml
node: author-page-authority-content
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-authority]
requires: [checkpoint-intake]
produces: [page-authority-source, stable-slide-ids]
entry: []
exit: [slide_specs_exists, slide_specs_valid]
```
**Step 1 — MD**: Author only the Page Authority source. Each stable slide ID selects `pure-image2` or `framed-image2`; source never contains retired source fields, slide-owned markup/CSS, or provider prompt prose.
**Step 2 — CLI**: Run `ppt_flow validate <run-dir>` before any provider readiness or authorization.

### configure-page-authority-visual-system
```yaml
node: configure-page-authority-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-authority]
requires: [author-page-authority-content]
produces: [page-authority-visual-language, text-frame-preflight]
entry: []
exit: [visual_preset_seeded]
```
**Step 1 — MD**: Maintain the closed visual-language and reference registries. Framed text geometry is compiler-owned.

### authorize-page-authority-raw
```yaml
node: authorize-page-authority-raw
lifecycle_phase: 4
method_module: 04-image-production
adapter: page-authority-image2
production_modes: [image2-page-authority]
requires: [configure-page-authority-visual-system]
produces: [page-authority-raw-authorization]
decisions: [authorize, revise, decline]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — CLI**: Run `ppt_flow image2 plan <run-dir> --json`; authorize nonzero work only with the exact plan hash.
**Step 2 — GATE**: Record `authorize`, `revise`, or `decline` only after the plan discloses its exact scope and cost.

### generate-page-authority-raw
```yaml
node: generate-page-authority-raw
lifecycle_phase: 4
method_module: 04-image-production
adapter: page-authority-image2
production_modes: [image2-page-authority]
requires: [authorize-page-authority-raw]
produces: [page-authority-raw-manifest]
entry: []
exit: [evidence:page-authority-raw-current]
```
**Step 1 — CLI**: Run the Page Authority raw lifecycle with the current authorization; do not infer provider consent.

### review-page-authority-raw
```yaml
node: review-page-authority-raw
lifecycle_phase: 4
method_module: 04-image-production
adapter: page-authority-image2
production_modes: [image2-page-authority]
requires: [generate-page-authority-raw]
produces: [page-authority-raw-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Review the exact raw projection. A current undecided projection is the sole raw confirmation gate.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against the current raw review evidence.

### finalize-page-authority-delivery
```yaml
node: finalize-page-authority-delivery
lifecycle_phase: 4
method_module: 04-image-production
adapter: page-authority-image2
production_modes: [image2-page-authority]
requires: [review-page-authority-raw]
produces: [page-authority-final-manifest, page-authority-pptx, page-authority-notes]
entry: []
exit: [pptx_generated, speaker_notes_injected]
```
**Step 1 — CLI**: Run `ppt_flow build <run-dir>`. It finalizes only Page Authority raw evidence, then assembles PPTX and notes.

### checkpoint-page-authority-delivery-review
```yaml
node: checkpoint-page-authority-delivery-review
lifecycle_phase: 4
method_module: 04-image-production
adapter: page-authority-image2
production_modes: [image2-page-authority]
requires: [finalize-page-authority-delivery]
produces: [page-authority-delivery-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```
**Step 1 — MD**: Present the current final projection, PPTX, and notes receipt, then record the exact delivery decision.
**Step 2 — GATE**: Record `proceed`, `repair`, or `redirect` against the exact final evidence lineage.

### final-page-authority
```yaml
node: final-page-authority
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [image2-page-authority]
requires: [checkpoint-page-authority-delivery-review]
produces: [delivered-page-authority-deck]
entry: []
exit: [evidence:page-authority-delivery-complete]
```
**Step 1 — MD**: Deliver the current version. Structural edits create a previewed version; notes-only and Framed-local refreshes use their direct owners.

## TARGET v2: One Workflow Per Version

The TARGET controller records one human `framed` or `pure` decision before it
can expose provider-facing work. It then follows exactly one sibling path into
shared delivery and iteration. The source/state resolver remains the authority
for receipt identity, workflow binding, evidence, and recovery.

### select-target-page-authority-workflow
```yaml
node: select-target-page-authority-workflow
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-authority-v2]
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
requires: [select-target-page-authority-workflow]
produces: [page-authority-source-v2, page-authority-source-receipt-v2, stable-slide-ids]
entry: []
exit: [slide_specs_exists, slide_specs_valid]
```
**Step 1 — MD**: Author the canonical v2 Page Authority source with the recorded version workflow. The source has no `page_authority_default` or per-slide authority declaration.
**Step 2 — CLI**: Run the existing source validation action before any provider readiness or authorization.

### configure-target-page-authority-visual-system
```yaml
node: configure-target-page-authority-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-authority-v2]
production_workflows: [framed, pure]
requires: [author-target-page-authority-content]
produces: [target-page-authority-visual-language]
entry: []
exit: [visual_preset_seeded]
```
**Step 1 — MD**: Maintain the closed visual-language and reference registries. Framed-specific Text Frame facts remain owned by the selected Framed workflow.

### authorize-target-framed-raw
```yaml
node: authorize-target-framed-raw
lifecycle_phase: 4
method_module: 03-framed-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [framed]
requires: [configure-target-page-authority-visual-system]
produces: [target-framed-raw-authorization]
decisions: [authorize, revise, decline]
entry: []
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

### authorize-target-pure-raw
```yaml
node: authorize-target-pure-raw
lifecycle_phase: 4
method_module: 04-pure-image
adapter: page-authority-image2-v2
production_modes: [image2-page-authority-v2]
production_workflows: [pure]
requires: [configure-target-page-authority-visual-system]
produces: [target-pure-raw-authorization]
decisions: [authorize, revise, decline]
entry: []
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
