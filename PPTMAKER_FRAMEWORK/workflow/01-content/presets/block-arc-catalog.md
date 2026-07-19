---
title: Block Arc Catalog
stage: workflow/01-content
position: preset_catalog
type: reference
summary: 5 种标准叙事弧线，每种配完整的 Block 序列。Agent 根据用户 deck type 和 topic 选择弧线。
depends_on:
  - workflow/01-content/02-build-narrative-arc-blocks.md
feeds_into:
  - BOOTSTRAP.md (Step 3.2)
agent_action: pattern_match
---

# Block Arc Catalog — 叙事弧线库

## Agent：如何使用本目录

当用户在 BOOTSTRAP intake 中告诉你 deck type（Pitch Deck / Keynote / Training / Report / Other），你的任务是从本目录中选择最合适的叙事弧线。弧线决定了 deck 的顶层结构——Block 序列和每个 Block 的论证功能。

**选择流程**：
1. 对照用户的 deck type，查看下方的 "Arc Selection by Deck Type" 表格
2. 基于用户 topic 的叙事性质（在劝说什么？建立什么？解释什么？推荐什么？）确认或调整弧线选择
3. 将选定的弧线告诉用户，简要解释为什么这个弧线适合他的场景
4. 用户确认后，将弧线的 Block 序列作为 deck 的骨架，在每个 Block 内根据隐喻和公式填充具体 slide

**关键原则**：弧线提供结构骨架，不提供具体内容。Block 内的 slide 内容完全由用户的隐喻、公式和 topic 决定。本目录告诉你 Block 的顺序和论证功能——你负责在每个 Block 内创造符合用户场景的 slide。

**弧线不是模板，是论证形状。** 同一弧线用于不同 topic 时，Block 名称和论证功能相同，但每个 Block 内的 slide 内容可以完全不同。就像同样是一个 "Problem -> Solution" 弧线，一个 AI startup 的 pitch 和一个医疗器械的 pitch 在 Problem Block 里讲的是完全不同的问题。

---

## Arc Selection by Deck Type

> **优先级说明**：如果你**用了对应的 deck-type 模板**（`deck-type-templates/*.md`），**以模板内置的 Block Map 为准**——它已经为该类型实例化了一条经过设计的弧线。下面这张表用于两种情况：(a) 你**不用模板**、从零搭建时选一条弧线；(b) 帮你理解模板背后的叙事形状。**不要"用了模板又照这张表另选一条弧线"**——模板的 Block Map 与某条通用弧线不必逐块对应（如 keynote 模板是 External Trigger→Diagnosis→Framework→Evidence→Organization→Risk+Close，比通用 Arc 2 更贴合战略场景），那是刻意设计，不是冲突。

| 用户选的 Deck Type | 首选弧线（template-free 时） | 备选弧线 | 选择理由 |
|---|---|---|---|
| A. Pitch Deck（融资） | 1. Problem -> Solution | 5. Before -> After | 投资人需要先理解问题，再看解决方案。Before->After 适用于已经在市场上证明了 traction 的公司 |
| B. Keynote（战略） | 2. Opportunity -> Urgency | 3. Vision -> Roadmap | 战略 keynote 的核心是"为什么现在必须动"。如果听众已经认同 urgency，用 Vision->Roadmap 聚焦"往哪走" |
| C. Training（教学） | 5. Before -> After | 3. Vision -> Roadmap | 教学的核心是"从不会到会"的 transformation。Vision->Roadmap 适用于技能发展路线图 |
| D. Report（汇报） | 4. Evidence -> Action | 1. Problem -> Solution | 汇报的核心是"基于发现推荐行动"。如果发现本身就是一个待解决的问题，切换到 Problem->Solution |
| E. Other | 2. Opportunity -> Urgency | — | 默认用最通用的战略弧线，按需调整 |

