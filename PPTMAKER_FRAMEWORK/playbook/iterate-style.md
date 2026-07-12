---
playbook: iterate-style
description: 视觉方向打磨——迭代 style master 后 LOCK
includes: []
---

# Playbook: 视觉方向打磨

## Nodes

### start-iterate

```yaml
node: start-iterate
lifecycle_phase: 2
method_module: 01-visual
requires: []
produces: [iteration-goals]
entry: []
exit: [user_evidence:iteration-goals-confirmed]
```

**Step 1 — MD**: Open 当前 style master/prompt，明确用户最不满意的 1–3 个维度。

**Step 2 — GATE**: 用户确认目标后记录 `iteration-goals-confirmed`（kind `user`）。

### tweak-prompt

```yaml
node: tweak-prompt
lifecycle_phase: 2
method_module: 01-visual
requires: [start-iterate]
produces: [style-master-prompt]
entry: []
exit: [evidence:style-prompt-updated]
```

**Step 1 — MD**: 大改前备份源 prompt；修改 `style-master-prompt.md`，不手改生成图。

**Step 2 — CLI**: 记录 `style-prompt-updated`（kind `agent`）。

### generate

```yaml
node: generate
lifecycle_phase: 2
method_module: 01-visual
requires: [tweak-prompt]
produces: [style-master]
entry: []
exit:
  - style_master_exists
  - evidence:style-master-generated
```

**Step 1 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master <run-dir> --force --resolution 1k`；成功后记录 `style-master-generated`（kind `cli`）。

### review-gate

```yaml
node: review-gate
lifecycle_phase: 2
method_module: 01-visual
requires: [generate]
produces: [visual-gate-decision]
decisions: [approve, retry, reject]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: 必须 open `style_master.jpg`，不得只描述。

**Step 2 — GATE**: `approve` → `approve visual` + state gate；`retry` → reset tweak/generate/review；`reject` → 返回 medium/preset 选择。用 `setNodeDecision` 记录用户选择。
