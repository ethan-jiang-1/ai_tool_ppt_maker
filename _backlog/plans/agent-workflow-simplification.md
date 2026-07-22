# Plan: Agent 工作流控制面的减法重构

> 类型: 架构审视 / 简化路线 | 更新: 2026-07-22 | 状态: 活跃 | 建议: 3 个 OpenSpec change 严格串行

## 决策

框架不需要减少真实生产约束。稳定 `slide_id`、版本发布、canonical bytes/hash、provider
authorization、CAS/journal/recovery、receipt/provenance 与 `_generated/` owner 都保护可说明的
不变量，不能为了降低代码或文档量而删除。

需要减的是 Agent 面向的控制面：同一事实被 controller、generic node state、domain transaction、
`status`、`state --json` 和 CLI routing 重复推导，迫使 Agent 拼接 hash、flag 和恢复协议。目标是让
Agent 保留意图、创意判断与人类沟通，deep module 在一个小 Interface 后完成机械检查、写入和恢复。

三种 production mode、跨 pipeline transition、authorization 与 recovery 都已有各自的 direct owner。
本计划只消费这些 owner，不重建 mode、transition、authorization 或 recovery authority。目标领域术语
将从“Image2 refinement”转为 **Image Production**：它与 HTML Production 并列，包含 whole-page 与
visual-slot 两个不同 adapter；后者仍可被称为 visual-slot refinement，但不再定义整个 Phase/module。

## 当前事实与目标边界

同一 readiness/next action 目前由 controller、generic node state、domain transaction、`status`、
`state --json` 和 CLI routing 多处推导。目标是让 Agent 只处理意图、创意判断和人类沟通；机械检查、写入和
恢复由一个小 Interface 后的 direct owners 完成。BUG-033 是 Change 1 的复现探针，不预设 `--incremental`、
force 或 state bypass 方案。

`04-image2-refinement` 目前只表达 HTML delivery 后的 visual-slot 工作，而 first-class `image2-only` 的
whole-page production 位于 `05-iteration/legacy-image2`。目标是以 **Image Production** 作为与 HTML Production
并列的 family，并保留两个 adapter 各自的 authority：whole-page 产生最终页面；visual-slot 只产生受控资产。
`image2-only` 仍是活动的一等 production-mode enum；`legacy-image2-first` 是 markerless whole-page
source 的规范化 pipeline identifier，既服务当前 `image2-only`，也服务历史 compatibility；它不是 source
frontmatter，也不再是活动 Phase/capability 名称。

本计划采用以下边界：

- 保持三个 change。Change 2 只处理 workflow control 与 caller-facing Interface；不在同一 change 改动
  production graph、目录或 Image Production durable record。Change 3 承担后者和随后的治理收束。
- `status` 与 `state --json` 共享同一个只读 `workflow_inspection` projection；`state --json` 仍保留原始
  durable-state 调试输出，不能被 projection 替换。Inspection 不写 state/history、不开网络/remote provider，
  mutation owner 在写入前仍重新检查 direct fact。
- `workflow_inspection` 返回一个有序的 `primary_action`，而不是吞掉其它事实的唯一字符串；非阻断观察保留在
  `observations`，只有必须由人作出语义选择时才提供受限 alternatives。这样“一个合法下一步”不变成 God facade。
- `04-image-production` 是 capability taxonomy，不是数字排序的隐式前置。whole-page adapter 可从
  `02-visual-system` 进入；visual-slot adapter 只能在 HTML delivery 后进入；`05-iteration` 只分类并调用
  当前 adapter，不拥有 production implementation。
- visual-slot 的历史 `nodes["image2-refinement"]` record 是显式 compatibility wire。新写入迁移为
  Image Production record，state owner 以一次 CAS 同时写新 record/删除旧 record；观察路径 dual-read，双 record
  不一致 fail closed。旧 reader 保留到未来明确的 run-bundle compatibility retirement，不在这三个 change 中凭
  时间猜测删除。

## 三项 Change

| 顺序 | Change | 目的 |
|---|---|---|---|
| 1 | `unify-workflow-inspection` | 建当前事实 ledger、最小复现与只读 inspection result，让所有观察面消费同一 evaluator。 |
| 2 | `simplify-workflow-control-and-interfaces` | 在 Change 1 证明可重建事实后，完成 generic node control 的退休与 deep Interface cutover；保持现有 Image2 物理 owner 不动。 |
| 3 | `realign-image-production-and-framework-governance` | 在控制面稳定后，迁移 Image Production graph/目录/兼容 record，并以 protected-invariant 收束治理、文档与测试。 |

三项的详细范围、退出条件和依赖见
[三项 Change 路线](agent-workflow-simplification/02-three-change-route.md)。

## 三项边界

Change 1 只建立无副作用的事实 projection。Change 2 只改变 workflow control 与 caller-facing Interface，
冻结 Image Production 的 graph、目录和 durable wire。Change 3 再改 Image Production 的 graph、目录和兼容 record，
随后收束治理。这样每项都有独立的外部行为合同和失败归因。

## 执行原则

- 只从 direct fact 得出最早根因和一个有序的 primary action；同一 checkpoint 可重跑。
- Agent、Markdown、status 和 metadata 都不成为第二 authority。
- `guide|confirm|hard-stop` 保留既有的身份、完整性、授权和恢复边界；hard-stop 不以 force/waive 绕过。

Change 3 处理 graph、目录、adapter ownership、compatibility record、main specs 与 active guidance。
`legacy-image2-first` 保留为 markerless pipeline wire vocabulary；`image2-only` 保持 production-mode authority；
两者都不得继续充当活动 Phase/capability 的主概念。BUG-033 的每条归因必须用不手改 state 的最小 fixture 验证。

## 文档地图

- [当前基线与探针](agent-workflow-simplification/01-current-baseline.md)：运行时 owner、术语和 BUG-033
  单页迭代复现纪律。
- [三项 Change 路线](agent-workflow-simplification/02-three-change-route.md)：每项的 scope、删除目标、
  Interface/seam 和退出条件。
- [边界与验收](agent-workflow-simplification/03-guardrails-and-validation.md)：protected invariants、
  验证矩阵、风险、量化指标和 proposal admission。

## 非目标

- 不提升 HTML 视觉质量或实现 HTML style-master。
- 不混淆 whole-page Image Production 与 visual-slot Image Production 的 final-page authority、授权或完成语义。
- 不绕过 provider authorization、identity、receipt/provenance、CAS/journal/reset，或手改
  `deck_*`、`dpt_*`、`_generated/` 作为证明。
- 不把 raw durable state 改写为 workflow projection，也不为“统一输出”增加新的 state/cache authority。
