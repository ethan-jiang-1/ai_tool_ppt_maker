---
title: Part 1 — The Software Frontline
part: 1
slides: S1.1–S1.9 (06–15 in v1 production)
version: v2
status: draft
updated: 2026-07-15
sources:
  - 1_upstream_raw_material/software/topics/
  - 1_upstream_raw_material/software/storylines/
  - 1_upstream_raw_material/business/  # Block/Cloudflare cases
note: v2 吸纳 v1 honest footnote 惯例 + slide ID 对照

slide_id_map:
  S1.1: s06_old_map_new_map (SDLC 前提被挖)
  S1.2: s07_deer_valley_engelberg (Fowler 两次 retreat)
  S1.3: s08_beck_fowler (Beck+Fowler 同台)
  S1.4: s09_fable5_bottleneck (Fable 5 瓶颈转移)
  S1.5: s10_the_chain (信息加工链)
  S1.6: s11_too_fast_to_review (反馈周期炸了)
  S1.7: s12_on_the_loop (in-the-loop→on-the-loop)
  S1.8: s13_mid_pack_at_risk (Three-Tier Split)
  S1.9: s14_block_layoff + s15_cloudflare_precision (Block vs Cloudflare)
---

# PART 1: THE SOFTWARE FRONTLINE — 高科技软件业经历了什么

---

## Block A: SDLC 被掀翻了

---

### S1.1: SDLC 的演化——每次都是参数调整，这次前提被挖了

**KICKER**: 瀑布、V 模型、敏捷——你以为它们很不一样。其实它们是同一件事的三种节奏。

**CLAIM**: 传统 SDLC 的全部方法论，不管怎么迭代，都建立在同一个前提上——人必须先想清楚，然后一步步拆解。AI 挖掉的不是某一个方法论，是**这个前提本身**。

**BODY**:

软件工程有自己管理复杂性的方法——SDLC（Software Development Life Cycle）。

它演化了很多次：

| 时代 | 方法论 | 核心逻辑 |
|------|--------|---------|
| 1970s | 瀑布 | 想全部 → 拆全部 → 做全部 → 验全部 |
| 1980s | V 模型 | 同上，但每个阶段有对应的验证 |
| 2001 | 敏捷 | 想一点 → 拆一点 → 做一点 → 验一点 → 再想 |

看起来变化很大。但它们的**共同前提**一直没变：

> **人必须先想清楚。程序是确定性的——它不会自己"想"，所以人必须替它想。**

瀑布和敏捷的区别，只是"想多少再做"的参数不同。本质上都是**人脑驱动**的信息加工链。

AI 出现后，这个前提被挖了：

- 程序不再需要人完全想清楚——AI 可以填中间
- 程序的输出不再完全确定——同一个 prompt，不同实现
- "正确"的定义变了——从"符合人的设计"变成"符合人的验收标准"

如果前提变了，整个 SDLC 的大厦就需要从地基重建。

**TRANSITION**: 这不是理论推演。有一群世界上最牛的软件工程大脑，用 5 个月的时间亲身经历了一遍。

---

### S1.2: 5 个月，从犹豫到确信 — Deer Valley → Engelberg

**KICKER**: 2026 年 2 月，"可能有点东西"。2026 年 7 月，"证据在握"。

**CLAIM**: Martin Fowler 召集的两次 retreat——2 月的 Deer Valley 和 7 月的 Engelberg——是整个 AI-SDLC 变革最鲜活的证据。5 个月内，这群人的语气从"我们不确定这是什么"变成了"所有人都在生产环境里做"。

**BODY**:

2026 年 2 月，犹他州 Deer Valley。25 年前，同一片山上，17 个人写出了 Agile Manifesto。25 年后，Martin Fowler 把新一代最优秀的大脑召回到同一片山。

没有宣言。只有一堆问题。

> "不确定性多于确定性……每个人都在摸索中前进。" — Annie Vella

> "Deer Valley 有犹豫，有信念——'可能有点东西，但我们还不确定是什么。'" — Giles Edwards-Alexander

Deer Valley 诞生了几个关键概念：

- **Rigor Relocation**："严苛没有消失——它从写代码迁移到了 spec、测试、类型系统"
- **Supervisory Engineering**：一个新工种——指挥 Agent、评估输出、校准信任
- **Cognitive Debt**：不只是技术债——是理解 AI 产出系统的认知负担
- **Three-Tier Developer Split**：初级意外安全、中层真正危机、资深转向架构

**5 个月后。瑞士 Engelberg。** 语气彻底变了。

