---
production:
  pipeline: html-first-v1
identity:
  scheme: mnemonic-v1
---

# Slide Specifications — AI 时代的信息加工变革 (v2)

> 每个版本一份下游文件，也是**管线入口**：Stage 1 解析 `## Slide N` 块生成 JSON。
>
> **上游身份不在这里**：核心隐喻（信息加工链 / ITO）在 `2_backbone/core-metaphor.md`，公式在 `2_backbone/core-formula.md`，约束在 `2_backbone/design-constraints.md`，视觉在 `2_backbone/visual-style/`。
>
> **Render policy**：全册默认 `full-page`。SLIDE BODY 使用 html-first-v1 合约。

---

## Block Map（叙事结构）

**6 Acts, 10 Blocks, 25 Slides**

| Act | Block | Slides | 主线 |
|-----|-------|--------|------|
| 0: Opening | B00_Cover | 01 | 封面 |
| 0: Opening | B01_Opening | 02 | 三年加速度 |
| 1: Software Frontline | B02_WhySoftware | 03-04 | 为什么软件先被颠覆 |
| 1: Software Frontline | B03_PartnerNotTools | 05-06 | 搭档不是工具 |
| 1: Software Frontline | B04_Evidence | 07-09 | 真实证据 |
| 2: Deep Dive | B05_ITOChain | 10-12 | 信息加工链 |
| 2: Deep Dive | B06_RoleCollapse | 13-15 | 角色重组 |
| 3: Business Mirror | B07_Bridge | 16 | 换挡：软件→企业 |
| 3: Business Mirror | B08_BPM | 17-19 | BPM 同构映射 |
| 4: Big Picture | B09_Cases | 20-21 | 两条路，一个结论 |
| 4: Big Picture | B10_Convergence | 22-24 | 组织重构→融合 |
| 5: Closing | B11_Closer | 25 | 开放问题 |

---

## Slide 01: `GoRev`

**VISUAL TYPE**: Title / Opener
**KICKER**: (none)
**TITLE**: AI 时代的信息加工革命
**SUBTITLE**: 从 SDLC 到 BPM，工作方式正在被整体重写

**CONCEPT**:
- **MUST communicate**: 这是全场的封面——一句话立住主题：AI 正在重写一切"信息加工"工作，软件（SDLC）只是第一个被掀翻的样本，传统企业（BPM）紧随其后。基调沉着、有分量，不喧哗。
- **MUST NOT**: 不要堆细节、不要出现数据或案例；封面只承载主标题+副标题+一个统领性意象。不要 hype 感的科技元素（发光球、电路板、机器人）。
- **Bridge from previous**: N/A — 封面。
- **Bridge to next**: 下一页用"三年三级跳"把观众拉进场，证明这不是空谈。
- **Content structure**: 极简封面。大量留白的奶油纸底，主标题大号衬线中文居中偏上，副标题一行居中在其下。最多在标题下方一条极淡的手绘横线 + 一个小琥珀点作锚。

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: AI 时代的信息加工革命
supporting_line: 从 SDLC 到 BPM，工作方式正在被整体重写
callout: 软件是先行样本——你的行业紧随其后
primary_visual:
  placement: full-bleed
  brief: Warm amber-to-cream gradient field covering the full slide background
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: gradient-field
  selection: null
```
> **SPEAKER NOTE**
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

**VISUAL TYPE**: Title / Opener
**KICKER**: 三年
**TITLE**: 从补全一行代码，到接管整个项目。
**SUBTITLE**: 这不是 hype。这是加速度。

**CONCEPT**:
- **MUST communicate**: 过去三年 AI 编程能力以肉眼可见的加速度跃迁——2024 补全一行、2025 写完一个函数、2026 接管整个项目让你去睡觉。这是真实发生的能力跃迁，而且正在往所有"信息加工"领域蔓延。
- **MUST NOT**: 不要让听众以为这只是"又一次 AI 炒作周期"；重点是加速度（二阶变化），不是某个单点能力。
- **Bridge from previous**: N/A — opener
- **Bridge to next**: 既然 AI 进步这么快，为什么偏偏是软件/编程第一个被颠覆？下一页回答。
- **Content structure**: 时间轴（2024→2025→2026），三个光源由弱到强（烛火→灯→太阳），配三段由一行到整项目的代码演化。

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: 从补全一行代码，到接管整个项目。
supporting_line: 这不是 hype。这是加速度。
primary_visual:
  placement: full-bleed
  brief: Amber gradient field suggesting acceleration and forward motion
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: gradient-field
  selection: null
```
> **SPEAKER NOTE**
> **Narrative flow:**
> 用亲历者身份开场——在 AI 行业待了很久，见过多次"狼来了"，但这三年不一样。用三年三级跳（补全一行→写完函数→接管项目）建立加速度感，强调这不是 hype 是真实的加速度，而且正在溢出到所有信息加工领域。
>
> **Terms:**
> — 加速度: 不是"AI 变强了"，而是"变强的速度本身在变快"（二阶变化）
>
> **Takeaway:**
> AI 正在从"帮你写代码"变成"帮你做一切信息加工"，而且速度还在加快。

---

## Slide 03: `WhyCode`

**VISUAL TYPE**: Concept Split
**KICKER**: 为什么是软件先被颠覆
**TITLE**: 两个东西让 AI 学编程比学别的都快。

**CONCEPT**:
- **MUST communicate**: 软件是人类最复杂的脑力劳动之一，却因两个特性成为 AI 第一个学透的领域：一是有编译器给出 0.1 秒的对错反馈，二是 GitHub 上有几十亿行代码当教材。学得快→吸引资本→模型越训越强→开始溢出到其他领域。
- **MUST NOT**: 不要以为"AI 只能做软件"；软件只是第一个被学透的，不是唯一。
- **Bridge from previous**: 承接开场的加速度——为什么这个加速度先出现在软件？
- **Bridge to next**: 溢出到哪里去？下一页给出证据：同一套工具已同时服务编程和办公。
- **Content structure**: 两栏并置（左：编译器绿勾瀑布+反馈环 / 右：海量代码碎片如雨落进知识库），汇聚到中心 AI 核心。

**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-text
left:
  heading: 编译器反馈
  bullets:
    - AI 写得对不对，0.1 秒就知道
    - 反馈循环快，自我纠正效率极高
    - 学得快，进步曲线陡峭
right:
  heading: 海量教材
  bullets:
    - GitHub 上几十亿行代码
    - AI 有读不完的训练数据
    - 进步快→资本涌入→模型更强
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 先讲软件其实很难（把模糊需求一步步加工成精确代码），再抛出两个"作弊"特性：编译器反馈快 + 数据海量。因果链：进步快→资本涌入→模型更强→溢出到那些没那么有逻辑但同样要加工信息的领域。
>
> **Terms:**
> — 反馈循环: 代码写错编译器立刻报错，AI 能极快地自我纠正
> — 溢出: 编程练出的能力扩散到其他信息加工领域
>
> **Takeaway:**
> 软件被先颠覆不是偶然——逻辑性强 + 数据多让 AI 在这里学得最快，然后外溢。

---

## Slide 04: `OneTool`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 同一套工具，两种模式
**TITLE**: Claude Code。Codex Desktop。上午写代码，下午写报告。

**CONCEPT**:
- **MUST communicate**: 2026 年的强 Agent 工具不区分"编程工具"和"办公工具"——同一个 Agent 引擎、同一种工作方式（给任务→Agent 执行→人验收）。开发者已在这条路上跑了三年，白领才刚刚开始。
- **MUST NOT**: 不要以为编程和办公是两套不同的 AI；关键正是它们共用同一套基础设施。
- **Bridge from previous**: 承接"溢出"——溢出的具体载体就是这套共享工具。
- **Bridge to next**: 既然共享，软件行业就是先行样本；下一页给出今天的路线图（讲三件事）。
- **Content structure**: 中心琥珀 Agent 核心，左右分叉（左：黑色终端+程序员剪影 / 右：明亮文档+白领剪影），两侧朝向同一核心。

