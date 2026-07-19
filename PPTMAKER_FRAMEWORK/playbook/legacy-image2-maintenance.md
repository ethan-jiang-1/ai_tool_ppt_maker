---
playbook: legacy-image2-maintenance
description: markerless whole-page Image2 deck 的隔离兼容维护
supported_pipelines: [legacy-image2-first]
includes: [classify-change]
---

# Playbook: Legacy Image2 Maintenance

只接受 canonical markerless run。它不是新 deck controller，也不能处理 `html-first-v1`。

## Nodes

### classify-change (shared)

Select Header Text & Style Refresh, Generated Image Rebuild, Notes-Only Refresh, or Structural Versioning Path after marker classification.

### inspect-legacy-evidence

```yaml
node: inspect-legacy-evidence
lifecycle_phase: 5
method_module: 05-iteration
requires: [classify-change]
produces: [legacy-maintenance-plan]
entry: [slide_specs_exists]
exit: [evidence:legacy-scope-inspected]
```

**Step 1 — MD**: Inspect style master/prompt, raw/header manifests, header review, resolution/model profile, gates, and exact affected IDs. Opposite-branch HTML artifacts are ineligible.

**Step 2 — MD**: Report whether the path is local-only or remote, estimated submissions, reuse proof, review scope, and missing/stale evidence.

### authorize-legacy-generation

```yaml
node: authorize-legacy-generation
lifecycle_phase: 5
method_module: 05-iteration
requires: [inspect-legacy-evidence]
produces: [legacy-generation-decision]
decisions: [authorize, revise, decline]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — GATE**: Required only for Generated Image Rebuild or other provider submit. Confirmation binds IDs/profile/count; structure approval, channel probe, old authorization, or a diagnostic hint is not authorization.

### run-legacy-maintenance

```yaml
node: run-legacy-maintenance
lifecycle_phase: 5
method_module: 05-iteration
requires: [authorize-legacy-generation]
produces: [legacy-preview-or-delivery]
entry: [node_decision:authorize-legacy-generation:authorize]
exit: [pptx_generated, speaker_notes_injected, header_review_current]
```

**Step 1 — CLI**: Use the existing markerless style-master/pilot/header/build/refresh commands and exact reviewed-image reuse rules. Observe remote long jobs and expose bounded progress.

**Step 2 — MD**: Open pilot/contact sheet/PPTX; approve header evidence only from current profile/provenance. Notes-only and header-only local paths may bypass this remote node when classifier evidence proves no provider work.

### verify-legacy-maintenance

```yaml
node: verify-legacy-maintenance
lifecycle_phase: 5
method_module: 05-iteration
requires: [run-legacy-maintenance]
produces: [verified-legacy-change]
entry: []
exit: [user_evidence:legacy-change-verified]
```

**Step 1 — MD**: Verify selected/unchanged pages, current legacy gates/header evidence, PPTX, and notes. Do not create HTML review/reset evidence.

**Step 2 — GATE**: Record the user's current legacy delivery decision.
