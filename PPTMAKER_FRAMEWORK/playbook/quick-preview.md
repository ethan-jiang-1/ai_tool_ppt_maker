---
playbook: quick-preview
description: style master 就绪后的三页 pilot 快览
includes: []
---

# Playbook: 三页快览

预览允许 content/visual gates 尚未批准；不得为了预览而 waive gate。

## Nodes

### validate-ready

```yaml
node: validate-ready
lifecycle_phase: 2
method_module: 04-production
requires: []
produces: [preview-readiness]
entry: [style_master_exists]
exit: [evidence:preview-readiness-validated]
```

**Step 1 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate <run-dir>`；成功后记录 `preview-readiness-validated`（kind `cli`）。

### pilot-generate

```yaml
node: pilot-generate
lifecycle_phase: 2
method_module: 04-production
requires: [validate-ready]
produces: [pilot-contact-sheet]
entry: []
exit: [evidence:pilot-generated]
```

**Step 1 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot <run-dir>`，默认三页并覆盖所需 content full-page；成功后记录 `pilot-generated`（kind `cli`）。

### review-preview

```yaml
node: review-preview
lifecycle_phase: 2
method_module: 01-visual
requires: [pilot-generate]
produces: [preview-decision]
decisions: [proceed, retry, header-lock, accept-risk, back]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: 必须 open contact sheet，检查 header 准确性、清晰度、位置、字号、一致性和 body overlap。

**Step 2 — GATE**: `proceed` 记录 header review；`retry` 重跑所选页；`header-lock` 需用户确认后升级并重审；`accept-risk` 必须保存具体 reason；`back` 返回风格/内容。用 `setNodeDecision` 记录用户选择。
