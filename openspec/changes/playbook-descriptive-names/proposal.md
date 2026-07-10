## Why

`chain-a.md`/`chain-b.md`/`chain-c.md` 是框架内部术语——人类打开 `playbook/` 目录完全看不懂这些文件是干什么的。用户从来不说"帮我跑个 Chain A"。命名应该匹配 COMMANDS.md 路由表中的自然语言触发词：用户说"改标题"→对应 `edit-text`，用户说"换配色"→对应 `edit-visual`。

## What Changes

- `chain-a.md` → `edit-text.md`
- `chain-b.md` → `edit-visual.md`
- `chain-c.md` → `edit-notes.md`
- `structural.md` → `restructure-slides.md`
- `full-creation.md` → `create-deck.md`
- 每个 playbook frontmatter 加 `description` 字段
- COMMANDS.md 路由表更新文件名引用
- `openspec/specs/playbook-execution/` 更新文件名引用
- 所有 `includes` 引用和 playbook frontmatter 同步更新

## Capabilities

### Modified Capabilities

- `playbook-execution`: playbook 文件名变更, frontmatter 加 description

## Impact

| 影响面 | 说明 |
|--------|------|
| `playbook/` | 4 个文件 `git mv` 改名 |
| 每个 playbook frontmatter | 加 `description` |
| `COMMANDS.md` | 路由表文件名更新 |
| `openspec/specs/playbook-execution/` | spec 中的文件名引用更新 |
