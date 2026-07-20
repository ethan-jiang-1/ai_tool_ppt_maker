---
playbook: create-deck
description: 从 HTML-first 初始化到本地 contact sheet、PPTX、notes 与 final review
supported_pipelines: [html-first-v1]
includes: []
---

# Playbook: Create Deck

新 deck 不询问 renderer，不要求 Image2 key/style master，不创建 Phase-4 state。所有 human gate 都基于当前 reset-bound real artifacts。

## Nodes

### instantiation

```yaml
node: instantiation
lifecycle_phase: 0
method_module: 00-setup
requires: []
produces: [run-bundle, deck-guide]
entry: []
exit: [run_bundle_exists, deck_guide_created]
```

**Step 1 — CLI**: Run base `ppt_flow doctor`; do not run Image2 presence/live probes.

**Step 2 — CLI**: Run `ppt_flow init deck_<name> --deck-type <type> --style <style>` and verify the canonical run marker before further writes.

### checkpoint-intake

```yaml
node: checkpoint-intake
lifecycle_phase: 0
method_module: 00-setup
requires: [instantiation]
produces: [confirmed-intake]
decisions: [proceed, revise]
entry: []
exit: [user_decision_recorded, user_evidence:intake-confirmed]
```

**Step 1 — MD**: Confirm topic, audience, duration, language, one thing to remember, content constraints, visual DNA, and success criteria. Do not ask for renderer/provider choice.

**Step 2 — GATE**: Record the typed decision. `revise` remains here; `proceed` advances.

### author-structured-content

```yaml
node: author-structured-content
lifecycle_phase: 1
method_module: 01-content
requires: [checkpoint-intake]
produces: [core-metaphor, core-formula, block-map, structured-slide-source]
entry: [node_decision:checkpoint-intake:proceed]
exit: [slide_specs_exists, slide_specs_valid, evidence:structured-content-authored]
```

**Step 1 — MD**: Author mnemonic IDs, ordered blocks, headers, concepts, one closed family/typed body, fallback, and notes. Accurate body text belongs in `SLIDE BODY`, never `IMAGE PROMPT`.

**Step 2 — CLI**: Run write-free `ppt_flow validate`; repair source/control only, then record `structured-content-authored`.

### configure-visual-system

```yaml
node: configure-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
requires: [author-structured-content]
produces: [visual-system, asset-catalog]
entry: []
exit: [visual_preset_seeded, evidence:visual-system-configured]
```

**Step 1 — MD**: Configure renderer-neutral palette, bundled typography roles, density, recipes, image language, asset catalog, and forbidden patterns. `color_palette.json` is the single structured truth.

**Step 2 — CLI**: Validate the complete run; do not create a style master or provider state.

### preview-content

```yaml
node: preview-content
lifecycle_phase: 3
method_module: 03-html-production
requires: [configure-visual-system]
produces: [html-content-review-plan]
entry: []
exit: [evidence:content-preview-current]
```

**Step 1 — CLI**: Run `ppt_flow pilot <run-dir>` to publish production-equivalent local content/visual review artifacts while gates are pending.

**Step 2 — MD**: Open the exact content review projection; show complete order, headers, body/fallback semantics, and outstanding items.

### review-content

```yaml
node: review-content
lifecycle_phase: 3
method_module: 03-html-production
requires: [preview-content]
produces: [html-content-review]
decisions: [approve, revise, waive]
entry: []
exit: [user_decision_recorded, gate_approved:content]
```

**Step 1 — GATE**: Show the changed/current content projection, recommend `pilot` plus exact approval first, and offer a reasoned waiver only for a reversible evidence risk. A wrong plan/reset identity, active journal, unsafe state, or missing source is a hard stop: explain the protected invariant and use the producer-owned recovery route. `revise` returns to source authoring.

### review-visual

```yaml
node: review-visual
lifecycle_phase: 3
method_module: 03-html-production
requires: [review-content]
produces: [html-visual-review]
decisions: [approve, revise, waive]
entry: []
exit: [user_decision_recorded, gate_approved:visual]
```

**Step 1 — MD**: Open the current local visual contact sheet and every outstanding recipe/page representative, including forced fallback where a selected asset hides it.

**Step 2 — GATE**: Show changed recipe/page evidence, recommend the current preview plus exact approval, and offer a reasoned waiver only for a reversible evidence gap. A wrong plan/reset identity, active journal, unsafe state, or missing source is a hard stop: explain the protected invariant and use the producer-owned recovery route. `revise` returns to the owning content/visual-system node.

### produce-html-deck

```yaml
node: produce-html-deck
lifecycle_phase: 3
method_module: 03-html-production
requires: [review-visual]
produces: [delivery-contact-sheet, final-pptx, notes-receipt]
entry: [gate_approved:content, gate_approved:visual]
exit: [pptx_generated, speaker_notes_injected, evidence:html-delivery-current]
```

**Step 1 — CLI**: Run `ppt_flow build <run-dir>`. It recovers only eligible same-host dead gate journals, then executes local Stages 1-5 with no provider options.

**Step 2 — MD**: If a quality gate is stale, show what changed, recommend current preview plus exact approval, then present the owner-provided reasoned continuation only when it is reversible. If status reports a journal/reset conflict, explain the protected identity/concurrency invariant and follow its producer-owned action. For an uncertain abandoned gate journal, obtain explicit no-active-writer confirmation and use the exact shown token with `state --recover-gate-journal`. For canonical whole-owner recovery, call only `refresh --kind reset-html-production --confirm-run-version <vN>` and handle `started|resumed|already-complete`; never delete paths/state manually. A reset always returns to fresh preview/content/visual/final review, even when bytes repeat.

### checkpoint-final-review

```yaml
node: checkpoint-final-review
lifecycle_phase: 3
method_module: 03-html-production
requires: [produce-html-deck]
produces: [html-delivery-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Open the current delivery contact sheet and verify the produced PPTX plus notes result. Explain the three typed exits.

**Step 2 — GATE**: Recommend rebuilding/reviewing missing lineage first. When reviewable target artifacts are current but lineage is incomplete, show the explicit reasoned continuation; it remains an evidence waiver rather than approval. Missing reviewable target bytes, unsafe identity, active writer, or corrupted state is a hard stop. Use only the owner command to record the decision; never hand-edit state.

### repair-html-deck

```yaml
node: repair-html-deck
lifecycle_phase: 5
method_module: 05-iteration
requires: [checkpoint-final-review]
produces: [completed-repair]
entry: [node_decision:checkpoint-final-review:repair]
exit: [evidence:repair-completed]
```

**Step 1 — MD**: Classify the durable repair reason and switch to exact `edit-text|edit-visual|edit-notes|restructure-slides`; resume here after completion and return to production/final review.

### readiness

```yaml
node: readiness
lifecycle_phase: 3
method_module: 03-html-production
requires: [checkpoint-final-review]
produces: [delivery-checklist]
entry: [node_decision:checkpoint-final-review:proceed]
exit: [pptx_generated, speaker_notes_injected, gate_approved:content, gate_approved:visual, evidence:delivery-checks-passed]
```

**Step 1 — CLI**: Inspect current reset-bound gates, delivery digest, contact sheet, assembly-v2, notes-v3, and delivery review. Do not require Phase 4.

### final

```yaml
node: final
lifecycle_phase: 3
method_module: 03-html-production
requires: [readiness]
produces: [delivered-deck]
entry: []
exit: [evidence:deck-delivered]
```

**Step 1 — MD**: Deliver the current PPTX/version and local iteration routes. A current `proceed` is complete with no refinement debt.
