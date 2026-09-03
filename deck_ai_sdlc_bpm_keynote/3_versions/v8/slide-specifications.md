---
identity:
  scheme: mnemonic
production:
  pipeline: page-image-workflow
  workflow: pure
---

# Slide Specifications — AI 时代的信息加工变革 (v8)

## Slide 01: `InfoRev`

**PAGE CLASS**: opening
**KICKER**: 从 SDLC 到 BPM
**TITLE**: AI 时代的信息加工革命
**SUBTITLE**: 工作方式正在被重新定义
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: title-pause
motifs: []
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items: []
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 开场落在封面上停一拍——今天讲的不是某个工具，而是一场"信息加工"方式的整体重写。软件是第一个样本，但故事关于所有靠信息吃饭的行业。
>
> **Terms:**
> — 信息加工: 看文档、写邮件、填报表、走审批、写代码——本质都是把信息一步步加工成决策/产物
> — SDLC / BPM: 软件开发生命周期 / 业务流程管理，两条同构的信息加工链
>
> **Takeaway:**
> 这是一场关于"工作方式"的整体重写，不是一次工具升级。

---

## Slide 02: `TriYear`

**PAGE CLASS**: standard
**KICKER**: 三年
**TITLE**: 从补全一行代码，到接管整个项目。
**SUBTITLE**: 这不是 hype。这是加速度。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: timeline
motifs: [layered-pathways]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 2024 帮你写完这一行，2025 帮你写完这个函数，2026 接住整个项目让你去睡觉。
  - role: supporting_copy
    literal: 不是 hype，是加速度；而且正在溢出到所有信息加工领域。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 用亲历者身份开场——在 AI 行业待了很久,见过多次"狼来了",但这三年不一样。用三年三级跳(补全一行→写完函数→接管项目)建立加速度感,强调这不是 hype 是真实的加速度,而且正在溢出到所有信息加工领域。
>
> **Terms:**
> — 加速度: 不是"AI 变强了",而是"变强的速度本身在变快"(二阶变化)
>
> **Takeaway:**
> AI 正在从"帮你写代码"变成"帮你做一切信息加工",而且速度还在加快。

---

## Slide 03: `WhyCode`

**KICKER**: 为什么是软件先被颠覆
**TITLE**: 两个东西让 AI 学编程比别的都快。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: two-column
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 代码有编译器，0.1 秒就知道对不对；GitHub 有几十亿行代码当教材。
  - role: supporting_copy
    literal: 进步快 → 资本涌入 → 模型越训越强 → 开始溢出到其他领域。软件只是第一个被学透的。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先讲软件其实很难(把模糊需求一步步加工成精确代码),再抛出两个"作弊"特性:编译器反馈快 + 数据海量。因果链:进步快→资本涌入→模型更强→溢出到那些没那么有逻辑但同样要加工信息的领域。
>
> **Terms:**
> — 反馈循环: 代码写错编译器立刻报错,AI 能极快地自我纠正
> — 溢出: 编程练出的能力扩散到其他信息加工领域
>
> **Takeaway:**
> 软件被先颠覆不是偶然——逻辑性强 + 数据多让 AI 在这里学得最快,然后外溢。

---

## Slide 04: `OneTool`

**KICKER**: 同一套工具，两种模式
**TITLE**: Claude Code。Codex Desktop。上午写代码，下午写报告。
**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: hub-spoke
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 同一个 Agent 引擎，同一种工作方式——给出任务、Agent 执行、人验收。
  - role: supporting_copy
    literal: 软件开发者已经在这条路上跑了三年，办公室白领才刚刚开始。软件的今天就是你的明天。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 点出共同特点——不分编程/办公。上午 coding,下午办公,只切模式。工作方式一致:任务 + 上下文→执行→验收。结论:软件是先行样本,白领是下一个,它们经历的是同一件事。
>
> **Terms:**
> — Agent 引擎: 同一个底层能力,换个模式就从写代码变成写报告
> — 先行样本: 软件行业已经历困惑→抗拒→适应→重定位
>
> **Takeaway:**
> 第一次,开发者和白领共用同一套 Agent 基础设施——所以软件的今天就是你的明天。

---

## Slide 05: `NewPart`

**KICKER**: 你多了一个伙伴
**TITLE**: 过去只换工具；这次多了一位搭档。
**SUBTITLE**: 它很能干；但人还没学会怎么和它协作，这才是最大的挑战。
**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: specialist-generalist
motifs: [role-contrast, shared-work-surface, five-domain-map]
negative_constraints: [no-logo, no-watermark]
relationship: specialist-generalist
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 专才 → 通才。人通常只深耕一个领域，跨出去就得换人；AI 却能横跨产品、开发、测试、运维和汇报五个环节。
  - role: supporting_copy
    literal: 这次不只是让你更快，而是能替你把事情做完。它很能干，人却还没学会怎么和它配合。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 停一拍。互联网、iPhone——每次都说「这次不一样」，但每次其实都一样：工具升级，人还在中间。这次真不一样。你看左边这个程序员——他只懂写代码。产品？测试？运维？汇报？都不懂。他不是不行——他是专才，一个领域钻得很深。但跨出这个领域就得换人。右边这个 AI 不同——产品、程序、测试、运维、汇报，它全都懂。不是每样只会一点、关键时刻掉链子——是每样都能上手干活。你把一整件事委派给它——「帮我从零到一做出这个功能」——它理解需求、写代码、跑测试、部署上线、写汇报。全套。这不是帮你更快——是帮你**做了**。你从操作者变成了委托人。问题是：人从来没有过这种工作关系。我们擅长管工具（告诉它每一步怎么做），不擅长管搭档（告诉它要什么、信任它去执行）。挑战不在 AI 够不够好——在人还不会用搭档。好消息是你多了一个超级能干的伙伴。新挑战是你不知道怎么配合。两个都是真的。拿软件开发看——这个搭档最先撞进的地方。
