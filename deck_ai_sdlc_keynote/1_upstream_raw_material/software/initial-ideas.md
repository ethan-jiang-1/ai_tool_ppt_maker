---
title: Initial Ideas — 叙事种子索引
stage: phase_0
position: index
type: index
status: draft
created: 2026-07-08
summary: 叙事种子的索引文件。详细内容已按 topic 拆分到 topics/ 目录。这里只看全局结构和各 topic 之间的关系。
---

# Initial Ideas — 叙事种子索引

> 这是地图。详细论述在 `topics/` 里。这里只看全局：有哪些 topic、它们之间的逻辑关系、从哪开始读。

---

## 全局叙事弧线

```
Topic 01               Topic 02               Topic 03               Topic 04
传统 SDLC               AI 三阶段演化           速度 + 沟通              Agent 新物种
─────────              ─────────              ─────────              ─────────
"人先想清楚"            Vibe Coding             人成了瓶颈              以前做不了
是共同前提              → SDD                   跟 LLM 说话            的程序类型
                       → 协作探索               是新手艺               挖了 SDLC 地基
    │                      │                      │                      │
    └──────────────────────┴──────────────────────┴──────────────────────┘
                                          │
                                          ▼
                                    Topic 05
                              AI 是人的放大器 + Scope
                              ─────────────────────
                              驾驭问题仍是核心
                              聚焦高质量软件工程
```

---

## Topic 速查

| # | 文件 | 一句话 | 状态 |
|---|------|--------|------|
| 01 | [topics/01-traditional-sdlc-premise.md](topics/01-traditional-sdlc-premise.md) | 传统 SDLC 不管怎么变，前提都是"人先想清楚"。瀑布/V/敏捷只是三个参数变体 | draft |
| 02 | [topics/02-ai-evolution-three-stages.md](topics/02-ai-evolution-three-stages.md) | Vibe Coding → SDD → 协作探索。前两个还在旧思维里，第三个才是新范式 | draft |
| 03 | [topics/03-speed-communication-bottleneck.md](topics/03-speed-communication-bottleneck.md) | AI 太快，人成了瓶颈。跟 LLM 沟通是一种人还没掌握的新技能 | draft |
| 04 | [topics/04-agent-new-program-type.md](topics/04-agent-new-program-type.md) | Agent 是新物种——以前技术上做不出来。它挖了传统 SDLC 的地基 | draft |
| 05 | [topics/05-ai-human-amplifier-scope.md](topics/05-ai-human-amplifier-scope.md) | AI 是人的放大器，驾驭问题仍是核心。研究聚焦高质量软件工程 | draft |
| S1 | [storylines/01-deer-valley-to-engelberg.md](storylines/01-deer-valley-to-engelberg.md) | 🌟 Deer Valley → Engelberg — 5 个月的大脑激荡 | draft |
| S2 | [storylines/02-pragmatic-summit.md](storylines/02-pragmatic-summit.md) | 🌟 Pragmatic Summit — 同一周，公开的那一半 | draft |
| S3 | [storylines/03-fable5.md](storylines/03-fable5.md) | 🌟 Fable 5 — 当那个让大家焦虑的模型真的来了 | draft |

---

## Topic 间的逻辑关系

```
01 传统 SDLC 的前提
    │
    │  "程序的确定性"是地基——所有方法论都建在这上面
    │
    ├──→ 02 AI 三阶段演化
    │       │
    │       │  从 Vibe Coding 到 SDD 都是在旧思维里打转
    │       │  真正的变化在"协作探索"
    │       │
    │       ├──→ 03 速度 + 沟通
    │       │       │
    │       │       │  AI 太快了——旧世界的节奏完全被打乱
    │       │       │  跟 LLM 说话 ≠ 跟人说话
    │       │       │
    │       │       └──→ 04 Agent 新物种
    │       │               │
    │       │               │  产出物本身变了——从确定性程序到 Agentic Workflow
    │       │               │  这挖了 01 中"确定性"的地基
    │       │               │
    │       └──→ 05 放大器 + Scope
    │               │
    │               │  AI 放大能力，不替代判断
    │               │  聚焦高质量软件工程
    │               │  共识传出去，非共识标探索
    │               │
    │               └──→ 回到 01：传统地基已破，新地基在探索中
    │
    └──→ 三条 Storyline（06·07·08）——不是论点，是证据
            │
            ├── 06 Deer Valley → Engelberg
            │   同一群人，5个月，从"可能有点东西"到"证据在握"
            │
            ├── 07 Pragmatic Summit
            │   同一周，公开的那一半——硬数据、金句、角色坍缩
            │
            └── 08 Fable 5
                当焦虑变成现实——12条旧假设被一个模型的行为逐一打破
    │               │  AI 放大能力，不替代判断
    │               │  聚焦高质量软件工程
    │               │  共识传出去，非共识标探索
    │               │
    │               └──→ 回到 01：传统地基已破，新地基在探索中
```

---

## 当前状态

所有 topic 文件都在 **draft** 阶段——论点已记录，但尚未用 KOL 素材验证。每个文件末尾有独立的"待验证"清单。

下一步：进入正式的 **source-synthesis.md**，从 KOL 素材中提取信号，对每个 topic 做交叉验证。

---

## 版本记录

| Date | Change | Why |
|------|--------|-----|
| 2026-07-08 | 初稿 | 初始叙事种子 |
| 2026-07-08 | 拆分到 topics/ | 单文件太臃肿，按 topic 拆分便于独立引用和迭代 |
