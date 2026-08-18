# Design — Progressive Pilot State And Diagnostics

## Context

现状事实（来自代码核查，见 BUG-071/072 卡片与上一轮调研）：

- `page_image_progressive_store.mjs` 的 `withExclusiveDirectoryLock(Async)` 是裸 `mkdir`，`EEXIST` 时抛出只有 `code`+`message` 的 `ProgressiveRawStoreError("progressive_raw_store_locked")`。没有任何 owner/存活事实；`finally` 只删除自己创建的 lock（崩溃遗留 lock 永不清理）。
- `command_support.mjs` `targetPageImageFailure` 的泛化 `progressive_raw*` 分支对 `progressive_raw_store_locked`：`reconciliation=false`、`gate=false`（不匹配 `pilot_|required|...` 正则）→ 恒 `repair_prerequisite` + message *"The progressive Page Image raw-owner facts are stale or invalid."*——与 BUG-071 现场逐字一致。
- durable cursor 的唯一写入点：`bundle_layout.init`（→ `author-target-narrative-sources`）、`activateCleanPageImageTargetDraft`（→ `author-target-page-image-content`）、两个 authorize CLI handoff（要求 cursor 已停在该节点，否则 `not-applicable`）。**没有任何机制在 raw-owner 推进时移动 cursor**——V8 全流程后 cursor 仍停在 `author-target-page-image-content`。
- `progressiveControllerTaskProjectionEligibility` 要求 `current_state.current_node === checkpoint.controller_node`，否则 task projection 为 `not-applicable`（BUG-072 现场的下游症状）。
- `progressiveControllerCheckpoint` 已实现 owner action → Controller 节点映射（如 `accept_progressive_pilot → review-target-*-pilot`），可复用为唯一映射源。
- 所有 progressive mutation（plan 发布、pilot、authorize、generate、pilot-review、pilot-accept、review、accept、reconcile）都经过 `withCurrentProgressiveRawPlanLock` 或 `withProgressiveRawPlanLock`（plan lock）与 scope lock——lock 是统一 choke point。
- CLI next-action 是封闭枚举 `CLI_NEXT_ACTIONS`（`cli_error.mjs`），现有值无"等待后重读"语义。
- State 现有 CLI handoff 模式（`recordTargetProgressiveAuthorizeCliHandoff`）验证 exact context（run version / source epoch / workflow）→ 读 direct records 校验 → `setNodeEvidence` + `setNodeStatus` + `writeState` + `appendHistory`，返回 typed 结果。新 handoff 沿用此模式。

## Goals / Non-Goals

Goals:

1. `progressive_raw_store_locked` 失败回执按 owner 存活 + snapshot 事实区分三种合法后续动作，且只有"死 writer + 唯一 unresolved attempt"允许 exact reconcile。
2. 每次成功的 image2 mutation 操作把 durable cursor 单调推进到 owner checkpoint 节点；`state`/`status`/task projection/eligibility 一致。
3. 三分支与 cursor 前进都有本地 fixture 回归（无 provider 依赖）。

Non-Goals:

- 不引入新的 CLI 命令、不改变 lock 获取/释放协议、不改变 raw-owner 不可变记录 schema、不改变 provider 请求路径。
- 不自动清理死锁（除 reconcile 的证明式 reclaim 外）；checkpoint 之前节点只投影 `completed` 状态（无 per-node evidence），checkpoint 之后节点一律不补记录、不伪造证据。
- 不解决"authorize handoff 之外其他节点 exit evidence 的完整闭环"（如 review 节点 decision 写回 node record）——超出两卡范围。
- 不改 `deck_*` 生产数据。

## Decisions

### D1: Lock 元数据 + 存活判定（store 层）

`withExclusiveDirectoryLock(Async)` 在 `mkdir` 成功后立即原子写入 `owner.json`（`{ pid, started_at, scope }`，temp+rename，与 store 既有原子写一致）；`finally` 清理顺序为**先删 `owner.json` 再 `rmdir`**（`rmdirSync` 只接受空目录——这是本设计的硬约束，否则每次 mutation 都会遗留自己的锁，下次必然自锁）。`EEXIST` 时：