**弧线匹配的补充判断**：
- 如果你的 topic 核心是一个新产品/新方案 → Problem->Solution 或 Before->After
- 如果你的 topic 核心是市场变化/外部冲击 → Opportunity->Urgency
- 如果你的 topic 核心是战略规划/目标设定 → Vision->Roadmap
- 如果你的 topic 核心是分析结果/研究发现 → Evidence->Action

---

## Arc 1: Problem -> Solution

**弧线描述**：经典的论证弧线——先让观众感受到问题的真实存在和严重性，再展示解决方案如何系统地应对这个问题。这是最古老也最强大的叙事形状，因为它的逻辑是不可抗拒的：你只有先同意"这里有问题"，才会关心"怎么解决"。

**Best for**：融资 Pitch Deck、产品发布 Keynote、销售提案、任何需要说服观众"你需要这个东西"的场景。

**不适合**：观众已经承认问题存在且正在寻找方案的场景（那样的话 Solution 前面的 Problem 部分会让他们 impatient）。如果你的听众跳过 Problem 已经在问"我们该怎么做"——切换到 Vision->Roadmap 或 Evidence->Action。

**观众旅程**：不知道/不觉得有问题 → 认识到问题存在 → 理解问题严重 → 看到解决路径 → 相信路径可行 → 信任执行者 → 愿意行动。

**Block 序列**：

| # | Block 名称 | 叙事问题 | 建议 slide 数 | 论证功能 |
|---|---|---|---|---|
| 1 | **Hook** | "Why should I keep listening?" | 1-2 | 用一个 surprising fact、反直觉的数据、或一个 relatable 的场景抓住注意力。不要在这里讲解决方案——只种下一颗"事情有点不对"的种子 |
| 2 | **Problem** | "What is the problem, and why does it matter?" | 3-4 | 展开问题：谁受影响？损失是什么？为什么现有方案不 work？用具体的故事或数据让问题 tangible。这个 Block 的长度决定观众对 Solution 的 interest——问题不够痛，方案就没什么意思 |
| 3 | **Solution** | "How do you solve this problem?" | 3-5 | 展示你的方案如何系统性地回应 Problem Block 中提出的每个痛点。不是 feature list——每个 solution element 对应一个 problem element。概念→证据节奏（提出一个方向，紧跟一个验证点） |
| 4 | **Evidence** | "Why should I believe this works?" | 2-3 | 客户案例、traction 数据、第三方验证。不要自己说自己好——让证据说。至少一个具体案例（named or anonymized with details），至少一个量化结果 |
| 5 | **Market** | "Is this worth doing at scale?" | 1-2 | 市场规模、增长趋势、结构性变化（为什么现在是对的时机）。不需要完整 market analysis——只需要足够让观众理解 opportunity size |
| 6 | **Team / Capability** | "Why you? Why will you win?" | 1-2 | 团队优势、技术壁垒、独特洞察、先发优势。诚实——不要 claimed 每一个维度都赢。指出你最关键的 1-2 个 unfair advantage |
| 7 | **Call to Action** | "What do I do next?" | 1-2 | 具体的下一步——不是"Thank You"，而是"让我们安排一次 technical deep dive"或"请批准 Phase 1 预算"。CTA 要具体到观众不需要思考就能执行 |

**典型 slide 总数**：12-20 张（pitch 节奏 12-14 张；keynote 节奏 16-20 张）。

**示例应用**：
一家 AI-powered 供应链风险管理 SaaS 公司做 Series A pitch。
- Hook：一张图——2024 年全球供应链中断事件数 vs 2020 年，surprising 的涨幅
- Problem：三个真实场景——一个汽车制造商因为 Tier-3 供应商的问题停产 3 周、一个零售商因为港口拥堵错过了整个 holiday season、一个药企因为原料短缺丧失了 FDA 优先审评资格。让 VC 感受到这不是"供应链风险"这个抽象概念——这是具体的、昂贵的、频繁的真实事件
- Solution：三个模块映射三个 Problem 场景——supply chain mapping（看到 Tier-N 供应商）、risk sensing（提前预警）、contingency engine（自动生成替代方案）。一个 demo flow 展示从 alert 到 action 的完整路径
- Evidence：一个付费客户的具体数据——预警了 X 次中断，避免了 $Y 的损失，ROI 是 Z 倍。最好有客户 quote
- Market：供应链风险管理软件的市场规模 + "AI 让 Tier-N visibility 从不可能变成可能"的结构性变化
- Team：创始人是前供应链 VP + 前 ML 工程师，在行业里见过问题，在技术上能解决问题
- CTA：$3M seed round，具体 use of funds（engineering hire + go-to-market）