**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-text
left:
  heading: 编程模式
  bullets:
    - 同一个 Agent 引擎驱动
    - 开发者已在这条路上跑了三年
    - 给任务→Agent 执行→人验收
right:
  heading: 办公模式
  bullets:
    - 同一套工具，只切模式
    - 上午写代码，下午写报告
    - 办公室白领才刚刚开始
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 点出共同特点——不分编程/办公。上午 coding，下午办公，只切模式。工作方式一致：任务 + 上下文→执行→验收。结论：软件是先行样本，白领是下一个，它们经历的是同一件事。
>
> **Terms:**
> — Agent 引擎: 同一个底层能力，换个模式就从写代码变成写报告
> — 先行样本: 软件行业已经历困惑→抗拒→适应→重定位
>
> **Takeaway:**
> 第一次，开发者和白领共用同一套 Agent 基础设施——所以软件的今天就是你的明天。

---

## Slide 05: `NewPart`

**VISUAL TYPE**: Concept Split
**KICKER**: 你多了一个伙伴
**TITLE**: 以前每次技术浪潮，给你换工具。这次给你一个搭档。
**SUBTITLE**: 超级能干。但人还不会跟它协作——这本身就是最大的挑战。

**CONCEPT**:
- **MUST communicate**: 互联网给了你更快的传真。iPhone给了你口袋里的电脑。每次技术浪潮都是「工具升级」——人不变，工具更好。这次不同：AI不只是工具——是能自己做判断、自己执行的**搭档**。左边程序员只懂写代码——产品、测试、运维、汇报都不懂。他是专才，跨出领域就得换人。右边AI——产品、程序、测试、运维、汇报全懂，每样能上手干活。你委派一整件事给它——它理解需求、写代码、跑测试、部署上线、写汇报。全套。不是「帮你更快」——是「帮你做了」。人从没有过这种工作关系。习惯管工具、告诉它每一步怎么做。现在得管搭档——告诉它**要什么**。不是技能升级，是角色转换。挑战不在AI够不够好——在人还不会用搭档。好消息：你多了个超级能干的伙伴。新挑战：不知道怎么配合。两个都是真的。
- **MUST NOT**: 不要预告 BPM/企业/路线图。不出现 SDLC 术语（留给 06）。不要画成「人 vs AI」对抗——是「人 + AI」并肩但不适应。不要把 AI 画得没能力。不要把 AI 画成机器人或威胁性形象。
- **Bridge from previous**: 承接 Slide 04——Claude Code 上午写代码下午写报告，看起来像又一个工具升级。但这一页说清楚：不是。这次是搭档，不是工具。两个量级。
- **Bridge to next**: 这个新搭档最先撞进软件开发——看 SDLC，人以前是怎么想的，现在有了搭档以后旧地图怎么不管用了。下一页。
- **Content structure**: 左右对比构图。左边：一个传统程序员，他是专才，只会写代码。右边：一个 AI 伙伴，通才——产品、程序、测试、运维、汇报五个领域同一搭档完成。专才 → 通才。底部一行字：你多了个超级能干的伙伴——但你还不会配合。两个都是真的。

**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-text
left:
  heading: 人：专才
  bullets:
    - 只懂写代码，一个领域钻得很深
    - 产品、测试、运维、汇报都不懂
    - 跨出领域就得换人
    - 以前每次技术浪潮——换工具
right:
  heading: AI：通才
  bullets:
    - 产品、程序、测试、运维、汇报全懂
    - 每样都能上手干活，不是只会一点
    - 你把一整件事委派给它——全套
    - 这次不一样——给你一个搭档
```

> **SPEAKER NOTE**
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

**VISUAL TYPE**: Framework
**KICKER**: 旧地图只管人
**TITLE**: 瀑布、V 模型、敏捷——画的是人独自怎么走。现在多了一个。
**SUBTITLE**: AIDLC？没人知道长什么样。但大家已经在画了。

**CONCEPT**:
- **MUST communicate**: SDLC——软件开发生命周期——是帮助软件开发的工程流程。1970 年代瀑布——人把需求想清楚，一次性做出来。2001 年敏捷——人想一点做一点，边做边改。不管怎么迭代，前提是一样的：**人在想，人在写，人在验证**。方法论的差异只是「想多少再做」的节奏，不是「谁在想」的分配。现在多了一个搭档——一个通才，产品/程序/测试/运维/汇报全懂。它能写、能测、甚至能替你想一部分。旧地图画的是人独自走的路线——几条岔路（瀑布、敏捷、V 模型），但都假定你是独自上路。AI 加入后，地图上多了一个同行者——怎么分工？谁想多少、谁做多少、谁验多少？这不是某一派方法的危机——是所有旧地图都管不了新路况。AIDLC 打了个问号——**大家还在摸索中，没人知道正确答案，但都在试。** 这不是恐慌，是摸索中的诚实。
- **MUST NOT**: 不要画成楼塌了或地基裂了——旧的结构不是「毁了」，是「不够用了」。不要暗示某一种方法论（瀑布/敏捷）对了或错了。不要把 AI 放在「取代人」的位置——是并列、同行、一起看前方的空白画布。不要恐惧感——是探索感。
- **Bridge from previous**: Slide 05 说这次不是换工具，是多了个什么都懂的搭档。拿软件开发看——这个搭档最先撞进 SDLC，旧地图不管用了。
- **Bridge to next**: 「旧地图不管用」是理论，证据在哪？Martin Fowler 两次 retreat 的亲历者告诉你——下一页。
- **Content structure**: 一面墙上挂着三张褪色的旧地图——瀑布、V 模型、敏捷——都是经典完整但已褪色。人站在墙前，旁边是 AI 伙伴，一起面向前方大片留白画布，上面只有试探性线条和一个问号：「AIDLC？」。

**SLIDE BODY**:
```yaml
schema_version: 1
family: comparison
left:
  heading: 旧地图：人独自走
  bullets:
    - 瀑布：想全部，做全部
    - V 模型：边做边验证
    - 敏捷：想一点做一点
    - 差异只是节奏，不是分工
    - 默认人独自想、写、验
right:
  heading: 新路况：多了一个搭档
  bullets:
    - AI 能写、能测、能替你想
    - 怎么分工？谁做多少？
    - AIDLC 还是问号
    - 旧地图不管用了
    - 新地图正在被画出来
