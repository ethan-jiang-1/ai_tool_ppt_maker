# BUG-062: 短引用只覆盖 task-projection，一般 CLI stdout 仍甩完整 64 位哈希

> 严重级别: P3（UX/可读性）| 发现: 2026-08-06 | 状态: 活跃

## 症状

用户抱怨「生产出来的名字像 UUID 一样巨长」：`style-master`、`image2`、`ppt_flow`
一般命令的 stdout/回执里，`plan_sha256`、`batch_sha256`、`review_decision_sha256`
等全是完整 64 位 hex，Agent 原样转述给用户，不可读。

## 根因 / 现状

`6e8d0fb feat: add short page production references` 引入了短引用显示
（`p-<8hex>` / `b-<8hex>` / `e-<8hex>` / `r-<8hex>` / `m-<8hex>` / `d-<8hex>`，
见 `scripts/shared/workflow/page_production_task_projection.mjs` 的
`DISPLAY_REFERENCE_PREFIXES` 与 `displayReferenceKey`），但**只接入了
page-production 任务投影**，没有覆盖 style-master / image2 / 通用 CLI stdout。

目录名（`plans/<64hex>/`、`materializations/<64hex>/`、`batches/<64hex>/`）
保持完整是**协议要求**（内容寻址，record digest 与目录名必须一致，
见 `_lessons/hash-id-research.md`），不能重命名。问题只在**显示层**。

## 建议

1. 给通用 CLI stdout 提供「短引用」投影（或 Agent 约定）：对话里一律用
   `p-<8hex>` 短引用；完整哈希只用于 CLI 参数/协议传输。
2. 或提供 `--short-refs` 输出选项，让回执同时带完整哈希与短引用。
3. Agent 侧约定：转述给用户时用短引用，需要 CLI 传参时才用完整哈希。

## 关联

- `6e8d0fb`（短引用特性）；`_lessons/hash-id-research.md`（UX 契约）。
- BUG-061（工作区重复 bundle）同属可读性/卫生类。