>
> **Terms:**
> — 专才 vs 通才: 人深耕一个领域，AI 横跨产品/程序/测试/运维/汇报
> — 伙伴关系: AI 从「帮你更快」变成「替你做了」——人的角色从操作者变成委托人
>
> **Takeaway:**
> 这次不一样——不是换了更好的工具，是多了一个什么都懂的搭档。好消息是它超级能干。挑战是你还不会跟它配合。两个都是真的。

---

## Slide 06: `OldMap`

**KICKER**: 旧地图只管人
**TITLE**: 瀑布、V 模型、敏捷——画的是人独自怎么走。现在多了一个。
**SUBTITLE**: AIDLC？没人知道长什么样。但大家已经在画了。
**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [layered-pathways]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 瀑布、V 模型、敏捷——旧地图画的都是人独自怎么走；现在多了一个通才搭档，旧地图不管用了。
  - role: supporting_copy
    literal: 新地图还在画布上，只有几根试探线和一个问号。这不是恐慌，是摸索中的诚实。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> SDLC 三代演化——瀑布（想全部做全部）、V 模型（边做边验证）、敏捷（想一点做一点）——看似不同，共享同一个前提：人在想，人在写，人在验证。差异只是「想多少再做」的节奏，不是「谁在想」的分配。不止——这些方法还默认每个环节要换人。需求分析师、架构师、程序员、测试工程师——各自的知识边界固定。流程长，不是因为工作本身复杂——是因为每跨一个边界就需要翻译、对齐、确认。旧地图画的不只是「一个人」的路线，是「一群窄专家怎么接力」的路线。而 AI——从 Slide 05 我们已经知道——是通才，没有职业边界。旧地图管不了这种新角色。现在多了一个搭档——它能写、能测、甚至能替你想一部分。旧地图不管用了，不是因为它错了，是因为它画的是人独自走的路线。现在有了同行者——怎么分工？谁想多少、谁做多少、谁验多少？没人知道正确答案。AIDLC 是个问号——但大家已经在摸索了。这不是恐慌，是探索中的诚实。更深一层：旧地图不只假设「人独自走」——还假设**每一步要换人**。瀑布的需求→设计→编码→测试，每步需要的知识不同，所以每步都是不同的人。流程的复杂度，有一半是「跨边界沟通」。旧地图在墙上——尊敬它，但知道它不够用了。新地图在画布上——只有几根试探线，但铅笔已经在手里。下一页，看同一群人 5 个月内怎么从犹豫走到确信的。
>
> **Terms:**
> — SDLC 三代: 瀑布（1970s 想全部做全部）、V 模型（验证与开发对称）、敏捷（2001 想一点做一点）——都是「人独自走」的路线
> — AIDLC 问号: AI 加入后的新软件生命周期——还没定型，大家正在摸索
> — 旧地图新地图: 不是旧错了新对了——是旧的不够用了，新的还没画完
>
> **Takeaway:**
> 旧地图画的是人独自怎么走——瀑布、V 模型、敏捷，都是。现在多了一个搭档——新地图还在画，铅笔已经在手里。AIDLC 不是答案，是正在被回答的问号。

---

## Slide 07: `DeerVal`

**KICKER**: 五个月，同一群人
**TITLE**: 从「不确定多于确定」，走到「直接投入生产」。
**SUBTITLE**: Martin Fowler，ThoughtWorks 首席科学家；两次闭门研讨，都由他召集。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: evidence-shift
motifs: [shift-connector, evidence-cards]
negative_constraints: [no-logo, no-watermark]
relationship: evidence-shift
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: Deer Valley（2026 年 2 月，约 40 人）：“不确定多于确定。”
  - role: body
    literal: Engelberg（2026 年 6 月，约 60 人）：“不是做幻灯片，而是投入生产。争论已经结束。”
  - role: supporting_copy
    literal: 同一群人、同一个召集人，五个月里完成了一次集体认知跃迁。颠覆不是更快一点，而是换了一个速度档。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先介绍 Martin Fowler 是谁——ThoughtWorks 首席科学家，2001 年《敏捷宣言》17 位签署者之一，全球软件方法学过去 20 年的灯塔。25 年后同一片 Utah 山，他把新一代大脑召回来——但明确拒绝再写一份宣言。两次 retreat，同一批人。左边的 Deer Valley（2 月，~40 人）：Annie Vella 原话「不确定多于确定，没人搞明白了」。Fowler 自称「彻底的怀疑者」。CTO Rachel Laycock 定性「AI 是放大器——你要么加速交付，要么加速债务」。全场反复问「Rigor 去哪了？没人有同一个答案——但都同意很紧迫」。四个概念在 Utah 诞生（Rigor Relocation、Supervisory Engineering、Cognitive Debt、Three-Tier Split）。右边的 Engelberg（6 月，~60 人）：Greg Herlein 那句成了 retreat 的标志——「所有人都在 production 里做。不是 slides——是 production。AI 会不会改变软件工程的争论，结束了。」Giles Edwards-Alexander 追加「这就是证据。不是信徒聚会。」Fowler 自己都惊讶「满场谈 harness engineering——在 Utah 甚至还不是一个词」。术语弧：2 月还没这个词 → 4 月 Birgitta Böckeler 发里程碑文章 → 5 月被评为「2026 年软件工程最重要的术语之一」→ 6 月全场核心议题。5 个月，同一群人，从「不确定」到「production」。disruption 的速度。
