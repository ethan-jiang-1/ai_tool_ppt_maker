# 三项 Change 路线

返回 [主计划](../agent-workflow-simplification.md)。每一项在前项归档、main specs 同步与回归后才可创建。

## Change 1: `unify-workflow-inspection`

**目的**：先统一读路径，不改变生产写入语义。

建立一个 read-only `inspectWorkflow(run, intent?)` module。它是一个 deep module：其 Interface 只返回
当前 checkpoint 的 posture、bounded root cause、artifact/evidence summary、exactly one next action、
nullable continuation、`requires_human` 和 protected invariant；其 Implementation 可组合 mode/source,
artifact/review, authorization 和 transaction owners。它不缓存 verdict、不写 state、不复制 domain schema。

工作内容：

1. 为 HTML 新建、Image2 新建、resume、小改、结构变更、refinement、migration/recovery 和 legacy Image2
   单页迭代建立 canonical journey baseline 与 durable-state ledger。
2. 将现有 guidance 作为 domain evaluator 迁入 inspection；`status`、`state --json` 和 human-readable
   output 只适配同一 result，删除外围重复 next/completion override。
3. 用 legacy probe 的最小 fixture 验证每一个 claimed blocker 的 earliest direct diagnostic，不手改
   state、authorization、receipt 或 PPTX。
4. 用 Interface-level negative tests 覆盖 prerequisite short-circuit、one next action、wrong-owner
   no-mutation、same-check rerun 和 inspection zero-write。

**退出条件**：同一 canonical checkpoint 从 `status` 与 `state --json` 得到同一 posture/root/next；每个
durable field 已有 ledger；legacy probe 的有效 root cause 与 guide/confirm/hard-stop 分类均有证据。

## Change 2: `simplify-workflow-control-and-interfaces`

**目的**：合并原来的 generic node-control retirement 与 public-interface deepening，避免删掉 node FSM 后
仍让 caller 通过大量 operation/flag/re-export catalog 重建同一协议。

它以 Change 1 ledger 为唯一删除依据：reconstructible generic node facts 停止新写，旧状态采用
dual-read/single-write 迁移；只有不可重建且跨 invocation 必需的 human intent 才能成为最小 durable record，
并写明 owner/invalidator。provider authorization、target identity、receipt/provenance、CAS/journal/reset
仍保持各自 domain owner，不属于通用状态删除集。

同时按 caller goal 设计少数深 Interface，例如 inspect、preview、produce、refresh、publish decision。一个
Interface 的 seam 只暴露 caller 必须知道的 identity、ordering、error mode 与 performance facts；stage/helper
留在 Implementation 内。`ppt_flow` 只 parse/dispatch/envelope，不能成为 mode/gate/recovery evaluator；
兼容 alias 只做有截止期的转发，不复制 logic。

Change 2 同时完成 Image Production 的语义和物理 ownership 迁移：将
`workflow/04-image2-refinement/` 与 `scripts/04-image2-refinement/` 迁移为
`04-image-production/`，使其成为与 `03-html-production/` 并列的 production module，而非 HTML
之后的必经生命周期编号。该 module 在一个小 public Interface 后拥有两个 adapter：whole-page Image
Production 为 `image2-only` 产生最终页面；visual-slot Image Production 为 `html-then-image2` 产生受控
资产但不取得最终页面 authority。`05-iteration` 只保留迭代/compatibility routing，不再是活动 whole-page
image-production implementation 的概念 owner。

这次迁移必须原子更新 main specs：以 `image-production` 作为长期 capability/Phase 主概念，吸收旧
`image-generation` 与 `visual-slot-refinement` 的活动 ownership 表述；更新
`framework-directory-layout`、`framework-script-layout`、`framework-charter`、`node-specification`、
`playbook-execution`、`pipeline-orchestration`、`cli-surface`、run-bundle specs 与对应 tests/docs。旧
`04-image2-refinement`、Phase-4-refinement-only 和“whole-page 仅 legacy”表述必须从 active main specs
消失。唯一允许的旧词位置是明确标为 compatibility/migration 的 mode、pipeline 或 historical deck
contract；archives 保留历史，不作为清理目标。

对于 legacy Image2 probe，只能在 Change 1 证明 blocker 属于 reconstructible generic control 后合并或删除。
远端 submit 仍需 explicit selected-slide scope；prompt/source 变化仍由 provenance owner 判断；canonical
assembly 仍从 owner-owned artifacts 产生。禁止以泛化 `--incremental` 或 force 取代 direct fact。

**退出条件**：正常 create/edit/resume 不依赖 generic node mutation；restart 仅凭 direct owner 与最小
durable facts 得到同一 next action；一个 canonical task 不跨多个 public seam；删掉新 module 时复杂度会重新
出现在 caller，证明它提供 depth、leverage 与 locality，而非 facade。新 deck 的 `image2-only` 可从
visual-system 直接进入 Image Production，不先经过 HTML；`html-then-image2` 仍只能在 HTML delivery 后进入
visual-slot adapter；active main specs 不再以 refinement-only 解释这两个不同生产路径。

## Change 3: `simplify-framework-governance`

**目的**：在行为、writer 和 public Interface 已稳定后，让文档、spec 和 architecture checks 只保护有
failure story 的 invariant。

工作内容：

1. 对每个 blocking architecture/coherence rule 记录 protected invariant 与真实 failure story；无法回答
   policy admission 的 exact tree/count/path-mirroring 规则删除或降为 advisory。
2. 保留 import direction、private implementation、provider-load isolation、production-data boundary 等
   可说明的规则；用 Change 2 的 Interface/journey tests 替代只观察 private wiring 的 tests。
3. 收束 progressive disclosure：BOOTSTRAP 提供 intake/doctor/init/status；正常 Agent 路径不要求读 state
   schema 或 direct executable；recovery detail 仅由相应 hard-stop 链接。
4. 清理无 runtime authority 的 NODE-SPEC/controller/spec 文本，保留 domain contract；在 OpenSpec review
   中固化 policy admission。
5. 执行 Change 2 的术语残留审计：active docs/specs/tests 不得把 `04-image2-refinement` 或
   refinement-only 当作 Image Production 的主概念；compatibility exception 必须有明确 owner/reason，不能
   靠宽泛禁止词扫描掩盖真实历史 contract。

**退出条件**：移动 private file 不触发无关 contract churn；每条 blocking rule 有 failure story；新 Agent
可从 bootstrap 到一个准确 next action；完整 tests 继续覆盖所有 protected invariants。

## 串行原因

Change 1 是只读 observation seam，提供 Change 2 删除/迁移需要的证明。Change 2 改写 writer 与 Interface，
因此 Change 3 不能先删除其 docs/checks。原来独立的“deepen interfaces”并入 Change 2，因为它与 retire
generic control 共用同一个 caller seam 和 migration evidence，拆开会多一次昂贵的 OpenSpec lifecycle 而不
增加可独立验收的行为。