- 读取 `owner.json`：缺失或读取 `ENOENT`（mkdir 与 owner.json 写入之间的竞态窗口、旧协议遗留 lock）→ 无法证明 owner 死亡 → **保守判为 alive**（归入分支 1 等待，绝不归入异常分支）。
- `process.kill(pid, 0)`：`ESRCH` → dead；`EPERM`/成功 → alive。PID 复用只会造成"误判存活"（保守，安全侧），不会造成"误判死亡"。

抛出 `ProgressiveRawStoreError("progressive_raw_store_locked", msg, { details: { lock_owner: { pid, started_at, scope, alive, owner_record_present } } })`（给 `ProgressiveRawStoreError` 增加 options 参数，兼容既有构造）。

备选：不写元数据、靠 lock mtime 判定 stale。放弃：mtime 无法证明 writer 已死，且会被长时间运行的 writer 误判。

### D2: Owner 层三分支 enrich（唯一 mutation choke point）

`withCurrentProgressiveRawPlanLock`（raw owner）捕获 store-lock 错误后做**只读** `loadPlanByHead` snapshot 判定，重抛 `ProgressiveRawOwnerError`（code 不变 `progressive_raw_store_locked`）：

1. `details.lock_owner.alive === true` → `next_action = action("wait_progressive_raw_completion", { kind: "guide", requires_human: false, summary: "A live generation writer holds the raw-owner lock; re-read inspection after it exits." })`。
2. dead 且 `unresolvedAction(snapshot)` 存在（唯一 `submitted` attempt）→ `next_action = unresolvedAction(snapshot)`（即精确 `reconcile_progressive_raw_attempt` + `attempt_sha256`）。
3. dead 且无 attempt → 不附加 next_action，`details.lock_owner.anomaly = true`。

未经过 `withCurrentProgressiveRawPlanLock` 的少数路径（如 scope-head CAS 的 `writeProgressiveRawScopeHeadCas` 直接拿 scope lock）由 CLI 映射层的 `details.lock_owner.alive` 兜底（见 D3）。

备选：让 store 直接读 snapshot。放弃：store 不应知道 snapshot 语义（分层）；owner 已持有全部判定函数（`unresolvedAction`、`loadPlanByHead`）。

### D3: CLI failure mapping 显式三分支

`targetPageImageFailure` 在 `reason === "progressive_raw_store_locked"` 时走**新的显式分支**（先于泛化 `progressive_raw*` 分支），判定顺序：

1. `error.next_action?.action_id === "wait_progressive_raw_completion"` 或 `error.details?.lock_owner?.alive === true` 或 owner 事实缺失（`owner_record_present === false`，无法证死 → 保守等待）→ `next: wait_then_reread`（新 closed action，见 D4），category `gate`，`requires_human: false`，message "Another progressive raw-owner writer holds the store lock; re-read after it exits."。
2. `error.next_action?.action_id === "reconcile_progressive_raw_attempt"` → `next: reconcile`，category `artifact`，`subject: { kind: "progressive_raw_attempt", id: attempt_sha256 }`（exact selector）。
3. 其余（owner 被证明 dead + 无 reconcileable attempt）→ `next: report_internal`，category `internal`，message 指名"store lock 无 live writer 且无 reconcileable attempt"。只有**已证明死亡**的 owner 才可能进入此分支。

三分支 hint 统一模板：`"Re-read the exact raw-owner facts after confirming no other writer process is active; do not delete the lock, rebuild the batch, retry the provider request, or resubmit the item."`（分支 2 的 hint 指向 `image2 reconcile --attempt-sha256 <sha>`）。

### D4: 新增 closed CLI next action `wait_then_reread`

加入 `CLI_NEXT_ACTIONS`（`cli_error.mjs`）；`HUMAN_ACTIONS` 不含它（requires_human false）。同步 `cli-surface` delta 与 `test_process_cli_error.mjs` 的契约断言。

备选：复用 `rerun`。放弃：`rerun` 无"等待"语义，调用方可能立即重试同一 mutation 再次撞锁；卡要求"明确、无 mutation 的等待/重读 action"。

### D5: reconcile 的证明式死锁 reclaim（唯一允许的 lock 清理）

