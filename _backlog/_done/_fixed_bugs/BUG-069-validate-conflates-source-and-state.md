# BUG-069: `validate` 将可验证 source 与预期 stale state 绑定，不能作为调优 source 预检

> 严重级别: P2 | 发现: 2026-08-16 | 状态: 已修复（2026-08-16）

## 症状

V8 在合法修改 visual-language / slide source 后仍保留 epoch 6 的历史 Page Image evidence，
这正是生成新 Style Master successor 和新 raw plan 之前的正常中间态。当前 source parser 已能
成功解析 25 页 Pure receipt，但公开命令：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs validate deck_ai_sdlc_keynote/3_versions/v8
```

exit 1 并只输出：

```text
FAILED: TARGET_SOURCE_STATE_IDENTITY_MISMATCH
Where: ppt_flow.validate.page-image
```

它没有说明 source 已成功通过 parsing/visual-language validation，也没有将 stale historical
state 与 source validity 分开呈现。对于正在调优的 Agent，这使名为 `validate` 的入口不能回答
最基本的问题：“刚改的 source 本身是否有效？”

## 根因

`commandValidate()` 调用 selected workflow 的 `operations.resolveSource()`，该调用同时进行
source/visual parsing 与 current source/state identity resolution。它没有把已经完成的 source
validation result 与随后发生的 expected stale-state result 分开投影，因此一个历史 evidence
fence 覆盖了 source preflight 的成功事实。

相关路径：

- `ppt_maker_harness/scripts/ppt_flow.mjs`
  - `commandValidate()`（约 888–900 行）
- selected Pure/Framed `resolveSource()` 及 target source/state resolver

## 复现

在已经产生 Page Image evidence 的任何 Pure 或 Framed run 中，编辑 canonical source 或 selected
visual-language，且不手动修改 state/receipts，然后运行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs validate <run-dir>
```

当新 source 语法正确时，命令仍只以 `TARGET_SOURCE_STATE_IDENTITY_MISMATCH` 失败；当 source
语法错误时，错误会更早出现。前者没有提供明确的 source-valid 中间结论，后者又要求 Agent
通过其他入口才知道两种 failure 的优先级。

期望行为：保留 state identity 的 hard-stop，不允许它被绕过；但 `validate` 应有一个可消费的
source-only/preflight projection，或者在同一结构化结果中明确区分 `source_valid` 与
`state_binding_stale`，并指明 source 已通过且下一步是 owner-owned rebind。该命令不得写 state、
receipt、raw plan 或任何 `_generated/` 产物。

## 修复关联

本轮现场登记，不修复。建议后续独立评估是否扩展现有 `validate` output，或引入不改写 lifecycle
authority 的 source-only validate surface；必须覆盖 source-valid/state-stale、source-invalid、
Pure 与 Framed 四种组合。

## 修复结果

由 Change 3 `project-validate-source-state`（2026-08-16 archive）修复：

- `commandValidate` 拆两段投影：stage 1 source-only candidate parse（失败走 Change 1 的
  `source_validation`/`edit_source` problem envelope，优先于任何 state 结果）；stage 2
  source/state identity 绑定，`TARGET_SOURCE_STATE_IDENTITY_MISMATCH` 时发出
  reason `target_source_state_identity_mismatch` + owner rebind next + additive
  `source_valid: true` observation（非权威，不作为授权）。
- 回归：`tests_e2e/shared/workflow/test_mock_validate_source_state.mjs` 4/4（source-invalid /
  state-current / state-stale 无写入 / source 优先于 stale）。
- 评估记录：`_backlog/_done/_closed_plans/cli-diagnostic-faithful-passthrough.md`（CLS-038）。
