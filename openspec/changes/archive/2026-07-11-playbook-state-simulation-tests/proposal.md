## Why

PPTMAKER_FRAMEWORK 引入了 Playbook 体系 + Gate Conditions Catalog + `_state/` 目录. 但仅靠单元测试无法验证整个 state machine 的设计是否正确——node 序列是否走对、entry/exit gate 是否生效、rerun 分支是否路由正确、playbook 切换后是否恢复位置、断电后能否续跑.

需要一套**状态机模拟测试**——不跑 CLI、不调 LLM, 纯逻辑验证 state 转换矩阵.

## What Changes

- `tests_e2e/` 目录 (repo 根, 与 `tests/` 平级)
- `test-state-machine.mjs` — 12 个 describe block, **16 tests**:

  1. **happy path**: create-deck 10 nodes 完整执行, state 每步更新
  2. **entry gate**: 前置 node pending 时下游 node 不能启动
  3. **exit gate**: 条件不满足时不能标记 completed
  4. **rerun branch**: hitl2 repair → rerun → seed-topics, proceed → readiness → final
  5. **gate approved/waived**: 两者都允许 Stage 2, pending 则阻止
  6. **resume**: writeState → readState → 从 current_node 继续
  7. **shared node**: classify-change 被 edit-text 和 edit-visual 正确引用
  8. **node_done**: skipNode 后 isNodeDone 通过, isNodeCompleted 不通过
  9. **playbook_stack**: switchPlaybook push → resumePlaybook pop 恢复
  10. **atomic write**: writeState 产出可读 state.yaml
  11. **corrupted state**: 无效 YAML → readState 返回 {corrupted:true}
  12. **validateState**: completed→in_progress 检测为非法

- `vitest.e2e.config.mjs` — 独立 vitest 配置
- `package.json` — `test:e2e` script
- 依赖 `scripts/lib/state.mjs` (readState/writeState/checkEntry/setNodeStatus/appendHistory/...)

## Capabilities

### New Capabilities

- `state-simulation-tests`: 状态机模拟测试, 16 tests, 纯逻辑验证 state 转换矩阵. 不依赖 CLI/LLM

## Impact

| 影响面 | 说明 |
|--------|------|
| `tests_e2e/` | 新建目录, 1 文件, ~330 行 |
| `vitest.e2e.config.mjs` | 新建 |
| `package.json` | 加 `test:e2e` script |
