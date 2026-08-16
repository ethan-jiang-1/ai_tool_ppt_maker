# Proposal: Project validate source/state observation

## Why

`ppt_flow validate <run-dir>` 把 source parsing 成功与 current source/state identity 绑定混在同一个
失败里：在合法编辑 canonical source/visual-language 后（保留 epoch 历史 evidence 的正常中间态），
validate exit 1 只输出 `TARGET_SOURCE_STATE_IDENTITY_MISMATCH`（BUG-069），无法回答"刚改的
source 本身是否有效"；而 source 语法错误时错误更早出现，两种 failure 的优先级也不可见。同时
`node-specification` 仍把不存在的 `--check-gates` 写成现行 state 入口（H-2），触及 requirement 中
仍残留 retired `mode` 表述（M-3 触及范围）。现在实施：路线图 3 个串行 change 中的最后一个，依赖
Change 1 已稳定的 source-invalid 语义（producer-issued problem facts + `source_validation`/
`edit_source` 投影）。

## What Changes

- **拆开 validate 的两段投影**：先做 source-only candidate 解析（既有 `resolveTargetCandidateSourceContext`，
  零 state 读写的 provider-free parse）；再做 source/state identity 绑定（既有
  `materializeTargetSourceCandidateContext`）。
- **Source-invalid 优先**：source-only 解析失败时，validate 复用 Change 1 的 producer-issued
  problem-fact 投影（`source_validation` + `edit_source`，exact owner/locator），不再被 state
  identity 覆盖。
- **Source-valid + state-stale**：exit 保持 nonzero，state owner hard-stop（reason
  `target_source_state_identity_mismatch`）与 owner-owned rebind next 保留，同时在同一 final
  envelope 中公开稳定的机器可消费 `source_valid: true` observation（additive bounded boolean，
  仅在该事实成立时投影）。
- **Source-valid + state-current**：保持现有成功 human text（`✓ ... receipt validated: N slide(s)`），
  exit 0。
- **H-2**：`node-specification` 的 `--check-gates` 修正为实际存在的 `--validate-state`；实现注释
  （`state.mjs` 头部）同步。
- **M-3（触及范围）**：本 change 触及的 requirement 中 retired `mode` 表述统一为 selected
  workflow / production identity 语义，不做全仓术语扫荡。
- **无权限扩张**：validate 不授予 raw planning、provider work、state rebind 或绕过 stale identity
  的权限；`source_valid` observation 不是授权、不是 success projection、不能替代 owner next。
- **兼容**：`source_valid` 是 additive 字段（同一 unversioned schema 内），仅 validate
  state-stale envelope 投影；consumer 须容忍未知/附加字段并只以 category/reason/next 为控制权威。

无 **BREAKING** public envelope shape；无新命令/flag；run-bundle contract `none`。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `cli-surface`: validate 的公开投影规则——source-invalid 复用 `source_validation`/`edit_source`；
  source-valid/state-stale 的 final envelope（reason/next/source_valid 字段规则、bounds、
  fail-closed）；`source_valid` additive 字段的版本/兼容/cutover 语义。
- `node-specification`: MODIFIED `CLI exposes state via ppt_flow state command`——`--check-gates`
  修正为 `--validate-state`（H-2），触及 requirement 内 retired `mode` 表述统一为 selected
  workflow（M-3 触及范围）；consumer 对 additive observation 字段的容忍与"observation 非授权"
  语义。

## Impact

- **Harness 源码**：`scripts/ppt_flow.mjs`（`commandValidate` 拆分投影 + state-stale envelope）、
  `03-framed-image/index.mjs` / `04-pure-image/index.mjs`（operations 表暴露 candidate-only
  source resolve，若需要）、`scripts/shared/state/state.mjs`（头部注释 `--check-gates` →
  `--validate-state`）。
- **OpenSpec**：main specs 2 个（上述 Modified）。
- **测试**：进程级三态矩阵——source-invalid（`source_validation`/`edit_source`）、
  source-valid/state-current（exit 0 human text）、source-valid/state-stale（exit 1、reason、
  `source_valid: true`、owner next、无写入快照）；`node-specification` 文本断言
  （`--check-gates` 不再出现、`--validate-state` 一致）。
- **Control owner**：MD⇔JS protocol——JS 拥有 source-valid observation 与 state owner next 的
  发射；MD 只消费 category/reason/next，observation 仅作解释性事实。
- **Run-bundle contract impact**：`none`。validate 保持零写入：不写 state/receipt/plan/
  `_generated/`，不初始化 provider。
- **Policy 引用**：
  - `human-centered-gates.md`：state-stale = `hard-stop`（protected invariant：source/state
    identity 绑定不被绕过、无写入、无 provider），唯一恢复路径为 owner-owned rebind 后重跑同一
    checkpoint；`source_valid` observation 不改变 outcome 分类。
  - `agent-assistance-and-control.md`：direct control path 单一——validate 复用 Change 1 的
    problem-fact 投影与既有 source-only evaluator，不建立第二 source evaluator 或第二 state
    authority。
  - `simple-reliable-control.md`：最短闭环（source-only parse → 一个 identity check → 一个
    owner next）；删除/合并的复杂度：validate 中 source/state 混叠的单一失败呈现；
    additive 字段是唯一新增 surface，且有明确投影/省略规则。
