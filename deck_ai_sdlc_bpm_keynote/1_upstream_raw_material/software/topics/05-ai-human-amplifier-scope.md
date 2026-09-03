---
title: 人-AI 关系 — 从操作者到委托人
stage: phase_0
topic: "05"
status: draft
created: 2026-07-08
summary: AI 时代 SDLC 最深刻的变化不是工具更好了——是人和 AI 的关系变了。从"操作者→工具"变成"委托人→执行者"。这个变化有大量一线开发者的真实体验为证，不只是理论推演。
sources:
  - fable5_field_signals/ (Willison, Mollick, Krieger, Klaassen, Vincent, Shihipar)
  - aidlc_reference_kol/_raw_agile_manifesto_2026/ (Three-Tier Developer Split)
  - aidlc_reference_kol/_raw_kol/ (ThoughtWorks, Fowler, Beck)
---

# 人-AI 关系：从操作者到委托人

> 核心判断：AI 放大了人的能力，但没有替代人的判断。真正变了的是**关系**——从"我写代码，AI 补全"变成"我委托任务，AI 执行，我验收"。

---

## 关系变了，不只是工具更好了

### 从操作到委托

Ethan Mollick（Wharton 教授，Mythos/Fable 深度使用者）：

> "I no longer steer; I commission."
>
> "The unnerving part was how little I did."

不是"AI 帮我写得更快"——是"我几乎没做什么，东西就出来了"。这跟传统工具的关系完全不同。

Mike Krieger（Anthropic CPO，Instagram 联合创始人）：

> "I'll wish Claude a good night, set it off on a complex task, and wake up to find it's done."
>
> "It really feels now like a teammate I can delegate a lot of work to."
>
> "The first model I hand off whole projects to."

关键信号：工作从"实时交互"转向"离线委托"。人在交接上下功夫，不再盯着每一步执行。

### 从 copilot 到 teammate

Simon Willison（Datasette 创始人）：

> "Claude Fable is relentlessly proactive."
>
> "It had hacked up its own pattern for taking screenshots of browser windows."

Fable 不只是执行指令——它会自己想办法。不是"更聪明的 autocomplete"，是你没说的工具链它现场拼了一条出来。

---

## AI Sandwich：新工作流已经出现了

Kieran Klaassen（一线开发者）把新模式叫 **"AI Sandwich"**：

```
人设定任务 + 上下文（上层）
    ↓
AI 执行（中间层——Fable 5 已是默认主力）
    ↓
人 review 结果 + 验收（下层）
```

这不是理论——是 Kieran 的真实日常工作流。Fable 5 不是偶尔试试，是**默认主力**。

Jesse Vincent（Superpowers 创始人）把同样模式叫 **brief-review-signoff**：

> "Specs are the thing that matters now. The code does not matter anymore."

- brainstorming 先于 coding
- spec 是人类 review 的主对象
- test writer、implementer、reviewer 最好**解耦**成不同 agent
- end-to-end 证据比单测通过更有说服力

---

## 但驾驭问题仍是核心

### AI 放大了人，没抹平差距

- **简单问题**：门槛降低了。原来需要专业程序员的事，现在一般人就能上
- **难的问题**：还是得用经验足的人去驾驭。AI 把每个人的上限抬高了，但**人和人的差距没有被抹平**

Thariq Shihipar（Anthropic 方法论）的判断：真正稀缺的变成了 **`unknowns`**——不是答案，是**发现盲区的能力**。强模型时代，能问对问题比能写对代码更重要。

### 三层分化（Deer Valley, Feb 2026）

| 层级 | 处境 | 为什么 |
|------|------|--------|
| **初级开发者** | 令人惊讶地**安全** | AI-native 一代，LLM 是 24/7 导师，学习速度被 AI 放大 |
| **中层开发者** | **真正的危机** | 辛苦积累的技能（CRUD、调试）正是 AI 进步最快的领域，但还没积累足够架构判断力来编排 Agent |
| **资深开发者** | 转向架构 | 变成 harness engineer、Agent 编排者。1/3 最初抵制的人动手实践后转变为"非常支持" |

Kent Beck 在 Pragmatic Summit 上确认："中层是我最担心的。"

---

## 失败的省钱策略（值得记录）

Jesse Vincent 的实验结论：

- 限制思考字数 → 破坏任务结构
- 让便宜模型先写计划 → 破坏任务结构
- 给测试预算设上限 → agent 会投机取巧

**"这些看似省钱的做法，实际都会破坏 Fable 的任务结构。"**

`/goal` 最佳结构：**目标、指标、边界**——不是"做什么"，是"要达成什么，在什么约束内"。

---

## BPM 侧的同构

企业侧对这个变化的术语更丰富：Digital Worker、AI Coworker、Human-Agent Collectives、Blended Workforce。76% 高管把 AI 视为 coworker 而非工具。

但两边说的是**同一件事**：从"人操作工具"到"人委托执行者"。SDLC 侧叫 AI Sandwich，BPM 侧叫 Co-work 模式。致远三级模型（Co-pilot → Co-work → Autonomous）跟 Mollick 的"operator → patron"完全对应。

---

## Scope：谈什么，不谈什么

### 谈的
**高质量软件工程中的人-AI 关系变化。** 不是"人人写代码"的民主化叙事。

### 不谈的
- ❌ Vibe Coding 爱好者做玩具项目的体验
- ❌ "AI 取代程序员"这种就业话题
- ❌ 低风险一次性脚本的生成
- ❌ AI 工具评测、模型对比

---

## 待验证

- [ ] Mollick 的 "patron" 模式和致远 "Autonomous Agent" 模式——是同一件事吗？
- [ ] Three-Tier Split 6 个月后（Engelberg 期间）有没有更新？中层危机是加剧还是缓解了？
- [ ] Jesse Vincent 的 "spec > code" ——跟 Boris Cherny 的 "judgment, taste, dimensionality" 是什么关系？
- [ ] "AI Sandwich" 和 BPM 的 "Framed Autonomy" 是否完全等价？

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 从 initial-ideas.md 拆分 | 初始版本 |
| 2026-07-08 | 用 fable5_field_signals 重写 | 补充一线开发者真实信号，从"放大器"抽象论述转为"操作者→委托人"证据驱动 |
