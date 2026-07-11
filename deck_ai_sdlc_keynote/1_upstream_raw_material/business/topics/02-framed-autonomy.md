---
title: Framed Autonomy — AI 时代 BPM 的核心范式
stage: phase_0
topic: "02"
status: draft
created: 2026-07-08
summary: 8 轮探索找到的最精确术语。人定义边界（frame），Agent 在边界内自主执行。与 SDLC 的"AI Sandwich"完全同构——两边在说同一件事。
sources:
  - enterprise_bpm/findings/agentic-orchestration/framed-autonomy-in-practice.md
  - enterprise_bpm/papers/apm-manifesto/
---

# Framed Autonomy — AI 时代的核心范式

> 核心判断：从"预定义流程"到"Framed Autonomy"——这不是 BPM 的渐进改进，是范式转移。跟 SDLC 从"人先想清楚"到"AI Sandwich"完全同构。

---

## 正式定义

Calvanese 等 18 位作者（Dagstuhl Seminar, 2026）：

> "确保 APM 系统中流程感知和目标对齐的主要机制，通过对 Agent 的知识和目标施加限制来约束其自主性。"

---

## 两种 Frame 类型

| Frame 类型 | 方式 | 做什么 | SDLC 等价 |
|-----------|------|--------|----------|
| **Operational Frame** | 命令式，工作流引擎强制执行 | 规定具体执行序列 | CI 管道（lint → stage → merge） |
| **Normative Frame** | 声明式，LLM Agent 在其范围内推理 | 规定允许/禁止的行为 | 编码规范、安全策略、合规约束 |

**Process FRAME** = 所有 LLM 调用的聚合策略集 = Hard constraints + Soft constraints + Role assignments + Segregation of duties + Lifecycle rules + Meta-frame

---

## 与 SDLC 的同构

| BPM 侧 | SDLC 侧 |
|---------|---------|
| Framed Autonomy | AI Sandwich（人在两端，AI 在中间） |
| Co-work 模式（致远三级模型第二级） | 操作者→委托人（Mollick/Willison） |
| Autonomous Agent 模式（致远第三级） | Agentic Engineering（Karpathy） |
| 人定义 Frame → Agent 自主执行 → 人策展 | Brief → AI 执行 → Review/Sign-off |

---

## 已经在真实世界验证

**德国能源网公司 meter-to-cash 流程**（Skolik & Müller, 2026）：

- Frame Agent 从 BPMN 生成流程约束
- Operational Agent 在约束内自主执行
- 预定义规则下 **99% 成功执行率**

---

## 三股力量在说同一件事

| 出身 | 术语 | 核心主张 |
|------|------|------|
| 厂商/实践者（Camunda, UiPath） | Agentic Orchestration | 多 Agent 协调、目标分解、共享记忆 |
| 学术界（Dagstuhl 18 位作者） | Agentic BPM (A-BPMS) | BPM 自然进化——5 级自主连续体 |
| 分析师（Forrester, 2025） | Adaptive Process Orchestration (APO) | 确定性骨架 + 非确定性 Agent 行为共存 |

**术语收敛论**：不同出身，同一个结论——确定性骨架提供治理，AI Agent 提供适应性。

---

## 成熟度模型（致远三级 → xpander.ai 三级）

| 级别 | 模式 | 人的角色 | SDLC 对应 |
|------|------|---------|----------|
| **Co-pilot** | AI 辅助人 | 人仍是主要行动者 | Copilot 补全代码 |
| **Co-work** | AI agent 在人的流程内执行 | 人定义框、策展关键节点 | AI Sandwich |
| **Autonomous Agent** | 多 Agent 独立分解目标、端到端执行 | 人只是监督者 | Agentic Engineering |

**2026 年主流在 Co-work 模式。**

---

## 待验证

- [ ] "Framed Autonomy"能否成为 AI-SDLC 的核心概念？有没有更好的中文译法？
- [ ] Operational/Normative Frame 的区分在 SDLC 侧是否同样清晰？
- [ ] Meta-frame（管理 frame 的 frame）——两边目前都是空白，是否值得提出？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | 从 APM manifesto + 四篇实现论文中提取核心范式 |
