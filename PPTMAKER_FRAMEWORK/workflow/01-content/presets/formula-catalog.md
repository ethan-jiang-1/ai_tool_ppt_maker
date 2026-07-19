---
title: Formula Catalog
stage: workflow/01-content
position: preset_catalog
type: reference
summary: 6 种公式模式，每种配 2-3 个工作实例。Agent 从隐喻 + 用户 topic 推导可证伪公式。
depends_on:
  - workflow/01-content/01-find-the-core-metaphor-and-formula.md
feeds_into:
  - BOOTSTRAP.md (Step 3.4)
agent_action: pattern_match
---

# Formula Catalog — 公式模式库

## Agent：如何使用本目录

核心公式是 deck 的可证伪命题——如果有人能证明它错了，deck 就失去了存在理由。本目录提供 6 种公式模式，每种包含模式说明、模板、工作实例和可证伪性测试方法。

**推导流程**：
1. 从用户确认的隐喻中提取核心 tension——这个隐喻暗示了什么因果关系？
2. 识别 outcome（用户最想让听众接受的那个结论）和 contributing factors（达成 outcome 的必要条件）
3. 对照本目录的 6 种模式，选择与 tension 结构最匹配的公式模式
4. 用该模式的模板，填入用户的变量，生成 1-2 个候选公式
5. 对每个候选公式做可证伪性测试——想象一个场景让它不成立。如果无法想象这样的场景，公式不可证伪，需要重写

**公式必须通过的三个测试**：
- **可证伪性测试**：能不能想象一个场景让公式不成立？能 → 通过。不能 → 公式是废话。
- **5 秒理解测试**：一个不熟悉你行业的人，在 5 秒内能理解公式主张什么吗？能 → 通过。不能 → 公式太复杂。
- **追溯性测试**：整份 deck 的每张 slide 都能追溯到公式的某个部分吗？能 → 通过。不能 → 公式和 deck 脱节。

**公式和隐喻的关系**：
- 隐喻让观众**感受到**问题（"Two Languages" → 焦虑：我说的话客户听不懂）
- 公式让观众**理解到**答案（"Readable Data + Managed Agents = AI Adoption" → 具体行动框架）
- 隐喻提供 emotional force，公式提供 logical rigor。两者共同决定 deck 的叙事结构

---

## Pattern 1: A + B = C

**模式说明**：两个独立条件共同产生一个结果。A 和 B 必须是独立变量（不能是同义词），且共同构成结果的充分条件。这是最经典的战略公式——它说"做好这两件事，你就达到目标了。"

**公式模板**：
> **[Condition A] + [Condition B] = [Outcome C]**

**工作实例 1 — 制造业/供应链**：
> **Readable Data + Managed Agents = AI Adoption**
- Readable Data：制造数据是否结构化、可查询、可被机器消费
- Managed Agents：组织是否具备驾驭 AI 代理的技能、习惯和治理
- AI Adoption：客户能否在 AI 驱动的采购系统中发现、评估和选择你

可证伪性测试：如果有人能证明 (a) 数据不可读也能实现 AI 采购匹配，或 (b) 没有组织能力也能维持 AI 时代的竞争力，或 (c) Readable Data 和 Managed Agents 不是 AI Adoption 的充分条件——这个公式就失败了。能被挑战，所以有论证力。

**工作实例 2 — SaaS/产品**：
> **Adoption Velocity + Switching Cost = Defensible Growth**
- Adoption Velocity：新用户从注册到"无法离开"的 speed 和 success rate
- Switching Cost：用户离开时损失的数据、工作流、集成和习惯
- Defensible Growth：不依赖持续广告投入的、由产品自身驱动的增长

可证伪性测试：如果一家公司 adoption velocity 极快但 switching cost 为零（用户随时可以走），或者 switching cost 极高但没人用——增长就不是 defensible 的。两个条件缺一不可。

**工作实例 3 — 教育/培训**：
> **Relevant Content + Deliberate Practice = Skill Acquisition**
- Relevant Content：与学习者当前任务直接相关的知识（不是通用理论）
- Deliberate Practice：有反馈的、有挑战梯度的、持续的实际操作
- Skill Acquisition：能在真实场景中独立应用的能力（不是考试分数）

