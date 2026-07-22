# 边界与验收

返回 [主计划](../agent-workflow-simplification.md)。

## 不可降低的 protected invariants

1. `slide_id` 是稳定身份，position 只是当前 snapshot order。
2. 结构编辑仍是 preview + exact plan hash + clean vNext publication。
3. Canonical path、bytes、hash、receipt、provenance 与 notes/render lineage 可归属。
4. Provider submit 需要 explicit, scope-bound authorization；unknown submit 不盲重试。
5. CAS、atomic write、single writer、journal/reset recovery 与 no-replace publication 保持有效。
6. `_generated/` 只能通过 owner 重建；手工 state/receipt/artifact 绕过不是验收路径。
7. `guide|confirm|hard-stop` 的分类、waiver 与 protected invariant 继续由 gate owner 定义。
8. Source pipeline 与 version-scoped production intent 继续各自有清晰 owner。
9. HTML Production 与 Image Production 是并列 family；whole-page 和 visual-slot adapter 不混淆 final-page
   authority、授权 scope、provenance 或 completion。
10. `workflow_inspection` 使用 `pptmaker-workflow-inspection-v1`，是 zero-write/zero-network projection；它不能
    替代 raw durable state、直接 owner 或 mutation-time revalidation。

## Proposal 验收

每个 change proposal/design 必须逐条回答：

| 问题 | 验证方式 |
|---|---|
| Direct Source of Record 是什么？ | 当前 owner 与 read path，不是 status/Markdown/metadata projection |
| 现有 checkpoint 漏掉了哪条真实失败？ | 可运行最小 repro 或 canonical journey diff |
| 删除/合并了什么？ | 明确指出重复 evaluator、user-operated step、state field 或 checker |
| 每个 failure 的最近合法动作？ | 一个有序 `primary_action`；hard-stop 说明不变量与恢复路径 |
| 怎么证明没有破坏有效工作？ | focused negative + same-check rerun + wrong-owner no-mutation test |
| 观察输出是否兼容？ | `status --json` 与 `state --json` 的 `workflow_inspection` 相同，raw state 字段仍可读，observe 零写入/零网络 |
| Image Production record 如何迁移？ | old-only/new-only/一致 dual-record/冲突 dual-record，及 `adapter: visual-slot`/schema/active attempt/promotion recovery 均有 CAS-negative tests |
| 如何清除旧主概念？ | active main specs/entry docs 的术语清单，以及仅限 compatibility/migration 的明确例外 |

`confirm` 仍需要明确的人类理由；`hard-stop` 不接受 force/waive 绕过。Inspection result 是 projection，
不是另一个 success store 或 writer。

## 验证矩阵

每项 change 选择受影响行程并维持完整回归：

| 行程 | 核验重点 |
|---|---|
| Fresh HTML-only | init 到本地 final review 的唯一 next action |
| Fresh Image2-only | init、authorization、pilot、build、notes、final review 的 direct owners |
| HTML-then-Image2 | current delivery、refinement authorization/candidate/final review |
| Observe compatibility | `status --json`/`state --json` 的同一 inspection、raw state 保留、无 state/history/metadata/remote 写入 |
| Parallel production routing | `02-visual-system` 后 HTML 与 Image Production 的选择不互为前置；whole-page 与 visual-slot adapter 保持不同 authority |
| Image Production realignment | numeric directory 不参与 entry legality；旧/新 visual-slot record 和 promotion recovery 都可验证 |
| 小范围 refresh | 只刷新 stale owner artifact，不产生隐式 remote work |
| Structural versioning | preview/hash/apply/vNext/materialization 仍 exact |
| Migration/transition | candidate、confirmation、publication、mode-registration recovery 不被 generic path 绕过 |
| crash/restart | stale hash、CAS race、journal/reset、unknown submit、missing auth fail closed |
| BUG-033 单页迭代 | 单页变更的 earliest root cause、canonical repair 与同一 build checkpoint 重跑 |

## 量化基线

Change 1 记录 baseline，后续以 journey 指标验收，不以总行数为主：

- 同一 checkpoint 的 `primary_action` evaluator 数量：目标 1。
- normal resume 需要选择的 authority projection：目标 1 个 inspection result。
- `state --json` 的 raw durable-state 字段：100% 保留；workflow projection 仅以 `workflow_inspection` 嵌套新增。
- durable field：100% 有 owner/writer/reader/freshness/invalidation/removal。
- generic node evidence/decision：删除，或每个保留项有真实 production caller。
- 每个用户目标进入的 workflow seam：目标 1；其后的 direct-owner mutation 不计为 caller 重新拼接协议。
- BUG-033：无手写 state/authorization/receipt/assembly 的成功路径，或明确保留的 hard-stop。

## 风险与缓解

- **删除 node FSM 丢失断点信息**：先有 ledger；仅删除 reconstructible fact；不可重建 intent 是最小记录。
- **简化误删 safety gate**：先按 gate owner 分类；identity/integrity/auth/recovery 不降低；negative tests
  证明 valid work 不被 block。
- **inspection 变成第二 authority**：保持 zero-write/zero-network、无 cache、只组合 domain owner；writer mutation
  前重新验证 direct fact，raw state 继续单独输出。
- **深 module 退化成 facade**：做 deletion test；删除它若 caller 无需重建复杂度，则取消或收窄它。
- **兼容层永久存在**：每个 alias/legacy projection 记录唯一 reader、迁移窗口和移除条件。
- **轻量迭代变成无授权 shortcut**：selected-slide provider submit、provenance 和 canonical assembly 继续经
  原 owner；优化只能缩短合法路径，不能创造新 authority。
- **目录改名留下双主概念**：Change 3 先完成 wire-preserving realignment，再原子更新 runtime、main specs、tests
  与入口文档；exception inventory 必须记录每个旧词的 owner/reason/removal trigger。
- **旧/new visual-slot record 分歧**：new-first/old-fallback 只允许单 record 或语义一致 record；冲突 fail closed，
  首次 mutation 以一次 CAS 写新/删旧，不能手改 state。
