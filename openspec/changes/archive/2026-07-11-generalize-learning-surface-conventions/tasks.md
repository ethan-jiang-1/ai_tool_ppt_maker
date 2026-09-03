## 1. Framework：`_lessons/` + 宪法闭环

- [x] 1.1 `bundle_layout.mjs`：`LESSONS_DIR` / `LESSONS_DIR_README` / `LESSONS_IMAGE2_PROVEN`；删除 `LEARNING_*`；init/树/selfCheck/deck README 模板
- [x] 1.2 `CONSTITUTION.md`：独立章节「自留教训面 `_lessons/`」+ 树快照改名与旁注
- [x] 1.3 `template-deck-guide.md`、`AGENTS.md`、`state.mjs` README 指针：`_learning` → `_lessons`
- [x] 1.4 扫清 Framework 内残留 `_learning/` 规范引用（注释/文档）

## 2. Image2 SSOT

- [x] 2.1 `03-tool-selection.md`：落点 `_lessons/image2-proven.yaml`；服从 README 规矩；目录非 Image2 专用
- [x] 2.2 `BOOTSTRAP.md`：先读 `_lessons/`；proven 为一例

## 3. Deck 迁移 + 测试

- [x] 3.1 `deck_ai_sdlc_bpm_keynote`：`_learning/` → `_lessons/`；README = `LESSONS_DIR_README`
- [x] 3.2 测试断言改 `_lessons` + 规矩/闭环句；`npm test`
- [x] 3.3 archive 时 sync：`run-bundle-management`、`framework-charter`、`image-generation`
