---
title: Outline v1 — AI 时代的信息加工变革
version: v1
status: draft
total_slides: 22
created: 2026-07-08
source: 1_upstream_raw_material/ (software/ + business/)
---

# Outline v1: AI 时代的信息加工变革

---

## 1. Core Metaphor（核心隐喻）

### 信息加工链 — The ITO Chain

> 一切白领工作，本质上都是同一条信息加工链：**Input → Transformation → Output**。需求进去，代码出来。邮件进去，决策出来。以前这条链上每个工位都是人。现在 AI 站到了流水线中间——它加工得比人快。你要么往上游走（决定加工什么），要么往下游走（验收加工结果）。

**为什么这个隐喻一脉相承**：

| 演讲阶段 | 隐喻怎么展开 |
|---------|-------------|
| Part 0 开场 | "你公司里每个人都在一条信息加工链上。程序员在，你也在。" |
| Part 1 软件 | 软件的加工链叫 SDLC——需求→分析→设计→编码→测试→产品。AI 站到了编码和测试的工位上。人被迫往上游（架构、产品）或下游（Harness、验收）迁移 |
| Part 2 企业 | 企业的加工链叫 BPM——业务信息→汇总→分析→审批→决策。跟 SDLC 同一条链。40 年了。AI 正在站到同样的工位上 |
| Part 3 组织 | 以前这条链上每个工位之间需要"信息搬运工"——manager。AI 把搬运成本归零了。金字塔没有存在的理由了 |
| S3.4 结尾 | "你的行业也在这条链上。外面都变了。你在链上往哪走？" |

**不是什么**：不是工厂流水线——是**知识加工链**。每个环节需要判断、不是拧螺丝。但结构是一样的：输入→加工→输出。一个环节的 output 是下一个环节的 input。

---

## 2. Core Formula（核心公式）

```
人定义边界 × AI 自主执行 × 共享 Agent 基础设施 = 组织结构的不可逆重构
```

展开：

| 变量 | 含义 | 证据 |
|------|------|------|
| **人定义边界** | Framed Autonomy：人设定 frame，AI 在框内自主 | Deer Valley → Engelberg, Dagstuhl APM Manifesto |
| **AI 自主执行** | Fable 5 级别的自主性：从"操作工具"到"委托任务" | Mollick "I commission", Krieger "wake up to find it done" |
| **共享基础设施** | Claude Code/Codex 同时用于 coding + office | 飞书 CLI 化, Nadella "Agent 需要 Office" |
| **= 组织重构** | 中层消失、角色重写、金字塔变平 | Block 重定义三角色, Cloudflare 重定义三种人, Three-Tier Split |

**可证伪性**：如果 12 个月后，软件公司恢复了中层管理岗位，传统企业的组织架构没有显著变化——这个公式就不成立。

---

## 3. Narrative Arc（叙事弧线）

```
观众现状                    认知颠覆                    新框架                      行动号召
   │                          │                          │                          │
   ▼                          ▼                          ▼                          ▼
"AI 是程序员的事"    →   "SDLC 的整个前提    →   "Framed Autonomy    →   "你的行业也在加工
                         被 AI 挖掉了——       = AI Sandwich       信息。外面都变了。
                         不只是工具更好了，   = 人定边界+AI执行    你打算怎么变？"
                         是人的角色变了"      = 同样的模式正在
                                              你的行业重演"
```

**弧线节奏**：

| 阶段 | Block | 观众状态 |
|------|-------|---------|
| 设景 | Part 0 (S0.1-S0.4) | "好吧，AI 确实厉害，但跟我的行业有什么关系？" |
| 冲突 | Part 1 (S1.1-S1.9) | "软件开发居然被掀翻到这种程度……角色、方法、组织全变了" |
| 转折 | Part 2 (S2.1-S2.5) | "等等，BPM 跟 SDLC 一模一样？同样的事正在发生？" |
| 升华 | Part 3 (S3.1-S3.4) | "组织层级是罗马时代的遗产。沟通成本归零后，金字塔没有存在的理由" |
| 行动 | S3.4 | "外面都变了。你打算怎么变？" |

---

## 4. Block 结构

### Part 0: Opening — 为什么要讲这个 (4 slides)

