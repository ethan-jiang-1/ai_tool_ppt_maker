# Plan: Agent 工作流控制面的减法重构

> 类型: 架构审视 / 简化路线 | 更新: 2026-07-22 | 状态: 活跃 | 建议: 3 个 OpenSpec change 严格串行

## 决策

框架不需要减少真实生产约束。稳定 `slide_id`、版本发布、canonical bytes/hash、provider
authorization、CAS/journal/recovery、receipt/provenance 与 `_generated/` owner 都保护可说明的
不变量，不能为了降低代码或文档量而删除。

需要减的是 Agent 面向的控制面：同一事实被 controller、generic node state、domain transaction、
`status`、`state --json` 和 CLI routing 重复推导，迫使 Agent 拼接 hash、flag 和恢复协议。目标是让
Agent 保留意图、创意判断与人类沟通，deep module 在一个小 Interface 后完成机械检查、写入和恢复。

production-mode 的两个 change 已归档，三模式 authority 和跨 pipeline transition 是既有运行时事实。
本计划只消费其 direct owner，不重建 mode、transition、authorization 或 recovery authority。目标领域术语
将从“Image2 refinement”转为 **Image Production**：它与 HTML Production 并列，包含 whole-page 与
visual-slot 两个不同 adapter；后者仍可被称为 visual-slot refinement，但不再定义整个 Phase/module。

## 三项 Change

| 顺序 | Change | 目的 | 合并来源 |
|---|---|---|---|
| 1 | `unify-workflow-inspection` | 建当前事实 ledger、最小复现与只读 inspection result，让所有观察面消费同一 evaluator。 | 原 Change 1 |
| 2 | `simplify-workflow-control-and-interfaces` | 在 Change 1 证明可重建事实后，一次完成 generic node control 的退休、深 Interface 收敛，以及 `04-image-production` 与 main-spec 术语迁移。 | 原 Change 2 + 3 |
| 3 | `simplify-framework-governance` | 在行为和 Interface 稳定后，删除无 failure story 的结构治理，收束文档与测试为 protected-invariant 证据。 | 原 Change 4 |

三项的详细范围、退出条件和依赖见
[三项 Change 路线](agent-workflow-simplification/02-three-change-route.md)。

## 为什么是三项

原来的四项中，generic node control 的删除与深 Interface 的建立不能各自形成稳定终点：前者若不同时
收回暴露的 operation catalog，只会把旧协议换一个入口继续泄漏给 caller；后者若不先由 ledger 区分
reconstructible 与 irreplaceable facts，又会把旧 FSM 隐藏在 facade 后。因此它们合并为 Change 2。

不压成两项，是因为 Change 1 的 value 是一个只读、可比较的事实基线。将它与 state migration、控制写入
删除及治理文档混在同一个 change，会让错误时没有可用的 checkpoint 来判断是 direct owner、迁移还是
presentation projection 出了问题。三项保留这一条安全 seam，同时少一次 proposal/apply/archive 周期。

## 当前证据

三份 policy 是本计划的 admission 标准，而不是额外 runtime authority：

- `simple-reliable-control` 要求 direct fact、最早根因、一个合法 next action 与同一 checkpoint 重跑。
- `agent-assistance-and-control` 要求维持既有 owner，避免 Agent 或 Markdown 成为第二 authority。
- `human-centered-gates` 决定 `guide|confirm|hard-stop` 与不可 waiver 的身份、完整性、授权和恢复边界。

当前 `04-image2-refinement` 只拥有 HTML 后的 visual-slot lifecycle，whole-page `image2-only` production
仍主要位于 `05-iteration/legacy-image2`。这与 Image Production 的并列生产语义不一致；Change 2 将
在同一个 module/interface 迁移中处理目录、adapter ownership、main specs 与 active guidance。历史
`image2-only` mode 和 `legacy-image2-first` pipeline label 可以作为显式 compatibility wire vocabulary 保留，
但不得继续充当活动 Phase/capability 的主概念。

新建的 legacy Image2 轻量迭代 bug 是 Change 1 的现实探针，而非预设修复方案。它目前与已归档
BUG-016 编号冲突，登记前须改为 BUG-033；其每条归因必须用不手改 state 的最小 fixture 验证。详情见
[当前基线与探针](agent-workflow-simplification/01-current-baseline.md)。

## 文档地图

- [当前基线与探针](agent-workflow-simplification/01-current-baseline.md)：运行时事实、policy 映射和 legacy
  Image2 单页迭代复现纪律。
- [三项 Change 路线](agent-workflow-simplification/02-three-change-route.md)：每项的 scope、删除目标、
  Interface/seam 和退出条件。
- [边界与验收](agent-workflow-simplification/03-guardrails-and-validation.md)：protected invariants、
  验证矩阵、风险、量化指标和 proposal admission。

## 非目标

- 不提升 HTML 视觉质量或实现 HTML style-master。
- 不混淆 whole-page Image Production 与 visual-slot Image Production 的 final-page authority、授权或完成语义。
- 不绕过 provider authorization、identity、receipt/provenance、CAS/journal/reset，或手改
  `deck_*`、`dpt_*`、`_generated/` 作为证明。
