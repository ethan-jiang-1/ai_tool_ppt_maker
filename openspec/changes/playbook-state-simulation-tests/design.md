## Context

`tests/` 是单元测试 (单个脚本 I/O). `tests_e2e/` 是状态机模拟测试 (playbook state 转换). 两者分开: 单元测试验证脚本正确, 模拟测试验证流程设计正确.

## Goals / Non-Goals

**Goals:**
- 创建 `tests_e2e/test-state-machine.mjs` — 7 个测试场景
- 纯逻辑: import `scripts/lib/state.mjs`, 模拟 Agent 行为, 验证 state 转换
- 用 `os.tmpdir()` 创建临时 run bundle, 测试完清理
- `npm run test:e2e` 独立运行

**Non-Goals:**
- 不调真实 CLI (不跑 bundle_layout, unified_pipeline)
- 不调真实 LLM (不生成 prompt, 不解析 Agent 输出)
- 不创建真实的 run bundle 目录结构

## Decisions

### 1. 测试结构

```
tests_e2e/
└── test-state-machine.mjs    ← 7 个 describe block
```

每个测试: (1) 创建 tmp dir → (2) 写初始 state → (3) 模拟 Agent 操作 → (4) 读 state → (5) 断言字段正确 → (6) 清理 tmp dir.

### 2. Agent 行为模拟

```javascript
// 模拟 Agent 开始一个 node
function simulateNodeStart(state, nodeName, entryChecks) { ... }
// 模拟 Agent 完成一个 node
function simulateNodeComplete(state, nodeName, exitChecks) { ... }
// 模拟用户 gate 决策
function simulateGateApprove(state, gateName) { ... }
```

### 3. 7 个测试场景

| # | 场景 | 验证点 |
|---|------|--------|
| 1 | create-deck happy path | 11 nodes 顺序执行, state 每步正确 |
| 2 | entry gate 拒绝 | 跳过前置 node → 拒绝前进 |
| 3 | exit gate 拒绝 | 条件不满足 → 不允许 completed |
| 4 | rerun 分支 | hitl2 → rerun → seed-topics |
| 5 | gate approved/waived | approved 和 waived 行为一致 (Stage 2 都能跑) |
| 6 | 断电续跑 | writeState → 清理 → readState → 从 current_node 继续 |
| 7 | shared node | edit-text + edit-visual 都 includes classify-change |

### 4. 运行方式

```bash
npm run test:e2e        # 独立运行
npm test                 # 不含 e2e (保持快速)
```
