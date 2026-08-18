# Tasks: progressive-pilot-state-and-diagnostics

> 排序：store lock 事实 → owner 三分支 enrich → CLI 映射与 closed action → state checkpoint handoff →
> CLI 接线 → 回归测试 → 文档/卡片收尾。每个任务标注 capability 与完成判据。
> 全程零 provider 依赖；lock 协议保持 mkdir/rmdir + finally；观察命令永不写 state。

## 1. Store lock 元数据与存活判定（cli-surface 事实源）

- [x] 1.1 `page_image_progressive_store.mjs`：`ProgressiveRawStoreError` 增加可选
  `details`（options 参数，兼容既有构造）；`withExclusiveDirectoryLock`/`Async` 在 mkdir 成功后
  原子写入 `owner.json`（`{ pid, started_at, scope }`，temp+rename），`finally` 清理顺序为**先删
  `owner.json` 再 `rmdir`**（rmdirSync 只接受空目录，否则每次 mutation 都会遗留自己的锁）；
  `EEXIST` 时读取 `owner.json`（缺失或 ENOENT 视为无法证死），用 `process.kill(pid, 0)` 判定存活
  （ESRCH → dead，EPERM/成功 → alive），抛 `progressive_raw_store_locked` 并携带
  `details.lock_owner = { pid, started_at, scope, alive, owner_record_present }`。
  - 完成判据：`node --check` 通过；新单测覆盖 owner.json 写入/读取、alive 与 dead 两种 typed
    error、锁释放后目录为空（owner.json 已删）；既有 `test_raw_mechanics`/`test_progressive_raw_owner` 全绿。
- [x] 1.2 确认所有 mutation 入口（plan/pilot/expansion/authorize/generate/pilot-review/
  pilot-accept/review/accept/reconcile）仍经同一 lock 包装且错误携带 details 透传。
  - 完成判据：无调用点遗漏；任何 lock 失败都能在 CLI 层读到 `details.lock_owner`。

## 2. Owner 三分支 enrich 与 reconcile 死锁 reclaim（cli-surface 事实）

- [x] 2.1 `page_image_progressive_raw_owner.mjs`：`withCurrentProgressiveRawPlanLock` 捕获
  `progressive_raw_store_locked`，只读 `loadPlanByHead` 判定三分支并重抛 `ProgressiveRawOwnerError`
  （code 不变）：alive → `next_action = wait_progressive_raw_completion`（guide, requires_human
  false）；dead + 唯一 unresolved submitted attempt → `next_action = unresolvedAction(snapshot)`
  （精确 reconcile selector）；dead + 无 attempt → 无 next_action、`details.lock_owner.anomaly =
  true`。
  - 完成判据：三分支错误在 owner 层可区分；不读不写 provider 路径。
- [x] 2.2 `reconcileProgressiveRawAttempt`（直接使用 store `withProgressiveRawPlanLock`）的锁调用
  包 try/catch：`progressive_raw_store_locked` 且 owner 被证明 dead（owner.json 存在 + pid 死亡）
  时，删除该死锁（先删 owner.json 再 rmdir）并重试一次获取（新 owner.json）；重试仍 EEXIST（新
  writer 已建锁）或 owner 事实缺失（无法证死）则原样抛错，绝不 reclaim。其他 mutation 不 reclaim。
  - 完成判据：死锁 + 精确 attempt fixture 下 reconcile 成功并写 terminal outcome；活锁下 reconcile
    返回分支 1 错误；owner 事实缺失时 reconcile 保守失败。

## 3. CLI closed action 与 failure mapping 三分支（cli-surface）

- [x] 3.1 `cli_error.mjs` `CLI_NEXT_ACTIONS` 增加 `wait_then_reread`（非 human action）；
  同步 `tests/shared/cli/test_process_cli_error.mjs` 契约断言。
  - 完成判据：枚举自检绿；`wait_then_reread` 合法。
- [x] 3.2 `command_support.mjs` `targetPageImageFailure`：`reason === "progressive_raw_store_locked"`
  显式分支（先于泛化 `progressive_raw*`），按序判定：wait action 或 `details.lock_owner.alive` →
  `wait_then_reread`（category gate，requires_human false）；`reconcile_progressive_raw_attempt`
  → `reconcile` + `subject: { kind: "progressive_raw_attempt", id: attempt_sha256 }`；其余 →
  `report_internal`（category internal，message 指名无 writer 无 attempt 的异常 lock）。三个分支的
  hint 统一禁止删除 lock/重建 batch/provider retry/重发 item。
  - 完成判据：`tests/shared/cli/test_process_target_diagnostics.mjs` 三分支 envelope 断言绿；
    泛化分支不受影响。

