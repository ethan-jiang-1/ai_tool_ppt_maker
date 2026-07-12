---
title: Slide Specifications — AI 时代的信息加工变革 (v1)
stage: workflow/02-content
position: downstream
type: slide-specifications
summary: 本 deck 的每页四层规格 + Block Map + render policy。管线入口(Stage 1 解析 `## Slide N` 块)。从 deck_ai_sdlc_keynote 迁移重建 25 页。
depends_on:
- workflow/02-content/03-specify-slides-multi-layer.md
- workflow/02-content/02-build-narrative-arc-blocks.md
feeds_into:
- scripts/stage1_build_inputs.mjs
render:
  default: full-page
  header-lock: []
---

# Slide Specifications — AI 时代的信息加工变革 (v1)

> 每个版本一份下游文件,也是**管线入口**:Stage 1 解析 `## Slide N` 块生成 JSON。
>
> **上游身份不在这里**:核心隐喻(信息加工链 / ITO)在 `2_backbone/core-metaphor.md`,公式在 `2_backbone/core-formula.md`,约束在 `2_backbone/design-constraints.md`,视觉在 `2_backbone/visual-style/`。写每页 IMAGE PROMPT 时对照那些,不在这里重复。
>
> **Render policy（2026-07-12 框架同步）**：全册默认 `full-page`，逐页 `RENDER MODE` 仅在确需覆盖 policy 时使用。IMAGE PROMPT 只描述 body/整体构图；结构化 KICKER/TITLE/SUBTITLE 由 Stage 1 注入。

---

## Block Map（叙事结构）

| Block | 目的 | 回答什么问题 | Slides | 证据? |
|-------|------|-------------|--------|-------|
| 封面 | 一句话立主题：AI 重写一切信息加工，软件先行、企业跟进 | 今天到底要讲什么? | 01 | 主标题 + 副标题 |
| Part 0 开场 | 建立 credibility,回答"为什么先颠覆软件",铺垫"共享工具"这个机制 | AI 到底变了多快?跟我这行有什么关系? | 02–05 | 三年三级跳、Claude Code/Codex 同一套工具 |
| Block A: SDLC 被掀翻 | 用两次 retreat + 两位大师 + 新模型,展示 SDLC 的前提被挖 | 软件开发的方法论真被颠覆了吗? | 06–09 | Deer Valley→Engelberg、Beck+Fowler、Fable 5 |
| Block B: 人的角色被重写 | 说明人被挤到加工链两端、瓶颈从机器变成人 | AI 接管加工后,人往哪走? | 10–12 | 信息加工链、Verified 重定义、on-the-loop |
| Block C: 组织的连锁反应 | 中层危机 + 两种极端裁法各展开一页 | 组织会怎么变?谁最危险? | 13–15 | Three-Tier Split、Block 一刀切、Cloudflare 精准置换 |
| 中转: 换挡 | 软件→传统企业的叙事枢纽,软件是先行样本 | 这跟我的行业有什么关系? | 16 | SDLC↔BPM 同一条链 |
| Block D: BPM = SDLC 孪生 | 建立 SDLC↔BPM 同构,证明软件不是特例 | 这跟传统企业有什么关系? | 17–19 | Dagstuhl Manifesto、Framed Autonomy、四层架构 |
| Block E: 案例 | 用真实 production 案例证明不是 demo | 真有传统企业在做吗? | 20–21 | 海外四家 + 中国三家生产级案例 |
| Block F: 罗马军团散了 | 拔高到组织理论,给出"人是信息瓶颈"核心论点 | 金字塔为什么存在?还需要吗? | 22–23 | 信息瓶颈论、Builder/Seller/Measurer |
| Block G: 没有结论,只有问题 | SDLC/BPM 收敛 + 行动号召 | 这一切说明什么?我该怎么办? | 24–25 | 两条河收敛、开放问题收尾 |

### 叙事弧线

观众从"AI 只是程序员的事"这个旁观姿态开始。Part 0 用三年加速度和"同一套工具"把他们拉进场——软件只是先行样本,不是特例。Part 1 制造认知冲突:SDLC 的整个前提被 AI 挖掉,不是工具更好了,而是人的角色、方法论、组织全变了,而且只用了 5 个月。Part 2 完成转折——BPM 跟 SDLC 一模一样,Framed Autonomy = AI Sandwich,同样的事正在你的行业重演,已经有真实企业在 production 里做。Part 3 升华到组织理论:层级是罗马军团时代"人是信息瓶颈"下的遗产,沟通成本归零后金字塔失去存在理由。最后不给结论,只把一个问题抛回观众:外面都变了,你打算怎么变?

---

## Slide Specifications（每页四层规格）

---

## Slide 01: `s01_cover`

**VISUAL TYPE**: Title / Opener


**KICKER**: (none)

**TITLE**: AI 时代的信息加工革命

**SUBTITLE**: 从 SDLC 到 BPM，工作方式正在被整体重写

**CONCEPT**:
- **MUST communicate**: 这是全场的封面——一句话立住主题：AI 正在重写一切"信息加工"工作，软件（SDLC）只是第一个被掀翻的样本，传统企业（BPM）紧随其后。基调沉着、有分量，不喧哗。
- **MUST NOT**: 不要堆细节、不要出现数据或案例；封面只承载主标题+副标题+一个统领性意象。不要 hype 感的科技元素（发光球、电路板、机器人）。
- **Bridge from previous**: N/A — 封面。
- **Bridge to next**: 下一页用"三年三级跳"把观众拉进场，证明这不是空谈。
- **Content structure**: 极简封面。大量留白的奶油纸底，主标题大号衬线中文居中偏上，副标题一行居中在其下。不画丰富素描场景——最多在标题下方一条极淡的手绘横线 + 一个小琥珀点作锚。安静、有分量、留白。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote COVER slide, sketch/etching aesthetic but MINIMAL — this is a title page, calm and spacious, mostly empty cream paper. Cream paper #F5F0EB background, sepia ink #2D1B11, one amber #D97706 accent. Keep the composition calm, centered, and spacious. Use a single thin hand-drawn amber horizontal line and one small amber dot as the only decoration. NO illustrated scene, NO chains, NO nodes, NO diagrams — preserve generous empty space. In the BOTTOM-RIGHT corner, a small, plain, unobtrusive author byline in English: Ethan Jiang (small size, simple sans/serif, sepia ink, modest — like a signature, not a heading). Faint paper texture and a hand-drawn feel is fine. CJK LEGIBILITY: keep all Chinese large and clean; no tiny Chinese. The only small text allowed is the English byline. No logos, no watermarks, no page numbers, no photography, no 3D, no glowing orbs. No blue.
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

## Slide 02: `s02_opening`

**VISUAL TYPE**: Title / Opener


**KICKER**: 三年

**TITLE**: 从补全一行代码，到接管整个项目。

**SUBTITLE**: 这不是 hype。这是加速度。

