---
title: 企业业务处理的四层架构
stage: phase_0
topic: "03"
status: draft
created: 2026-07-08
summary: 7 轮探索收敛的企业业务处理全景：前端（Agent 的基础设施）、中端（编排）、后端（记录系统）、治理层（横切）。每一层都在经历同样的范式转移，每一层都有 SDLC 等价映射。
sources:
  - enterprise_bpm/findings/bpm-and-sdlc-equivalence/four-layer-architecture.md
  - enterprise_bpm/comprehensive-findings-enterprise-info-flow-and-sdlc.md
---

# 企业业务处理的四层架构

> 核心判断：企业业务处理不是一团乱麻。收敛到四层后，每一层都有清晰的 SDLC 映射，每一层都在经历同样的范式转移。

---

## 四层全景

```
┌─────────────────────────────────────────────────────────────┐
│  前端（Agent 的"家"）                                        │
│  Office / Workspace / WorkBuddy / 飞书 / 钉钉                │
│  身份、邮箱、日历、文档、协作频道——Agent 运行的基础设施         │
│  ↕ SDLC 等价：Claude Code / Cursor / Copilot                 │
├─────────────────────────────────────────────────────────────┤
│  中端（工作流怎么编排）                                       │
│  Agentic Orchestration / APO / Agentic BPM / ProcessOS       │
│  确定性骨架 + Agentic 自主 = Framed Autonomy                  │
│  ↕ SDLC 等价：Agent SDK / Routines / Triggers                │
├─────────────────────────────────────────────────────────────┤
│  后端（记录系统）                                             │
│  CRM / ERP / HCM / 传统 BPM                                  │
│  业务数据、合规流程、审计追踪                                   │
│  ↕ SDLC 等价：Git / Issue Tracker / Code Review              │
├─────────────────────────────────────────────────────────────┤
│  治理层（横切所有层）                                         │
│  Agent 365 / AI Control Tower / Rubrik Agent Cloud           │
│  身份、权限、审计、熔断、回滚                                   │
│  ↕ SDLC 等价：CI/CD Pipeline + Code Owners + Protected Branches│
└─────────────────────────────────────────────────────────────┘
```

---

## 前端：从"人用的工具"到"Agent 的基础设施"

2026 年最被低估的一层。Satya Nadella：

> "在 Agent 时代，企业配置的第一个资源是 Office——因为 Agent 需要跟人协作。"

| 厂商 | 路线 | 关键动作 |
|------|------|---------|
| **Microsoft** | Office = Agent OS | Copilot Cowork（委托模式），Agent 365（控制平面），每个 Agent 需要独立 Office 身份 |
| **Google** | Workspace Intelligence | 实时知识图谱为 Agent 提供上下文，捆绑定价 |
| **腾讯** | WorkBuddy | 月访问 885 万，SkillHub 7 万+ 技能 |
| **飞书/钉钉** | CLI 化 | 同日开源 CLI，2500+ API → AI 可调用的原子指令 |

---

## 中端：从"预定义流程引擎"到"Framed Autonomy"

- **Camunda ProcessOS**：4 个 AI agents（发现→重设计→构建→优化），BPMN = 治理可视化层
- **ServiceNow Blueprint**：Sense → Decide → Act → Secure 四层框架
- **UiPath/AA 转型**：确定性骨架 + Agentic 自主 + 编排层 + 治理

---

## 后端：记录系统仍在，但接入方式变了

CRM/ERP/HCM 不会消失——但不再是人直接操作的界面，而是 Agent 调用的数据源和约束源。

SAP 200+ agents 全流程编排。Salesforce $8B 收购 Informatica。

---

## 治理层：2026 年最激烈的争夺点

谁控制 Agent 的身份、权限、审计——谁就控制企业 AI 的采用方式。

| 治理维度 | BPM 侧 | SDLC 侧 | 谁更成熟 |
|---------|--------|---------|---------|
| 审计追踪 | 七个必需元素标准在形成 | git history 是不可篡改的理想基底 | SDLC |
| Agent 身份 | Agent-as-User / Identity Propagation / IBAC 三条路径 | — | BPM |
| 熔断/杀开关 | 六种中断原语，成标配 | CI 管道有类似机制 | 持平 |
| 委托链衰减 | 有明确模型 | 缺失等价物 | BPM |
| Meta-frame | 空白 | 空白 | 都是空白 |

---

## 与 SDLC 的映射总结

| 层 | BPM | SDLC | AI 时代的共同变化 |
|------|------|------|------|
| 前端 | Office/Workspace | IDE/Terminal | 从人用→Agent 用 |
| 中端 | Agentic Orchestration | Agent SDK/Routines | 从预定义→Framed Autonomy |
| 后端 | CRM/ERP/HCM | Git/Issue Tracker | 从人直接操作→Agent 调用 |
| 治理 | Agent 365/Control Tower | CI/CD/Policies | 从静态规则→动态意图评估 |

---

## 待验证

- [ ] 四层架构是否足够完整？有没有遗漏的层？
- [ ] SDLC 侧前端层（IDE/Terminal）的"Agent 基础设施化"是否跟 BPM 侧同样显著？
- [ ] 治理层的"谁更成熟"判断是否准确？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | 从 enterprise_bpm/ 四层架构 + 治理深挖中提取 |
