# BUG-026: slide heading 解析器将 "## Slide Specifications" 等 section header 匹配为 slide

> 严重级别: P2 | 发现: 2026-07-21 | 状态: 活跃

## 症状
v1 slide-specifications.md 中有 `## Slide Specifications（每页四层规格）` 作为文档 section
header。Stage 1 解析器将其匹配为 slide heading，报错：
```
malformed slide heading at line 48; expected ## Slide NN: `slide_id`
```

## 根因
`parseHtmlFirstSource` / legacy parser 对所有 `## Slide` 前缀的行进行 slide heading 匹配，
没有区分 "## Slide NN: `id`"（真正的 slide）和 "## Slide Specifications"（文档标题）。

## 复现
1. 在 slide-specifications.md 中写 `## Slide Specifications` 或 `## Slide Map` 作为文档标题
2. 运行 validate 或 pilot
3. 报 malformed slide heading

## 修复关联
- 严格匹配 `## Slide \d+:` 格式（slide heading 必须包含数字编号）
- 或在 frontmatter 之后、第一个 `## Slide \d+:` 之前的内容视为 preamble，不解析为 slide