**叙事目的**：建立 credibility，回答"为什么是软件先被颠覆"，铺垫"共享工具"这个关键机制。

- **S0.1** 开场：我在 AI 行业待了很久，最近 3 年变化太大
- **S0.2** 为什么 AI 先颠覆了软件开发：逻辑性强、反馈明确 → AI 学得快 → 吸引资本 → 模型越训越强
- **S0.3** 同一批工具，两种模式：Claude Code、Codex Desktop 都有 coding + office 模式
- **S0.4** 今天只讲软件这头。但你会发现跟你的行业一模一样

### Part 1: The Software Frontline — 高科技软件业经历了什么 (9 slides)

**叙事目的**：用三条 storyline + 两个案例，展示 SDLC 被掀翻的全过程——方法论→角色→组织。

**Block A: SDLC 被掀翻了 (4 slides)**
- **S1.1** 瀑布→V→敏捷：每次都是参数调整，这次前提被挖了
- **S1.2** [Storyline 1] Deer Valley → Engelberg：5 个月从犹豫到确信
- **S1.3** [Storyline 2] Beck+Fowler 同台：AI 量级 > 之前所有变革总和
- **S1.4** [Storyline 3] Fable 5 来了：瓶颈从机器变成了人

**Block B: 人的角色被重写 (3 slides)**
- **S1.5** 软件开发本质是信息加工——现在加工的不是人了
- **S1.6** 反馈周期炸了——人的信息吞吐是瓶颈
- **S1.7** Human-in-the-loop → human-on-the-loop：新工种出现

**Block C: 组织的连锁反应 (2 slides)**
- **S1.8** 中层危机：Three-Tier Developer Split
- **S1.9** Block vs Cloudflare：两种重新定义"人"的方式——激进(IC/DRI/Player-Coach) vs 精准(Builder/Seller/Measurer)

### Part 2: The Business Mirror — 同样的事正在传统企业发生 (5 slides)

**叙事目的**：建立 SDLC↔BPM 的同构映射，证明软件行业不是特例。

**Block D: BPM = SDLC 的孪生兄弟 (3 slides)**
- **S2.1** 你们公司也在加工信息——这有一个 40 年的方法论叫 BPM
- **S2.2** Framed Autonomy：人定边界，AI 在框内自主（= AI Sandwich）
- **S2.3** 企业也在四层重构——每一层都在变

**Block E: 案例 (2 slides)**
- **S2.4** 海外四家：GE 制造、Wells Fargo 金融、Petrobras 能源、波士顿儿童医院
- **S2.5** 中国三家：奇瑞制造、兆企贸易、司盟企业服务

### Part 3: The Big Picture — Productivity × Communication × Organization (4 slides)

**叙事目的**：拔高到组织理论层面，给出"罗马军团解散"的核心论点，收在开放问题上。

**Block F: 罗马军团散了 (2 slides)**
- **S3.1** 以前：人是信息流动的节点 → 必须加层级（罗马军团结构，2000 年没变过）
- **S3.2** 中层如果只做上传下达——没用了。Cloudflare 的 Builder/Seller/Measurer 框架

**Block G: 没有结论，只有一个问题 (2 slides)**
- **S3.3** 软件和业务正在同一套 Agent 基础设施上融合——不是"互相借鉴"，是收敛
- **S3.4** 外面都变了。你打算怎么变？

---

## 5. Slide Map（完整清单）

