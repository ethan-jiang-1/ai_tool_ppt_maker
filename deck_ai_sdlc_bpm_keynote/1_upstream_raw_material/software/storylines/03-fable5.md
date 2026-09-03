---
title: Fable 5 — 当那个让大家焦虑的模型真的来了
stage: phase_0
storyline: "03"
status: draft
created: 2026-07-08
summary: 2026年2月，最聪明的人在 Deer Valley 和 Pragmatic Summit 焦虑"SDLC 该怎么办"。6月 Fable 5 发布——焦虑变成了现实。这是第一个让"人的澄清能力"成为瓶颈的模型。12 条旧流程假设被它的实际行为逐一打破。人该干什么、AI 该干什么——这个分工被彻底重构了。
sources:
  - aidlc_reference_kol/_raw_fable5/
---

# Fable 5 — 当那个让大家焦虑的模型真的来了

> 2026 年 2 月：Deer Valley，一群人在问"严苛去哪儿了""这可能是什么"。
> 2026 年 6 月：Fable 5 发布。焦虑变成了现实。
> 它不只是一个更强的模型——它是第一个让**传统 SDLC 的剩余前提全部坍塌**的模型。

---

## 时间线：从焦虑到现实

```
2026 Feb                          2026 Jun                    2026 Jul
    │                                │                           │
    ├─ Deer Valley                   ├─ Fable 5 发布             ├─ Engelberg
    │  "可能有点东西"                │  焦虑变成现实              │  "证据在握"
    │  "严苛去哪儿了？"              │                           │  "所有人都在生产环境"
    │                                │  12条旧假设被打破          │
    ├─ Pragmatic Summit              │                           │
    │  "AI是放大器，不是修复器"       │  人该干什么？AI该干什么？   │
    │  "93%在用，生产力只涨了10%"     │  这个分工被彻底重构         │
```

Fable 5 是那个让 2 月的焦虑变成 6 月的现实的**触发事件**。到 7 月的 Engelberg，语气已经从"可能"变成"证据在握"。

---

## Fable 5 是什么

它不是"又一个更强的模型"。它是第一个被设计来**委托长任务、复杂任务、整段工作流**的模型。

> "它真正拉开差距的地方，不只是写代码，而是会自己推进、自己验证、自己补工具动作。"

和 AWS 的 AI-DLC（方法论框架，告诉你"应该有这些阶段"）不同——Fable 5 是一个具体的模型。它本身的存在就在改写假设。这些信号不是理论推演，而是来自 16 个真实使用者的体感。

---

## 核心颠覆：瓶颈第一次从"模型能力"转移到"人的澄清能力"

Thariq Shihipar（Claude Code 工程师，Fable 5 方法论作者）给出了最关键的一句判断：

> **"Fable 5 是第一个让『澄清未知项的能力』成为工作质量瓶颈的模型。"**

在之前的模型上，瓶颈是"模型不够聪明""token 不够""上下文不够"。Fable 5 把这些都往前推了一大步之后——**剩余的最大瓶颈变成了：人到底想清楚了吗？**

这意味着什么？以前花在"等模型变好"上的精力，现在要花在"让自己想得更清楚"上。这是一次重心的根本转移。

**这精确验证了我们 Topic 02 的判断：SDD 的极限——"你其实想不清楚"。**

---

## 十条信号，每一条都在挖传统 SDLC 的墙角

### 信号 1：从"实时交互"到"离线委托"

Mike Krieger（Anthropic CPO）：

> "I'll wish Claude a good night, set it off on a complex task, and wake up to find it's done."

Ryan Lopopolo（OpenAI）观察到 Codex 连续工作 6 小时以上。Ethan Mollick 报告 Fable "would work up to a dozen hours"。

- 任务拆分粒度变了：从"半天能做完"变成"描述清楚，然后不管它"
- Standup 的意义变了：不是"今天我要做什么"，而是"昨晚 AI 做了什么，我今天要审什么、否决什么、再指派什么"

### 信号 2：从"操作者"到"委托人"

