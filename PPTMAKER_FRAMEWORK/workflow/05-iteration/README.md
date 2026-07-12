---
title: '05 — Iteration Engine: 持续打磨引擎'
stage: workflow/05-iteration
position: entry
type: overview
summary: 该阶段的入口总览。Agent 读取此文件来理解本阶段的全貌和导航路径。
depends_on: []
feeds_into:
- workflow/05-iteration/00-openspec-capabilities-for-ppt.md
agent_action: navigate
---

# 05 — Iteration Engine: 持续打磨引擎

> **先读这个。**

## 核心模式：结构化迭代

三个顺序模块（01-03）加上一个支撑模块（04）定义了**固定的加工流**——每一步做什么、产出什么。但 PPT 制作不是一次成型的——它在不断的"变、推敲、添、改"中逼近最终质量。

**迭代引擎就是把"反复改、来回调"变成结构化流程的机制。** 核心模式很简单：

```
明确要改什么和为什么 → 审核影响范围 → 实施变更 → 记录归档
```

这个模式不是某个工具的专利——它是一种**工作纪律**。无论你用什么 agent（Claude Code、Codex、Cursor），也无论它有没有 OpenSpec 支持，同样的纪律适用：**先写下变更意图再动手，改完记录 changelog。**

> 每次变更最终修改的是 run bundle 中的**源文件**（slide-specifications 或 visual-style）。每次结构化迭代（propose → review → apply → archive）都在 run bundle 的文件系统中留下可追溯的记录。

## OpenSpec：一种实现方式

在 Claude Code 环境中，OpenSpec 是这个模式的具体实现——它提供了 `openspec-propose`、`openspec-apply-change`、`openspec-archive-change` 等命令，把每次变更变成可追溯的 proposal → review → apply → archive 流程。

如果你的 agent 没有 OpenSpec，同样的纪律通过文件系统就能实现：
- **提案**：在 changelog 中写一段话，说明要改什么、为什么、影响哪些文件
- **审核**：review 这段话，确认影响范围没有遗漏
- **实施**：动手改源文件
- **归档**：更新 changelog，记录做了什么、为什么

不是工具让迭代有纪律——是**你**让迭代有纪律。工具只是让它更方便。

## 迭代引擎介入的时机

| PPT 阶段 | 什么时候走结构化迭代 | 变更类型 |
|---------|-------------------|---------|
| Phase 1 内容设计 | 改隐喻/公式、加/砍/重构 slide、换案例 | 叙事框架、案例锚点、内容约束 |
| Phase 2 风格设计 | 改 color palette、改 typography、改 layout | 视觉系统变更 |
| Phase 3 生产管线 | 改脚本逻辑、改 stage 流程 | 管线变更 |
| Phase 4 迭代维护 | 任何上述改动 | 对应的变更类型 |

## Natural Language Iteration（Agent 自动分类）

> **这是面向 Agent 的迭代界面。用户用自然语言说想要什么改动——Agent 内部分类、评估影响、告知用户、执行。用户永远不需要知道 "Chain A" 或 "Stage 3"。**

### Agent 处理流程

```
用户自然语言改动请求
    ↓
1. 分类器判断：改的是什么？
   ├─ 标题（KICKER/TITLE/SUBTITLE）→ `ppt_flow refresh --kind title`，resolved body-lock=A / full-page=B
   ├─ 其他烧在图片里的标注      → Chain B
   ├─ 画面/配色/prompt         → Chain B
   ├─ Speaker notes            → Chain C
   └─ 结构（加/删/重排 slides）→ 版本升级
    ↓
2. 评估影响范围：几张 slides 受影响？
    ↓
3. 告知用户影响 + 预估时间
    ↓
4. 用户确认 → 执行 → 交付更新
```

### Agent 沟通示例

**小改动**："改 Slide 5 的标题。只改文字不动画面，2 分钟。"
**中等改动**："重新生成 Slide 7 的画面，约 5 分钟。"
**大改动**："这会影响 12 张 slides。建议先跑 3 张确认方向（约 15 分钟），满意后批量跑剩余。"
**结构改动**："结构改动——我会创建 v2 保留当前版本，在新版本中加 slide。v1 不变，随时回退。"

### 决策树和沟通模板

详见 `../../scripts/change-classifier.md` — Agent 的完整分类决策树和用户沟通模板。

## 五个文件

| 文件 | 内容 |
|------|------|
| `00-openspec-capabilities-for-ppt.md` | 变更类型 → PPT 阶段的完整映射 |
| `01-content-iteration-workflow.md` | 内容迭代的完整工作流 |
| `02-style-iteration-workflow.md` | 风格迭代的完整工作流 |
| `03-pipeline-change-workflow.md` | 管线变更的工作流 |
| `04-end-to-end-walkthrough.md` | 从头到尾走一遍：每个迭代介入点 |

---

> **Next**: `00-openspec-capabilities-for-ppt.md`
