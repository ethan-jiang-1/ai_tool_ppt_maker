---
title: Part 2 — The Business Mirror
part: 2
slides: S2.1–S2.5
version: v1
status: draft
sources:
  - research/business/topics/
  - research/business/storylines/
  - _business_bpm/
pending:
  - S2.5 中国传统行业 AI 落地案例
---

# PART 2: THE BUSINESS MIRROR — 同样的事正在传统企业发生

---

## Block D: BPM = SDLC 的孪生兄弟

---

### S2.1: 你们公司也在加工信息——这有一个 40 年的方法论

**KICKER**: 软件有 SDLC。你们公司有 BPM。

**CLAIM**: 企业业务处理（BPM）和软件开发（SDLC）是完全同构的信息加工链。两者在 AI 时代经历完全相同的范式转移。这不是类比——这是学术和工业界双重验证的结论。

**BODY**:

软件开发把需求一步步加工成代码。你们公司把业务信息一步步加工成决策、文档、工单。

这两件事的结构一模一样：

| | SDLC（软件） | BPM（企业） |
|------|------|------|
| 加工对象 | 用户需求 → 软件产品 | 业务信息 → 决策/动作 |
| 方法论演进 | 瀑布 → V → 敏捷 → AI-SDLC | 泰勒 → BPR → BPM → Agentic BPM |
| 关键 artifact | 需求文档、代码、测试 | 流程模型、工单、审批 |
| AI 冲击 | 人不再"先想清楚" | 流程不再"被完整预定义" |

BPM 不是新概念——从 1980 年代 MIT 的 Office Analysis Methodology 到 2026 年 Dagstuhl Seminar 的 Agentic BPM Manifesto，40 年学术传承。

2026 年 2 月，Dagstuhl——欧洲最著名的计算机科学 seminar 所在地。18 位作者联合发表了 Agentic BPM Manifesto。核心概念叫 **Framed Autonomy**。

**TRANSITION**: 这个名字值得记住。因为它描述的，恰好也是 AI-SDLC 正在变成的样子。

---

### S2.2: Framed Autonomy — 人定边界，AI 在框内自主

**KICKER**: "有框的自主"——这就是 AI 时代企业和软件共同的答案。

**CLAIM**: Framed Autonomy 是 BPM 侧对 AI 时代范式的精确命名。它跟 SDLC 侧的 AI Sandwich、Harness Engineering 完全同构。人定义边界和验收标准，Agent 在边界内自主执行。

**BODY**:

Dagstuhl Seminar 18 位作者的正式定义：

> "确保流程感知和目标对齐的主要机制——通过对 Agent 的知识和目标施加限制来约束其自主性。"

两种 Frame：

| Frame 类型 | 方式 | SDLC 等价 |
|-----------|------|----------|
| **Operational Frame** | 命令式——规定执行序列 | CI 管道（lint → test → build） |
| **Normative Frame** | 声明式——规定允许/禁止 | 编码规范、安全策略 |

**已在真实世界验证**：德国能源网公司 meter-to-cash 流程——Frame Agent 生成约束 + Operational Agent 自主执行。预定义规则下 **99% 成功执行率**。

**跟 SDLC 侧的映射**：

| BPM 侧 | SDLC 侧 |
|---------|---------|
| Framed Autonomy | AI Sandwich |
| Co-work 模式 | 操作者→委托人 |
| 人定义 Frame | 人定义 harness |
| Agent 在框内自主 | Agent 在护栏内自主 |

**同一件事。不同的术语。**

**TRANSITION**: 这个概念不只存在于学术论文里。整个行业的架构都在围绕它重组。

---

### S2.3: 企业也在四层重构——每一层都在变

**KICKER**: 你公司的 IT 架构有四层。每一层都在重写。

**CLAIM**: 企业业务处理的四层架构——前端、中端、后端、治理——跟 SDLC 完全对应，每一层都在经历同样的范式转移。

**BODY**:

```
┌─────────────────────────────────────────────────────────────┐
│  前端（Agent 的"家"）                                        │
│  Office / Workspace / 飞书 / 钉钉                            │
│  ↕ SDLC：Claude Code / Cursor / Copilot                      │
├─────────────────────────────────────────────────────────────┤
│  中端（编排）                                                 │
│  Agentic Orchestration / ProcessOS                           │
│  ↕ SDLC：Agent SDK / Routines / Triggers                     │
├─────────────────────────────────────────────────────────────┤
│  后端（记录系统）                                             │
│  CRM / ERP / HCM                                             │
│  ↕ SDLC：Git / Issue Tracker / Code Review                   │
├─────────────────────────────────────────────────────────────┤
│  治理层（横切）                                               │
│  Agent 365 / AI Control Tower                                │
│  ↕ SDLC：CI/CD Pipeline + Code Owners + Protected Branches   │
└─────────────────────────────────────────────────────────────┘
```

**前端最被低估**。Nadella 在 2026 AI Tour Berlin："在 Agent 时代，企业配置的第一个资源是 Office——因为 Agent 需要跟人协作。"

飞书和钉钉 2026 年 7 月同日开源 CLI——2500+ API 变 AI 可直接调用的原子指令。Office 工具正在变成 Agent 的操作系统。

**中端在重写**。Camunda ProcessOS——BPM 老牌厂商——发布 4 个 AI Agent（发现→重设计→构建→优化）。CEO 说："Every process in your enterprise is legacy."

**TRANSITION**: 有没有真实企业在这么做？有。

---

## Block E: 案例

---

### S2.4: 海外——已经有企业在做了

**KICKER**: GE 的工厂、Wells Fargo 的银行、Petrobras 的油田、波士顿儿童医院——不是科技公司，都在用 AI Agent。

**CLAIM**: 2026 年，四个完全不同行业的传统企业已经把 Agentic BPM 部署到了生产环境。模式完全一致：Framed Autonomy——人定边界，Agent 在框内执行。

**BODY**:

| 组织 | 行业 | 规模 | 效果 |
|------|------|------|------|
| **GE Appliances** | 制造 | 800+ agents | 延迟订单 ↓25%，零件管理 2700 万件/年 |
| **Wells Fargo** | 金融 | 35,000 银行家, 1,700 流程 | supervisor-worker agent 编排 |
| **Petrobras** | 能源 | AA 早期采用者 | 三周节省 $120M |
| **波士顿儿童医院** | 医疗 | AA 早期采用者 | 行政负担 ↓80% |

共同模式：不是全员替代——是特定流程交给 Agent，人做策展和例外处理。最成功的都遵循 Framed Autonomy。**~42% 在用 AI 辅助，只有 11-16% 让 AI 自主执行——信任鸿沟跟 SDLC 侧一模一样。**

**TRANSITION**: 这些是海外案例。中国这边呢？

---

### S2.5: 中国——传统行业也在动

**KICKER**: 奇瑞 4000 个智能体。兆企合同审批从 1 天变 20 分钟。司盟效率 5 倍。

**CLAIM**: 中国传统企业——不只是科技公司——已经在部署生产级 AI Agent。制造业和贸易领域的案例尤其突出，模式跟海外完全一致。

**BODY**:

| 企业 | 行业 | 规模 | 效果 |
|------|------|------|------|
| **奇瑞汽车** | 制造 | 6 万员工, 4000+ 智能体 | 年降本超 3000 万，翻译成本归零 |
| **兆企供应链** | 贸易/供应链 | WorkMate Agent | 报价/合同/客户画像全流程，合同审批 1天→20分钟 |
| **司盟企服** | 企业服务 | Agent 接管海外邮件/审计/合同 | 效率提升 5 倍+ |

共同模式：跟海外一样——不是"AI 替代人"，是特定流程交给 Agent，人做策展和例外处理。

**TRANSITION**: 两个领域都看完了。退一步看大局。
