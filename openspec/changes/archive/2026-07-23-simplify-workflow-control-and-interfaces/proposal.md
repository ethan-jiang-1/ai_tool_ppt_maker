## Why

`unify-workflow-inspection` 已将 status/state 的观察语义收敛到同一个零写 projection，但
workflow controller、generic node state 与 CLI routing 仍会重复拼装 mode、gate、recovery 和
next-action 协议。Agent 因而需要理解并重组多个 direct owner 的细节，generic node records 也继续保存
可以从 direct facts 重建的控制信息。

现在可以以 Change 1 的 durable-field ledger 和 canonical journey baseline 为删除依据：保留真正跨
invocation、不可重建的人类 intent，与 provider authorization、target identity、receipt/provenance、
CAS/journal/reset 和 cross-pipeline transition 的既有 owner；退休其余 generic workflow control。

## What Changes

- 为已解析 exact run 的 resume/iteration 定义唯一 workflow-entry：Controller 与 `status`/`state`
  observation 以 `workflow_inspection` 的有序 `primary_action` 消费工作流指引。Greenfield `init` 与每个
  run-scoped mutation command 仍由其既有 closed grammar/direct owner 进入；entry 不替代执行 dispatch，
  只暴露 caller 必须知道的 identity、顺序与 gate 事实，不复制 direct owner schema 或成为 operation
  catalog facade。
- 分三个 checkpoint 进行 control cutover：先消费 inspection、再停止写 ledger 已证明可重建的 generic
  node record、最后删除无 caller 的 reader 或记录其明确兼容保留/退休 owner。
- 保持 raw state、mutation-time direct revalidation、existing CLI envelope 与 direct owner 的 CAS/journal
  写入边界；每个保留 alias/compatibility reader 必须有可审计的 inventory、retirement owner、removal
  trigger 与精确 `retire_by: change:<name>|release:<version>`。alias 只能是纯转发，不能出现第二
  evaluator 或 result schema。
- 保留 execution cursor（`playbook`、`current_node`、execution/version binding 和当前 node 的
  `waiting_for`）作为 state-owned direct durable facts；inspection 必须消费它们并给出唯一的
  resume/wait/routing action。退休的是独立推导 next-action 的 compatibility evaluator，而不是 cursor。
- 增加 journey-level deletion、restart、same-check rerun、wrong-owner no-mutation 和 protected gate
  regression，证明减法没有创造绕过。

**BREAKING:** 已证明可重建的 generic node control 不再是新的 durable workflow authority；支持的历史
record 只读兼容直到其记录的 retirement owner、removal trigger 和精确 `retire_by` 生效。现有
direct-owner durable records、state execution pointer 与 raw-state observation contract 不在本 change 的
删除范围内。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workflow-inspection`: 将 projection 明确为 run-scoped Controller/status/state 的唯一 caller-facing
  workflow-entry，保持 zero-write/zero-network 与 mutation-time revalidation；它不成为 mutation CLI 的
  dispatcher。
- `node-specification`: 退休可重建 generic node writer，定义最小 durable human-intent retention 与历史
  reader compatibility；execution cursor 仍是 state-owned direct record，不接管 domain owner record。
- `playbook-execution`: Controller 从 inspection 消费有序 observation/resume entry，停止自行推导
  mode/gate/recovery。
- `cli-surface`: `ppt_flow` 对 mutation 保持 parse/closed-grammar dispatch/envelope，且不成为第二 workflow
  evaluator；`status`/`state` 复用 inspection 的观察指引，兼容 alias 保持可到期的纯转发。
- `framework-charter`: Agent Contract 与 Node Spec 的 resume/gate protocol 迁移为消费
  `workflow_inspection.primary_action`/`continuation`；旧派生字段最多是 display compatibility。
- `commands-reference`: COMMANDS 的 run-scoped resume guidance 指向 inspection projection，而不要求
  Agent 执行 `html_resume_guidance`。

## Impact

- 主要影响 `scripts/shared/workflow/inspect_workflow.mjs`、`scripts/shared/state/state.mjs`、
  `scripts/ppt_flow.mjs`、`reference/workflow-inspection-ledger.md`、
  `tests/contracts/workflow-control-ledger-v2.json`、charter/COMMANDS/playbook controller guidance，
  以及 workflow/state/CLI contract tests。
- 不新增 provider、网络调用、state cache、generic setter 或 CLI command；不修改 Image Production graph、
  `04-image2-refinement` 目录、`image2-refinement` durable record、whole-page implementation 或生产
  `deck_*`/`dpt_*` 数据。
- Gate-sensitive paths 继续由 owner 给出 `guide|confirm|hard-stop`；hard-stop 保护 identity、integrity、
  authorization 与 recovery，不能以 force/waive 绕过。该 control path 遵循
  `agent-assistance-and-control` 与 `simple-reliable-control` 的单一 direct evaluator、最近合法动作和
  same-check rerun 原则。
