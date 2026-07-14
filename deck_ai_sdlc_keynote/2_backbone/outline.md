---
title: Outline v2 — AI 时代的信息加工变革
version: v2
status: draft
total_slides: 25
created: 2026-07-08
updated: 2026-07-15
source: 1_upstream_raw_material/ (software/ + business/) + 3_versions/v1/slide-specifications.md (production output)
note: v2 吸纳 v1 实际交付的 25-slide/10-block 结构，替换原始 22-slide/4-part 规划。v1 是 production reality，v2 以此为 backbone 基准。
---

# Outline v2: AI 时代的信息加工变革

> **v1→v2 变化**：v1 实际产出 25 页（vs 初稿 22 页），演化出 10 个 Block 的叙事粒度（vs 原始 4 Part）。新增 3 页：partner-not-tools(s05)、one-tool-two-modes(s04)、transition bridge(s16)。每个案例都积累了 honest footnote（局限/因果/失败教训）。Agent 形象从 v1 的 IMAGE PROMPT 中浮现出统一规范（→ `agent-portrayal.md`）。

---

## 1. Core Metaphor（核心隐喻）

见 `core-metaphor.md`。一句话：一切白领工作是同一条 ITO 链。AI 站到中间后，人往上游（定义什么）或下游（验收治理）迁移。**深层**：金字塔存在两千年不是"效率最高"，而是人在两个维度上是瓶颈——垂直（沟通带宽，Dunbar 数 7-15）和水平（知识边界，部门墙）。AI 的通才+零沟通成本同时打破二者。

## 2. Core Formula（核心公式）

见 `core-formula.md`。**人定义边界 × AI 自主执行 × 共享基础设施 = 组织重构**。三波冲击时序：productivity → communication → organization。关键等价：Framed Autonomy（BPM 侧）= AI Sandwich（SDLC 侧）。

---

## 3. Narrative Arc（叙事弧线）

```
观众现状                    认知颠覆                    新框架                      行动号召
   │                          │                          │                          │
   ▼                          ▼                          ▼                          ▼
"AI 是程序员的事"    →   "SDLC 的整个前提    →   "Framed Autonomy    →   "你的行业也在加工
                         被 AI 挖掉了——       = AI Sandwich       信息。外面都变了。
                         不只是工具更好了，   = 人定边界+AI执行    你打算怎么变？"
                         是人的角色、方法论、  = 同样的模式正在
                         组织全被重写了"      你的行业重演"
```

**弧线节奏（按 Act）**：

| Act | Block | Slides | 观众状态 |
|-----|-------|--------|---------|
| **I: THIS IS REAL** | Cover, Part 0 | 01-05 | "AI 确实厉害，而且这不是 hype——但跟我的行业有什么关系？" |
| **II: SDLC UPTURNED** | Block A | 06-09 | "SDLC 的前提被挖了……不是理论，就是这 5 个月的事" |
| **III: ROLE & ORG REWRITTEN** | Block B, C | 10-15 | "人的角色从操作者变委托人。组织从中层密集变极端扁平。Block 和 Cloudflare 已经在试了" |
| **IV: YOUR INDUSTRY** | Bridge, Block D, E | 16-21 | "等等——BPM 跟 SDLC 一模一样？同样的模式正在我的行业重演？而且 Allianz/Maersk 已经上线了？" |
| **V: WHY THE PYRAMID** | Block F, G | 22-24 | "金字塔是罗马时代的遗产。沟通成本归零后，它没有存在理由了。SDLC 和 BPM 正在同一条河" |
| **VI: NOW WHAT?** | Closer | 25 | "外面都变了。你打算怎么变？" |

---

## 4. Block 结构（10 Blocks, 25 Slides）

### Act I: THIS IS REAL, AND IT'S ABOUT YOU (Slides 01-05)

**叙事目的**：建立 urgency + credibility + "shared tool" 机制。让非技术受众意识到"这不是程序员的事"。

---

#### Cover (1 slide)
- **01 `s01_cover`** | Title / Opener
  - TITLE: AI 时代的信息加工革命
  - SUBTITLE: 从 SDLC 到 BPM，工作方式正在被整体重写
  - 极简封面：cream 纸、serif 中文标题居中、一根琥珀色细线、一个琥珀色原点。无插画。