`reconcileProgressiveRawAttempt` 直接使用 store 的 `withProgressiveRawPlanLock`（不经 owner 包装），其锁调用被 try/catch 包裹：捕获 `progressive_raw_store_locked` 且 owner 被证明 dead（`owner.json` 存在 + `kill(pid,0)` → ESRCH）时，删除该死锁（先删 `owner.json` 再 `rmdir`）并**重试一次**获取（新 owner.json）。reclaim 前不做 snapshot 判定——reconcile 自身以精确 `attempt_sha256` 为工作对象，且其 action 内部会重新 CAS 校验 head；claim 后若 head 已变则按既有 `progressive_raw_head_conflict` 失败（字节保留）。owner 事实缺失（无法证死）时绝不 reclaim，按保守等待处理。

备选：任何 mutation 都 reclaim 死锁。放弃：卡片明确"只有无 writer、无 reconcileable attempt 的异常 contention 才应要求报告/修复"——分支 3 必须可观察；仅 reconcile 持有精确工作对象，reclaim 语义最窄。

### D6: State checkpoint CLI handoff

`state.mjs` 新增（沿用 authorize handoff 模式）：

```js
recordTargetProgressiveCheckpointCliHandoff(deckDir, {
  runVersion, runDir,             // exact context（同 authorize handoff 校验）
  checkpoint_node,                // progressiveControllerCheckpoint 输出
  action_id,                      // owner 当前 action（信息性）
  plan_hash, batch_hash,          // 绑定事实（有则校验格式）
  requires_human,                 // gate 节点 → in_progress + waiting_for
  waiting_for,                    // human-gate 等待说明
  expectedStateSha = null,
})
```

校验与写入：

1. context：`validTargetEvidenceRecord` + `source_epoch` + `workflow` 一致（同 authorize handoff）。
2. `checkpoint_node ∈ controllerActiveNodeIds(index, "create-deck", workflow)`（closed grammar，`md_controller_reader`），且节点 `production_workflows` 含 workflow。
3. 单调性：`current_node` 在 active 节点序中的 index 必须 ≤ checkpoint index；`current_node` 不在序中（空/未知）→ 失败闭包（`TARGET_PROGRESSIVE_CHECKPOINT_NODE_CONFLICT`），绝不后退。
4. 写入：先**把 checkpoint 之前所有记录缺失或在途（in_progress）的 active 节点标记为 `completed`**（completed/skipped 记录不动；这是 owner 事实对 Controller 路由的投影——inspection 能到达该 checkpoint 本身就证明了前置节点目的达成：source 校验证明 authoring/visual 节点、accepted style master receipt 证明 style 节点、已发布 plan 证明 plan 节点、pilot decision 记录证明 review 节点），再 `setNodeStatus(next, checkpoint_node, "in_progress", { waiting_for? }, { runVersion })` + `writeState` + `appendHistory({ type: "page_image_progressive_checkpoint_cli_handoff", ... })`。**checkpoint 节点恒写 `in_progress`**（human-gate 节点附 `waiting_for`）——完成态只由节点自己的 exit evidence 产生（authorize 节点由既有 authorize handoff 完成；review 节点由 pilot-accept 后的下一次 checkpoint 前进完成）。理由：若把 authorize 节点直接写成 `completed`，既有 authorize handoff 的节点前置检查（只接受 pending/in_progress）会以 `NODE_CONFLICT` 失败。
   为什么标记为 `completed` 而不是 `skipped`：`getEligibleNextNodes` 位置无关（仅"未访问 + entry 通过"），不标记则上游 authoring 节点永远 eligible——违反 BUG-072 验收；`skipped` 语义是"不适用"，而 authoring 等工作真实发生过（owner 侧），`completed` 才是诚实投影。不写 per-node evidence（避免与既有 `supersedesPriorCliGrant` 式单证据检查冲突），事实只进 history event。
5. 返回 `{ status: "advanced" | "current", from_node, to_node, completed_count, ... }`；`current_node === checkpoint_node` 时为 `current`（幂等，不写）。

