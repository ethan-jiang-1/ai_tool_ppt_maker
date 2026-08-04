# BUG-049: Style Master `attempt_unknown` 永久阻塞计划、无 reconcile，只能 abandon 烧提交

> 严重级别: P1 | 发现: 2026-08-04 | 状态: 活跃

## 症状

当 Style Master 候选被提交后结果无法确认时（provider 尺寸错、网络中断、慢超时等），候选进入
`status: "submitted"`（`style_master_attempt_unknown`），计划被 permanently 阻塞：

```
GATE_BLOCKED: A submitted Style Master candidate has an unknown provider outcome.
diagnostic.reason.kind = style_master_attempt_unknown
next: review → abandon exact plan
```

唯一恢复路径是 `style-master abandon` —— 但 abandon **消耗本次授权提交**，且丢弃该候选，随后必须
重新 plan/authorize/generate。本次生产在诊断循环中因此烧掉 **6 次授权提交，0 个候选产出**。

## 根因

`style_master_plan.mjs`：

- `orderedGenerationTarget`（822 行）：`status === "submitted" || "unknown"` → kind `"unknown"`。
- `generateStyleMasterCandidates`（1196-1197 行）：遇到 unknown → 直接
  `fail("style_master_attempt_unknown")`，不重试、不 reconcile。
- 没有类似 page raw 的 `reconcileProgressiveRawAttempt` 恢复路径；`abandon` 是唯一出口，且
  `abandonmentProjection`（1328 行）要求绑定一个"unknown"attempt 才能 abandon，然后必回
  `plan_style_master_successor`。

即：一旦 unknown，没有任何机制去 provider 侧重拉结果、核对已完成的生成，或从非 terminal 状态
继续。对慢/间歇性 provider（DUCK 曾 67s 成功、也出现过 >300s）尤其致命 —— 一次超时/错配 = 一次
已授权的提交白费。

## 复现

```bash
# 触发一次 unknown（如 provider 返回尺寸不符 / fetch 中断 / 慢超时）
node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master generate <run-dir> --plan-hash <sha>
# 再跑同计划 → GATE_BLOCKED
# 只能 abandon（消耗提交）→ plan successor → authorize → generate
```

## 影响面 / 修复方向

- 关联 [[BUG-046]]（尺寸/provider 错配是本次 unknown 的直接来源）、[[BUG-050]]（fetch 无显式超时）。
- 修复方向（C/D 组合）：给 Style Master 增加 unknown attempt 的 reconcile/re-pull 路径（对齐 page
  raw 的 reconcile），或让 abandon 前允许一次受控的 provider 侧状态核对；同时给 fetch 加显式、可配置、
  足够长的超时（见 [[BUG-050]]），减少 unknown 的触发面。