#### Part 0: Opening — 三年加速度 (4 slides)
- **02 `s02_opening`** | Title / Opener
  - KICKER: 三年
  - TITLE: 从补全一行代码，到接管整个项目。
  - SUBTITLE: 这不是 hype。这是加速度。
  - 三年 timeline + 三种光（烛光→灯光→日光）+ 三段代码。建立 second-order change 的感知。

- **03 `s03_why_software_first`** | Concept Split
  - KICKER: 为什么是软件先被颠覆
  - TITLE: 两个东西让 AI 学编程比学别的都快。
  - 编译器 0.1 秒反馈 + GitHub 数十亿行代码。软件是人类最复杂的智力工作之一——AI 反而先学会了它。

- **04 `s04_one_tool_two_modes`** | Impact / Evidence ★ v1 新增
  - KICKER: 同一套工具，两种模式
  - TITLE: Claude Code。Codex Desktop。上午写代码，下午写报告。
  - 开发者用这套工具三年了。白领刚刚开始。同样的 Agent 引擎、同样的工作流。软件是先行样本。

- **05 `s05_partner_not_tools`** | Concept Split ★ v1 新增
  - KICKER: 你多了一个伙伴
  - TITLE: 以前每次技术浪潮，给你换工具。这次给你一个搭档。
  - SUBTITLE: 超级能干。但人还不会跟它协作——这本身就是最大的挑战。
  - v1 核心洞察：AI 不是"更好的工具"——它是通才伙伴。左：程序员（窄域专家），右：AI（通才，product+coding+testing+ops+reporting）。最大的挑战不是 AI 的能力，是人还没学会跟 Partner 协作。

---

### Act II: SDLC IS BEING UPTURNED — NOT THEORETICALLY, RIGHT NOW (Slides 06-09)

#### Block A: SDLC 被掀翻了 (4 slides)
- **06 `s06_old_map_new_map`** | Framework
  - KICKER: 旧地图只管人
  - TITLE: 瀑布、V 模型、敏捷——画的是人独自怎么走。现在多了一个。
  - SUBTITLE: AIDLC？没人知道长什么样。但大家已经在画了。
  - 三张旧地图（Waterfall/V-Model/Agile）——前提一致："人先想清楚，人写，人验"。新地图：空白画布+问号+一个 Partner 并肩看向前方。

- **07 `s07_deer_valley_engelberg`** | Impact / Evidence
  - KICKER: 五个月，同一群人
  - TITLE: 「不确定多于确定」→「不是 slides，是 production。」
  - SUBTITLE: Martin Fowler，ThoughtWorks 首席科学家。两次 retreat，他召的。
  - Fowler 是可信度的核心证据——他不是 AI evangelist，他是"total, absolute skeptic"。5 个月，同一群人，语调翻转。

- **08 `s08_beck_fowler`** | Impact / Evidence
  - KICKER: Agile 的原班人马怎么说
  - TITLE: Beck + Fowler：AI 的量级，大于之前所有变革的总和。
  - 三个信号：AI magnitude > 所有之前变革总和、TDD 变成 non-negotiable、中层最危险。Laura Tacho 12 万开发者数据：AI 是放大器。

- **09 `s09_fable5_bottleneck`** | Impact / Evidence
  - KICKER: 瓶颈从机器变成了人
  - TITLE: Fable 5 来了。写代码的能力远超一般程序员。
  - 关系转变：operator→tool 变成 delegator→executor。Mollick: "I commission." Krieger: "wake up to find it done." 瓶颈第一次从机器变成人——Trust Gap。

---

### Act III: HUMAN ROLE AND ORGANIZATION ARE BEING REWRITTEN (Slides 10-15)

#### Block B: 人的角色被重写 (3 slides)
- **10 `s10_the_chain`** | Concept Split
  - KICKER: 信息加工链
  - TITLE: 软件开发就是把需求一步步加工成代码。以前每个环节都是人。
  - ITO Chain 可视化：7 个节点，每个过去是不同专家。AI 通才横跨中间所有环节。人只有两个方向：上游（define what）或下游（govern output）。

- **11 `s11_too_fast_to_review`** | Concept Split
  - KICKER: 人审不过来了
  - TITLE: AI 一晚上写几千行代码。人还是那个速度在 review。
  - 漏斗意象：大量代码涌入，单滴流出。Fowler 重新定义"Verified"——不是"你读过了"，是"被测试/类型检查/自动闸门验证过了"。

