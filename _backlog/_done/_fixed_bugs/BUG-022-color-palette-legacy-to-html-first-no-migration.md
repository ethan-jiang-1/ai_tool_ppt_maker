# BUG-022: color_palette.json 从 legacy 迁移到 html-first 无工具，手工迁移需精确匹配 8 个 schema

> 严重级别: P1 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
legacy markerless deck 的 `color_palette.json` 缺少 `html_first` 段。手工迁移时需逐一满足：
- `html_first.palette` 必须包含 8 个精确 key（background/surface/text/muted_text/accent/
  accent_secondary/accent_tertiary/divider）
- `html_first.typography` 的 weight/size/line_height/color 必须逐字段匹配 `HTML_TYPOGRAPHY_SPEC`
- `html_first.spacing` 必须 byte-level 匹配 `HTML_SPACING_SPEC`
- `html_first.components` 必须 byte-level 匹配 `HTML_COMPONENTS_SPEC`（包括 chart.series
  必须是 4 元素数组）
- `forbidden` 数组不超过 16 项，每项 ≤100 graphemes
- `html_first.image_language.avoid` 必须等于字符串 `"forbidden"`

任一不匹配即抛 `VisualConfigError`，错误信息只给第一个不匹配的字段名，不给期望值。
调试需反复读框架源码 + 逐字段对比 preset 文件。

## 根因
`parseHtmlVisualConfig` 对 typography/spacing/components 使用 strict equality（`JSON.stringify`
比较 + 逐字段 `===` 比对），但这些值是框架内部 spec 常量，deck 作者不应该需要手工复制。
缺少 `migrate-legacy-palette` 或 `init-html-first-palette` 工具。

## 复现
1. 取任意 legacy deck 的 color_palette.json（无 html_first）
2. 尝试手工添加 html_first 段
3. 反复遇到 schema version 不匹配 → 逐步修正 → 下一个字段又不匹配

## 修复关联
已由 OpenSpec change `complete-markerless-html-migration` 修复并归档。
- 提供 `ppt_flow migrate-palette` 命令，基于最接近的 preset 生成 html_first 段
- 或提供 `ppt_flow init-palette --preset warm-editorial` 保留旧字段但覆盖 html_first
- `VisualConfigError` 应输出期望值 vs 实际值的 diff