checkpoint 之后节点：不补记录、不 skip、不伪造证据——它们保持未访问（pending 投影），cursor 只是 resume 指针。

### D7: CLI 调用顺序（image2.mjs）

每次成功 mutation 操作后：

1. `inspectWorkflow({ runDir })`（复用刷新前的同一份 inspection）；
2. `progressiveControllerCheckpoint(inspection)` → `{ controller_node, action_id, requires_human }`；**try/catch 包裹**：inspection 为 hard-stop 或 `controller_node` 为 null（如 owner 进入 repair 状态）→ 跳过 handoff，绝不失败已成功的操作；
3. `recordTargetProgressiveCheckpointCliHandoff(...)`（authorize 操作先于既有 `recordTargetProgressiveAuthorizeCliHandoff` 调用，使 authorize handoff 的"cursor 已在节点"前置成立）；
4. 既有 `refreshProgressiveControllerTaskProjection(runDir, { workflowInspection })`（cursor 前进后 eligibility 成立，card 可重建）。

第 2-3 步封装为共享导出（`command_support.mjs` 或 workflow 模块的
`advanceProgressiveControllerCheckpoint(runDir, { inspection })`），image2.mjs 与集成测试共用同一
函数——测试直接驱动 owner 操作后调用它，再断言 CLI state/status 输出，避免测试依赖 provider 密钥。

`state`/`status`/其他只读命令**不**调用 handoff（观察不写 state——延续 workflow-inspection 契约）。

### D8: waiting_for 文案

human-gate checkpoint（`review-target-*-pilot` / `review-target-*-raw` / `review-target-page-image-delivery`）：`waiting_for = "Human visual decision on <action_id> for <plan 前 8 hex> batch <batch 前 8 hex>"`（无 digest 全量泄漏；task projection card 已有 digest redaction 惯例）。

## Risks / Trade-offs

- [PID 复用导致 dead lock 被误判 alive] → 只影响分支判定偏向"等待"，保守安全侧；`owner.json` 含 `started_at` 供人核对。
- [owner.json 缺失的旧遗留 lock 被归入分支 1（保守等待），若其 writer 确已死亡则需人工确认] → 无法证死时绝不猜"已死"，宁可等待；诊断带现有 owner 事实 + 保留字节。分支 3（证明已死 + 无 attempt）同样需要人工介入：本 change 接受，且 cli-surface delta 写明不得诱导删 lock；后续 owner 化 reclaim 是独立 follow-up（不扩大本 change）。
- [每次 image2 操作后新增一次 `inspectWorkflow` 读开销] → 只读、本地、无 provider；与既有 `refreshProgressiveControllerTaskProjection` 共享同一 inspection 实例，不重复。
- [checkpoint 之前节点的 `completed` 投影没有 per-node evidence] → 这是 owner 事实投影而非证据声明：inspection 到达该 checkpoint 已证明前置节点目的达成；事实进 history event，`state --json` 的 current_node/workflow_inspection/task projection 三处一致是卡片验收核心。
- [reconcile reclaim 与另一进程并发拿锁] → reclaim 是 rmdir + 重试 mkdir 原子序列；若另一 writer 已重新建锁（alive），重试 mkdir 仍 EEXIST → 走分支 1 等待。无删他人活锁路径。
- [authorize handoff 与 checkpoint handoff 双写] → 顺序固定（checkpoint 先、authorize 后）；authorize handoff 既有测试保持绿（其前置条件由 checkpoint 满足），replay 语义不变。

## Migration Plan

- 无数据迁移：lock 目录是瞬态（进程内存在）；`owner.json` 只在新获取的 lock 上写入；旧协议遗留 lock（无 owner.json）在下次被撞时按保守等待处理（无法证死），带 owner 事实的遗留锁按分支 2/3 判定。
- 回滚：change 归档前的 commit 可整体 revert；spec delta 同步回滚。
- 生产数据（`deck_*`）零改动；`_state/state.yaml` 只会在后续 image2 操作成功时被 checkpoint handoff 前进——与卡片"绑定已有 successful owner/CLI transition"一致，观察命令永不写。

## Open Questions

无（三分支语义、reclaim 边界、cursor 前进规则均已按卡片期望行为定案）。
