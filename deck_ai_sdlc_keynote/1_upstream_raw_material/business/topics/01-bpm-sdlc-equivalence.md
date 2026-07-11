---
title: BPM — 企业侧的 SDLC 等价物
stage: phase_0
topic: "01"
status: draft
created: 2026-07-08
summary: 软件行业用 SDLC 体系化管理"需求→代码"的加工过程。企业侧有一个 40 年学术传承的对应物——BPM（Business Process Management）。两者在 AI 时代经历完全同构的范式转移。
sources:
  - enterprise_bpm/findings/bpm-and-sdlc-equivalence/
  - enterprise_bpm/comprehensive-findings-enterprise-info-flow-and-sdlc.md
---

# BPM — 企业侧的 SDLC 等价物

> 核心判断：SDLC 的变化不是孤例。企业业务处理在经历完全相同的范式转移——只是术语不同。

---

## 加工流的 ITO 模型：两边完全对应

软件开发和企业业务处理，本质上是同一个模式：

```
Input → Transformation → Output
```

| | SDLC（软件） | BPM（企业） |
|------|------|------|
| 加工对象 | 用户需求 → 软件产品 | 业务信息 → 决策/动作/文档 |
| 核心问题 | 怎么把需求一步步变成代码？ | 怎么把业务信息一步步加工成结果？ |
| 方法论演进 | 瀑布 → V → 敏捷 → AI-SDLC | 泰勒 → BPR → BPM → Agentic BPM |
| 关键 artifact | 需求文档、设计文档、代码、测试 | 流程模型、业务规则、工单、审批 |

---

## BPM 有 40 年学术传承

不是凭空造的概念。从 1980 年代 MIT 的 Office Analysis Methodology 到 2026 年 Dagstuhl Seminar 的 Agentic BPM manifesto：

- **1980s**：MIT Office Analysis Methodology——办公室工作不是"处理文档"，是完成业务功能
- **1980s**：Xerox PARC Information Control Net——用 Petri 网建模办公室流程
- **2000s**：BPMN 2.0 成为 ISO 标准，完整的五阶段生命周期（Design → Model → Execute → Monitor → Optimize）
- **2026**：Agentic BPM (APM) manifesto——18 位作者在 Dagstuhl 定义 AI 时代的 BPM

---

## AI 冲击完全同构

| 维度 | SDLC | BPM |
|------|------|------|
| 旧前提 | 人必须先想清楚 | 流程必须被完整预定义 |
| AI 打破的 | 程序不再是人完全想清楚的产物 | 流程不再需要事先画好每一步 |
| 新范式 | AI Sandwich / 操作者→委托人 | Framed Autonomy / Co-work 模式 |
| 人的新角色 | Brief → Review → Sign-off | 定义框 → 关键节点策展 → 熔断确认 |
| 核心 artifact 变了 | Spec 取代代码 | 流程框（frame）取代 BPMN 流程图 |

---

## 信任鸿沟是两边的共同瓶颈

- SDLC 侧：~42% 在用 AI 辅助，只有 11% 让 AI 自主执行
- BPM 侧：~42% 在用 AI 辅助，只有 16% 让 AI 自主执行
- BPM 侧信任度：48.8%（BPM Pulse Survey 2026）

**两边卡在同一个地方**：从"AI 帮我做"到"AI 替我做"的信任跳跃。

---

## 为什么 SDLC 研究需要关注 BPM

1. **不用从零发明框架**——BPM 有 40 年方法论积累可以直接映射
2. **企业侧在某些维度走得更快**——治理框架、人-AI 协作术语、成熟度模型
3. **两边可以互相借力**——BPM 的治理实践 → SDLC 的 CI/CD 管道；SDLC 的 Agent 编排 → BPM 的流程引擎

---

## 待验证

- [ ] "BPM = SDLC 等价物"这个框架，KOL 中是否有人提过？
- [ ] 两边 11% vs 16% 的生产采用率差异——有意义还是噪声？
- [ ] 有没有 SDLC 侧的概念在 BPM 侧找不到对应？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | 从 enterprise_bpm/ 综合发现中提取核心等价论证 |
