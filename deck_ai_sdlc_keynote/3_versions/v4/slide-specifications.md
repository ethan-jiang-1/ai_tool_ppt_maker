---
production:
  pipeline: page-authority-image2-v2
  workflow: framed
identity:
  scheme: mnemonic-v1
---

# Slide Specifications — AI 时代的信息加工变革 (v4)

> 每个版本一份下游文件，也是**管线入口**。
>
> **上游身份不在这里**：核心隐喻（信息加工链 / ITO）在 `2_backbone/core-metaphor.md`，公式在 `2_backbone/core-formula.md`，约束在 `2_backbone/design-constraints.md`，视觉在 `2_backbone/visual-style/`。
>
> **Workflow**：framed — Text Frame 持有 kicker/title/subtitle/callout；Image2 生成无文字 underlay。
>
> **Agent 视觉身份**：通过 VISUAL IDENTITY 字段激活资产链。Slide 的 `amber-agent/<role>` → `image2-reference-material.yaml`（SHA 验证 reference PNG）→ Image2 API `body.images`。6 个具名 Agent role 已在 registry 注册。

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
- **MUST communicate**: 全场封面。AI 正在重写一切"信息加工"工作——软件（SDLC）是第一个被掀翻的样本，传统企业（BPM）紧随其后。基调沉着、有分量，不喧哗。
- **MUST NOT**: 不要堆细节；封面只承载主标题+副标题+一个统领性意象。不要科技 hype 元素。
- **Bridge from previous**: N/A — 封面。
- **Bridge to next**: 下一页用"三年三级跳"把观众拉进场。
- **Content structure**: 极简封面。大量留白，主标题大号衬线居中偏上，副标题一行居中在其下。一条极淡的手绘横线 + 一个小琥珀点作锚。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
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
- **MUST communicate**: 过去三年 AI 编程能力以肉眼可见的加速度跃迁——2024 补全一行、2025 写完一个函数、2026 接管整个项目让你去睡觉。这不是"AI 变强了"，而是"变强的速度本身在变快"（二阶变化），且正在溢出到所有信息加工领域。
- **MUST NOT**: 不要让听众以为这只是"又一次 AI 炒作周期"；重点是加速度，不是单点能力。
- **Bridge from previous**: N/A — opener
- **Bridge to next**: 既然 AI 进步这么快，为什么偏偏是软件/编程第一个？下一页回答。
- **Content structure**: 横轴时间线 2024→2025→2026，三个光源由弱到强（烛火→灯→太阳），配三段由一行到整项目的代码演化。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [layered-pathways]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 用亲历者身份开场。三年三级跳（补全一行→写完函数→接管项目）建立加速度感，强调这不是 hype 是真实的加速度，而且正在溢出到所有信息加工领域。
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
- **MUST communicate**: 软件是人类最复杂的脑力劳动之一，却因两个特性成为 AI 第一个学透的领域：一是有编译器给出 0.1 秒的对错反馈，二是 GitHub 上有几十亿行代码当教材。反馈快→学得快→吸引资本→模型越训越强→开始溢出到其他领域。
- **MUST NOT**: 不要以为"AI 只能做软件"；软件只是第一个被学透的，不是唯一。
- **Bridge from previous**: 承接加速度——为什么这个加速度先出现在软件？
- **Bridge to next**: 溢出到哪里去？下一页：同一套工具同时服务编程和办公。
- **Content structure**: 两栏并置汇聚到中心 AI 核心。左：编译器反馈循环（绿勾 → 快速纠错）。右：海量代码碎片落入知识库。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 软件其实很难（把模糊需求一步步加工成精确代码）。但两个"作弊"特性让 AI 在这里学得飞快：编译器即时反馈 + 海量训练数据。因果链：进步快→资本涌入→模型更强→溢出到那些没那么有逻辑但同样要加工信息的领域。
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
**SUBTITLE**: 第一次，开发者和白领共用同一套 Agent 基础设施。

**CONCEPT**:
- **MUST communicate**: 2026 年的强 Agent 工具不区分"编程工具"和"办公工具"——同一个 Agent 引擎、同一种工作方式（给任务→Agent 执行→人验收）。开发者已在这条路上跑了三年，白领才刚刚开始。软件是先行样本，白领是下一个——它们经历的是同一件事。
- **MUST NOT**: 不要以为编程和办公是两套不同的 AI；关键正是它们共用同一套基础设施。
- **Bridge from previous**: "溢出"的具体载体——共享 Agent 工具。
- **Bridge to next**: 共享→软件行业是先行样本，下一页给出今天的伙伴关系本质。
- **Content structure**: 中心琥珀 Agent 核心，左右分叉（左：终端+程序员 / 右：文档+白领），两侧朝向同一核心。