**CONCEPT**:
- **MUST communicate**: 过去三年 AI 编程能力以肉眼可见的加速度跃迁——2024 补全一行、2025 写完一个函数、2026 接管整个项目让你去睡觉。这是真实发生的能力跃迁,而且正在往所有"信息加工"领域蔓延。
- **MUST NOT**: 不要让听众以为这只是"又一次 AI 炒作周期";重点是加速度(二阶变化),不是某个单点能力。
- **Bridge from previous**: N/A — opener
- **Bridge to next**: 既然 AI 进步这么快,为什么偏偏是软件/编程第一个被颠覆?下一页回答。
- **Content structure**: 时间轴(2024→2025→2026),三个光源由弱到强(烛火→灯→太阳),配三段由一行到整项目的代码演化。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB background, sepia ink #2D1B11, amber #D97706 accents, serif typography. A horizontal timeline drawn in fine sepia ink across the cream paper, left to right: 2024, 2025, 2026. Three light sources sketched along the timeline — 2024 is a tiny candle-flame in faded ink, 2025 is a larger lamp glow, 2026 is a radiating sun-like orb in warm amber wash with etched radial lines. Below the timeline, three code fragments evolve from one-line completion to a full project structure. In the body area, add three medium timeline captions: 2024 — AI 帮你写完这一行。2025 — AI 帮你写完这个函数。2026 — AI 接住整个项目，你去睡觉。 No logos, watermarks. No photography. No blue.
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

## Slide 03: `s03_why_software_first`

**VISUAL TYPE**: Concept Split


**KICKER**: 为什么是软件先被颠覆

**TITLE**: 两个东西让 AI 学编程比学别的都快。

**CONCEPT**:
- **MUST communicate**: 软件是人类最复杂的脑力劳动之一,却因两个特性成为 AI 第一个学透的领域:一是有编译器给出 0.1 秒的对错反馈,二是 GitHub 上有几十亿行代码当教材。学得快→吸引资本→模型越训越强→开始溢出到其他领域。
- **MUST NOT**: 不要以为"AI 只能做软件";软件只是第一个被学透的,不是唯一。
- **Bridge from previous**: 承接开场的加速度——为什么这个加速度先出现在软件?
- **Bridge to next**: 溢出到哪里去?下一页给出证据:同一套工具已同时服务编程和办公。
- **Content structure**: 两栏并置(左:编译器绿勾瀑布+反馈环 / 右:海量代码碎片如雨落进知识库),汇聚到中心 AI 核心。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium Chinese points: 第一，代码有编译器。AI 写得对不对，0.1 秒就知道。这个反馈循环快到离谱。 第二，GitHub 上有几十亿行代码。AI 有读不完的教材。 进步快，资本涌入，模型越训越强，开始溢出到其他领域。 Below the text area, a diagrammatic sketch: left panel — code editor with green checkmarks cascading like waterfall, feedback loop as amber ring. Right panel — countless tiny code fragments falling like rain into knowledge base. Center: both converge at amber AI glow core. No logos. No photography. No blue.
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

## Slide 04: `s04_one_tool_two_modes`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 同一套工具，两种模式

**TITLE**: Claude Code。Codex Desktop。上午写代码，下午写报告。

**CONCEPT**:
- **MUST communicate**: 2026 年的强 Agent 工具不区分"编程工具"和"办公工具"——同一个 Agent 引擎、同一种工作方式(给任务→Agent 执行→人验收)。开发者已在这条路上跑了三年,白领才刚刚开始。
- **MUST NOT**: 不要以为编程和办公是两套不同的 AI;关键正是它们共用同一套基础设施。
- **Bridge from previous**: 承接"溢出"——溢出的具体载体就是这套共享工具。
- **Bridge to next**: 既然共享,软件行业就是先行样本;下一页给出今天的路线图(讲三件事)。
- **Content structure**: 中心琥珀 Agent 核心,左右分叉(左:黑色终端+程序员剪影 / 右:明亮文档+白领剪影),两侧朝向同一核心。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium Chinese points: 同一个 Agent 引擎。同一种工作方式：给出任务，Agent 执行，人验收。 软件开发者已经在这条路上跑了三年。办公室白领才刚刚开始。 Below text: a diagrammatic sketch — central amber diamond core, left branch to dark terminal panel with code symbols and programmer silhouette, right branch to bright document panel with office worker silhouette. Both face the same core. No logos. No blue.
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

## Slide 05: `s05_the_map`

**VISUAL TYPE**: Section Divider


**KICKER**: 今天讲三件事

**TITLE**: 软件发生了什么。传统企业同样的事。大局。

**SUBTITLE**: 我是搞软件的——但如果你不是，别走。

**CONCEPT**:
- **MUST communicate**: 全场三步路线图——(1) 软件前线:SDLC 被掀翻、角色重写、组织冲击;(2) 企业镜像:BPM 与 SDLC 同构;(3) 大局:生产力 × 沟通 × 组织三者皆变,一切重来。
- **MUST NOT**: 不要让非软件听众觉得"这跟我无关"而离场;第二步 BPM 与他们直接相关。
- **Bridge from previous**: 承接"先行样本"——既然软件领先,先看软件。
- **Bridge to next**: 进入第一站:软件的 SDLC 到底被动了什么地基。
- **Content structure**: 手绘三站路线图,像老探险地图/地铁图(站1 代码碎裂 → 站2 办公与代码相扣 → 站3 金字塔变平网),路径由左到右越来越粗。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render three numbered sections: 第一：软件前线。SDLC 被掀翻，角色重写，组织冲击。 第二：企业镜像。BPM 跟 SDLC 一模一样。 第三：大局。生产力 x 沟通 x 组织。三个东西变了，一切重来。 Below text: a hand-drawn three-station route map like old explorer map. Station 1: code symbol breaking apart. Station 2: chain linking office and code. Station 3: pyramid becoming flat grid. Path line grows bolder left to right. Like minimalist hand-drawn subway map. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 自报身份(搞软件的),先安抚非软件听众别走。给出三步框架,强调第二步 BPM 跟你直接相关。第三步拔高到生产力/沟通/组织三大冲击——这三个东西变了,一切重来。
>
> **Terms:**
> — SDLC: 软件开发全生命周期
> — BPM: 企业业务流程管理,与 SDLC 同构
>
> **Takeaway:**
> 今天分三步:软件发生了什么 → 企业同样的事 → 大局,而它们本质是同一件事。



---

## Slide 06: `s06_sdlc_premise_gone`

**VISUAL TYPE**: Framework


**KICKER**: 前提被挖了

**TITLE**: 瀑布、V模型、敏捷——都是同一个前提下的参数变体。

**CONCEPT**:
- **MUST communicate**: 所有传统 SDLC 方法论(瀑布/V/敏捷)看似不同,其实共享同一个前提——"人必须先想清楚,因为程序是确定性的、不会自己想"。瀑布与敏捷只是"想多少再做"的节奏差异。AI 挖掉的不是某个方法论,是这个前提本身。
- **MUST NOT**: 不要把这理解成"敏捷取代瀑布"式的又一次方法论迭代;这次是地基裂了。
- **Bridge from previous**: 承接路线图第一站——软件本来是怎么做的。
- **Bridge to next**: "前提被挖"是理论断言,需要证据;下一页用 Deer Valley→Engelberg 5 个月的亲历给出实证。
- **Content structure**: 一栋三层楼(瀑布/V模型/敏捷)立在同一块地基石上,地基裂开渗出琥珀色光,楼身微倾。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium Chinese points: 前提：人必须先想清楚。程序是确定性的，不会自己想。 1970s 瀑布：想全部做全部。2001 敏捷：想一点做一点。只是节奏不同。 AI 出现后：程序不再需要人完全想清楚。地基裂了。 Below text: a classical building sketch — three floors (Waterfall/V-Model/Agile) on one foundation stone. Below foundation: crack with amber light spilling through. Building tilts slightly. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先讲 SDLC 三代演化(瀑布/V/敏捷)其实是同一件事的三种节奏,共同前提是"人先替确定性的程序想清楚"。再讲 AI 后前提三点崩塌:不必人完全想清楚、输出不再确定、"正确"从符合设计变成符合验收。地基裂→整栋要重建。
>
> **Terms:**
> — SDLC: 软件开发全生命周期
> — 前提: "人必须先替确定性的程序想清楚"——这是所有方法论共享的地基
>
> **Takeaway:**
> AI 挖掉的是"人必须先想清楚"这个共同前提,不是某一个方法论。