> "Deer Valley 是犹豫。Engelberg 是自信——**价值就在这里。**"

> "房间里所有人都在做。在生产环境里交付。**不是 slides——是 production。**"

问题从"是否"变成了"如何"。Harness Engineering——这个词在 Deer Valley 时根本不存在——在 Engelberg 成了核心议题。

**关键数字**：5 个月。从"我们不确定"到"所有人都在生产环境"。这不是渐进式改进的速度——这是 disruption 的速度。

**TRANSITION**: 同一周，在旧金山，另一群人也在问同样的问题——但场面更大。

---

### S1.3: Beck + Fowler 同台 — Agile 的原班人马怎么说

**KICKER**: Agile Manifesto 两个合著者，25 年来第一次以 AI 为主题联合公开对话。

**CLAIM**: Pragmatic Summit 2026 是 AI 时代软件工程最重要的一次公开大会。Beck 和 Fowler 的判断形成了三个关键信号：AI 的量级大于之前所有变革的总和、TDD 变成不可协商的生存技能、中层开发者最危险。

**BODY**:

2026 年 2 月，旧金山。Gergely Orosz（The Pragmatic Engineer）主办的首届 Pragmatic Summit。跟 Deer Valley 同一个月，但这是公开售票大会——有硬数据、有 CTO 圆桌、有 12 万开发者的调查结果。

Beck + Fowler 的炉边对话是全场最重磅的 session。

**Fowler 开场**：

> "Nothing has hit with the magnitude of AI. This is a whole size different from anything we've faced before."

**Beck 补充**：AI 的量级大于微处理器 + OOP + 互联网 + Agile 的总和。

但 Beck 最担心的是 **Re-Soloing**：

> "一个人管 6 个 Agent 关起门来干活——这跟跟真人 pair programming 不是一回事。"

他的方案：**"Two humans + one agent"可能好过"one human + six agents"**——保留人跟人的协作，AI 是增强，不是替代人类协作。

三个独立的声音（Beck、Fowler、Willison）得出了同一个结论：**TDD 不可协商。** 不是"TDD 还重要"——是"没有 TDD，你根本驾驭不了 AI 产出的代码"。

> "Tests are free now." — Beck

**Laura Tacho 的 12 万开发者数据**：AI 是放大器——好的团队用 AI，incidents ↓50%；差的团队用 AI，incidents ↑2x。

**TRANSITION**: 这些讨论发生的时候，Fable 5 还没发布。6 月，它来了——然后把所有人的讨论推到了一个新的量级。

---

### S1.4: Fable 5 来了 — 瓶颈从机器变成了人

**KICKER**: "The first model I hand off whole projects to." — Mike Krieger

**CLAIM**: Fable 5（Claude Fable 5，2026 年 6 月发布）不是"更强的 autocomplete"。它把人与 AI 的关系从"操作者→工具"变成了"委托人→执行者"。瓶颈第一次从"机器够不够聪明"变成了"人能不能驾驭得了一个比自己聪明的东西"。

**BODY**:

2026 年 6 月，Anthropic 发布了 Fable 5。一线开发者的反应不是"哇，好快"——是**"我不知道我还是不是那个 wizard"**。

**Ethan Mollick（Wharton 教授）**：

> "I no longer steer; I commission."
> "The unnerving part was how little I did."

**Mike Krieger（Anthropic CPO，Instagram 联合创始人）**：

> "I'll wish Claude a good night, set it off on a complex task, and wake up to find it's done."
> "It really feels now like a teammate I can delegate a lot of work to."

**Simon Willison（Datasette 创始人）**：

> "Claude Fable is relentlessly proactive."
> "It had hacked up its own pattern for taking screenshots of browser windows."

**Boris Cherny（Claude Code 创建者）**：

> "Claude has stepped up from being a coding agent to a thought and design partner. It has judgment, taste, and dimensionality."

这些不是夸模型聪明的评价。这些是在描述一种**新的人机关系**。

Kieran Klaassen 把新模式叫 **"AI Sandwich"**：人设定任务 + 上下文 → AI 自主执行 → 人 review 验收。Jesse Vincent 的版本更极端：**"Specs are the thing that matters now. The code does not matter anymore."**

**最关键的变化**：瓶颈从机器变成了人。以前瓶颈是机器不够聪明。现在瓶颈是**人**——能不能给出清晰的上下文、能不能发现 AI 产出里看起来正确但实际有问题的东西。

**TRANSITION**: 当瓶颈从机器变成人，人的角色就必须被重写。

