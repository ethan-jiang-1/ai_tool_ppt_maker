---
title: 竞争格局 — 三股力量 × 四类厂商 × 三级成熟度
stage: phase_0
topic: "04"
status: draft
created: 2026-07-08
summary: 企业 AI 编排市场的竞争全景：大厂（旧架构挂 AI）、模型公司（争夺控制平面）、AI-native 创业（从零重建）。三个分类框架交叉验证同一个结论。
sources:
  - enterprise_bpm/findings/agentic-orchestration/ai-native-startups-vs-legacy-vendors.md
  - enterprise_bpm/findings/terminology-and-taxonomy/what-is-this-called.md
---

# 竞争格局：三股力量 × 四类厂商 × 三级成熟度

> 核心判断：企业 AI 编排不是一家通吃。三股力量在不同层竞争，三个分类框架从不同角度描述同一格局。

---

## 三股力量

| 力量 | 代表 | 路线 | 优势 | 弱点 |
|------|------|------|------|------|
| **大厂** | MS/Salesforce/ServiceNow/SAP | 旧架构上挂 AI | 生态锁定 + 拥有数据 | 20 年老数据模型 |
| **模型公司** | OpenAI/Anthropic | 争夺 Agent 控制平面 | 最懂 AI 能力边界 | 不直接做 BPM |
| **AI-Native 创业** | Camunda ProcessOS, Neo, Reevo, xpander.ai | 从零重建 | AI-first 数据模型 | 体量小 |

---

## 四类厂商（Arion Research, 2026）

| 类型 | 代表 | 拥有什么 | SDLC 对应 |
|------|------|------|------|
| **Vertical Integrators** | Oracle, Salesforce, SAP | 拥有数据 | 传统 SDLC 工具厂商 |
| **Horizontal Platforms** | OpenAI, Anthropic | 拥有智能 | AI 模型/Agent 框架厂商 |
| **Infrastructure/Ecosystem** | Microsoft, Google | 横跨所有层 | GitHub/GitLab |
| **Independent/Specialized** | Camunda, xpander.ai | 编排优先，厂商中立 | 独立 AI 编程工具 |

---

## 三级成熟度（xpander.ai）

| 级别 | 代表 | 问题 | SDLC 对应 |
|------|------|------|------|
| **Retrofitted Automation** | Zapier, n8n, Make | Agent 继承 trigger-action 约束 | CI/CD 管道嵌入 AI 步骤 |
| **Build-Only Frameworks** | LangChain, CrewAI | 只管构建，不管部署/监控/治理 | AI 编码助手（只管生成） |
| **Agentic-Native Platforms** | xpander.ai | 从零为 agent 执行而建 | AI-SDLC（全生命周期，治理内置） |

---

## 三个分类框架的共识

不管从哪个角度切——三股力量、四类厂商、三级成熟度——都收敛到同一个判断：

> **确定性骨架 + Agentic 自主 = 新范式。** 大厂提供骨架（但骨架是旧的），模型公司提供智能（但缺骨架），创业公司从零建造新骨架。

UiPath 的 Boris Krumrey：

> "混合模式——确定性骨架 + 有边界的 agentic 任务——将主导。"

---

## 对 SDLC 的启示

同样的三股力量在 SDLC 侧也在竞争：

| BPM 侧 | SDLC 侧 |
|---------|---------|
| MS/Salesforce/ServiceNow 旧架构挂 AI | GitHub/GitLab/Jira 旧工具加 AI |
| OpenAI/Anthropic 争夺控制平面 | Claude Code/Copilot/Cursor 争夺 Agent 入口 |
| Camunda/xpander.ai 从零重建 | 新一代 AI-native SDLC 工具的窗口 |

---

## 待验证

- [ ] SDLC 侧是否也有类似的四类厂商分类？谁在哪个位置？
- [ ] 三级成熟度模型能否直接移植到 SDLC 工具评估？
- [ ] 中国厂商（飞书/钉钉/企微）在哪个分类里？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | 从 enterprise_bpm/ Round 4 分类成果 + 厂商对比中提取 |
