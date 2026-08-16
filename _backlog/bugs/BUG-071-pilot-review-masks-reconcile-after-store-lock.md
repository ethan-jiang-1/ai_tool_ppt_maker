# BUG-071: `pilot-review` 的 store-lock 诊断没有区分生成进行中与需要 reconcile 的提交

> 严重级别: P1 | 发现: 2026-08-16 | 状态: 活跃

## 现场结论与范围校正

本卡最初把 `progressive_raw_store_locked` 归因为“遗留锁掩盖了已知 submission 的
reconcile action”。该归因已被随后观察推翻，不能作为修复前提：失败后检查到同一
`image2 generate` wrapper（PID `80302`）及其 provider child（PID `83204`）仍在运行。
两者退出后，exact run 的 `ppt_flow state --json` 显示四个 pilot item 都为
`materialized`：`InfoRev`、`TriYear`、`ToBPM`、`YourMov`；workflow 的 owner action
变为 `prepare_progressive_pilot_review`。因此，本次 lock 可以是合法 live contention，
不是已经证实的 stale lock；初始 `TriYear` attempt digest 也不能当成最终 unresolved
attempt 的证据。

本 bug 保留，但范围收窄为：公开的 `pilot-review` 失败回执将 live writer、已中断的
submitted attempt、以及真正异常的 lock contention 折叠成同一个
`progressive_raw_store_locked` + `repair_prerequisite`。这三种状态的合法后续动作不同，
却没有从 producer 回执中体现。

## 症状

V8 的 4 页 Pure pilot 使用一个已授权 batch：

- plan: `7a21eb82208281a30c9dfd430163d8f4f011cf7db40080e3a838d3edd57f5a41`
- batch: `c271fe02f8b82de43e05baf2d93e80cbf8e7007738f5a39529259c3a06e709b2`

在 `InfoRev` 已 materialized、`TriYear` 出现 persisted submitted attempt 时执行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs image2 pilot-review <run-dir> \
  --plan-hash 7a21eb82208281a30c9dfd430163d8f4f011cf7db40080e3a838d3edd57f5a41 \
  --batch-hash c271fe02f8b82de43e05baf2d93e80cbf8e7007738f5a39529259c3a06e709b2
```

收到的最终失败诊断为：

```text
FAILED: The progressive Page Image raw-owner facts are stale or invalid.
reason.kind: progressive_raw_store_locked
next.action: repair_prerequisite
```

同一时段，host 进程检查显示生成尚未结束，而只读 `ppt_flow state --json` 暴露 submitted
outcome。`pilot-review` 的回执没有说明当前 writer 是否仍活跃，也没有给出无 mutation 的
“等待完成后重读”动作。调用方因此无法只凭 producer diagnostics 判断：应等待并刷新、对一个
已中断的 attempt 执行 reconcile，还是报告异常 lock。

当上述进程正常退出后，重读 state 显示四页均 materialized。这证实本次现场不能主张必须对
`TriYear` 重发或 reconcile，也不能建议清理 lock。

## 待验证根因

progressive store 的 exclusive directory lock 在 `EEXIST` 时会产生
`progressive_raw_store_locked`。`ppt_flow` 的 Page Image failure mapping 随后将该错误
投影为泛化 `repair_prerequisite`，而不是读取并区分 current progressive snapshot 中的：

- 生成调用仍活跃；
- 生成调用已结束、item 仍为唯一 `submitted` attempt；
- 没有 writer、没有可 reconcile attempt、但 lock 仍异常存在。

需要由修复 Agent 确认下列路径的实际控制流和可用事实，不能仅依据本卡推断：

- `ppt_maker_harness/scripts/shared/image2/page_image_progressive_store.mjs`
  - `withExclusiveDirectoryLock()` / `withExclusiveDirectoryLockAsync()`
- `ppt_maker_harness/scripts/ppt_flow.mjs`
  - progressive Page Image failure diagnostic mapping
- `ppt_maker_harness/scripts/shared/workflow/inspect_workflow.mjs`
  - raw-owner progress 与 `reconcile_progressive_raw_attempt` projection

## 复现

1. 在 isolated fixture 或可控 provider 上，开始一个 exact authorized pilot item 的真实
   `image2 generate`，使它在 written submitted attempt 与最终 materialization 之间停留。
2. 该 invocation 仍存活且持有 store lock 时，从第二个 process 调用 `image2 pilot-review`。
3. 收集 pilot-review 的最终 JSON failure envelope、`ppt_flow state --json <run-dir>`，以及
   该 generate invocation 仍存活的 process fact。不得删除 lock、不得重发 provider request。
4. 另以 deterministic fixture 覆盖生成进程已退出、lock 不再由 live writer 持有、但 item 保持
   persisted `submitted` 的情况，再调用相同 review/preflight。

当前现场只证实第 1--3 步：live writer 时 public review 返回
`progressive_raw_store_locked` + `repair_prerequisite`，随后 writer 正常完成。第 4 步尚未由
V8 现场证实，必须作为回归测试建立，不能把本次 run 的结果外推为 stale-lock defect。

## 期望行为

live writer 情形的 producer 应给出明确、无 mutation 的等待/重读事实或 action；无 live writer
且 snapshot 有唯一 unresolved submitted attempt 时，应给出该 exact reconcile selector；只有无
writer、无 reconcileable attempt 的异常 contention 才应要求报告/修复 prerequisite。所有分支
均不得建议手动删除 lock、批次重建、provider retry 或同一 item 的重发。

## 修复关联

本轮现场登记，不修复。后续应通过 OpenSpec 统一 progressive failure producer 与 workflow
inspection 的状态区分，并增加“真实 live writer”“无 live writer + unresolved attempt”“异常
lock、无 unresolved attempt”三条分支覆盖。回归断言需确保只有第二条允许 exact reconcile，
并且任何分支都不能诱导删除 lock 或重发 provider request。
