---
title: 02 — 风格迭代工作流
stage: workflow/05-iteration
position: 03 of 05
type: methodology
summary: 方法论文件。Agent 理解其中原理并应用于对话引导。
depends_on:
- workflow/05-iteration/README.md
- workflow/05-iteration/01-content-iteration-workflow.md
feeds_into:
- workflow/05-iteration/03-pipeline-change-workflow.md
agent_action: iterate_with_openspec
---

# 02 — 风格迭代工作流

← [01](01-content-iteration-workflow.md) | [Next →](03-pipeline-change-workflow.md)

## 核心模式

视觉系统（Phase 2）的迭代集中在五个维度：color、typography、layout、components、micro decorations。每次变更遵循同样的模式：**提案（改什么、为什么、影响范围）→ 审核 → 实施 → 归档**。

以下场景以 Claude Code 中的 OpenSpec 命令作为具体示例。如果你的 agent 没有 OpenSpec，同样的流程通过 changelog + 手改源文件执行。

## 场景 1：改 Color Palette

```
1. 提案：新旧 palette 对比、为什么要改、影响哪些 slide
   在 Claude Code 中：openspec-propose "Change palette from multi-family to single-family blue-cyan"
   在其他 agent 中：在 changelog 中写下以上内容

2. 审核
   → 新 palette 的语义角色分配合理吗？
   → 和 content 的 tone 匹配吗？（urgent = warmer？calm/analytical = cooler？）
   → 是否需要重新生成 style_master.jpg？

3. 实施
   在 Claude Code 中：openspec-apply-change
   在其他 agent 中：按 proposal 逐项修改
   → 更新 visual-style.md 的 Section 2（Color System）
   → 更新 style master prompt → 重新生成 style_master.jpg
   → 如果 style master 变化大 → 受影响页使用 Generated Image Rebuild

4. 归档
   在 Claude Code 中：openspec-archive-change
   在其他 agent 中：更新 changelog
```

## 场景 2：改 Typography Scale

```
1. 提案："Adjust title from 46px to 42px for longer headlines"
   → 影响：所有 body+header-lock slides 的 header 叠加

2. 审核: 42px 在 16:9 全屏上够大吗？Kicker 和 Subtitle 需要同步调整吗？

3. 实施
   → 更新 visual-style 的 typography table
   → 更新 `color_palette.json` 的 `header_lock.fonts.title.size_px`
   → raw-image contract 不变时，使用 Header Text & Style Refresh 重跑 Stage 1 → 3 → 4 → 5，**不需要重新生图**

4. 归档
```

## 场景 3：改 Micro Decoration Mappings

```
1. 提案："Add visual mnemonic: 'Digital Twin' → two mirrored objects"
   → 新概念出现在 slides 中，需要在 deck 中首次出现时给视觉符号

2. 审核: 这个符号和其他符号风格一致吗？会不会和已有的符号混淆？

3. 实施
   → 更新 visual-style 的 Micro Decoration table
   → 在相关的 IMAGE PROMPTs 中引用新符号
   → 更新 style_master.jpg（如果符号系统在 style master 上展示）

4. 归档
```

## 风格迭代的特殊考虑

**Style master 是 visual contract。** 一旦锁定（Phase 2 gate check），改它就是改整个 deck 的视觉基础。如果必须改：

1. 确认改动范围——只改 color？还是连 typography + layout 都改？
2. 写提案明确列出所有受影响的维度（在 Claude Code 中用 `openspec-propose`）
3. 更新 `style-master-prompt.md` 并重新生成 canonical `style_master.jpg`；可见 `vN` / upstream iteration archive 保留 deck 工作上下文，用户可选 Git 仅按明确授权保存 source audit
4. 评估下游影响——哪些已有的 slide 图和新的 style master 不兼容？（颜色变了？header zone 高度变了？）
5. 可能需要重新生成部分或全部 slide 图片

**经验法则**：在 Phase 2 review 阶段充分迭代——一旦进入 Phase 3（生产），style master 就应该锁定。生产后再改 style = 最高的 downstream cost。

---

> **Next**: `03-pipeline-change-workflow.md`
