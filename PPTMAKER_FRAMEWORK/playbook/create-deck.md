---
playbook: create-deck
description: source/state-routed create 流程；新 deck 使用 Page Authority，legacy mode 仅服务显式 existing run
supported_pipelines: [html-first-v1, whole-page-image2-v1, page-authority-image2-v1]
supported_production_modes: [html-only, html-then-image2, image2-only, image2-page-authority]
includes: []
---

# Playbook: Create Deck

本 controller 用 exact version 的 authoritative `production_mode` 过滤节点，再验证 source pipeline。新 deck 的唯一路径是 `image2-page-authority`：逐页明确 `pure-image2|framed-image2`，先取得 scoped raw authorization，再做 raw review、单一 final manifest、PPTX/notes 和 evidence-bound delivery review。`image2-only` 是 existing-run 的 first-class whole-page 生产路径；`html-only` 与 `html-then-image2` 是 existing-run 的 `html-first-v1` 路径。跨 pipeline 改 mode 不编辑当前 version；state-owned versioned transition 保留 source、author target-owned candidate、确认 exact plan，并在 verified handoff 后从此 controller 的 target baseline 继续。

`image2-only` 默认选择 normal whole-page style-master, pilot, content/visual/header review, build, PPTX, notes, evidence-bound final review；每个实际 provider submit 前单独展示并记录 exact operation/scope/profile/count authorization。已证明的 zero-submit reuse/local work 不虚构授权。`html-only` 是 zero-provider 本地完成路径；`html-then-image2` 在 HTML final review 后进入必需的 `image2-refine` handoff，再回到新的 final review。所有质量 gate 基于当前真实 artifact；init、doctor、probe 和旧批次都不是 provider authorization。

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

**Step 1 — CLI**: Resolve the selected/default mode, then run `ppt_flow doctor --mode <mode>`; live probes remain explicit.

**Step 2 — CLI**: Run `ppt_flow init deck_<name> --deck-type <type> --style <style> [--mode <mode>]`, then inspect state-owned mode plus the canonical source marker before further writes.

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
production_modes: [html-only, html-then-image2]
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
production_modes: [html-only, html-then-image2]
requires: [author-structured-content]
produces: [visual-system, asset-catalog]
entry: []
exit: [visual_preset_seeded, evidence:visual-system-configured]
```

**Step 1 — MD**: Configure renderer-neutral palette, bundled typography roles, density, recipes, image language, asset catalog, and forbidden patterns. `color_palette.json` is the single structured truth.

**Step 2 — CLI**: Validate the complete run; do not create a style master or provider state.

### author-whole-page-content

```yaml
node: author-whole-page-content
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-only]
requires: [checkpoint-intake]
produces: [whole-page-slide-source, prompt-briefs, stable-slide-ids]
entry: [node_decision:checkpoint-intake:proceed]
exit: [slide_specs_exists, slide_specs_valid, evidence:whole-page-content-authored]
```

**Step 1 — MD**: Author a canonical whole-page source: mnemonic IDs, exact title/body intent, visual brief, render mode, header ownership, notes, safe-zone constraints, and `production.pipeline: whole-page-image2-v1`.

**Step 2 — CLI**: Run write-free `ppt_flow validate`, repair source/control only, then record the authored evidence.

### configure-whole-page-visual-system

```yaml
node: configure-whole-page-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-only]
requires: [author-whole-page-content]
produces: [whole-page-visual-system, generation-profile]
entry: []
exit: [visual_preset_seeded, evidence:whole-page-visual-system-configured]
```

**Step 1 — MD**: Set the whole-page visual direction, image language, safe zones, render modes, and source-owned reference constraints. This does not create a provider request.

**Step 2 — CLI**: Run `ppt_flow doctor --mode image2-only` for offline readiness; doctor does not authorize a production submit.

### authorize-image2-style-master

```yaml
node: authorize-image2-style-master
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [configure-whole-page-visual-system]
produces: [image2-style-master-authorization]
decisions: [authorize, revise, decline]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — GATE**: If style-master bytes are not proven reusable, show exact operation `style-master`, role, current profile, and max submission count. Persist the typed decision through the state owner; do not hand-edit YAML. `decline` creates no provider attempt.