---

## Arc 2: Opportunity -> Urgency

**弧线描述**：核心论证不是"有个问题需要解决"，而是"有个窗口正在打开，不开窗就会错过"。这个弧线适合当市场/技术/客户行为发生结构性变化，early movers 正在建立优势，cost of waiting 呈指数增长的情境。

**Best for**：战略 Keynote、Board Presentation、行业趋势分享、转型动员演讲。

**不适合**：听众对新机会持怀疑态度需要先看到"为什么现有方式不 work"（那样的话需要 Problem->Solution 的 Problem Block 铺垫）。如果变化本身有争议，先建立"change is real"再讲 opportunity。

**观众旅程**：现状认知 → 看到变化信号 → 理解变化的性质和规模 → 意识到早期行动者的优势 → 感受到 waiting 的成本 → 明确第一步。

**Block 序列**：

| # | Block 名称 | 叙事问题 | 建议 slide 数 | 论证功能 |
|---|---|---|---|---|
| 1 | **Context Shift** | "What changed, and why does it matter?" | 2-3 | 描述一个结构性变化——技术突破、法规变更、客户行为 shift、竞争格局重组。不是"AI is important"而是具体的变化（如"AI procurement systems now handle 40% of B2B RFQs, up from 5% three years ago"）。用数据+timeline 让变化 tangible |
| 2 | **New Capability** | "What is now possible that wasn't before?" | 2-3 | 变化创造了什么新能力？不是"我们可以用 AI 了"而是"以前需要 4 次 site visit 才能验证的供应商，现在 AI 可以通过数据在 2 分钟内完成初筛"。展示旧世界和新世界的对比——不是未来的事，是现在正在发生的事 |
| 3 | **Early Movers** | "Who is already moving, and what are they gaining?" | 2-3 | 展示已经行动的组织的具体成果。不需要正面案例太多——2-3 个就够了，但每个都要有具体数据。包括一个不太可能/反直觉的 early mover（如"不是 Silicon Valley startup——是 Ohio 的一家三代家族制造企业"），让观众觉得"如果他们都能做到，我们也能" |
| 4 | **Cost of Waiting** | "What happens if we don't move now?" | 2-3 | 量化 waiting 的成本。不是恐惧煽动——是冷静的 business case：先行者的数据网络效应、客户期望的锁定、人才市场的竞争。一页 timeline 展示 waiting 6/12/18 个月分别意味着什么差距 |
| 5 | **First Step** | "Where do we start — concretely?" | 2-3 | 回到行动——不是"制定 AI 战略"，而是"下周可以开始做的一件事"。提供具体起点：一个 pilot、一个 hire、一个 data audit。降低行动的心理门槛——观众需要离开时觉得自己能做点什么，而不是 overwhelmed |

**典型 slide 总数**：10-16 张（keynote 节奏 14-16 张；board 汇报 10-12 张）。