---

## Slide 07: `s07_deer_valley_engelberg`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 五个月，从犹豫到确信

**TITLE**: 2026年2月：「可能有点东西。」2026年7月：「证据在握。」

**CONCEPT**:
- **MUST communicate**: Martin Fowler 召集的两次 retreat(2月 Deer Valley、7月 Engelberg)是变革最鲜活的证据。5 个月内,顶尖软件工程大脑的语气从"不确定这是什么"变成"所有人都在生产环境里做"。这是 disruption 的速度,不是渐进改进。
- **MUST NOT**: 不要以为这只是会议观点;关键在于"Not slides, Production"——大家真在生产环境里做。
- **Bridge from previous**: 为"前提被挖"提供亲历证据。
- **Bridge to next**: 同一时期还有一场更大的公开大会(Beck+Fowler 同台)——下一页。
- **Content structure**: 左右对比(左:2月雪山篝火、试探犹豫 / 右:7月瑞士山谷、发光仪表盘、确信),中间琥珀箭头标 5个月。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render this medium evidence line: Not slides。Production。房间里所有人都在生产环境里做。 Below text: split sketch — left: snowy Utah mountains, campfire, tentative ink, Feb 2026 Deer Valley. Right: green Swiss valley, glowing dashboards, confident ink, Jul 2026 Engelberg. Bold amber arrow between them labeled: 5个月. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 25 年前同一片山写出敏捷宣言;如今 Fowler 把新一代大脑召回。2月只有问题、充满犹豫(Rigor Relocation、Supervisory Engineering、Cognitive Debt、Three-Tier Split 概念在此诞生)。7月语气反转:价值就在这里,人人在 production 做,Harness Engineering 成核心议题。
>
> **Terms:**
> — Deer Valley / Engelberg: Fowler 的两次闭门 retreat
> — Not slides, Production: 不是纸上谈兵,是生产环境交付
>
> **Takeaway:**
> 5 个月从"可能有点东西"到"证据在握"——这是颠覆的速度。



---

## Slide 08: `s08_beck_fowler`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: Agile 的原班人马怎么说

**TITLE**: Beck + Fowler：AI 的量级，大于之前所有变革的总和。

**CONCEPT**:
- **MUST communicate**: 敏捷宣言两位合著者 25 年来首次以 AI 为主题同台。三个信号:AI 量级 > 之前所有变革(微处理器 + OOP + 互联网 + 敏捷)之和;TDD 从"重要"变成"不可协商"的生存技能;中层最危险。Laura Tacho 12万开发者数据:AI 是放大器(好团队 incidents↓50%,差团队↑2x)。
- **MUST NOT**: 不要把 TDD 当成可选最佳实践;没有测试就驾驭不了 AI 产出的代码。
- **Bridge from previous**: 承接 Deer Valley——同月旧金山的公开大会,有硬数据、CTO 圆桌、12万开发者调查。
- **Bridge to next**: 这些讨论发生时 Fable 5 还没发布;6月它来了,把一切推到新量级。
- **Content structure**: 炉边对话双人剪影 + 舞台琥珀光 + 三个关键词漂浮;右侧 AI Agent 记忆点。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. At the top of the body area, render one medium Chinese intro in lighter sepia: 这两位是敏捷开发奠基人——2001《敏捷宣言》核心作者，定义了过去 20 年全球软件怎么做。 Below: Nothing has hit with the magnitude of AI. — Fowler。 TDD 不可协商。没有测试，根本驾驭不了 AI 产出的代码。 中层。这是我最担心的。— Beck。 Laura Tacho 12万开发者数据：好团队用 AI，incidents 降 50%；差团队翻倍。 Below text: marginal sketch — two silhouettes in fireside chat, amber stage light, three keywords floating behind. Right margin: tiny AI Agent mnemonic. No logos. No blue.
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

## Slide 09: `s09_fable5_bottleneck`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 瓶颈从机器变成了人

**TITLE**: Fable 5 来了。写代码的能力远超一般程序员。

**CONCEPT**:
- **MUST communicate**: Fable 5(2026年6月)不是更强的自动补全,而是把人机关系从"操作者→工具"变成"委托人→执行者"。瓶颈第一次从"机器够不够聪明"变成"人能不能驾驭一个比自己聪明的东西"。
- **MUST NOT**: 不要把它当作"更快的补全";变的是关系,不只是速度。
- **Bridge from previous**: 承接 Beck+Fowler——他们讨论时 Fable 5 未发布,现在它来了并推高量级。
- **Bridge to next**: 瓶颈变成人,人的角色就必须被重写——进入 Block B。
- **Content structure**: 主仆易位的驾车隐喻——AI 坐上驾驶位在开车（又快又稳），人退到后座、手里拿着一张"任务单/订单"（commission），表情是"它开得比我好……我信得过吗"。画面直接呼应 Mollick 引语 "I no longer steer. I commission."。瓶颈=人能不能放心把方向盘交出去（Trust Gap）。右侧 Trust Gap 记忆点。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. MAIN IMAGE (role-reversal driving metaphor, clear and readable): a hand-drawn car seen from the side. In the DRIVER seat sits an AI figure (a calm, capable silhouette formed from clean code/circuit lines) confidently steering, the road ahead smooth. In the BACK seat sits a HUMAN, holding a small slip of paper labeled 任务单, watching the AI drive with an uncertain expression. An amber caption beside the human: 我不再自己开，我改下订单。— Mollick「I no longer steer. I commission.」 One medium Chinese line under the scene, amber-highlighted: 瓶颈第一次从机器，变成了人——人能不能放心把方向盘交出去。 In the right margin a small mnemonic label: Trust Gap. Keep Chinese medium-or-large and clean; only tiny tags may be English. No logos. No blue.
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

## Slide 10: `s10_the_chain`

**VISUAL TYPE**: Concept Split


**KICKER**: 信息加工链

**TITLE**: 软件开发就是把需求一步步加工成代码。以前每个环节都是人。

**CONCEPT**:
- **MUST communicate**: 软件开发是一条信息加工链(需求→分析→设计→编码→测试→部署→产品)。AI 接管中间加工环节后,人只有两个方向:往上游定义"做什么"(架构师、产品经理),或往下游做验收治理(Harness Engineer)。"Build is cheap. Argument is expensive."
- **MUST NOT**: 不要以为人被彻底取代;人是被挤到链条两端,不是消失。
- **Bridge from previous**: 承接"瓶颈变成人"——那人往哪走?这页给出方向。
- **Bridge to next**: 往下游要验收,但 AI 一晚写几千行——人审得过来吗?下一页。
- **Content structure**: 水平链条七节点,中间三节点换成琥珀 AI 核心,左侧人指向上、右侧人指向下;左侧 Information Chain 记忆点。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium Chinese points: 现在 AI 接管了中间的编码、测试、甚至部分设计。 人往哪走？两条路： 往上：定义做什么。架构师、产品经理。 往下：验收治理。Harness Engineer。 Build is cheap. Argument is expensive. — Simon Willison。 Below text: horizontal chain sketch — seven linked nodes, middle three replaced by amber AI glow cores, left figures pointing up, right figures pointing down. Left margin: tiny Information Chain mnemonic. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 把开发抽象成 ITO 链(输入→加工→输出),以前每个工位都是人。AI 接管中间加工。人两条路:往上游(做什么、tradeoff、架构)或往下游(验收标准、护栏、信任)。引 Willison:写代码变便宜了,真正贵的是判断。
>
> **Terms:**
> — 信息加工链 / ITO: 输入→加工→输出,一环的输出是下一环的输入
> — Harness Engineer: 建护栏、做验收的新角色
>
> **Takeaway:**
> AI 占了链条中间,人要么往上游定义,要么往下游治理。



