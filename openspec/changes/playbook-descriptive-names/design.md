## Context

当前 playbook 文件名用内部术语 (`chain-a/b/c`), 人类不可读. 改名匹配自然语言触发词.

## Decisions

### 1. 新命名

| 旧名 | 新名 | 人类理解为 |
|------|------|-----------|
| `chain-a.md` | `edit-text.md` | edit text——改标题/kicker/subtitle |
| `chain-b.md` | `edit-visual.md` | edit visual——换图/换配色/改布局 |
| `chain-c.md` | `edit-notes.md` | edit notes——改备注 |
| `structural.md` | `restructure-slides.md` | restructure slides——加页/删页/重排 |
| `full-creation.md` | `create-deck.md` | create deck——从零开始做一个PPT |

`classify-change.md` 保持——已是 verb-noun, 内部 shared node.

全部动词+名词: edit/restructure/create/classify + text/visual/notes/slides/deck/change.

### 2. Frontmatter 加 description

```yaml
---
playbook: edit-text
description: 文本修改——改标题/kicker/subtitle, ~5 min
includes: [classify-change]
---
```

### 3. 执行

全部用 `git mv` 保留历史.

```bash
git mv playbook/chain-a.md playbook/edit-text.md
git mv playbook/chain-b.md playbook/edit-visual.md
git mv playbook/chain-c.md playbook/edit-notes.md
git mv playbook/structural.md playbook/restructure-slides.md
git mv playbook/full-creation.md playbook/create-deck.md
```

sed 替换所有 `.md` 文件中的旧名→新名引用.
