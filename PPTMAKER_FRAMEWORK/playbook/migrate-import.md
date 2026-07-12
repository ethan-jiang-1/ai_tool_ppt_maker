---
playbook: migrate-import
description: 迁移/导入已有 deck，强制可见检查与 gates
includes: []
---

# Playbook: 迁移 / 导入

## Nodes

### intake-source

```yaml
node: intake-source
lifecycle_phase: 0
method_module: 00-setup
requires: []
produces: [migration-plan]
decisions: [A, B, C]
entry: []
exit:
  - user_decision_recorded
  - user_evidence:success-criteria-confirmed
```

**Step 1 — MD**: 确认源、目标和 A 新 init / B 原地升三层 / C 素材导入三种策略。

**Step 2 — GATE**: 用户选择 A/B/C 并确认成功标准后，记录 decision 和 `success-criteria-confirmed`。

### align-bundle

```yaml
node: align-bundle
lifecycle_phase: 0
method_module: 00-setup
requires: [intake-source]
produces: [aligned-run-bundle]
entry: []
exit:
  - run_bundle_exists
  - evidence:bundle-layout-validated
```

**Step 1 — CLI**: A/C 使用 `ppt_flow init`；B 使用 `bundle_layout.mjs --check <run-dir> --structure-only`。成功后记录 `bundle-layout-validated`（kind `cli`）。

### inventory-map

```yaml
node: inventory-map
lifecycle_phase: 0
method_module: 00-setup
requires: [align-bundle]
produces: [asset-map]
entry: []
exit:
  - evidence:assets-mapped
  - user_evidence:mapping-confirmed
```

**Step 1 — MD**: 展示源资产到 canonical path 的映射；禁止把 `_generated/` 当源。

**Step 2 — GATE**: 用户确认映射后搬运，并记录 agent/user evidence。

### early-show

```yaml
node: early-show
lifecycle_phase: 0
method_module: 00-setup
requires: [inventory-map]
produces: [first-visible-win]
entry: []
exit: [user_evidence:artifact-reviewed]
```

**Step 1 — MD**: Open style master、样张、旧 PPT 首页或 canonical tree 中最有信息量的可见产物。

**Step 2 — GATE**: 用户实际看过后记录 `artifact-reviewed`；有图却只文字描述不得完成。

### reaffirm-gates

```yaml
node: reaffirm-gates
lifecycle_phase: 0
method_module: 00-setup
requires: [early-show]
produces: [reaffirmed-gates]
entry: []
exit:
  - gate_approved:content
  - gate_approved:visual
  - user_evidence:gates-reaffirmed
```

**Step 1 — MD**: Open content source和 style master；让用户重新确认方向。

**Step 2 — CLI**: 运行 `ppt_flow approve <run-dir> content|visual` 并同步 state gates。

**Step 3 — GATE**: 记录 `gates-reaffirmed`；视觉需迭代时使用 `switchPlaybook(iterate-style)`。

### handoff

```yaml
node: handoff
lifecycle_phase: 0
method_module: 00-setup
requires: [reaffirm-gates]
produces: [next-action]
entry: []
exit: [evidence:handoff-recorded]
```

**Step 1 — MD**: 推荐 quick-preview 或 production 的明确下一步和预计耗时。

**Step 2 — CLI**: 记录 `handoff-recorded`（kind `agent`）。