```

> **SPEAKER NOTE**
> **Narrative flow:**
> SDLC 三代演化——瀑布（想全部做全部）、V 模型（边做边验证）、敏捷（想一点做一点）——看似不同，共享同一个前提：人在想，人在写，人在验证。差异只是「想多少再做」的节奏，不是「谁在想」的分配。不止——这些方法还默认每个环节要换人。需求分析师、架构师、程序员、测试工程师——各自的知识边界固定。流程长，不是因为工作本身复杂——是因为每跨一个边界就需要翻译、对齐、确认。旧地图画的不只是「一个人」的路线，是「一群窄专家怎么接力」的路线。而 AI——从 Slide 05 我们已经知道——是通才，没有职业边界。旧地图管不了这种新角色。现在多了一个搭档——它能写、能测、甚至能替你想一部分。旧地图不管用了，不是因为它错了，是因为它画的是人独自走的路线。现在有了同行者——怎么分工？谁想多少、谁做多少、谁验多少？没人知道正确答案。AIDLC 是个问号——但大家已经在摸索了。这不是恐慌，是探索中的诚实。
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

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 五个月，同一群人
**TITLE**: 「不确定多于确定」→「不是 slides，是 production。」
**SUBTITLE**: Martin Fowler，ThoughtWorks 首席科学家。两次 retreat，他召的。

**CONCEPT**:
- **MUST communicate**: Martin Fowler——ThoughtWorks首席科学家，《敏捷宣言》17位签署者之一。他把新一代软件工程大脑召回来两次闭门retreat，同一批人5个月内从试探翻到笃定。Deer Valley（2月）：Annie Vella「不确定多于确定」；Fowler自称「彻底的怀疑者」；Rachel Laycock「AI是放大器」。四个新概念在此诞生。Engelberg（6月）：Greg Herlein「所有人都在production里做，不是slides。争论结束了。」Giles Edwards-Alexander「证据就在这里，不是信徒聚会。」Fowler「满场谈harness engineering——在Utah甚至还不是一个词。」同一群人5个月内的一次集体认知跃迁。disruption的速度，不是渐进改进。
- **MUST NOT**: 不要把 retreat 说成「大会」或「峰会」——是闭门邀请制 Open-Space，Chatham House Rule。不要等同全行业——这群人是早期采用者，方向真实但幅度有选择偏差。
- **Bridge from previous**: Slide 06 说 SDLC 的前提被挖了——那是理论断言。这一页亮最鲜活的亲历证据：同一群顶级大脑，5 个月内从犹豫翻到确信。
- **Bridge to next**: 同一时期旧金山还有一场更大的公开场——Fowler 和 Kent Beck 同台，有硬数据、有 12 万开发者调查，下一页。
- **Content structure**: 左右并置对比——左：Utah 雪山、篝火几人围坐、笔触试探犹豫，角标注「Deer Valley，2026.02」；右：瑞士绿色山谷、发光仪表盘、笔触自信果断，角标注「Engelberg，2026.06」。中间一道粗琥珀箭头标「5 个月」。底部一行大字：Not slides — Production。

**SLIDE BODY**:
```yaml
schema_version: 1
family: quote
quote:
  quote: Not slides — production. The debate is over.
  attribution: Greg Herlein
  context: Engelberg 2026.06
supporting:
  heading: 五个月内，同一群人从犹豫到确信
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 先介绍 Martin Fowler 是谁——ThoughtWorks 首席科学家，2001 年《敏捷宣言》17 位签署者之一，全球软件方法学过去 20 年的灯塔。25 年后同一片 Utah 山，他把新一代大脑召回来——但明确拒绝再写一份宣言。两次 retreat，同一批人。左边的 Deer Valley（2 月，~40 人）：Annie Vella 原话「不确定多于确定，没人搞明白了」。Fowler 自称「彻底的怀疑者」。CTO Rachel Laycock 定性「AI 是放大器——你要么加速交付，要么加速债务」。全场反复问「Rigor 去哪了？没人有同一个答案——但都同意很紧迫」。四个概念在 Utah 诞生（Rigor Relocation、Supervisory Engineering、Cognitive Debt、Three-Tier Split）。右边的 Engelberg（6 月，~60 人）：Greg Herlein 那句成了 retreat 的标志——「所有人都在 production 里做。不是 slides——是 production。AI 会不会改变软件工程的争论，结束了。」Giles Edwards-Alexander 追加「这就是证据。不是信徒聚会。」Fowler 自己都惊讶「满场谈 harness engineering——在 Utah 甚至还不是一个词」。术语弧：2 月还没这个词 → 4 月 Birgitta Böckeler 发里程碑文章 → 5 月被评为「2026 年软件工程最重要的术语之一」→ 6 月全场核心议题。5 个月，同一群人，从「不确定」到「production」。disruption 的速度。
>
> **Terms:**
> — Deer Valley / Engelberg: Fowler 召集的两次闭门 retreat，Chatham House Rule（可引内容不可指认具体发言人），Open-Space 形式
> — Not slides, Production: Greg Herlein 在 Engelberg 的原话，全场最强生产置信信号
> — Harness Engineering: Agent = Model + Harness——人在模型外面建的护栏（测试、类型、linter、LLM-as-judge）
> — 四个 Utah 概念: Rigor Relocation、Supervisory Engineering、Cognitive Debt、Three-Tier Split
>
> **Takeaway:**
> 同一群人、同一个召集人、5 个月内从「不确定多于确定」到「所有人都在 production 里做」——这不是观点之争，是亲历者的集体认知跃迁。disruption 的速度，不是渐进改进。

---

## Slide 08: `BeckFow`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: Agile 的原班人马怎么说
**TITLE**: Beck + Fowler：AI 的量级，大于之前所有变革的总和。

**CONCEPT**:
- **MUST communicate**: 敏捷宣言两位合著者 25 年来首次以 AI 为主题同台。三个信号：AI 量级 > 之前所有变革（微处理器 + OOP + 互联网 + 敏捷）之和；TDD 从"重要"变成"不可协商"的生存技能；中层最危险。Laura Tacho 12万开发者数据：AI 是放大器（好团队 incidents 降 50%，差团队翻倍）。
- **MUST NOT**: 不要把 TDD 当成可选最佳实践；没有测试就驾驭不了 AI 产出的代码。
- **Bridge from previous**: 承接 Deer Valley——同月旧金山的公开大会，有硬数据、CTO 圆桌、12万开发者调查。
- **Bridge to next**: 这些讨论发生时 Fable 5 还没发布；6月它来了，把一切推到新量级。
- **Content structure**: 炉边对话双人剪影 + 舞台琥珀光 + 三个关键词漂浮；右侧 AI Agent 记忆点。

**SLIDE BODY**:
```yaml
schema_version: 1
family: quote
quote:
  quote: Nothing has hit with the magnitude of AI.
  attribution: Martin Fowler
  context: Pragmatic Summit
supporting:
  heading: 敏捷奠基人的判断
```

> **SPEAKER NOTE**
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

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 瓶颈从机器变成了人
**TITLE**: Fable 5 来了。写代码的能力远超一般程序员。

**CONCEPT**:
- **MUST communicate**: Fable 5（2026年6月）不是更强的自动补全，而是把人机关系从"操作者→工具"变成"委托人→执行者"。瓶颈第一次从"机器够不够聪明"变成"人能不能驾驭一个比自己聪明的东西"。
- **MUST NOT**: 不要把它当作"更快的补全"；变的是关系，不只是速度。
- **Bridge from previous**: 承接 Beck+Fowler——他们讨论时 Fable 5 未发布，现在它来了并推高量级。
- **Bridge to next**: 瓶颈变成人，人的角色就必须被重写——进入 Block B。
- **Content structure**: 车内视角——现代汽车驾驶室内部。AI 搭档坐在驾驶位，沉稳自信。人坐在副驾驶，姿态是信任+关注。呼应 Mollick 引语 "I no longer steer. I commission."。瓶颈=人能不能放心把方向盘交给搭档（Trust Gap）。

