---
title: Phase 0 — 素材抽取与合成
stage: phase_0
position: pre_phase
type: guide
summary: 两个领域（软件 SDLC + 企业 BPM）的关键信号抽取，按 topics + storylines 组织。两条线独立抽取，但共享同一个范式转移。
depends_on: []
feeds_into:
  - v1/outline/outline.md
agent_action: guide
---

# Phase 0: 素材抽取与合成

> 本阶段目标：从两个领域的关键源材料中提取信号，按主题（topics）和叙事线（storylines）组织，让 Phase 1 叙事设计有据可依。

---

## 两个领域，两条信息线

```
research/
│
├── software/                  ← SDLC（软件开发）
│   │  来源：fable5_field_signals/ + aidlc_reference_kol/
│   │
│   ├── topics/                ← 5 个主题（概念/判断/框架）
│   │   ├── 01-traditional-sdlc-premise.md
│   │   ├── 02-ai-evolution-three-stages.md
│   │   ├── 03-speed-communication-bottleneck.md
│   │   ├── 04-agent-new-program-type.md
│   │   └── 05-ai-human-amplifier-scope.md
│   │
│   ├── storylines/            ← 3 条叙事线（事件/人物/时间线）
│   │   ├── 01-deer-valley-to-engelberg.md
│   │   ├── 02-pragmatic-summit.md
│   │   └── 03-fable5.md
│   │
│   └── initial-ideas.md       ← 初始想法草稿
│
├── business/                  ← BPM（企业信息加工流）
│   │  来源：enterprise_bpm/
│   │
│   ├── topics/                ← 4 个主题
│   │   ├── 01-bpm-sdlc-equivalence.md
│   │   ├── 02-framed-autonomy.md
│   │   ├── 03-four-layer-architecture.md
│   │   └── 04-competitive-landscape.md
│   │
│   └── storylines/            ← 2 条叙事线
│       ├── 01-camunda-processos-transformation.md
│       └── 02-office-becomes-agent-infrastructure.md
│
└── README.md                  ← 你在这里
```

**一眼看明白**：`software/` = SDLC，`business/` = BPM。同类文件同一结构（topics + storylines）。

---

## 来源

| 目录 | 源材料 | 内容 |
|------|--------|------|
| `software/` | `../fable5_field_signals/` | 16 位一线开发者使用 Fable 5 的真实信号（Willison, Mollick, Krieger, Klaassen, Vincent 等） |
| `software/` | `../aidlc_reference_kol/` | 14 位 KOL 深度拆解 + Deer Valley/Engelberg/Pragmatic Summit + 跨公司变革共识 + Fable 5 信号合成 |
| `business/` | `../../_business_bpm/` | 7 轮探索 + 14 个 findings 文件：BPM = SDLC 等价物、Framed Autonomy、四层架构、竞争格局 |

### software/ 源目录速查

| 想看什么 | 路径 |
|---------|------|
| 具体的人怎么说 | `../aidlc_reference_kol/_raw_kol/` |
| 四家公司达成了什么共识 | `../aidlc_reference_kol/_raw_frontier/` |
| Fable 5 具体改变了什么 | `../aidlc_reference_kol/_raw_fable5/` |
| Agile 社区怎么回应 AI | `../aidlc_reference_kol/_raw_agile_manifesto_2026/` |
| 工业界的大会声音 | `../aidlc_reference_kol/_raw_promatic_summit_2026/` |
| 从实验到生产的转折 | `../aidlc_reference_kol/_raw_engelberg_2026/` |
| 一线开发者真实使用 Fable 5 的信号 | `../fable5_field_signals/` |
| 厂商方法论框架 | `../aidlc_reference_corp/_raw_aws/` |

### business/ 源目录速查

