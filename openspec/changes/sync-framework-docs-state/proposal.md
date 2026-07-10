## Why

框架方法论文档仍描述旧的单文件 state 模型 `run-bundle-state.yaml`，与实现 (`scripts/lib/state.mjs` 用 `_state/state.yaml` + `_state/history.jsonl`) 及已对齐的 openspec 主 spec (node-specification / playbook-execution) 矛盾。NODE-SPEC.md 是 Node 宪法，coding agent 读它会被误导。

这是 main-specs-sync 的遗留项：那次只对齐了 openspec 主 spec，框架自身的方法论文档没跟上。

## What Changes

把下列文件从 `run-bundle-state.yaml` 迁到 `_state/` 模型 (纯文档/注释同步，不改代码行为):

- `charter/NODE-SPEC.md` (L47, 50, 116, 151): state 文件位置、字段、STATE 条件检查，删 "与 project-metadata.yaml 共存" 旧措辞
- `playbook/create-deck.md` (L30): 初始 state 写入路径
- `COMMANDS.md` (L45): state 写入路径
- `scripts/lib/state.mjs` (文件头注释 ~L2): "State API for run-bundle-state.yaml" → `_state/state.yaml`

## Capabilities

### Modified Capabilities

- `node-specification`: 强化 "NODE-SPEC.md exists" 需求——其记录的 state schema 须匹配实现的 `_state/` 模型，不再是 `run-bundle-state.yaml`
