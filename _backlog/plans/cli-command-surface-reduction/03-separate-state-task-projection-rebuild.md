# Change 3: separate-state-task-projection-rebuild（S4 独立）

> 阶段见 `progress.md`。吸收评审 `07` 第 2 条: 这是**收敛触发器重设计**,不是「去掉隐藏写」。
> **评审 6 问在 design 全部闭合前,不 open 本 change**（progress.md 门槛 5）。

## 现状事实（已复核）

- `cli-surface/spec.md:498`: 普通 `state`/`--json` "may rebuild the current task projection only
  for the eligible active replacement Controller route, after read-only inspection";
- `playbook-execution/spec.md:441`: 投影只从 owner-issued inspection 与 typed handoff 重建;
- `create-deck.md:92`: "The Controller rebuilds `_state/page-production-task-projection.md` on
  route entry/resume and after relevant decisions";
- `workflow-inspection/spec.md:8`: inspection 与 presentation refresh 刻意分离;
- `page_production_task_projection.mjs`: 幂等写,字节比较,status = created/updated/current（:280）。

## 评审 6 问（design 必须逐条回答）

1. 谁在 route entry、resume、relevant decision 后调用 rebuild;
2. 谁判断 projection 是 created/updated/current/not-applicable 或 stale;
3. projection 被删除、手改、写一半、重建失败时,哪个 owner 负责前向修复;
4. ineligible / undeclared current protocol 是否仍保持 projection 字节不变;
5. `state` 观察成功但 rebuild 失败: 一个事务、两个结果,还是后者独立命令失败;
6. 终态不变量: 「合资格 route 的 card = 当前 owner facts 的确定性渲染」,还是「显式请求后可收敛」。

## 候选设计（供 design 验证,非结论）

- **候选 A（倾向）**: 保留自动收敛语义,但写路径显式化——Controller/Agent 在 trigger 点
  （route entry/resume/decision 后）显式调用 `task-projection rebuild`;普通 `state` 回零写。
  终态不变量取「合资格 route 的 card = 当前 owner facts 的确定性渲染」（由显式 rebuild 维持）。
- 候选 B: 保留 `state` 触发,只把行为显式写进 help/spec,不动时序。
  终态不变量退化为「显式请求后可收敛」。

## 变更形状

- `state` 子命令化: `state`（观察） / `state validate`（现 `--validate-state`） /
  `state repair-known-execution-mismatch`;
- 新命令 `task-projection rebuild`（窄决策: 是否带 rebuild）;
- exit 2 特例（普通 `state` 的 replacement/current-repair hard-stop,`:3861`）搬移时保留。

## 同步面

- specs: `cli-surface`(:165–206/:498)、`node-specification`(:368/:402)、`workflow-inspection`、
  `playbook-execution`、`commands-reference`;
- docs: `create-deck.md`(:92 触发句)、`charter/NODE-SPEC.md`;
- tests: `test_mock_inactive_run_state_writes`、`test_state_yaml`、
  `test_page_production_task_projection`、`test_process_workflow_inspection_cli`、
  `test_diagnostic_recovery_handoff`。

## 完成判据

1. 评审 6 问全部闭合（design 记录）;
2. 契约测试证明: `state` 零写、rebuild 只在显式入口发生、trigger 点收敛;
3. 幂等性（重复 rebuild 收敛到 current）、ineligible 字节不变有测试;
4. `npm test` + `openspec validate separate-state-task-projection-rebuild --strict` 全绿。