### generate-image2-style-master

```yaml
node: generate-image2-style-master
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [authorize-image2-style-master]
produces: [style-master]
entry: [node_decision:authorize-image2-style-master:authorize]
exit: [style_master_exists]
```

**Step 1 — CLI**: Run `ppt_flow style-master <run-dir>`. The adapter rederives the scoped authorization immediately before a submit and bypasses it only for proven no-op reuse.

### pilot-image2-pages

```yaml
node: pilot-image2-pages
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [generate-image2-style-master]
produces: [image2-pilot, pilot-contact-sheet]
entry: [style_master_exists]
exit: [evidence:image2-pilot-current]
```

**Step 1 — GATE**: Before a pilot batch that would submit, show selected stable IDs, profile, and maximum submissions; record its exact authorization. A current provenance reuse batch proceeds locally.

**Step 2 — CLI**: Run `ppt_flow pilot <run-dir> [--only <ids>]`, then show the current whole-page pilot contact sheet.

### review-image2-content

```yaml
node: review-image2-content
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [pilot-image2-pages]
produces: [image2-content-review]
decisions: [approve, revise, waive]
entry: []
exit: [user_decision_recorded, gate_approved:content]
```

**Step 1 — GATE**: Review current whole-page content evidence and record `ppt_flow approve <run-dir> content`; revise returns to the owning source node. Rendering alone is never approval.

### review-image2-visual

```yaml
node: review-image2-visual
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [review-image2-content]
produces: [image2-visual-review]
decisions: [approve, revise, waive]
entry: []
exit: [user_decision_recorded, gate_approved:visual]
```

**Step 1 — GATE**: Review visual direction, image legibility, safe zones, and cross-slide coherence from the pilot evidence. Record only the exact whole-page visual decision.

### review-image2-header

```yaml
node: review-image2-header
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [review-image2-visual]
produces: [header-review]
decisions: [approve, revise, waive]
entry: []
exit: [user_decision_recorded, header_review_current]
```

**Step 1 — GATE**: Show current pilot/header evidence, then record the exact human decision through `ppt_flow approve <run-dir> header`. A title/header change invalidates this evidence through the whole-page owner.

### authorize-image2-build

```yaml
node: authorize-image2-build
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [review-image2-header]
produces: [image2-build-authorization]
decisions: [authorize, revise, decline]
entry: [gate_approved:content, gate_approved:visual, header_review_current]
exit: [user_decision_recorded]
```

**Step 1 — GATE**: For any remaining remote render batch, show operation `build`, exact IDs, profile, and max submits, then persist a fresh state-owned authorization. Reuse-only assembly requires none.

### produce-image2-deck

```yaml
node: produce-image2-deck
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [authorize-image2-build]
produces: [whole-page-contact-sheet, final-pptx, notes-receipt]
entry: [node_decision:authorize-image2-build:authorize]
exit: [pptx_generated, speaker_notes_injected, evidence:image2-delivery-current]
```

**Step 1 — CLI**: Run `ppt_flow build <run-dir>`. The normal whole-page adapter preserves current/reviewed bytes, generation manifests, contact-sheet placement, PPTX, and notes; a real submit rechecks authorization at transport time.

### checkpoint-image2-final-review

