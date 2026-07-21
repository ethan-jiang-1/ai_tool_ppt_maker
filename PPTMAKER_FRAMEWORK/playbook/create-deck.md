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

**Step 1 — GATE**: Read `ppt_flow state <run-dir> --json` and present its `html_resume_guidance` plus the changed/current content projection. Run its `recommended_command` for the normal repair/approval path; offer its `continuation_command` only after the human supplies the bounded reason. A wrong plan/reset identity, active journal, unsafe state, or missing source is a hard stop: explain the producer-provided invariant and do not offer `--waive`/`--force`. `revise` returns to source authoring. Never hand-edit state or infer approval from rendered pages.

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

**Step 2 — GATE**: Read `ppt_flow state <run-dir> --json` and present its `html_resume_guidance` with the local contact sheet, forced fallback, and bounded outstanding coverage. Run the producer's exact recommended command; present the nullable continuation only for a reversible evidence gap and a supplied reason. A wrong plan/reset identity, active journal, unsafe state, or missing source is a hard stop: explain the producer-provided invariant and use its recovery route. `revise` returns to the owning content/visual-system node; rendering never implies approval.

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

**Step 2 — MD**: If a quality gate is stale, show `html_resume_guidance`, run its recommended preview/approval command, then present its continuation only when it is reversible and the human supplies a reason. A user may explicitly choose `build --force --reason` only through the public CLI; it deterministically publishes only required waivers before local build and never calls a provider. If status reports a journal/reset conflict, explain the protected identity/concurrency invariant and follow its producer-owned action. For an uncertain abandoned gate journal, obtain explicit no-active-writer confirmation and use the exact shown token with `state --recover-gate-journal`. For canonical whole-owner recovery, call only `refresh --kind reset-html-production --confirm-run-version <vN>` and handle `started|resumed|already-complete`; never delete paths/state manually. A reset always returns to fresh preview/content/visual/final review, even when bytes repeat.

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

**Step 2 — GATE**: Use only `ppt_flow state <run-dir> --record-delivery-review proceed|repair|redirect` to record the typed final decision. Recommend rebuilding/reviewing missing lineage first. When reviewable target artifacts are current but lineage is incomplete, present `proceed --force --reason` as the explicit evidence continuation; it remains an evidence waiver rather than approval or complete lineage. Missing reviewable target bytes, unsafe identity, active writer, or corrupted state is a hard stop. Do not call `setNodeDecision` afterward, hand-edit state, or infer final acceptance from conversation.

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

**Step 1 — CLI**: Inspect `ppt_flow state <run-dir> --json` for current reset-bound gates, delivery digest, contact sheet, assembly-v2, notes-v3, delivery review, and independent `evidence_complete` / `waived_checks`. A current forced `proceed` is accepted delivery with a recommended lineage repair; do not require Phase 4.

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
