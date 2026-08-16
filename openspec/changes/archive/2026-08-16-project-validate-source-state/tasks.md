# Tasks: project-validate-source-state

> 排序：投影拆分 → envelope → consumer 修正 → 回归。每个任务标注 capability 与完成判据。
> validate 保持零写入；不使用 production `deck_*`/`dpt_*`；不手改 `_generated/`。

## T1 validate 投影拆分（cli-surface）

- [x] **T1.1** operations 表暴露 candidate-only source resolve（adapter 已有
  `resolveFramedTargetCandidateSource`/`resolvePureTargetCandidateSource`）。
  - 完成判据：unit/integration——candidate resolve 不触碰 state/evidence。
- [x] **T1.2** `commandValidate` 重构：source-only parse → source-invalid 走
  `projectProblemFactsDiagnostic`（`source_validation`/`edit_source`）；parse 成功后再做
  state 绑定；`TARGET_SOURCE_STATE_IDENTITY_MISMATCH` → state-stale envelope。
  - 完成判据：进程矩阵三态（见 T3.1）通过。
- [x] **T1.3** `emitSourceStateStaleEnvelope`：reason
  `target_source_state_identity_mismatch`、owner rebind next（image2 plan invocation）、
  `source_valid: true`、单信封、exit 1、空 stdout。
  - 完成判据：进程断言 envelope 精确字段；无 `source_valid` 出现在其他 envelope。

## T2 Consumer 修正（node-specification，H-2/M-3）

- [x] **T2.1** node-specification R18：`--check-gates` → `--validate-state`；"infer mode" →
  "infer a selected workflow"；场景更新。
- [x] **T2.2** `state.mjs` 头部注释 `[--json|--check-gates]` → `[--json|--validate-state]`；
  全仓 `--check-gates` 清零。
  - 完成判据：grep `--check-gates` 在 specs/实现注释中零命中（delta 历史除外）；
    `--validate-state` 与 help 一致。
- [x] **T2.3** node-specification additive observation 消费者条款（非权威、容忍、不复制 schema）
  已随 delta 提供；archive 后 main specs 落位。
  - 完成判据：`test_diagnostic_recovery_handoff.mjs` 通过。

## T3 回归与验证

- [x] **T3.1** 进程矩阵（source-invalid / state-current / state-stale / 优先级）：
  新增 `tests_e2e/shared/workflow/test_mock_validate_source_state.mjs`（或 process tier 套件）。
  - 完成判据：四类 case 全绿；state-stale case 断言完整 fixture tree 字节不变、无 provider call、
    单信封、空 stdout。
- [x] **T3.2** `npm test`、`npm run test:sweep`、process tier、`npm run test:mock-e2e` 全绿。
- [ ] **T3.3** `openspec validate project-validate-source-state --strict --no-interactive` 通过；
  `openspec validate --all --strict` 通过；main specs 同步并 archive。
- [ ] **T3.4** BUG-069 评估记录写入路线图文件（public observation + consumer 回归通过后评估
  关闭，正式关闭留给 bug 台账 owner）；H-2 与本 change 触及范围内 M-3 关闭证据记录。
