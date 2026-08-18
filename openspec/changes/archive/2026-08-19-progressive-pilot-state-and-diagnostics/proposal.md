# Progressive Pilot State And Diagnostics

## Why

两个 P1 bug 都落在 progressive Page Image pilot-review 的 State/诊断闭环上，且都源自同一根因：CLI image2 生命周期与 State/Controller 之间缺少"成功 transition → 持久化 cursor / 失败 contention → 区分诊断"的绑定。

- **BUG-071**: `pilot-review`（及其他 mutation）在另一 writer 持有 store lock 时，失败回执把三种本质上不同的状态（live writer / 已中断的 submitted attempt / 异常 lock）折叠成同一个 `progressive_raw_store_locked` + `repair_prerequisite`，调用方无法只凭 producer diagnostics 决定"等待重读 / exact reconcile / 报告"。
- **BUG-072**: 每次 image2 成功 checkpoint 后，durable `current_node` 从不前进（全仓只有 init 与两个 authorize CLI handoff 会移动 cursor，且后者要求 cursor 已停在目标节点）。结果 `state --json` / `status` 报陈旧 cursor，与 `workflow_inspection.primary_action` 矛盾；`progressiveControllerTaskProjectionEligibility` 因 `current_node !== checkpoint.controller_node` 恒返回 `not-applicable`，恢复路径不可信。

## What Changes

- **Store lock 携带 owner 事实**：`page_image_progressive_store.mjs` 的 exclusive directory lock 在获取时写入 lock 元数据（pid、started_at、scope）；`EEXIST` 时读取元数据并判定 owner 存活（`process.kill(pid, 0)`），抛出携带 `{ lock_owner: { pid, started_at, scope, alive } }` 事实的 typed 错误。诊断路径不做任何自动清理（延续 "Never remove an unproven lock"；reconcile 的证明式 reclaim 是唯一例外，见下）。
- **Owner 侧 enrich 三分支**：raw-owner 的 mutation 锁包装捕获 store-lock 错误后做只读 snapshot 判定，并按分支附加 `next_action`：
  1. owner 存活 → `wait_progressive_raw_completion`（无 mutation 的等待/重读）；
  2. owner 已死 + snapshot 有唯一 unresolved `submitted` attempt → 精确 `reconcile_progressive_raw_attempt` selector（含 `attempt_sha256`）；
  3. owner 已死 + 无 reconcileable attempt → 异常 contention，无 next_action。
- **CLI failure mapping 三分支**（`command_support.mjs` `targetPageImageFailure` 在 `progressive_raw_store_locked` 上新增显式分支，先于泛化 `progressive_raw*` 分支）：
  1. live writer → 新增 closed next action `wait_then_reread`（加入 `CLI_NEXT_ACTIONS`，category `gate`，requires_human false）；
  2. 可 reconcile → 现有 `reconcile` next + subject 携带精确 `attempt_sha256` selector；
  3. 异常 lock → `report_internal`，category `internal`，message 指名"无 writer 且无 reconcileable attempt 的 lock 异常"。
  三个分支的 hint 一律禁止建议删除 lock、重建 batch、provider retry 或同一 item 重发。
- **reconcile 证明式 reclaim**：仅 `image2 reconcile` 路径在 lock owner 被证明死亡时允许删除死锁（先删 owner.json 再 rmdir）并重试一次、继续精确 attempt 调和；其余 mutation 不 reclaim。
- **State checkpoint CLI handoff**（`state.mjs` 新增 `recordTargetProgressiveCheckpointCliHandoff`）：每次 image2 mutation 操作成功后，CLI 用 post-op 的 `inspectWorkflow` + `progressiveControllerCheckpoint` 计算 owner checkpoint 节点，handoff 沿 active Controller 节点顺序单调前进 durable cursor 到该节点（checkpoint 节点恒写 `in_progress`，human-gate 节点附 `waiting_for`），并把 checkpoint 之前未访问/在途的节点投影为 `completed`（owner 事实证明其目的已达成，同时满足 `getEligibleNextNodes` 的位置无关语义——不标记则上游 authoring 节点永远 eligible）。不写 per-node evidence、不伪造证据；authorize 仍由现有 authorize handoff 完成节点证据，顺序为先 checkpoint 后 authorize。
- **state/status/task projection 一致**：cursor 前进后，`progressiveControllerTaskProjectionEligibility` 的 `current_node === checkpoint.controller_node` 约束自然成立，task projection 从 `not-applicable` 恢复为可重建；`state --json`、`status`、task projection、gate display 与 node eligibility 给出同一 resume position。
- **回归测试**：三分支 lock 诊断断言（仅分支 2 允许 exact reconcile）；pilot-review → cursor 到 `review-target-{framed|pure}-pilot`、上游 authoring nodes 不再 eligible、state/status/task projection 一致；`pilot-accept proceed` → cursor 到 `plan-target-{workflow}-expansion`；pilot-accept 后不再跳回 content authoring。

不改变：lock 获取/释放协议（仍 mkdir/rmdir + finally）、raw-owner 不可变记录、provider 请求路径、CLI 命令表面（除新增一个 next action 枚举值）。

## Capabilities

### New Capabilities

- 无（修复落在既有 capability 的既有契约上，不引入新 capability）。

### Modified Capabilities

- `cli-surface`: progressive store-lock 失败回执必须区分 live writer / unresolved attempt / 异常 lock 三种状态并给出各自 next action（含新增 closed next action `wait_then_reread`）；任何分支不得诱导删除 lock 或重发 provider request。
- `node-specification`: State 新增 progressive checkpoint CLI handoff API，绑定已有 successful owner/CLI transition 单调推进 durable cursor；cursor 语义为"当前 owner checkpoint 的 Controller 投影"，state/status/task projection 必须一致。
- `playbook-execution`: image2 成功 checkpoint 后 cursor 前进到 owner 对应节点（含 `review-target-*-pilot` 与 `plan-target-*-expansion`），恢复路径以 inspection + 一致的 durable cursor 为准。

## Impact

- `ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs` — lock 元数据写入/读取、存活判定、typed 错误携带 facts。
- `ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs` — lock 错误 enrich（三分支 next_action）、reconcile 死锁 reclaim。
- `ppt_maker_harness/scripts/shared/cli/command_support.mjs` — `targetPageImageFailure` 三分支映射。
- `ppt_maker_harness/scripts/shared/cli/cli_error.mjs` — `CLI_NEXT_ACTIONS` 增加 `wait_then_reread`。
- `ppt_maker_harness/scripts/shared/cli/commands/image2.mjs` — 每个成功操作后调用 checkpoint handoff（顺序：owner op → checkpoint handoff → authorize handoff（仅 authorize）→ task projection refresh）。
- `ppt_maker_harness/scripts/shared/state/state.mjs` — 新增 `recordTargetProgressiveCheckpointCliHandoff`。
- 测试：`tests/shared/image2/`（lock 元数据与三分支、reconcile reclaim）、`tests/shared/cli/test_process_target_diagnostics.mjs`（failure envelope 三分支）、`tests/shared/state/test_target_page_image_state.mjs`（handoff 单调前进/失败闭包）、`tests/shared/workflow/`（pilot-review → cursor/task projection 集成回归）。
- Specs：`cli-surface`、`node-specification`、`playbook-execution` 三个 delta。
- 不依赖 provider 密钥；回归全部本地 fixture。
