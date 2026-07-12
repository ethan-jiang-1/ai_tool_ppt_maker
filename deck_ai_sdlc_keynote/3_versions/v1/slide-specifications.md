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
| Block E: 案例 | 用真实 production 案例证明不是 demo | 真有传统企业在做吗? | 20–21 | Allianz（保险理赔 agentic 重构）+ Maersk（航运流程情报先行）|
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

## Slide 05: `s05_partner_not_tools`

**VISUAL TYPE**: Concept Split


**KICKER**: 你多了一个伙伴

**TITLE**: 以前每次技术浪潮，给你换工具。这次给你一个搭档。

**SUBTITLE**: 超级能干。但人还不会跟它协作——这本身就是最大的挑战。

**CONCEPT**:
- **MUST communicate**: 互联网给了你更快的传真。iPhone 给了你口袋里的电脑。每一次技术浪潮都是「工具升级」——人不变，工具更好。这次不一样：AI 不只是工具——它是能自己做判断、自己执行的**搭档**。你能把一整件事委派给它，它理解、执行、回来等你验收。这不是「帮你更快」，是「帮你做了」。问题？人从来没有过这种工作关系。我们习惯了管工具——告诉它每一步怎么做。现在我们得学会管搭档——告诉它**要什么**，不是**怎么做**。这不是技能升级，是角色转换。挑战不在 AI 够不够好——在**人还不会用搭档**。这一页不给答案，只给这个张力：你多了个超级能干的伙伴——这是好消息。但你不知道怎么跟它配合——这是新挑战。两个都是真的。
- **MUST NOT**: 不要预告 BPM/企业/路线图。不出现 SDLC 术语（留给 06）。不要画成「人 vs AI」对抗——是「人 + AI」并肩但不适应。不要恐惧感——是可能性和不适并存。不要把 AI 画成机器人或威胁性形象——是一个温暖的琥珀光晕轮廓，像伙伴不像武器。
- **Bridge from previous**: 承接 Slide 04——Claude Code 上午写代码下午写报告，看起来像又一个工具升级。但这一页说清楚：不是。这次是搭档，不是工具。两个量级。
- **Bridge to next**: 这个新搭档最先撞进软件开发——看 SDLC，人以前是怎么想的，现在有了搭档以后旧地图怎么不管用了。下一页。
- **Content structure**: 一张手绘工作台横跨画面。左边一个人，手里拿着熟悉的工具（键盘、笔记本），姿态不恐惧——但微微侧头，表情是「你太能干了，我该拿你怎么办」。右边一个 AI 伙伴，温暖琥珀光晕轮廓，简洁、非人形但可辨识——像存在感，不像武器。AI 那边已经堆出一摞成果——代码、文档、分析，整齐漂亮。上方一条过渡箭头从「工具升级」跨到「伙伴关系」。底部一行字：*你多了个超级能干的伙伴——但你还不会配合。两个都是真的。*

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. CONCEPT SPLIT layout. Warm, not foreboding. The image tells the story of GAINING a partner — not losing control. SCENE: a hand-drawn worktable spanning the composition. On the LEFT, a human figure stands with familiar tools (keyboard, notebook) — posture is not fearful, but slightly uncertain, looking sideways as if thinking "what do I do with you?" On the RIGHT, an AI partner — a warm amber-glow silhouette, a collaborator, not a threat. The AI's side of the table is stacked with impressive output: neat piles of code, documents, analysis — already done. A subtle transition arrow crosses the table from left to right, labeled: 工具升级 → 伙伴关系. UPPER AREA, one large Chinese proposition: 以前每次技术浪潮，给你换工具。这次给你一个搭档。 LOWER AREA, one line: 超级能干。但人还不会跟它协作——这本身就是挑战。 Overall mood: possibility mixed with productive discomfort. Not a disaster — an adjustment that hasn't happened yet. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 停一拍。互联网、iPhone——每次都说「这次不一样」，但每次其实都一样：工具升级，人还在中间。这次真不一样：AI 不只是帮你更快——它帮你**做了**。你能把一整件事委派给它，它理解、执行、回来交差。你从操作者变成了委托人。但问题是：人从来没有过这种工作关系。我们擅长管工具（告诉它每一步怎么做），不擅长管搭档（告诉它要什么、信任它去执行）。挑战不在 AI 够不够好——在**人还不会用搭档**。好消息是你多了一个超级能干的伙伴。新挑战是你不知道怎么配合。两个都是真的。拿软件开发看——这个搭档最先撞进的地方。
>
> **Terms:**
> — 工具升级: 人不变、工具变——以前每次技术浪潮的实质
> — 伙伴关系: AI 从「帮你更快」变成「替你做了」——人的角色从操作者变成委托人
>
> **Takeaway:**
> 这次不一样——不是换了更好的工具，是多了一个搭档。好消息是它超级能干。挑战是你还不会跟它配合。两个都是真的。



---

## Slide 06: `s06_old_map_new_map`

**VISUAL TYPE**: Framework


**KICKER**: 旧地图只管人

**TITLE**: 瀑布、V 模型、敏捷——画的是人独自怎么走。现在多了一个。

**SUBTITLE**: AIDLC？没人知道长什么样。但大家已经在画了。