**示例应用**：
一家制造集团董事会上的 AI 战略 briefing。
- Context Shift：AI procurement systems（SAP Ariba AI matching, Amazon Business, niche vertical platforms）处理 B2B RFQ 的比例从 2021 年的 <5% 上升到 2026 年的 ~40%。这不是预测——是已发生的 shift。数据来源：第三方行业报告。
- New Capability：对比——旧世界中一个 buyer 找供应商的流程（4-6 周，多次 site visit，依赖 personal network）vs 新世界中 AI 做初筛（2 分钟，基于 structured data 的质量匹配）。旧世界中你的 quality 会被发现；新世界中你的 data 需要先被找到。
- Early Movers：三个案例——一个德国精密零件制造商（结构化 80 万 SKU 数据后 incoming RFQ 增加了 35%）、一个日本自动化组件供应商（AI configurator 将 quote-to-order 从 3 天缩短到 3 分钟）、一个中国电子制造服务商（digital twin 让客户在签约前远程审核产线）。每个案例都有具体数字和来源。
- Cost of Waiting：数据网络效应——每多一个供应商结构化数据，AI 系统的匹配精度就提高一点。先行者在 AI 系统中的 ranking 会积累优势。同时 buyer 的 AI tools 普及速度在加快。一张 timeline：6 个月窗口期建立 data readiness，12 个月后 competitive gap 开始显现，18 个月后追赶成本 > 先行投资。
- First Step：具体——选 20 个最高 revenue 的 SKU，做 data readiness audit（属性完整性、格式标准化、可查询性）。不需要全公司动员——一个 2 人小组，4 周时间，产出是一份 data readiness scorecard + 修复计划。

---

## Arc 3: Vision -> Roadmap

**弧线描述**：描绘一个 compelling 的目标状态，然后展示从当前状态到达目标状态的路径。这个弧线的论证核心不是"你是否想去那个 destination"（假定观众已经想去），而是"这条路是否 realistic and actionable"。

**Best for**：战略规划 rollout、产品 Roadmap 分享、组织变革 kickoff、年度 planning offsite。

**不适合**：观众对 vision 本身有争议（需要先论证"为什么那个 vision 是对的"）。如果 vision 的合理性是讨论的核心——先用 Opportunity->Urgency 或 Evidence->Action 建立共识，再切换到 Vision->Roadmap。

**观众旅程**：看到目的地 → 理解当前位置 → 认识到 gap → 看到完整路径 → 理解里程碑 → 知道从哪里开始。

**Block 序列**：

| # | Block 名称 | 叙事问题 | 建议 slide 数 | 论证功能 |
|---|---|---|---|---|
| 1 | **Destination** | "Where are we going, and why is it worth the journey?" | 2-3 | 画出目标状态的 compelling picture——不是 vague 的愿景陈述，而是足够具体的画面，让观众能在脑子里"看到"目标达成时的样子。用具体的 metrics 定义 success：不是"we'll be an AI-first company"而是"customers will find us, evaluate us, and transact with us without a single human touchpoint on our side" |
| 2 | **Current State** | "Where are we now — honestly?" | 2-3 | 诚实评估当前状态相对于 Destination 的位置。不是"我们很差"而是"我们在 X 方面已经很强，在 Y 方面还需要建设"。honesty 建立信任——如果 audience 觉得你粉饰了 current state，他们会 discount 整个 plan |
| 3 | **Gap** | "What stands between here and there?" | 2-3 | 具体化 gap：不是"我们缺少 AI 能力"而是"我们的产品数据目前存在于 PDF catalogs 和 ERP free-text fields 中——在能被 AI 消费之前需要结构化。这不是技术差距，是数据基础设施差距。"每个 gap 都应该是可解决的——不是"文化不行"这种无论如何都解决不了的 vague gap |
| 4 | **Path** | "How do we cross the gap?" | 3-5 | 展示完整的路径：phases、workstreams、dependencies。不需要 Gantt chart 级别的细节，但要足够具体让观众看到逻辑连贯性。Phase 1 奠定什么基础？Phase 2 在此基础上解锁什么能力？Phase 3 实现什么样的 end state？每个 phase 有明确的 entry/exit criteria |
| 5 | **Milestones** | "How will we know we're on track?" | 2-3 | 关键的 milestone 和 checkpoint。每个 milestone 有：what（交付什么）、when（时间窗口）、who（谁负责）、signal（什么指标告诉我们它成功了）。让 milestones 足够具体以至于可以被客观判断"是否达成" |
| 6 | **Starting Point** | "What happens next week?" | 1-2 | 让 journey 从 actionable 的第一步开始。不是"Phase 1 启动"而是"下周一：X team 和 Y team 开 kickoff meeting，agenda 有三项...下周五之前产出：一份 current state assessment in Z area"。具体到日期和产出 |

