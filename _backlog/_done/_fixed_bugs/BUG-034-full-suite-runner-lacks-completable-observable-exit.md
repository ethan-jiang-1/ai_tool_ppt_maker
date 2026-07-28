# BUG-034: 默认开发测试入口没有受控范围、时间预算和可观察退出契约

> 严重级别: P1 | 发现: 2026-07-23 | 状态: 已修复 | 基线校准: 2026-07-28 | 修复: 2026-07-28

## 原始症状

默认 `npm test` 直接覆盖整个 unit/integration 集合，其中混入 Canvas、Chromium、PPTX、ECharts、HTML
compositor 及长链路 fixture。它在维护环境中只输出部分进度而没有最终 Vitest summary 或可用 exit code，Agent
无法区分通过、失败、超时和 runner 被回收。

问题不应被理解为“必须让全量 suite 在开发态跑完”。开发态真正缺少的是一个短、确定、可复现的核心验证入口；把
第三方渲染/图像引擎和高成本端到端场景放在默认路径，会扩大等待时间和不相关失败面，却不能提高当前 change 的判断质量。

## 原始复现

1. 从仓库根目录运行 `npm test -- --reporter=dot --silent`。
2. 当前默认选择会进入重型渲染与整合测试，维护执行环境可能只留下部分 dots，没有最终 summary/exit result。
3. 与之对照，change-owned focused suites 与已选的 mocked E2E 路径可以独立完成；它们才是开发态所需的反馈形状。

## 修复与当前基线

`npm test` 现在运行 `tests/contracts/run_development_verification.mjs`，它只从受审计的
`development-verification-core-v1.json` 选择 core entries，并拒绝 Canvas、Chromium、Playwright、PPTX、ECharts、
HTML compositor、provider、process/network closure。它对 preflight、child execution 和 shutdown 设定总共 60 秒
预算，并始终输出一条 JSON summary 和明确 exit code。

`test:sweep`、`test:focused`、`test:mock-e2e` 与 `test:real-e2e` 是显式 opt-in 的命名入口；focused runner 还拒绝
visual-engine closure，真实 E2E 需要 `PPTMAKER_RUN_REAL_E2E=1`。`retire-legacy-production-surface` 的任务 5.2
将该分层作为当前框架验证基线。

2026-07-28 实测 `npm test` 在约 0.9 秒以
`{"schema":"development-verification-v1","tier":"core","result":"passed"}` 退出。

## 回归验证

1. `tests/contracts/test_mock_development_verification_runner.mjs` 覆盖 passed、failed、unavailable、timeout 和
   bounded output tail，确保每条路径有一个受控结论。
2. `tests/contracts/test_development_verification_admission.mjs` 覆盖 inventory、scope 与禁止 runtime surface。
3. `npm test` 是日常 core gate；受影响 seam 与 E2E 路径仍按变更范围显式选择。

## 关闭原因

默认入口现在具备受控范围、60 秒预算、最终 machine-readable summary 和准确 exit code；全量/重型验证不再隐式
进入日常 gate。
