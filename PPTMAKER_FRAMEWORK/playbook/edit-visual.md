---
playbook: edit-visual
description: 视觉修改——固定三页 pilot，审查后再生成范围内页面
includes: [classify-change]
---

# Playbook: 视觉修改

## Nodes

### classify-change (shared)

确认 Generated Image Rebuild、三页代表性 pilot 和最终 regeneration scope。此 controller 也接收 KPI/card/chart label、案例、数据及其他烧入生成图的 body 文本。

### pilot

```yaml
node: pilot
lifecycle_phase: 4
method_module: 05-iteration
requires: [classify-change]
produces: [three-slide-pilot, pilot-contact-sheet]
entry: [style_master_exists]
exit:
  - header_review_current
  - user_evidence:pilot-approved
```

**Step 1 — CLI**: 选择 opener/body/closer 三页，运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot <run-dir> --only <three-slide-ids> --force-images --resolution <production-profile>`。

**Step 2 — GATE**: 必须 open pilot/contact sheet；用户批准后运行 `approve <run-dir> header` 并记录 `pilot-approved`（kind `user`）。

### confirm

```yaml
node: confirm
lifecycle_phase: 4
method_module: 05-iteration
requires: [pilot]
produces: [regeneration-plan]
entry: []
exit: [user_evidence:scope-confirmed]
```

**Step 1 — MD**: 展示所有页或受影响页的明确范围和预计耗时。

**Step 2 — GATE**: 用户确认范围后记录 `scope-confirmed`（kind `user`）。

### regenerate

```yaml
node: regenerate
lifecycle_phase: 4
method_module: 04-production
requires: [confirm]
produces: [updated-images, updated-pptx]
entry: []
exit:
  - pptx_generated
  - speaker_notes_injected
  - header_review_current
```

**Step 1 — CLI**: 对范围内页面先通过 `ppt_flow refresh --kind visual --only <ids>` 或 `pilot --only <ids> --force-images` 实际强制重生并完成 review；再运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir> --resolution 2k --reuse-images`，不得覆盖已审 full-page 图片。

### verify-visual-output

```yaml
node: verify-visual-output
lifecycle_phase: 4
method_module: 05-iteration
requires: [regenerate]
produces: [verified-pptx]
entry: []
exit: [user_evidence:visual-change-verified]
```

**Step 1 — MD**: Open 最终 PPTX，抽查修改页及未修改页的颜色、布局、图片和 header。

**Step 2 — GATE**: 用户确认后记录 `visual-change-verified`（kind `user`）。