| # | Slide | VISUAL TYPE | KICKER | CLAIM |
|----|-------|-------------|--------|-------|
| 0.1 | 开场 | Title | 我在 AI 这行待了很久。最近三年，最厉害。 | AI 正在从"帮人写代码"变成"帮人做一切信息加工的事" |
| 0.2 | 为什么先颠覆软件 | Concept Split | 软件开发是复杂的知识工作。但恰好——它很有逻辑。 | 软件的逻辑性和海量数据让它成为 AI 第一个"学透"的领域，资本涌入 → 模型越训越强 → 开始溢出 |
| 0.3 | 同一批工具，两种模式 | Evidence | Claude Code。Codex Desktop。上午写代码，下午写报告。 | 开发者和白领第一次共用同一套 Agent 基础设施——软件行业是先行样本 |
| 0.4 | 今天讲什么 | Section Divider | 我是一个搞软件的。但如果你不是——别走。 | 三步：软件发生了什么 → 传统企业同样的事 → 大局：生产力×沟通×组织 |
| 1.1 | SDLC 被掀翻 | Framework | 瀑布、V 模型、敏捷——你以为它们很不一样。 | 传统 SDLC 全部方法论都建立在"人必须先想清楚"这个前提上。AI 挖了前提 |
| 1.2 | Deer Valley → Engelberg | Evidence | 2026.2，"可能有点东西"。2026.7，"证据在握"。 | 5 个月内，世界上最牛的软件工程大脑从犹豫变成了在生产环境里做 |
| 1.3 | Beck+Fowler 同台 | Evidence | Agile 两个合著者，25 年来第一次联合公开对话 AI。 | AI 量级 > 之前所有变革总和。TDD 不可协商。中层最危险。 |
| 1.4 | Fable 5 来了 | Evidence | "The first model I hand off whole projects to." | 瓶颈从机器变成了人。关系从操作者→工具变成了委托人→执行者 |
| 1.5 | 信息加工链 | Concept Split | 软件开发就是把需求一步步加工成代码。以前每个环节都是人。 | AI 接管中间加工环节后，人只有两个方向：往上游（做什么）或往下游（验收治理） |
| 1.6 | 反馈周期炸了 | Concept Split | 以前一个 PR 等几小时。现在 AI 几分钟写几千行——人还是那个速度在 review。 | 核心瓶颈不是"写不够快"，是"审不过来" |
| 1.7 | On the loop | Framework | 以前"AI 写一行，人看一眼"。现在"AI 写一天，人看一眼结果"。 | Kief Morris：in the loop→on the loop。人建护栏，AI 在框内自主。新工种诞生 |
| 1.8 | 中层危机 | Evidence | 初级意外安全。中层——真正危险。 | AI 最先替代的不是"不会写代码的人"——是"只会写代码的人" |
| 1.9 | Block vs Cloudflare | Evidence | 两位 CEO，同一季度，都在重新定义"组织里有哪几种人"。Block 激进废层级留三角色，Cloudflare 精准用三分法。 | 不是裁法对错——是 AI 后组织必须重新定义人的种类。激进 vs 精准 |
| 2.1 | BPM = SDLC 孪生 | Framework | 软件有 SDLC。你们公司有 BPM。 | 企业业务处理是跟软件开发完全同构的信息加工链。40 年学术传承 |
| 2.2 | Framed Autonomy | Framework | "有框的自主"——AI 时代企业和软件共同的答案。 | 人定义边界，Agent 在框内自主执行。= AI Sandwich。18 位作者 Dagstuhl Manifesto |
| 2.3 | 四层重构 | Framework | 你公司的 IT 架构有四层。每一层都在重写。 | 前端（Office→Agent 基础设施）、中端（编排）、后端（记录）、治理——每层都有 SDLC 映射 |
| 2.4 | 海外案例 | Evidence | GE 的工厂、Wells Fargo 的银行、Petrobras 的油田、波士顿儿童医院。 | 四个完全不同行业的传统企业已在 production 中部署 Agentic BPM |
| 2.5 | 中国案例 | Evidence | 奇瑞 4000 个智能体。兆企合同审批 1天→20分钟。 | 中国传统企业——不只是科技公司——已在部署生产级 AI Agent |
| 3.1 | 罗马军团 | Concept Split | 你们公司的金字塔——是罗马军团时代的遗产。 | 层级存在的根本原因是人是信息流动的瓶颈。AI 把沟通成本打到接近零 |
| 3.2 | 中层没用了 | Evidence | AI 最根本的冲击不是"裁员"——是让组织发现哪些层级只做信息搬运。 | Builder/Seller/Measurer：纯测量/报告/协调的岗位，在 AI 时代需要重新定义 |
| 3.3 | 融合 | Concept Split | SDLC + BPM → 同一个 Agent 界面。 | 软件和业务正在同一套基础设施上收敛——不是"互相借鉴"，是融合 |
| 3.4 | 你打算怎么变？ | Closer | 我今天没有结论。只有一个隐喻。 | 软件开发是先行样本。你是下一个。外面都变了——你打算怎么变？ |

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 v1 | 从 manuscript 反向提取 outline，补全隐喻、公式、叙事弧、slide map |