**SLIDE BODY**:
```yaml
schema_version: 1
family: quote
quote:
  quote: I no longer steer. I commission.
  attribution: Ethan Mollick
  context: on Fable 5
supporting:
  heading: 瓶颈从机器变成了人
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 一线开发者反应不是"哇好快"，而是"我还是不是那个 wizard"。三条引语：Mollick "I commission"、Krieger "wake up to find it done"、Willison "relentlessly proactive，自建截图工具链"。Kieran 命名 AI Sandwich；Jesse "specs matter, code doesn't"。核心：瓶颈从机器变成人。
>
> **Terms:**
> — 委托人 vs 操作者: 从操作工具变成委托任务
> — Trust Gap: 人能否信任一个比自己强的产出
>
> **Takeaway:**
> 瓶颈第一次变成人——能不能驾驭一个比自己聪明的东西。

---

## Slide 10: `InfoProc`

**VISUAL TYPE**: Concept Split
**KICKER**: 信息加工链
**TITLE**: 软件开发就是把需求一步步加工成代码。以前每个环节都是人。

**CONCEPT**:
- **MUST communicate**: 软件开发是一条信息加工链（需求→分析→设计→编码→测试→部署→产品）。以前每个环节不只是一个「人」——经常是**不同的人**：需求分析师、架构师、程序员、测试工程师，各自有知识边界。链条长，很大一块是跨边界的沟通成本。AI 没有职业边界——它同时懂需求、能设计、会编码、会测试。所以它接管中间加工环节后，人只有两个方向：往上游定义"做什么"（架构师、产品经理），或往下游做验收治理（Harness Engineer）。"Build is cheap. Argument is expensive."
- **MUST NOT**: 不要以为人被彻底取代；人是被挤到链条两端，不是消失。
- **Bridge from previous**: 承接"瓶颈变成人"——那人往哪走？这页给出方向。
- **Bridge to next**: 往下游要验收，但 AI 一晚写几千行——人审得过来吗？下一页。
- **Content structure**: 水平链条七节点，中间三节点换成琥珀 AI 核心，左侧人指向上、右侧人指向下。

**SLIDE BODY**:
```yaml
schema_version: 1
family: flow
steps:
  - label: 需求
    body: 往上游：定义做什么。架构师、产品经理。
  - label: AI 加工
    body: AI 接管编码、测试、部分设计。通才一站直通。
  - label: 验收治理
    body: 往下游：建护栏做验收。Harness Engineer。
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 把开发抽象成 ITO 链。以前每个工位不仅是人——还经常是不同的人。需求分析师不懂代码，程序员不了解业务，测试工程师不知道设计决策。所以链条上每一环的产出，到下一环都要「翻译」一遍。流程的很多步骤，本质上是在补偿「窄专家之间无法直接沟通」这个事实。AI 没有这个问题——它是通才，各环节在它内部直接连通。所以它一站接管中间加工。人两条路：往上游（做什么、tradeoff、架构）或往下游（验收标准、护栏、信任）。引 Willison：写代码变便宜了，真正贵的是判断。
>
> **Terms:**
> — 信息加工链 / ITO: 输入→加工→输出，一环的输出是下一环的输入
> — 窄专家 / 通才: 人的知识有边界 → 流程需要跨边界接力；AI 跨领域 → 中间环节在内部一步完成
> — Harness Engineer: 建护栏、做验收的新角色
>
> **Takeaway:**
> AI 占了链条中间，人要么往上游定义，要么往下游治理。

---

## Slide 11: `RevGap`

**VISUAL TYPE**: Concept Split
**KICKER**: 人审不过来了
**TITLE**: AI 一晚上写几千行代码。人还是那个速度在 review。

**CONCEPT**:
- **MUST communicate**: 传统 SDLC 默认"人的信息吞吐恒定"（一天几百行）。AI 把这个前提也炸了——反馈周期从人-paced 变成 AI-paced。核心瓶颈不是"写不够快"，是"审不过来"。Fowler 重定义 Verified：不再是"你读过了"，而是被测试、类型检查器、自动门禁检查过。
- **MUST NOT**: 不要以为多招几个 reviewer 就能解决；这是吞吐量级的错配，不是人手问题。
- **Bridge from previous**: 承接"往下游验收"——但验收速度跟不上产出速度。
- **Bridge to next**: 既然逐行审不可行，就得改成设护栏——human-on-the-loop，下一页。
- **Content structure**: 漏斗——顶部密集代码涌入，底部单滴流出（10:1），出口的小人被淹没。

**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-text
left:
  heading: 人的速度
  bullets:
    - 一天几百行代码
    - 一个 PR 审半小时
    - 一个 sprint 两周
    - 人的信息吞吐恒定
right:
  heading: AI 的速度
  bullets:
    - 一晚上几千行代码
    - 一晚 25 个实验
    - 反馈周期变成 AI-paced
    - 人审不过来，量级错配
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 传统前提是人吞吐恒定：一天几百行、一个 PR 半小时、一个 sprint 两周。AI 一晚几千行、一晚 25 个实验，前提被炸。Fowler 重定义 Verified：从"读过"到"被测试/类型/门禁检查过"。结论：从一对一盯着变成一对多设护栏。
>
> **Terms:**
> — AI-paced: 反馈周期由 AI 产出速度决定，人跟不上
> — Verified: 新含义是被自动门禁验证过，而非人读过
>
> **Takeaway:**
> 真正的瓶颈是人审不过来——必须从盯着改成设护栏。

---

## Slide 12: `OnLoop`

**VISUAL TYPE**: Framework
**KICKER**: 从盯着到设护栏
**TITLE**: Human-in-the-loop 变成 Human-on-the-loop。

**CONCEPT**:
- **MUST communicate**: Kief Morris 框架——in the loop（人逐行 review，不可扩展）→ on the loop（人建护栏，AI 在框内自主）。产出不满意时，修的是 harness，不是 artifact。催生新工种：Supervisory / Harness Engineer / Middle Loop。"Agents are not hard. The Harness is hard."
- **MUST NOT**: 不要以为 on the loop 等于放手不管；人从审产物转为建/修护栏，责任更重。
- **Bridge from previous**: 承接"审不过来"——解法就是从 in 到 on the loop。
- **Bridge to next**: 角色和方法都重写了，组织会怎样？进入 Block C（中层危机）。
- **Content structure**: 上下对比（上 In loop：流水线逐个检查=暗红棕 / 下 On loop：控制台设护栏、Agent 框内自主=绿金）+ 底部三个新工种徽章。

**SLIDE BODY**:
```yaml
schema_version: 1
family: comparison
left:
  heading: In the loop
  bullets:
    - 人逐行 review
    - 不可扩展
    - 一对一盯着每个产出
    - 修的是 artifact
    - 人-paced，瓶颈在人
right:
  heading: On the loop
  bullets:
    - 人建护栏，AI 框内自主
    - Agent 产出不满→修 harness
    - 一对多设护栏
    - Supervisory Eng.
    - Harness Engineer
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 对比两种模式：in the loop 逐行审、不可扩展；on the loop 建护栏、AI 框内自主，产出不满意就修 harness。引 Morris 原句。新工种：Supervisory / Harness Engineering / Middle Loop。OpenAI 案例：3 人 5 月 100 万行、零人手写零人 review、80% 时间花在建 harness。
>
> **Terms:**
> — on the loop: 人在环上而非环中，管护栏不管每一步
> — Harness: lint / 类型 / CI 门禁等自动护栏
>
> **Takeaway:**
> 人从"逐行审产物"升级为"建护栏管 Agent"——修的是 harness，不是产物。

---

## Slide 13: `RiskMid`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 中层最危险
**TITLE**: AI 最先替代的不是不会写代码的人。是只会写代码的人。

**CONCEPT**:
- **MUST communicate**: Three-Tier Developer Split：初级意外安全（AI-native，LLM 是 24/7 导师）；中层真正危机（CRUD/调试正是 AI 进步最快处，又没积累架构判断力）；资深转向架构（Harness Engineer、Agent 编排者）。新稀缺能力是判断力与发现盲区。
- **MUST NOT**: 不要以为"经验越少越先被裁"；被挤压的是只会写代码的中层，不是初级。
- **Bridge from previous**: 组织连锁反应的第一击——角色分层被重排。
- **Bridge to next**: 这不是理论，两家公司已在动，但方式完全不同——下一页 Block vs Cloudflare。
- **Content structure**: 三层地质剖面（顶绿=初级安全 / 中琥珀红=中层受挤 / 底金=资深编排）。

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: AI 最先替代的不是不会写代码的人。是只会写代码的人。
callout: 三层分化：初级安全 · 中层受挤 · 资深转向架构
primary_visual:
  placement: full-bleed
  brief: Gradient field with amber accent emphasizing the risk warning
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: gradient-field
  selection: null
```
> **SPEAKER NOTE**
> **Narrative flow:**
> 三层分化：初级意外安全、中层真正危机、资深转架构。Beck："中层是我最担心的。"Cherny 新稀缺：judgment / taste / dimensionality——模型也有判断力后，人剩下的是发现盲区、问对问题。
>
> **Terms:**
> — Three-Tier Split: 初级 / 中层 / 资深的分化
> — 只会写代码的人: 技能恰好落在 AI 进步最快的区间
>
> **Takeaway:**
> 危险的不是不会写代码的人，是只会写代码、还没长出判断力的中层。