可证伪性测试：如果有人只拥有其中一个条件就获得了真实技能——或者拥有两个条件却没获得技能——公式需要修正。

**Agent 适用场景**：当用户说"我们需要做两件事才能成功"或"光有 X 不够，还需要 Y"——这就是 A + B = C 模式。检查 A 和 B 是否独立（不是同义词），是否共同构成充分条件。

---

## Pattern 2: Without X, Y Cannot Z

**模式说明**：识别一个被忽视的必要条件。X 不是锦上添花，而是 Y 实现 Z 的前提。这个模式的力量在于：它把一个"nice to have"重新定义为"must have"。

**公式模板**：
> **Without [X], [Y] cannot [Z] — regardless of [countervailing factor]**

**工作实例 1 — 制造业/工业**：
> **Without structured product data, manufacturers cannot be discovered by AI procurement systems — regardless of their quality certifications**
- X = structured product data（机器可读的产品属性）
- Y = manufacturers
- Z = be discovered by AI procurement systems
- Countervailing factor = quality certifications（即使有 ISO、TS 等认证也不够）

可证伪性测试：如果能找到一个制造商，其数据是非结构化的（只有 PDF catalog 和网页），但仍然能被 AI 采购系统准确匹配和推荐——公式被证伪。今天这几乎不可能，所以公式 holds。

**工作实例 2 — 医疗**：
> **Without continuous monitoring, chronic disease management cannot prevent acute episodes — regardless of the quality of periodic checkups**
- X = continuous monitoring（持续的生理数据流）
- Y = chronic disease management
- Z = prevent acute episodes
- Countervailing factor = periodic checkups（即使季度检查再彻底也不够）

可证伪性测试：如果定期的、高质量的检查足以在急性发作前捕捉到 decompensation 信号——公式退化为"nice to have"而不是"must have"。但临床数据显示检查间隔期内的恶化往往在检查时已不可逆，所以 continuous monitoring 是必要条件。

**工作实例 3 — 金融/商业**：
> **Without real-time margin visibility, pricing teams cannot optimize profitability — regardless of how sophisticated their pricing models are**
- X = real-time margin visibility（按 SKU/客户/渠道的实时利润数据）
- Y = pricing teams
- Z = optimize profitability
- Countervailing factor = sophisticated pricing models（即使模型再复杂也不够）

可证伪性测试：如果一家公司用季度成本数据 + 复杂模型做到了利润最优——公式被削弱。但实践中，季度数据在成本波动环境下会产生系统性定价错误，所以 real-time visibility 确实是必要条件。

**Agent 适用场景**：当用户说"大家都在做 Y，但效果不好"——这说明可能存在一个缺失的 X。问："要让 Y 真正达到 Z，有什么条件是目前被忽略的？"那个条件就是 X。

---

## Pattern 3: Old -> New via X

**模式说明**：描述一个从当前状态到目标状态的转型，并命名使之成为可能的催化剂。这个模式适用于 change narrative——不是论证"需要改变"（那已经达成共识），而是论证"改变通过什么路径发生"。

**公式模板**：
> **From [Old State] -> to [New State], via [Catalyst X]**

**工作实例 1 — 制造业/组织变革**：
> **From tribal knowledge -> to codified intelligence, via AI-assisted documentation**
- Old State: tribal knowledge（经验在师傅脑子里，离职即丢失）
- New State: codified intelligence（经验被系统化记录、可查询、可传承）
- Catalyst: AI-assisted documentation（AI 在师傅工作时自动捕获决策逻辑，不需要师傅额外花时间写文档）

可证伪性测试：如果 (a) 不借助 AI 也能实现同等效率的知识 codification（如果传统文档方法够用，为什么现在还没做到？），或 (b) AI-assisted 无法达到可用的准确度（如果捕获的逻辑有 20% 是错的，师傅们会拒绝使用这个系统）——公式失败。

**工作实例 2 — 医疗**：
> **From hospital-centric -> to home-first care, via remote patient monitoring + AI triage**
- Old State: hospital-centric（一切围绕医院设施组织）
- New State: home-first care（患者在家接受监测和初级干预）
- Catalyst: remote patient monitoring + AI triage（传感器持续采集 + AI 判断何时需要升级到人工干预）

