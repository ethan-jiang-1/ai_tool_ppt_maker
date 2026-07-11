---
title: Office 变成 Agent 基础设施 — MS/Google/腾讯的三条路线
stage: phase_0
storyline: "02"
status: draft
created: 2026-07-08
summary: 2026 年，Office 不再是一个"办公套件"——它正在变成 Agent 运行的基础设施。Nadella 说："Agent 时代企业配置的第一个资源是 Office。"三巨头在同一个方向上跑了三条不同路线。这是"前端层在 AI 时代怎么变"的最生动证据。
sources:
  - enterprise_bpm/findings/office-and-collaboration-tools/office-becomes-agent-platform.md
  - enterprise_bpm/findings/office-and-collaboration-tools/feishu-dingtalk-not-bpm-but-cwm.md
---

# Office 变成 Agent 基础设施

> 2026 年最被低估的一层变化。Office 从"人用的办公套件"变成"Agent 运行的操作系统"。三巨头在同一个方向上跑了三条路线——这是前端层变革最生动的证据。

---

## 第一幕：Nadella 的重新定义

Satya Nadella（AI Tour Berlin 2026）：

> "在 Agent 时代，企业配置的第一个资源是 Office——因为 Agent 需要在 Teams 频道里跟人协作，需要访问邮箱。"

旧模型：一个 Office 许可证 = 一个员工。
新模型：一个员工 + N 个数字 Agent——每个 Agent 都需要身份、邮箱、日历、文档权限。

**关键洞察**：Office 不再是一个"生产力工具"。它是 Agent 的身份系统 + 通信基础设施 + 数据上下文层。

---

## 第二幕：三条路线

### Microsoft：Office = Agent OS

Charles Lamanna（EVP of Agents & Business Apps）："2026 是我们走出聊天的年份。"

| 能力 | 做什么 |
|------|--------|
| **Copilot Cowork** | 用户描述目标 → Agent 自主跨 Excel/Outlook/Word/PPT 执行 → 用户回来看到成品 |
| **Agent 365** | IT 集中治理面板——每个 Agent 可观测、可管控 |
| **Copilot = 模型无关平台** | 统一 UX + Model Router + Marketplace |
| **MAI 自研模型** | 已在 Excel/Outlook 处理数万次周级 prompt，替代 OpenAI/Anthropic 调用 |

**真正的护城河不是模型——是 4.5 亿商业用户 + Microsoft Graph + Azure 基础设施。**

### Google：Workspace = Agent 的上下文入口

- 实时知识图谱为 Agent 提供上下文
- Skills & Studio（自主模式，vs MS 的委托模式）
- 捆绑进基础计划（~40% 涨价）

### 腾讯：WorkBuddy = 微信生态的 Agent 层

| 指标 | 数据 |
|------|------|
| 月访问 | 885 万 |
| DAU | 竞品 3-4 倍 |
| SkillHub | 7 万+ 技能 |
| 模型 | 混元 + DeepSeek，11 款可选 |
| 定价 | 39 元/月起 |

**腾讯的独特优势**：微信 14 亿用户 + 企微 1400 万企业——Agent 的身份系统天然存在。

---

## 第三幕：飞书/钉钉 —— CLI 化浪潮

跟 MS/Google 不同的路线：不是把 Office 变成 Agent 平台——是把协同办公工具变成 CLI。

### 飞书 CLI（2026 年 7 月开源）

- OpenClaw 25 万星——草根爆发
- CLI 比 MCP 对 Agent 友好 10-32 倍
- 2500+ API 变成 AI 可调用的原子指令

### 钉钉悟空

- GUI→CLI 完整重构
- "悟空"统一调度——不走飞书的多 Agent 路线，走统一 Agent OS 路线

**关键分歧**：飞书是多 Agent 各管各的 → CLI 化；钉钉是统一 Agent OS → 一个大脑调度所有能力。2026 年还不知道谁对。

---

## 与 SDLC 的映射

| BPM 前端 | SDLC 前端 | 共同变化 |
|---------|----------|---------|
| Office/Workspace/WorkBuddy | Claude Code/Cursor/Copilot | 从人用的工具 → Agent 运行的基础设施 |
| MS Graph = Agent 上下文 | 代码库 = Agent 上下文 | 谁拥有数据上下文，谁拥有护城河 |
| Agent 365 = Agent 控制平面 | GitHub Copilot admin panel | Agent 变成一等管理对象 |
| 飞书 CLI = API → 原子指令 | Claude Code terminal = CLI | CLI 对 Agent 比 GUI/MCP 友好一个数量级 |

---

## 这个 storyline 说明了什么

1. **前端层的战争被低估了。** 所有人的注意力在模型能力上——但 Nadella 知道真正的护城河是"Agent 在哪运行"。

2. **SDLC 侧的前端同样在变。** Claude Code 的终端、Cursor 的 IDE、Copilot 的 Office 集成——本质上在争夺同一个东西：Agent 的"家"。

3. **CLI 化是一个独立趋势。** 飞书/钉钉同日开源 CLI 不是巧合。CLI 对 Agent 比 GUI 友好一个数量级——SDLC 侧的 Claude Code/Copilot CLI 验证了同一个方向。

4. **中国厂商的路线值得关注。** 重产品轻方法论——但有真实用户量（飞书/钉钉各几千万 DAU）。

---

## 待验证

- [ ] OpenClaw 25 万星——真实数字？有没有更精确的来源？
- [ ] 飞书 vs 钉钉的两条路线（多 Agent vs 统一 Agent OS）——有没有官方的方法论输出？
- [ ] SDLC 侧前端（IDE/Terminal）的"Agent 基础设施化"——跟 Office 的路线是否同构？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | 从 office-becomes-agent-platform.md + CLI 化文件提取叙事线 |