---

## Slide 14: `BlocRes`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 激进重构
**TITLE**: Block：废掉层级，一家公司只留三种人。

**CONCEPT**:
- **MUST communicate**: Jack Dorsey 发布"From Hierarchy to Intelligence"宣言，把传统 5 层管理压成 2-3 层——组织里只留三种角色：IC（纯执行者）、DRI（项目直接负责人）、Player-Coach（既做技术又带团队，不允许纯管理者）。关键：AI agent 做中间协调层，替代传统管理者的"信息传递+资源协调"。**结果**：裁到 ~6000 人后，Q1 2026 仍跑出毛利 $2.91B（+27%）、Rule of 40 = 44；Goose 开源框架（GitHub 39K stars、捐给 Linux Foundation）成了行业基础设施。这是"人怎么协作"的一次激进重写，而且业绩没垮。
- **MUST NOT**: 不要把这页讲成"AI-washing 批判"；主角是"重新定义三种人 + 它跑出了结果"，不是裁员数字。也不要把三角色模型当成已验证的成熟运行（它是宣言/蓝图）。
- **Bridge from previous**: 承接中层危机——第一个真实样本：一位 CEO 敢把 2000 年的层级推倒。
- **Bridge to next**: 同一季度，另一位 CEO 用完全不同的方式重新定义人——下一页 Cloudflare 的精准诊断。
- **Content structure**: 主图=传统金字塔层级坍缩，重组为三个并列角色徽章（IC / DRI / Player-Coach），每个徽章带一句解释，中间用 AI agent 做协调层连接。下方一行 amber 高亮结果。

**SLIDE BODY**:
```yaml
schema_version: 1
family: quote
quote:
  quote: From Hierarchy to Intelligence.
  attribution: Jack Dorsey, Block
  context: "2026"
supporting:
  heading: 三种角色替代五层管理
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 先介绍一下 Block 是谁——就是美国那家支付巨头，原来叫 Square，Twitter 创始人 Jack Dorsey 一手掌舵，你可能用过它旗下的 Cash App。然后讲 Dorsey 干的这件"激进"的事——发布"From Hierarchy to Intelligence"宣言，把传统 5 层管理压成 2-3 层，宣布组织里只留三种角色：IC 纯执行、DRI 项目负责人、Player-Coach 既做技术又带团队（不允许只当经理的人）。最关键的一步：让 AI agent 做中间协调层，接管传统管理者的信息传递和资源协调。这不是空谈——Block 的 Goose 开源 agent 框架（GitHub 39K stars、捐给 Linux Foundation）是公开证据最强的企业 AI 工具之一。而且结果不虚：裁到 ~6000 人后 Q1 2026 还跑出毛利 +27%、Rule of 40 = 44。诚实提醒一句：同期 40% 裁员，独立分析师判主因是成本削减。但今天要你记住的不是裁员，是"重新定义组织里有哪三种人、而且业绩没垮"这件事。
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

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 精准诊断
**TITLE**: Cloudflare：一把尺，把所有人分成三种。

**CONCEPT**:
- **MUST communicate**: Matthew Prince 用 Builder/Seller/Measurer 三分法（溯源 Drucker 1954：只有建造者和销售者产生成果，其余都是成本）重新定义组织里有哪几种人。Builders（创造产品）和 Sellers（获取客户）——AI 难替代；Measurers（测量/报告/协调/审核，如合规/财务/法务/中层管理/内审）——正是 LLM 核心能力，工作被 AI 重塑。Prince 的做法："Displacement, not reduction"——裁量度者、同时创纪录扩招建造者。**结果**：这么"换人"之后，营收 +34% YoY（超预期）、Workers 平台 550 万开发者且以 +100 万/季度加速——公司没缩，是换了副骨架继续长。这把尺任何组织都能拿去用。
- **MUST NOT**: 不要把 Measurer 讲成"该被裁的人"——是工作内容被重新设计（做测量的人→管理 AI 测量输出并决策的人）。也不要把这页讲成"温柔裁员"。
- **Bridge from previous**: 对照上一页 Block 的激进——这是第二种、更精准也更可复用的重新定义人的方式。
- **Bridge to next**: 软件行业讲完了；同样的事正在传统企业发生——进入企业镜像（BPM）。
- **Content structure**: 三栏并列（Builder / Seller / Measurer），每栏一个角色 + 定义 + AI 可替代性标记。底部一行大字 Displacement, not reduction。溯源 Drucker 1954 小标。

**SLIDE BODY**:
```yaml
schema_version: 1
family: quote
quote:
  quote: Displacement, not reduction.
  attribution: Matthew Prince
  context: Cloudflare CEO
supporting:
  heading: 三种人的刻度尺
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 先说 Cloudflare 是谁——全球互联网基础设施公司，你上的网站里大约每五个就有一个靠它做加速和安全防护，属于"看不见但离不开"的那类关键公司。同一季度，它的 CEO Matthew Prince 用完全不同的方式重新定义人——不是推倒层级，而是给你一把尺：Builder / Seller / Measurer。他溯源到 Drucker 1954 的经典——只有建造者（创造产品）和销售者（获取客户）产生成果，其余都是成本。第三种人"量度者"的工作，正是 LLM 最擅长的，所以被 AI 重塑。Prince 的做法是"Displacement, not reduction"：裁量度者、同时创纪录扩招工程师。而且换人之后公司照样长：营收 +34%、Workers 平台 550 万开发者还在加速。这把尺，你回自己公司就能用。
>
> **Terms:**
> — Builder / Seller / Measurer: Prince 溯源 Drucker 1954 的三分法
> — Displacement not reduction: 换一种人替代另一种人，不是单纯砍人
>
> **Takeaway:**
> AI 提升生产力后，另一位 CEO 用一把可复用的尺重新定义组织里有三种人——换掉量度者、扩招建造者之后，营收还涨了 34%。精准的一端，且被结果验证。

---

## Slide 16: `ToBPM`

**VISUAL TYPE**: Section Divider / Bridge
**KICKER**: 换挡
**TITLE**: 软件的故事讲完了。现在，轮到你的行业。
**SUBTITLE**: 同一条信息加工链，只是换了名字

**CONCEPT**:
- **MUST communicate**: 一个明确的换挡信号——前半场讲的软件（SDLC）不是特例，而是"先行样本"；接下来把镜头从科技公司转向传统企业（BPM）。软件先经历的方法论、角色、组织三重重写，正沿着同一条信息加工链向所有行业蔓延。
- **MUST NOT**: 不要引入新数据/新案例（那是下一 Block 的事）；这一页只做叙事转场，让观众在心里完成"这跟我有关"的切换。不要显得像总结页——它是承上启下的枢纽。
- **Bridge from previous**: 承接软件线的收尾（Block vs Cloudflare 两种裁法）——软件行业的连锁反应已经展开。
- **Bridge to next**: 下一页正式建立 SDLC↔BPM 同构：你们公司也在加工信息。
- **Content structure**: 极简中转页，和封面/结尾同一种"停顿页"语言。奶油纸底、大量留白。大号衬线中文标题居中，副标题一行居中在其下。最多一个居中的小琥珀点或极淡的换挡箭头作锚。

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: 软件的故事讲完了。现在，轮到你的行业。
supporting_line: 同一条信息加工链，只是换了名字
callout: 软件是金丝雀——你的行业也在加工信息
primary_visual:
  placement: full-bleed
  brief: Transitional gradient field marking the pivot from software to enterprise
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: gradient-field
  selection: null