---

## Slide 11: `s11_too_fast_to_review`

**VISUAL TYPE**: Concept Split


**KICKER**: 人审不过来了

**TITLE**: AI 一晚上写几千行代码。人还是那个速度在 review。

**CONCEPT**:
- **MUST communicate**: 传统 SDLC 默认"人的信息吞吐恒定"(一天几百行)。AI 把这个前提也炸了——反馈周期从人-paced 变成 AI-paced。核心瓶颈不是"写不够快",是"审不过来"。Fowler 重定义 Verified:不再是"你读过了",而是被测试、类型检查器、自动门禁检查过。
- **MUST NOT**: 不要以为多招几个 reviewer 就能解决;这是吞吐量级的错配,不是人手问题。
- **Bridge from previous**: 承接"往下游验收"——但验收速度跟不上产出速度。
- **Bridge to next**: 既然逐行审不可行,就得改成设护栏——human-on-the-loop,下一页。
- **Content structure**: 漏斗——顶部密集代码涌入,底部单滴流出(10:1),出口的小人被淹没;右侧 Communication Bottleneck 记忆点。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium Chinese points: 传统 SDLC 前提：人的信息吞吐速度是恒定的。一天几百行。 AI 把这个前提也炸了。反馈周期从人-paced 变成 AI-paced。 Pull quote: Verified 以前的意思是你读过了。现在必须是被测试、类型检查器、自动门禁检查过。— Martin Fowler。 Below text: a funnel sketch — dense code pouring in at wide top, single drip emerging at narrow bottom, 10:1 ratio. Tiny human silhouette sits at exit, overwhelmed. Right margin: Communication Bottleneck mnemonic. No logos. No blue.
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

## Slide 12: `s12_on_the_loop`

**VISUAL TYPE**: Framework


**KICKER**: 从盯着到设护栏

**TITLE**: Human-in-the-loop 变成 Human-on-the-loop。

**CONCEPT**:
- **MUST communicate**: Kief Morris 框架——in the loop(人逐行 review,不可扩展)→ on the loop(人建护栏,AI 在框内自主)。产出不满意时,修的是 harness,不是 artifact。催生新工种:Supervisory / Harness Engineer / Middle Loop。"Agents are not hard. The Harness is hard."
- **MUST NOT**: 不要以为 on the loop 等于放手不管;人从审产物转为建/修护栏,责任更重。
- **Bridge from previous**: 承接"审不过来"——解法就是从 in 到 on the loop。
- **Bridge to next**: 角色和方法都重写了,组织会怎样?进入 Block C(中层危机)。
- **Content structure**: 上下对比(上 In loop:流水线逐个检查=暗红棕 / 下 On loop:控制台设护栏、Agent 框内自主=绿金)+ 底部三个新工种徽章。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium comparison points: In the loop：人逐行 review。不可扩展。 On the loop：人建护栏。AI 在框内自主。修的是 harness，不是 artifact。— Kief Morris。 新工种：Supervisory Engineer / Harness Engineer / Middle Loop。 Agents are not hard. The Harness is hard. — OpenAI。 Below text: comparison sketch — upper In Loop human inspecting each agent like assembly line (muted red-brown). Lower On Loop human at control console with guardrails, agents autonomous inside (green-gold). Bottom: three job title badges. No logos. No blue.
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

## Slide 13: `s13_mid_pack_at_risk`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 中层最危险

**TITLE**: AI 最先替代的不是不会写代码的人。是只会写代码的人。

**CONCEPT**:
- **MUST communicate**: Three-Tier Developer Split:初级意外安全(AI-native,LLM 是 24/7 导师);中层真正危机(CRUD/调试正是 AI 进步最快处,又没积累架构判断力);资深转向架构(Harness Engineer、Agent 编排者)。新稀缺能力是判断力与发现盲区。
- **MUST NOT**: 不要以为"经验越少越先被裁";被挤压的是只会写代码的中层,不是初级。
- **Bridge from previous**: 组织连锁反应的第一击——角色分层被重排。
- **Bridge to next**: 这不是理论,两家公司已在动,但方式完全不同——下一页 Block vs Cloudflare。
- **Content structure**: 三层地质剖面(顶绿=初级安全 / 中琥珀红=中层受挤 / 底金=资深编排);右侧 Organizational Pyramid 记忆点。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. CJK LEGIBILITY: keep every Chinese phrase at medium-or-large size so glyphs stay clean — avoid tiny footnote-size Chinese. In the body area, create a three-layer geological cross-section sketch, each tier with a LARGE Chinese keyword and a MEDIUM Chinese one-line description (readable at a glance, not tiny): top tier green — 初级：意外安全（AI-native，LLM 是 24/7 导师）; middle tier amber-red, visibly squeezed — 中层：真正危机（CRUD 与调试正是 AI 进步最快处，尚无架构判断力）; bottom tier gold — 资深：转向架构（Harness Engineer、Agent 编排者）. One large pull-quote in Chinese: 中层，这是我最担心的。 with attribution — Kent Beck. Right margin: small English mnemonic label "Organizational Pyramid". Keep the layout uncluttered — a few medium Chinese blocks, not a wall of text. No logos. No blue.
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

## Slide 14: `s14_block_layoff`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 激进重构

**TITLE**: Block：废掉层级，一家公司只留三种人。

**CONCEPT**:
- **MUST communicate**: Jack Dorsey 发布"From Hierarchy to Intelligence"宣言，把传统 5 层管理压成 2-3 层——组织里只留三种角色：IC（纯执行者）、DRI（项目直接负责人）、Player-Coach（既做技术又带团队，不允许纯管理者）。关键：AI agent 做中间协调层，替代传统管理者的"信息传递+资源协调"。**结果**：裁到 ~6000 人后，Q1 2026 仍跑出毛利 $2.91B（+27%）、Rule of 40 = 44；Goose 开源框架（GitHub 39K stars、捐给 Linux Foundation）成了行业基础设施。这是"人怎么协作"的一次激进重写，而且业绩没垮。
- **MUST NOT**: 不要把这页讲成"AI-washing 批判"；主角是"重新定义三种人 + 它跑出了结果"，不是裁员数字。也不要把三角色模型当成已验证的成熟运行（它是宣言/蓝图）。
- **Bridge from previous**: 承接中层危机——第一个真实样本：一位 CEO 敢把 2000 年的层级推倒。
- **Bridge to next**: 同一季度，另一位 CEO 用完全不同的方式重新定义人——下一页 Cloudflare 的精准诊断。
- **Content structure**: 主图=传统金字塔层级坍缩，重组为三个并列角色徽章（IC / DRI / Player-Coach），每个徽章带一句大白话解释，中间用 AI agent 图标做协调层连接。下方一行 amber 高亮"结果"（6000 人跑出 27% 毛利增长 + Goose 成行业基础设施）。角落一个小注脚标注裁员 40% 作为背景（含诚实提醒：主因是成本削减）。amber 强调三角色与结果。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. At the top of the body area, render one medium Chinese company intro in lighter sepia: Block＝美国支付巨头（原 Square，Twitter 创始人 Jack Dorsey 掌舵，Cash App 母公司）。 Below, the main sketch: on the LEFT, a traditional 5-layer management pyramid drawn faintly, collapsing/crumbling. An amber arrow points RIGHT to a new flat arrangement of THREE role badges side by side. Each badge is a hand-drawn card with a medium Chinese role name AND a medium Chinese one-line plain explanation beneath the name: Badge 1 — 「IC 执行者」自己干活，不带人; Badge 2 — 「DRI 负责人」一件事的总扛把子，能拍板但不管人; Badge 3 — 「Player-Coach 球员教练」既自己上手、又带团队，没有只带人的经理. Between and beneath the three badges, a small amber AI-agent glyph acting as the connecting coordination layer (replacing the removed managers). One medium Chinese caption near the badges: 5 层压成 2-3 层，AI 做中间协调层。 Below that, a medium Chinese RESULT line highlighted in amber: 结果：6000 人跑出 27% 毛利增长，Goose 成行业基础设施(GitHub 39K stars)。 In a bottom corner, a small understated footnote in medium Chinese: 背景：同期裁员 40%，独立分析师判主因是成本削减。 Keep Chinese medium-or-large and clean; only tiny tags may be English. No logos. No blue.
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