>
> **Terms:**
> — Deer Valley / Engelberg: Fowler 召集的两次闭门 retreat，Chatham House Rule（可引内容不可指认具体发言人），Open-Space 形式
> — Not slides, Production: Greg Herlein 在 Engelberg 的原话，全场最强生产置信信号
> — Harness Engineering: Agent = Model + Harness——人在模型外面建的护栏（测试、类型、linter、LLM-as-judge）。Utah「甚至还不是一个词」→ 瑞士「全场核心议题」
> — 四个 Utah 概念: Rigor Relocation（严谨性迁移到护栏层）、Supervisory Engineering（人从写代码变成管 Agent）、Cognitive Debt（Agent 产出的理解负债）、Three-Tier Split（初级安全/中层危机/资深转架构）
>
> **Takeaway:**
> 同一群人、同一个召集人、5 个月内从「不确定多于确定」到「所有人都在 production 里做」——这不是观点之争，是亲历者的集体认知跃迁。disruption 的速度，不是渐进改进。

---

## Slide 08: `BeckFow`

**KICKER**: Agile 的原班人马怎么说
**TITLE**: Beck + Fowler：AI 的量级，大于之前所有变革的总和。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [soft-grid]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: Fowler「Nothing has hit with the magnitude of AI.」Beck「中层是我最担心的。」
  - role: supporting_copy
    literal: TDD 从"重要"变成"不可协商"的生存技能。Laura Tacho 12 万开发者数据：AI 是放大器——好团队降 50% incidents，差团队翻倍。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先铺垫这两位是谁，别假定听众懂：Kent Beck 和 Martin Fowler 是**敏捷开发（Agile）的奠基人**——2001 年《敏捷宣言》17 位签署者里的核心两位。Beck 发明了极限编程（XP）和测试驱动开发（TDD）；Fowler 是 **ThoughtWorks 首席科学家**，被业界当作软件方法学的灯塔。过去 20 年全球软件行业怎么开发、怎么协作，很大程度上是他们那场敏捷运动定义的。**关键分量在于：正是这批"定义了上一场变革的人"，现在说 AI 的量级大于此前所有变革（微处理器+面向对象+互联网+敏捷）的总和。** 场景是 Pragmatic Summit 2026 的 Beck+Fowler 炉边对话。Fowler：从未有变革有 AI 这个量级。Beck 最担心 Re-Soloing（一人管六个 Agent 关门干活 ≠ 人际结对）与中层。三人（Beck/Fowler/Willison）同一个结论：TDD 不可协商，"Tests are free now"。Laura Tacho 12 万开发者数据佐证：AI 是放大器——好团队 incidents 降 50%，差团队翻倍。
>
> **Terms:**
> — Kent Beck / Martin Fowler: 敏捷开发奠基人，《敏捷宣言》核心作者；Fowler 属 ThoughtWorks
> — 敏捷运动: 2001 年起定义全球软件开发方式的方法学运动
> — TDD: 测试驱动开发，AI 时代变成驾驭 AI 代码的护栏
> — 放大器: 好团队更好、差团队更差
>
> **Takeaway:**
> 连定义了上一场变革（敏捷）的原班人马都说：AI 量级空前，且 TDD 已是不可协商的生存技能。

---

## Slide 09: `FabFive`

