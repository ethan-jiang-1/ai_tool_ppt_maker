## 1. 创建 tests_e2e/ 基础设施

- [x] 1.1 `mkdir tests_e2e/`
- [x] 1.2 创建 `tests_e2e/test-state-machine.mjs` — 7 个 describe block:
  - happy path: create-deck 全 11 nodes 跑通
  - entry gate reject: 前置未完成时拒绝
  - exit gate reject: 条件不满足拒绝 completed
  - rerun branch: hitl2 → rerun → seed-topics
  - gate approved/waived: 行为一致
  - resume: writeState → readState → 续跑
  - shared node: classify-change includes 验证
- [x] 1.3 `package.json` 加 `"test:e2e": "vitest run --config vitest.e2e.config.mjs"`
- [x] 1.4 创建 `vitest.e2e.config.mjs` (include: tests_e2e/)

## 2. 验证

- [x] 2.1 `npm run test:e2e` 全部通过
- [x] 2.2 `npm test` 不受影响 (25/25)