```
> **SPEAKER NOTE**
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

**VISUAL TYPE**: Framework
**KICKER**: 你们公司也在加工信息
**TITLE**: 软件有 SDLC。你们公司有 BPM。两条完全同构的信息加工链。

**CONCEPT**:
- **MUST communicate**: 企业业务处理（BPM）与软件开发（SDLC）是完全同构的信息加工链：需求→…→代码 对应 业务信息→…→决策。方法论演进平行（瀑布→敏捷→AI-SDLC vs 泰勒→BPR→BPM→Agentic BPM）。BPM 有 40 年学术传承（1980s MIT → 2026 Dagstuhl），18 位作者发表 Agentic BPM Manifesto，核心概念 Framed Autonomy。
- **MUST NOT**: 这不是类比修辞——是学术与工业界双重验证的同构结论。
- **Bridge from previous**: 从软件跨到企业——把 SDLC 的故事映射过来。
- **Bridge to next**: Framed Autonomy 这个名字值得记住，下一页展开它 = AI Sandwich。
- **Content structure**: 两条平行链，节点间竖虚线一一连接；背后时间轴在 2026 汇合于琥珀点。

**SLIDE BODY**:
```yaml
schema_version: 1
family: comparison
left:
  heading: SDLC（软件开发）
  bullets:
    - 需求→分析→设计
    - 编码→测试→产品
    - 瀑布→敏捷→AI-SDLC
    - 40 年方法论演进
    - 已被 AI 整体重写
right:
  heading: BPM（企业流程）
  bullets:
    - 业务信息→汇总→分析
    - 审批→执行→决策
    - 泰勒→BPR→Agentic BPM
    - Dagstuhl 宣言 2026
    - Framed Autonomy
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 你们公司也在把业务信息加工成决策/文档/工单，结构和 SDLC 一模一样（加工对象、方法论演进、artifact、AI 冲击四行对照）。BPM 非新概念，40 年传承；2026 Dagstuhl 18 位作者发 Agentic BPM Manifesto，核心 Framed Autonomy。
>
> **Terms:**
> — BPM: 业务流程管理，企业版的 SDLC
> — Framed Autonomy: 有框的自主，BPM 侧对 AI 范式的命名
>
> **Takeaway:**
> BPM 和 SDLC 是同一条信息加工链——软件发生的，正在你公司重演。

---

## Slide 18: `FramAut`

**VISUAL TYPE**: Framework
**KICKER**: 有框，才有真正的自主
**TITLE**: Framed Autonomy = 人定边界。Agent 在框内可劲儿干。
**SUBTITLE**: 框不是笼子——是让你敢放手的边界。

**CONCEPT**:
- **MUST communicate**: Dagstuhl18位作者定义Framed Autonomy：对Agent的知识和目标施加限制来约束自主性。关键：「约束」不等于「限制发挥」——明确边界让Agent敢放手干活。像沙盒——知道什么不能碰，框内什么都能试。框内两个Agent：砚——安静写代码/测试/规范，沉稳精确；铸——狂野连接设备/调动资源/跑流程，能量充沛。两种Agent同一个框。框外人手搭框边——信任但关注。两种框：Operational Frame（规定执行序列）和Normative Frame（规定禁止行为）。德国能源网99%成功执行率。BPM叫Framed Autonomy，SDLC叫AI Sandwich——同一件事。框是信任，不是锁。
- **MUST NOT**: 不要把框理解成「限制 Agent 能力」——是「让 Agent 有能力放手干」的前提。不要把框内 Agent 画成无差别小人——是两个性格鲜明的搭档。不要画成笼子或监狱——框是温暖的琥珀色力场，沙盒感。
- **Bridge from previous**: 承接上页点名的 Framed Autonomy，把这一个概念展开——框是什么、框内谁在干什么、为什么有框才有自由。
- **Bridge to next**: Framed Autonomy 落到企业架构，就是四层同时重构——下一页。
- **Content structure**: 主画面=一个温暖的琥珀色几何力场框（透明发光边界，沙盒感）。框内两个 Agent 性格对比鲜明——左边：「砚」——安静坐着写，周围飘着整洁产出；右边：「铸」——站着的，能量充沛，在摆弄设备。框外：一个人一只手轻轻搭在框边。底部两行：有框，才有真正的自主。框不是笼子——是让你敢放手的边界。

**SLIDE BODY**:
```yaml
schema_version: 1
family: split
mode: text-text
left:
  heading: Operational Frame
  bullets:
    - 规定执行序列，像 CI 管道
    - 告诉 Agent 怎么走
    - 砚：在想，在写，在验证
    - 安静沉稳，产出整洁精确
right:
  heading: Normative Frame
  bullets:
    - 规定禁止行为，像编码规范
    - 告诉 Agent 不许碰什么
    - 铸：在搭，在连，在跑
    - 能量充沛，连接设备调动资源
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 给出 Dagstuhl 正式定义。关键翻面——「约束」这个词听起来像限制，但本质是赋能。就像沙盒——因为知道边界在哪，所以框内什么都能试。框内两个 Agent 性格截然不同：砚——安静写代码/写测试/写规范，沉稳精确；铸——狂野地连接设备/调动资源/跑流程。两种 Agent，同一个框，各司其职。框外，人不再紧张地盯着每一步——一只手轻轻搭在框边，信任但关注。两种框：Operational Frame 规定执行序列（像 CI 管道）、Normative Frame 规定禁止行为（像编码规范）。真实验证：德国能源网 meter-to-cash 99% 成功率。BPM 叫 Framed Autonomy，SDLC 叫 AI Sandwich——人定框，Agent 在框内可劲儿干。框是信任，不是锁。
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

**VISUAL TYPE**: Framework
**KICKER**: 四层重构
**TITLE**: 企业 IT 有四层。每一层都在被 AI 重写。

**CONCEPT**:
- **MUST communicate**: 企业 IT 四层都在被重写，且每层与 SDLC 精确对应：前端（Office/飞书/钉钉→Agent 基础设施，最被低估，Nadella"第一个配置的资源是 Office"）、中端（Agentic Orchestration/ProcessOS，Camunda"每个流程都是 legacy"）、后端（CRM/ERP/HCM 变成 Agent 调用的数据源）、治理（Agent 365/AI Control Tower，控制 Agent 身份权限=控制企业 AI）。
- **MUST NOT**: 不要只盯后端系统；前端 Office 层最被低估，却是 Agent 的"家"。
- **Bridge from previous**: 承接 Framed Autonomy——它落到架构就是四层同时重构。
- **Bridge to next**: 有没有真实企业这么做？下一页海外四案例。
- **Content structure**: 四条水平堆叠面板（前端/中端/后端/治理），同一道琥珀波贯穿每层。

**SLIDE BODY**:
```yaml
schema_version: 1
family: cards
cards:
  - label: 前端
    body: Office、飞书、钉钉变成 Agent 基础设施
  - label: 中端
    body: Agentic Orchestration / ProcessOS 重写流程
  - label: 后端
    body: CRM、ERP、HCM 变成 Agent 调用的数据源
  - label: 治理
    body: 控制 Agent 身份权限 = 控制企业 AI
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 四层逐一：前端最被低估（Nadella：Agent 时代第一个配置的资源是 Office；飞书钉钉同日开源 CLI，2500+ API 变原子指令）；中端重写（Camunda ProcessOS 四个 Agent，"每个流程都是 legacy"）；后端记录系统变数据源；治理层决定谁控制 Agent 身份权限。
>
> **Terms:**
> — 前端 = Agent 的家: Office/飞书/钉钉变成 Agent 基础设施
> — 治理层: 控制 Agent 身份与权限 = 控制企业 AI
>
> **Takeaway:**
> 企业 IT 四层都在重写，每一层都能精确映射到 SDLC。

---

## Slide 20: `AllNem`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 唯一有独立第三方验证
**TITLE**: Allianz「Project Nemo」——不是高举高打，是从最窄处跑通，再铺开。