**典型 slide 总数**：12-20 张（planning offsite 14-18 张；产品 roadmap share 12-16 张）。

**示例应用**：
一家中型制造企业向管理层 rollout 3 年 AI 成熟度路线图。
- Destination：2029 年的日常——一个 buyer 的 AI 系统发出 RFQ，企业的产品数据被自动匹配，AI agent 根据产品属性、产能、lead time 生成报价草案，人工审核后一键发送。一个 engineer 在 design 新零件时，系统自动推荐可制造的替代设计，附带成本比较。技能不再是"谁会操作这台机器"而是"谁会指导 AI 优化这条产线"。
- Current State：honest assessment——high-mix low-volume 精密制造，2000+ active SKU，数据存在于 ERP（部分结构化）+ CAD（非结构化）+ 工程师经验（tribal）。强项：制造工艺深度、客户关系、交付可靠性。弱项：数据可发现性、AI 工具使用率、数字化流程覆盖率。
- Gap：三个 gap——数据 gap（结构化程度 ~30%，目标是 >90%）、组织 gap（AI 使用习惯在工程师中几乎为零，目标是 AI-native daily workflow）、流程 gap（报价依赖人工经验，目标是在 AI 辅助下 80% 标准件自动报价）。
- Path：三个 phase——Phase 1: Data Foundation（6 个月，结构化 top 200 SKU 的全属性数据，部署一个内部 AI 数据查询工具让团队建立使用习惯）。Phase 2: Process Intelligence（12 个月，AI 辅助报价、AI 辅助质量检测、predictive maintenance pilot）。Phase 3: Autonomous Operations（18 个月，end-to-end AI-driven order-to-cash for standard orders, human-in-the-loop for complex orders）。
- Milestones：Phase 1: Month 3 — top 50 SKU 数据可被 AI 查询，工程师月活 >50%。Month 6 — top 200 SKU 完成，第一个 AI-assisted RFQ response 发出。Phase 2: Month 12 — 报价速度提升 50%，质检 AI 准确率 >95%。Phase 3: Month 24 — standard order 自动化率 >80%。
- Starting Point：下周一——CTO + Engineering Lead + Data Lead 4 小时 kickoff。Agenda: (1) 审核 top 50 SKU 清单, (2) 定义"结构化数据"的标准 schema, (3) 分配 data entry + validation 工作。产出：data schema document + 工作分配表。

---

## Arc 4: Evidence -> Action

**弧线描述**：从数据和分析出发，推导出诊断结论，评估选项，给出推荐，规划实施。这是 consulting-style 论证——结论的 credibility 完全建立在 evidence 的质量和分析的 rigor 上。

**Best for**：研究报告/汇报、咨询交付物、Board 汇报、内部诊断+建议、data-driven recommendation decks。

**不适合**：evidence 薄弱或只是装饰性的（那样的话 Evidence Block 会成为整个 deck 最脆弱的部分）。如果你的核心论证不依赖 data——选择 Problem->Solution 或 Opportunity->Urgency。

**观众旅程**：看到 findings → 理解诊断 → 看到选项 → 接受推荐 → 理解实施路径 → 预期 impact。

**Block 序列**：

