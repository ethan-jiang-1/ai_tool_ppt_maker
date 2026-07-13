---
playbook: probe-image-channels
description: 逐家探测图像通道，确认后才写配置
includes: []
---

# Playbook: 图像通道体检

## Nodes

### intake

```yaml
node: intake
lifecycle_phase: 0
method_module: 00-setup
requires: []
produces: [probe-plan]
entry: []
exit: [user_evidence:probe-scope-confirmed]
```

**Step 1 — MD**: 说明将逐家探测、展示进度和报告，绝不会自动改 `.env`。

**Step 2 — GATE**: 用户确认只看报告或可能调整配置后记录 `probe-scope-confirmed`。

### run-probe

```yaml
node: run-probe
lifecycle_phase: 0
method_module: 00-setup
requires: [intake]
produces: [probe-report]
entry: []
exit: [evidence:probe-finished]
```

**Step 1 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --probe-vendors`，持续转述 stdout 进度；成功后记录 `probe-finished`（kind `cli`）。

### show-report

```yaml
node: show-report
lifecycle_phase: 0
method_module: 00-setup
requires: [run-probe]
produces: [human-readable-report]
decisions: [finish, configure]
entry: []
exit:
  - user_decision_recorded
  - user_evidence:report-acknowledged
```

**Step 1 — MD**: 展示 OK/FAIL、mode、elapsed 不得展示密钥。

**Step 2 — GATE**: 用户选择 `finish` 或 `configure`，并记录 report acknowledgment。

### confirm-write

```yaml
node: confirm-write
lifecycle_phase: 0
method_module: 00-setup
requires: [show-report]
produces: [routing-update]
decisions: [write, skip]
entry: [node_decision:show-report:configure]
exit:
  - user_decision_recorded
  - evidence:write-handled
```

**Step 1 — MD**: 展示拟写入的非密钥配置和 lesson 内容。

**Step 2 — GATE**: 用户选择 `write` 或 `skip`；write 后以 kind `cli` 记录 `write-handled`，skip 以 kind `agent` 记录。

**Step 3 — CLI**: 可选运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --smoke` 做廉价确认。