可证伪性测试：如果 (a) remote monitoring 数据质量不足以支持临床决策，或 (b) AI triage 的假阴性率超过临床可接受标准——转型路径不成立。

**工作实例 3 — SaaS/技术**：
> **From feature factory -> to outcome engine, via usage-to-value mapping**
- Old State: feature factory（团队按 roadmap 开发功能，衡量产出而非结果）
- New State: outcome engine（团队按客户价值组织工作，衡量结果而非产出）
- Catalyst: usage-to-value mapping（将产品使用行为与客户业务结果建立可测量关联的数据基础设施）

可证伪性测试：如果 (a) 组织文化不允许"不建新功能就是没干活"的心态转变，或 (b) usage-to-value mapping 的技术实现成本超过其产生的决策价值——转型路径不可行。

**Agent 适用场景**：当用户说"我们需要从 A 变成 B"——这已经是 Old -> New 模式的信号。你的工作是：找出 via 什么。催化剂必须是具体的、可操作的东西，不是 vague 的"通过创新"或"通过数字化"。

---

## Pattern 4: X is not Y, it's Z

**模式说明**：对一个被广泛误解的概念进行重新定义。这个模式的论证力量来自 cognitive reframing——当观众接受了新定义，他们看待整个领域的框架就变了。不是语义游戏——必须有真实的行为和决策含义。

**公式模板**：
> **[X] is not [common misconception Y] — it's [reframed understanding Z]**

**工作实例 1 — 制造业/质量**：
> **Quality is not conformance to specification — it's the customer's willingness to reorder without requalification**
- X = Quality
- Y = conformance to specification（符合图纸要求）
- Z = customer's willingness to reorder without requalification（客户愿意不重新验厂就下复购单）

论证含义：如果 quality = conformance，那你只需要检测设备。如果 quality = reorder willingness，那你需要管理客户体验的每一个触点——lead time consistency, packaging integrity, communication responsiveness, problem resolution speed。整个质量体系的投资优先级会完全不同。

可证伪性测试：如果存在一个制造商，conformance 100% 完美但客户仍然要求每次 re-qualify——说明 conformance 不是 quality 的充分定义。如果能找到这样的案例（实际上很容易找到），公式就获得了论证力。

**工作实例 2 — SaaS/产品**：
> **Onboarding is not teaching features — it's getting the user to their first meaningful outcome**
- X = Onboarding
- Y = teaching features（功能介绍、tooltip tour、knowledge base）
- Z = getting the user to their first meaningful outcome（让用户用产品完成一件对他们自己有意义的事）

论证含义：如果 onboarding = teaching features，那你的 metrics 是 feature adoption rate。如果 onboarding = first meaningful outcome，那你的 metrics 是 time-to-value 和 activation rate。两个定义导致的 onboarding 设计完全不同——前者是产品 tour，后者是引导式工作流。

可证伪性测试：如果用户学完了所有 feature 但仍然没有获得 meaningful outcome——说明 feature knowledge 不是 onboarding 的目标。大量 SaaS 产品的数据支持这个命题。

**工作实例 3 — 商业/战略**：
> **Strategy is not choosing what to do — it's choosing what not to do, and being explicit about why**
- X = Strategy
- Y = choosing what to do（选择做什么）
- Z = choosing what not to do, with explicit rationale（选择不做什么，并明确说明原因）

论证含义：如果 strategy = choosing what to do，你可以列一份令人满意的 initiative list。如果 strategy = choosing what not to do，你必须做出 uncomfortable decisions——对好的机会说不。这个定义迫使 leadership team 面对真正的 tradeoff。

可证伪性测试：如果一家公司"做了所有事"而成功——公式被证伪。但研究发现资源分散是企业失败的最常见原因之一。Focus 是 strategy 的 defining characteristic。

**Agent 适用场景**：当用户使用的核心术语被行业滥用到失去意义（"quality"、"innovation"、"AI"、"strategy"、"culture"）——这就是 reframing 的机会。问："当你说 X 的时候，行业里大多数人以为它是什么意思？你认为它真正应该是什么意思？"那个 gap 就是 formula 的 tension 来源。

---

## Pattern 5: More X = More Y, but only if Z

**模式说明**：描述一个有条件的 scaling 关系。这个模式的论证力量在于：它打破了线性思维——"投入更多资源 = 获得更多结果"——并揭示了 scaling 的 hidden constraint。大多数 scaling 努力失败不是因为在 X 上投入不够，而是因为没有满足 Z。