- **12 `s12_on_the_loop`** | Framework
  - KICKER: 从盯着到设护栏
  - TITLE: Human-in-the-loop 变成 Human-on-the-loop。
  - Kief Morris 框架。新工种：Supervisory/Harness/Middle Loop Engineering。OpenAI 案例：3 人 + 5 月 + 100 万行代码，零人手写、零人 review。80% 时间在建 harness。

#### Block C: 组织的连锁反应 (3 slides)
- **13 `s13_mid_pack_at_risk`** | Impact / Evidence
  - KICKER: 中层最危险
  - TITLE: AI 最先替代的不是不会写代码的人。是只会写代码的人。
  - Three-Tier Split：初级意外安全（AI-native）、中层真正危机（CRUD 技能被 AI 追上，但架构判断力未积累）、资深转向架构（Harness Engineer + Agent orchestrator）。

- **14 `s14_block_layoff`** | Impact / Evidence
  - KICKER: 激进重构
  - TITLE: Block：废掉层级，一家公司只留三种人。
  - IC / DRI / Player-Coach 三种角色。AI agent 做中间协调层。Goose（GitHub 39K stars）是公开证据。
  - **Honest footnote**: 40% 裁员主因成本削减（237% 超招、股价跌 70-80%、CFPB 罚），AI 真实但次要。Klarna 回旋镖——55% 企业后悔 AI 裁员。

- **15 `s15_cloudflare_precision`** | Impact / Evidence
  - KICKER: 精准诊断
  - TITLE: Cloudflare：一把尺，把所有人分成三种。
  - Builder/Seller/Measurer（溯源 Drucker 1954）。"Displacement, not reduction"——换一种人替代另一种人。revenue +34%、Workers 550M。
  - **Honest footnote**: 裁员 20%、股价跌 14-24%。但 9 位独立分析师判定为结构性重组。

---

### Act IV: THE SAME THING IS HAPPENING IN YOUR INDUSTRY (Slides 16-21)

#### Transition (1 slide) ★ v1 新增
- **16 `s16_sdlc_to_bpm_bridge`** | Section Divider / Bridge
  - KICKER: 换挡
  - TITLE: 软件的故事讲完了。现在，轮到你的行业。
  - SUBTITLE: 同一条信息加工链，只是换了名字
  - 叙事齿轮切换。不给新数据——只有一句 pivot。极简视觉，匹配封面/closer。

#### Block D: BPM = SDLC 的孪生兄弟 (3 slides)
- **17 `s17_bpm_sdlc_twin`** | Framework
  - KICKER: 你们公司也在加工信息
  - TITLE: 软件有 SDLC。你们公司有 BPM。两条完全同构的信息加工链。
  - BPM 40 年学术传承（MIT 1980s → Dagstuhl 2026）。18 位作者 Agentic BPM Manifesto。不是类比——是学术和工业双重验证的结论。

- **18 `s18_framed_autonomy`** | Framework
  - KICKER: 有框，才有真正的自主
  - TITLE: Framed Autonomy = 人定边界。Agent 在框内可劲儿干。
  - SUBTITLE: 框不是笼子——是让你敢放手的边界。
  - v1 最丰富的框架页。琥珀色力场框内：Yan（砚，写/验）和 Zhu（铸，建/连）——两种 Agent，同一个框。框外：一只手轻搭在框边。Operational Frame + Normative Frame 解释。德国能源网 99% 成功率。

- **19 `s19_four_layers`** | Framework
  - KICKER: 四层重构
  - TITLE: 企业 IT 有四层。每一层都在被 AI 重写。
  - 前端（Office/飞书/钉钉→Agent 基础设施，最被低估）、中端（Agentic Orchestration/ProcessOS）、后端（CRM/ERP→数据源）、治理（Agent 365/Control Tower）。每层有 SDLC 精确映射。

#### Block E: 案例 (2 slides)
- **20 `s20_allianz_nemo`** | Impact / Evidence
  - KICKER: 唯一有独立第三方验证
  - TITLE: Allianz「Project Nemo」——不是高举高打，是从最窄处跑通，再铺开。
  - Planner Duo（舵）指挥 He（核）/Cha（察）/Suan（算）三个 specialist agent。claims 处理 -80%。人从 claims processor 升级为 AI output reviewer+signer。
  - **Honest footnote**: -80% 仅适用 narrow "食物腐败 <AUD$500" 类别。Maria Janssen: "We scoped it intentionally."

