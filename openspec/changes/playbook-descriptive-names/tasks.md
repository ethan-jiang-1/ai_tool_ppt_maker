## 1. 重命名 playbook 文件

- [ ] 1.1 `git mv playbook/chain-a.md playbook/edit-text.md`
- [ ] 1.2 `git mv playbook/chain-b.md playbook/edit-visual.md`
- [ ] 1.3 `git mv playbook/chain-c.md playbook/edit-notes.md`
- [ ] 1.4 `git mv playbook/structural.md playbook/restructure.md`

## 2. 更新 frontmatter 和内部引用

- [ ] 2.1 每个 playbook frontmatter: `playbook:` 字段更新为新名, 加 `description:` 字段
- [ ] 2.2 所有 `includes: [classify-change]` 保持 (shared node 名不变)
- [ ] 2.3 COMMANDS.md 路由表: 文件名引用更新 (chain-a→edit-text 等)

## 3. 更新 spec 和配置

- [ ] 3.1 `openspec/specs/playbook-execution/spec.md`: 文件名 + requirement 更新
- [ ] 3.2 `charter/NODE-SPEC.md`: 如有文件名引用, 更新

## 4. 验证

- [ ] 4.1 `grep -r "chain-a\|chain-b\|chain-c\|structural\.md" PPTMAKER_FRAMEWORK/` 零残留 (VERSION_LOG 除外)
- [ ] 4.2 `ls playbook/` 显示 6 个文件 (5 playbooks + 1 shared)
- [ ] 4.3 `npm test` 全部通过