**CONCEPT**:
- **MUST communicate**: 安联（Allianz，全球最大保险集团之一，传统金融巨头、非科技公司）的 Project Nemo 有两个突出点。① 结果与角色迁移：澳洲「食品变质理赔」场景，1 个 planner agent「舵」调度 3 个专才 agent——「核」（承保核对）、「察」（欺诈筛查）、「算」（赔付计算），处理时间从数天→数小时（-80%）；理赔员没被裁，从"逐单处理者"升格为"审 AI 结果、签字负责的签核者"（human-in-the-loop）。② 打法与洞察：首席转型官 Maria Janssen 原话 "We scoped it intentionally"——巨头没有全面铺 AI，而是刻意缩到又窄又高频、金额小（<AUD$500）、边界清楚的场景先跑通、先被独立第三方验证，再向外铺开。这是全 deck 唯一有独立媒体 + 独立评估机构双重佐证的案例。
- **MUST NOT**: 不要说成"全理赔 -80%"——-80% 只限"食品变质 <AUD$500"这一窄类目，车险/健康险扩展仍是意向。不要说成"AI 替代理赔员"——人升格为签核者。
- **Bridge from previous**: 承接四层重构——用一个证据最扎实的真实案例把落地讲透。
- **Bridge to next**: 海外如此，中国呢？下一页中国案例。
- **Content structure**: 单案例深讲。一侧一个克制的"AI 理赔班组"意象：planner「舵」居中，向外发散连到 3 个命名专才 agent（核 / 察 / 算）。另一侧文字主舞台：公司一行介绍 + 两个带标号的突出点。底部小字诚实注脚。

**SLIDE BODY**:
```yaml
schema_version: 1
family: quote
quote:
  quote: We scoped it intentionally.
  attribution: Maria Janssen, CTrO
  context: Allianz Project Nemo
supporting:
  heading: 数天→数小时，理赔员升为签核者
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 只讲一家，但讲透。安联是全球最大保险集团之一，传统金融巨头。Project Nemo 两个突出点：① 一个 planner「舵」指挥 3 个专才 agent——「核」（承保核对）、「察」（欺诈筛查）、「算」（赔付计算）——处理澳洲食品变质理赔，数天→数小时、-80%，理赔员没被裁、升为签核者（human-in-the-loop）；② 打法才是真洞察——首席转型官 Maria Janssen "We scoped it intentionally"，巨头刻意把 AI 缩到极窄高频低值场景先跑通、被独立第三方验证，再铺开。这是全场唯一独立媒体 + 独立机构双重佐证的案例。诚实交代：-80% 只限食品变质 <AUD$500 窄类目，扩展仍是意向——这恰是"缩窄验证"打法的证据，不是减分。
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

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 情报先行
**TITLE**: Maersk：130 年航运巨头，先建数字孪生，再让 AI 上船。
**SUBTITLE**: 不是科技公司。是全球最大的集装箱航运公司。

**CONCEPT**:
- **MUST communicate**: Maersk（1904年丹麦创立）是全球最大航运集团，10万员工、700+艘船、130国运营。跟Allianz「直建agentic」不同，Maersk走第二条路——Process Intelligence First：先建数字孪生、让流程可见，再叠AI。关键约束：海上卫星带宽太贵，AI必须在船上边缘服务器跑——Star Connect平台700艘船实时处理25亿IoT数据点，油耗-9.2%、年省$300M+。Trade & Tariff Studio用AI报关——6000+商品编码自动分类、关税计算、贸易合规监控。Gemini联盟航线网络AI优化——90%准班率，行业平均两倍。两条路，同一个目的地：AI正在重写传统企业的核心流程。
- **MUST NOT**: 不要让听众觉得「航运 AI 只是省油」——报关/文件处理/客服 = 纯粹的信息加工链，跟 SDLC 同构。也不要把 Maersk 讲成「AI 万能」——坦承客服 AI 跟不上运营 AI 的质量，以及 TradeLens 平台失败的教训。
- **Bridge from previous**: 承接 Allianz——第一种路径（直建 agentic、窄处验证）。Maersk 展示第二种路径（情报先行、数字孪生再叠 AI），两者形成对照。
- **Bridge to next**: 两家传统巨头、两条不同的路，结果一样——软件发生的正在所有行业重演。退一步看大局（进入 Part 3：罗马军团散了）。
- **Content structure**: 主图=一艘巨型集装箱船，船身上叠一张发光的数字孪生蓝图，船上 edge AI 核心标记为琥珀色。下方三列要点：油耗/准班率、报关 AI、客服 AI。底部一行 amber 小字：跟 Allianz 不同路，同一个结论。

**SLIDE BODY**:
```yaml
schema_version: 1
family: quote
quote:
  quote: Process Intelligence First — 先建孪生，再上 AI。
  attribution: Maersk Star Connect
  context: 130 年航运巨头
supporting:
  heading: 油耗 -9.2%，年省 $300M+
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 先介绍 Maersk 是谁——130 年丹麦航运巨头，不是科技公司。10 万员工、700+ 艘船——你买的东西很可能坐过它的船。跟 Allianz 对照：Allianz 是「直建 agent、窄处验证」，Maersk 走第二条路「情报先行、再上 AI」——先建数字孪生让流程可见，再往上叠 AI。最独特的约束是海上卫星带宽太贵，AI 不能上云——必须装在船上的边缘服务器。Star Connect 在 700 艘船上处理 25 亿 IoT 数据点，油耗 -9.2%、年省 $300M+（占集团 EBIT 的 8.6%）。Gemini 联盟的航线网络本身是 AI 优化出来的——90% 准班率是行业平均的两倍。报关 AI（Trade & Tariff Studio）是纯信息加工——6000+ 商品编码自动分类，关税自动计算。客服 AI 是人审 AI 回复后一键批准。诚实提两个教训：TradeLens 失败了（$100M+ 投入关闭——竞争对手不愿把数据喂进 Maersk 平台）；客服 AI 还没跟上运营 AI 的质量。但结论不变：一条 130 年的航运公司也在被 AI 重写核心流程。
>
> **Terms:**
> — Process Intelligence First: 先建数字孪生/流程可见性，再叠 AI——与 Allianz「直建 agentic」对照
> — Edge AI（边缘 AI）: AI 推理在船上本地跑，不依赖云——因为卫星带宽太贵太慢
> — Gemini Cooperation: Maersk+Hapag-Lloyd 联盟，AI 优化的枢纽-辐射网络，90% 准班率
> — TradeLens 教训: $100M+ 平台 2023 年关闭——AI 在自有资产上跑赢，在全行业协作平台没那么容易
>
> **Takeaway:**
> 两条路，同一个结论：Allianz 直建 agent、窄处验证；Maersk 先建数字孪生、再叠 AI。130 年的航运巨头和 130 年的保险巨头——都在被 AI 重写核心流程。这不是 demo，是 production。

---

## Slide 22: `RomPyr`

**VISUAL TYPE**: Concept Split
**KICKER**: 两千年的结构
**TITLE**: 组织金字塔不是「效率最高」。是「人是信息瓶颈」下的不得已。
**SUBTITLE**: 罗马军团，公元 1 世纪。现代企业，公元 21 世纪。同一种结构。

**CONCEPT**:
- **MUST communicate**: 一个manager只能有效沟通7–15人（管理版Dunbar数）——纵向瓶颈。横向瓶颈：人是窄专家，知识有边界。律师不懂工程，工程师不懂财务，所以组织必须切部门，流程在不同专家间接力。每个接力点都是摩擦。层级+部门墙不是「效率最高」，是人在两种约束下的不得已。两千年没变——罗马军团Legatus→Centurion→Decurion→Legionary，现代企业同一套逻辑。AI同时打破两层：通才无职业边界，跨领域一步直通；沟通成本接近零，瞬时对齐。Slide05说过——「以前换工具，这次给你搭档」。搭档能拆金字塔——这两个特质正好打在金字塔存在的两个理由上。纯搬运的中层理由消失了。Block已在试——CEO直接管6000人。不是理论。
- **MUST NOT**: 不要把罗马军团画成「古代落后、现代先进」——关键是**结构一模一样**，令人不安。不要让金字塔「倒塌」——是中间层被一道琥珀涟漪轻轻淡化，不是灾难，是重构。不要暗示所有中层都会消失——淡化的是「纯搬运」的层级，不是所有管理者。
- **Bridge from previous**: 从案例拔高到组织理论——两家传统企业之外，退一步看：为什么会有金字塔？答案藏在两千年前。
- **Bridge to next**: 中层若只做搬运就没用了——那到底该怎么重新分类岗位？下一页 Builder/Seller/Measurer。
- **Content structure**: 上半部文字为主，五行递进要点。下半部三栏对比：左栏=罗马军团金字塔；中栏=现代企业金字塔（完全一样的结构）；右栏=同一个金字塔被琥珀涟漪从中间淡化——纯搬运的中间层变半透明，顶层和底层之间出现 Agent 直连。