---

## Block B: 人的角色被重写

---

### S1.5: 软件开发本质是信息加工——现在加工的不是人了

**KICKER**: 软件开发就是把需求一步步加工成代码。以前每个环节都是人做的。现在中间环节 AI 做了。

**CLAIM**: 软件开发是一条信息加工链。AI 接管了中间的加工环节之后，人只有两个方向可以走：往上游（定义要做什么——架构师、产品），或者往下游（验收和治理——Harness Engineer）。

**BODY**:

软件开发本质上是一个 ITO 模型：

```
需求 → [分析] → [设计] → [编码] → [测试] → [部署] → 产品
```

以前，这条链上的每一个环节都是人做的。一个程序员一天写几百行代码，一个 reviewer 逐行看 PR。

现在，AI 可以接管中间的加工环节——编码、测试、甚至部分设计。

那人的价值往哪迁移？**两条路**：

**往上走**——定义"做什么"：什么需求值得做？tradeoff 怎么判断？系统架构怎么设计？

**往下走**——治理"做得对不对"：验收标准怎么设？护栏怎么建？Agent 的判断什么时候能信任？

Simon Willison 说的最透彻：**"Build is cheap. Argument is expensive."** 写代码变便宜了。真正贵的是**判断**。

**TRANSITION**: 这个变化的速度，超过了人脑演化速度。

---

### S1.6: 反馈周期炸了——人的信息吞吐是瓶颈

**KICKER**: 以前一个 PR 要等几小时才有反馈。现在 AI 在几分钟内写几千行代码——但人还是那个速度在 review。

**CLAIM**: AI 时代的核心瓶颈不是"写代码不够快"，是"人审不过来"。反馈周期的加速是 SDLC 所有变化中最被低估的一个。

**BODY**:

传统 SDLC 的设计前提是：**人的信息吞吐速度是恒定的。** 一天写几百行代码。review 一个 PR 花 30 分钟。一个 sprint 两周——因为人需要这么多时间。

AI 把这个前提也炸了。Fable 5 一晚上写几千行代码。Jesse Vincent 的 agent 一晚上跑 25 个实验。

Martin Fowler 重新定义了 "Verified"：

> "Verified used to mean 'read by you.' With modern agent throughput, it has to mean 'checked by tests, by type checkers, by automated gates, or by you where your judgment matters.'"

**结论**：反馈周期从"人-paced"变成了"AI-paced"。人跟不上——必须从 one-to-one 盯着变成 one-to-many 设护栏。

**TRANSITION**: 这就是 human-in-the-loop → human-on-the-loop 的转变。

---

### S1.7: 从 human-in-the-loop 到 human-on-the-loop

**KICKER**: 以前"AI 写一行，人看一眼"。现在"AI 写一天，人看一眼结果"。

**CLAIM**: Kief Morris 的框架——in the loop → on the loop——是理解 AI 时代人角色变化最清晰的模型。人不再逐个检查 AI 产出，而是建护栏，让 AI 在框内自主。

**BODY**:

| 模式 | 人做什么 | 问题 |
|------|---------|------|
| **In the loop** | 逐个 review 每一行 | 不可扩展——agent 输出速度远超人类 |
| **On the loop** | 建护栏，AI 在框内自主 | 当 agent 产出不满意时，修的是 harness，不是 artifact |

> "When an agent produces unsatisfactory results, the 'in the loop' approach fixes the artifact. The 'on the loop' approach fixes the harness." — Kief Morris

**新工种出现了**：

- **Supervisory Engineering**：指挥 Agent、评估输出、校准信任
- **Harness Engineering**：设计护栏——lint rules、type checkers、CI 阻断脚本
- **Middle Loop**：专门评估和校准 Agent 行为的循环

Ryan Lopopolo（OpenAI）的实验：3 个工程师，5 个月，100 万行代码。零人手写。零人 review。人把 80% 的时间花在建 harness 上。

> "Agents aren't hard. The Harness is hard."

**TRANSITION**: 角色重写了，方法论重写了——组织呢？

---

## Block C: 组织的连锁反应

---

### S1.8: 中层危机 — Three-Tier Developer Split

**KICKER**: 初级意外安全。中层——真正危险。资深——转型为 Agent 编排者。

**CLAIM**: Deer Valley 浮现的 Three-Tier Developer Split 已在真实裁员中得到验证。AI 最先替代的不是"不会写代码的人"——是"只会写代码的人"。

**BODY**:

