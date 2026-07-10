---
title: 00 — 变更类型与 PPT 阶段映射
stage: 05_iteration
position: 01 of 05
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- 05_iteration/README.md
feeds_into:
- 05_iteration/01-content-iteration-workflow.md
agent_action: internalize
---

# 00 — 变更类型与 PPT 阶段映射

← [README](README.md) | [Next →](01-content-iteration-workflow.md)

## 核心原则：先分类，再动手

每次接到改动需求，第一步不是动手，是**分类**——这个改动影响了什么？范围多大？需要走完整迭代流程还是直接改？

下面的分类框架是 tool-agnostic 的——无论你用什么 agent，同样的分类逻辑适用。

## 变更类型总览

以下分类是对 PPT 制作中所有可能变更的抽象。在 Claude Code 中，OpenSpec（`openspec/config.yaml`）将这些分类落地为具体的 capabilities；在其他 agent 环境中，你作为人类按同样的分类判断改动范围和影响。

### 叙事与内容（对应 Phase 1 内容设计）

| 变更类型 | 覆盖什么 | 典型改动 |
|---------|---------|---------|
| 叙事框架 | 叙事弧、核心隐喻、session 架构 | 改隐喻、改公式、重组 Block、重排 slide |
| 案例锚点 | 可复用的叙事论证——每条案例有自己的 thesis、evidence base、deployment context | 添加/替换/删除案例锚点、改 evidence tier |

### 约束与生产（对应 Phase 1 约束 + Phase 3 生产）

| 变更类型 | 覆盖什么 | 典型改动 |
|---------|---------|---------|
| 内容约束 | 内容约束、案例选择标准、证据质量标准 | 改语言策略、改禁用内容列表、改文字密度上限 |
| 管线脚本 | Markdown → 自动化管线 → PPTX | 改管线架构、改 stage 流程 |
| 管线操作 | 具体管线的操作基线——CLI 命令、slide 分类、gate 流程、编辑链 | 具体的 pipeline 操作变更 |

### 研究与反馈（对应 Phase 1 的前置研究）

| 变更类型 | 覆盖什么 | 典型改动 |
|---------|---------|---------|
| 研究到证据 | 研究问题 → 结构化调查 → 综合证据 | 添加新研究方向、改 evidence 收集标准 |
| 反馈整合 | 客户反馈 → 优先级行动项 → 设计方向 | 整合 meeting feedback、调整优先级 |

## 什么时候走哪个流程

核心规则：影响多张 slide 或 deck 级约束 → 走完整迭代（提案→审核→实施→归档）。只影响一张 slide 且不改变其叙事功能 → 直接改。

```
用户说："Slide 8 的 claim 不够有力"
  → 改的是内容（叙事框架）
  → 在 Claude Code 中：openspec-propose "Reframe Slide 08 claim"
  → 在其他 agent 中：在 changelog 中写下改动意图和影响范围，改完记录

用户说："Fastenal 案例太弱了，换一个"
  → 改的是案例锚点
  → openspec-propose "Replace Fastenal case anchor"

用户说："不要把竞争对手名字放在 slide 上"
  → 改的是内容约束
  → openspec-propose "Add constraint: no competitor names"

用户说："Stage 2 的生图脚本加一个 retry logic"
  → 改的是管线脚本
  → openspec-propose "Add retry logic to Stage 2"

用户说："客户 meeting 反馈——他们想先讲效率再讲增长"
  → 改的是叙事框架（Block 顺序变了）
  → openspec-propose "Reorder Block 3: Efficiency before Growth"
```

## 不需要走迭代流程的改动

以下改动太小，不需要 proposal——直接在源文件中改：

- 改 KICKER/TITLE 的 wording（不改含义）
- 改 SPEAKER NOTE 的 talking points
- 改 IMAGE PROMPT 中某个元素的位置描述（微调，不改变 layout type）
- 修改 typo

**经验法则**：如果改动只影响**一张 slide**且不改变 slide 的 narrative function → 直接改。如果改动影响**多张 slide**或改变**deck 级约束** → 走结构化迭代流程。

---

> **Next**: `01-content-iteration-workflow.md`
