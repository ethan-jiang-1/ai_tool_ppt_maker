---
title: 01 — 内容迭代工作流
stage: workflow/05-iteration
position: 02 of 05
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/05-iteration/README.md
- workflow/05-iteration/00-openspec-capabilities-for-ppt.md
feeds_into:
- workflow/05-iteration/02-style-iteration-workflow.md
agent_action: iterate_with_openspec
---

# 01 — 内容迭代工作流

← [00](00-openspec-capabilities-for-ppt.md) | [Next →](02-style-iteration-workflow.md)

## 核心模式

内容设计（Phase 1）完成后不会立刻完美。你会不断收到反馈、产生新想法、发现叙事漏洞。结构化迭代把每次内容变更变成一致的流程：**提案 → 审核 → 实施 → 归档**。

以下场景以 Claude Code 中的 OpenSpec 命令作为具体示例。如果你的 agent 没有 OpenSpec，同样的流程通过文件系统就能执行——在 changelog 中写下提案，review 后动手改，改完归档。

## 场景 1：改核心隐喻或公式

这是最 heavy 的改动——影响所有 slide。

```
1. 提案：明确要改什么、为什么、影响哪些 slides
   在 Claude Code 中：openspec-propose "Reframe core metaphor from X to Y"
   在其他 agent 中：在 changelog 写下改动意图和影响范围

2. 审核 proposal
   → 新隐喻能否延展到所有 Block？
   → 哪些 slide 需要重写？哪些可以保留但重构？

3. 用户 approve

4. 实施变更
   在 Claude Code 中：openspec-apply-change
   在其他 agent 中：按 proposal 逐项修改
   → 更新 2_backbone/core-metaphor.md + core-formula.md（隐喻+公式）
   → 逐张检查 slide——重构受影响 slide 的 TITLE 和 CONCEPT
   → 更新 Block Map（如果 Block 结构变了）

5. 归档
   在 Claude Code 中：openspec-archive-change
   在其他 agent 中：在 slide-specifications changelog 记录
```

## 场景 2：加/砍/重构 Slides

```
1. 提案
   在 Claude Code 中：openspec-propose "Add risk slide between Block 4 and Block 5"
   在其他 agent 中：写下新 slide 的四层规格草案，说明插入位置和理由

2. 审核 proposal
   → 新 slide 在叙事弧中承担什么功能？
   → 插入位置是否合理？前后的 slide 需要调整吗？

3. User approve

4. 实施
   → 在 slide-specifications.md 中插入新 slide 规格
   → 更新 Block Map 的 slide 计数
   → 更新受影响的 slide 的 Bridge from/to

5. 归档
```

## 场景 3：换案例锚点

```
1. 提案
   在 Claude Code 中：openspec-propose "Replace Foxconn case with [New Company]"
   在其他 agent 中：写下新案例的 evidence card + evidence tier 评估

2. 审核 proposal
   → 新案例是否支撑同一个 claim？
   → 信息来源是否可靠？（第三方验证原则）
   → Evidence tier 是否够高？

3. User approve

4. 实施
   → 更新 slide-specifications.md 中对应 case anchor slide 的 CONCEPT 和 IMAGE PROMPT
   → 更新 SPEAKER NOTE 中的 Company Brief

5. 归档
```

## 场景 4：改设计约束

```
1. 提案（在 changelog 中说明：改什么约束、为什么、影响范围）
2. Review: 这个改动会让 slides 更难读吗？为什么需要更多文字？
3. 实施 → 更新 2_backbone/design-constraints.md
4. 归档
```

## 内容迭代的节奏

| 阶段 | 频率 | 走迭代流程？ |
|------|------|-------------|
| 初稿打磨（改 wording、调 IMAGE PROMPT） | 高——一天多次 | 不——直接改源文件 |
| 结构优化（加/砍/重构 slide） | 中——几天一次 | 是——写提案再动手 |
| 大改（改隐喻/公式/Block 结构） | 低——一周一次或更少 | 是——必须走完整流程 |
| 锁定后微调 | 极低——尽量不做 | 如果不可避免，小改动直接改，大改动走流程 |

---

> **Next**: `02-style-iteration-workflow.md`
