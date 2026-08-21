---
title: 传统企业 AI/BPM 案例候选清单（选题备查 · 待用户定案）
stage: phase_0
topic: "05"
status: shortlist-for-decision
created: 2026-07-11
summary: 为 deck 第 20/21 页（传统企业案例）精选故事的挖掘结论。目标=用 1-2 个"名字大、结果突出、证据扎实、非技术听众能懂"的传统企业故事，讲透 AI 对人和组织的冲击。已挖三层：dpt_rb_researches/dpt_rb_ai_cases（10家企业）、dpt_rb_researches/dpt_rb_ai-era-bpm-process-disruption（final + seed_topics + artifacts + 原始缓存）。结论：真正扛得住较真的只有少数几个。
sources:
  - dpt_rb_researches/dpt_rb_ai_cases/final/*.md
  - dpt_rb_researches/dpt_rb_ai-era-bpm-process-disruption/final/*.md
  - dpt_rb_researches/dpt_rb_ai-era-bpm-process-disruption/seed_topics/*.md
  - dpt_rb_researches/dpt_rb_ai-era-bpm-process-disruption/artifacts/wave{1,2}/*
  - dpt_rb_researches/dpt_rb_ai-era-bpm-process-disruption/_cache/wave1/primary/02_*/
---

# 传统企业 AI/BPM 案例候选清单（20/21 页选题）

> 目标：用 1-2 个传统（非高科技软件）企业故事，讲透"AI 提升生产力后，人的角色 / 组织结构被重画"。不堆砌、要动听、证据扛得住较真。
> 现状：现有 20/21 页是"一页塞 4-5 个案例"的数据堆砌（GE/Wells Fargo/Petrobras/波士顿儿童医院 + 奇瑞/兆企/司盟），听众消化不了。要换成精选深讲。

## 🥇 第一梯队（推荐主讲）

### 1. Allianz Project Nemo（保险）— 唯一有独立第三方验证
- **故事**：澳洲食品变质理赔，**1 个 planner agent 调度 7 个专才 agent**（承保核对 / 天气事件确认 / 欺诈筛查 / 赔付计算 / 审计 …），处理时间 **-80%（数天→数小时）**，**赔付由人做最终决定**（human-in-the-loop）。
- **为什么好**：名字大、结果突出、人的角色迁移清晰（人→签核者）。全 bundle **唯一**有独立媒体（insuranceNEWS.com.au, 2025-11-24）+ 独立分析机构（Evident AI Use Case Tracker）双重佐证。
- **真正的立意**：传统保险巨头**刻意把 AI 缩到极窄高频低值场景先验证**——CTO... 更正：**首席转型官 Maria Janssen** 原话 "We scoped it intentionally"。这个"先缩窄验证"的张力本身就是好素材。
- **⚠️ 必须诚实标注（两个坑）**：
  1. 高管是 **chief transformation officer 首席转型官 Maria Janssen，不是 CTO**（内部资料记错）。
  2. **80% 只限"食品变质 <AUD$500"**这一窄类目，不能说成"全理赔 -80%"。扩展到车险/健康险仍是"意向"，无落地数字。
  3. 7 个 agent 但独立源只逐一点名约 5 项职能，完整列表来自行业口径——列"7 个各做什么"时需标注部分未逐一披露。

### 2. HDI / Talanx（保险集团）— 组织冲击画面感最强
- **故事**：用 AI 啃"长尾流程"——1 万个确定性流程已覆盖 75% 交易，剩下 **13,598 个变体**传统方式建不起（一个流程建设 >6 个月、ROI 打不平）；邮件首响目标从 2-3 周 → 分钟级。
- **为什么好**：有一个绝佳的**人的角色迁移**细节——`scoring agent 必须在人工监督下正确跑满 100 次，才允许自主运行`。人从"建流程的人"→"监督 AI 跑够 100 次的签核者"。CEO 金句"这是运营模式变革，不是买工具清单"；把公司积累的信件/工单称作 **"gold"**。
- **⚠️ 坑**：Camunda 厂商博客口径（+CamundaCon 2026 大会实录，半独立）；速度数字是**目标非已验证**；agent 仅 50 个流程内部试点。比 Allianz 弱一档。
- **用法**：与 Allianz 搭配——Allianz 讲"结果被独立验证"，HDI 讲"组织怎么改、护栏怎么设（100 次）"。

## 明确不推荐单独主讲

- **Jabil（制造业，曾被考虑）**：名字大，但 AI-as-process（Synapse Worker / Agentic Factory）被 ARC 独立机构**正面确认为概念级、无运营案例**（两年论坛展示无 before/after、无工厂/流程/工人数）。它的 $13.1B AI 收入是"造 AI 设备卖钱"（AI-as-product），不是改造自己工厂。讲组织冲击证据薄，易被拆穿。**可退为方法论铺垫**：Invest+Partner+Govern（不用自研大模型）这条可复制路径是真的。
- **Brex**（0→40% 自动批卡、金句"把资深判断编码进系统"）：结果猛、first-party 可信，但**是硅谷金融科技，非传统企业**。可作"新贵对照组"。
- **Molex**（PO 确认 30%→90%、87% 发票免人工）：具名制造巨头，但已落地是**流程挖掘/自动化，agentic 明说是"下一步"未上线**——讲 AI agent 冲击名不副实。仅作"流程情报先行"铺垫。
- **BMW Catena-X**（召回 1.4M→14 辆，数字最震撼）：AI 证据全网仅一句话（Tier 4），是数据共享/召回故事非人组织冲击，风险高。仅可作"震撼数字"且严格限定为愿景案例。
- **Foxconn**：AI-as-process 侧零独立验证，是"打假故事"非"冲击故事"。
- **Fastenal**：底层是 IoT+规则引擎，AI 是最薄一层，是反-AI-hype 故事。
- **Böllhoff**：几乎无 AI（合规故事），且有 EUR 3.28M 误标红线（DO NOT CITE）。
- **Sutherland / Kovil / LandingAI / Beam**：客户匿名 + 数字多为"预计/pilot" + 厂商 Tier 3 口径，不能主讲。
- **Klarna 客服**：厂商口径、无 containment rate、且遗漏了早前对全 AI 客服的部分回撤。
- **华为**：负证据案例（"不是可证实的采购 Agent"），且本身是科技公司。

## 可补挖（若要第二个具名大公司）
- **Barclays（大银行，客户尽调端到端重构）**：在 CamundaCon Amsterdam 2026 分享过，具名大银行——但本 bundle **未抓原始页、无量化数字**。要用需再补一轮 deep research。

## 附：讲"AI 对人的隐性冲击"的两个非案例锚点（去泡沫用）
- **去技能化悖论 deskilling paradox**（BPM 库 06 章）：AI 审查者变"橡皮图章"——批准率 30.1%→36.8%、评论量 -22%、审查时延 +3.5x。
- **市场去泡沫**（BPM 库 04 章）：2000 家自称 agentic 的公司仅约 130 家为真，>40% agentic 项目 2027 前将被取消。

## 待用户定案
- 20/21 页选谁：Allianz+HDI 双讲 / 只讲 Allianz / Allianz+补挖 Barclays / Allianz+一个中国案例。
- Jabil 去留：放弃 / 退为方法论铺垫 / 仍主讲（需标注概念级）。
- 中国案例是否保留一页（现有奇瑞/兆企/司盟证据偏弱，可能需补挖）。
