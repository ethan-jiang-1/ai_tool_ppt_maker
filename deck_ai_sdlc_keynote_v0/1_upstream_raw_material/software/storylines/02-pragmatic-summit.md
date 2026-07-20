---
title: Pragmatic Summit 2026 — 同一周，公开的那一半
stage: phase_0
storyline: "02"
status: draft
created: 2026-07-08
summary: Deer Valley 的闭门 retreat 不是 2026 年 2 月唯一的大事。同一周，Gergely Orosz 在旧金山办了首届 Pragmatic Summit——Beck+Fowler 罕见同台、Tacho 的 12 万开发者硬数据、Willison 的 Agentic Engineering 三阶段。闭门+公开拼在一起，才是那个历史时刻的完整画面。
sources:
  - aidlc_reference_kol/_raw_promatic_summit_2026/
---

# Pragmatic Summit 2026 — 同一周，公开的那一半

> Deer Valley 是闭门的。Pragmatic Summit 是公开的。
> 同一周。两组人。两种声音。拼在一起，才是 2026 年 2 月——那个"行业同时意识到一切都在变"的时刻。

---

## 场景

- **时间**：2026 年 2 月 11 日（与 Deer Valley 同一周）
- **地点**：旧金山
- **主办**：Gergely Orosz（*The Pragmatic Engineer* 作者）
- **形式**：公开售票大会——与 Deer Valley 的闭门 retreat 形成互补
- **关键人物**：Kent Beck + Martin Fowler（Agile Manifesto 合著者罕见同台）、Simon Willison、Thomas Dohmke（前 GitHub CEO）+ Avishai Rajan（Atlassian CTO）、Laura Tacho（DX 数据）

> 这不是一家公司的发布会，也不是一个 KOL 的博客。这是 **Agile 原班人马 + AI 时代最受尊敬的独立声音 + Big Tech 内部操盘手** 在同一周、同一批对话中的碰撞。

---

## 四个 Session，四组信号

### Session 1: Beck + Fowler 炉边对话 — "大于之前所有变革的总和"

这就是开场。Fowler 第一句话就定调了：

> "Nothing has hit with the magnitude of AI. This is a whole size different from anything we've faced before."

Beck 补充：AI 的量级大于微处理器、OOP、互联网、Agile 的总和。

但他也警告 Agile 的错误正在重演——公司说"让团队用 AI"但绩效体系没变 → 表面采用、实际抵制。

**关键信号**：
- **TDD 不可协商**：Beck 称 TDD 为 AI 辅助编码的"超能力"。Fowler 和 Willison 独立得出相同结论
- **初级程序员的黄金时代**：AI 拉高了新手的天花板
- **中层最危险**：不够资深去编排 Agent，不够初级去快速学习新范式
- **Re-Soloing**：一个人 + AI 可以完成过去一个团队的工作——"两人一 Agent"成为新模式

### Session 2: Simon Willison — Agentic Engineering 三阶段

Willison 提出了从 Vibe Coding 到 Agentic Engineering 的演化路径，以及 **Conformance-Driven Development**——测试变成 Agent 最精确的 spec 语言。

> "SDLC is built around 200 lines a day."

整个方法论的设计前提被 AI 吞吐量打碎了。

### Session 3: Dohmke + Rajan 圆桌 — "Homer Simpson 车"

前 GitHub CEO + Atlassian CTO 的对话：

- **Homer Simpson 车**：Dohmke 描述 AI 生成的代码像《辛普森一家》里 Homer 设计的车——什么功能都有，但拼在一起是个怪物
- **硬数据**：Atlassian Rovo Dev 的 PR 增长了 89%，但合并率没有同步上升——**审查瓶颈**是真实存在的
- **角色坍缩**：PM → Product Engineer、Designer → Design Engineer、CTO 又开始写代码了
- **别进管理**：Rajan 说"现在是做 IC 的黄金时代"——Jensen Huang 已经展示了 AI 时代 40-50 人的扁平结构

### Session 4: Laura Tacho — 数据说话

基于 450+ 公司、**12 万+ 开发者**的数据：

| 发现 | 数据 |
|------|------|
| AI 使用率 | **92-93%** 的开发者每月用 AI 编码工具 |
| 生产力提升 | 只有 **~10%** |
| 这个 gap 叫什么 | **"失望鸿沟"（Disappointment Gap）** |
| 健康团队效果 | **50% 更少** incidents |
| 功能失调团队效果 | **2 倍更多** incidents |