## Slide 15: `s15_cloudflare_precision`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 精准诊断

**TITLE**: Cloudflare：一把尺，把所有人分成三种。

**CONCEPT**:
- **MUST communicate**: Matthew Prince 用 Builder/Seller/Measurer 三分法（溯源 Drucker 1954：只有建造者和销售者产生成果，其余都是成本）重新定义组织里有哪几种人。Builders（创造产品）和 Sellers（获取客户）——AI 难替代；Measurers（测量/报告/协调/审核，如合规/财务/法务/中层管理/内审）——正是 LLM 核心能力，工作被 AI 重塑。Prince 的做法："Displacement, not reduction"——裁量度者、同时创纪录扩招建造者。**结果**：这么"换人"之后，营收 +34% YoY（超预期）、Workers 平台 550 万开发者且以 +100 万/季度加速——公司没缩，是换了副骨架继续长。这把尺任何组织都能拿去用。
- **MUST NOT**: 不要把 Measurer 讲成"该被裁的人"——是工作内容被重新设计（做测量的人→管理 AI 测量输出并决策的人）。也不要把这页讲成"温柔裁员"。
- **Bridge from previous**: 对照上一页 Block 的激进——这是第二种、更精准也更可复用的重新定义人的方式。
- **Bridge to next**: 软件行业讲完了；同样的事正在传统企业发生——进入企业镜像（BPM）。
- **Content structure**: 三栏并列（Builder / Seller / Measurer），每栏一个角色徽章 + 一句定义 + AI 可替代性标记（Builder/Seller 低=保留，Measurer 高=重塑）。三栏下方一行 amber 高亮"结果"（营收 +34%、Workers 550 万开发者加速）。底部一行大字 Displacement, not reduction。溯源 Drucker 1954 小标。弱化裁员意象，突出"三种人的尺 + 换人后照样增长"。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. At the top of the body area, render one medium Chinese company intro in lighter sepia: Cloudflare＝全球互联网基础设施公司（全世界约五分之一网站靠它做加速和安全防护）。 Below, THREE columns side by side, each a hand-drawn card with a medium Chinese role label and one-line definition: Column 1「Builders 建造者」创造产品的人 (mark: AI 难替代·保留); Column 2「Sellers 销售者」获取客户的人 (mark: AI 难替代·保留); Column 3「Measurers 量度者」测量·报告·协调的人 (mark: AI 重塑·重新设计). The Measurer column subtly highlighted in amber to show it is the one being reshaped. A small line under the three columns: 溯源 Drucker 1954：只有建造者和销售者产生成果。 A medium Chinese RESULT line highlighted in amber: 结果：裁量度者+扩招工程师后，营收 +34%、Workers 平台 550 万开发者仍在加速。 One large amber phrase at the bottom: Displacement, not reduction. Keep Chinese medium-or-large and clean; only tiny tags may be English. No logos. No blue.
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

## Slide 16: `s16_sdlc_to_bpm_bridge`

**VISUAL TYPE**: Section Divider / Bridge


**KICKER**: 换挡

**TITLE**: 软件的故事讲完了。现在，轮到你的行业。

**SUBTITLE**: 同一条信息加工链，只是换了名字

**CONCEPT**:
- **MUST communicate**: 一个明确的换挡信号——前半场讲的软件（SDLC）不是特例，而是"先行样本"；接下来把镜头从科技公司转向传统企业（BPM）。软件先经历的方法论、角色、组织三重重写，正沿着同一条信息加工链向所有行业蔓延。
- **MUST NOT**: 不要引入新数据/新案例（那是下一 Block 的事）；这一页只做叙事转场，让观众在心里完成"这跟我有关"的切换。不要显得像总结页——它是承上启下的枢纽。
- **Bridge from previous**: 承接软件线的收尾（Block vs Cloudflare 两种裁法）——软件行业的连锁反应已经展开。
- **Bridge to next**: 下一页正式建立 SDLC↔BPM 同构：你们公司也在加工信息。
- **Content structure**: 极简中转页，和封面/结尾同一种"停顿页"语言。奶油纸底、大量留白。大号衬线中文标题居中，副标题一行居中在其下。不画河流/链条场景——最多一个居中的小琥珀点或极淡的换挡箭头作锚。让观众停一拍。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote TRANSITION slide, sketch/etching aesthetic but MINIMAL — a pause page, calm and spacious, mostly empty cream paper, matching the cover's visual language. Cream paper #F5F0EB background, sepia ink #2D1B11, one amber #D97706 accent. Keep the composition calm, centered, and spacious. The ONLY decoration is one small centered amber dot or a single faint hand-drawn arrow suggesting a gear-shift/pivot. NO river scene, NO chains of nodes, NO diagrams, NO side-by-side labels — preserve generous empty space. In the BOTTOM-RIGHT corner, a small, plain, unobtrusive author byline in English: Ethan Jiang (small size, simple sans/serif, sepia ink, modest — like a signature, not a heading). CJK LEGIBILITY: keep all Chinese large and clean; no tiny Chinese. The only small text allowed is the English byline. No logos, no watermarks, no page numbers, no photography, no 3D. No blue.
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

## Slide 17: `s17_bpm_sdlc_twin`

**VISUAL TYPE**: Framework


**KICKER**: 你们公司也在加工信息

**TITLE**: 软件有 SDLC。你们公司有 BPM。两条完全同构的信息加工链。

**CONCEPT**:
- **MUST communicate**: 企业业务处理(BPM)与软件开发(SDLC)是完全同构的信息加工链:需求→…→代码 对应 业务信息→…→决策。方法论演进平行(瀑布→敏捷→AI-SDLC vs 泰勒→BPR→BPM→Agentic BPM)。BPM 有 40 年学术传承(1980s MIT → 2026 Dagstuhl),18 位作者发表 Agentic BPM Manifesto,核心概念 Framed Autonomy。
- **MUST NOT**: 这不是类比修辞——是学术与工业界双重验证的同构结论。
- **Bridge from previous**: 从软件跨到企业——把 SDLC 的故事映射过来。
- **Bridge to next**: Framed Autonomy 这个名字值得记住,下一页展开它 = AI Sandwich。
- **Content structure**: 两条平行链,节点间竖虚线一一连接;背后时间轴在 2026 汇合于琥珀点。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium Chinese points: SDLC：需求到分析到设计到编码到测试到产品。 BPM：业务信息到汇总到分析到审批到执行到决策。 BPM 不是新概念。从 1980 年代 MIT 到 2026 年 Dagstuhl Manifesto，40 年学术传承。 18 位作者联合发表 Agentic BPM Manifesto。核心概念：Framed Autonomy。 Below text: two parallel chains sketch with vertical dotted lines connecting nodes. Timelines behind converging at 2026 with amber dot. No logos. No blue.
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

