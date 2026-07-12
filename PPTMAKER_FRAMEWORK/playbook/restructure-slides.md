---
playbook: restructure-slides
description: 结构变更——新版本、重建受影响页、验证
includes: [classify-change]
---

# Playbook: 结构变更

## Nodes

### classify-change (shared)

确认增/删/重排范围及受影响 slide IDs。

### new-version

```yaml
node: new-version
lifecycle_phase: 4
method_module: 05-iteration
requires: [classify-change]
produces: [new-version-dir]
entry: [run_bundle_exists]
exit: [evidence:new-version-created]
```

**Step 1 — MD**: 展示结构变化和 source delta，确认新版本边界。

**Step 2 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --new-version <current-run-dir>`；记录 `new-version-created`（kind `cli`）及新 run-dir。

### regenerate-affected

```yaml
node: regenerate-affected
lifecycle_phase: 4
method_module: 04-production
requires: [new-version]
produces: [updated-pptx]
entry: []
exit:
  - pptx_generated
  - speaker_notes_injected
  - header_review_current
```

**Step 1 — MD**: 只编辑新版本的 slide specifications；`_generated/` 保持干净并由管线重建。

**Step 2 — CLI**: 对受影响页按当前 render mode 跑最小链；full-page 必须完成 pilot/header review 后使用 reviewed-image reuse。

### verify-restructure-output

```yaml
node: verify-restructure-output
lifecycle_phase: 4
method_module: 05-iteration
requires: [regenerate-affected]
produces: [verified-structure]
entry: []
exit: [user_evidence:structure-change-verified]
```

**Step 1 — MD**: Open 最终 PPTX，核对新增、删除、重排、页码、notes 和未受影响页面。

**Step 2 — GATE**: 用户确认后记录 `structure-change-verified`（kind `user`）。
