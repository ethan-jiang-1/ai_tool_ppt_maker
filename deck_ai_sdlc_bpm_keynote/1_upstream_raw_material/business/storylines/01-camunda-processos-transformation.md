---
title: Camunda ProcessOS — 老牌 BPM 厂商的 AI 原生转型
stage: phase_0
storyline: "01"
status: draft
created: 2026-07-08
summary: Camunda 是 BPM 领域老牌厂商。2026 年 5 月发布 ProcessOS——"AI-native BPM" 的唯一标本。CEO 说："每个企业的流程都是 legacy——它们是为没有 AI 的世界设计的。"这个故事是"旧世界玩家在 AI 时代怎么变身"的鲜活案例。
sources:
  - enterprise_bpm/findings/agentic-orchestration/camunda-processos-deep-dive.md
---

# Camunda ProcessOS — 老牌 BPM 厂商的 AI 原生转型

> 这不是创业公司的炒作。这是 BPM 领域最老牌的厂商之一，在 2026 年发布的一款从零为 AI 设计的操作系统。它是"传统方法论厂商在 AI 时代怎么变身"的最佳标本。

---

## 背景：Camunda 是谁

- BPM 领域老牌厂商，以轻量级开源流程引擎起家
- 核心产品是 BPMN 流程引擎——被 BMW、Zalando、AT&T 等企业广泛使用
- 社区版 + 企业版模式，开发者友好

---

## CEO 的判断："The Great Process Re-Engineering"

Jakob Freund（Camunda CEO）：

> "Every process in your enterprise is legacy — it was designed for a world where AI did not exist. This is why we are now entering the decade of 'the great re-engineering': every company will reinvent itself or die."

他的量化判断：给旧流程加 AI 只提升 ~20%。为 AI **重设计**流程可以把**数月压缩到数天**。

**这与 SDLC 侧的判断完全一致**：不是给旧 SDLC 加 AI 步骤——是重新设计整个加工流。

---

## ProcessOS 架构：四个专门 AI Agent

2026 年 5 月发布。四个 Agent 按**流程生命周期**分工，不是按功能模块：

| Agent | 角色 | 做什么 |
|-------|------|--------|
| **Discovery Agent** | 发现 | 用运营数据映射流程**实际怎么跑的**（不是你以为怎么跑的） |
| **Design/Re-engineering Agent** | 重设计 | 围绕结果和 KPI 重设计流程，决定什么归 Agent、什么归人 |
| **Build & Deploy Agent** | 构建 | 生成完整方案——agentic 流程、集成、数据映射、prompt、决策、UI |
| **Optimization Agent** | 优化 | 监控生产环境，标记漂移，用历史数据回测改进方案（人审批后执行） |

**关键洞察**：流程本身变成了一个活的、持续演进的东西——不再是画完 BPMN 就锁死的文档。

---

## 关键架构决策

### 1. 自然语言 → 完整方案
描述想要的业务结果和 KPI。ProcessOS 生成完整流程方案——包括 agent 分配、集成、数据映射、prompt、UI 表单。

**SDLC 对应**：从自然语言 spec → 完整代码 + 测试 + CI 配置。

### 2. Fitness Functions
加权评分模型覆盖多个 KPI（周期、解决率、单例成本、合规率）。指导每一个改进提案的评估。

**SDLC 对应**：CI 质量门禁——把"好不好"变成可测量。

### 3. BPMN = 治理可视化层
BPMN 不再是执行引擎——变成给人看的治理视图。人看 BPMN 理解流程，Agent 在背后自主执行。

**SDLC 对应**：CI/CD pipeline 的可视化——人看 pipeline 图理解流程，Agent 在背后执行每一步。

### 4. Organizational Memory
流程知识不再锁在人脑子里。每个流程的历史数据、优化决策、异常处理——变成组织可复用的记忆。

**SDLC 对应**：代码库 + PR 历史 + postmortem 文档——但 ProcessOS 把它系统化了。

---

## 与 SDLC 的同构

| Camunda ProcessOS | SDLC 等价 |
|------|------|
| Discovery Agent 发现实际流程 | APM/observability 发现系统实际行为 |
| Design Agent 重设计流程 | 架构设计 + spec 编写 |
| Build & Deploy Agent 生成完整方案 | AI 生成代码 + 测试 + CI 配置 |
| Optimization Agent 持续优化 | CI/CD 持续改进 + postmortem 驱动 |
| BPMN = 治理可视化 | CI/CD pipeline 可视化 |
| Fitness Functions | 质量门禁（lint coverage, test pass rate） |
| Organizational Memory | 代码库 + PR 历史 + runbook |

---

## 这个 storyline 说明了什么

1. **旧世界的玩家也在变。** 不是只有创业公司在做 AI-native——老牌厂商也在从零重建。Camunda 没有给旧流程引擎加 AI 插件——它重做了整个架构。

2. **"流程"正在从名词变成动词。** 传统 BPM 的流程是画完锁死的文档。ProcessOS 的流程是持续发现→重设计→构建→优化的循环。

3. **"四个 Agent 按生命周期分工"这个模式可以直接移植。** SDLC 侧是否也需要 Discovery/Design/Build/Optimization 四个 Agent？

---

## 待验证

- [ ] CamundaCon 2026 有没有更多 ProcessOS 的真实部署数据？
- [ ] "四个 Agent 按生命周期分工"——SDLC 侧是否已经有类似的产品架构？
- [ ] ProcessOS 的 Fitness Functions 和 CI 质量门禁——具体实现上有多相似？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | 从 camunda-processos-deep-dive.md 提取叙事线 |