## Slide 18: `s18_framed_autonomy`

**VISUAL TYPE**: Framework


**KICKER**: 有框的自主

**TITLE**: Framed Autonomy = AI Sandwich。人定边界，Agent 在框内自主。

**CONCEPT**:
- **MUST communicate**: Dagstuhl 18 位作者定义 Framed Autonomy:通过对 Agent 的知识和目标施加限制来约束其自主性。两种框:Operational Frame(规定执行序列,对应 CI 管道)+ Normative Frame(规定禁止行为,对应编码规范/安全策略)。德国能源网 meter-to-cash 达 99% 成功执行率。BPM 叫 Framed Autonomy,SDLC 叫 AI Sandwich——同一件事。
- **MUST NOT**: 不要以为"自主"=放任;自主永远在人定义的框内。
- **Bridge from previous**: 承接上页点名的 Framed Autonomy,正式展开它。
- **Bridge to next**: 这个模式落到企业架构,就是四层重构——下一页。
- **Content structure**: 琥珀色几何力场框(透明力场),AI 小人框内自由移动,人形在框外手扶框边;两种边类型;底部 Framed Autonomy = AI Sandwich。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, render these medium Chinese points: Dagstuhl 18 位作者定义：通过对 Agent 的知识和目标施加限制来约束其自主性。 两种框：Operational Frame（规定执行序列）+ Normative Frame（规定禁止行为）。 德国能源网 meter-to-cash 流程：99% 成功执行率。 BPM 叫 Framed Autonomy。SDLC 叫 AI Sandwich。同一个东西。 Below text: sketch of warm amber geometric frame (transparent force field), tiny AI agent figures moving freely inside, larger human figure outside with hand on frame edge. Two edge types. Bottom: Framed Autonomy = AI Sandwich. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 给出 Dagstuhl 正式定义。两种框:Operational(命令式,规定序列=CI 管道)、Normative(声明式,规定允许/禁止=编码规范)。真实验证:德国能源网 meter-to-cash 99% 成功率。映射:Framed Autonomy↔AI Sandwich、人定 Frame↔人定 harness、框内自主↔护栏内自主。
>
> **Terms:**
> — Operational / Normative Frame: 规定"怎么做" / 规定"不许做"
> — AI Sandwich: 人定任务→AI 执行→人验收
>
> **Takeaway:**
> 人定边界、Agent 框内自主——BPM 叫 Framed Autonomy,SDLC 叫 AI Sandwich,同一件事。



---

## Slide 19: `s19_four_layers`

**VISUAL TYPE**: Framework


**KICKER**: 四层重构

**TITLE**: 企业 IT 有四层。每一层都在被 AI 重写。

**CONCEPT**:
- **MUST communicate**: 企业 IT 四层都在被重写,且每层与 SDLC 精确对应:前端(Office/飞书/钉钉→Agent 基础设施,最被低估,Nadella"第一个配置的资源是 Office")、中端(Agentic Orchestration/ProcessOS,Camunda"每个流程都是 legacy")、后端(CRM/ERP/HCM 变成 Agent 调用的数据源)、治理(Agent 365/AI Control Tower,控制 Agent 身份权限=控制企业 AI)。
- **MUST NOT**: 不要只盯后端系统;前端 Office 层最被低估,却是 Agent 的"家"。
- **Bridge from previous**: 承接 Framed Autonomy——它落到架构就是四层同时重构。
- **Bridge to next**: 有没有真实企业这么做?下一页海外四案例。
- **Content structure**: 四条水平堆叠面板(前端/中端/后端/治理),同一道琥珀波贯穿每层。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, create four horizontal stacked panels with hand-drawn borders and same amber wave passing through each: Layer 1 前端 'Office、飞书、钉钉变成 Agent 基础设施。Agent 时代企业配置的第一个资源是 Office。' Layer 2 中端 'Agentic Orchestration / ProcessOS。Camunda CEO：你公司的每一个流程都是 legacy。' Layer 3 后端 'CRM、ERP、HCM。记录系统仍在，但变成 Agent 调用的数据源。' Layer 4 治理 'Agent 365 / AI Control Tower。谁控制 Agent 的身份和权限，谁就控制企业 AI。' No logos. No blue.
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

## Slide 20: `s20_allianz_nemo`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 唯一有独立第三方验证

**TITLE**: Allianz「Project Nemo」——不是高举高打，是从最窄处跑通，再铺开。

**CONCEPT**:
- **MUST communicate**: 安联（Allianz，全球最大保险集团之一，传统金融巨头、非科技公司）的 Project Nemo 有两个突出点。① 结果与角色迁移：澳洲「食品变质理赔」场景，1 个 planner agent 调度 7 个专才 agent（承保核对 / 天气事件确认 / 欺诈筛查 / 赔付计算 / 审计…），处理时间从数天→数小时（-80%）；理赔员没被裁，从"逐单处理者"升格为"审 AI 结果、签字负责的签核者"(human-in-the-loop)。② 打法与洞察：首席转型官 Maria Janssen 原话 "We scoped it intentionally"——巨头没有全面铺 AI，而是刻意缩到又窄又高频、金额小(<AUD$500)、边界清楚的场景先跑通、先被独立第三方验证，再向外铺开。这是全 deck 唯一有独立媒体 + 独立评估机构双重佐证的案例。
- **MUST NOT**: 不要说成"全理赔 -80%"——-80% 只限"食品变质 <AUD$500"这一窄类目，车险/健康险扩展仍是意向。不要说成"AI 替代理赔员"——人升格为签核者。
- **Bridge from previous**: 承接四层重构——用一个证据最扎实的真实案例把落地讲透。
- **Bridge to next**: 海外如此，中国呢？下一页中国案例。
- **Content structure**: 单案例深讲（非 2x2）。一侧一个克制的"AI 理赔班组"意象：1 个 planner 小人居中，向外发散连到约 7 个专才 agent 小节点，其中一个节点后一个人形在"盖章/签核"。另一侧文字主舞台：公司一行介绍 + 两个带标号的突出点（① 结果：数天→数小时/-80%、人升为签核者；② 打法：刻意缩窄先验证、再铺开）。底部小字诚实注脚（-80% 仅限窄类目 + 独立佐证来源）。全程土色系，不用蓝。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. A SINGLE deep case study, NOT a grid of panels. At the top of the body area, render one short medium Chinese intro line: 安联，全球最大保险集团之一——传统金融巨头，不是科技公司。 Then TWO clearly numbered blocks of medium-Chinese text with generous spacing. Block ①（结果）: 澳洲「食品变质理赔」：1 个 planner agent 指挥 7 个专才 agent。 处理时间 数天 → 数小时，砍掉 80%。 理赔员没被裁——从逐单处理者，升格为审 AI 结果、签字负责的签核者。 Block ②（打法）: 首席转型官 Maria Janssen："We scoped it intentionally（我们是刻意缩窄的）。" 巨头没有全面铺 AI——先挑一个又窄又高频、金额小、边界清楚的场景跑通、被独立第三方验证，再向外铺开。 ILLUSTRATION (restrained, ONE side or corner only, ~30%): a small "AI claims crew" motif — one central planner figure radiating thin sepia lines to about seven small specialist agent nodes; behind ONE node stands a human figure stamping / signing (human-in-the-loop). Keep it minimal and clean, lots of empty cream space, do NOT fill the frame. Bottom small-print honest footnote (smaller sepia text): -80% 仅限「食品变质 <AUD$500」这一窄类目，非全理赔；独立佐证：insuranceNEWS.com.au + Evident AI Use Case Tracker。 Keep Chinese medium-or-large and clean; only tiny tags may be English. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 只讲一家，但讲透。安联是全球最大保险集团之一，传统金融巨头。Project Nemo 两个突出点：① 一个 planner agent 指挥 7 个专才 agent 处理澳洲食品变质理赔，数天→数小时、-80%，理赔员没被裁、升为签核者(human-in-the-loop)；② 打法才是真洞察——首席转型官 Maria Janssen "We scoped it intentionally"，巨头刻意把 AI 缩到极窄高频低值场景先跑通、被独立第三方验证，再铺开。这是全场唯一独立媒体 + 独立机构双重佐证的案例。诚实交代：-80% 只限食品变质 <AUD$500 窄类目，扩展仍是意向——这恰是"缩窄验证"打法的证据，不是减分。
>
> **Terms:**
> — Project Nemo: 安联的 agentic 理赔试点
> — 缩窄验证: 刻意选最窄场景先跑通、被独立验证，再向外铺开
> — human-in-the-loop: 赔付最终由人签核
>
> **Takeaway:**
> 传统巨头落地 AI 的正确姿势：不是高举高打，是从一个能被独立验证的小场景扎实起步、再铺开——而且是抬人（升为签核者），不是裁人。