```yaml
node: checkpoint-image2-final-review
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [produce-image2-deck]
produces: [image2-delivery-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Show the current whole-page contact sheet, PPTX, and notes result before asking for `proceed`, `repair`, or `redirect`.

**Step 2 — GATE**: Record only `ppt_flow state <run-dir> --record-image2-delivery-review proceed|repair|redirect [--reason <text>]`. The state owner derives header/contact-sheet/PPTX/notes lineage; there is no force path.

### repair-image2-deck

```yaml
node: repair-image2-deck
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [checkpoint-image2-final-review]
produces: [completed-image2-repair]
entry: [node_decision:checkpoint-image2-final-review:repair]
exit: [evidence:image2-repair-completed]
```

**Step 1 — MD**: Classify the durable repair reason into source, visual-system, title/header, notes, or Structural Versioning ownership, then return to the affected whole-page node.

### image2-readiness

```yaml
node: image2-readiness
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [checkpoint-image2-final-review]
produces: [image2-delivery-checklist]
entry: [node_decision:checkpoint-image2-final-review:proceed]
exit: [pptx_generated, speaker_notes_injected, header_review_current, evidence:image2-delivery-checks-passed]
```

**Step 1 — CLI**: Inspect `ppt_flow state <run-dir> --json` for exact mode/pipeline consistency, whole-page gates, header evidence, and evidence-bound final review. HTML and modern-refinement evidence are not completion debt.

### final-image2

```yaml
node: final-image2
lifecycle_phase: 4
method_module: 04-image-production
adapter: whole-page
production_modes: [image2-only]
requires: [image2-readiness]
produces: [delivered-image2-deck]
entry: []
exit: [evidence:image2-deck-delivered]
```

**Step 1 — MD**: Deliver the current PPTX/version and normal whole-page Image2 iteration routes through this `create-deck` controller.

### author-page-authority-content

```yaml
node: author-page-authority-content
lifecycle_phase: 1
method_module: 01-content
production_modes: [image2-page-authority]
requires: [checkpoint-intake]
produces: [page-authority-source, stable-slide-ids, per-slide-authority-receipt]
entry: [node_decision:checkpoint-intake:proceed]
exit: [slide_specs_exists, slide_specs_valid, evidence:page-authority-source-authored]
```

**Step 1 — MD**: Author the canonical Page Authority source. Select `pure-image2` whenever readable body labels, values, dates, quotations, captions, or diagram text carry meaning; select `framed-image2` only for a text-free underlay below the fixed local Text Frame. Use only the closed `VISUAL BRIEF` and registered identity forms; do not add `IMAGE PROMPT`, `RENDER MODE`, HTML, or provider instructions.

**Step 2 — CLI**: Run write-free `ppt_flow validate <run-dir>`. A source, frame, registry, identity, or source/state error is a hard stop with the validation owner's repair action; no provider readiness or authorization is requested yet.

### configure-page-authority-visual-system

```yaml
node: configure-page-authority-visual-system
lifecycle_phase: 2
method_module: 02-visual-system
production_modes: [image2-page-authority]
requires: [author-page-authority-content]
produces: [page-authority-visual-language, text-frame-preflight, generation-profile]
entry: []
exit: [visual_preset_seeded, evidence:page-authority-visual-system-configured]
```

**Step 1 — MD**: Maintain the deck-owned closed visual-language registry, registered clean identity derivatives, and effective style-master bytes. Framed Text Frame geometry, typography, and colors are the fixed `standard-v1` preset, never slide-owned CSS.

**Step 2 — CLI**: Run `ppt_flow doctor --run-dir <run-dir> --operation framed-local-refresh` for local runtime facts. Raw provider credentials remain deferred until a selected raw-generation operation.

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

**Step 1 — CLI**: Run `ppt_flow image2 plan <run-dir> --json`. A zero-submit plan continues mechanically; it must not request approval.

**Step 2 — GATE**: For a nonzero plan, disclose the exact run, stable IDs, raw generation profile, and maximum submissions. The human authorization is recorded only by `ppt_flow image2 authorize <run-dir> --plan-hash <hash>`; init, doctor, a review, a previous batch, or chat is never authorization. Invalid scope or attempted unauthorized submission is a hard stop; return to the raw-plan owner.

### generate-page-authority-raw

```yaml
node: generate-page-authority-raw
lifecycle_phase: 4
method_module: 04-image-production
adapter: page-authority-image2
production_modes: [image2-page-authority]
requires: [authorize-page-authority-raw]
produces: [page-authority-raw-manifest]
entry: [node_decision:authorize-page-authority-raw:authorize]
exit: [evidence:page-authority-raw-current]
```

**Step 1 — CLI**: Run `ppt_flow doctor --run-dir <run-dir> --operation raw-generation`, then `ppt_flow image2 generate <run-dir> --plan-hash <hash>`. The provider boundary rederives the exact authorization immediately before each nonzero submit.

**Step 2 — MD**: If raw evidence is missing, partial, stale, profile-drifted, or mismatched, return directly to `authorize-page-authority-raw`; do not substitute HTML review, Image2 refinement, Header-Lock, or a generated path.

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

**Step 1 — CLI**: Run `ppt_flow image2 review <run-dir> --json` to create the current non-publishing raw projection. Framed views expose only the safe-zone guide, never Text Frame literals.

**Step 2 — GATE**: When every tuple and projection is current, present `proceed|repair|redirect` and record the human decision only through `ppt_flow image2 accept <run-dir> --decision <decision>`. Missing or stale evidence is a hard stop with the raw-review repair action; a current undecided projection is the one `confirm` gate.

### finalize-page-authority-delivery

```yaml
node: finalize-page-authority-delivery
lifecycle_phase: 4
method_module: 04-image-production
adapter: page-authority-image2
production_modes: [image2-page-authority]
requires: [review-page-authority-raw]
produces: [page-authority-final-manifest, page-authority-final-projection, page-authority-pptx, page-authority-notes]
entry: [node_decision:review-page-authority-raw:proceed]
exit: [pptx_generated, speaker_notes_injected, evidence:page-authority-final-current]
```

**Step 1 — CLI**: Run `ppt_flow build <run-dir>`. It reaches the sole `finalizePage(...)` interface, then the one final manifest, final projection, PPTX assembly, and notes receipt. It never invokes Header-Lock, HTML-first, visual-slot, or a legacy generated-artifact route.

**Step 2 — MD**: A Framed Text Frame-only refresh with exact accepted raw evidence may use `ppt_flow refresh <run-dir> --kind title --only <stable-id>` and submits zero provider work. A Pure display or raw visual change returns to receipt-bound raw planning and review.

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

**Step 1 — MD**: Show the current raw and final projections, plus the assembled PPTX and notes result. Do not infer acceptance from a prior raw decision or an earlier delivery decision.

**Step 2 — GATE**: Record only `ppt_flow state <run-dir> --record-page-authority-delivery-review proceed|repair|redirect [--reason <reason>]`. JS binds this choice to the exact source epoch, raw review, final manifest/projection, assembly/PPTX, and notes receipt. Missing/stale evidence is a hard stop with the listed owner recovery; a complete current delivery awaiting a choice is the one confirm gate.

### final-page-authority

```yaml
node: final-page-authority
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [image2-page-authority]
requires: [checkpoint-page-authority-delivery-review]
produces: [delivered-page-authority-deck]
entry: [node_decision:checkpoint-page-authority-delivery-review:proceed]
exit: [evidence:page-authority-delivery-complete]
```

**Step 1 — MD**: Deliver the current Page Authority PPTX/version. If any source, raw tuple, final manifest, assembly, or notes fact changes, return to its direct owner and obtain a new current delivery decision.

### preview-content

```yaml
node: preview-content
lifecycle_phase: 3
method_module: 03-html-production
production_modes: [html-only, html-then-image2]
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
production_modes: [html-only, html-then-image2]
requires: [preview-content]
produces: [html-content-review]
decisions: [approve, revise, waive]
entry: []
exit: [user_decision_recorded, gate_approved:content]
```

**Step 1 — GATE**: Read `ppt_flow state <run-dir> --json` and present its `workflow_inspection.primary_action` plus the changed/current content projection. Run the owner-issued action for the normal repair/approval path; offer `workflow_inspection.continuation` only after the human supplies the bounded reason. A wrong plan/reset identity, active journal, unsafe state, or missing source is a hard stop: explain the producer-provided invariant and do not offer `--waive`/`--force`. `revise` returns to source authoring. Never hand-edit state or infer approval from rendered pages.

### review-visual

```yaml
node: review-visual
lifecycle_phase: 3
method_module: 03-html-production
production_modes: [html-only, html-then-image2]
requires: [review-content]
produces: [html-visual-review]
decisions: [approve, revise, waive]
entry: []
exit: [user_decision_recorded, gate_approved:visual]
```

**Step 1 — MD**: Open the current local visual contact sheet and every outstanding recipe/page representative, including forced fallback where a selected asset hides it.

**Step 2 — GATE**: Read `ppt_flow state <run-dir> --json` and present its `workflow_inspection.primary_action` with the local contact sheet, forced fallback, and bounded outstanding coverage. Run the producer's owner-issued action; present `workflow_inspection.continuation` only for a reversible evidence gap and a supplied reason. A wrong plan/reset identity, active journal, unsafe state, or missing source is a hard stop: explain the producer-provided invariant and use its recovery route. `revise` returns to the owning content/visual-system node; rendering never implies approval.

### produce-html-deck

```yaml
node: produce-html-deck
lifecycle_phase: 3
method_module: 03-html-production
production_modes: [html-only, html-then-image2]
requires: [review-visual]
produces: [delivery-contact-sheet, final-pptx, notes-receipt]
entry: [gate_approved:content, gate_approved:visual]
exit: [pptx_generated, speaker_notes_injected, evidence:html-delivery-current]
```

**Step 1 — CLI**: Run `ppt_flow build <run-dir>`. It recovers only eligible same-host dead gate journals, then executes local Stages 1-5 with no provider options.

**Step 2 — MD**: If a quality gate is stale, show `workflow_inspection.primary_action`, run its owner-issued preview/approval action, then present `workflow_inspection.continuation` only when it is reversible and the human supplies a reason. A user may explicitly choose `build --force --reason` only through the public CLI; it deterministically publishes only required waivers before local build and never calls a provider. If status reports a journal/reset conflict, explain the protected identity/concurrency invariant and follow its producer-owned action. For an uncertain abandoned gate journal, obtain explicit no-active-writer confirmation and use the exact shown token with `state --recover-gate-journal`. For canonical whole-owner recovery, call only `refresh --kind reset-html-production --confirm-run-version <vN>` and handle `started|resumed|already-complete`; never delete paths/state manually. A reset always returns to fresh preview/content/visual/final review, even when bytes repeat.

### checkpoint-final-review

```yaml
node: checkpoint-final-review
lifecycle_phase: 3
method_module: 03-html-production
production_modes: [html-only, html-then-image2]
requires: [produce-html-deck]
produces: [html-delivery-review]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: Open the current delivery contact sheet and verify the produced PPTX plus notes result. Explain the three typed exits.

