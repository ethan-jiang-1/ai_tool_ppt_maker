---
title: 04 — Conventions and Rules
stage: workflow/00-setup
position: "05 of 05"
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/00-setup/README.md
- charter/CONSTITUTION.md
feeds_into: []
agent_action: internalize
---

# 04 — Conventions and Rules

← [01](charter/CONSTITUTION.md) | [README](README.md)

**本文档中的所有约定适用于 run bundle（项目文件系统实例）。** run bundle 的概念和设计原理见 `00-run-bundle-concept.md`。这些约定确保 agent 和人类在同一个文件系统中协作时，行为可预测、改动可追溯。

## 命名约定

### 目录

```
{NN}_{descriptive_slug}/

workflow/00-setup/     ← 两位数序号 + 下划线 + 描述性 slug
workflow/01-visual/
workflow/02-content/
...
```

序号定义顺序。slug 定义内容。两者都不可省略。

### 文件

```
00-[描述性-slug].md              ← 00 = "为什么 / 是什么"（问题、动机、架构）
01-[描述性-slug].md              ← 01-NN = "怎么做"（方法论阶段）
...
template-[描述性-slug].md        ← 填空模板（执行工具）
README.md                        ← 3 分钟入口
```

### 项目版本目录

```
v1/                              ← 版本号从 v1 开始
v2/                              ← 重大下游改动时用 --new-version 创建
```

用 `v{n}` 而不是日期（`2026-07-08/`）。版本号简洁、sortable、且不暗示 "这一天之后就没变过"。

## 版本管理

### 什么进 Git

| 进 Git | 不进 Git |
|--------|---------|
| 源文件（`*.md`） | 派生品（`*.png`, `*.json`） |
| 模板（`template-*.md`） | 大型二进制（`*.pptx`, `*.jpg`） |
| 脚本（`*.mjs`） | 临时文件、cache |

原则：**源文件属于 Git（可 diff、可 merge）；派生品属于文件系统（可重跑、可覆盖）。**

### 版本快照的节奏

| 改动级别 | 操作 |
|---------|------|
| 改几个字（标题、speaker note） | 直接改，不新建版本 |
| 改几张 slide 的 IMAGE PROMPT | 直接改，不新建版本 |
| 砍/加/重构 slide | `bundle_layout.mjs --new-version ...` → 在新版本中改 |
| 改核心隐喻/公式 | 改 `2_backbone/`，明确告知会影响所有版本 |
| 改全 deck color palette / typography | 改 `2_backbone/visual-style/`；只属于某版则放 override |

经验法则：**如果改动让你想 "让我先备份一下" —— 那就是一个新版本。**

### Changelog

每个版本的 `slide-specifications.md` 和 `visual-style.md` 都必须包含 Change Log section。格式：

```
| Date | Version | Change Type | What | Why |
```

**"Why" 是最重要的列。** 它保留了决策上下文——6 个月后你回头看，不会问 "我们当时为什么要砍这张 slide？"

## 工作纪律

### 1. 源文件是 Single Source of Truth

管线里的任何中间产物（JSON、PNG）都可以从源文件重新派生。**如果你直接改了 PNG 然后说 "好了"，你没有修好——你只是制造了一个下次重跑就会被覆盖的临时补丁。**

改动的正确路径：源 markdown → 重跑管线 → 新 PNG。

### 2. 不改锁定后的 Style Master

`style_master.jpg` 一旦锁定（Phase 2 gate check 通过），它就是整份 deck 的 visual contract。改了它 = 所有 slide 的视觉锚点变了 = 整个 deck 可能需要重新生图。

如果视觉方向只属于某一版：先用 `--new-version` 创建干净版本，再把视觉差异放进该版 `overrides/visual-style/`，然后重跑 Phase 3。

### 3. Gate Check 不过不往下走

每个管线 stage 有明确的 gate check criteria。Agent 必须在每个 gate 停下来等用户确认。跳过 gate = 把问题推到 downstream，修复成本指数级增长。

### 4. Agent 自主 vs 询问

| Agent 自主决定 | 必须问用户 |
|---------------|-----------|
| 目录结构、文件命名 | 核心隐喻、公式 |
| 模板选择、复制 | Color palette 方向 |
| 脚本适配、执行 | Slide 的 claim 和认知载荷 |
| 编辑链分类 | Gate check 通过/不通过 |
| 版本号递增 | 是否锁定、是否进入下一 Phase |

**Agent owns process, user owns substance.**

---

> **Back to**: [README](README.md)