**SLIDE BODY**:
```yaml
schema_version: 1
family: comparison
left:
  heading: 为什么需要金字塔
  bullets:
    - 管理带宽 7-15 人
    - 人是窄专家，知识有边界
    - 纵向瓶颈：层级链
    - 横向瓶颈：部门墙
    - 两千年没变过
right:
  heading: AI 为什么能打破
  bullets:
    - AI 是通才，没职业边界
    - 沟通成本接近零
    - 纯搬运的中层理由消失
    - 跨边界流程一步直通
    - Block 已在试
```

> **SPEAKER NOTE**
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

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 量度者，不是建造者
**TITLE**: 纯测量、报告、协调的岗位——不是裁掉，是重新定义。

**CONCEPT**:
- **MUST communicate**: Cloudflare 的 Builder/Seller/Measurer 三分法可诊断任何组织：Builders（创造产品，AI 是工具）、Sellers（获取客户，人际不可替代）、Measurers（测量/报告/协调，正是 LLM 核心能力）。Measurers 不是被裁，是重新定义——质检员→AI 异常处理员、排产员→AI 排产审查员、成本会计→AI 成本决策者。三波冲击：productivity→communication→organization。
- **MUST NOT**: 不要把 Measurer 岗位理解成"该裁掉"；是从"做测量"变成"管 AI 测量输出并决策"。
- **Bridge from previous**: 承接罗马军团——给出诊断哪些岗位是纯搬运的工具。
- **Bridge to next**: 两条河（SDLC/BPM）正在汇流——下一页融合。
- **Content structure**: 三列（Builders/Sellers/Measurers）+ 箭头转化（岗位重定义）；底部中国法律注释。

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: 纯测量、报告、协调的岗位——不是裁掉，是重新定义。
callout: 从「做测量」变成「管 AI 测量输出并决策」
primary_visual:
  placement: full-bleed
  brief: Warm gradient suggesting transformation and role evolution
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: gradient-field
  selection: null
```
> **SPEAKER NOTE**
> **Narrative flow:**
> Builder/Seller/Measurer 三分法。Measurer 不是裁掉是重定义：质检员→AI 异常处理员、排产员→AI 排产审查员、成本会计→AI 成本决策者。三波冲击时序：先 productivity、再 communication、后 organization——前两波已发生，第三波刚开始。中国：法院已裁定 AI 不能作为裁员合法理由，但不影响重新设计岗位。
>
> **Terms:**
> — Measurer: 纯测量/报告/协调的岗位
> — 重新定义: 从做测量变成管 AI 测量输出并决策
>
> **Takeaway:**
> 纯测量/报告/协调的岗位不是被裁，是被重新定义成 AI 输出的决策者。

---

## Slide 24: `TwoRiv`

**VISUAL TYPE**: Concept Split
**KICKER**: 不是互相借鉴，是融合
**TITLE**: SDLC 和 BPM。两条河。正在汇成一条。

**CONCEPT**:
- **MUST communicate**: SDLC 和 BPM 经历完全相同的路径——软件侧：前提被挖 → 人从操作者变委托人 → 方法论转向 Harness Engineering → 组织从中层密集变极端扁平；企业 BPM 侧完全一样：Framed Autonomy = AI Sandwich，Agentic BPM = Agentic SDLC，四层架构逐层精确映射。而且两边用同一套工具：Claude Code 上午写代码、下午写报告；飞书/钉钉 CLI 化让 office 变成 Agent 的 terminal。这不是"两个领域边界模糊"，是它们在同一个 Agent 基础设施上收敛。
- **MUST NOT**: 不要理解成"两个领域可以互相借鉴"；是收敛到同一基础设施，不是借鉴。
- **Bridge from previous**: 承接量度者重定义——把软件与企业两条线合流。
- **Bridge to next**: 收敛已成事实，最后抛出开放问题——下一页 closer。
- **Content structure**: 文字为主舞台，核心一句大字压题，下方四行要点。底部一个简洁的单一意象：两条细线（软件 / 企业）在中间汇成一条更粗的琥珀主流。

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: SDLC 和 BPM。两条河。正在汇成一条。
callout: 不是互相借鉴——是同一 Agent 基础设施上的收敛
primary_visual:
  placement: full-bleed
  brief: Gradient field evoking two streams merging into one
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: gradient-field
  selection: null
```
> **SPEAKER NOTE**
> **Narrative flow:**
> 回顾：软件经历前提被挖、角色重写、组织重构；企业 BPM 完全一样（Framed Autonomy = AI Sandwich、四层精确映射）。而且两边用同一套工具。不是边界模糊，是同一 Agent 基础设施上的收敛。
>
> **Terms:**
> — 收敛: 两个领域被同一套 Agent 工具吸进同一工作模式
> — 同一套工具: Claude Code 上午 coding、下午办公
>
> **Takeaway:**
> SDLC 与 BPM 不是互相借鉴，而是在同一套 Agent 基础设施上融合成一条河。

---

## Slide 25: `YourMov`

**VISUAL TYPE**: Closer
**KICKER**: (none)
**TITLE**: 外面都变了。你打算怎么变？
**SUBTITLE**: 我今天没有结论。只有一个问题。

**CONCEPT**:
- **MUST communicate**: 软件开发是煤矿里的金丝雀——它先感觉到空气的变化。软件的方法论、角色、组织在 5 个月内被掀翻；你的行业也在加工信息（看文档、写邮件、填报表、走审批），AI 正在学会做这一切。软件是先行样本，你是下一个。收在一个开放问题，不给结论。
- **MUST NOT**: 不要给出"应该怎么做"的标准答案；这里刻意留白，只留一个问题。
- **Bridge from previous**: 承接收敛——既然一切都在变，把问题抛回给听众。
- **Bridge to next**: N/A — closer
- **Content structure**: 极简结尾页，和封面/中转同一种"停顿页"语言。大量留白。大号衬线中文主问句居中，副标题一行居中在其下。不画插画，只留一个小琥珀点作锚。留白就是收尾。

**SLIDE BODY**:
```yaml
schema_version: 1
family: hero
hero_statement: 外面都变了。你打算怎么变？
supporting_line: 我今天没有结论。只有一个问题。
primary_visual:
  placement: full-bleed
  brief: Minimal gradient — calm, spacious, one amber spark on cream paper
  fit: cover
  focal_point: [0.5, 0.5]
  fallback:
    kind: abstract-pattern
    recipe: gradient-field
  selection: null
```
> **SPEAKER NOTE**
> **Narrative flow:**
> 坦承没有标准答案——不知道你该怎么重组、怎么分工、3 年后架构长什么样。但确定一件事：最系统化管理信息加工的软件业，方法论/角色/组织 5 个月被掀翻；而你的行业也在加工信息。软件是先行样本，你是下一个。留一个问题收尾。
>
> **Terms:**
> — 金丝雀: 先感知空气变化的先行样本
> — 先行样本: 软件业先经历，你紧随其后
>
> **Takeaway:**
> 外面都变了——你打算怎么变？（这是留给听众的唯一问题。）