**CONCEPT**:
- **MUST communicate**: 1970 年代瀑布——人把需求想清楚，一次性做出来。2001 年敏捷——人想一点做一点，边做边改。不管怎么迭代，前提是一样的：**人在想，人在写，人在验证**。方法论的差异只是「想多少再做」的节奏，不是「谁在想」的分配。现在多了一个搭档——它能写、能测、甚至能替你想一部分。旧地图画的是人独自走的路线——几条岔路（瀑布、敏捷、V 模型），但都假定你是独自上路。AI 加入后，地图上多了一个同行者——怎么分工？谁想多少、谁做多少、谁验多少？这不是某一派方法的危机——是所有旧地图都管不了新路况。AIDLC 打了个问号——**大家还在摸索中，没人知道正确答案，但都在试。** 这不是恐慌，是摸索中的诚实。
- **MUST NOT**: 不要画成楼塌了或地基裂了——旧的结构不是「毁了」，是「不够用了」。不要暗示某一种方法论（瀑布/敏捷）对了或错了。不要把 AI 放在「取代人」的位置——是并列、同行、一起看前方的空白画布。不要恐惧感——是探索感。
- **Bridge from previous**: Slide 05 说这次不是换工具，是多了个搭档。拿软件开发看——这个搭档最先撞进 SDLC，旧地图不管用了。
- **Bridge to next**: 「旧地图不管用」是理论，证据在哪？Martin Fowler 两次 retreat 的亲历者告诉你——下一页。
- **Content structure**: 一面墙上挂着三张褪色的旧地图——瀑布（一条直线从上到下）、V 模型（左右对称）、敏捷（环形迭代）——都是 sepia 墨水，经典完整但已褪色。人站在墙前，手里拿着铅笔。旁边是 AI 伙伴（琥珀光晕轮廓）。他们一起面向前方——前方是一大片留白画布，上面只有几根试探性线条、一个问号、一行淡淡的铅笔字：「AIDLC？」。不是没有地图——是旧地图只管人独自走，新地图还在画。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. EXPLORATORY mood, not catastrophic. SCENE: A wall with three classic SDLC maps hanging on it — LEFT: Waterfall (a straight line from top to bottom, cascading boxes), CENTER: V-Model (a V-shaped symmetric curve), RIGHT: Agile (a circular iterative loop). All three are drawn in SEPIA INK — complete, classic, but visibly FADED (lighter strokes, like old blueprints). A human figure stands before the wall, holding a pencil. Beside the human stands an AI partner — a warm amber-glow silhouette, a collaborator, not a threat. Together they face FORWARD — toward a large, mostly BLANK CANVAS on an easel. On the blank canvas, only a few tentative pencil lines, one large question mark, and faint amber letters: AIDLC？ The mood is: old maps were drawn for walking alone. Now there's a companion — the new map isn't drawn yet, but it's being drawn. The question mark is honest, not anxious. LOWER AREA, one line: 旧地图画的是人独自怎么走。现在多了一个——新地图还在画。 No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> SDLC 三代演化——瀑布（想全部做全部）、V 模型（边做边验证）、敏捷（想一点做一点）——看似不同，共享同一个前提：人在想，人在写，人在验证。差异只是「想多少再做」的节奏，不是「谁在想」的分配。现在多了一个搭档——它能写、能测、甚至能替你想一部分。旧地图不管用了，不是因为它错了，是因为它画的是人独自走的路线。现在有了同行者——怎么分工？谁想多少、谁做多少、谁验多少？没人知道正确答案。AIDLC 是个问号——但大家已经在摸索了。这不是恐慌，是探索中的诚实。旧地图在墙上——尊敬它，但知道它不够用了。新地图在画布上——只有几根试探线，但铅笔已经在手里。下一页，看同一群人 5 个月内怎么从犹豫走到确信的。
>
> **Terms:**
> — SDLC 三代: 瀑布（1970s 想全部做全部）、V 模型（验证与开发对称）、敏捷（2001 想一点做一点）——都是「人独自走」的路线
> — AIDLC 问号: AI 加入后的新软件生命周期——还没定型，大家正在摸索
> — 旧地图新地图: 不是旧错了新对了——是旧的不够用了，新的还没画完
>
> **Takeaway:**
> 旧地图画的是人独自怎么走——瀑布、V 模型、敏捷，都是。现在多了一个搭档——新地图还在画，铅笔已经在手里。AIDLC 不是答案，是正在被回答的问号。



---

## Slide 07: `s07_deer_valley_engelberg`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 五个月，同一群人

**TITLE**: 「不确定多于确定」→「不是 slides，是 production。」

**SUBTITLE**: Martin Fowler，ThoughtWorks 首席科学家。两次 retreat，他召的。

