## 1. 重命名 playbook 文件

- [x] 1.1 `git mv playbook/chain-a.md playbook/edit-text.md`
- [x] 1.2 `git mv playbook/chain-b.md playbook/edit-visual.md`
- [x] 1.3 `git mv playbook/chain-c.md playbook/edit-notes.md`
- [x] 1.4 `git mv playbook/structural.md playbook/restructure-slides.md`
- [x] 1.5 `git mv playbook/full-creation.md playbook/create-deck.md`

## 2. 更新 frontmatter 和内部引用

- [x] 2.1 每个 playbook frontmatter: `playbook:` 字段更新为新名, 加 `description:` 字段
- [x] 2.2 所有 `includes: [classify-change]` 保持 (shared node 名不变)
- [x] 2.3 COMMANDS.md 路由表: 文件名引用更新 (chain-a→edit-text 等)

## 3. 更新 spec 和配置

- [x] 3.1 `openspec/specs/playbook-execution/spec.md`: 文件名 + requirement 更新
- [x] 3.2 `charter/NODE-SPEC.md`: 如有文件名引用, 更新

## 4. 验证

- [x] 4.1 `grep -r "chain-a\|chain-b\|chain-c\|structural\.md" PPTMAKER_FRAMEWORK/` 零残留 (VERSION_LOG 除外)
- [x] 4.2 `ls playbook/` 显示 6 个文件 (5 playbooks + 1 shared)
- [x] 4.3 `npm test` 全部通过