## 4. State checkpoint CLI handoff（node-specification / playbook-execution）

- [x] 4.1 `state.mjs` 新增 `recordTargetProgressiveCheckpointCliHandoff(deckDir, { runVersion,
  runDir, checkpoint_node, action_id, plan_hash, batch_hash, requires_human, waiting_for,
  expectedStateSha })`：exact context 校验（run version/source epoch/workflow）→ checkpoint_node
  必须 ∈ `controllerActiveNodeIds(index, "create-deck", workflow)` → 单调前进（current 在 active 序
  中的 index ≤ checkpoint index，后退失败闭包）→ **先标记 checkpoint 之前所有记录缺失或在途
  （in_progress）的 active 节点为 `completed`**（completed/skipped 不动；`getEligibleNextNodes`
  位置无关，不标记则上游 authoring 节点永远 eligible）→ `setNodeStatus(checkpoint_node,
  "in_progress", { waiting_for? })`（**恒 in_progress**，完成态只由节点 exit evidence 产生，避免与
  authorize handoff 的节点前置检查冲突）+ `writeState` + `appendHistory({ type:
  "page_image_progressive_checkpoint_cli_handoff", ... })`；当前节点即 checkpoint 时返回 `current`
  不写。不写 per-node evidence、不伪造证据。
  - 完成判据：`tests/shared/state/test_target_page_image_state.mjs` 新用例绿（advance/current/
    非法节点/后退/身份不匹配/观察不写）。
- [x] 4.2 `image2.mjs`：每个成功 mutation 操作后，用 post-op `inspectWorkflow` +
  `progressiveControllerCheckpoint` 计算 checkpoint（**try/catch 包裹：inspection 为 hard-stop 或
  checkpoint 为 null 时跳过 handoff，绝不失败已成功的操作**），调用
  `recordTargetProgressiveCheckpointCliHandoff`（authorize 先于既有 authorize handoff），再以同一
  inspection 调 `refreshProgressiveControllerTaskProjection`。只读命令（state/status）不调用。
  - 完成判据：authorize 既有 handoff 测试保持绿；`state --json`/`status` 在 pilot-review 后与
    inspection 一致。

## 5. 回归测试（三分支 + cursor 一致性）

- [x] 5.1 Lock 三分支单测（`tests/shared/image2/`）：伪造 lock 目录 + owner.json（alive 用测试进程
  pid；dead 用不可能存在的 pid）驱动 mutation，断言 owner 错误三分支与 CLI envelope
  （wait_then_reread / reconcile+selector / report_internal），并断言**只有分支 2** 产出 reconcile、
  任何分支 hint 不含删除 lock/重发 provider。
  - 完成判据：三分支断言绿；字节保留断言（失败后 state/history 不变）绿。
- [x] 5.2 Cursor 集成回归（`tests/shared/workflow/`，复用 task projection fixture 模式）：pure
  fixture 直接驱动 owner 操作（plan → pilot → authorize → generate 全部 item 本地 materialize →
  pilot-review，每步成功后调用共享的 checkpoint 前进包装——即 image2.mjs 使用的同一函数），再
  spawn `ppt_flow state --json` 断言 `current_node === "review-target-pure-pilot"`、eligible 不含
  `author-target-narrative-sources`、task projection 非 not-applicable；`status --json` 一致；再
  `pilot-accept proceed` + checkpoint 前进，断言 cursor 到 `plan-target-pure-expansion` 且不跳回
  authoring。
  - 完成判据：卡片 BUG-072 红色断言（三项关系）在 fixture 中改路径后保持红→绿；`npm test` 全绿。

## 6. 收尾（bookkeeping）

- [x] 6.1 `openspec validate --all --strict` + `git diff --check` 绿；确认无 deck_*/dpt_* 改动。
- [x] 6.2 关闭 BUG-071/072 卡片：`git mv` 到 `_done/_fixed_bugs/`，更新 `_done/_fixed_bugs/README.md`
  （表格行 + Next available bug ID）、`_backlog/bugs/README.md`（移除活跃行）、`_backlog/_done/README.md`
  （计数 +1），卡片正文补修复 commit 摘要。
  - 完成判据：活跃列表不再含 071/072；Next available bug ID 与 `_done/_fixed_bugs/README.md` 一致。
