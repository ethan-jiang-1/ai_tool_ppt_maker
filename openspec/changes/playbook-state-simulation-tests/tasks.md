## 1. 创建 tests_e2e/ 基础设施

- [x] 1.1 `mkdir tests_e2e/`
- [x] 1.2 创建 `vitest.e2e.config.mjs`
- [x] 1.3 `package.json` 加 `test:e2e` script

## 2. 状态机模拟测试 (12 describe, 16 tests)

- [x] 2.1 happy path: 10 nodes 完整序列, pending→in_progress→completed
- [x] 2.2 happy path: started/completed timestamps
- [x] 2.3 entry gate: seed-topics pending → wave0 不能启动
- [x] 2.4 exit gate: 条件不满足 → 保持 in_progress
- [x] 2.5 rerun: hitl2 repair → rerun → seed-topics
- [x] 2.6 rerun: hitl2 proceed → readiness → final
- [x] 2.7 gate: approved/waived round-trip
- [x] 2.8 gate: pending 阻止 Stage 2
- [x] 2.9 resume: writeState→readState→续跑
- [x] 2.10 shared: classify-change includes
- [x] 2.11 node_done: skipNode → isNodeDone vs isNodeCompleted
- [x] 2.12 playbook_stack: switch→resume
- [x] 2.13 atomic write: writeState→readState
- [x] 2.14 corrupted: bad YAML → {corrupted:true}
- [x] 2.15 corrupted: missing file → default state
- [x] 2.16 validateState: completed→in_progress 检测

## 3. 验证

- [x] 3.1 `npm run test:e2e` — 16/16 passing
- [x] 3.2 `npm test` — 25/25 passing, 不受影响