**CONCEPT**:
- **MUST communicate**: Martin Fowler——ThoughtWorks 首席科学家、2001 年《敏捷宣言》17 位签署者之一，过去 20 年全球软件方法学的灯塔。25 年后同一片 Utah 山，他把新一代软件工程大脑召回来——两次闭门 retreat，同一批人，5 个月内语气从试探翻到笃定。**Deer Valley（2 月，~40 人）**：Annie Vella——「There is more uncertainty than certainty. Nobody has it all figured out.」Fowler 自称「a total, absolute skeptic.」Rachel Laycock（ThoughtWorks CTO）——「AI 是放大器——速度乘数也是债务乘数。」全场反复追问同一个问题：「Rigor 去哪了？没人有同一个答案——但都同意这个问题很紧迫。」四个新概念在此诞生：Rigor Relocation、Supervisory Engineering、Cognitive Debt、Three-Tier Split。**Engelberg（6 月，~60 人）**：Greg Herlein——「Everybody in the room was shipping it. Not slides — production. The whole debate about whether this changes software engineering is over.」Giles Edwards-Alexander——「Deer Valley 还有犹豫……Engelberg 只有信心：证据就在这里。这不是信徒聚会。」Fowler 自己——「满场都在谈 harness engineering——这个词在 Utah 甚至还不是一个词。」议程从「这是什么」扩展到 harness engineering、token 经济、spec-driven code、风险分层。这不是两场会——是同一群人、同一个召集人、5 个月内的一次集体认知跃迁。disruption 的速度，不是渐进改进。
- **MUST NOT**: 不要把 retreat 说成「大会」或「峰会」——是闭门邀请制 Open-Space，Chatham House Rule（可引内容，不可指认发言人）。不要等同全行业——这群人是早期采用者，方向真实但幅度有选择偏差。
- **Bridge from previous**: Slide 06 说 SDLC 的前提被挖了——那是理论断言。这一页亮最鲜活的亲历证据：同一群顶级大脑，5 个月内从犹豫翻到确信。
- **Bridge to next**: 同一时期旧金山还有一场更大的公开场——Fowler 和 Kent Beck 同台，有硬数据、有 12 万开发者调查，下一页。
- **Content structure**: 左右并置对比——左：Utah 雪山、篝火几人围坐、铅笔笔触试探犹豫、两条引语浮在旁边（Vella 的「不确定多于确定」+ Laycock 的「速度乘数也是债务乘数」），角标注「Deer Valley，2026.02，~40 人」；右：瑞士绿色山谷、发光仪表盘/控制台、笔触自信果断、两条引语浮在旁边（Herlein 的「Not slides — production」+ Edwards-Alexander 的「证据就在这里」），角标注「Engelberg，2026.06，~60 人」。中间一道粗琥珀箭头标「5 个月」。底部一行大字：Not slides — Production。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. SPLIT COMPARISON layout. LEFT panel (~45%): snowy Utah mountains, a campfire with a few figures seated around it — tentative, exploratory mood. Pen strokes lighter, more hesitant. Two medium Chinese pull-quotes with English originals floating beside the scene: Annie Vella：「不确定多于确定。没人搞明白了。」(There is more uncertainty than certainty.) Rachel Laycock（ThoughtWorks CTO）：「AI 是放大器——速度乘数也是债务乘数。」(This velocity multiplier becomes a debt accelerator.) Label top-left: Deer Valley，2026.02，~40 人。 RIGHT panel (~45%): green Swiss valley, glowing instrument panels/dashboards — confident, decisive mood. Pen strokes bolder, more assured. Two medium Chinese pull-quotes with English originals floating beside the scene: Greg Herlein：「所有人都在 production 里做。不是 slides——是 production。争论结束了。」(Not slides — production. The debate is over.) Giles Edwards-Alexander：「证据就在这里。这不是信徒聚会。」(The evidence is in. Not a conference for true believers.) Label top-right: Engelberg，2026.06，~60 人。 CENTER: a thick amber arrow spanning the gap between the two panels, labeled 5个月. Bottom of slide, one large amber line: Not slides — Production。 No logos. No blue.
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
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. MAIN IMAGE (role-reversal driving metaphor, clear and readable): a hand-drawn car seen from the side. In the DRIVER seat sits an AI figure — a warm amber-glow silhouette, calm, capable — confidently steering, the road ahead smooth. In the BACK seat sits a HUMAN, holding a small slip of paper labeled 任务单, watching the AI drive with an uncertain expression. An amber caption beside the human: 我不再自己开，我改下订单。— Mollick「I no longer steer. I commission.」 One medium Chinese line under the scene, amber-highlighted: 瓶颈第一次从机器，变成了人——人能不能放心把方向盘交出去。 In the right margin a small mnemonic label: Trust Gap. Keep Chinese medium-or-large and clean; only tiny tags may be English. No logos. No blue.
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
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. At the top of the body area, render one medium Chinese company intro in lighter sepia: Block＝美国支付巨头（原 Square，Twitter 创始人 Jack Dorsey 掌舵，Cash App 母公司）。 Below, the main sketch: on the LEFT, a traditional 5-layer management pyramid drawn faintly, collapsing/crumbling. An amber arrow points RIGHT to a new flat arrangement of THREE role badges side by side. Each badge is a hand-drawn card with a medium Chinese role name AND a medium Chinese one-line plain explanation beneath the name: Badge 1 — 「IC 执行者」自己干活，不带人; Badge 2 — 「DRI 负责人」一件事的总扛把子，能拍板但不管人; Badge 3 — 「Player-Coach 球员教练」既自己上手、又带团队，没有只带人的经理. Between and beneath the three badges, a small amber AI-agent glyph acting as the connecting coordination layer (replacing the removed managers). One medium Chinese caption near the badges: 5 层压成 2-3 层，AI 做中间协调层。 Below that, a medium Chinese RESULT line highlighted in amber: 结果：6000 人跑出 27% 毛利增长，Goose 成行业基础设施(GitHub 39K stars)。 In the TOP-RIGHT corner, a small hand-drawn sketch of the Block (formerly Square) logo — a simple cube made of squares — in faded sepia ink, like a stamped seal, subtle, matching the sketch aesthetic. In a bottom corner, a small understated footnote in medium Chinese: 背景：同期裁员 40%，独立分析师判主因是成本削减。 Keep Chinese medium-or-large and clean; only tiny tags may be English. No blue.
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
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. At the top of the body area, render one medium Chinese company intro in lighter sepia: Cloudflare＝全球互联网基础设施公司（全世界约五分之一网站靠它做加速和安全防护）。 Below, THREE columns side by side, each a hand-drawn card with a medium Chinese role label and one-line definition: Column 1「Builders 建造者」创造产品的人 (mark: AI 难替代·保留); Column 2「Sellers 销售者」获取客户的人 (mark: AI 难替代·保留); Column 3「Measurers 量度者」测量·报告·协调的人 (mark: AI 重塑·重新设计). The Measurer column subtly highlighted in amber to show it is the one being reshaped. A small line under the three columns: 溯源 Drucker 1954：只有建造者和销售者产生成果。 A medium Chinese RESULT line highlighted in amber: 结果：裁量度者+扩招工程师后，营收 +34%、Workers 平台 550 万开发者仍在加速。 In the TOP-RIGHT corner, a small hand-drawn sketch of the Cloudflare logo — a stylized cloud glyph with radiating lines — in faded sepia ink, like a stamped seal, subtle, matching the sketch aesthetic. One large amber phrase at the bottom: Displacement, not reduction. Keep Chinese medium-or-large and clean; only tiny tags may be English. No blue.
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