- **21 `s21_maersk_edge_ai`** | Impact / Evidence
  - KICKER: 情报先行
  - TITLE: Maersk：130 年航运巨头，先建数字孪生，再让 AI 上船。
  - SUBTITLE: 不是科技公司。是全球最大的集装箱航运公司。
  - Allianz 路径（直接 Agentic build）vs Maersk 路径（Process Intelligence First）。Star Connect 2.5B IoT 数据点、fuel -9.2%、$300M+ 年节省。Trade & Tariff Studio customs AI。Gemini 90% on-time (2x industry)。
  - **Honest footnote**: TradeLens $100M+ 关停（竞争对手不愿意向 Maersk 控制的平台喂数据）。Customer service AI 质量落后于 operational AI。

---

### Act V: WHY THE PYRAMID EXISTS, AND WHY IT'S OVER (Slides 22-24)

#### Block F: 罗马军团散了 (2 slides)
- **22 `s22_roman_legion`** | Concept Split
  - KICKER: 两千年的结构
  - TITLE: 组织金字塔不是「效率最高」。是「人是信息瓶颈」下的不得已。
  - SUBTITLE: 罗马军团，公元 1 世纪。现代企业，公元 21 世纪。同一种结构。
  - v1 的理论高峰。双瓶颈 (vertical Dunbar 7-15 + horizontal 知识边界)→金字塔 + 部门墙。2000 年没变。AI 通才 + 零沟通成本 → 同时击穿二者。纯 relay 中层和纯跨边界对接——同时失去存在理由。

- **23 `s23_measurers_not_builders`** | Impact / Evidence
  - KICKER: 量度者，不是建造者
  - TITLE: 纯测量、报告、协调的岗位——不是裁掉，是重新定义。
  - Builder/Seller/Measurer 框架可诊断任何组织。Measurer 被重新定义：质检员→AI 异常处理员、排产员→AI 排产审查员、成本会计→AI 成本决策者。三波时序：productivity → communication → organization。

#### Block G: 没有结论，只有一个问题 (1 slide)
- **24 `s24_convergence`** | Concept Split
  - KICKER: 不是互相借鉴，是融合
  - TITLE: SDLC 和 BPM。两条河。正在汇成一条。
  - 软件的经历 = BPM 的经历。同一套工具（Claude Code、飞书/钉钉 CLI）。不是"边界模糊"——是收敛在同一个 Agent 基础设施上。

---

### Act VI: NOW WHAT? (Slide 25)

- **25 `s25_what_will_you_do`** | Closer
  - TITLE: 外面都变了。你打算怎么变？
  - SUBTITLE: 我今天没有结论。只有一个问题。
  - 极简 closer。只有 cream 纸 + 一个琥珀色原点。不给答案——只留一个问题。软件开发是煤矿金丝雀。你的行业也在加工信息。你是下一个。

---

## 5. Slide Map（完整清单 — 25 slides）