**Step 2 — GATE**: Use only `ppt_flow state <run-dir> --record-delivery-review proceed|repair|redirect` to record the typed final decision. Recommend rebuilding/reviewing missing lineage first. When reviewable target artifacts are current but lineage is incomplete, present `proceed --force --reason` as the explicit evidence continuation; it remains an evidence waiver rather than approval or complete lineage. Missing reviewable target bytes, unsafe identity, active writer, or corrupted state is a hard stop. Do not call `setNodeDecision` afterward, hand-edit state, or infer final acceptance from conversation.

### handoff-to-image2-refinement

```yaml
node: handoff-to-image2-refinement
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [html-then-image2]
mode_transition_handoff: readiness
requires: [checkpoint-final-review]
produces: [required-refinement-handoff]
entry: [node_decision:checkpoint-final-review:proceed]
exit: [evidence:image2-refinement-handoff-recorded]
```

**Step 1 — MD**: `html-then-image2` does not complete after HTML delivery. Persist the declared handoff to `image2-refine`, retain all existing refinement records, and return to a new current HTML final review after refinement. Switching back to `html-only` uses the state CAS handoff to `readiness`; it never marks this node skipped or deletes retained work.

### repair-html-deck

```yaml
node: repair-html-deck
lifecycle_phase: 5
method_module: 05-iteration
production_modes: [html-only, html-then-image2]
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
production_modes: [html-only]
mode_transition_handoff: handoff-to-image2-refinement
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
production_modes: [html-only]
mode_transition_handoff: handoff-to-image2-refinement
requires: [readiness]
produces: [delivered-deck]
entry: []
exit: [evidence:deck-delivered]
```

**Step 1 — MD**: Deliver the current PPTX/version and local iteration routes. A current `proceed` is complete with no refinement debt.