| # | Block 名称 | 叙事问题 | 建议 slide 数 | 论证功能 |
|---|---|---|---|---|
| 1 | **Findings** | "What did we discover?" | 2-4 | 呈现关键发现——不是 data dump，是 curation。每个 finding 应该让观众产生一个 follow-up 问题（"why?"、"how much?"、"since when?"），这些问题的答案在下一个 Block。Findings 用可视化表达（趋势线、对比柱状图、异常标注），不要让观众读表格 |
| 2 | **Diagnosis** | "What explains these findings?" | 2-3 | 从 findings 到 root cause。不是"销售下降了 15%"（那是 finding），而是"销售下降的 80% 集中在三个客户 segment，这三个 segment 的决策者过去 18 个月内换了 AI-native 的 procurement lead——我们的产品数据 format 对新决策者的 AI tools 不友好"（那是 diagnosis）。Diagnosis 应该揭示一个非显而易见的因果链 |
| 3 | **Options** | "What could we do about it?" | 2-3 | 展示 2-4 个 options，每个有：方法（what）、预期影响（how much）、时间/资源（investment）、风险/downside。不要只给一个 option（"There Is No Alternative"不是 consulting rigor，是 manipulation）。让观众看到 tradeoff landscape——这个权衡选择的过程是 buy-in 的关键 |
| 4 | **Recommendation** | "What should we do, and why?" | 2-3 | 基于 Options 的分析，给出具体的 recommendation。清楚地说明为什么选 A 而不选 B——不是因为 A 完美，而是因为在当前 constraints 下 A 的 risk/reward ratio 最优。acknowledge tradeoff: "选择 A 意味着我们在前 6 个月会 lose X，但 12 个月后的 upside 是 Y" |
| 5 | **Implementation** | "How do we make this happen?" | 2-3 | 实施路径：phases、owners、resources、timeline。足够具体让观众能评估 feasibility。include dependencies——"这取决于 X team 在 Q2 之前完成 Y"。隐藏的 dependency 是方案失败的最常见原因 |
| 6 | **Expected Impact** | "What will be different, and when?" | 1-2 | 量化推荐方案的预期影响——leading indicators（3-6 个月内能看到什么变化）和 lagging indicators（12-18 个月的最终结果）。诚实：给一个 range 而不是一个 single number。如果你的 recommendation 结果是 "revenue growth of 15-25%"，可信度高于 "revenue growth of 22.4%" |

**典型 slide 总数**：11-18 张（board 汇报 11-14 张；完整 consulting deliverable 14-18 张）。

**示例应用**：
一家管理咨询公司向制造客户交付 pricing profitability diagnostic。
- Findings：三个关键发现——(1) top 5% 的客户贡献了 58% 的利润，bottom 30% 的客户在 fully loaded cost 下是亏损的, (2) 利润率最高的产品线不是 volume 最大的，而是一个"niche" product family 因为几乎没有竞争, (3) 报价流程中的 discounting 没有 visibility——sales 的 discount authority 在系统上没有 enforce。
- Diagnosis：root cause——成本分配系统按 revenue 分摊 overhead，导致 high-volume/low-margin 产品看起来 profitable，而 low-volume/high-margin 产品承载了不成比例的 overhead。同时 sales incentive 是 revenue-based 不是 margin-based，所以 sales 的 rational behavior 是用 discount 追求 volume。系统性问题——不是人的问题，是 measurement + incentive 的问题。
- Options：三个 options——(A) 轻量级：修正成本分配方法 + 设置 margin floor on quoting（低投资，快见效，但 sales resistance 高）, (B) 中量级: A + margin-based sales incentive redesign + strategic account program for top 50 customers（中等投资，需要 2 个季度 rollout）, (C) 重量级: B + full pricing transformation with dynamic pricing engine（高投资，12-18 个月，最大 upside 但 execution risk 高）。
- Recommendation：选 B，6 个月内完成。理由：B 的 margin uplift（estimated 300-500 bps）远大于 cost。A 的 sales resistance 在没有 incentive alignment 的情况下可能导致 key account loss。C 的正确方向但应该建立在 B 的基础上——先用 B 建立 margin 文化，再投资 technology。
- Implementation：Phase 1 (Month 1-2): cost allocation fix + margin floor rule in quoting system。Phase 2 (Month 3-5): sales incentive redesign + training + strategic account program launch。Phase 3 (Month 6): review, refine, decide on C。
- Expected Impact：leading indicator (Month 3): average quoting margin improvement of 200 bps。lagging indicator (Month 12): overall margin uplift of 300-500 bps, equivalent to $X million incremental profit。

---

## Arc 5: Before -> After