**KICKER**: 有框，才有真正的自主

**TITLE**: Framed Autonomy = 人定边界。Agent 在框内可劲儿干。

**SUBTITLE**: 框不是笼子——是让你敢放手的边界。

**CONCEPT**:
- **MUST communicate**: Dagstuhl 18 位作者定义 Framed Autonomy：通过对 Agent 的知识和目标施加限制来约束其自主性。关键是「约束」不等于「限制发挥」——恰恰相反，**明确的边界让 Agent 敢放手干活**。就像沙盒——因为知道什么不能碰，所以框内什么都能试。框内两个 Agent 性格完全不同：一个安静地在写——写代码、写测试、写规范，沉稳精确；一个狂野地在跑——连接设备、调动资源、跑流程，能量充沛。两种 Agent，同一个框。框外，人一只手轻轻搭在框边——不是紧张地扶着，是信任但关注。姿态是「框我设好了，你们尽情发挥」。两种框的类型：Operational Frame（规定执行序列——像 CI 管道，告诉你怎么走）和 Normative Frame（规定禁止行为——像编码规范，告诉你不许碰什么）。德国能源网 meter-to-cash 达 99% 成功执行率。BPM 叫 Framed Autonomy，SDLC 叫 AI Sandwich——同一件事。框是信任，不是锁。
- **MUST NOT**: 不要把框理解成「限制 Agent 能力」——是「让 Agent 有能力放手干」的前提。不要把框内 Agent 画成一群无差别小人——是两个性格鲜明、各司其职的搭档。不要画成笼子或监狱——框是温暖的琥珀色力场，沙盒感。
- **Bridge from previous**: 承接上页点名的 Framed Autonomy，把这一个概念展开——框是什么、框内谁在干什么、为什么有框才有自由。
- **Bridge to next**: Framed Autonomy 落到企业架构，就是四层同时重构——下一页。
- **Content structure**: 主画面=一个温暖的琥珀色几何力场框（透明发光边界，沙盒感）。框内两个 Agent 性格对比鲜明——左边：安静坐着，手在纸上写，周围飘着整洁产出（代码块、文档、测试用例），笔触稳定干净，标签「在想，在写，在验证」；右边：站着的，能量充沛，在摆弄设备、连接管线、调动资源，周围齿轮和仪表，笔触有动感，标签「在搭，在连，在跑」。框外：一个人一只手轻轻搭在框边——信任但关注，不是紧张地扶着。底部两行：*有框，才有真正的自主。框不是笼子——是让你敢放手的边界。*

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. MAIN ILLUSTRATION (~55% of body): a warm amber geometric force-field frame drawn as a translucent glowing boundary — like a sandbox, not a cage. Inside the frame are TWO distinct agents with contrasting personalities. LEFT AGENT: a warm amber-glow silhouette, seated calmly, head down, writing — pen on paper, surrounded by neat floating outputs (code blocks, documents, test cases). Pen strokes clean and stable. Amber label under this agent: 在想，在写，在验证。 RIGHT AGENT: a warm amber-glow silhouette, standing, dynamic, energetic — manipulating equipment, connecting pipes/wires, orchestrating resources, surrounded by gears and instrument panels. Pen strokes bolder, more kinetic. Amber label under this agent: 在搭，在连，在跑。 OUTSIDE the frame: a single human figure stands beside the frame, one hand resting lightly on the frame edge — posture is trust with attention, not anxiety. Not gripping — just touching. The human's expression is calm confidence: the frame is set, let them go. ABOVE the frame, three medium Chinese points: Operational Frame：规定执行序列（像 CI 管道——告诉你怎么走）。 Normative Frame：规定禁止行为（像编码规范——告诉你不许碰什么）。 德国能源网 meter-to-cash：99% 成功执行率。 BOTTOM, one line: 有框，才有真正的自主。框不是笼子——是让你敢放手的边界。 No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 给出 Dagstuhl 正式定义。关键翻面——「约束」这个词听起来像限制，但本质是赋能。就像沙盒——因为知道边界在哪，所以框内什么都能试。框内两个 Agent 性格截然不同：一个安静写代码/写测试/写规范，沉稳精确；一个狂野地连接设备/调动资源/跑流程。两种 Agent，同一个框，各司其职。框外，人不再紧张地盯着每一步——一只手轻轻搭在框边，信任但关注。两种框：Operational Frame 规定执行序列（像 CI 管道）、Normative Frame 规定禁止行为（像编码规范）。真实验证：德国能源网 meter-to-cash 99% 成功率。BPM 叫 Framed Autonomy，SDLC 叫 AI Sandwich——人定框，Agent 在框内可劲儿干。框是信任，不是锁。
>
> **Terms:**
> — Operational / Normative Frame: 规定「怎么做」/ 规定「不许做」
> — AI Sandwich: 人定任务→AI 执行→人验收，与 Framed Autonomy 同一件事
> — 框=信任: 约束不是限制发挥——是让 Agent 敢放手的前提
>
> **Takeaway:**
> 有框，才有真正的自主。框不是笼子——是让你敢放手的边界。BPM 叫 Framed Autonomy，SDLC 叫 AI Sandwich，同一件事。



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
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. A SINGLE deep case study, NOT a grid of panels. At the top of the body area, render one short medium Chinese intro line: 安联，全球最大保险集团之一——传统金融巨头，不是科技公司。 Then TWO clearly numbered blocks of medium-Chinese text with generous spacing. Block ①（结果）: 澳洲「食品变质理赔」：1 个 planner agent 指挥 7 个专才 agent。 处理时间 数天 → 数小时，砍掉 80%。 理赔员没被裁——从逐单处理者，升格为审 AI 结果、签字负责的签核者。 Block ②（打法）: 首席转型官 Maria Janssen："We scoped it intentionally（我们是刻意缩窄的）。" 巨头没有全面铺 AI——先挑一个又窄又高频、金额小、边界清楚的场景跑通、被独立第三方验证，再向外铺开。 ILLUSTRATION (restrained, ONE side or corner only, ~30%): a small "AI claims crew" motif — one central warm amber-glow planner figure radiating thin sepia lines to about seven small warm amber-glow agent nodes; behind ONE node stands a human figure stamping / signing (human-in-the-loop). Keep it minimal and clean, lots of empty cream space, do NOT fill the frame. In the TOP-RIGHT corner, a small hand-drawn sketch of the Allianz eagle logo in faded sepia ink — like a stamped seal, subtle, not a photograph — matching the sketch aesthetic. Bottom small-print honest footnote (smaller sepia text): -80% 仅限「食品变质 <AUD$500」这一窄类目，非全理赔；独立佐证：insuranceNEWS.com.au + Evident AI Use Case Tracker。 Keep Chinese medium-or-large and clean; only tiny tags may be English. No blue.
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

