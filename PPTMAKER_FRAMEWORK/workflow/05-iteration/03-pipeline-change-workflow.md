---
title: 03 — 管线变更工作流
stage: workflow/05-iteration
position: 04 of 05
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/05-iteration/README.md
- workflow/05-iteration/02-style-iteration-workflow.md
feeds_into:
- workflow/05-iteration/04-end-to-end-walkthrough.md
agent_action: iterate_with_openspec
---

# 03 — 管线变更工作流

← [02](02-style-iteration-workflow.md) | [Next →](04-end-to-end-walkthrough.md)

## 核心模式

管线（Phase 3）的改动和内容/风格改动有本质区别：
- 管线是**代码**（Node.js `.mjs` scripts）——改动是 software change，不是 design change
- 管线产出是**派生品**（图片、JSON、PPTX）——改动后必须重跑来验证
- 管线应该**稳定**——频繁改管线是 smell，说明设计阶段没有做够

变更流程依然是：**提案 → 审核 → 实施 → 归档**。以下场景以 Claude Code 中的 OpenSpec 命令作为具体示例。

## 场景 1：修改 Stage 脚本

```
1. 提案：当前行为、期望行为、代码改动概述
   在 Claude Code 中：openspec-propose "Add retry logic to Stage 2 image generation"
   在其他 agent 中：在 changelog 写下以上内容

2. 审核: retry 几次？间隔多久？什么 error 值得 retry？

3. 实施
   在 Claude Code 中：openspec-apply-change
   在其他 agent 中：按 proposal 修改脚本
   → 编辑 scripts/ 里对应的 stageN 脚本（Stage 2 改 skill / LEGACY，勿混用）
   → 用一个已生成的 slide 做 dry-run 验证
   → 更新 reference-pipeline-scripts.md（如果模式变了）

4. 归档
```

## 场景 2：改变管线参数

```
1. 提案："Change header_safe_zone from 260px to 280px"
   → 影响：Stage 1（prompt assembly）、Stage 3（header overlay position）
   → 原因：标题文字太长，260px 不够

2. 审核: 280px 会吃掉多少 content zone？对画面比例的影响可接受吗？

3. 实施
   → 更新 Stage 1 脚本的 HEADER_SAFE_ZONE 常量
   → 更新 Stage 3 脚本
   → safe-zone 改变了 Stage 2 prompt/raw-image contract，受影响页使用 Generated Image Rebuild
   → 对所选页显式 `--force-images`，review 新 body 留白和 header，再完成后续 Stage

4. 归档
```

如果只改 Stage-3-owned 的 header 字体、颜色、位置、行高、间距或 text width，并且仍处于既有 reserved zone、raw-image contract 不变，则 resolved `body+header-lock` 页面可使用 Header Text & Style Refresh（Stage 1 → 3 → 4 → 5），无需 Stage 2。render-mode 切换与 safe-zone 高度变化不能走这条路径。

## 场景 3：添加新的管线 Stage

这是最 heavy 的管线改动——改变了管线架构本身。

```
1. 提案："Add Stage 2.5: Contact Sheet generation for QA review"
   → 新的 stage 插入在 Stage 2 和 Stage 3 之间
   → proposal 包含：这个 stage 做什么、输入/输出、为什么需要

2. 仔细审核: 新 stage 的职责是否和现有 stage 重叠？
   → 能否合并到现有 stage 而不是新增？
   → 下游 stage 的输入变了——需要更新什么？

3. 实施
   → 创建新脚本
   → 更新 AGENTS.md 的 Phase 3 流程
   → 更新方法论文档（如果模式是通用的）
   → 在所有现有项目上测试

4. 归档
```

## 管线改动的最低测试要求

| 改动类型 | 最低测试 |
|---------|---------|
| 改脚本逻辑（算法变了） | 用一张 slide 跑完整条受影响刷新路径 |
| 改参数（常量变了） | 跑受影响 stage + 下一 stage |
| 新增 stage | 跑完整管线（所有 slide）至少一次 |
| 改 Stage 1 解析逻辑 | 确认 slide_plan.json 的 slide 数量、render_mode 分类正确 |

---

> **Next**: `04-end-to-end-walkthrough.md`
