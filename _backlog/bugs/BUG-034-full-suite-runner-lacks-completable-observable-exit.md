# BUG-034: 默认开发测试入口没有受控范围、时间预算和可观察退出契约

> 严重级别: P1 | 发现: 2026-07-23 | 状态: 活跃 | 基线校准: 2026-07-23

## 症状

默认 `npm test` 直接覆盖整个 unit/integration 集合，其中混入 Canvas、Chromium、PPTX、ECharts、HTML
compositor 及长链路 fixture。它在维护环境中只输出部分进度而没有最终 Vitest summary 或可用 exit code，Agent
无法区分通过、失败、超时和 runner 被回收。

问题不应被理解为“必须让全量 suite 在开发态跑完”。开发态真正缺少的是一个短、确定、可复现的核心验证入口；把
第三方渲染/图像引擎和高成本端到端场景放在默认路径，会扩大等待时间和不相关失败面，却不能提高当前 change 的判断质量。

## 最小复现

1. 从仓库根目录运行 `npm test -- --reporter=dot --silent`。
2. 当前默认选择会进入重型渲染与整合测试，维护执行环境可能只留下部分 dots，没有最终 summary/exit result。
3. 与之对照，change-owned focused suites 与已选的 mocked E2E 路径可以独立完成；它们才是开发态所需的反馈形状。

## 已确认的基线

- `vitest.config.mjs` 的默认 include 覆盖全部 `tests/**/test_*.mjs` 与 `tests/**/test-*.mjs`；即使 worker
  数已降到 `1..2`，仍会调度 Canvas/Chromium/PPTX/HTML renderer 等非核心依赖。
- `realign-image-production-and-framework-governance` 的 focused architecture/state/CLI suites 和选定 E2E
  均已独立通过；这证明日常验证不需要全量 sweep 才能判断该 change。
- 默认入口的 partial output 是范围和可观察性契约错误，不是要求增加并发、延长 timeout，或让 Agent 反复重跑
  完整 suite 的理由。

## 修复方向

建立分层、明确命名的验证入口，而不是继续强化一个全量默认命令：

1. `npm test` 只运行纯 Node、确定性、无网络且不加载 Canvas/Chromium/PPTX/ECharts/HTML compositor 的核心
   contract/unit tests；它必须在 **60 秒** 内输出最终 summary 与明确 exit code。超时本身必须是明确失败，不能
   留下半截输出。
2. 每个 OpenSpec change 只补充和运行受影响 seam 的 focused suite；需要跨边界证明时，最多选择一条
   mocked representative route，而不是把所有 pipeline、mode 和历史 fixture 都纳入日常门槛。
3. 浏览器/HTML 渲染、图像/图表引擎、PPTX 组装与高成本 E2E 分别提供显式 opt-in 命令。它们是按需诊断或
   发布前抽样，不是开发态的默认 gate，也不得因为默认命令运行而隐式加载第三方 runtime。
4. 新入口需要记录测试分层与 source-to-test owner，防止重型测试未来悄悄回流到 default；不削弱任何被保留
   核心断言。

## 非目标

- 不为让全量 suite 完成而增加 worker、拉长 timeout，或重试同一重型命令。
- 不把依赖外部 provider、真实浏览器、HTML renderer 或图像/图表引擎的结果当作开发态 correctness 的唯一证明。
- 不把“全 E2E 都绿”设为当前框架维护 change 的完成门槛。

## 关联工作

该问题发现于 `realign-image-production-and-framework-governance` 的验证阶段。该 change 已由 change-owned
focused suites 和选定 E2E 覆盖完成；BUG-034 负责后续建立适合开发态的测试分层与短反馈契约。