**公式模板**：
> **More [Input X] = More [Output Y], but only if [Condition Z] holds**

**工作实例 1 — 制造业/销售**：
> **More sales headcount = More revenue, but only if quoting accuracy doesn't degrade with scale**
- X = sales headcount
- Y = revenue
- Z = quoting accuracy doesn't degrade with scale

论证含义：销售团队扩大时，老销售的报价经验（脑子里装的"这个公差这个材料大概什么价"）无法传递给新销售。新销售要么报价过高丢单，要么报价过低亏本。在满足 Z（标准化报价系统、成本数据库、margin guardrails）之前，加人反而可能降低利润。

可证伪性测试：如果能找到一家公司，在报价系统没有改善的情况下，销售团队从 10 人扩到 50 人，人均 revenue 和 margin 都保持不变——公式被证伪。这类案例极其罕见——scaling 的 hidden constraint 几乎是普遍的。

**工作实例 2 — SaaS/工程**：
> **More engineering headcount = More product velocity, but only if architectural complexity is actively managed**
- X = engineering headcount
- Y = product velocity
- Z = architectural complexity is actively managed

论证含义：不加管理的架构复杂度随人数呈超线性增长——新人的代码增加了模块间的耦合，每个新 feature 的边际成本递增。Brooks's Law（"adding manpower to a late software project makes it later"）就是这个公式的一个特例。Z 的具体化：持续的重构投资、模块化边界纪律、on-call 反馈循环。

可证伪性测试：如果能找到一家公司，工程团队在 3 年内从 20 人扩大到 200 人，没有专项架构治理投入，feature delivery velocity 保持了线性增长——公式被证伪。大多数经历过 hypergrowth 的 CTO 会告诉你这是不可能的。

**工作实例 3 — 教育/培训**：
> **More training hours = More on-the-job performance improvement, but only if the training targets specific, measurable skill gaps with deliberate practice**
- X = training hours
- Y = on-the-job performance improvement
- Z = training targets specific, measurable skill gaps with deliberate practice

论证含义：通用培训（"effective communication"、"leadership 101"）投入再多小时也不会转化为 measurable performance change。只有当培训内容精确匹配一个已知的技能缺口，并包含刻意练习元素（反馈、重复、难度递增），培训小时才能转化为绩效提升。

可证伪性测试：L&D 行业有大量数据表明通用培训的 ROI 接近于零。如果有人能找到一个通用培训项目产生 measurable performance improvement 的案例——需要检查 measurement methodology。

**Agent 适用场景**：当用户说"我们只需要更多的 X"——这就是信号。问："更多 X 就一定等于更多 Y 吗？在什么情况下会不成立？那个条件就是你公式里的 Z。"

---

## Pattern 6: The X that Y needs is Z

**模式说明**：识别一个隐藏的需求——Y 追求某种结果，但一直在用错误的 X，真正需要的 X 是 Z。这个模式的力量在于：它纠正了一个系统性误解——whole industry 都在提供错误的解决方案，因为大家对"what Y needs"的定义是错的。

**公式模板**：
> **The [X] that [Y] needs is not [conventional answer] — it's [Z]**

**工作实例 1 — 制造业/供应链**：
> **The competitive advantage that manufacturers need is not lower cost — it's higher discoverability**
- X = competitive advantage
- Y = manufacturers
- Conventional answer = lower cost
- Z = higher discoverability

论证含义：在 AI 驱动的采购世界里，买家的 AI 系统在搜索供应商时，搜索的是结构化数据——不是价格。如果你的数据不结构化，你的价格再低也没有被看到的机会。你根本不在候选池里。Discoverability 是新的 table stakes——你首先需要被找到，然后才有机会谈价格。

可证伪性测试：如果 lowest-cost 供应商无需结构化数据就能在 AI 采购系统中持续获得新客户——公式被削弱。目前 AI 采购系统（如 SAP Ariba 的 AI matching、Amazon Business 的推荐引擎）的数据匹配逻辑支持 discoverability > cost 的命题。

