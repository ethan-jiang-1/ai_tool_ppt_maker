## Why

gate-condition-catalog change 引入了 `_state/` 目录 (state.yaml + history.jsonl) 替代旧的单文件 `run-bundle-state.yaml`，同时实现了 checkEntry/checkExit 和 Gate Conditions Catalog。但 node-specification 和 playbook-execution 两个主 spec 仍引用旧概念——coding agent 读到会混淆。

framework-charter 还残留 REMOVED Requirements 段引 `00_project_setup`——纯噪声。

## What Changes

用 delta spec (MODIFIED/REMOVED) 修 3 个主 spec:

- **node-specification**: `run-bundle-state.yaml` → `_state/state.yaml` + `history.jsonl`. 
  补 `checkEntry`/`checkExit` 返回 `{missing, unknown}`. 加 `appendHistory`/`readHistory`.
- **playbook-execution**: `run-bundle-state.yaml` → `_state/state.yaml`. 删旧共存描述.
- **framework-charter**: 删 REMOVED Requirements 段 (已完成的重组, 不再需要). 删 "Reference documents are in 00_project_setup" 残留.

## Capabilities

### Modified Capabilities

- `node-specification`: 旧单文件 state → `_state/` 目录, 补 checkEntry/checkExit/appendHistory/readHistory
- `playbook-execution`: 旧单文件 state → `_state/state.yaml`
- `framework-charter`: 删 REMOVED Requirements 噪声段
