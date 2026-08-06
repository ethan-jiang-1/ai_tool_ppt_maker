# BUG-061: 工作区出现来源不明的重复 run bundle `deck_dark_factory_current`

> 严重级别: P3（工作区卫生/混淆风险，非 harness 缺陷）| 发现: 2026-08-06 | 状态: 活跃

## 症状

`ai_tool_ppt_maker/` 下同时存在 `deck_dark_factory`（真实 deck）和
`deck_dark_factory_current`（一个重复 bundle）。用户困惑「这个怎么出现的？
是不是 bug？」—— 两个同名 deck 存在混淆/误路由风险。

## 调查结论：**不是 harness 代码缺陷**

- **harness 没有任何生成 `_current` 后缀 bundle 的逻辑**：`init` 只创建用户给的
  `deck_NAME`；`new-version` 只建 `3_versions/vN`；grep `ppt_maker_harness/scripts/`
  无 `_current` 目录名后缀逻辑。
- `deck_dark_factory_current` 是**真实目录**（非 symlink），git **未跟踪**，主
  `deck_dark_factory` 无任何引用指向它。
- 其 `_state/state.yaml` 显示：`playbook: create-deck`、
  `current_node: select-target-page-authority-workflow`、execution 开始于
  `2026-08-06T08:10:11Z`（本地 16:10）→ 是通过 `ppt_flow init deck_dark_factory_current`
  **手动/前置会话创建的全新 bundle**。
- 其 `3_versions/v1/slide-specifications.md`（14829 bytes，08-05 20:30）与
  `deck_dark_factory/3_versions/v2/slide-specifications.md` 内容一致 → 有人把 v2 源
  复制进了这个新 bundle 的 v1。

**结论**：这是某个前置会话（或人为）为「重新开始/迁移」手动 init 的重复 bundle，
在 adopt `ppt_maker_harness`（`f5ac521` path-alias 修复）前后残留。它没有生产价值，
纯属工作区混淆源。

## 建议

1. 删除 `deck_dark_factory_current/`（已被真实 deck 取代；git 未跟踪，删除即清理）。
2. 工作区应保持一个 deck 一个 bundle；需要「干净重做」时用 `init` 指定新名并在
   `_backlog` 记录意图，避免 `_current` 式重复。

## 关联

- `f5ac521 fix: preserve local Harness binding through path aliases`（path alias 概念，
  但本目录非 alias/symlink）。
- 相关：[[framework-boundary-production-data]]