**弧线描述**：讲述一个 transformation story——从旧世界（有问题、有摩擦、有限制）到新世界（问题被解决、摩擦被消除、限制被突破）。和 Problem->Solution 的不同：Problem->Solution 聚焦于"问题-方案"的逻辑链，Before->After 聚焦于"变化"的体验——观众应该能感受到从 Before 到 After 的转变带来的释放感。

**Best for**：产品 adoption 故事、培训/教学 deck、客户成功案例、品牌 transformation、任何"能看到变化"的叙事。

**不适合**：变化本身尚未发生或难以具象化（那样的话 Before->After 的 After 部分会空洞）。如果 After 是 speculation——用 Vision->Roadmap 更合适。

**观众旅程**：活在旧世界（无意识）→ 感受到旧世界的 friction → 看到催化剂 → 想象新世界的可能 → 看到真实 evidence → 知道如何到达。

**Block 序列**：

| # | Block 名称 | 叙事问题 | 建议 slide 数 | 论证功能 |
|---|---|---|---|---|
| 1 | **Old World** | "What does the current reality look and feel like?" | 2-3 | 描绘旧世界——不是抽象地描述，而是具象地展示。使用场景、人物、具体 moment："Sarah 周三下午 3 点，正在从三个系统里复制数据到 Excel。她做了 4 年，每个 Wednesday afternoon 都这样过。"让观众在 Old World 里认出自己或同事 |
| 2 | **Tension** | "What's wrong with the old world?" | 2-3 | 明确旧世界的 pain——不是因为"效率低"，而是因为具体、有后果的原因："Sarah 的周三下午花在数据搬运上——但她真正该做的事（分析供应商 performance 的趋势）从来没时间做。她的 talent 被浪费在 copy-paste 上，她的部门每年因为 supplier issues 损失 $2M，她本该能 prevent 其中的大部分。"Tension = friction 的具体后果 |
| 3 | **Catalyst** | "What makes change possible now?" | 1-2 | 什么让 Before 到 After 成为可能？不是"我们的产品"——是某个具体的 change agent：一项新技术、一个新流程、一个洞察、一个决定。Catalyst 应该是具体的和 credible 的——不是 magic |
| 4 | **New World** | "What does the transformed reality look and feel like?" | 3-5 | 展示新世界——用和 Old World 相同的场景、人物、时刻做对比："Sarah 周三下午 3 点。系统自动从三个 source 获取数据，anomaly detection 标记了两个需要她判断的异常供应商。她花了 20 分钟做判断（这是她的 expertise），然后花了 2 小时做她一直想做但没时间做的事——分析 trend，设计 mitigation strategy。"New World 不是 paradise——是旧世界的 friction 被移除了，人的能力被释放了 |
| 5 | **Proof It Works** | "Is this real, or just a nice story?" | 2-3 | Evidence——真实的 Sarah（anonymized）、真实的结果、真实的数据。Before/after metrics comparison。最好有第三方验证或客户自己的话。Without proof, Before->After 是 fairy tale |
| 6 | **How to Get There** | "What do I need to do to cross from Before to After?" | 2-3 | 从 Before 到 After 的路径——不是 magic switch，是 concrete steps。降低心理门槛：不是"transform your entire organization"，而是"start with one process, one team, one Wednesday afternoon" |

**典型 slide 总数**：12-18 张（training deck 14-18 张；customer success story 12-15 张）。

