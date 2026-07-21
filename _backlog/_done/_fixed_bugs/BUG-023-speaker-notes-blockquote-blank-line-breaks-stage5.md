# BUG-023: SPEAKER NOTE 中 blockquote 空行导致 Stage 5 解析失败

> 严重级别: P2 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
Stage 5（notes injection）对所有 25 页报 "speaker note content is missing"。
原因是 html-first 产出的 SPEAKER NOTE 格式为：
```
> **SPEAKER NOTE**
>
> **Narrative flow:**
```

正则 `/> \*\*SPEAKER NOTE\*\*\s*\r?\n((?:> .+(?:\r?\n|$))+)/m` 期望 `> **SPEAKER NOTE**` 后
紧接 `> content` 行，但空行 `>\n` 打断了匹配。

## 根因
notes_injection.mjs 的 Format A 正则要求 note header 后的每一行都以 `> .+` 开头
（blockquote + 至少一个非空白字符）。纯空行 `>` 不满足 `.+`，导致整个 block 匹配失败。

## 复现
1. 写 slide-specifications.md，SPEAKER NOTE 使用 blockquote 多行格式
2. 在 `> **SPEAKER NOTE**` 和第一条 `> **Narrative flow:**` 之间有空行
3. `ppt_flow build` → Stage 5 报 "speaker note content is missing"

## 修复关联
已由 OpenSpec change `make-html-production-guided-and-recoverable` 修复并归档。
- 正则改为允许空行：`((?:> .*(?:\r?\n|$))+)`（`.*` 代替 `.+`）
- 或支持 `> **SPEAKER NOTE**\n>\n> content` 格式