## Slide 21: `s21_maersk_edge_ai`

**VISUAL TYPE**: Impact / Evidence


**KICKER**: 情报先行

**TITLE**: Maersk：130 年航运巨头，先建数字孪生，再让 AI 上船。

**SUBTITLE**: 不是科技公司。是全球最大的集装箱航运公司。

**CONCEPT**:
- **MUST communicate**: Maersk（A.P. Moller-Maersk，1904 年丹麦创立）是全球最大航运集团，10 万员工、700+ 艘船、130 国运营。跟 Allianz 的「直建 agentic」不同，Maersk 走的是第二条路——**Process Intelligence First**：先建数字孪生、让流程可见，再叠 AI。最独特的约束：海上卫星带宽太贵，AI **必须在船上的边缘服务器跑**——Star Connect 平台在 700 艘船上实时处理 25 亿 IoT 数据点，油耗 -9.2%、年省 $300M+。信息加工链的一面：Trade & Tariff Studio 用 AI 做报关——6000+ 商品编码自动分类、关税计算、贸易合规监控，把海关文书处理从人工变成 AI-driven。Gemini 联盟（Maersk+Hapag-Lloyd）的航线网络本身就是 AI 优化的产物——90% 准班率，行业平均的 **两倍**。两条路，同一个目的地：AI 正在重写传统企业的核心流程。
- **MUST NOT**: 不要让听众觉得「航运 AI 只是省油」——报关/文件处理/客服 = 纯粹的信息加工链，跟 SDLC 同构。也不要把 Maersk 讲成「AI 万能」——坦承 AI 客户服务跟不上运营 AI 的质量（machine-AI vs people-AI gap），以及 2023 年 TradeLens 平台失败（$100M+ 投入后关闭，因为竞争对手不愿把数据喂进 Maersk 控制的平台）的教训：AI 在自有资产上跑得通，在需要全行业协作的平台上没那么容易。
- **Bridge from previous**: 承接 Allianz——第一种路径（直建 agentic、窄处验证）。Maersk 展示第二种路径（情报先行、数字孪生再叠 AI），两者形成对照。
- **Bridge to next**: 两家传统巨头、两条不同的路，结果一样——软件发生的正在所有行业重演。退一步看大局（进入 Part 3：罗马军团散了）。
- **Content structure**: 主图=一艘巨型集装箱船，船身上叠一张发光的数字孪生蓝图，船上 edge AI 核心标记为琥珀色（25 亿 IoT 数据点→船上推理→只传结论回岸）。下方三列要点：① 油耗 -9.2%/$300M+ 年省、90% 准班率（行业 2x）；② 报关 AI：6000+ 商品码自动分类；③ 客服 AI：人审 AI 回复→一键批准。底部一行 amber 小字：跟 Allianz 不同路，同一个结论——传统企业的核心流程在被 AI 重写。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. At the top of the body area, render one medium Chinese company intro in lighter sepia: A.P. Moller-Maersk，1904 年丹麦创立。全球最大航运集团，10 万员工、700+ 艘船、130 国运营。 MAIN ILLUSTRATION (~45% of body): a large container vessel sketched in fine sepia ink, with a translucent digital-twin blueprint overlaid on the hull (showing sensor nodes, data flows). An amber AI core glows on the bridge of the ship, labeled 边缘 AI（Edge AI）. A small annotation next to the ship: 卫星带宽太贵 → AI 在船上跑，不上云。 Below the ship, label: Star Connect — 25 亿 IoT 数据点，700 艘船实时推理。 Below the illustration, THREE compact Chinese result blocks with amber-highlighted numbers: ① 油耗 −9.2%，年省 $300M+。Gemini 联盟 90% 准班率（行业 2x）。 ② 报关 AI：Trade & Tariff Studio，6000+ 商品码自动分类+关税计算。 ③ 客服 AI：AI 生成回复，人审核后一键批准。数千次/天。 In the TOP-RIGHT corner, a small hand-drawn sketch of the Maersk seven-pointed star logo in faded sepia ink — like a stamped seal, subtle, not a photograph — matching the sketch aesthetic. One amber line at bottom: 跟 Allianz 不同路——情报先行、再上 AI。同一个结论。 No blue.
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