**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: centered-constellation
motifs: [connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

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
- **MUST communicate**: 互联网给了你更快的传真。iPhone 给了你口袋里的电脑。每次技术浪潮都是「工具升级」——人不变，工具更好。这次不同：AI 不只是工具——是能自己做判断、自己执行的**搭档**。左边程序员只懂写代码——产品、测试、运维、汇报都不懂，跨出领域就得换人。右边 AI——产品、程序、测试、运维、汇报全懂，每样能上手干活。你委派一整件事给它——它理解需求、写代码、跑测试、部署上线、写汇报。全套。不是「帮你更快」——是「帮你做了」。挑战不在 AI 够不够好——在人还不会用搭档。
- **MUST NOT**: 不要画成「人 vs AI」对抗；是「人 + AI」并肩但不适应。不要把 AI 画成机器人或威胁性形象。
- **Bridge from previous**: 承接 Slide 04——同一个引擎看起来像又一个工具升级。但这一页说清楚：不是。这次是搭档，不是工具。
- **Bridge to next**: 这个新搭档最先撞进软件开发——看 SDLC，旧地图怎么不管用了。
- **Content structure**: 左右对比。左：传统程序员，专才，只会写代码。右：AI 伙伴，通才——五个领域同一搭档完成。底部：你多了个超级能干的伙伴——但你还不会配合。

**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: field-of-work
motifs: [shared-work-surface, connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

> **SPEAKER NOTE**
> **Narrative flow:**
> 停一拍。互联网、iPhone——每次都说「这次不一样」，但每次其实都一样：工具升级，人还在中间。这次真不一样。你看左边这个程序员——只懂写代码。产品？测试？运维？汇报？都不懂。不是不行——是专才。右边这个 AI 不同——产品、程序、测试、运维、汇报全都懂，每样都能上手干活。你把一整件事委派给它——全套。不是帮你更快——是帮你**做了**。好消息是你多了一个超级能干的伙伴。新挑战是你不知道怎么配合。两个都是真的。
>
> **Terms:**
> — 专才 vs 通才: 人深耕一个领域，AI 横跨产品/程序/测试/运维/汇报
> — 伙伴关系: AI 从「帮你更快」变成「替你做了」——人的角色从操作者变成委托人
>
> **Takeaway:**
> 这次不一样——不是换了更好的工具，是多了一个什么都懂的搭档。好消息是它超级能干。挑战是你还不会跟它配合。

---

## Slide 06: `OldMap`

**VISUAL TYPE**: Framework
**KICKER**: 旧地图只管人
**TITLE**: 瀑布、V 模型、敏捷——画的是人独自怎么走。现在多了一个。
**SUBTITLE**: AIDLC？没人知道长什么样。但大家已经在画了。

**CONCEPT**:
- **MUST communicate**: SDLC 三代——瀑布（1970s 一次性做出来）、V 模型（边做边验证）、敏捷（2001 想一点做一点）——看似不同，共享同一个前提：**人在想，人在写，人在验证**。差异只是「想多少再做」的节奏，不是「谁在想」的分配。现在多了一个搭档——一个通才，产品/程序/测试/运维/汇报全懂。旧地图画的是人独自走的路线——现在有了同行者。怎么分工？谁想多少、谁做多少、谁验多少？这不是恐慌，是探索中的诚实。
- **MUST NOT**: 不要画成楼塌了——旧结构不是「毁了」，是「不够用了」。不要把 AI 放在「取代人」的位置。不要恐惧感——是探索感。
- **Bridge from previous**: Slide 05 说多了个什么都懂的搭档。拿软件开发看——旧地图不管用了。
- **Bridge to next**: 「旧地图不管用」是理论断言，证据在哪？Martin Fowler 两次 retreat 的亲历者告诉你。
- **Content structure**: 墙上挂着三张褪色的旧地图（瀑布、V 模型、敏捷）。人站在墙前，旁边是 AI 伙伴，一起面向前方大片留白画布，上面只有试探性线条和一个问号：「AIDLC？」。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [layered-pathways]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

> **SPEAKER NOTE**
> **Narrative flow:**
> SDLC 三代演化——瀑布（想全部做全部）、V 模型（边做边验证）、敏捷（想一点做一点）——看似不同，共享同一个前提：人在想，人在写，人在验证。不只是「一个人」的路线——更是「一群窄专家怎么接力」的路线。需求分析师、架构师、程序员、测试工程师——各自的知识边界固定。流程长不是因为工作本身复杂——是因为每跨一个边界就需要翻译、对齐、确认。而 AI——从 Slide 05 我们已经知道——是通才，没有职业边界。旧地图管不了这种新角色。AIDLC 是个问号——但大家已经在摸索了。
>
> **Terms:**
> — SDLC 三代: 瀑布（1970s）、V 模型、敏捷（2001）——都是「人独自走」的路线
> — AIDLC 问号: AI 加入后的新软件生命周期——还没定型，大家正在摸索
>
> **Takeaway:**
> 旧地图画的是人独自怎么走——瀑布、V 模型、敏捷，都是。现在多了一个搭档——新地图还在画，铅笔已经在手里。

---

## Slide 07: `DeerVal`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 五个月，同一群人
**TITLE**: 「不确定多于确定」→「不是 slides，是 production。」
**SUBTITLE**: Martin Fowler，ThoughtWorks 首席科学家。两次 retreat，他召的。

**CONCEPT**:
- **MUST communicate**: Martin Fowler——《敏捷宣言》17 位签署者之一。他把新一代软件工程大脑召回来两次闭门 retreat。Deer Valley（2月）：Annie Vella「不确定多于确定」；Fowler 自称「彻底的怀疑者」。四个新概念在此诞生。Engelberg（6月）：Greg Herlein「所有人都在 production 里做，不是 slides。争论结束了。」同一群人 5 个月内从试探翻到笃定。disruption 的速度，不是渐进改进。
- **MUST NOT**: 不要把 retreat 说成「大会」或「峰会」——是闭门邀请制 Open-Space。
- **Bridge from previous**: Slide 06 说 SDLC 的前提被挖了——那是理论。这一页亮最鲜活的亲历证据。
- **Bridge to next**: 同一时期旧金山还有更大的公开场——有硬数据、12 万开发者调查。
- **Content structure**: 左右并置——左：Utah 雪山、篝火几人围坐、笔触试探犹豫；右：瑞士绿色山谷、自信仪表盘、笔触果断。中间粗琥珀箭头标「5 个月」。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [soft-grid]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> Martin Fowler——ThoughtWorks 首席科学家，2001 年《敏捷宣言》17 位签署者之一。两次 retreat，同一批人。Deer Valley（2月，~40人）：Annie Vella 原话「不确定多于确定」。Fowler 自称「彻底的怀疑者」。四个概念在 Utah 诞生（Rigor Relocation、Supervisory Engineering、Cognitive Debt、Three-Tier Split）。Engelberg（6月，~60人）：Greg Herlein「所有人都在 production 里做。不是 slides——是 production。争论结束了。」术语弧：2 月还没 harness engineering 这个词 → 4 月 Birgitta Böckeler 发里程碑文章 → 5 月被评为最重要术语之一 → 6 月全场核心议题。同一群人，5 个月，从「不确定」到「production」。
>
> **Terms:**
> — Deer Valley / Engelberg: Fowler 召集的两次闭门 retreat，Chatham House Rule
> — Not slides, Production: Greg Herlein 在 Engelberg 的原话
> — 四个 Utah 概念: Rigor Relocation、Supervisory Engineering、Cognitive Debt、Three-Tier Split
>
> **Takeaway:**
> 同一群人、同一个召集人、5 个月内从「不确定多于确定」到「所有人都在 production 里做」——disruption 的速度。

---

## Slide 08: `BeckFow`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: Agile 的原班人马怎么说
**TITLE**: Beck + Fowler：AI 的量级，大于之前所有变革的总和。

**CONCEPT**:
- **MUST communicate**: 敏捷宣言两位合著者 25 年来首次以 AI 为主题同台。三个信号：AI 量级 > 之前所有变革（微处理器 + OOP + 互联网 + 敏捷）之和；TDD 从"重要"变成"不可协商"的生存技能；中层最危险。Laura Tacho 12 万开发者数据：AI 是放大器（好团队 incidents 降 50%，差团队翻倍）。
- **MUST NOT**: 不要把 TDD 当成可选最佳实践；没有测试就驾驭不了 AI 产出的代码。
- **Bridge from previous**: 承接 Deer Valley——同月旧金山的公开大会，有硬数据。
- **Bridge to next**: 这些讨论发生时 Fable 5 还没发布；6 月它来了，把一切推新量级。
- **Content structure**: 炉边对话双人剪影 + 舞台琥珀光 + 三个关键词漂浮。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [soft-grid]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> Kent Beck 和 Martin Fowler 是**敏捷开发的奠基人**——2001 年《敏捷宣言》17 位签署者里的核心两位。Beck 发明了 XP 和 TDD；Fowler 是 ThoughtWorks 首席科学家。**关键分量在于：正是这批"定义了上一场变革的人"，现在说 AI 的量级大于此前所有变革的总和。**场景是 Pragmatic Summit 2026。Fowler：从未有变革有 AI 这个量级。Beck 最担心 Re-Soloing（一人管六个 Agent 关门干活 ≠ 人际结对）与中层。三人（Beck/Fowler/Willison）同一个结论：TDD 不可协商。Laura Tacho 12 万开发者数据佐证：AI 是放大器。
>
> **Terms:**
> — Kent Beck / Martin Fowler: 敏捷开发奠基人
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
**SUBTITLE**: I no longer steer. I commission. — Ethan Mollick

**CONCEPT**:
- **MUST communicate**: Fable 5（2026年6月）不是更强的自动补全——是把人机关系从"操作者→工具"变成"委托人→执行者"。瓶颈第一次从"机器够不够聪明"变成"人能不能驾驭一个比自己聪明的东西"。Mollick "I commission"、Krieger "wake up to find it done"、Willison "relentlessly proactive"。
- **MUST NOT**: 不要把它当作"更快的补全"；变的是关系，不只是速度。
- **Bridge from previous**: 承接 Beck+Fowler——他们讨论时 Fable 5 未发布，现在它来了。
- **Bridge to next**: 瓶颈变成人，人的角色必须被重写——进入 Block B。
- **Content structure**: 现代汽车驾驶室内部。AI 搭档在驾驶位，沉稳自信。人在副驾驶，姿态是信任+关注。仪表盘上手写「Trust Gap」。

**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: field-of-work
motifs: [connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

> **SPEAKER NOTE**
> **Narrative flow:**
> 一线开发者反应不是"哇好快"，而是"我还是不是那个 wizard"。三条引语：Mollick "I commission"、Krieger "wake up to find it done"、Willison "relentlessly proactive，自建截图工具链"。Kieran 命名 AI Sandwich；Jesse "specs matter, code doesn't"。核心：瓶颈从机器变成人——能不能驾驭一个比自己聪明的东西。
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
**SUBTITLE**: Build is cheap. Argument is expensive. — Simon Willison

**CONCEPT**:
- **MUST communicate**: 软件开发是一条信息加工链（需求→分析→设计→编码→测试→部署→产品）。以前每个环节不只是一个人——经常是**不同的人**：需求分析师、架构师、程序员、测试工程师，各自有知识边界。链条长，很大一块是跨边界的沟通成本。AI 没有职业边界——它同时懂需求、能设计、会编码、会测试。所以它接管中间加工环节后，人只有两个方向：往上游定义"做什么"，或往下游做验收治理（Harness Engineer）。
- **MUST NOT**: 不要以为人被彻底取代；人是被挤到链条两端，不是消失。
- **Bridge from previous**: 承接"瓶颈变成人"——那人往哪走？这页给出方向。
- **Bridge to next**: 往下游要验收，但 AI 一晚写几千行——人审得过来吗？
- **Content structure**: 水平链条七节点。中间三个节点（设计、编码、测试）被一个琥珀 AI 椭圆包裹——「AI 通才一站直通」。左端人指向上游，右端人指向下游。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [connected-nodes, layered-pathways]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

> **SPEAKER NOTE**
> **Narrative flow:**
> 把开发抽象成 ITO 链。以前每个工位不仅是人——还经常是不同的人。需求分析师不懂代码，程序员不了解业务，测试工程师不知道设计决策。每一环的产出到下一环都要「翻译」一遍。流程的很多步骤本质上是在补偿「窄专家之间无法直接沟通」。AI 没有这个问题——它是通才，各环节在它内部直接连通。所以它一站接管中间加工。人两条路：往上游（做什么、tradeoff、架构）或往下游（验收标准、护栏、信任）。引 Willison：写代码变便宜了，真正贵的是判断。
>
> **Terms:**
> — 信息加工链 / ITO: 输入→加工→输出，一环输出是下一环输入
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
**SUBTITLE**: 瓶颈不是写不够快——是审不过来。量级错配。

**CONCEPT**:
- **MUST communicate**: 传统 SDLC 默认"人的信息吞吐恒定"（一天几百行）。AI 把这个前提也炸了——反馈周期从人-paced 变成 AI-paced。核心瓶颈不是"写不够快"，是"审不过来"。Fowler 重定义 Verified：不再是"你读过了"，而是被测试、类型检查器、自动门禁检查过。
- **MUST NOT**: 不要以为多招几个 reviewer 就能解决；这是吞吐量级的错配，不是人手问题。
- **Bridge from previous**: 承接"往下游验收"——但验收速度跟不上产出速度。
- **Bridge to next**: 既然逐行审不可行，就得改成设护栏——human-on-the-loop。
- **Content structure**: 大漏斗——顶部密集代码涌入，底部单滴流出（10:1 比例），出口的小人被淹没。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [layered-pathways]
negative_constraints:
  - no-readable-text
  - no-labels
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
**SUBTITLE**: Agents are not hard. The Harness is hard.

**CONCEPT**:
- **MUST communicate**: Kief Morris 框架——in the loop（人逐行 review，不可扩展）→ on the loop（人建护栏，AI 在框内自主）。产出不满意时，修的是 harness，不是 artifact。催生新工种：Supervisory / Harness Engineer / Middle Loop。OpenAI 案例：3 人 5 月 100 万行、零人手写零人 review、80% 时间花在建 harness。
- **MUST NOT**: 不要以为 on the loop 等于放手不管；人从审产物转为建/修护栏，责任更重。
- **Bridge from previous**: 承接"审不过来"——解法就是从 in 到 on the loop。
- **Bridge to next**: 角色和方法都重写了，组织会怎样？进入 Block C（中层危机）。
- **Content structure**: 上下对比。上：In loop——人弯腰逐行检查传送带上的产物。下：On loop——人站直在控制台前调护栏，AI Agent 在琥珀框内自主工作。底部三个新工种徽章。

**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: field-of-work
motifs: [connected-nodes, soft-grid]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/guide
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

> **SPEAKER NOTE**
> **Narrative flow:**
> 对比两种模式：in the loop 逐行审、不可扩展；on the loop 建护栏、AI 框内自主。引 Morris 原句。新工种：Supervisory / Harness Engineering / Middle Loop。OpenAI 案例：3 人 5 月 100 万行、零人手写零人 review、80% 时间花在建 harness。
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
**TITLE**: 不是底层被自动化。这次是中层被拆掉重排。
**SUBTITLE**: 中层负责信息传递和协调——正好是 AI 最擅长的。

**CONCEPT**:
- **MUST communicate**: 传统自动化的叙事是"机器取代体力劳动者"——蓝领被替代。AI 时代的颠覆不同：最危险的恰恰是中层知识工作者。中层的工作本质是信息传递、协调、汇总、翻译——正是 AI 最擅长的事。不是"AI 变聪明取代了判断"——是"AI 让信息流转不再需要那么多中继站"。人被推到两端：上游做决策，下游做验收。中间被压缩。
- **MUST NOT**: 不要画成金字塔倒塌——是结构重组，不是毁灭。不要恐惧叙事——是转型叙事。
- **Bridge from previous**: 承接 on the loop——角色重组，首当其冲的就是中层。
- **Bridge to next**: 中层重组之后，组织的 block 本身在变化——从功能竖井到能力模块。
- **Content structure**: 三层金字塔变两层压缩结构。中层（信息传递）被琥珀色的 AI 中继层替代。人被推到顶层（决策）和底层（验收/执行）。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [layered-pathways, connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 传统自动化替代体力劳动——蓝领先受冲击。AI 不同——它替代的是信息加工和传递，正好是中层知识工作者的核心职能。中层为什么存在？因为信息需要汇总、翻译、传递。当 AI 能瞬间完成这些时，中层的"中继站"功能被压缩。人不是被淘汰——是被推到两端：上游做决策（what & why），下游做验收（did it work）。这不是失业叙事——是角色重排叙事。
>
> **Terms:**
> — 中继站: 中层的信息汇总、翻译、传递功能
> — 两端压缩: 决策端 + 验收端，中间由 AI 连接
>
> **Takeaway:**
> 中层最危险不是因为 AI 更聪明——是因为中层的核心工作是信息传递，而 AI 最擅长的就是这个。

---

## Slide 14: `BlocRes`

**VISUAL TYPE**: Framework
**KICKER**: 从职能竖井到能力模块
**TITLE**: 传统组织是部门墙。AI 驱动的是能力 block——可组合、可重组。

**CONCEPT**:
- **MUST communicate**: 传统组织是职能竖井（silo）——开发、测试、运维、产品各自为政，跨部门靠流程和会议。AI 让组织形态从固定职能变成可组合的能力模块：一个任务 = 调一个 Agent block 组合（写代码 + 跑测试 + 部署 + 汇报），由一个规划者 Agent 编排。组织不再按"谁管谁"设计——按"什么能力和什么能力组合能完成什么结果"设计。
- **MUST NOT**: 不要画成"AI 取代了经理"；是组织形态从固定层级变成动态模块。
- **Bridge from previous**: 中层压缩 → 组织形态从竖井变成模块。
- **Bridge to next**: 这种模块化的一个关键特征是"去行业边界"——下一篇讲云原生与 AI 的对话。
- **Content structure**: 左边：四个并排竖井（Dev/Test/Ops/Product），井壁高，靠箭头连接。右边：可组合的能力 block，一个琥珀色的 orchestrator Agent 编排多个 specialist block。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [connected-nodes, soft-grid]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 传统组织是职能竖井——开发、测试、运维、产品各自为政。跨部门靠流程、靠会议、靠"找人"。这是中层存在的结构性原因。AI 让组织形态从固定职能变成可组合的能力模块。一个任务 = 调一个 Agent block 组合——写代码 + 跑测试 + 部署 + 汇报，由一个 Planner Agent 编排。组织不再按"谁管谁"设计——按"什么能力和什么能力组合能完成什么结果"设计。经理从"管人"变成"管能力组合"。
>
> **Terms:**
> — 职能竖井（Silo）: 传统按职能划分的部门结构
> — 能力 block: 可组合、可重组的 Agent 功能模块
> — Planner Agent: 舵（Duo），调度多个 specialist Agent 完成一个任务
>
> **Takeaway:**
> 组织从"谁管谁"的固定结构变成"什么能力组合能完成什么结果"的动态模块。

---

## Slide 15: `ClouDia`

**VISUAL TYPE**: Concept Split
**KICKER**: 云原生与 AI 原生的对话
**TITLE**: Kelsey Hightower 看了 AI agent 说：「这就是 Kubernetes 的下一章。」

**CONCEPT**:
- **MUST communicate**: 云原生运动（Kubernetes、微服务、声明式基础设施）和 AI 原生运动（Agent 编排、Harness Engineering）共享同一个核心模式：声明你想要的 → 系统自动编排执行 → 你验收结果。K8s 把运维从"ssh 上去手动改"变成"声明 desired state"。Agent 把工作从"每一步怎么做"变成"声明想要的结果"。这不是类比——这是同一个模式在不同层的实现。
- **MUST NOT**: 不要把云原生 AI 说成简单的类比；重点是同构的模式，不是表面相似。
- **Bridge from previous**: 承接能力模块——云原生社区已经经历了一次"声明式"转型，AI 原生正在经历第二次。
- **Bridge to next**: 这个模式从软件延伸到企业——BPM 同构映射。
- **Content structure**: 两栏——左：K8s 集群（声明式编排，desired state → reconciliation loop → actual state）。右：Agent 集群（声明式委托，goal → Agent 自主执行 → 人验收）。结构同构——从"怎么做"到"要什么"。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [connected-nodes, soft-grid]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 云原生和 AI 原生共享同一个核心模式：声明你想要的 → 系统自动编排执行 → 你验收。K8s 把运维从"ssh 上去手动改"变成"声明 desired state，controller 自动 reconcile"。Agent 把工作从"每一步怎么做"变成"声明想要的结果，Agent 自主执行"。这不是类比——这是同一个模式在不同层的实现。理解云原生的人已经活过一次这个转型。
>
> **Terms:**
> — 声明式: 说"我要什么"，不说"怎么做"
> — Reconciliation loop: K8s controller 持续对比 desired state 和 actual state 并修复差异
> — Harness = Agent 的 reconciliation loop
>
> **Takeaway:**
> 从 K8s 到 Agent——同一个模式：「声明你想要的，系统自动编排执行」。理解了云原生，就理解了 AI 原生的下一章。

---

## Slide 16: `ToBPM`

**VISUAL TYPE**: Bridge / Transition
**KICKER**: 换挡
**TITLE**: 软件只是镜子。镜子里照出的模式，你的行业也在经历。
**SUBTITLE**: SDLC 的信息加工链 → BPM 的信息加工链：同构的。

**CONCEPT**:
- **MUST communicate**: 从 Act 1（软件前线）换挡到 Act 2（企业镜像）。前面讲的不是"软件开发的事"——软件开发只是一面镜子。镜子里照出的模式——信息加工链重组、角色重排、中层压缩、组织模块化——正在所有靠信息吃饭的行业发生。BPM（业务流程管理）是传统企业的 SDLC——同样的需求→执行→验收结构，同样的信息加工本质。
- **MUST NOT**: 不要暗示软件和企业是两件不同的事——关键是同构。
- **Bridge from previous**: 从软件前线学到的模式，现在映射到企业。
- **Bridge to next**: 两条链并排对比——SDLC vs BPM，结构一模一样。
- **Content structure**: 一面琥珀色镜子。镜子左边是软件世界（SDLC 链条、Agent、角色重组），镜子右边映出相同的形状但换成企业语言（BPM 链条、RPA→Agent、岗位重组）。镜子本身是一道转换门。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [layered-pathways]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 停一拍。前面讲的是软件——但你心里可能在想"跟我有什么关系"。这一页就是回答：软件开发是一面镜子。同样的模式——信息加工链重组、角色重排、中层压缩——正在你的行业发生。BPM 是传统企业的 SDLC。同样的需求→执行→验收结构，同样的信息加工本质。区别只是语言——SDLC 叫"需求→编码→测试"，BPM 叫"投保→核保→理赔"——但链条是同构的。
>
> **Terms:**
> — BPM: 业务流程管理，传统企业的"SDLC"
> — 同构映射: 软件开发的信息加工模式可以 1:1 映射到任何业务流程
>
> **Takeaway:**
> 软件只是镜子。镜子里照出的模式——信息加工链重组、角色重排——你的行业也在经历。

---

## Slide 17: `TwinChn`

**VISUAL TYPE**: Concept Split
**KICKER**: 两条链，一个结构
**TITLE**: SDLC（需求→编码→测试→部署）和 BPM（投保→核保→理赔→兑付）：同构的。
**SUBTITLE**: AI 在软件里先练了一遍——现在到你了。

**CONCEPT**:
- **MUST communicate**: 软件开发（需求→分析→设计→编码→测试→部署→产品）和业务流程（投保→核保→风控→理赔→兑付→客服）是同构的信息加工链：输入→加工→输出，每个环节本质上都是把信息从一种状态加工成另一种状态。软件行业已经被 AI 先练了一遍——角色重组、中层压缩、on the loop。现在同样的模式正在进入保险、银行、物流等传统行业的业务流程。
- **MUST NOT**: 不要把 SDLC 和 BPM 说成完全等同；它们结构同构但领域语言不同。
- **Bridge from previous**: 镜子照出的具体映射——两条链并排对比。
- **Bridge to next**: 这种同构意味着同样的 Agent 方案能跨行业复用——Allianz 的例子。
- **Content structure**: 上下两条平行的信息加工链。上：SDLC 七节点（两个端节点是人，中间三节点被 AI 椭圆包裹）。下：BPM 六节点（投保/核保/风控/理赔/兑付/客服）——同样两个端节点是人，中间被 AI 椭圆包裹。上下箭头标「同构映射」。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [connected-nodes, layered-pathways]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 两条链并排——SDLC 和 BPM，结构一模一样。保险业是最直观的例子：投保（需求）、核保（分析+设计）、风控（测试的一部分）、理赔（编码+部署+产品交付的合并）。AI 在软件里先练了一遍——学得快因为有编译器反馈。但同样的 Agent 引擎、同样的信息加工能力——现在可以原样搬到保险、银行、物流。不是"类比"——是同一套能力在不同领域语言下的复用。
>
> **Terms:**
> — 同构映射: SDLC 的每一步能找到 BPM 的对应步骤——因为本质都是信息加工
> — 领域语言: 每个行业用不同的词汇描述同一个结构
>
> **Takeaway:**
> AI 在软件里先练了一遍——学得快因为有编译器。现在它带着同一套能力进入你的行业。

---

## Slide 18: `FramAut`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 当 Agent 有了自主权
**TITLE**: 三个 Agent 一组，一整个 sprint 的活自己干完。
**SUBTITLE**: Framed Autonomy——框内完全自主，人只管结果。

**CONCEPT**:
- **MUST communicate**: 不再是一个人配一个 AI 助手——是一个团队配一组 Agent。砚（Yan，写代码+测试+规范）、铸（Zhu，连接设备+调动资源+跑流程）。AI 不只是助手，是可以从 A 到 Z 完成一个完整 sprint 的自主团队。Framed Autonomy 模式：人设定框（验收标准、约束、护栏），Agent 在框内完全自主——从写代码到跑测试到部署到汇报。人只在边界处介入。
- **MUST NOT**: 不要把 Agent 画成"替代人"；是"承担了 sprint 执行"，人承担"定义框"。
- **Bridge from previous**: 同构的链——但需要具体展示 Agent 如何在框内自主运作。
- **Bridge to next**: 这种自主不仅适用于一个团队——可以扩展成四层组织架构。
- **Content structure**: 两个人形 agent 角色并列——一位坐姿执笔（砚），面前是代码和测试；一位站姿伸手连接设备（铸），周围是管道和齿轮。他们周围有一个琥珀色的方框——"Framed Autonomy"。框外一个人，单手调整框的参数。

**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: field-of-work
motifs: [shared-work-surface, connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/collaborating
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

> **SPEAKER NOTE**
> **Narrative flow:**
> 不再是一个人配一个 AI 助手——是一个团队配一组 Agent。砚（Yan）——沉静、精确、写代码/测试/规范，坐姿执笔。铸（Zhu）——行动力、执行力、连接设备/调动资源/跑流程，站姿充满能量。两个 Agent 在有明确边界的框（Framed Autonomy）内完全自主运作——从写代码到跑测试到部署到汇报。人在框外，只管设参数、看结果。就是 on the loop 的具体实现。
>
> **Terms:**
> — Framed Autonomy: Agent 在明确边界内完全自主，人只管设框和验收
> — 砚（Yan）/ 铸（Zhu）: 两个具名 Agent 人格——一个思考型、一个行动型
>
> **Takeaway:**
> Agent 不只是你的助手——它是能在框内自主完成一整个 sprint 的团队成员。

---

## Slide 19: `FourLyr`

**VISUAL TYPE**: Framework
**KICKER**: 从单兵到军团
**TITLE**: Harness 是组织的骨架。Agent 是它的肌肉。人是它的指挥。
**SUBTITLE**: 四层架构——多少个 Agent 配多少人，不是随便放的。

**CONCEPT**:
- **MUST communicate**: AI 时代的组织不是"人和 AI 混在一起"——是有明确分层架构的。Layer 1（决策层）：人——设目标、做 tradeoff。Layer 2（编排层）：舵（Duo）Agent——拆分任务、分配、调度。Layer 3（执行层）：砚（Yan）+ 铸（Zhu）等 specialist Agent——执行具体工作。Layer 4（护栏层）：Harness——测试、类型、lint、LLM-as-judge 自动门禁。每层有明确职责和边界。这就是"企业级 Agent 架构"的蓝图。
- **MUST NOT**: 不要把这画成"人越来越少"的叙事——是"人越来越重要"，但位置变了。
- **Bridge from previous**: 从两个 Agent 的 Framed Autonomy 扩展到四层完整架构。
- **Bridge to next**: 这四层架构在真实企业中得到了验证——Allianz Nemo 案例。
- **Content structure**: 垂直四层架构图，从顶到底：Layer 1（人，暖色）+ Layer 2（舵 Agent，琥珀光体，多条细线连下去）+ Layer 3（砚+铸等 Agent，在各自模块内工作）+ Layer 4（Harness 护栏，琥珀框包围全体，自动门禁标记）。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [layered-pathways, connected-nodes, soft-grid]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 不只是两个 Agent——是一套四层企业级架构。决策层：人——唯一能做取舍的。编排层：舵（Duo）——Planner Agent，拆分任务、分配资源、协调执行。执行层：砚+铸+核+察+算——specialist Agent，各管各的专业领域。护栏层：Harness——自动测试、类型检查、lint、LLM-as-judge——这是组织的骨架。这不是科幻——Allianz 已经在 production 里跑这套架构。
>
> **Terms:**
> — 四层架构: 决策（人）→ 编排（Planner Agent）→ 执行（Specialist Agent）→ 护栏（Harness）
> — 舵（Duo）: Planner Agent，负责任务分解和调度协调
>
> **Takeaway:**
> Harness 是骨架，Agent 是肌肉，人是大脑。四层架构——企业级 Agent 部署的标准蓝图。

---

## Slide 20: `AllNem`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 真实案例
**TITLE**: Allianz Nemo——四个 Agent，一条完整保险价值链。
**SUBTITLE**: 不是 demo。是 production。每天在跑。

**CONCEPT**:
- **MUST communicate**: Allianz 的 Nemo 系统是保险业第一条完全由 Agent 驱动的信息加工链。舵（Duo）——Planner Agent，收到一个理赔请求→分析→拆分→分配给四个 specialist Agent。核（He）做核保检查，察（Cha）做欺诈筛查，算（Suan）做赔付计算。四个 Agent 在一个 Harness 框架内自主协作，人只管异常情况和最终确认。不是 demo——是 production，每天在跑。
- **MUST NOT**: 不要把 Allianz 画成"AI 替代了整个保险公司"——人仍然在决策端和异常处理端。
- **Bridge from previous**: 四层架构的真实案例——Allianz Nemo。
- **Bridge to next**: 另一个案例——Maersk 的 AI 转型，完全不同行业、同一个模式。
- **Content structure**: 舵（Duo）居中——琥珀光体，多条细线辐射连接到外围四个 specialist Agent（核/察/算 + 一个通用执行 Agent），每个在各自的琥珀框内工作。整个场景被一个大的 Harness 框包围。人在框外的观察席。

**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: centered-constellation
motifs: [connected-nodes, shared-work-surface]
negative_constraints:
  - no-readable-text
  - no-labels
```

**VISUAL IDENTITY**: amber-agent/duo
**IDENTITY SUBJECT COUNT**: one
**SUBJECT RESTRICTIONS**: none

> **SPEAKER NOTE**
> **Narrative flow:**
> Allianz Nemo——不是概念验证，是 production system。保险业第一条完全由 Agent 驱动的信息加工链。舵（Duo）是 Planner——理赔请求进来→分析→拆分→分配给四个 specialist。核（He）做核保检查——手持放大镜，逐条确认。察（Cha）做欺诈筛查——数据流前，警觉扫描。算（Suan）做赔付计算——算式前，精确计算。四个 Agent 在一个 Harness 框架内自主协作。人只管异常情况和最终确认。这就是四层架构在真实业务中的形态。
>
> **Terms:**
> — Nemo: Allianz 的 Agent 驱动保险价值链系统
> — 核（He）/ 察（Cha）/ 算（Suan）: 三个 specialist Agent——分别负责核保、欺诈筛查、理赔计算
>
> **Takeaway:**
> 四个 Agent，一条完整保险价值链。不是 demo——是 production。每天在跑。

---

## Slide 21: `MaerAI`

**VISUAL TYPE**: Impact / Evidence
**KICKER**: 另一个行业，同一个模式
**TITLE**: Maersk——全球供应链的 AI 故事讲的也是同一件事。
**SUBTITLE**: 离软件最远的行业。离 AI 最近的结果。

**CONCEPT**:
- **MUST communicate**: Maersk 是全球最大的航运公司——离软件最远的行业。但在 2026 年他们公开了一个完整 AI 转型路线：把全球供应链的每一个信息加工环节（订舱→调度→清关→追踪→结算）都升级成 Agent 驱动的流程。关键洞察：控制论——信息加工能力决定物理世界的效率。同样是"声明→编排→执行→验收"的 Agent 模式，只是领域语言从"代码"变成了"集装箱"。离软件最远的行业——离 AI 最近的结果。
- **MUST NOT**: 不要简化成"AI 取代了人"——Maersk 的转型是人+Agent 的协作升级，不是无人化。
- **Bridge from previous**: Allianz 是保险业案例——Maersk 是航运业案例。不同行业，同一个 Agent 模式。
- **Bridge to next**: 两个案例说明同一结论：AI 不是在抢工作——是在重写"工作"这个词的定义。进入 Act 4 大图景。
- **Content structure**: 一艘大集装箱船的轮廓。船身上的每个集装箱是一个信息加工环节（订舱/调度/清关/追踪/结算），各由一个微型琥珀 Agent 核心标注。船的上方是控制塔——人+Planner Agent 俯瞰全局。

**VISUAL BRIEF**:
```yaml
recipe: collaborative-work
composition: field-of-work
motifs: [soft-grid, connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> Maersk 是全球最大航运公司——集装箱、港口、货船，离软件最远的行业。但他们的 AI 转型路线本质是同一件事：把全球供应链的每一个信息加工环节——订舱、调度、清关、追踪、结算——都升级成 Agent 驱动的流程。控制论的核心洞察：信息加工能力决定物理世界的效率。不是"AI 开船"——是 AI 让信息流转快到能匹配物理世界的节奏。同一个模式——声明→编排→执行→验收——只是领域语言从"代码"变成了"集装箱"。
>
> **Terms:**
> — 控制论: 信息加工效率决定物理系统效率
> — 信息加工环节: 订舱、调度、清关、追踪、结算——每条都是一个 ITO 链
>
> **Takeaway:**
> 离软件最远的行业。离 AI 最近的结果。因为一切行业的本质都是信息加工。

---

## Slide 22: `RomPyr`

**VISUAL TYPE**: Framework
**KICKER**: 组织架构被重写
**TITLE**: 罗马军团→AI 军团。不是类比——是同构。金字塔变成网。
**SUBTITLE**: 信息传递层级 → Agent 协调网。同一个沟通效率，人可以少三层。

**CONCEPT**:
- **MUST communicate**: 罗马军团的组织效率来自清晰的层级——百人队→大队→军团，每一层有明确的指挥和沟通范围。现代企业复制了这个结构——团队→部门→BU→集团。为什么需要层级？信息传递成本。层级=中继站，每层补偿信息衰减。当 AI 消除了信息传递成本，层级本身就成了负债。金字塔被压成网——决策层直接通过 Agent 编排连接到执行层。同样的沟通效率，人可以少三层。这不是"裁人"——是架构本身被重写了。
- **MUST NOT**: 不要说"层级是坏的"——层级在信息成本高的时代是最优解。只是现在成本消失了。
- **Bridge from previous**: 两个案例（Allianz、Maersk）证明跨行业模式——组织架构本身在变。
- **Bridge to next**: 但如何衡量这个变化？旧指标失效了——进入"衡量不出的东西"。
- **Content structure**: 左边：罗马军团金字塔（清晰层级，每层有通信箭头）。右边：AI 时代的网——同样的跨度，层级被琥珀色的 Agent 编排层替代，决策层直接辐射到执行层。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [layered-pathways, connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 罗马军团为什么高效？因为层级清晰——每个人知道向谁汇报、管理幅度可控。现代企业复制了金字塔结构——因为信息传递有成本，层级=中继站，每层补偿衰减。但代价是慢——信息每跨一层就丢一点、慢一点。当 AI 把信息传递成本降到几乎为零——同一个沟通效率，人可以少三层。不是说层级是"错的"——金字塔在信息成本高的时代是最优解。但现在成本消失了。金字塔压成网。架构被重写了。不要把它理解成"裁中层"——把它理解成"架构本身从层级变成了网络"。
>
> **Terms:**
> — 罗马军团: 层级效率的经典模型——百人队→大队→军团
> — 信息传递成本: 层级存在的根本原因——每层是中继站，补偿衰减
> — 网替代金字塔: 信息成本接近零时，层级架构被网络架构替代
>
> **Takeaway:**
> 金字塔不是"错了"——是信息成本高时的最优解。现在成本消失了——网替代了金字塔。

---

## Slide 23: `MeasNot`

**VISUAL TYPE**: Concept Split
**KICKER**: 旧指标全线失效
**TITLE**: 你衡量的是昨天的工作方式。AI 衡量不出新东西。
**SUBTITLE**: 旧地图上没有的新地形——你手里只有旧尺子。

**CONCEPT**:
- **MUST communicate**: 当工作方式从"人写代码"变成"人委托 Agent 写代码"，传统的管理者指标——代码行数、PR 数量、sprint velocity、工时——全部失效。不是"变得不准确"——是"衡量的对象消失了"。一行代码都不写的人可能产出最高——因为他定义的是 Agent 的框。管理从"衡量产出"变成"衡量结果"——但结果往往在旧指标之外。你需要新的衡量体系——但你手里只有旧尺子。这不是度量问题——是认知问题。
- **MUST NOT**: 不要说"不要衡量"——是"要重新定义衡量什么"。
- **Bridge from previous**: 组织架构变了——衡量它的工具也得变。
- **Bridge to next**: 两大趋势（组织重构+衡量重构）正在汇聚——最后两页讲融合。
- **Content structure**: 一个管理者拿着尺子对着 AI 工作流量——尺子上标注着"代码行数、PR 数、velocity"，但尺子下面的工作已经变成了 Agent 编排的网，尺子上的刻度对不上。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: [soft-grid]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 当工作从"人写代码"变成"人委托 Agent 写代码"，所有传统指标全部失效。代码行数？零——但你产出最高。PR 数量？零——但三个 Agent 在 Harness 里跑完了整个 sprint。Sprint velocity？没法算——AI 的速度让"story point"失去了意义。这不是度量工具需要升级——是"衡量的对象"变了。管理从"衡量产出"变成"衡量结果"——但结果往往在旧指标之外。这就是为什么这个转型这么难——你手里只有旧尺子，但面前是新地形。
>
> **Terms:**
> — 旧指标: 代码行数、PR 数量、sprint velocity、工时——衡量"人怎么工作"的指标
> — 新地形: Agent 驱动的工作方式——衡量的对象是"结果"而非"产出过程"
>
> **Takeaway:**
> 旧指标全线失效——不是因为它们不准确，是因为它们衡量的对象消失了。你需要新尺子。

---

## Slide 24: `TwoRiv`

**VISUAL TYPE**: Framework
**KICKER**: 两条河正在汇合
**TITLE**: 组织重构 + AI 原生 = 同一个转型的两面。
**SUBTITLE**: 做组织的人还不知道 AI 能做多少。做 AI 的人还不知道组织的深度。

**CONCEPT**:
- **MUST communicate**: 两条河流正在汇合。左河：组织架构——金字塔变网、中层压缩、职能竖井变能力模块。右河：AI 能力——Agent 自主编排、Harness Engineering、Framed Autonomy。这不是两个独立的趋势——是同一个转型的两面。组织架构在变 BECAUSE AI 让旧架构不再必要。AI 在学做更多 BECAUSE 组织在重写"工作"的定义。汇合处 = 组织能力 + AI 能力协同升级。但实践中有个 gap：做组织的人还不知道 AI 能做多少，做 AI 的人还不知道组织的深度。
- **MUST NOT**: 不要把它讲成"AI 主导一切"；是"组织和 AI 协同进化"。
- **Bridge from previous**: 上一页讲衡量失效——因为两个维度（组织+AI）都在变，光从一个维度看不清楚。
- **Bridge to next**: 最后——你的下一个动作是什么？
- **Content structure**: 两条河从左上和右上汇聚到中央的琥珀核心。左河标注：组织架构（金字塔→网、中层压缩、模块化）。右河标注：AI 能力（Agent 编排、Harness、Framed Autonomy）。汇合处是一个亮的琥珀核心标注：协同升级。两条河之间有桥梁——表示两个群体需要对话。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: left-to-right-flow
motifs: [layered-pathways, connected-nodes]
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 我一直在讲两件事：组织怎么变，AI 怎么变。现在说清楚——这不是两件事，是一件事。组织在变 BECAUSE AI 让旧结构不再必要。AI 在变 BECAUSE 组织在重写"工作"的定义。协同进化。但有个 gap——做组织的人（OD、HR、管理者）不知道 AI 的能力边界在哪；做 AI 的人（工程师、产品经理）不知道组织的设计原则有多深。两条河正在汇合——但中间还有一座桥没建起来。建这座桥的人——就是你们的角色。
>
> **Terms:**
> — 两条河: 组织重构 + AI 原生——同一个转型的两面
> — 协同升级: 组织为 AI 重新设计→AI 在新组织里做更多→组织进一步适配
>
> **Takeaway:**
> 组织重构和 AI 原生不是两个趋势——是一个转型的两面。两条河正在汇合。你站在汇合处。

---

## Slide 25: `YourMov`

**VISUAL TYPE**: Title / Closer
**KICKER**: 所以
**TITLE**: 你的下一步是什么？
**SUBTITLE**: 信息加工正在被整体重写。不是明天——是现在。你的角色在重写的第一页。

**CONCEPT**:
- **MUST communicate**: 结尾。回到主标题——信息加工革命。全场的证据链已经讲完：AI 不是换工具，是换工作方式。不只是软件——是所有靠信息吃饭的行业。把问题还给听众：既然这不是"未来趋势"而是"此刻正在发生"——你的下一步是什么？你的行业里的信息加工链，哪一环节正在被 AI 改写？你打算站在链条的哪一端？
- **MUST NOT**: 不要给出标准答案。不要 hype 或恐吓。不要推荐具体产品。保持开放性——这是思想的开始，不是结论的结束。
- **Bridge from previous**: 全场的逻辑链到此闭合——回到开场的主题，把问题交给听众。
- **Bridge to next**: N/A — closer
- **Content structure**: 极简——回到 Slide 01 的视觉效果（大片留白的奶油纸、居中标题、琥珀横线 + 琥珀点锚），但标题从陈述变成问句。暖色基调，沉着安静——不是鼓动，是邀请。标题下方一个极淡的琥珀问号作锚。

**VISUAL BRIEF**:
```yaml
recipe: editorial-systems
composition: centered-constellation
motifs: []
negative_constraints:
  - no-readable-text
  - no-labels
```

> **SPEAKER NOTE**
> **Narrative flow:**
> 回到开场的主题——信息加工正在被整体重写。全场的证据链已经讲完：AI 不是换工具——是换了工作方式。不只是软件——是所有靠信息吃饭的行业。不要把问题留给"未来"——此刻正在发生。最后把问题还给听众：你的行业里的信息加工链，哪一环节正在被 AI 改写？你打算站在链条的哪一端？不是 hype，不是恐惧——是邀请。邀请你参与这场重写。停顿。结束。
>
> **Terms:**
> — 信息加工革命: 全场的主题词——AI 重写一切信息加工工作
> — 角色重写: 每个知识工作者的角色位置需要重新选择
>
> **Takeaway:**
> 信息加工正在被整体重写。不是明天——是现在。你的下一步是什么？

---