**示例应用**：
一家 AI 文档自动化公司对 law firm 做 adoption pitch。
- Old World：一个 M&A 律师的 Monday morning——deal closing in 3 days，需要 review 2,300 页的 due diligence documents。目前的做法：junior associates 分文档，每个人手动读 + highlight + 在 Word 里写 summary。48 小时的连续工作。一个 missed clause = potential liability for the firm。律师的 expertise 被消耗在"找 needle in haystack"而不是"判断这个 needle 意味着什么"。
- Tension：具体后果——去年 firm 因为一个 missed change-of-control clause 赔了 client $4M settlement 并且 lost the client。Junior associate turnover 在 M&A 季达到 40%——不是不愿意努力工作，是不愿意做"human search function"的工作。Partner 的时间 spent on supervision 而不是 client advisory。
- Catalyst：AI document analysis 现在能做到：在 2,300 页中定位所有 change-of-control、indemnification、non-compete clauses，并 cross-reference 同一 clause 在不同文档中的表述差异。不是"AI 会取代律师"——是"AI 让律师只做律师该做的事"。
- New World：同一个律师的 Monday morning——AI 已经完成了 first-pass review，所有 flagged clauses 按 relevance + risk level 排列，cross-reference inconsistencies 标注出来。律师花了 4 小时 review AI 的发现（而不是 48 小时 manual search），然后花了 1 天做她真正专业的事——评估风险、设计 negotiation strategy、 advise client。Client 得到了更好的 advice。Firm 降低了 liability risk。Junior associates 留下来了。Partner 的时间花在了最高价值的活动上。
- Proof It Works：一个 peer firm（unnamed but described: "Am Law 50 firm, M&A practice"）在 pilot 中的结果——first-pass review time 减少 85%，missed clause rate 从每项目 1.2 降到 0.1，client satisfaction score 提升（有具体数字）。Pilot 律师的 quote："It's like someone turned on the lights in a room I didn't know was dark."
- How to Get There：Phase 1: 选 3 个 deal teams 做 60-day pilot（IT setup + training: 1 week, pilot period: 6 weeks, review: 1 week）。Phase 2: 基于 pilot results 决定 rollout scope。Phase 3: full adoption with customization for firm's specific practice areas。不需要 perfect——需要 start。

---

## 弧线混合使用

有些 deck 天然跨两个弧线。常见混合模式：

**Problem->Solution 开始 + Opportunity->Urgency 收尾**：前 2/3 论证"这里是问题和方案"，后 1/3 论证"而且窗口正在关闭，需要现在行动"。适用于 competitive pitch——不仅要赢"我们是最好的"，还要赢"现在不选会落后"。

**Evidence->Action 开始 + Vision->Roadmap 收尾**：前 1/2 用 data 建立诊断 credibility，后 1/2 展示基于诊断的 transformation roadmap。适用于 board presentation——board 需要先被说服"诊断是对的"，然后才关心"方案是什么"。

**混合规则**：混合时，保持 Block 序列的完整性——不要在 Block 中间切换弧线的论证逻辑。完整的 Block 1-3 来自弧线 A，Block 4-6 来自弧线 B。混合同一 Block 内部的论证逻辑 = 观众困惑。

---

## 反模式：弧线使用错误

**错误 1：用 Problem->Solution 做 training deck。** 学员不需要被说服"有个问题"——他们来是因为已经知道需要学习。Problem Block 会让他们 impatient。用 Before->After——让他们看到"你现在的做法"vs"学会之后的做法"。

**错误 2：用 Evidence->Action 但 evidence 不足以支撑 diagnosis。** Evidence->Action 的整个 credibility 建立在 Evidence + Diagnosis Block 的 rigor 上。如果 findings 只是 3 张 generic 图表——选择 Problem->Solution 或 Opportunity->Urgency（它们对 evidence 的要求更低，tension-driven 而不是 data-driven）。

**错误 3：在 Vision->Roadmap 的 Destination 中讲 problem。** Destination Block 应该是 aspirational。如果你在 Destination 中花了 2 张 slide 讲当前的困境——那些属于 Current State Block。Destination 讲"我们要去哪里"，Current State 讲"我们现在在哪里"。混在一起让观众既没有感受到 aspiration 也没有感受到 honesty。

**错误 4：在开始生产之前没有确定弧线。** 弧线决定了 deck 的顶层结构。如果你改了弧线（从 Problem->Solution 变成 Opportunity->Urgency），Block 序列完全不同。在生产了 10 张 slide 后再改弧线 = 重新设计 80% 的 deck。**在 Phase 1 确认弧线，Phase 2 确认 slide 内容，弧线确定后再进入生产。**

---