## Slide 22: `s22_roman_legion`

**VISUAL TYPE**: Concept Split


**KICKER**: 两千年的结构

**TITLE**: 组织金字塔不是「效率最高」。是「人是信息瓶颈」下的不得已。

**SUBTITLE**: 罗马军团，公元 1 世纪。现代企业，公元 21 世纪。同一种结构。

**CONCEPT**:
- **MUST communicate**: 一个 manager 只能有效沟通 7–15 人（管理版 Dunbar 数）。所以必须分层——CEO → VP → Director → Manager → IC，每层负责汇总信息、过滤噪音、上传下达。这不是「效率最高」，是**人带宽有限下用层级管理带宽的不得已**。而这个结构不是现代企业发明的——罗马军团两千年前就是这套：Legatus → Centurion → Decurion → Legionary，指挥链一模一样。两千年，信息传输技术从骑马信使变成 Slack 再变成 AI Agent——**但组织结构没变过**。因为瓶颈始终是人——只要人的信息吞吐恒定，层级就是最优解。AI 打破了前提：Agent 自动汇总、跨层同步、人→Agent→人——沟通成本归零。只做上传下达的中层，存在的理由消失了。Block 已在试——Dorsey 砍掉中间层，CEO 直接管 6000 人。不是理论，已经在发生。
- **MUST NOT**: 不要把罗马军团画成「古代落后、现代先进」——关键是**结构一模一样**，令人不安。不要让金字塔「倒塌」——是中间层被一道琥珀涟漪轻轻淡化，不是灾难，是重构。不要暗示所有中层都会消失——淡化的是「纯搬运」的层级，不是所有管理者。
- **Bridge from previous**: 从案例拔高到组织理论——两家传统企业之外，退一步看：为什么会有金字塔？答案藏在两千年前。
- **Bridge to next**: 中层若只做搬运就没用了——那到底该怎么重新分类岗位？下一页 Builder/Seller/Measurer。
- **Content structure**: 上半部文字为主（约 55%），五行递进要点（管理版 Dunbar 数 → 层级链条 → 不是效率最高是不得已 → 罗马军团同构 → AI 打破前提）。下半部三栏对比（约 45%）：左栏=罗马军团金字塔（Legatus → Centurion → Decurion → Legionary，手绘士兵小人，钢笔线条古迹感）；中栏=现代企业金字塔（CEO → VP → Director → Manager → IC，西装小人，跟左边**完全一样的结构**，灰色 sepia，中间写「2000 年，同一套逻辑」）；右栏=同一个金字塔轮廓被一道琥珀涟漪从中间轻轻淡化——所有纯搬运的中间层变半透明，只留下顶层和底层清晰，顶层和底层之间出现一条细的琥珀色直连线（Agent 直连），右下角标注「Block 已在试：CEO 直接管 6000 人」。