---

## Slide 21: `s21_china_cases`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 中国也在动

**TITLE**: 奇瑞 4000+ 智能体。兆企合同审批 1天变20分钟。不是科技公司，是传统企业。

**CONCEPT**:
- **MUST communicate**: 中国传统企业(非科技公司)已部署生产级 AI Agent:奇瑞(制造,6万员工、4000+ 智能体,年降本超 3000 万、翻译成本归零)、兆企(贸易/供应链,报价/合同/客户画像全流程,合同审批 1天→20分钟)、司盟(企业服务,接管海外邮件/审计/合同,效率提升 5 倍+)。模式与海外完全一致。
- **MUST NOT**: 不要以为这只在科技公司;案例都是传统制造/贸易/企服。
- **Bridge from previous**: 承接海外案例——中国镜像。
- **Bridge to next**: 两个领域都看完,退一步看大局——进入 Part 3。
- **Content structure**: 三列(奇瑞/兆企/司盟),各含简图与数据;底部共同模式注释。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, create three columns with compact sketches and data: Left Chery Auto 制造 — 4000+ 智能体 / 6万员工。年降本超 3000 万。翻译成本归零。 Center Zhaoqi 贸易 — 合同审批 1天变20分钟。Agent 覆盖报价、合同、客户画像。 Right Simeng 企业服务 — 效率提升 5 倍。Agent 接管海外邮件、审计、合同审核。 Bottom: 共同模式跟海外一样：不是替代人，是流程交给 Agent，人做策展。 No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 中国传统行业同样在动。奇瑞 4000+ 智能体、年降本超 3000 万、翻译成本归零;兆企合同审批 1天→20分钟;司盟效率 5 倍+。共同模式跟海外一样:不是替代人,是流程交 Agent、人做策展。
>
> **Terms:**
> — 智能体: 企业内自主执行流程的 Agent
> — 策展: 人做例外处理与决策
>
> **Takeaway:**
> 中国的传统企业也已落地生产级 Agent,模式与海外一致。



---

## Slide 22: `s22_roman_legion`

**VISUAL TYPE**: Concept Split


**KICKER**: 两千年的结构

**TITLE**: 组织金字塔不是「效率最高」。是「人是信息瓶颈」下的不得已。

**CONCEPT**:
- **MUST communicate**: 组织层级存在的根本原因是"人是信息流动的瓶颈"——一个 manager 只能有效沟通 7-15 人（管理版 Dunbar 数），所以必须分层：CEO → VP → Director → Manager → IC，每层负责汇总信息、过滤噪音、上传下达。这不是"效率最高",是人带宽有限下用层级管理带宽的不得已。这是罗马军团时代的逻辑,2000 年没变。AI 让 Agent 自动汇总、跨层同步、人→Agent→人,沟通成本归零,只做上传下达的中层就失去存在理由（Block 已在试：CEO 直接管 6000 人）。
- **MUST NOT**: 不要以为金字塔是"最优效率结构";它只是人带宽有限下的不得已。
- **Bridge from previous**: 从案例拔高到组织理论——为什么会有金字塔。
- **Bridge to next**: 中层若只做搬运就没用了,那到底该怎么重新分类岗位?下一页 Builder/Seller/Measurer。
- **Content structure**: 文字为主舞台（约 65%），插画退为配角（约 35%）。核心一句大字压题，下方**五行递进要点**（反问钩子 → 层级链条+三职能 → 根因 → 罗马军团 → AI 打破前提+Block 证据）。右下角一个**简洁的单一意象**：一个由小人堆叠的金字塔轮廓，只在顶部/右侧被一道琥珀涟漪轻轻淡化——克制、干净，不铺满画面。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. TEXT IS THE MAIN SUBJECT (~65% of the slide); the illustration is a restrained supporting element in ONE corner only (~35%), lots of clean empty cream space — do NOT fill the frame with drawing. In the body area, render FIVE short medium-Chinese lines with generous spacing: 为什么不是 CEO 直接管所有人？因为一个 manager 只能有效沟通 7–15 人（管理版 Dunbar 数）。 所以必须分层：CEO → VP → Director → Manager → IC——每层负责汇总信息、过滤噪音、上传下达。 这不是"效率最高"，是"人是信息瓶颈"下用层级管理带宽的不得已。 罗马军团时代就这套逻辑，2000 年没变过。 AI 让 Agent 自动汇总、跨层同步、人→Agent→人；纯搬运的中层，理由消失了（Block 已在试：CEO 直接管 6000 人）。 ILLUSTRATION (small, bottom-right corner only): a simple clean outline of a human-figure pyramid, with a single amber ripple gently fading its top layer to a ghost outline. Keep it minimal — one clear image, not a dense crowd. Keep Chinese medium-or-large and clean; only tiny tags may be English. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 为什么要分层?因为人沟通带宽有限(管理版 Dunbar 数 7-15),必须 CEO→VP→Director→Manager→IC 层层中转。这是罗马军团逻辑,2000 年没变。AI 打破前提:自动汇总、跨层同步、人→Agent→人。只做上传下达的中层,存在理由消失。
>
> **Terms:**
> — 信息瓶颈: 人是信息流动的中转站,带宽有限
> — 罗马军团结构: 沿用两千年的层级逻辑
>
> **Takeaway:**
> 金字塔是"人是信息瓶颈"的产物;沟通成本归零后,纯搬运的中层没了理由。



---

## Slide 23: `s23_measurers_not_builders`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 量度者，不是建造者

**TITLE**: 纯测量、报告、协调的岗位——不是裁掉，是重新定义。