| 想看什么 | 路径 |
|---------|------|
| BPM 与 SDLC 的等价论证 | `../../_business_bpm/findings/bpm-and-sdlc-equivalence/` |
| Framed Autonomy 从理论到实现 | `../../_business_bpm/findings/agentic-orchestration/` |
| Office 变成 Agent 平台 | `../../_business_bpm/findings/office-and-collaboration-tools/` |
| 竞争格局与分类 | `../../_business_bpm/findings/terminology-and-taxonomy/` |
| 探索全过程轨迹 | `../../_business_bpm/exploration-trajectory.md` |

---

## 两条线为什么越来越像：共享工具驱动收敛

software 和 business 两条线各自独立研究，但发现它们越来越指向同一件事。一个关键机制是：**两边现在用的是同一套 AI 工具。**

### 同一批工具，两种模式

Claude Code、Codex Desktop 这些强悍的 Agent 工具天然具备两种工作模式：

- **Coding 模式**：读代码库、写代码、跑测试、提交 PR —— 面向软件工程
- **Desktop/Office 模式**：读文档、写邮件、操作表格、走审批流 —— 面向企业办公

同一个工具，同一个人，上午写代码，下午处理工单。界面是一样的——都是跟 Agent 对话、委托任务、验收结果。

### 这意味着什么

| | 以前的区别 | 现在的趋同 |
|------|------|------|
| 工具 | 开发者用 IDE，办公用 Office | 都用同一个 Agent 界面 |
| 工作方式 | 写代码 vs 填表 | 都是 Brief → Agent 执行 → Review |
| 核心 artifact | 代码 vs 文档 | 都是 Spec/Frame → Agent 产出 → 人验收 |
| 人的角色 | 程序员 vs 文员 | 都是委托人/策展人 |
| 方法论 | SDLC vs BPM | 都是 Framed Autonomy |

### 关键信号

- **OpenAI Harness Engineering**：3 个人 + Codex，5 个月，100 万行代码，零人手写零人审。人只写 spec 和设计 harness。
- **Claude Code**：Krieger "wish Claude good night, wake up to find it's done" —— 白天定义任务，夜里 Agent 推进，早上人验收。
- **Vibe Kanban**：同一块看板上同时跑 Claude Code 和 Codex Desktop——coding 任务和 office 任务在同一个编排层里流转。
- **飞书/钉钉 CLI 化**：2500+ API 变 AI 可调用的原子指令——office 工具变成了 Agent 的 CLI，跟 Claude Code 的 terminal 没有本质区别。

**结论**：软件研发和业务处理正在被同一套 Agent 工具吸进同一个工作模式。SDLC 和 BPM 不只是"可以互相借鉴"——它们正在同一个基础设施上**融合**。

---

## 产出

Phase 0 完成后的 `source-synthesis.md`——按以下维度组织的信号图谱：

1. **共识区** — 哪些判断所有人/大多数人都同意？
2. **分歧区** — 哪些问题上存在根本分歧？
3. **已死/正在死的流程** — 哪些 SDLC/BPM 实践被宣布不再适用？
4. **新涌现的概念** — 哪些新术语/新框架在形成？（Harness Engineering、Framed Autonomy、Supervisory Engineering、Middle Loop...）
5. **关键引用** — 最有冲击力的原话（可进入 slides 作为 pull quote）
6. **数据点** — 可引用的量化证据

## 工作方式

- Agent 读取各源目录的 README（已有完整的索引和共识/分歧矩阵）
- 提取跨源重复出现的主题
- 标注每条信号的证据强度（单个 KOL 断言 vs 多人独立验证 vs 有数据支撑）
- 用户审核：哪条信号放错了？哪条漏了？

## ⛔ 闸门

Phase 0 完成标准：
- [ ] software/ 和 business/ 两个领域的 topics + storylines 均已完成
- [ ] 每条信号标注了来源文件路径
- [ ] 用户确认：核心信号的抽取准确、无重大遗漏
- [ ] 跨领域同构关系已验证（Framed Autonomy = AI Sandwich，四层架构映射完整）