**IMAGE PROMPT**:
```
Design a finished 16:9 keynote slide image in sketch/etching style. Cream paper #F5F0EB, sepia ink #2D1B11, amber #D97706. UPPER HALF (~55%): TEXT IS THE MAIN SUBJECT. Render FIVE short medium-Chinese lines with generous spacing: 一个 manager 只能有效沟通 7–15 人（管理版 Dunbar 数）。 所以必须分层：CEO → VP → Director → Manager → IC——每层负责汇总信息、过滤噪音、上传下达。 这不是「效率最高」，是「人是信息瓶颈」下用层级管理带宽的不得已。 罗马军团两千年前就是这套：Legatus → Centurion → Decurion → Legionary——指挥链一模一样。 AI 让 Agent 自动汇总、跨层同步——纯搬运的中层，理由消失了。 LOWER HALF (~45%): THREE-COLUMN COMPARISON. LEFT column: a hand-drawn Roman legion hierarchy pyramid sketched in sepia ink with slightly antique-line feel — Legatus at top, Centurion, Decurion, Legionary at base. Tiny soldier figures at each level. Label: 罗马军团，公元 1 世纪. CENTER column: a pyramid with the EXACT SAME STRUCTURE but modern — CEO → VP → Director → Manager → IC. Tiny modern figures (business suits). Gray sepia. Between left and center, a small annotation: 2000 年，同一套逻辑。 RIGHT column: the SAME pyramid outline but TRANSFORMED — a soft amber ripple passes through the middle layers, gently fading all the pure-relay management tiers (VP, Director, Manager) to translucent ghost outlines. Only top (CEO) and bottom (IC) remain fully drawn. A thin amber direct-connection line links top directly to bottom, bypassing the faded layers — Agent 直连。 Small annotation bottom-right: Block 已在试：CEO 直接管 6000 人。 Overall: calm, historical perspective, not sensational. No logos. No blue.
```