| 层级 | 处境 | 为什么 |
|------|------|--------|
| **初级** | 意外安全 | AI-native 一代，LLM 是 24/7 导师 |
| **中层** | 真正危机 | 辛苦积累的技能（CRUD、调试）正是 AI 进步最快的领域，但还没积累足够架构判断力 |
| **资深** | 转向架构 | 变成 Harness Engineer、Agent 编排者 |

Kent Beck："中层是我最担心的。"

Boris Cherny 补了一刀——新的稀缺能力：**"Judgment, taste, and dimensionality."** 如果模型也开始有判断力了，程序员还剩什么？答：**发现盲区的能力。** 能问对问题比能写对代码更重要。

**TRANSITION**: 这不是理论。有两家公司已经在动了——但方式完全不同。

---

### S1.9: Block vs Cloudflare — 两种重新定义"人"的方式

**KICKER**: 两位 CEO，同一个季度，都在做同一件事——重新定义"组织里有哪几种人"。一个激进推倒层级，一个精准分类岗位。

**CLAIM**: Block 和 Cloudflare 不是"两种裁法"——是 AI 提升生产力后，两位 CEO 重新定义组织里有哪几种人的两个样本。一个激进（废层级、只留三种角色），一个精准（用一把尺把所有人分三类）。这是"organization 被重画"的先声。

**BODY**:

**Block（Square 母公司）——激进重构：废掉层级，只留三种人。**

CEO Jack Dorsey 发布"From Hierarchy to Intelligence"宣言，把传统 5 层管理压成 2-3 层，宣布组织里只留三种角色：

| 角色 | 定义 |
|------|------|
| **IC** | 纯执行者，无管理职责 |
| **DRI** | 项目直接负责人，有决策权但无层级 |
| **Player-Coach** | 既做技术贡献又带团队——**不允许纯管理角色** |

关键：**AI agent 做中间协调层**，替代传统管理者的"信息传递 + 资源协调"。这不是空谈——Block 的 Goose 开源 agent 框架（GitHub 39K stars、捐给 Linux Foundation）是公开证据最强的企业 AI 工具之一。

背景注脚（诚实提醒，不是主角）：Dorsey 同期裁员 40%（~4,000 人）。独立分析师用"三维检验"判定这次一刀切主因是成本削减（裁前 237% 超招、股价已跌 70-80%、有 CFPB 处罚），AI 真实但次要；一个月内还召回部分被裁者（Klarna 回旋镖，55% 企业后悔 AI 裁员）。**激进重构有它的代价——但值得记住的是"重新定义三种人"这个动作，不是裁员数字。**

**Cloudflare——精准诊断：一把尺，把所有人分三类。**

CEO Matthew Prince 用 Builder/Seller/Measurer 框架（溯源 Drucker 1954：只有建造者和销售者产生成果，其余都是成本）重新定义组织里有哪几种人：

| 类型 | 定义 | AI 可替代性 |
|------|------|-----------|
| **Builders** | 创造产品的人 | 低——AI 是工具，不是替代 |
| **Sellers** | 获取客户的人 | 低——人际关系不可替代 |
| **Measurers** | 测量、报告、协调的人 | **高——正是 LLM 核心能力** |

Prince 的做法："Displacement, not reduction."——**换一种人替代另一种人**：裁量度者（合规/财务/法务/中层管理/内审），同时创纪录扩招工程师（建造者）。

背景注脚：裁员 20%（~1,100 人），16 年首次；股价其实跌了 14-24%（市场对"AI 替代合规/法务"有疑虑），但 9 家独立分析师判定是结构性重组。同期 Wix、ClickUp 也砍 ~20%，只是叙事不同——CEO 的说法是有意识的战略选择。

**两种重新定义的对照**：

| | Block | Cloudflare |
|------|------|------|
| 重新定义的方式 | 激进——废层级，只留三种角色 | 精准——一把尺把人分三类 |
| 三种人 | IC / DRI / Player-Coach | Builder / Seller / Measurer |
| 焦点 | 人**怎么协作**（AI 做中间层） | 哪种人**创造价值**、哪种被重塑 |
| 可复用性 | 低（数字原生平台的激进玩法） | 高（Measurer 框架任何组织可用） |

共同点：两位 CEO 都在回答同一个问题——**AI 提升生产力后，组织里到底需要哪几种人？** 这正是第三波冲击（organization）的先声。

**TRANSITION**: 好，软件这头讲完了。现在我要说一个可能让你不舒服的结论——同样的事，正在你的行业发生。