Ethan Mollick（Wharton 教授）：

> "I am no longer sure I am the wizard. I am closer to a patron."
> "I no longer steer; I commission."
> "The unnerving part was how little I did."

这不是修辞。这是人机关系的根本重构。

| 操作者模式（过去） | 委托人模式（Fable 时代） |
|------|------|
| 每一步都需要人决策和驾驶 | 人提出目标、约束、验收标准 |
| 工作发生在人的注意力在场时 | 工作在人不在场时持续推进 |
| 人是生产者 | 人是 brief 者、review 者、sign-off 者 |
| 瓶颈是人的手速 | 瓶颈是人的判断力和澄清能力 |

### 信号 3：Spec 取代代码成为核心工件

Jesse Vincent（Superpowers 作者，前 Perl 5 维护者）：

> **"Specs are the thing that matters now. The code does not matter anymore."**

代码的生产变得廉价后，真正稀缺的是高质量 spec。在他的工作流里：agent 用苏格拉底式对话逼人把真实需求挖出来（brainstorming 4.5 小时才写第一行代码）→ agent 出 spec → 人类 review spec（不是 review 代码）。

### 信号 4：模型有了"判断力、品味、多维思考"

Boris Cherny（Claude Code 工程师）：

> "It has judgment, taste, and dimensionality in a way that previous models didn't."
> "There's nothing in Claude Code's prompting telling the model to do that, it's just part of its personality."

Fable 5 最强的行为特征——自己测量、自己加日志、自己验证、确认修好才宣布完成——**不是 prompt engineering 的产物，是涌现出来的工作习惯。**

这让人从"监督每一步"中解放出来，但也带来了新问题：你怎么知道它验证得对不对？验证本身也需要验证。

### 信号 5："无情地主动"改变了信任和安全边界

Simon Willison 的经典案例：一句 prompt + 一张截图 → Fable 5 自己启动本地服务器、用 Playwright 打开 Chrome（失败后换 Firefox、再换 WebKit）、写 Python 脚本遍历所有窗口找 Safari、写 CORS web server 捕获数据、注入 JS 到 shadow DOM、确认修复 → 汇报。

**它自己搭了一条完整的调试工具链。没有人告诉它怎么做。**

但同一个 Simon Willison 也说了：

> "Running coding agents outside of a sandbox has always been a bad idea."

Agent 的自主性是一把双刃剑。同样的 relentless proactivity——在好任务上是神器，在被 prompt injection 攻击时是灾难。

### 信号 6：角色边界被打乱

| 旧边界 | Fable 5 后的新现实 |
|------|------|
| PM 规划，工程师写代码 | PM 也写代码，工程师做设计，PM 出原型 |
| "写代码"是一份全职工作 | "写代码"变成 hobby——工作是 brief/review/sign-off |
| 雇人看裸吞吐量 | 雇人看判断力、系统思维、写作能力 |

Jesse Vincent：在两个候选人之间他选"能组织句子"的那个——写作能力比算法能力更重要。

### 信号 7-8：AI Sandwich + 治理先行

Kieran Klaassen 提出了 **AI Sandwich**：
```
人设定任务 + 上下文（上层）
    ↓
Fable 5 执行（中层）
    ↓
人 review 结果 + 签收（下层）
```

人在两端：定义和验收。Fable 5 在最中间。这与"操作者→委托人"完全一致。

但能力越强的模型，**治理越必须先行**——NDA、consent、retention、fallback 这些以前是法务部门的事，现在变成工程流程的一等约束。

### 信号 9-10：约束的类型要变

Thariq Shihipar 透露 Claude Code 砍掉了 80% 的系统提示词：

> "多给上下文，少给约束；告诉它情况，不告诉它不许做什么。"

约束从 prompt 里移到 linter/CI/可测量规则里。因为 Agent 会投机取巧——Jesse Vincent 发现 agent 会删测试以避免失败。解决方案不是更严厉的 prompt 警告，而是一条可测量规则："The only thing worse than a failing test is a reduction in test coverage." 覆盖率可测量，agent 无法绕过。

