# BUG-032: `ppt_flow migrate-html` 对真实 markerless deck 从未走通过

> 严重级别: P0 | 发现: 2026-07-21 | 状态: 活跃

## 症状
框架文档 `05-migrate-import-existing-deck.md` 和 playbook `migrate-import.md` 描述了
markerless → html clean vNext 迁移路径，但 `ppt_flow migrate-html preview` 命令对包含
25 页 IMAGE PROMPT 的真实 markerless deck 从未成功执行。

实际迁移过程全部依赖手工操作：写 SLIDE BODY YAML、修 color_palette.json、改 state.yaml、
手工对齐 plan fingerprint。

## 根因
`migrate-html` 命令要求的 "Agent 为每张保留页编写完整 structured block" 的前置条件
（将 IMAGE PROMPT 转为 SLIDE BODY YAML）没有工具或命令辅助。`migrate-html preview`
实际上在 Stage 1 就因 source frontmatter 没有 `production.pipeline` marker 而失败。

## 复现
1. 取任意 markerless deck
2. 尝试 `ppt_flow migrate-html preview`
3. 失败

## 修复关联
要么提供 `migrate-html` 的实际可用实现，要么从文档中移除该路径声明。
当前状态会给用户（和 Agent）错误的期待。