> "AI is an amplifier, not a fixer." — Laura Tacho

**失望鸿沟的来源**（Tacho 的诊断）：
1. 审查瓶颈——AI 生成代码的速度远超人类审查能力
2. 上下文破碎——Agent 没有足够的项目上下文
3. 工具碎片化——团队用不同 AI 工具，无统一工作流
4. 测量错误——用"代码行数"或"PR 数量"衡量 AI 效果是危险的误导

这四条直接对应了我们 Topic 03（速度不对称→人成了瓶颈）和 Topic 05（驾驭问题仍是核心）。

---

## 同一周，两种声音

| | Deer Valley Retreat | Pragmatic Summit |
|------|------|------|
| **形式** | 闭门邀请，~50 人，Chatham House Rule | 公开售票大会 |
| **语气** | 焦虑、探索、不确定性 | 务实、数据驱动、"我们知道有问题" |
| **产出** | 一堆问题，新概念在浮现 | 硬数据，金句，可引用的 session |
| **明星** | Martin Fowler 召集的精英圈 | Beck+Fowler 同台 + Willison + Dohmke + Tacho |
| **核心焦虑** | "严苛去哪儿了？" | "为什么 93% 在用但生产力只涨了 10%？" |
| **与 Agile 2001 的连接** | 同一片山，25 年后 | 同一批人，同一个问题——"什么变了？" |

**它们是互补的。**
- Deer Valley 告诉你：最聪明的人在问什么问题
- Pragmatic Summit 告诉你：数据在说什么、实践者在做什么

两个拼起来 = **2026 年初的完整横截面**：所有人都承认这是一场 disruption，所有人都知道旧办法不够了，但没有人有完整答案。

---

## 这个 storyline 贡献了什么

### 1. 硬数据让叙事可量化
Tacho 的 12 万开发者数据——不是 opinion，是 measurement。"93% 在用，但生产力只涨了 10%"——这个数字本身就值一张 slide。

### 2. "放大器"是最干净的表述
"AI 是放大器，不是修复器"。好团队更好，差团队更差。这个判断在 Beck、Fowler、Tacho、Farley 之间是**完全共识**——直接支撑 Topic 05。

### 3. 角色坍缩是正在发生的结构性变化
PM→Product Engineer、Designer→Design Engineer、CTO 又写代码了——这些不只是一两个人的感受，是跨公司、跨角色的 pattern。

### 4. 审查瓶颈 = 速度不对称的实证
Tacho 的"失望鸿沟"四来源之首就是审查瓶颈——直接验证了 Topic 03（AI 太快，人成了 bottleneck）。

---

## 可在 slides 中使用的引用

> "Nothing has hit with the magnitude of AI. This is a whole size different from anything we've faced before." — Martin Fowler

> "AI is an amplifier, not a fixer." — Laura Tacho

> "SDLC is built around 200 lines a day." — Simon Willison

> "If you're already working well, AI will be a big win. If you're working poorly, you'll just dig a deeper hole faster." — Dave Farley（Tacho 的数据精确验证了这句话）

> "Tests are free now." — Kent Beck（论 TDD 在 AI 时代的不可协商性）

---

## 与 Deer Valley → Engelberg 的关系

```
2026 Feb ───────────────────────────────→ 2026 Jul
    │                                          │
    ├── Deer Valley (闭门)                      ├── Engelberg (闭门)
    │   "可能有点东西"                          │   "证据在握"
    │   一堆问题                                │   所有人都在生产环境
    │                                          │
    ├── Pragmatic Summit (公开) ← 本文件        │
    │   "AI 是放大器"                           │
    │   12 万开发者数据                          │
    │                                          │
    └── 两个活动拼在一起 = 完整的 Feb 2026 ──────→ Engelberg 验证了那些焦虑和希望
```

---

## 待验证

- [ ] Willison 的 "Agentic Engineering 三阶段"——Pragmatic Summit 版本 vs 他博客版本有没有差异？
- [ ] Tacho 的数据方法论——12 万开发者样本的 demographics 是什么？
- [ ] Dohmke 的 "Homer Simpson 车"——有没有更具体的案例？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 创建 | Pragmatic Summit 是 Feb 2026 的公开一半，值得独立 storyline |