**工作实例 2 — 医疗**：
> **The intervention that chronic disease patients need is not more specialist visits — it's continuous behavioral support between visits**
- X = intervention
- Y = chronic disease patients
- Conventional answer = more specialist visits
- Z = continuous behavioral support between visits

论证含义：慢性病患者一年看 4 次专科医生（共约 4 小时），剩下 8756 小时靠自己管理饮食、运动、用药、监测。在诊所里得到的建议如果没有日常支持来落地，几乎不起作用。Continuous behavioral support（coaching check-ins, medication reminders, dietary nudging）填补了 visits 之间的巨大 gap。

可证伪性测试：如果更密集的专科门诊（如每月一次）足以改变慢性病 outcomes——连续行为支持的必要性被削弱。但临床数据显示，门诊频率对 outcomes 的影响远小于患者日常自我管理的质量。

**工作实例 3 — SaaS/产品管理**：
> **The signal that product teams need is not more user requests — it's usage behavior under real work conditions**
- X = signal
- Y = product teams
- Conventional answer = more user requests
- Z = usage behavior under real work conditions

论证含义：用户说的（feature requests）和用户做的（actual usage patterns）是两回事。用户会 request 他们能想象到的东西（通常是小改进），但不会 request 他们无法想象的东西（通常是突破性创新）。Usage behavior 告诉你：他们在哪里卡住、在哪里绕过、在哪里放弃、在哪里 excel。这些是 users 不会（也不能）告诉你的信号。

可证伪性测试：如果 feature request voting 能 reliably 产生突破性产品创新——usage behavior observation 的价值被削弱。但产品历史上多数 breakthrough features 都不是用户 request 出来的（用户没有 request iPhone，他们 request 更好的键盘手机）。

**Agent 适用场景**：当用户说"客户说他们需要 X"但 X 显然是 symptom 而非 root need——这是信号。问："客户说他们需要 X，但他们真正想要的结果是什么？要达到那个结果，X 真的是最好的方式吗？如果不是，什么才是？"

---

## 跨模式选择指南

| 如果用户的情境是... | 优先考虑 | 原因 |
|---|---|---|
| 有两个独立条件共同决定结果 | Pattern 1: A + B = C | 同时强调两个条件的必要性 |
| 一个被忽视的 must-have 条件 | Pattern 2: Without X, Y cannot Z | 重新定义"必要条件" |
| 从当前到目标的转型 | Pattern 3: Old -> New via X | 聚焦转型路径 |
| 一个被误解的概念 | Pattern 4: X is not Y, it's Z | 认知重构，改变决策框架 |
| 线性逻辑的被打破 | Pattern 5: More X = More Y, but only if Z | 揭示 hidden constraint |
| 市场需求被系统性误解 | Pattern 6: The X that Y needs is Z | 纠正行业误判 |

**混合使用**：一个 deck 可以有一个主公式 + 几个 Block 级的子公式。例如 T10 的主公式是 "Readable Data + Managed Agents = AI Adoption"（Pattern 1），Block 3 内可能有一个子公式 "The competitive advantage that manufacturers need is not lower cost — it's higher discoverability"（Pattern 6）。子公式在 Block 内部论证，服务主公式。

---

## 反模式：公式陷阱

**陷阱 1：没有 tension 的恒真式。** "Innovation drives growth"、"Data enables better decisions"、"Customer focus leads to success"——这些话永远为真，永远 useless。它们不帮你决定做什么/不做什么。如果公式不能被挑战，它就不是公式——是口号。

**陷阱 2：变量无限递归。** "A + B + C + D + E + F = G"——你的公式有 6 个变量。观众在努力记变量名，而不是理解因果关系。如果公式有 3 个以上的独立变量，你还没想清楚。合并相关变量或提升抽象层级。

**陷阱 3：变量不是独立的。** "Data + Information + Insights = Value"——Data、Information、Insights 是同一个 pipeline 的三个阶段，不是独立变量。公式变成了同义反复："把数据处理得更好 = 更多价值"——这不需要论证。

**陷阱 4：可证伪性被 hiding 在 vague 的语言后面。** "Organizational Capability + Technology Adoption = Digital Transformation"——Organizational Capability 是什么？你怎么知道它存在或不存在？如果变量无法被观察和验证，公式虽然逻辑上可证伪但实践中无法证伪。**用具体的、可观察的指标定义变量。**

---