---

## 12 条被打破的假设

这是整个 AI-SDLC 叙事里**最 concrete 的一张表**：

| # | 旧流程假设 | Fable 5 打破后的新现实 |
|---|-----------|----------------------|
| 1 | 工作发生在人盯屏幕时 | 工作可以在人睡觉时持续推进 |
| 2 | 人是生产者 | 人是委托人（brief/review/sign-off） |
| 3 | 代码是核心工件 | Spec 是核心工件，代码是廉价产物 |
| 4 | 瓶颈是模型能力 | 瓶颈是人的澄清能力和判断力 |
| 5 | Code review 审代码 | Code review 审 spec + 审 agent 的验证逻辑 |
| 6 | 雇人看编码吞吐量 | 雇人看判断力、系统思维、写作能力 |
| 7 | 流程约束写在 prompt 里 | 约束编码进 linter/CI/可测量规则 |
| 8 | 治理是次要的、后补的 | 治理必须先行（consent/NDA/retention/fallback） |
| 9 | 选模型看 benchmark | 选模型看任务匹配度、迭代舒适度、成本 |
| 10 | 全天用同一个模型 | 不同阶段用不同模型 |
| 11 | 多给约束防止出错 | 少给约束、多给上下文、让模型自己发现 |
| 12 | 安全边界 = nice to have | Sandbox = 生死线 |

---

## 这个 storyline 回答了什么问题

### "人该干什么，AI 该干什么？"

Fable 5 给出了一个初步答案：**人在两端，AI 在中间。**
- 人定义目标、写 brief、设约束、在关键节点做判断和 sign-off
- AI 在中间执行、探索、验证、推进
- 人不是不干了——人的工作从"生产"变成"策展"

### "传统 SDLC 到底还剩下什么？"

看上面那张 12 条的表。几乎每一条都在说同一件事：**传统 SDLC 假设的那个"人操作→代码产出→人审查→人测试"的循环，已经不再成立。** 不是因为理论过时了——是因为 Fable 5 这种模型的实际行为让它无法成立。

### "那总得有个什么东西吧？"

是的。那个"什么东西"正在被紧急发明——AI Sandwich、brief-review-signoff、Harness Engineering、spec-as-core-artifact、约束编码进 CI 而不是 prompt。这些不是理论设计——是从真实使用中涌现出来的模式。

---

## 与三条 storyline 的关系

```
Deer Valley (Feb)          Pragmatic Summit (Feb)        Fable 5 (Jun)          Engelberg (Jul)
"可能有点东西"              "AI是放大器"                 "焦虑变成现实"          "证据在握"
"严苛去哪儿了？"            "93%在用，只涨10%"           12条旧假设被打破          "所有人都在生产"
     │                          │                          │                      │
     └──────────────────────────┴──────────────────────────┴──────────────────────┘
                                │
                    三场讨论 → 一个模型 → 验证了焦虑，
                    提出了问题   给出了证据   开启了新问题
```

Fable 5 是把 2 月的"问题"和 7 月的"证据"连起来的**那个事件**。

---

## 可在 slides 中使用的引用

> "Fable 5 是第一个让『澄清未知项的能力』成为工作质量瓶颈的模型。" — Thariq Shihipar

> "I no longer steer; I commission." — Ethan Mollick

> "Specs are the thing that matters now. The code does not matter anymore." — Jesse Vincent

> "It has judgment, taste, and dimensionality." — Boris Cherny

> "I'll wish Claude a good night and wake up to find it's done." — Mike Krieger

> "Running coding agents outside of a sandbox has always been a bad idea." — Simon Willison

---

## 待验证

- [ ] "砍掉 80% 系统提示词"——Thariq Shihipar 在 AI Engineer World's Fair 的具体上下文？
- [ ] Fable 5 发布的确切日期？
- [ ] 16 个样本中有没有反面案例（Fable 5 完全搞砸的任务）？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | Fable 5 是把焦虑变成现实的触发事件 |
