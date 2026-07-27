---
playbook: create-deck
description: Page Authority deck creation and delivery
supported_pipelines: [page-authority-image2-v1]
supported_production_modes: [image2-page-authority]
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
