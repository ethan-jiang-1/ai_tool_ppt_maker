## Context

`tests/` 是单元测试 (脚本 I/O). `tests_e2e/` 是状态机模拟——验证 playbook state 转换矩阵. 两者独立运行.

## Decisions

### 1. 测试依赖

```
test-state-machine.mjs
  → import state.mjs (readState, writeState, setNodeStatus, checkEntry, checkExit, ...)
  → os.tmpdir() 临时目录 (模拟 deckDir)
  → 测试完 rmSync 清理
  → 不调 CLI (bundle_layout, unified_pipeline)
  → 不调 LLM (Agent 行为由函数调用模拟)
```

### 2. 12 个测试场景

| # | describe | it | 验证 |
|---|----------|----|------|
| 1 | happy path | 10 nodes 序列 | status: pending→in_progress→completed, current_node 更新 |
| 1b | happy path | timestamp | started/completed 时间戳写入 |
| 2 | entry gate | wave0 被 seed-topics pending 阻挡 | seed-topics 不是 completed, wave0 不能启动 |
| 3 | exit gate | instantiation 未完成 exit 检查 | status 保持 in_progress, 不标记 completed |
| 4 | rerun | hitl2 repair | nodes.hitl2.decision=repair, rerun completed, seed-topics re-completed |
| 4b | rerun | hitl2 proceed | nodes.hitl2.decision=proceed, readiness→final |
| 5 | gate | approved/waived | 两者 readState 恢复正确 |
| 5b | gate | pending | pending 阻止 Stage 2 |
| 6 | resume | write→read→continue | readState 恢复 current_node 和 node statuses |
| 7 | shared | classify-change includes | 两个 playbook 引用同一 shared node, 不重复 |
| 8 | node_done | skipNode | isNodeDone=true, isNodeCompleted=false |
| 9 | playbook_stack | switch→resume | push 保存位置, pop 恢复 |
| 10 | atomic write | write→read | writeState 后 readState 读到正确数据 |
| 11 | corrupted | bad YAML | readState 返回 {corrupted:true, errors:[...]} |
| 11b | corrupted | missing file | readState 返回 default state |
| 12 | validateState | completed→in_progress | validateState 检测非法, errors 包含详情 |

### 3. 运行方式

```bash
npm run test:e2e        # vitest run --config vitest.e2e.config.mjs (16 tests)
npm test                 # 单元测试 (25 tests, 不含 e2e)
```
