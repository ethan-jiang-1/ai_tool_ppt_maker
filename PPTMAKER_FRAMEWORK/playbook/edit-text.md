---
playbook: edit-text
description: 文本修改——KICKER/TITLE/SUBTITLE，按 resolved render mode 路由
includes: [classify-change]
---

# Playbook: 文本修改

MD Controller 是流程真相源；本 controller 只处理 KICKER/TITLE/SUBTITLE 意图，并由 `ppt_flow refresh --kind title` 按 resolved render mode 选择 Header Text & Style Refresh 或 Generated Image Rebuild。body label、KPI、card/chart text、案例和数据等 image-owned 内容转交 `edit-visual`。

## Nodes

### classify-change (shared)

读取 shared node，持久化变更类型和明确 slide scope。

### stage-text

```yaml
node: stage-text
lifecycle_phase: 4
method_module: 05-iteration
requires: [classify-change]
produces: [updated-slide, updated-pptx]
entry: [slide_specs_exists]
exit:
  - pptx_generated
  - speaker_notes_injected
  - header_review_current
```

**Step 1 — MD**: 修改所选 slide 的 KICKER/TITLE/SUBTITLE 源字段，不编辑 `_generated/`。

**Step 2 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh <run-dir> --kind title --only <slide-ids>`。`body+header-lock` 通过 Header Text & Style Refresh 自动走 1,3,4,5；`full-page` 需要 Generated Image Rebuild，返回 `TITLE_REVIEW_REQUIRED` 时只对所选页运行 2K `pilot --only <ids> --force-images`。

**Step 3 — GATE**: Open pilot/contact sheet；确认后运行 `approve <run-dir> header`，再用同 profile `build --reuse-images`，不得进行第二次图片生成。

### verify-text-output

```yaml
node: verify-text-output
lifecycle_phase: 4
method_module: 05-iteration
requires: [stage-text]
produces: [verified-slide]
entry: []
exit: [user_evidence:text-change-verified]
```

**Step 1 — MD**: Open 最终 PPTX，检查所选页文字、render mode 和未选页均正确。

**Step 2 — GATE**: 用户确认后记录 `text-change-verified`（kind `user`）并完成节点。
