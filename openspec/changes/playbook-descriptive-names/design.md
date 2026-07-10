## Context

当前 playbook 文件名用内部术语 (`chain-a/b/c`), 人类不可读. 改名匹配自然语言触发词.

## Decisions

### 1. 新命名

| 旧名 | 新名 | 人类理解为 |
|------|------|-----------|
| `chain-a.md` | `edit-text.md` | Edit Text——改标题/kicker/subtitle |
| `chain-b.md` | `edit-visual.md` | Edit Visual——换图/换配色/改布局 |
| `chain-c.md` | `edit-notes.md` | Edit Notes——改备注 |
| `structural.md` | `restructure.md` | Restructure——加页/删页/重排 |

`full-creation.md` 和 `classify-change.md` 保持——前者已是人类可读, 后者是内部 shared node.

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
git mv playbook/structural.md playbook/restructure.md
```

sed 替换所有 `.md` 文件中的旧名→新名引用.
