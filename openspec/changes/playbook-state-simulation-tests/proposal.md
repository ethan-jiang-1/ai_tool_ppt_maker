## Why

当前回归测试 (`npm test`, 25 个单元测试) 只覆盖单个脚本的输入输出, 没有端到端验证 playbook 体系的 state 转换是否正确. 需要一套**状态机模拟测试**——不跑真实 CLI、不调真实 LLM, 纯粹验证 node 序列、entry/exit gate、state 转换矩阵的正确性.

## What Changes

- 新建 `tests_e2e/` 目录 (repo 根, 与 `tests/` 平级, 不混)
- 新建 `tests_e2e/test-state-machine.mjs` — 核心状态机模拟测试:
  1. **全流程 happy path**: create-deck 的 11 nodes 完整跑通, 验证 state 每步正确
  2. **entry gate 拒绝**: 前置 node 未完成时 `setNodeStatus` 应该检测到并拒绝
  3. **exit gate 拒绝**: 条件不满足时不允许标记 completed
  4. **rerun 分支**: hitl2 decision=repair → rerun → seed-topics, 验证路由正确
  5. **gate approved vs waived**: 行为差异测试
  6. **断电续跑**: 从已有 state 文件恢复, `readState` → 从 current_node 继续
  7. **shared node 引用**: classify-change 被 edit-text 和 edit-visual 正确 include

## Capabilities

### New Capabilities

- `state-simulation-tests`: 状态机模拟测试——验证 playbook state 转换矩阵, 不依赖 CLI/LLM, 纯逻辑验证

## Impact

| 影响面 | 说明 |
|--------|------|
| `tests_e2e/` | 新建目录 |
| `tests_e2e/test-state-machine.mjs` | 新建, ~300 行 |
| `vitest.config.mjs` | 可能需要加 include pattern |
| `package.json` | 加 `test:e2e` script |