**KICKER**: 瓶颈从机器变成了人
**TITLE**: Fable 5 来了。写代码的能力远超一般程序员。
**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: field-of-work
motifs: [connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 人机关系从"操作者→工具"变成"委托人→执行者"。Mollick「I no longer steer. I commission.」
  - role: supporting_copy
    literal: 瓶颈第一次从机器变成人——人能不能放心把方向盘交给搭档。Trust Gap。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 一线开发者反应不是"哇好快",而是"我还是不是那个 wizard"。三条引语:Mollick "I commission"、Krieger "wake up to find it done"、Willison "relentlessly proactive,自建截图工具链"。Kieran 命名 AI Sandwich;Jesse "specs matter, code doesn't"。核心:瓶颈从机器变成人。
>
> **Terms:**
> — 委托人 vs 操作者: 从操作工具变成委托任务
> — Trust Gap: 人能否信任一个比自己强的产出
>
> **Takeaway:**
> 瓶颈第一次变成人——能不能驾驭一个比自己聪明的东西。

---

## Slide 10: `InfoProc`

**KICKER**: 信息加工链
**TITLE**: 软件开发就是把需求一步步加工成代码。以前每个环节都是人。
**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: chain
motifs: [connected-nodes, layered-pathways]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: AI 没有职业边界——同时懂需求、能设计、会编码、会测试。
  - role: supporting_copy
    literal: 接管中间加工后，人只有两个方向：往上游定义做什么，或往下游做验收治理。Build is cheap. Argument is expensive.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 把开发抽象成 ITO 链。以前每个工位不仅是人——还经常是不同的人。需求分析师不懂代码，程序员不了解业务，测试工程师不知道设计决策。所以链条上每一环的产出，到下一环都要「翻译」一遍。流程的很多步骤，本质上是在补偿「窄专家之间无法直接沟通」这个事实。AI 没有这个问题——它是通才，各环节在它内部直接连通。所以它一站接管中间加工。人两条路:往上游(做什么、tradeoff、架构)或往下游(验收标准、护栏、信任)。引 Willison:写代码变便宜了,真正贵的是判断。
>
> **Terms:**
> — 信息加工链 / ITO: 输入→加工→输出,一环的输出是下一环的输入
> — 窄专家 / 通才: 人的知识有边界 → 流程需要跨边界接力；AI 跨领域 → 中间环节在内部一步完成
> — Harness Engineer: 建护栏、做验收的新角色
>
> **Takeaway:**
> AI 占了链条中间,人要么往上游定义,要么往下游治理。

---

## Slide 11: `RevGap`

**KICKER**: 人审不过来了
**TITLE**: AI 一晚上写几千行代码。人还是那个速度在 review。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: funnel
motifs: [layered-pathways]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 传统 SDLC 前提：人的信息吞吐恒定——一天几百行。AI 把这个前提也炸了。
  - role: supporting_copy
    literal: Fowler 重定义 Verified：不再是"你读过了"，是被测试、类型检查器、自动门禁检查过。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 传统前提是人吞吐恒定:一天几百行、一个 PR 半小时、一个 sprint 两周。AI 一晚几千行、一晚 25 个实验,前提被炸。Fowler 重定义 Verified:从"读过"到"被测试/类型/门禁检查过"。结论:从一对一盯着变成一对多设护栏。
>
> **Terms:**
> — AI-paced: 反馈周期由 AI 产出速度决定,人跟不上
> — Verified: 新含义是被自动门禁验证过,而非人读过
>
> **Takeaway:**
> 真正的瓶颈是人审不过来——必须从盯着改成设护栏。

---

## Slide 12: `OnLoop`

**KICKER**: 从盯着到设护栏
**TITLE**: Human-in-the-loop 变成 Human-on-the-loop。
**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: stack
motifs: [connected-nodes, soft-grid]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: In-the-loop 逐行 review、不可扩展 → On-the-loop 建护栏、AI 在框内自主。产出不满意时修的是 harness，不是 artifact。
  - role: supporting_copy
    literal: 新工种：Supervisory Engineer / Harness Engineer / Middle Loop。Agents are not hard. The Harness is hard.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 对比两种模式:in the loop 逐行审、不可扩展;on the loop 建护栏、AI 框内自主,产出不满意就修 harness。引 Morris 原句。新工种:Supervisory / Harness Engineering / Middle Loop。OpenAI 案例:3 人 5 月 100 万行、零人手写零人 review、80% 时间花在建 harness。
>
> **Terms:**
> — on the loop: 人在环上而非环中,管护栏不管每一步
> — Harness: lint / 类型 / CI 门禁等自动护栏
>
> **Takeaway:**
> 人从"逐行审产物"升级为"建护栏管 Agent"——修的是 harness,不是产物。

---

## Slide 13: `RiskMid`

**KICKER**: 中层最危险
**TITLE**: AI 最先替代的不是不会写代码的人。是只会写代码的人。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: stack
motifs: [layered-pathways, connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 初级意外安全（AI-native，LLM 是 24/7 导师）；中层真正危机（CRUD 与调试正是 AI 进步最快处，尚无架构判断力）；资深转向架构。
  - role: quote
    literal: 中层，这是我最担心的。——Kent Beck
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 三层分化:初级意外安全、中层真正危机、资深转架构。Beck:"中层是我最担心的。"Cherny 新稀缺:judgment / taste / dimensionality——模型也有判断力后,人剩下的是发现盲区、问对问题。
>
> **Terms:**
> — Three-Tier Split: 初级 / 中层 / 资深的分化
> — 只会写代码的人: 技能恰好落在 AI 进步最快的区间
>
> **Takeaway:**
> 危险的不是不会写代码的人,是只会写代码、还没长出判断力的中层。

---

## Slide 14: `BlocRes`

**KICKER**: 激进重构
**TITLE**: Block：废掉层级，一家公司只留三种人。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [connected-nodes, soft-grid]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: Jack Dorsey 发"From Hierarchy to Intelligence"宣言，5 层管理压成 2–3 层，只留 IC、DRI、Player-Coach；AI agent 做中间协调层。
  - role: metric
    literal: 裁到 ~6000 人后 Q1 2026 毛利 +27%、Rule of 40=44。
  - role: supporting_copy
    literal: Goose 开源框架（GitHub 39K stars、捐给 Linux Foundation）。诚实注脚：40% 裁员主因成本削减，AI 真实但次要。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先介绍一下 Block 是谁——就是美国那家支付巨头，原来叫 Square，Twitter 创始人 Jack Dorsey 一手掌舵，你可能用过它旗下的 Cash App。然后讲 Dorsey 干的这件"激进"的事——发布"From Hierarchy to Intelligence"宣言，把传统 5 层管理压成 2-3 层，宣布组织里只留三种角色：IC 纯执行、DRI 项目负责人、Player-Coach 既做技术又带团队（不允许只当经理的人）。最关键的一步：让 AI agent 做中间协调层，接管传统管理者的信息传递和资源协调。这不是空谈——Block 的 Goose 开源 agent 框架（GitHub 39K stars、捐给 Linux Foundation）是公开证据最强的企业 AI 工具之一。而且结果不虚：裁到 ~6000 人后 Q1 2026 还跑出毛利 +27%、Rule of 40 = 44。诚实提醒一句：同期 40% 裁员，独立分析师判主因是成本削减（裁前 237% 超招）、AI 真实但次要，还上演了 Klarna 回旋镖——所以激进有代价。但今天要你记住的不是裁员，是"重新定义组织里有哪三种人、而且业绩没垮"这件事。
>
> **Terms:**
> — IC（执行者）: 自己干活、不带人的纯贡献者
> — DRI（负责人）: 一件事的总扛把子，能拍板但不管人
> — Player-Coach（球员教练）: 既自己上手又带团队，没有"只带人不干活"的经理
> — AI 做中间层: agent 接管原来管理者的信息传递+资源协调
>
> **Takeaway:**
> AI 提升生产力后，一位 CEO 敢把 2000 年的管理层级推倒、只留三种人——而且裁到 6000 人还跑出 27% 毛利增长。这是激进的一端，代价与收益并存。

---

## Slide 15: `ClouDia`

**KICKER**: 精准诊断
**TITLE**: Cloudflare：一把尺，把所有人分成三种。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: three-column
motifs: [connected-nodes, soft-grid]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: Builder 建造者（AI 难替代·保留）、Seller 销售者（AI 难替代·保留）、Measurer 量度者（LLM 核心能力·重塑）。
  - role: supporting_copy
    literal: Prince 做法：Displacement, not reduction——裁量度者、创纪录扩招建造者。
  - role: metric
    literal: 营收 +34% YoY，Workers 平台 550 万开发者仍在加速。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先说 Cloudflare 是谁——全球互联网基础设施公司，你上的网站里大约每五个就有一个靠它做加速和安全防护，属于"看不见但离不开"的那类关键公司。同一季度，它的 CEO Matthew Prince 用完全不同的方式重新定义人——不是推倒层级，而是给你一把尺：Builder / Seller / Measurer。他溯源到 Drucker 1954 的经典——只有建造者（创造产品）和销售者（获取客户）产生成果，其余都是成本。第三种人"量度者"（测量、报告、协调、审核——合规/财务/法务/中层管理/内审）的工作，正是 LLM 最擅长的，所以被 AI 重塑。Prince 的做法是"Displacement, not reduction"：裁量度者、同时创纪录扩招工程师。关键——这不是"该裁量度者"，而是量度者的工作被重新设计：从"做测量的人"变成"管理 AI 测量输出并据此决策的人"。而且换人之后公司照样长：营收 +34%、Workers 平台 550 万开发者还在加速。这把尺，你回自己公司就能用。（背景注脚：裁员 20%，股价其实跌了 14-24%，但 9 家分析师判是结构性重组。）
>
> **Terms:**
> — Builder / Seller / Measurer: Prince 溯源 Drucker 1954 的三分法
> — Displacement not reduction: 换一种人替代另一种人，不是单纯砍人
>
> **Takeaway:**
> AI 提升生产力后，另一位 CEO 用一把可复用的尺重新定义组织里有三种人——换掉量度者、扩招建造者之后，营收还涨了 34%。精准的一端，且被结果验证。

---

## Slide 16: `ToBPM`

**PAGE CLASS**: transition
**KICKER**: 换挡
**TITLE**: 软件的故事讲完了。现在，轮到你的行业。
**SUBTITLE**: 同一条信息加工链，只是换了名字
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: minimal
motifs: [layered-pathways]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items: []
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 前半场我们看着软件行业：方法论被挖、人的角色被重写、组织开始连锁反应。别以为这是科技公司的家务事——软件只是煤矿里的金丝雀，它先感觉到空气变了。你的行业同样在加工信息，只是换了个名字叫 BPM。接下来，把同一个故事映射到你身上。
>
> **Terms:**
> — 换挡: 叙事从"软件"切到"传统企业"的转折点
> — 先行样本: 软件先经历，其余信息加工行业紧随
>
> **Takeaway:**
> 软件不是特例，是先行样本；同一条信息加工链，现在轮到你的行业。

---

## Slide 17: `TwinChn`

**KICKER**: 你们公司也在加工信息
**TITLE**: 软件有 SDLC。你们公司有 BPM。两条完全同构的信息加工链。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: parallel-chains
motifs: [connected-nodes, layered-pathways]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: SDLC 需求→分析→设计→编码→测试→产品，BPM 业务信息→汇总→分析→审批→执行→决策——完全同构。
  - role: supporting_copy
    literal: BPM 有 40 年学术传承（1980s MIT→2026 Dagstuhl），18 位作者联合发表 Agentic BPM Manifesto，核心概念：Framed Autonomy。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 你们公司也在把业务信息加工成决策/文档/工单,结构和 SDLC 一模一样(加工对象、方法论演进、artifact、AI 冲击四行对照)。BPM 非新概念,40 年传承;2026 Dagstuhl 18 位作者发 Agentic BPM Manifesto,核心 Framed Autonomy。
>
> **Terms:**
> — BPM: 业务流程管理,企业版的 SDLC
> — Framed Autonomy: 有框的自主,BPM 侧对 AI 范式的命名
>
> **Takeaway:**
> BPM 和 SDLC 是同一条信息加工链——软件发生的,正在你公司重演。

---

## Slide 18: `FramAut`

**KICKER**: 有了边界，才谈得上自主
**TITLE**: Framed Autonomy：人定边界，Agent 放手执行。
**SUBTITLE**: 框不是笼子，而是让人敢于放手的边界。
**VISUAL IDENTITY**: amber-agent/collaborating
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: framed-workspace
motifs: [frame-boundary, shared-work-surface, readable-schematic]
negative_constraints: [no-logo, no-watermark]
relationship: framed-autonomy
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 约束不是束缚。边界说清楚，Agent 才能放手干活：Operational Frame 规定执行顺序；Normative Frame 划出不可触碰的红线。
  - role: supporting_copy
    literal: 框内，一个 Agent 负责思考、书写和验证，另一个负责搭建、连接和运行。德国能源网的 meter-to-cash 流程，成功执行率达到 99%。框是信任，不是锁。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 给出 Dagstuhl 正式定义。关键翻面——「约束」这个词听起来像限制，但本质是赋能。就像沙盒——因为知道边界在哪，所以框内什么都能试。框内两个 Agent 性格截然不同：一个——安静写代码/写测试/写规范，沉稳精确；另一个——狂野地连接设备/调动资源/跑流程。两种 Agent，同一个框，各司其职。框外，人不再紧张地盯着每一步——一只手轻轻搭在框边，信任但关注。两种框：Operational Frame 规定执行序列（像 CI 管道）、Normative Frame 规定禁止行为（像编码规范）。真实验证：德国能源网 meter-to-cash 99% 成功率。BPM 叫 Framed Autonomy，SDLC 叫 AI Sandwich——人定框，Agent 在框内可劲儿干。框是信任，不是锁。
>
> **Terms:**
> — Operational / Normative Frame: 规定「怎么做」/ 规定「不许做」
> — AI Sandwich: 人定任务→AI 执行→人验收，与 Framed Autonomy 同一件事
> — 框=信任: 约束不是限制发挥——是让 Agent 敢放手的前提
>
> **Takeaway:**
> 有框，才有真正的自主。框不是笼子——是让你敢放手的边界。BPM 叫 Framed Autonomy，SDLC 叫 AI Sandwich，同一件事。

---

## Slide 19: `FourLyr`

**KICKER**: 四层重构
**TITLE**: 企业 IT 有四层。每一层都在被 AI 重写。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: stack
motifs: [layered-pathways, connected-nodes, soft-grid]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 前端（Office/飞书/钉钉→Agent 基础设施，最被低估）；中端（Agentic Orchestration/ProcessOS）；后端（CRM/ERP/HCM→数据源）；治理（Agent 365/AI Control Tower）。
  - role: supporting_copy
    literal: 四层同时重构，每层精确映射 SDLC。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 四层逐一:前端最被低估(Nadella:Agent 时代第一个配置的资源是 Office;飞书钉钉同日开源 CLI,2500+ API 变原子指令);中端重写(Camunda ProcessOS 四个 Agent,"每个流程都是 legacy");后端记录系统变数据源;治理层决定谁控制 Agent 身份权限。
>
> **Terms:**
> — 前端 = Agent 的家: Office/飞书/钉钉变成 Agent 基础设施
> — 治理层: 控制 Agent 身份与权限 = 控制企业 AI
>
> **Takeaway:**
> 企业 IT 四层都在重写,每一层都能精确映射到 SDLC。

---

## Slide 20: `AllNem`

**KICKER**: 唯一有独立第三方验证
**TITLE**: Allianz「Project Nemo」——不是高举高打，是从最窄处跑通，再铺开。
**VISUAL IDENTITY**: amber-agent/duo
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: hub-spoke
motifs: [connected-nodes, shared-work-surface]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 1 个 planner 调度 3 个专才 agent（承保核对、欺诈筛查、赔付计算）——澳洲食品变质理赔，数天→数小时（−80%）；理赔员未裁，升为签核者。
  - role: quote
    literal: We scoped it intentionally. ——Maria Janssen
  - role: supporting_copy
    literal: 巨头刻意缩到最窄高频低值场景先跑通、被独立第三方验证，再铺开。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 只讲一家，但讲透。安联是全球最大保险集团之一，传统金融巨头。Project Nemo 两个突出点：① 一个 planner 指挥 3 个专才 agent——承保核对、欺诈筛查、赔付计算——处理澳洲食品变质理赔，数天→数小时、-80%，理赔员没被裁、升为签核者(human-in-the-loop)；② 打法才是真洞察——首席转型官 Maria Janssen "We scoped it intentionally"，巨头刻意把 AI 缩到极窄高频低值场景先跑通、被独立第三方验证，再铺开。这是全场唯一独立媒体 + 独立机构双重佐证的案例。诚实交代：-80% 只限食品变质 <AUD$500 窄类目，扩展仍是意向——这恰是"缩窄验证"打法的证据，不是减分。
>
> **Terms:**
> — Project Nemo: 安联的 agentic 理赔试点
> — 缩窄验证: 刻意选最窄场景先跑通、被独立验证，再向外铺开
> — human-in-the-loop: 赔付最终由人签核
>
> **Takeaway:**
> 传统巨头落地 AI 的正确姿势：不是高举高打，是从一个能被独立验证的小场景扎实起步、再铺开——而且是抬人（升为签核者），不是裁人。

---

## Slide 21: `MaerAI`

**KICKER**: 情报先行
**TITLE**: Maersk：130 年航运巨头，先建数字孪生，再让 AI 上船。
**SUBTITLE**: 不是科技公司。是全球最大的集装箱航运公司。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [connected-nodes, soft-grid]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 跟 Allianz 不同路——Process Intelligence First：先建数字孪生，再叠 AI。Star Connect：700 艘船实时处理 25 亿 IoT 数据点，油耗 −9.2%、年省 $300M+。
  - role: supporting_copy
    literal: 报关 AI：6000+ 商品码自动分类。Gemini 联盟 90% 准班率（行业 2x）。两条路，同一个结论——传统企业核心流程正在被 AI 重写。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先介绍 Maersk 是谁——130 年丹麦航运巨头，不是科技公司。10 万员工、700+ 艘船——你买的东西很可能坐过它的船。跟 Allianz 对照：Allianz 是「直建 agent、窄处验证」，Maersk 走第二条路「情报先行、再上 AI」——先建数字孪生让流程可见，再往上叠 AI。最独特的约束是海上卫星带宽太贵，AI 不能上云——必须装在船上的边缘服务器。Star Connect 在 700 艘船上处理 25 亿 IoT 数据点，油耗 -9.2%、年省 $300M+（占集团 EBIT 的 8.6%）。Gemini 联盟的航线网络本身是 AI 优化出来的——90% 准班率是行业平均的两倍。报关 AI（Trade & Tariff Studio）是纯信息加工——6000+ 商品编码自动分类，关税自动计算。客服 AI 是人审 AI 回复后一键批准。诚实提两个教训：TradeLens 失败了（$100M+ 投入关闭——竞争对手不愿把数据喂进 Maersk 平台 → AI 在自有资产上跑得通，在需要全行业协作的平台上没那么容易）；客服 AI 还没跟上运营 AI 的质量。但结论不变：一条 130 年的航运公司也在被 AI 重写核心流程。跟 Allianz 不同路，同一个目的地。
>
> **Terms:**
> — Process Intelligence First: 先建数字孪生/流程可见性，再叠 AI——与 Allianz「直建 agentic」对照
> — Edge AI（边缘 AI）: AI 推理在船上本地跑，不依赖云——因为卫星带宽太贵太慢
> — Gemini Cooperation: Maersk+Hapag-Lloyd 联盟，AI 优化的枢纽-辐射网络，90% 准班率（行业 ~50%）
> — TradeLens 教训: $100M+ 的区块链平台 2023 年关闭——AI 在自有资产上跑赢，在需要全行业协作的平台上没那么容易
>
> **Takeaway:**
> 两条路，同一个结论：Allianz 直建 agent、窄处验证；Maersk 先建数字孪生、再叠 AI。130 年的航运巨头和 130 年的保险巨头——都在被 AI 重写核心流程。这不是 demo，是 production。

---

## Slide 22: `RomPyr`

**KICKER**: 两千年的结构
**TITLE**: 组织金字塔不是「效率最高」。是「人是信息瓶颈」下的不得已。
**SUBTITLE**: 罗马军团，公元 1 世纪。现代企业，公元 21 世纪。同一种结构。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: three-column
motifs: [layered-pathways, connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 一个 manager 只能有效沟通 7–15 人——金字塔不是效率最高，是"人是信息瓶颈"下的不得已。罗马军团 Legatus→Centurion→Decurion→Legionary，2000 年同一套逻辑。
  - role: supporting_copy
    literal: AI 是通才+沟通成本归零，纯搬运的中层理由消失了。Block 已在试：CEO 直接管 6000 人。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先问两个问题。第一，为什么不是 CEO 直接管所有人？因为人沟通带宽有限——管理版 Dunbar 数 7-15。第二，为什么要分部门？财务部、法务部、工程部——因为一个人学不会所有专业知识，人的知识有边界。所以组织有两道墙：纵向的层级链（管不过来），横向的部门墙（懂不过来）。这不是效率最高的结构——是人在两种约束下的不得已。两千年没变：罗马军团的指挥链传到现代企业，又加上了部门分工——但底层逻辑一模一样：人是瓶颈。回到 Slide 05——我们说 AI 是搭档不是工具，因为它是通才（没有职业边界）+ 它能理解你（沟通成本接近零）。这两个特质，正好打在金字塔存在的两个理由上。所以搭档不只是帮你干活——它在拆组织的底层逻辑。纯做上传下达的中层，和纯做跨边界搬运的流程环节，理由一起消失了。Block 已经在试。下一页，把透镜转向岗位怎么重新分类。
>
> **Terms:**
> — 纵向瓶颈: 管理带宽 7-15 → 需要层级链；横向瓶颈: 人是窄专家 → 需要部门墙 + 流程接力
> — 通才破界: AI 没有职业边界，跨领域知识一步直通；沟通成本归零: AI 瞬时对齐，不需要中转翻译
> — 罗马军团结构: Legatus→Centurion→Decurion→Legionary，沿用两千年的指挥链逻辑
> — 管理版 Dunbar 数: 一个人能有效管理的直接下属上限约 7–15 人
> — Agent 直连: 沟通成本归零后，顶层可以直接触达底层——纯搬运的中层不再必需
>
> **Takeaway:**
> 两千年，组织结构没变过——因为瓶颈始终是人。AI 让沟通成本归零，纯搬运的中层失去了存在的理由。不是理论——Block 已经在试。

---

## Slide 23: `MeasNot`

**KICKER**: 量度者，不是建造者
**TITLE**: 纯测量、报告、协调的岗位——不是裁掉，是重新定义。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: three-column
motifs: [soft-grid]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: Builder 创造产品（AI 是工具），Seller 获取客户（人际不可替代），Measurer 测量/报告/协调（LLM 核心能力）。
  - role: supporting_copy
    literal: Measurer 不是被裁——质检员→AI 异常处理员、排产员→AI 排产审查员、成本会计→AI 成本决策者。三波冲击：productivity→communication→organization。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> Builder/Seller/Measurer 三分法。Measurer 不是裁掉是重定义:质检员→AI 异常处理员、排产员→AI 排产审查员、成本会计→AI 成本决策者。三波冲击时序:先 productivity、再 communication、后 organization——前两波已发生,第三波刚开始。中国:法院已裁定 AI 不能作为裁员合法理由,但不影响重新设计岗位。
>
> **Terms:**
> — Measurer: 纯测量/报告/协调的岗位
> — 重新定义: 从做测量变成管 AI 测量输出并决策
>
> **Takeaway:**
> 纯测量/报告/协调的岗位不是被裁,是被重新定义成 AI 输出的决策者。

---

## Slide 24: `TwoRiv`

**KICKER**: 不是互相借鉴，是融合
**TITLE**: SDLC 和 BPM。两条河。正在汇成一条。
**VISUAL IDENTITY**: amber-agent/collaborating
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: confluence
motifs: [layered-pathways, connected-nodes]
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items:
  - role: body
    literal: 软件：前提被挖→人从操作者变委托人→Harness Engineering→组织极端扁平。企业 BPM：Framed Autonomy=AI Sandwich，Agentic BPM=Agentic SDLC，四层精确映射。
  - role: supporting_copy
    literal: 同一套工具——Claude Code 上午写代码下午写报告；飞书/钉钉 CLI 化。不是互相借鉴，是收敛到同一 Agent 基础设施上。
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 回顾:软件经历前提被挖、角色重写、组织重构;企业 BPM 完全一样(Framed Autonomy = AI Sandwich、四层精确映射)。而且两边用同一套工具。不是边界模糊,是同一 Agent 基础设施上的收敛。
>
> **Terms:**
> — 收敛: 两个领域被同一套 Agent 工具吸进同一工作模式
> — 同一套工具: Claude Code 上午 coding、下午办公
>
> **Takeaway:**
> SDLC 与 BPM 不是互相借鉴,而是在同一套 Agent 基础设施上融合成一条河。

---

## Slide 25: `YourMov`

**PAGE CLASS**: closing
**TITLE**: 外面都变了。你打算怎么变？
**SUBTITLE**: 我今天没有结论。只有一个问题。
**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: minimal
motifs: []
negative_constraints: [no-logo, no-watermark]
```

**SLIDE BODY**:
```yaml
items: []
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 坦承没有标准答案——不知道你该怎么重组、怎么分工、3 年后架构长什么样。但确定一件事:最系统化管理信息加工的软件业,方法论/角色/组织 5 个月被掀翻;而你的行业也在加工信息。软件是先行样本,你是下一个。留一个问题收尾。
>
> **Terms:**
> — 金丝雀: 先感知空气变化的先行样本
> — 先行样本: 软件业先经历,你紧随其后
>
> **Takeaway:**
> 外面都变了——你打算怎么变?(这是留给听众的唯一问题。)