**CONCEPT**:
- **MUST communicate**: Cloudflare 的 Builder/Seller/Measurer 三分法可诊断任何组织:Builders(创造产品,AI 是工具)、Sellers(获取客户,人际不可替代)、Measurers(测量/报告/协调,正是 LLM 核心能力)。Measurers 不是被裁,是重新定义——质检员→AI 异常处理员、排产员→AI 排产审查员、成本会计→AI 成本决策者。三波冲击:productivity→communication→organization。
- **MUST NOT**: 不要把 Measurer 岗位理解成"该裁掉";是从"做测量"变成"管 AI 测量输出并决策"。
- **Bridge from previous**: 承接罗马军团——给出诊断哪些岗位是纯搬运的工具。
- **Bridge to next**: 两条河(SDLC/BPM)正在汇流——下一页融合。
- **Content structure**: 三列(Builders/Sellers/Measurers)+ 箭头转化(岗位重定义);底部中国法律注释。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. In the body area, create three columns: Left BUILDERS: 创造产品的人。AI 是他们的工具。 Center SELLERS: 获取客户的人。人际关系不可替代。 Right MEASURERS: 测量、报告、协调的人。AI 替代测量动作。人变成 AI 测量输出的决策者。 Arrow transformation: 质检员变成 AI 异常处理员。排产员变成 AI 排产审查员。成本会计变成 AI 成本决策者。 Bottom: 在中国尤其重要：法院已裁定 AI 不能作为裁员的合法理由。但这不影响重新设计岗位。 No logos. No blue.
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

## Slide 24: `s24_convergence`

**VISUAL TYPE**: Concept Split


**KICKER**: 不是互相借鉴，是融合

**TITLE**: SDLC 和 BPM。两条河。正在汇成一条。

**CONCEPT**:
- **MUST communicate**: SDLC 和 BPM 经历完全相同的路径——软件侧：前提被挖 → 人从操作者变委托人 → 方法论转向 Harness Engineering → 组织从中层密集变极端扁平；企业 BPM 侧完全一样：Framed Autonomy = AI Sandwich，Agentic BPM = Agentic SDLC，四层架构逐层精确映射。而且两边用同一套工具：Claude Code 上午写代码、下午写报告；飞书/钉钉 CLI 化让 office 变成 Agent 的 terminal。这不是"两个领域边界模糊",是它们在同一个 Agent 基础设施上收敛。
- **MUST NOT**: 不要理解成"两个领域可以互相借鉴";是收敛到同一基础设施,不是借鉴。
- **Bridge from previous**: 承接量度者重定义——把软件与企业两条线合流。
- **Bridge to next**: 收敛已成事实,最后抛出开放问题——下一页 closer。
- **Content structure**: 文字为主舞台（约 65%），插画退为配角（约 35%）。核心一句大字压题，下方**四行要点**（软件侧4环节 → BPM四层映射 → 同一套工具+飞书钉钉CLI → 收敛结论）。底部一个**简洁的单一意象**：两条细线（软件 / 企业）在中间汇成一条更粗的琥珀主流——克制、干净，不铺满画面。全程土色系（不用蓝/绿）。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. TEXT IS THE MAIN SUBJECT (~65% of the slide); the illustration is a restrained supporting element along the BOTTOM only (~35%), lots of clean empty cream space — do NOT fill the frame with drawing. In the body area, render FOUR short medium-Chinese lines with generous spacing: 软件经历了什么：前提被挖 → 人从操作者变委托人 → 方法论转向 Harness Engineering → 组织从中层密集变极端扁平。 企业 BPM 完全一样：Framed Autonomy = AI Sandwich，Agentic BPM = Agentic SDLC，四层逐层精确映射。 而且两边用同一套工具：Claude Code 上午写代码、下午写报告；飞书/钉钉 CLI 化，office 变成 Agent 的 terminal。 所以这不是"两个领域互相借鉴"——是它们在同一个 Agent 基础设施上收敛成一条河。 ILLUSTRATION (simple, bottom band only): two thin sepia lines labeled 软件 and 企业 flowing in from the left and right, merging at center into ONE thicker amber stream. Minimal and clean — just the confluence, no busy detail. Earth tones only (sepia + amber). Keep Chinese medium-or-large and clean; only tiny tags may be English. No logos. No blue. No green.
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

## Slide 25: `s25_what_will_you_do`

**VISUAL TYPE**: Closer


**KICKER**: (none)

**TITLE**: 外面都变了。你打算怎么变？

**SUBTITLE**: 我今天没有结论。只有一个问题。

**CONCEPT**:
- **MUST communicate**: 软件开发是煤矿里的金丝雀——它先感觉到空气的变化。软件的方法论、角色、组织在 5 个月内被掀翻;你的行业也在加工信息(看文档、写邮件、填报表、走审批),AI 正在学会做这一切。软件是先行样本,你是下一个。收在一个开放问题,不给结论。
- **MUST NOT**: 不要给出"应该怎么做"的标准答案;这里刻意留白,只留一个问题。
- **Bridge from previous**: 承接收敛——既然一切都在变,把问题抛回给听众。
- **Bridge to next**: N/A — closer
- **Content structure**: 极简结尾页，和封面/中转同一种"停顿页"语言——统一奶油纸底（放弃原来的深色底）。大量留白。大号衬线中文主问句居中，副标题一行居中在其下。不画插画，只留一个小琥珀点作锚。留白就是收尾。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote CLOSER slide, sketch/etching aesthetic but MINIMAL — a pause / closing page, calm and spacious, matching the cover and transition pages. Cream paper #F5F0EB background (NOT dark), sepia ink #2D1B11, one amber #D97706 accent. Keep the composition calm, centered, and spacious. The ONLY decoration is one small amber dot, like a period or a first spark of light. NO illustration, NO scene, NO dark background — preserve generous empty cream paper. In the BOTTOM-RIGHT corner, a small, plain, unobtrusive author byline in English: Ethan Jiang (small size, simple sans/serif, sepia ink, modest — like a signature, not a heading). CJK LEGIBILITY: keep all Chinese large and clean; no tiny Chinese. The only small text allowed is the English byline. No callout bar, logos, watermarks, page numbers, or blue.
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



---

## Change Log（本版本）

| Date | Change Type | Slide(s) | What Changed | Why |
|------|-------------|----------|-------------|-----|
| 2026-07-12 | Framework Sync | All | 加入全册 render policy；移除 25 个冗余逐页 mode；逐页剥离 IMAGE PROMPT 中重复的结构化 header 文案/位置；规范 cover/bridge hero 类型 | 对齐 Stage 1 header contract、policy source、provenance/header-review 新流程，避免双重文字指令 |
| 2026-07-11 | Initial (migrated) | All | 从 deck_ai_sdlc_keynote 迁移重建 22 页四层规格 | 把已完成的中文 keynote 逐页规格从旧框架格式重建为新框架 slide-specifications.md,供 Stage 1 解析;L3 IMAGE PROMPT 逐字照抄 page_prompts.json |
| 2026-07-11 | Note | All | RENDER MODE 全部设为 full-page | 该 deck 中文 KICKER + 大标题已内嵌于每页 IMAGE PROMPT(烤进图),故全部走 full-page 渲染、不使用 body+header-lock 叠字(header-lock 是给 Latin 字体叠标题用的,会与图内已有中文标题冲突) |
| 2026-07-11 | Note | All | 21↔22 页数对齐:outline.md frontmatter 标 total_slides:21,但其 Slide Map 与 Block 结构实际枚举 22 页 | "21" 为 outline 陈旧元数据;Slide Map 22 行与 page_prompts.json 22 页 1:1 对齐,无孤立/多余 slide,全部按主题一一对应 |
