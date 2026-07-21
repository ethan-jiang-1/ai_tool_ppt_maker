# BUG-025: macOS .DS_Store 文件未在 _generated/ 相关的 ignorable 规则中处理

> 严重级别: P2 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
在 Finder 中浏览 `_generated/html_production/` 后，macOS 自动创建 `.DS_Store` 文件。
`checkBundle` 将 `.DS_Store` 视为违规文件：
```
unexpected '.DS_Store' in HTML production root
unexpected '.DS_Store' in HTML production owner html_pages/
```

## 根因
`bundle_layout.mjs` 的 `_ignorable()` 函数只跳过以 `.` 开头的文件（dotfiles），但 `.DS_Store`
确实以 `.` 开头…… 然而 `checkHtmlGeneratedTopology` 函数的子目录校验没有调用 `_ignorable`，
直接遍历所有文件。

## 复现
1. 在 Finder 中打开 `_generated/html_production/html_pages/objects/`
2. 运行 `bundle_layout --check`
3. 报 DS_Store 违规

## 修复关联
已由 OpenSpec change `complete-markerless-html-migration` 修复并归档。
- `checkHtmlGeneratedTopology` 及其子函数应在遍历时调用 `_ignorable`
- 或在 `.gitignore` 中已有 `.DS_Store` 规则的基础上，确保 bundle check 也读取 gitignore