> **SPEAKER NOTE**
>
> **Narrative flow:**
> 先问：为什么不是 CEO 直接管所有人？因为人沟通带宽有限——管理版 Dunbar 数 7–15。所以必须 CEO→VP→Director→Manager→IC 层层中转。这不是效率最高的结构——是人在信息带宽瓶颈下用层级来管理带宽的不得已。这个结构谁发明的？不是现代企业。两千年前罗马军团就是这套——Legatus→Centurion→Decurion→Legionary，指挥链一模一样。两千年，信息传输从骑马信使变成了 Slack——但组织结构没变。因为瓶颈始终是人。AI 打破了这个前提：Agent 自动汇总、跨层同步、人→Agent→人——沟通成本归零。只做上传下达的中层，存在的理由消失了。Block 已经在试——Jack Dorsey 砍掉中间层，CEO 直接管 6000 人。这不是理论，已经在发生。下一页，把透镜从「层级去哪了」转向「岗位怎么重新分类」——Builder/Seller/Measurer。
>
> **Terms:**
> — 信息瓶颈: 人是信息流动的中转站，沟通带宽有限——组织层级是对这个瓶颈的补偿
> — 罗马军团结构: Legatus→Centurion→Decurion→Legionary，沿用两千年的指挥链逻辑
> — 管理版 Dunbar 数: 一个人能有效管理的直接下属上限约 7–15 人
> — Agent 直连: 沟通成本归零后，顶层可以直接触达底层——纯搬运的中层不再必需
>
> **Takeaway:**
> 两千年，组织结构没变过——因为瓶颈始终是人。AI 让沟通成本归零，纯搬运的中层失去了存在的理由。不是理论——Block 已经在试。



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
| 2026-07-12 | Content | 18 | Slide 18 重写：IMAGE PROMPT 从「无差别 AI 小人框内移动+人形框外扶框边」改为「框内两个性格鲜明的 Agent——左边安静写代码/文档（在想在写），右边狂野连接设备/调动资源（在搭在连）——框是沙盒不是笼子」；SUBTITLE/CONCEPT/SPEAKER NOTE 同步更新 | 原版把框内 Agent 画成无差别群体，未体现「不同 Agent 不同性格、框让它们各展所长」的洞察 |
| 2026-07-12 | Content | 22 | Slide 22 重写：IMAGE PROMPT 从「右下角单一金字塔+琥珀涟漪」改为三栏对比构图（左=罗马军团 LEGATUS→CENTURION→DECURION→LEGIONARY / 中=现代企业 CEO→VP→DIRECTOR→MANAGER→IC 完全同构 / 右=同一金字塔中间层被琥珀涟漪淡化→AGENT 直连）；SUBTITLE/CONCEPT/SPEAKER NOTE 同步补全「2000 年同一套逻辑」叙事 | 原版画面偏弱——只说「金字塔是信息瓶颈的产物」但没让观众看到罗马军团和现代企业真的是同一个结构 |
| 2026-07-12 | Content | 05-06 | Slide 05+06 双双重写，情绪从「失去/崩塌」翻为「获得+挑战」：Slide 05 从「前提被挖」改为「多了一个搭档——超级能干，但人还不会配合」（工具升级→伙伴关系）；Slide 06 从「地基裂了楼要塌」改为「旧地图只管人独自走，新地图还在画」；两页 IMAGE PROMPT 同步替换 | 原版两页情绪偏悲观（地基裂、前提挖），新版保持挑战的真实感但不拍成灾难 |
| 2026-07-12 | Content | 07 | Slide 07 重写：KICKER/TITLE/CONCEPT 从模糊概括改为具体人物+引语对照（Deer Valley: Vella「不确定多于确定」/ Laycock「速度乘数也是债务乘数」→ Engelberg: Herlein「Not slides — production」/ Edwards-Alexander「证据就在这里」）；IMAGE PROMPT 改为左右 split 构图+四条引语+5个月琥珀箭头 | 源材料（dpt_rb_martin-fowler-ai-sdlc-retreats）有大量可追溯的真实引语和命名人物，原版未充分利用 |
| 2026-07-12 | Case Restructure | 20-21 | Slide 21 从「中国三家合并页」重写为 Maersk 深度案例；Block Map 更新为「Allianz + Maersk」 | 中国公司无深度研究支撑；Maersk 与 Allianz 形成路径对照 |：Slide 05 从「前提被挖」改为「多了一个搭档——超级能干，但人还不会配合」（工具升级→伙伴关系）；Slide 06 从「地基裂了楼要塌」改为「旧地图只管人独自走，新地图还在画」；两页 IMAGE PROMPT 同步替换（工作台+搭档 / 旧地图墙+空白画布）| 原版两页情绪偏悲观（地基裂、前提挖），新版保持挑战的真实感但不拍成灾难——是「有了新东西还没学会用」的诚实，不是「旧东西塌了」的恐惧 |
| 2026-07-12 | Content | 07 | Slide 07 重写：KICKER/TITLE/CONCEPT 从模糊概括改为具体人物+引语对照（Deer Valley: Vella「不确定多于确定」/ Laycock「速度乘数也是债务乘数」→ Engelberg: Herlein「Not slides — production」/ Edwards-Alexander「证据就在这里」）；IMAGE PROMPT 改为左右 split 构图+四条引语+5个月琥珀箭头；SPEAKER NOTE 补全 Fowler 身份、四人引语、术语弧、四个 Utah 概念 | 源材料（dpt_rb_martin-fowler-ai-sdlc-retreats）有大量可追溯的真实引语和命名人物，原版未充分利用——只说「语气变了」没说是谁说的、原话是什么、态度怎么翻的 |
| 2026-07-12 | Case Restructure | 20-21 | Slide 21 从「中国三家合并页」重写为 Maersk 深度案例（130 年航运巨头，边端 AI+报关智能化，$300M+ 年省）；Block Map 证据列更新为「Allianz + Maersk」；Allianz/Maersk 各含 source material 深度研究（38KB/40KB） | 中国公司无深度研究支撑（每家仅 2-3 行指标），三家合并页信息密度不足；Maersk 有 40KB 独立研究文件，与 Allianz 形成「直建 agentic vs 情报先行」路径对照，均为非科技传统企业 |
| 2026-07-12 | Visual Polish | 14, 15, 20, 21 | 四页公司案例 IMAGE PROMPT 增加手绘 sketch logo：Block（方块立方体）、Cloudflare（云形辐射线）、Allianz（鹰形徽章）、Maersk（七角星），均为 faded sepia ink，右上角盖章式低调呈现 | 统一公司案例页的视觉标识，增强品牌辨识度，保持 sketch/etching 整体美学 |
| 2026-07-12 | Framework Sync | All | 加入全册 render policy；移除 25 个冗余逐页 mode；逐页剥离 IMAGE PROMPT 中重复的结构化 header 文案/位置；规范 cover/bridge hero 类型 | 对齐 Stage 1 header contract、policy source、provenance/header-review 新流程，避免双重文字指令 |
| 2026-07-11 | Initial (migrated) | All | 从 deck_ai_sdlc_keynote 迁移重建 22 页四层规格 | 把已完成的中文 keynote 逐页规格从旧框架格式重建为新框架 slide-specifications.md,供 Stage 1 解析;L3 IMAGE PROMPT 逐字照抄 page_prompts.json |
| 2026-07-11 | Note | All | RENDER MODE 全部设为 full-page | 该 deck 中文 KICKER + 大标题已内嵌于每页 IMAGE PROMPT(烤进图),故全部走 full-page 渲染、不使用 body+header-lock 叠字(header-lock 是给 Latin 字体叠标题用的,会与图内已有中文标题冲突) |
| 2026-07-11 | Note | All | 21↔22 页数对齐:outline.md frontmatter 标 total_slides:21,但其 Slide Map 与 Block 结构实际枚举 22 页 | "21" 为 outline 陈旧元数据;Slide Map 22 行与 page_prompts.json 22 页 1:1 对齐,无孤立/多余 slide,全部按主题一一对应 |
