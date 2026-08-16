# 03 — separate-state-task-projection-rebuild（**延后 α: 设计预案,不在本计划执行**）

> **v5 人类决定（2026-08-16）: C3 延后。** 本文件降级为**重启设计预案**——评审 6 问、
> 候选设计、trigger matrix 全部保留,重启 C3 时直接复用,内容不丢。
> 延后理由与重启条件见 `06`;摩擦兜底（C1 help 契约块写明 state 的投影重建行为）见 `01` §1.2。
> 吸收评审 `07` 第 2 条（定性: 这是**收敛触发器重设计**,不是「去掉隐藏写」）与
> 二次评审 #1（design gate 表述）/ #6 / #10。行号按当前工作区实测,C0 落地后按新模块定位。

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

## 候选设计（A 为冻结的终态方向,design 验证而非重新选择）

- **候选 A（冻结的终态方向,见 `01` §1.5 与 `progress.md` 门槛 3）**: 保留自动收敛语义,但
  写路径显式化——Controller/Agent 在 trigger 点（route entry/resume/decision 后）显式调用
  `task-projection rebuild`;普通 `state` 回零写;`build`/target `image2` checkpoint 的投影刷新
  **在 C3 迁移触发器时**从 owner result 版本化删除（C1 期保留两个分列 effect,见 `01` §1.5）。
  终态不变量取「合资格 route 的 card = 当前 owner facts 的确定性渲染」（由显式 rebuild 维持）。
- 候选 B（备选,仅当 design 证明 A 不可行时启用,且需升级为人类决定）: 保留 `state` 触发,
  只把行为显式写进 help/spec,不动时序。终态不变量退化为「显式请求后可收敛」。

## 变更形状

- `state` 子命令化（**完整 grammar 必须 proposal 前钉死**,二次评审 #6）:
  推荐 `state show <run-dir> [--json]` / `state validate <run-dir>` /
  `state repair-known-execution-mismatch <run-dir>`——避免 `validate` 与父命令必填
  `<run-dir>` 位置参数争位;若保留裸 `state <run-dir>`,另两个动作不得再做同层位置子命令;
- 新命令 `task-projection rebuild`（窄决策: 是否带 rebuild）;
- exit 2 特例（普通 `state` 的 replacement/current-repair hard-stop,`:3869`）搬移时保留;
- **不与 state.mjs 的 typed cli evidence 路径碰撞**: `recordStyleMasterAuthorizeCliHandoff`
  （5571002 新增）是 state 拥有的另一类 evidence,本 change 只动投影写路径与观察模式,
  不合并、不替代、不重写这条 handoff。

## 触发器 cutover matrix（二次评审 #10,design 必产）

投影 refresh 现状有三个写点,不只是普通 `state`: `state` 观察（`:3892`）、`build`
成功后（`:959`）、所有 target `image2` checkpoint 后（`:3134`）。候选 A 若宣称
「Controller/Agent 在 route entry/resume/decision 后显式调用」,design 必须逐一枚举:

| 旧 caller | 新 caller / 删除理由 | effect 顺序 | failure 语义 | focused test |
| --- | --- | --- | --- | --- |
| `state` 观察 :3892 | 删除（state 回零写） | — | — | state 零写证明 |
| `build` 成功 :959 | 删除（C3 迁移时投影出 owner result;此前按 C1 冻结为分列 effect） | delivery → rebuild（显式） | rebuild 失败不影响 delivery | 复合/独立失败 |
| target `image2` checkpoint :3134 | 删除（同上） | checkpoint → rebuild（显式） | 同上 | 同上 |
| Controller route entry/resume/decision（create-deck.md:92） | 显式调用新命令 | inspection → rebuild | rebuild 失败=独立命令失败 | trigger 点测试 |

完成判据里的「trigger 点收敛」绑定这张**闭集**,不是只检查 `state` 零写与新命令存在。

## 同步面

- 代码（C0 后布局）: `commands/state.mjs`（子命令化 + 零写）、新 `commands/task_projection.mjs`
  （显式 rebuild,委托现有 `page_production_task_projection.mjs` owner）;
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
