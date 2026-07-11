## 1. Playbook + methodology

- [ ] 1.1 Create `playbook/migrate-import.md` per design D3/D8.2 (six nodes; early-show; reaffirm-gates dual-write; no silent long runs)
- [ ] 1.2 Create `workflow/00-setup/04-migrate-import-existing-deck.md` per D8.3; link from `workflow/00-setup/README.md`
- [ ] 1.3 Insert COMMANDS「旁路 / 迁移」from D8.1 (after 探索 or before 迭代——保持旁路独立段)
- [ ] 1.4 BOOTSTRAP one-liner pointer to migrate-import / COMMANDS 旁路段

## 2. Verify

- [ ] 2.1 Grep: migrate intents not only documented in version-log; playbook count mentions updated if any in-framework docs list controllers
- [ ] 2.2 `npm test` green (doc-only; e2e optional)
- [ ] 2.3 Confirm Acceptance; archive later syncs `playbook-execution` (Purpose + eight controllers + migrate req)
- [ ] 2.4 Update `_backlog/plans/README.md` Change 2 row → proposed/active under openspec/changes