| # | ID | VISUAL TYPE | KICKER | CLAIM |
|----|-----|-------------|--------|-------|
| 01 | s01_cover | Title / Opener | — | AI 正在重写一切信息加工工作。软件先行，企业跟进 |
| 02 | s02_opening | Title / Opener | 三年 | 从补全一行代码，到接管整个项目。这不是 hype——是加速度 |
| 03 | s03_why_software_first | Concept Split | 为什么是软件先被颠覆 | 编译器 0.1s 反馈 + GitHub 数十亿行代码 = AI 先学会了软件 |
| 04 | s04_one_tool_two_modes | Impact / Evidence | 同一套工具，两种模式 | 同样的 Agent 引擎同时服务 coding + office——软件是先行样本 ★ |
| 05 | s05_partner_not_tools | Concept Split | 你多了一个伙伴 | 每次浪潮换工具。这次给你一个搭档。但人还不会协作 ★ |
| 06 | s06_old_map_new_map | Framework | 旧地图只管人 | 瀑布/V/Agile 画的都是人独自走。现在多了一个。AIDLC 是问号 |
| 07 | s07_deer_valley_engelberg | Impact / Evidence | 五个月，同一群人 | Fowler 两次 retreat——从犹豫到"不是 slides，是 production" |
| 08 | s08_beck_fowler | Impact / Evidence | Agile 的原班人马怎么说 | Beck+Fowler: AI 量级 > 所有之前变革总和。TDD non-negotiable |
| 09 | s09_fable5_bottleneck | Impact / Evidence | 瓶颈从机器变成了人 | Fable 5 让瓶颈第一次从机器变成人。Trust Gap 是新前沿 |
| 10 | s10_the_chain | Concept Split | 信息加工链 | AI 接管中间加工，人往上游（what）或下游（govern）迁移 |
| 11 | s11_too_fast_to_review | Concept Split | 人审不过来了 | AI 吞吐 vs 人类 review 速度——数量级差距，不是 staffing 问题 |
| 12 | s12_on_the_loop | Framework | 从盯着到设护栏 | In-the-loop→on-the-loop。人建 harness。新工种：Supervisory/Harness/Middle Loop |
| 13 | s13_mid_pack_at_risk | Impact / Evidence | 中层最危险 | Three-Tier Split。初级安全。中层危机。资深转向架构 |
| 14 | s14_block_layoff | Impact / Evidence | 激进重构 | Block 废层级，只留 IC/DRI/Player-Coach。AI 做中间层。Honest: 40% 裁员主因成本 |
| 15 | s15_cloudflare_precision | Impact / Evidence | 精准诊断 | Cloudflare Builder/Seller/Measurer。"Displacement, not reduction" |
| 16 | s16_sdlc_to_bpm_bridge | Section Divider / Bridge | 换挡 | 软件的故事讲完了。现在轮到你的行业。同一条链，不同名字 ★ |
| 17 | s17_bpm_sdlc_twin | Framework | 你们公司也在加工信息 | BPM = SDLC 完全同构。40 年学术传承。18 人 Dagstuhl Manifesto |
| 18 | s18_framed_autonomy | Framework | 有框，才有真正的自主 | 人定边界。Agent 在框内自主。Yan(砚)+Zhu(铸)两种 Agent——框是信任 |
| 19 | s19_four_layers | Framework | 四层重构 | 前端(Office)/中端(编排)/后端(记录)/治理——每层 SDLC 精确映射 |
| 20 | s20_allianz_nemo | Impact / Evidence | 唯一有独立第三方验证 | Allianz 从最窄处跑通。-80%（narrow scope）。Duo/He/Cha/Suan agent crew |
| 21 | s21_maersk_edge_ai | Impact / Evidence | 情报先行 | Maersk Process Intelligence First。两条路径，同一结论。Honest: TradeLens 关停 |
| 22 | s22_roman_legion | Concept Split | 两千年的结构 | 金字塔不是效率最高——是人作为信息瓶颈的不得已。AI 打破双瓶颈 |
| 23 | s23_measurers_not_builders | Impact / Evidence | 量度者，不是建造者 | Measurer 不是裁掉——是重新定义。三波冲击：productivity→communication→organization |
| 24 | s24_convergence | Concept Split | 不是互相借鉴，是融合 | SDLC/BPM 两条河汇成一条。同一套 Agent 基础设施 |
| 25 | s25_what_will_you_do | Closer | — | 外面都变了。你打算怎么变？不给答案——只留问题 |

★ = v1 新增（原始 22-slide 规划中不存在）

---

## 6. v1 关键学习（纳入 backbone 的设计知识）

1. **Agent 形象统一**：25 页 IMAGE PROMPT 中浮现出可复用的 Agent 视觉语言 → `agent-portrayal.md`
2. **诚实注脚**：每个案例 slide 都标注已知局限（数据范围/因果关系/失败教训）。听众分辨得出 propaganda 和 honest analysis
3. **通才伙伴 > 工具升级**：Slide 05 是整个 deck 的核心认知转换——没有这张 slide，观众会把后面的一切理解为"更好的工具"
4. **过渡页 ≠ 内容页**：Slide 16 是纯叙事齿轮——不给新数据，只让受众内心完成"从程序员到我"的切换
5. **不给答案**：Slide 25 刻意留白。演讲者不知道听众的行业应该怎么重组——但知道软件是先行样本，他们是下一个
6. **Block 粒度 > Part 粒度**：v1 的 10-block 结构比原始 4-part 更能指导 IMAGE PROMPT 写作——Block 可以对应可操作的视觉主题

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 v1 (22-slide, 4-part) | 从 manuscript 反向提取 outline |
| 2026-07-15 | v2: 重写为 25-slide, 10-block | 吸纳 v1 生产产出——3 新增 slides、agent 规范、honest footnote、Block 粒度升级 |
